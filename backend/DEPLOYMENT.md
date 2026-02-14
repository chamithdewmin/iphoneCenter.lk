# Backend deployment (Dokploy / Docker)

## Fixing 500 on `/api/customers` (and other API routes)

The backend returns **500** or **503** when the database is missing tables or unreachable.

### 1. Database URL

In Dokploy (or your host), set in the **backend** app environment:

- **`DATABASE_URL`**  
  Example: `postgresql://user:password@your-postgres-host:5432/pos_system`  
  Or use: `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` (and optionally `DB_PORT`).

### 2. Run the schema (required once)

Create all tables (including `customers`, `users`, `branches`, etc.) by running the PostgreSQL schema **once** against the same database:

```bash
# From your machine (replace with your real DATABASE_URL or connection details)
psql "postgresql://user:password@host:5432/pos_system" -f backend/database/schema.pg.sql
```

Or from inside the server where PostgreSQL is running:

```bash
psql -U postgres -d pos_system -f /path/to/backend/database/schema.pg.sql
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
