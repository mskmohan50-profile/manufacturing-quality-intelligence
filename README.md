# Manufacturing Quality Intelligence Dashboard

A production-grade web application for manufacturing teams to upload production data, validate records, analyze quality metrics, monitor machine performance, and export reports.

---
## Features

### Core
- **Authentication** — Email/password sign-up and sign-in with protected routes (JWT-based auth against the Express API)
- **File Upload** — CSV and Excel (.xlsx) parsing with drag & drop, validation, preview, and error highlighting
- **Dashboard** — KPIs (total records, accepted/rejected parts, yield %, avg cycle time, machine/operator counts, shift summary)
- **Data Visualization** — Trend analysis (area chart), line chart, bar chart, pie chart, defect distribution
- **Search & Filtering** — Filter by machine, operator, shift, product, batch, date range, status + global search
- **Report Export** — CSV export (full data) and PDF summary report (KPIs + data table)
- **Responsive UI** — Desktop, tablet, and mobile layouts

### Bonus Features
- Dark mode (persisted, respects system preference)
- Drag & drop upload
- Undo upload (restore previous preview)
- Data quality score (completeness, validity, consistency, uniqueness)
- AI-generated production insights (yield, machine, operator, trend, shift analysis)
- SHAP-style feature importance visualization (mocked)
- Audit logging (all uploads, exports, logins, deletions)
- Keyboard shortcuts (D/U/R/E/A navigation)
- Loading skeletons, empty states, error states with retry
- Toast notifications (success, error, warning, info)
- Accessibility (ARIA labels, keyboard navigation, focus rings)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + TypeScript + Vite 8 |
| Styling | Tailwind CSS v4 |
| Charts | Recharts |
| File Parsing | PapaParse (CSV), SheetJS/xlsx (Excel) |
| PDF Export | jsPDF + jspdf-autotable |
| Backend | Express + MongoDB (Mongoose) + JWT auth |
| Icons | lucide-react |

---

## Installation & Setup

### 1. Backend (Express + MongoDB)

```bash
cd backend
npm install
cp .env.example .env
```

Edit `backend/.env`:

| Variable | Description |
|---|---|
| `MONGODB_URI` | MongoDB Atlas (free tier is fine) or local `mongod` connection string |
| `JWT_SECRET` | Any long random string, e.g. `openssl rand -hex 32` |
| `JWT_EXPIRES_IN` | JWT expiry (e.g. `7d`) |
| `CORS_ORIGIN` | Frontend URL (default Vite dev server: `http://localhost:5173`) |

Run it:

```bash
npm run dev     # auto-restarts on changes (nodemon)
# or
npm start
```

Backend starts on `http://localhost:4000` by default.

### 2. Frontend (React + Vite)

```bash
# From the project root
cd frontend
npm install
cp .env.example .env
```

Edit `.env`:

```env
VITE_API_URL=http://localhost:4000
```

```bash
npm run dev
```

---

## API Documentation

The frontend talks to the Express API via `src/lib/api.ts` (a thin `fetch` wrapper that attaches the JWT and reads `VITE_API_URL`).

| Method | Path | Auth | Frontend call | Description |
|---|---|---|---|---|
| POST | `/api/auth/signup` | – | `api.post('/api/auth/signup', ...)` | Create account, returns `{ token, user }` |
| POST | `/api/auth/login` | – | `api.post('/api/auth/login', ...)` | Log in, returns `{ token, user }` |
| POST | `/api/auth/logout` | ✔ | `api.post('/api/auth/logout')` | Writes an audit log entry |
| GET | `/api/auth/me` | ✔ | `api.get('/api/auth/me')` | Current user info / restore session |
| GET | `/api/records?limit=5000` | ✔ | `api.get('/api/records?limit=5000')` | List your production records |
| POST | `/api/records` | ✔ | `api.post('/api/records', [...])` | Insert one record or an array (bulk upload) |
| PATCH | `/api/records/:id` | ✔ | `api.patch('/api/records/:id', ...)` | Update a record you own |
| DELETE | `/api/records` `{ ids: string[] }` | ✔ | `api.delete('/api/records', { ids })` | Bulk delete records you own |
| GET | `/api/audit-logs?limit=50` | ✔ | `api.get('/api/audit-logs?limit=50')` | List your audit log entries |
| POST | `/api/audit-logs` | ✔ | `api.post('/api/audit-logs', {...})` | Write an audit log entry |

