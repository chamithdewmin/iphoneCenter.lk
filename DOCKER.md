# Docker setup

## Quick start

1. **Copy env and set secrets** (required for backend):
   ```bash
   copy .env.example .env
   ```
   Edit `.env` and set:
   - `JWT_SECRET` and `JWT_REFRESH_SECRET` (use long random strings, e.g. 32+ chars).
   - Optionally change MySQL credentials.

2. **Apply database schema** (first time only):
   - Start MySQL: `docker compose up -d mysql`
   - Run schema: `docker compose exec mysql mysql -u pos_user -ppos_password pos_system < backend/database/schema.sql`
   - Or use a MySQL client and run `backend/database/schema.sql` against the `pos_system` database.

3. **Run all services**:
   ```bash
   docker compose up -d
   ```
   - Frontend: http://localhost:3000  
   - Backend API: http://localhost:3001  
   - MySQL: localhost:3306  

## Build only

- Backend: `docker build -t iphone-backend ./backend`
- Frontend: `docker build -t iphone-frontend ./frontend`

## Security notes

- Never commit `.env` or real `JWT_SECRET`/`JWT_REFRESH_SECRET`.
- In production set `CORS_ORIGIN` to your frontend URL (e.g. `https://your-app.com`).
- Use strong MySQL passwords and restrict port 3306 exposure.
