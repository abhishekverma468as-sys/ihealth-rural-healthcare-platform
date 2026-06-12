# iHealth — IoT Rural Healthcare Platform

iHealth is a production-ready IoT-enabled platform designed to bridge the gap in rural healthcare. It provides real-time health monitoring for patients using IoT sensors and an advanced dashboard for doctors to monitor emergencies and manage treatments.

## 🚀 Features
- **Real-time Monitoring**: Heart rate, SpO2, and Temperature via WebSockets.
- **Emergency Alerts**: Instant notifications for doctors when vitals go into "Red" status.
- **Digital Prescriptions**: Fast prescription creation and management.
- **Health History**: Detailed historical reports with PDF export capability.
- **Responsive Design**: Dark mode support and mobile-first UI for clinical use.

---

## 🛠️ Tech Stack
- **Frontend**: Vite, React, TailwindCSS, Framer Motion, Recharts, Lucide Icons.
- **Backend**: Django, Django Rest Framework, Django Channels (WebSockets), Daphne.
- **Deployment**: Render (Backend), Vercel (Frontend), Supabase/PostgreSQL (Database).

---

## 💻 Local Setup

### 1. Prerequisites
- Python 3.10+
- Node.js 18+
- Git

### 2. Unified Runner (Recommended)
You can start both frontend and backend with a single command from the root folder:
```bash
npm run dev
```

### 3. Manual Setup

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

---

## 📊 API Reference

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/auth/register/patient/` | POST | Register a new patient account |
| `/api/auth/login/` | POST | Login and receive JWT tokens |
| `/api/doctors/dashboard/` | GET | Doctor dashboard stats & overview |
| `/api/doctors/alerts/emergency/` | GET | Active emergency alert queue |
| `/api/doctors/prescriptions/` | POST | Send a new prescription to a patient |
| `/api/patients/dashboard/` | GET | Patient dashboard vitals & history |
| `/api/health-records/` | POST | Ingest IoT sensor data (vitals) |

---

## 🧪 Test Accounts
| Role | Email | Password |
| :--- | :--- | :--- |
| **Doctor** | `dr.sharma@ihealth.com` | `password123` |
| **Patient** | `abhishekverma468as@gmail.com` | `password123` |

---

## 🌍 Deployment Guide

### **Backend (Render.com)**
1. Connect your GitHub repo.
2. Set **Root Directory** to `backend`.
3. **Build Command**: `pip install -r requirements.txt && python manage.py migrate && python manage.py collectstatic --noinput`
4. **Start Command**: `daphne ihealth_project.asgi:application --port $PORT --bind 0.0.0.0`
5. **Environment Variables**:
   - `SECRET_KEY`: (random string)
   - `DATABASE_URL`: (from Supabase/PostgreSQL)
   - `DEBUG`: `False`
   - `FRONTEND_URL`: `https://your-app.vercel.app`

### **Frontend (Vercel.com)**
1. Connect your GitHub repo.
2. Set **Root Directory** to `frontend`.
3. **Build Command**: `npm run build`
4. **Output Directory**: `dist`
5. **Environment Variables**:
   - `VITE_API_URL`: `https://your-backend.onrender.com`
   - `VITE_WS_URL`: `wss://your-backend.onrender.com`

---

## 📜 License
iHealth is open-source software licensed under the MIT License.
