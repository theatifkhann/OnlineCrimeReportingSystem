import express from 'express';
import { createReport, getMyReports, getAllReports, updateReportStatus } from '../controllers/reportController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { verifiedOnly } from '../middlewares/authMiddleware.js';
const router = express.Router();

// User routes
router.post('/', protect, createReport);
router.get('/myreports', protect, getMyReports);

// Admin routes 
router.get('/', protect, getAllReports);
router.put('/:id/status', protect, updateReportStatus);
router.post('/', protect, verifiedOnly, createReport);
export default router;