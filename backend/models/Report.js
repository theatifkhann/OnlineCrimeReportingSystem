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
        coordinates: {
            lat: { type: Number },
            lng: { type: Number },
        },
        category: {
            type: String,
            enum: ['theft', 'cybercrime', 'fraud', 'harassment', 'assault', 'missing_person', 'other'],
            default: 'other',
        },
        severity: {
            type: String,
            enum: ['low', 'medium', 'high', 'critical'],
            default: 'medium',
        },
        evidence: [
            {
                filename: { type: String, required: true },
                originalName: { type: String, required: true },
                mimetype: { type: String, required: true },
                size: { type: Number, required: true },
                url: { type: String, required: true },
            },
        ],
        status: {
            type: String,

            enum: ['pending', 'approved', 'rejected', 'solved'],
            default: 'pending',
        },
        assignedOfficer: {
            name: { type: String },
            badgeId: { type: String },
            policeStation: { type: String },
            contactNumber: { type: String },
            assignedBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
            assignedByName: { type: String },
            assignedAt: { type: Date },
        },
        statusHistory: [
            {
                status: {
                    type: String,
                    enum: ['pending', 'approved', 'rejected', 'solved'],
                    required: true,
                },
                note: { type: String },
                changedBy: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'User',
                },
                changedByName: { type: String },
                createdAt: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],
    },
    { timestamps: true }
);

export default mongoose.model('Report', reportSchema);
