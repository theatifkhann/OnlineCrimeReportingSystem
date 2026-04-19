import express from 'express';
import {
    registerUser,
    loginUser,
    requestEmailVerification,
    verifyEmailOTP,
    forgotPassword,
    resetPassword
} from '../controllers/authController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Standard Authentication
router.post('/register', registerUser);
router.post('/login', loginUser);

// Protected Profile Route
router.get('/profile', protect, (req, res) => {
    res.json(req.user);
});

// Email OTP Verification Routes
router.post('/request-otp', protect, requestEmailVerification);
router.post('/verify-otp', protect, verifyEmailOTP);

// --- NEW: Password Recovery Routes ---
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

export default router;