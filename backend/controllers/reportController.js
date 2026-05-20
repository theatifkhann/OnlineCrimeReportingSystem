import asyncHandler from 'express-async-handler';
import fs from 'fs/promises';
import PDFDocument from 'pdfkit';
import Report from '../models/Report.js';
import sendEmail from '../utils/sendEmail.js'; // <-- NEW: Import the email utility

const allowedCategories = new Set(['theft', 'cybercrime', 'fraud', 'harassment', 'assault', 'missing_person', 'other']);
const allowedSeverities = new Set(['low', 'medium', 'high', 'critical']);

const formatLabel = (value = '') => {
    return value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()) || 'N/A';
};

const formatDate = (date) => {
    return new Intl.DateTimeFormat('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'Asia/Kolkata',
    }).format(new Date(date));
};

const cleanupUploadedEvidence = async (files = []) => {
    await Promise.allSettled(
        files
            .filter((file) => file.path)
            .map((file) => fs.unlink(file.path))
    );
};

const rejectCreateReport = async (req, res, statusCode, message) => {
    await cleanupUploadedEvidence(req.files);
    res.status(statusCode);
    throw new Error(message);
};

// @desc    Create a new crime report
// @route   POST /api/reports
// @access  Private (User)
export const createReport = asyncHandler(async (req, res) => {
    const { title, description, location, category = 'other', severity = 'medium', lat, lng } = req.body;

    if (!title || !description || !location) {
        await rejectCreateReport(req, res, 400, 'Please fill in all fields');
    }

    if (!allowedCategories.has(category)) {
        await rejectCreateReport(req, res, 400, 'Invalid report category');
    }

    if (!allowedSeverities.has(severity)) {
        await rejectCreateReport(req, res, 400, 'Invalid report severity');
    }

    const latitude = lat !== undefined && lat !== '' ? Number(lat) : undefined;
    const longitude = lng !== undefined && lng !== '' ? Number(lng) : undefined;

    if ((latitude !== undefined || longitude !== undefined) && (
        Number.isNaN(latitude) ||
        Number.isNaN(longitude) ||
        latitude < -90 ||
        latitude > 90 ||
        longitude < -180 ||
        longitude > 180
    )) {
        await rejectCreateReport(req, res, 400, 'Invalid report coordinates');
    }

    const evidence = (req.files || []).map((file) => ({
        filename: file.filename,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        url: `/uploads/evidence/${file.filename}`,
    }));

    const report = await Report.create({
        user: req.user._id,
        title,
        description,
        location,
        coordinates: latitude !== undefined && longitude !== undefined ? { lat: latitude, lng: longitude } : undefined,
        category,
        severity,
        evidence,
        statusHistory: [
            {
                status: 'pending',
                note: 'Complaint filed by citizen',
                changedBy: req.user._id,
                changedByName: req.user.name,
            },
        ],
    });

    res.status(201).json(report);
});

// @desc    Get user's own reports
// @route   GET /api/reports/myreports
// @access  Private (User)
export const getMyReports = asyncHandler(async (req, res) => {
    const reports = await Report.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(reports);
});

// @desc    Get all reports
// @route   GET /api/reports
// @access  Private/Admin
export const getAllReports = asyncHandler(async (req, res) => {
    // Populate fills in the user data linked to the report object ID
    const reports = await Report.find({}).populate('user', 'name email').sort({ createdAt: -1 });
    res.json(reports);
});

// @desc    Update report status
// @route   PUT /api/reports/:id/status
// @access  Private/Admin
export const updateReportStatus = asyncHandler(async (req, res) => {
    const { status, note } = req.body;

    // FIX: Added .populate() to fetch the user's name and email so we know where to send the alert
    const report = await Report.findById(req.params.id).populate('user', 'name email');

    if (!report) {
        res.status(404);
        throw new Error('Report not found');
    }

    // Update and save in Database
    report.status = status;
    report.statusHistory.push({
        status,
        note: note || `Case status updated to ${formatLabel(status)}`,
        changedBy: req.user._id,
        changedByName: req.user.name,
    });
    const updatedReport = await report.save();

    // NEW: Send the Automated Email Notification
    try {
        const caseId = report._id.toString().substring(0, 8).toUpperCase();

        // Formatted to sound like an official system alert
        const message = `CITIZEN ALERT: CASE STATUS UPDATE
----------------------------------------
Case ID: ${caseId}
Incident: ${report.title}
Location: ${report.location}
----------------------------------------

Dear ${report.user.name},

Be advised that the status of your filed report has been officially updated in the system database.

NEW STATUS: ${status.toUpperCase()}

If you require further assistance, please log in to your Citizen Dashboard at the Police Portal.

// END OF TRANSMISSION //
Automated Crime Reporting Management System (CRMS)`;

        await sendEmail({
            email: report.user.email,
            subject: `CRMS ALERT: Update on Case #${caseId}`,
            message: message
        });

        console.log(`Notification email sent to ${report.user.email}`);
    } catch (error) {
        console.error('Failed to send email notification:', error);
        // It won't crash the server if the email fails, the DB will still update!
    }

    res.json(updatedReport);
});

