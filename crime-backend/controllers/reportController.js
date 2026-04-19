import asyncHandler from 'express-async-handler';
import Report from '../models/Report.js';
import sendEmail from '../utils/sendEmail.js'; // <-- NEW: Import the email utility

// @desc    Create a new crime report
// @route   POST /api/reports
// @access  Private (User)
export const createReport = asyncHandler(async (req, res) => {
    const { title, description, location } = req.body;

    if (!title || !description || !location) {
        res.status(400);
        throw new Error('Please fill in all fields');
    }

    const report = await Report.create({
        user: req.user._id,
        title,
        description,
        location,
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
    const { status } = req.body;

    // FIX: Added .populate() to fetch the user's name and email so we know where to send the alert
    const report = await Report.findById(req.params.id).populate('user', 'name email');

    if (!report) {
        res.status(404);
        throw new Error('Report not found');
    }

    // Update and save in Database
    report.status = status;
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