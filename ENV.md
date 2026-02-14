# Environment variables reference

All environment variables used by the backend and frontend, as referenced in code.

---

## Backend (`backend/`)

Load from `backend/.env` (copy from `backend/.env.example`).

| Variable | Required | Default | Used in | Description |
|----------|----------|---------|---------|-------------|
| `NODE_ENV` | No | `development` | server.js, errorHandler, logger, helmet | `production` or `development` |
| `PORT` | No | `5000` | server.js | HTTP port |
| `DATABASE_URL` | Yes* | — | config/database.js | Full PostgreSQL URL, e.g. `postgresql://user:pass@host:5432/dbname` |
| `DB_HOST` | If no DATABASE_URL | — | config/database.js | Database host |
| `DB_PORT` | No | `5432` | config/database.js | Database port |
| `DB_USER` | No | `postgres` | config/database.js | Database user |
| `DB_PASSWORD` | No | `''` | config/database.js | Database password |
| `DB_NAME` | No | `pos_system` | config/database.js | Database name |
| `JWT_SECRET` | **Yes** | — | config/env.js, middleware/auth.js, authController | Access token signing secret (32+ chars in production) |
| `JWT_REFRESH_SECRET` | **Yes** | — | config/env.js, middleware/auth.js, authController | Refresh token signing secret (32+ chars in production) |
| `CORS_ORIGIN` | No | (reflect request) | server.js | Frontend origin, e.g. `https://iphonecenter.logozodev.com` |
| `LOG_LEVEL` | No | `info` | utils/logger.js | Log level: error, warn, info, debug |

\* Either `DATABASE_URL` or `DB_HOST` (and optionally other DB_* vars) must be set.

---

## Frontend (`frontend/`)

Load from `frontend/.env` (copy from `frontend/.env.example`).  
Vite exposes only variables prefixed with `VITE_`.

| Variable | Required | Default | Used in | Description |
|----------|----------|---------|---------|-------------|
| `VITE_API_URL` | Yes (for API) | `''` | lib/api.js, AuthContext.jsx | Backend base URL (no trailing slash), e.g. `https://backend.iphonecenter.logozodev.com` |

---

## Root (for docker-compose)

Load from root `.env` when using `docker compose`. Copy from root `.env.example`.

Same as backend DB and JWT vars, plus:

| Variable | Description |
|----------|-------------|
| `CORS_ORIGIN` | Frontend origin for backend CORS |
| `VITE_API_URL` | Optional; API URL baked into frontend image at build |

---

## Quick setup

**Backend (local)**  
```bash
cd backend && cp .env.example .env
# Edit .env: set DATABASE_URL (or DB_*), JWT_SECRET, JWT_REFRESH_SECRET, CORS_ORIGIN
```

**Frontend (local)**  
```bash
cd frontend && cp .env.example .env
# Edit .env: set VITE_API_URL to your backend URL (e.g. http://localhost:3001)
```

**Docker**  
```bash
cp .env.example .env
# Set JWT_SECRET, JWT_REFRESH_SECRET, DATABASE_URL (or DB_*), CORS_ORIGIN
docker compose up -d
```