// @desc    Assign report to an officer
// @route   PUT /api/reports/:id/assign
// @access  Private/Admin
export const assignReportOfficer = asyncHandler(async (req, res) => {
    const { name, badgeId, policeStation, contactNumber } = req.body;

    if (!name || !badgeId || !policeStation || !contactNumber) {
        res.status(400);
        throw new Error('Please provide officer name, badge ID, police station, and contact number');
    }

    const report = await Report.findById(req.params.id);

    if (!report) {
        res.status(404);
        throw new Error('Report not found');
    }

    report.assignedOfficer = {
        name,
        badgeId,
        policeStation,
        contactNumber,
        assignedBy: req.user._id,
        assignedByName: req.user.name,
        assignedAt: new Date(),
    };

    const updatedReport = await report.save();
    res.json(updatedReport);
});

// @desc    Download complaint receipt as PDF
// @route   GET /api/reports/:id/receipt
// @access  Private (Owner/Admin)
export const downloadReportReceipt = asyncHandler(async (req, res) => {
    const report = await Report.findById(req.params.id).populate('user', 'name email role');

    if (!report) {
        res.status(404);
        throw new Error('Report not found');
    }

    const isOwner = report.user._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
        res.status(403);
        throw new Error('Not authorized to download this receipt');
    }

    const caseId = `CRMS-${report.createdAt.getFullYear()}-${report._id.toString().substring(0, 8).toUpperCase()}`;
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${caseId}-receipt.pdf"`);

    doc.pipe(res);

    doc
        .fontSize(20)
        .text('Online Crime Reporting System', { align: 'center' })
        .moveDown(0.3)
        .fontSize(13)
        .fillColor('#444')
        .text('Complaint Filing Receipt', { align: 'center' })
        .moveDown(1.5);

    doc
        .fillColor('#000')
        .fontSize(11)
        .text(`Case ID: ${caseId}`)
        .text(`Generated On: ${formatDate(new Date())}`)
        .text(`Current Status: ${formatLabel(report.status)}`)
        .moveDown(1);

    doc
        .fontSize(14)
        .text('Complainant Details', { underline: true })
        .moveDown(0.4)
        .fontSize(11)
        .text(`Name: ${report.user.name}`)
        .text(`Email: ${report.user.email}`)
        .moveDown(1);

    doc
        .fontSize(14)
        .text('Complaint Details', { underline: true })
        .moveDown(0.4)
        .fontSize(11)
        .text(`Title: ${report.title}`)
        .text(`Category: ${formatLabel(report.category)}`)
        .text(`Severity: ${formatLabel(report.severity)}`)
        .text(`Location: ${report.location}`)
        .text(`Assigned Officer: ${report.assignedOfficer?.name || 'Not assigned'}`)
        .text(`Police Station: ${report.assignedOfficer?.policeStation || 'Not assigned'}`)
        .text(`Filed At: ${formatDate(report.createdAt)}`)
        .moveDown(0.8)
        .fontSize(12)
        .text('Description:', { continued: false })
        .moveDown(0.2)
        .fontSize(11)
        .text(report.description, { align: 'left' })
        .moveDown(1);

    doc
        .fontSize(14)
        .text('Evidence List', { underline: true })
        .moveDown(0.4)
        .fontSize(11);

    if (report.evidence?.length) {
        report.evidence.forEach((item, index) => {
            doc.text(`${index + 1}. ${item.originalName} (${item.mimetype}, ${Math.ceil(item.size / 1024)} KB)`);
        });
    } else {
        doc.text('No evidence files attached.');
    }

    doc
        .moveDown(1.5)
        .fontSize(10)
        .fillColor('#555')
        .text('This receipt confirms that the complaint has been filed in the Crime Reporting Management System. Please preserve the Case ID for future reference.', {
            align: 'left',
        });

    doc.end();
});
