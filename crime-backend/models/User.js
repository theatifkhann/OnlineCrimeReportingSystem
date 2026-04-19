import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Please add a name']
        },
        email: {
            type: String,
            required: [true, 'Please add an email'],
            unique: true,
            match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please add a valid email']
        },
        password: {
            type: String,
            required: [true, 'Please add a password'],
            minlength: 6
        },
        role: {
            type: String,
            enum: ['user', 'admin'],
            default: 'user'
        },
        isEmailVerified: {
            type: Boolean,
            default: false
        },
        // Fields for Forgot Password Logic
        resetPasswordOtp: {
            type: String
        },
        resetPasswordOtpExpiry: {
            type: Date
        }
    },
    { timestamps: true }
);

// --- PRE-SAVE HOOK (The logic that hashes passwords) ---
userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});
// --- MATCH PASSWORD METHOD ---
userSchema.methods.matchPassword = async function (enteredPassword) {
    // Compares plain text input with the hashed password in DB
    return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model('User', userSchema);