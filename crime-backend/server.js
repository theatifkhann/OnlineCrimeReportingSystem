import express from 'express';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import { errorHandler } from './middlewares/errorMiddleware.js';

// Route Imports
import authRoutes from './routes/authRoutes.js';
import reportRoutes from './routes/reportRoutes.js';

// 1. Load env variables
dotenv.config();

// 2. Connect to MongoDB
connectDB();

const app = express();

// 3. Development CORS
// Allow the deployed frontend via FRONTEND_URL and local Vite origins in development.
app.use((req, res, next) => {
    const origin = req.headers.origin;
    const configuredFrontendUrl = process.env.FRONTEND_URL?.replace(/\/$/, '');
    const isLocalOrigin = origin && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
    const isConfiguredOrigin = origin && configuredFrontendUrl && origin.replace(/\/$/, '') === configuredFrontendUrl;
    const isRenderOrigin = origin && /^https:\/\/[a-z0-9-]+\.onrender\.com$/i.test(origin);

    if (isConfiguredOrigin || isLocalOrigin || isRenderOrigin) {
        res.header('Access-Control-Allow-Origin', origin);
        res.header('Vary', 'Origin');
    } else if (!origin) {
        res.header('Access-Control-Allow-Origin', '*');
    } else if (configuredFrontendUrl) {
        return res.status(403).json({ message: `CORS blocked for origin: ${origin}` });
    } else {
        res.header('Access-Control-Allow-Origin', origin);
        res.header('Vary', 'Origin');
    }

    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');

    if (req.method === 'OPTIONS') {
        return res.sendStatus(204);
    }

    next();
});

// 4. Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// 5. Routes
app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);

// 6. Basic Route for testing in Browser
app.get('/', (req, res) => {
    res.send("API is running locally...");
});

// 7. Error Handler (Must be after routes)
app.use(errorHandler);

// 8. Port Setup
const PORT = process.env.PORT || 5001;

// 9. Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server started on http://localhost:${PORT}`);
});
