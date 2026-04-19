import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User'
        },
        title: { type: String, required: true },
        description: { type: String, required: true },
        location: { type: String, required: true },
        status: {
            type: String,

            enum: ['pending', 'approved', 'rejected', 'solved'],
            default: 'pending',
        },
    },
    { timestamps: true }
);

export default mongoose.model('Report', reportSchema);