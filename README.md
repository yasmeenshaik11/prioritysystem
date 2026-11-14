# Civic Pulse — AI-Based Complaint Priority System

A production-grade, full-stack municipal grievance management system powered by NLP and Machine Learning. The platform automatically analyzes citizen complaints, classifies issues across 8 civic categories, predicts public hazard severity (Critical, High, Medium, Low), generates an explainable priority score (1–100), detects duplicate reports, and routes cases directly to responsible government departments.

---

## 1. System Architecture & Tech Stack

| Layer | Technologies & Libraries |
|---|---|
| **Frontend Web** | React 19, Vite, React Router v7, Axios, Recharts, React-Leaflet, Lucide Icons, Modern CSS (Navy Blue, Crisp White, Light Blue) |
| **Backend REST API** | Python 3.13, Flask 3.1, Flask-SQLAlchemy 3.1, Flask-JWT-Extended 4.7, Flask-CORS, Werkzeug |
| **Database** | MySQL 8+ with SQLAlchemy ORM (Automatic seamless fallback to persistent SQLite for local development) |
| **AI / NLP Engine** | Scikit-Learn (TF-IDF Vectorizer + Multinomial Naive Bayes / Probabilistic Classifier), Cosine Similarity, Domain Urgency Heuristics |
| **Production Deployment** | **Frontend:** Vercel (`vercel.json`) &bull; **Backend & Database:** Railway (`Procfile`, `railway.json`, `nixpacks.toml`, Gunicorn) |

---

## 2. Main Features

1. **Citizen Portal & Authentication**:
   - Secure registration and JWT-based authentication with password hashing (scrypt / pbkdf2).
   - Citizen dashboard displaying live KPI cards (Total Reported, Active Queue, Critical Urgency, Resolved).
   - Real-time notification bell with unread badge counter and interactive notification dropdown.

2. **Grievance Submission**:
   - Title, detailed description, site photo evidence upload (JPG, PNG, WEBP).
   - Interactive GPS coordinate retrieval via browser Geolocation (`navigator.geolocation`) and manual landmark/ward inputs.

3. **AI Urgency Triage & Prioritization**:
   - **8 Canonical Categories**: *Potholes, Garbage, Water Leakage, Drainage, Streetlights, Accidents, Fallen Trees, Others*.
   - **4 Severity Levels**: *Critical, High, Medium, Low*.
   - **Priority Score (1–100)**: Transparent score calculated from domain hazard keywords (fire, explosion, electrocution, collapse, hospital, school, traffic blockage, etc.) and visual evidence signals.
   - **Explainable AI (XAI)**: Generates clear, auditable reasoning for why a particular score and severity were assigned.
   - **Duplicate Detection**: Uses TF-IDF cosine similarity to flag duplicate reports in the same area to avoid redundant municipal work.

4. **Authority & Admin Command Center**:
   - Role-based access control protecting officer and admin endpoints.
   - Dynamic sorting putting the highest urgency score complaints at the top.
   - Multi-dimensional filters (Category, Priority, Status, Search by ID/keyword).
   - Quick status transition modal with mandatory audit remarks: *Submitted &rarr; Under Review &rarr; Assigned &rarr; In Progress &rarr; Resolved &rarr; Rejected*.
   - Field officer assignment to specialized departments.
   - Proof of resolution upload (site photo + completion remarks).

5. **Geospatial Map & Visual Analytics**:
   - Interactive OpenStreetMap (Leaflet) with color-coded markers (Red: Critical, Orange: High, Yellow: Medium, Green: Low).
   - Analytics charts (Recharts): Complaints by Category (Bar Chart), Priority Distribution (Donut Chart), and Resolution Rates.

6. **Audit Trail & Status History**:
   - Complete status history log recording who changed the status, old status, new status, timestamp, and official remarks.

---

## 3. Demo Credentials

The database comes pre-seeded with sample users and realistic civic complaints:

| Role | Email | Password | Access Area |
|---|---|---|---|
| **Citizen** | `citizen@emergencyai.com` | `Citizen@123` | Citizen Dashboard & Grievance Reporting |
| **Field Officer** | `officer@emergencyai.com` | `Officer@123` | Officer Command Center & Queue Management |
| **Administrator** | `admin@emergencyai.com` | `Admin@123` | Full Authority & System Administration |

---

## 4. Local Quick Start

### Option A: One-Click Launcher (Windows)
Double-click `start_system.bat` in the project root directory. It will automatically start both the backend server on `http://127.0.0.1:5000` and the Vite dev server on `http://localhost:5173`.

### Option B: Manual Terminal Execution

#### 1. Backend Setup
```powershell
cd backend

# Activate virtual environment
..\.venv\Scripts\Activate.ps1

# Install dependencies (including cryptography & gunicorn)
pip install -r requirements.txt

# Run seed script to populate sample complaints
python scripts/seed.py

# Start Flask backend
python run.py
```
*Backend runs on:* `http://127.0.0.1:5000` (Health check: `http://127.0.0.1:5000/api/health`)

#### 2. Frontend Setup
```powershell
cd frontend

# Install packages
npm install

# Start Vite dev server
npm run dev
```
*Web application runs on:* `http://localhost:5173`

---

## 5. Database Configuration

The backend is configured in `backend/app/config.py` to use `DATABASE_URL` from `backend/.env`.

- **MySQL (Default Production)**:
  ```env
  DATABASE_URL=mysql+pymysql://<user>:<password>@<host>:3306/<database_name>
  ```
- **Automatic Fallback for Local Dev**:
  If MySQL is not currently running or credentials in `.env` are invalid, the backend automatically and seamlessly initializes a persistent SQLite database (`backend/emergency_ai.db`). Zero crashes, zero downtime.

---

## 6. Production Deployment

### A. Deploy Frontend to Vercel
1. Push the repository to GitHub.
2. In Vercel, click **Add New Project** and select the repository.
3. Set **Root Directory** to `frontend`.
4. Framework Preset: **Vite**.
5. Set Environment Variable:
   - `VITE_API_URL` = `https://your-backend-railway-url.up.railway.app/api`
6. Click **Deploy**. Vercel will use `frontend/vercel.json` for SPA routing.

### B. Deploy Backend to Railway
1. In Railway, click **New Project** &rarr; **Deploy from GitHub repo**.
2. Set **Root Directory** to `backend`.
3. Add a **MySQL** database service in Railway.
4. Set Environment Variables in Railway:
   - `SECRET_KEY` = `<secure-random-key>`
   - `JWT_SECRET_KEY` = `<secure-random-key>`
   - `DATABASE_URL` = `${{MySQL.MYSQL_URL}}` (Railway's internal MySQL connection)
   - `FRONTEND_ORIGIN` = `https://your-vercel-domain.vercel.app`
5. Railway automatically uses `Procfile` and `railway.json` with Gunicorn WSGI.
6. Once deployed, run the one-time seed command via Railway CLI or Python console: `python scripts/seed.py`.

---

## 7. Automated Test Suite

A comprehensive end-to-end integration test is provided in `backend/test_api.py`:
```powershell
python backend/test_api.py
```
Validates:
- Health probe (`/api/health`)
- Citizen, Officer, and Admin authentications
- Citizen complaint submission with real-time NLP classification & urgency scoring
- Officer queue retrieval & multi-criteria filtering
- Status transitions (`Submitted` &rarr; `In Progress` &rarr; `Resolved` / `Rejected`)
- Real-time notifications and analytics endpoints
