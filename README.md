# 🎓 Smart Student Information Dashboard

[![CI](https://github.com/your-org/student-dashboard/actions/workflows/ci.yml/badge.svg)](https://github.com/your-org/student-dashboard)

A **production-ready** full-stack student information management system with AI-driven study insights, attendance anomaly detection, and an excellent modern UI.

---

## ✨ Features

| Feature | Details |
|---|---|
| **Auth** | JWT (access + refresh tokens) with httpOnly cookies, RBAC (Admin/Teacher/Student) |
| **Students** | Full CRUD with search, filters, pagination, PDF reports |
| **Attendance** | Bulk recording, heatmaps, rolling-window anomaly detection |
| **Grades** | Subject-wise tracking across terms with trend analysis |
| **Analytics** | AI-style insights, risk flags, CSV export |
| **Notifications** | In-app alerts for low attendance |
| **Audit Logs** | Admin-only full activity log |
| **Smart Features** | Study suggestions, auto-summarized profiles, cron scheduler |
| **Security** | Helmet, CORS, rate limiting, bcrypt, account lockout |

---

## 🚀 Quick Start (Recommended: Docker)

### Prerequisites
- Docker Desktop installed and running
- Git

```bash
# 1. Clone the repo
git clone https://github.com/your-org/student-dashboard.git
cd student-dashboard

# 2. Start all services (DB + Redis + Backend + Frontend)
cd infra
docker compose up -d

# 3. Wait ~30 seconds, then run migrations and seed
docker exec student_backend npx prisma migrate deploy
docker exec student_backend npx ts-node prisma/seed.ts

# 4. Open the app
http://localhost:80        # Frontend
http://localhost:5000/api  # Backend API
```

**Demo credentials:**
| Role | Email | Password |
|---|---|---|
| Admin | `admin@dashboard.edu` | `Admin@1234` |
| Teacher | `sarah.chen@dashboard.edu` | `Teacher@1234` |
| Student | `alice.johnson@student.edu` | `Student@1234` |

---

## 🛠️ Local Development (Without Docker)

### Prerequisites
- Node.js 20+
- PostgreSQL 15+
- Redis 7+

### Backend Setup

```bash
cd backend

# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your PostgreSQL and Redis credentials

# 3. Run database migrations
npm run prisma:migrate

# 4. Generate Prisma client
npm run prisma:generate

# 5. Seed sample data
npm run prisma:seed

# 6. Start development server
npm run dev
# → Backend running at http://localhost:5000
```

### Frontend Setup

```bash
cd frontend

# 1. Install dependencies
npm install

# 2. Start development server
npm run dev
# → Frontend at http://localhost:5173
# → API calls proxied to http://localhost:5000
```

---

## 🧪 Running Tests

### Backend Tests (Jest + Supertest)
```bash
cd backend
npm test
# Runs integration tests against a real DB — set DATABASE_URL to test DB first
```

### Frontend Tests (Vitest)
```bash
cd frontend
npm test
```

### Postman Collection
Import `docs/postman-collection.json` into Postman. Set `base_url = http://localhost:5000/api`.

---

## 📁 Project Structure

```
student-dashboard/
├── backend/                # Express + TypeScript API
│   ├── src/
│   │   ├── controllers/    # Route handlers
│   │   ├── middleware/     # Auth, error handler
│   │   ├── routes/         # Route definitions
│   │   ├── services/       # Business logic (insights)
│   │   ├── jobs/           # Cron jobs (anomaly detector)
│   │   └── utils/          # JWT, logging, schemas, errors
│   ├── prisma/
│   │   ├── schema.prisma   # DB schema
│   │   └── seed.ts         # Sample data
│   └── tests/              # Integration tests
│
├── frontend/               # React + Vite + Tailwind
│   └── src/
│       ├── components/     # Reusable UI components
│       ├── pages/          # Route-level page components
│       ├── store/          # Zustand state stores
│       ├── types/          # TypeScript types
│       └── utils/          # API client, helpers
│
├── infra/
│   └── docker-compose.yml  # Local dev stack
│
├── docs/                   # API docs, threat model
└── .github/workflows/      # CI/CD pipeline
```

---

## 🔒 Security Overview

See [docs/threat-model.md](docs/threat-model.md) for the full threat model.

Key controls:
- **bcrypt** (12 rounds) for password hashing
- **JWT** access tokens (15 min, in-memory) + refresh tokens (7 days, httpOnly cookie)
- **Helmet** for secure HTTP headers
- **CORS** restricted to configured origins
- **Rate limiting**: 100 req/min globally, 10/15min on auth
- **Account lockout** after 5 failed login attempts
- **Zod** validation on all inputs
- **RBAC** enforced at every route

---

## 🚢 Production Deployment

### Vercel (Frontend) + Render/Railway (Backend)

1. **Backend on Render:**
   - Connect GitHub repo
   - Root directory: `backend`
   - Build: `npm install && npx prisma generate && npm run build`
   - Start: `npm start`
   - Add all env vars from `backend/.env.example`

2. **Frontend on Vercel:**
   - Connect GitHub repo
   - Root directory: `frontend`
   - Build: `npm run build`
   - Output: `dist`
   - Add env var: `VITE_API_URL=https://your-backend.render.com/api`

3. **Database:** Provision PostgreSQL on Render, Supabase, or Neon.

---

## 🎬 Demo Script (2–3 steps for stakeholders)

1. **Login as Admin** at http://localhost:80 → email: `admin@dashboard.edu`, password: `Admin@1234`
2. **Dashboard** — show KPI cards, 6-week trend chart, at-risk student list
3. **Click a student** from the at-risk list → show AI summary bubble, attendance heatmap, grade chart, notes
4. **Click "Download Report"** → PDF exported with grades, attendance, notes
5. **Navigate to Analytics** → select a student → show radar chart and study suggestions

---

## 📦 Available Scripts

### Backend
| Script | Description |
|---|---|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Compile TypeScript |
| `npm run lint` | ESLint check |
| `npm test` | Run all tests |
| `npm run prisma:migrate` | Run DB migrations |
| `npm run prisma:seed` | Seed sample data |
| `npm run prisma:studio` | Open Prisma Studio |

### Frontend
| Script | Description |
|---|---|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint check |
| `npm test` | Run Vitest tests |
