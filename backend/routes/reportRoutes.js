import express from 'express';
import { createReport, getMyReports, getAllReports, updateReportStatus, downloadReportReceipt, assignReportOfficer } from '../controllers/reportController.js';
import { protect, verifiedOnly, admin } from '../middlewares/authMiddleware.js';
import { uploadEvidenceFiles } from '../middlewares/uploadMiddleware.js';
const router = express.Router();

// User routes
router.post('/', protect, verifiedOnly, uploadEvidenceFiles, createReport);
router.get('/myreports', protect, getMyReports);
router.get('/:id/receipt', protect, downloadReportReceipt);

// Admin routes 
router.get('/', protect, admin, getAllReports);
router.put('/:id/status', protect, admin, updateReportStatus);
router.put('/:id/assign', protect, admin, assignReportOfficer);
export default router;
