import asyncHandler from 'express-async-handler';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import dns from 'dns/promises';
import Otp from '../models/Otp.js';
import sendEmail from '../utils/sendEmail.js';

// --- HELPER FUNCTIONS ---
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

const isValidEmailFormat = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
};

const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// ================= REGISTER =================
export const registerUser = asyncHandler(async (req, res) => {
    try {

        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            res.status(400);
            throw new Error('Please add all fields');
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            res.status(400);
            throw new Error('User already exists');
        }


        const user = await User.create({
            name,
            email,
            password,
        });


        res.status(201).json({
            _id: user.id,
            name: user.name,
            email: user.email,
            token: generateToken(user._id),
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ================= LOGIN =================
export const loginUser = asyncHandler(async (req, res) => {

    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
        res.status(401);
        throw new Error('User not found');
    }

    if (await user.matchPassword(password)) {
        res.json({
            _id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            isEmailVerified: user.isEmailVerified,
            token: generateToken(user._id),
        });
    } else {
        res.status(401);
        throw new Error('Invalid credentials');
    }
});

// ================= REQUEST OTP =================
export const requestEmailVerification = asyncHandler(async (req, res) => {
    const email = req.user.email;

    if (!email || !isValidEmailFormat(email)) {
        res.status(400);
        throw new Error('Invalid email format.');
    }

    const otpCode = generateOTP();

    await Otp.deleteMany({ email });
    await Otp.create({ email, otp: otpCode });

    try {
        await sendEmail({
            email,
            subject: 'CRMS - Email Verification',
            message: `Your OTP is: ${otpCode}`,
        });

        res.status(200).json({ message: 'OTP sent successfully.' });
    } catch (error) {
        res.status(500);
        throw new Error('Email sending failed');
    }
});

// ================= VERIFY OTP =================
export const verifyEmailOTP = asyncHandler(async (req, res) => {
    const { otp } = req.body;
    const email = req.user.email;

    const otpRecord = await Otp.findOne({ email });

    if (!otpRecord || otpRecord.otp !== String(otp)) {
        res.status(400);
        throw new Error('Invalid or expired OTP');
    }

    const user = await User.findById(req.user._id);
    user.isEmailVerified = true;
    await user.save();

    await Otp.deleteMany({ email });

    res.status(200).json({
        message: 'Email verified successfully',
        isEmailVerified: true,
    });
});

// ================= FORGOT PASSWORD =================
export const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
        res.status(404);
        throw new Error("User not found");
    }

    const otpCode = generateOTP();

    user.resetPasswordOtp = otpCode;
    user.resetPasswordOtpExpiry = Date.now() + 15 * 60 * 1000;
    await user.save();

    try {
        await sendEmail({
            email: user.email,
            subject: 'CRMS - Password Reset',
            message: `Your reset code: ${otpCode}`,
        });

        res.status(200).json({ message: "OTP sent" });
    } catch (error) {
        res.status(500);
        throw new Error("Email failed");
    }
});

// ================= RESET PASSWORD =================
export const resetPassword = asyncHandler(async (req, res) => {
    const { email, token, newPassword } = req.body;

    const user = await User.findOne({
        email,
        resetPasswordOtp: token,
        resetPasswordOtpExpiry: { $gt: Date.now() },
    });

    if (!user) {
        res.status(400);
        throw new Error("Invalid or expired token");
    }

    user.password = newPassword; // model will hash it
    user.resetPasswordOtp = undefined;
    user.resetPasswordOtpExpiry = undefined;

    await user.save();

    res.status(200).json({ message: "Password reset successful" });
});