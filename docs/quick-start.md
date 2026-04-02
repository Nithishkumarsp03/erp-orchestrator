# ⚡ Quick Start Guide

> Exact commands to run the project locally from zero to running in under 5 minutes.

## Prerequisites

Ensure you have installed:
- **Node.js 20+** → https://nodejs.org
- **PostgreSQL 16** → https://www.postgresql.org/download/
- **Redis 7** → https://redis.io/download  
  *(Windows: use WSL2 or Redis for Windows or skip — Redis is optional for dev)*

---

## Step 1: Clone & Install

```bash
git clone https://github.com/your-org/student-dashboard.git
cd student-dashboard
```

---

## Step 2: Backend

```bash
cd backend

# Install dependencies
npm install

# Copy and edit env file
cp .env.example .env
```

Edit `backend/.env`:
```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/student_dashboard"
JWT_ACCESS_SECRET="any-long-random-string-at-least-64-chars"
JWT_REFRESH_SECRET="different-long-random-string-at-least-64-chars"
```

```bash
# Create the database (PostgreSQL must be running)
npx prisma migrate dev --name init

# Generate Prisma client
npx prisma generate

# Seed 20 students + sample data
npm run prisma:seed

# Start backend
npm run dev
# ✅ Backend running at http://localhost:5000
```

---

## Step 3: Frontend

Open a **new terminal**:

```bash
cd frontend

# Install dependencies
npm install

# Start frontend
npm run dev
# ✅ Frontend running at http://localhost:5173
```

Open http://localhost:5173 in your browser.

---

## Step 4: Login

| Role | Email | Password |
|---|---|---|
| **Admin** | `admin@dashboard.edu` | `Admin@1234` |
| **Teacher** | `sarah.chen@dashboard.edu` | `Teacher@1234` |
| **Student** | `alice.johnson@student.edu` | `Student@1234` |

---

## 🐳 Alternative: Full Docker Setup

If you have Docker Desktop installed:

```bash
cd infra
docker compose up -d

# Wait 30 sec, then seed:
docker exec student_backend sh -c "npx prisma migrate deploy && npx ts-node prisma/seed.ts"

# Open:
# Frontend → http://localhost:80
# Backend  → http://localhost:5000/api
# API Health → http://localhost:5000/api/health
```

---

## Useful Dev Commands

```bash
# View DB with GUI
cd backend && npm run prisma:studio
# → Opens Prisma Studio at http://localhost:5555

# Run tests
cd backend && npm test
cd frontend && npm test

# Trigger anomaly detector manually (via ts-node)
cd backend && npx ts-node -e "
import { runAnomalyDetector } from './src/jobs/anomalyDetector';
runAnomalyDetector().then(() => process.exit(0));
"

# Generate PDF report for a student (replace ID)
curl -H "Authorization: Bearer <token>" \
  http://localhost:5000/api/students/<id>/report \
  --output report.pdf

# Export insights CSV
curl -H "Authorization: Bearer <token>" \
  http://localhost:5000/api/analytics/insights/export \
  --output insights.csv
```
