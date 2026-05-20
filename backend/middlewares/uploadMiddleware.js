import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const evidenceDir = path.join(__dirname, '..', 'uploads', 'evidence');

fs.mkdirSync(evidenceDir, { recursive: true });

const allowedMimeTypes = new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
    'video/mp4',
    'video/quicktime',
]);

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, evidenceDir);
    },
    filename: (req, file, cb) => {
        const extension = path.extname(file.originalname).toLowerCase();
        const safeName = path
            .basename(file.originalname, extension)
            .replace(/[^a-z0-9]/gi, '-')
            .replace(/-+/g, '-')
            .toLowerCase()
            .slice(0, 40);

        cb(null, `${Date.now()}-${safeName || 'evidence'}${extension}`);
    },
});

const fileFilter = (req, file, cb) => {
    if (allowedMimeTypes.has(file.mimetype)) {
        cb(null, true);
        return;
    }

    cb(new Error('Unsupported evidence file type. Upload JPG, PNG, WEBP, PDF, MP4, or MOV files only.'));
};

export const uploadEvidence = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 50 * 1024 * 1024,
        files: 5,
    },
});

export const uploadEvidenceFiles = (req, res, next) => {
    uploadEvidence.array('evidence', 5)(req, res, (error) => {
        if (!error) {
            return next();
        }

        if (error instanceof multer.MulterError) {
            if (error.code === 'LIMIT_FILE_SIZE') {
                res.status(400);
                return next(new Error('Each evidence file must be 50MB or smaller.'));
            }

            if (error.code === 'LIMIT_FILE_COUNT') {
                res.status(400);
                return next(new Error('You can upload a maximum of 5 evidence files.'));
            }
        }

        res.status(400);
        return next(error);
    });
};
