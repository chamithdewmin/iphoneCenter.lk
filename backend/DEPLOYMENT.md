# Backend deployment (Dokploy / Docker)

## Fixing 500 on `/api/customers` (and other API routes)

The backend returns **500** or **503** when the database is missing tables or unreachable.

### 1. Database URL (PostgreSQL only)

The backend uses **PostgreSQL only** (no MySQL). In Dokploy, set the connection in the **backend application** (not the database container):

- Open your **backend** app → **Environment** (or **Variables**).
- Add **`DATABASE_URL`** and set it to your PostgreSQL connection string.
- Easiest: copy the **Internal Connection URL** from your PostgreSQL service’s **Internal Credentials** (e.g. `postgresql://user_iphone_center:****@iphone-center-database-2r1ljm:5432/iphone-center-db`). Use the same URL in `DATABASE_URL` so the backend connects to that database.

If you prefer separate vars: set `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` (and optionally `DB_PORT`) instead of `DATABASE_URL`. The host must be the **internal hostname** (e.g. `iphone-center-database-2r1ljm`) so the backend container can reach the DB.

### 2. First run: all tables auto-created

**When the application runs for the first time**, it automatically:

1. Waits for the database to be reachable (retries for ~30 seconds).
2. Runs **`database/init.pg.sql`** and creates all tables, indexes, and triggers if they don’t exist.
3. Verifies that the `users` table exists, then starts the HTTP server.

You do **not** need to run the schema manually. Set **`DATABASE_URL`** in the backend app, deploy, and the backend will create all tables on first run. On later restarts it runs the same script (idempotent); existing tables are left as-is. If you still see "Database schema not applied", check backend logs and see **RUN_SCHEMA.md**.

```bash
# With your DATABASE_URL (from Internal Credentials)
psql "postgresql://user_iphone_center:YOUR_PASSWORD@host:5432/iphone-center-db" -f backend/database/schema.pg.sql
```

Or from the **PostgreSQL container terminal** in Dokploy (if repo is public on GitHub):

```bash
PGPASSWORD='YOUR_PASSWORD' wget -qO- 'https://raw.githubusercontent.com/chamithdewmin/iphoneCenter.lk/main/backend/database/schema.pg.sql' | psql -U user_iphone_center -d iphone-center-db -h localhost
```

If you don’t run the schema, you will get:

- **503** with message: *"Database schema not applied. Run backend/database/schema.pg.sql on your PostgreSQL database, then restart the app."*
- Or **500** before that change; container logs will show PostgreSQL errors (e.g. relation "customers" does not exist).

### 3. Required environment variables

| Variable              | Required | Notes |
|-----------------------|----------|--------|
| `JWT_SECRET`          | Yes      | 32+ characters in production |
| `JWT_REFRESH_SECRET`  | Yes      | 32+ characters in production |
| `DATABASE_URL` or DB_* | Yes    | PostgreSQL connection |
| `CORS_ORIGIN`         | Recommended | Your frontend origin (e.g. `https://iphonecenter.logozodev.com`) |
| `NODE_ENV`            | Optional | Set to `production` in production |
| `TEST_LOGIN_USERNAME` / `TEST_LOGIN_PASSWORD` | Optional | Demo login (default `test` / `test`) |

### 4. Check container logs

After deploying, reproduce the error (e.g. open a page that calls `/api/customers`) and check the **backend container logs** in Dokploy. You should see lines like:

- `API Error: 42P01 relation "customers" does not exist GET /api/customers` → run the schema.
- `API Error: ECONNREFUSED ...` → database not reachable; check `DATABASE_URL` and network.

This helps confirm whether the problem is missing schema or database connectivity.