All authenticated routes expect `Authorization: Bearer <token>`. All `/api/records` and `/api/audit-logs` routes are scoped to the authenticated user.

Response field names are kept in `snake_case` (`machine_id`, `production_date`, etc.) so the frontend types don't need to change if the API implementation changes.

---

## Database Schema (MongoDB)

Defined as Mongoose models in `backend/src/models/`. The API serializes them to a snake_case shape for the frontend.

### `productionrecords` collection
| Field (Mongo) | Field (API/frontend) | Type | Description |
|---|---|---|---|
| `_id` | `id` | ObjectId | Record identifier |
| `userId` | `user_id` | ObjectId (ref `User`) | Owner of the record |
| `machineId` | `machine_id` | String | Machine identifier |
| `operator` | `operator` | String | Operator name |
| `shift` | `shift` | String enum | Morning / Afternoon / Night |
| `product` | `product` | String | Product name/code |
| `batch` | `batch` | String | Batch number |
| `productionDate` | `production_date` | Date | Date of production |
| `cycleTimeSec` | `cycle_time_sec` | Number | Cycle time in seconds |
| `status` | `status` | String enum | accepted / rejected |
| `defectType` | `defect_type` | String \| null | Type of defect if rejected |
| `temperature` | `temperature` | Number \| null | Machine temperature |
| `pressure` | `pressure` | Number \| null | Machine pressure |
| `vibration` | `vibration` | Number \| null | Vibration level |
| `createdAt` | `created_at` | Date | Creation timestamp |

### `auditlogs` collection
| Field (Mongo) | Field (API/frontend) | Type | Description |
|---|---|---|---|
| `_id` | `id` | ObjectId | Log identifier |
| `userId` | `user_id` | ObjectId (ref `User`) | User who performed the action |
| `action` | `action` | String | Action type (upload, export_csv, export_pdf, login, logout, delete) |
| `entityType` | `entity_type` | String | Entity affected |
| `entityId` | `entity_id` | String \| null | ID of affected entity |
| `details` | `details` | Mixed | Additional context |
| `createdAt` | `created_at` | Date | Log timestamp |

### `users` collection
| Field | Type | Description |
|---|---|---|
| `_id` | ObjectId | User identifier |
| `email` | String (unique) | Login email |
| `passwordHash` | String | bcrypt hash (never sent to the client) |

### Data ownership

There's no row-level security built into MongoDB, so the Express API enforces ownership in code:

- `requireAuth` middleware verifies the JWT on every protected route and attaches `req.user`
- `ProductionRecord.userId` and `AuditLog.userId` reference `User._id`
- Every query in `backend/src/routes/records.js` and `auditLogs.js` filters or matches on `userId: req.user.id`
- Audit logs are insert/read only from the API — there are no update or delete routes, keeping them append-only

---

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the multi-tenant SaaS architecture document — how the app evolves to support multiple organizations, workspace isolation, RBAC, audit logging, future AI integration, and scalability, all on the MongoDB schema.
---
## Future Improvements

- Real-time updates via WebSockets/Socket.io
- Background processing for large file uploads (web workers)
- PWA support with offline data caching
- Advanced AI insights via a queue/worker service (LLM integration)
- Custom dashboard layouts with drag-and-drop widgets
- Email notifications for threshold alerts
- SSO / OAuth integration
- Multi-tenant organization management
- Automated scheduled reports
