# Online Crime Reporting System

A MERN-based crime complaint management platform where citizens can file reports online, upload evidence, track case progress, and download PDF receipts. Admin users can review reports, update statuses, assign officers, view analytics, and inspect crime locations on an India-focused heatmap.

## Features

- Citizen registration and JWT login
- Email OTP verification
- Forgot password and reset password flow
- Role-based access for citizens and admins
- Report filing with category, severity, location, coordinates, and evidence upload
- PDF report receipt download with case details, timestamp, evidence list, and status
- Citizen dashboard with case summary cards, case detail view, status history, and timeline
- Admin dashboard with report management, analytics, category/status/severity charts, and filters
- India crime heatmap using Leaflet and heatmap layers
- Officer assignment with name, badge ID, police station, and contact number
- Render-ready deployment blueprint

## Tech Stack

**Frontend**
- React 19
- Vite
- React Router
- Recharts
- Leaflet and leaflet.heat
- Framer Motion
- React Hot Toast

**Backend**
- Node.js
- Express
- MongoDB Atlas with Mongoose
- JWT authentication
- Multer evidence upload
- Nodemailer email delivery
- PDFKit report receipt generation

## Project Structure

```text
online-crime-reporting-system/
├── backend/                 # Express API, MongoDB models, routes, uploads
├── frontend/                # React/Vite citizen and admin portal
├── documentation/           # Project reports, diagrams, screenshots, generated docs
├── render.yaml              # Render deployment blueprint
└── README.md
```

## Local Setup

### Prerequisites

- Node.js 20 or newer recommended
- npm
- MongoDB Atlas database URI
- Gmail App Password or SMTP credentials for OTP/reset emails

### Backend

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
PORT=5001
MONGO_URI=your_mongodb_atlas_uri
JWT_SECRET=your_long_random_secret
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password
EMAIL_ENABLED=true
FRONTEND_URL=http://localhost:5173
```

Start the API:

```bash
npm run dev
```

Backend runs at:

```text
http://localhost:5001
```

### Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:5001/api
```

Start the frontend:

```bash
npm run dev
```

Frontend runs at:

```text
http://localhost:5173
```

## Environment Safety

Do not commit real `.env` files, database URIs, JWT secrets, Gmail passwords, SMTP passwords, or uploaded evidence. The repository ignores local environment files and upload contents by default.

Use Gmail App Passwords for `EMAIL_PASS`; normal Gmail account passwords usually fail.

For local testing without sending emails, set:

```env
EMAIL_ENABLED=false
```

## API Overview

Base URL:

```text
/api
```

### Auth

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/auth/register` | Register a citizen/admin account |
| POST | `/auth/login` | Login and receive JWT |
| GET | `/auth/profile` | Get current user profile |
| POST | `/auth/request-otp` | Send email verification OTP |
| POST | `/auth/verify-otp` | Verify email OTP |
| POST | `/auth/forgot-password` | Send password reset OTP |
| POST | `/auth/reset-password` | Reset password using OTP |

### Reports

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| POST | `/reports` | Verified citizen | File report with optional evidence |
| GET | `/reports/myreports` | Citizen | View own reports |
| GET | `/reports/:id/receipt` | Citizen/Admin | Download PDF receipt |
| GET | `/reports` | Admin | View all reports |
| PUT | `/reports/:id/status` | Admin | Update report status |
| PUT | `/reports/:id/assign` | Admin | Assign case to officer |

## Evidence Uploads

Reports support up to 5 evidence files. Supported types include common images, PDF files, and video formats. Uploaded files are stored under `backend/uploads/evidence` locally and served through the backend `/uploads` path.

## Render Deployment

This repository includes `render.yaml` with two services:

- `online-crime-reporting-api` from `backend/`
- `online-crime-reporting-web` from `frontend/`

Set these Render environment variables:

**Backend**

```env
NODE_ENV=production
MONGO_URI=your_mongodb_atlas_uri
JWT_SECRET=generated_or_manual_secret
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password
EMAIL_ENABLED=true
FRONTEND_URL=https://your-frontend-service.onrender.com
```

**Frontend**

```env
VITE_API_URL=https://your-backend-service.onrender.com/api
```

## Common Troubleshooting

**Forgot password returns 503**

Email delivery is not configured correctly. Check `EMAIL_USER` and `EMAIL_PASS` on the backend service. For Gmail, use an App Password.

If you only want to test report filing/status updates locally, set `EMAIL_ENABLED=false` in `backend/.env`.

**Frontend cannot connect to backend**

Check `VITE_API_URL` in `frontend/.env` or Render frontend environment variables. It must include `/api`.

**CORS blocked**

Set backend `FRONTEND_URL` to the exact frontend origin, without a trailing slash.

**Evidence upload fails**

Confirm the file type is allowed and the file count is 5 or fewer.

**Map or heatmap does not show**

Check browser network access to OpenStreetMap/CARTO tile services and confirm reports have coordinates or fallback demo locations.

## Useful Commands

```bash
# Backend
cd backend
npm run dev
npm start

# Frontend
cd frontend
npm run dev
npm run build
npm run preview
```

## Documentation

Project reports, figures, diagrams, screenshots, and generated review files are stored in:

```text
documentation/
```
