# Backend deployment (Dokploy / Docker)

## Fixing 502 Bad Gateway (after recreate or first deploy)

If you get **502 Bad Gateway** when opening `https://backend.iphonecenter.logozodev.com`:

1. **Build path** – In the backend app settings, set **Build Path** (or **Dockerfile path** / **Context**) to **`backend`**. The Dockerfile is in the `backend` folder; the build context must be `backend` so that `server.js` and `database/` end up in `/app` inside the container. If the context is the repo root, the app won’t start and the container will exit → 502.

2. **Domain → Container port** – In **Domain** (or **Settings**), set **Container Port** to **`5000`**. The backend listens on port 5000.

3. **Environment variables** – After recreating the backend, add all required env vars (see section 3 below): **`DATABASE_URL`**, **`JWT_SECRET`**, **`JWT_REFRESH_SECRET`**, and optionally **`CORS_ORIGIN`**, **`PORT=5000`**. If `JWT_SECRET` or `DATABASE_URL` is missing, the app exits on startup → 502.

4. **Check logs** – Open the backend app → **Logs**. If you see “Startup failed”, “Missing required environment variables”, or “Database init error”, fix those and redeploy.

5. **Wait for startup** – The app runs the database init before listening; that can take up to ~30 seconds. If the proxy hits the container before the app is listening, you may see 502. Wait a minute and try again, or increase the proxy health-check start period.

---

## Fixing 500 on `/api/customers` (and other API routes)

The backend returns **500** or **503** when the database is missing tables or unreachable.

### 1. Database URL (PostgreSQL only)

The backend uses **PostgreSQL only** (no MySQL). In Dokploy, set the connection in the **backend application** (not the database container):

- Open your **backend** app → **Environment** (or **Variables**).
- Add **`DATABASE_URL`** and set it to your PostgreSQL connection string.
- Easiest: copy the **Internal Connection URL** from your PostgreSQL service’s **Internal Credentials** (e.g. `postgresql://user_iphone_center:****@iphone-center-database-ewasbn:5432/iphone-center-db`). Use that **exact** URL in `DATABASE_URL` so the backend connects to that database. If you get `ENOTFOUND iphone-center-database-xxxxx`, the backend is using an old hostname — update `DATABASE_URL` in the **backend** app Environment to match the Internal Connection URL and redeploy.

If you prefer separate vars: set `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` (and optionally `DB_PORT`) instead of `DATABASE_URL`. The host must be the **internal hostname** from your DB’s Internal Credentials (e.g. `iphone-center-database-ewasbn`) so the backend container can reach the DB.

### 2. First run: database install (tables auto-created)

**When the application runs for the first time**, it automatically:

1. Waits for the database to be reachable (retries for ~30 seconds).
2. Runs **`database/init.pg.sql`** and creates all tables, indexes, and triggers if they don’t exist.
3. Verifies that the `users` table exists, then starts the HTTP server.

You do **not** need to run the schema manually. Set **`DATABASE_URL`** in the backend app, deploy, and the backend will create all tables on first run. On later restarts it runs the same script (idempotent); existing tables are left as-is.

**Test that the database is connected:** open in browser:  
**`https://your-backend-url/api/health/db`**  
You should see `"database": "connected"` and `"message": "Database connected. Tables ready."` (see **API_URLS.md** for full list). If you still see "Database schema not applied", check backend logs and see **RUN_SCHEMA.md**.

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

---

## 500 / "Could not load warehouses" (GET /api/branches)

If the app shows **"Could not load warehouses"** and the network tab shows **500** (or **503**) for `GET .../api/branches`:

1. **Backend env** – In the **backend** app, set **`DATABASE_URL`** (or `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`) to your PostgreSQL connection. Use the **Internal Connection URL** from your DB service so the backend can reach the database.
2. **DB health** – Open **`https://backend.iphonecenter.logozodev.com/api/health/db`**. If it shows `"database": "disconnected"`, the backend cannot connect; fix `DATABASE_URL` and redeploy.
3. **Schema** – Tables are created automatically on startup from **`backend/database/init.pg.sql`**. If the DB was empty, wait ~30 seconds after deploy and try again. If tables are still missing, run `init.pg.sql` manually (see section 2 above) and restart the backend.
4. **Logs** – In backend container logs, look for **`Get branches error:`** and the line after it. The log shows the real PostgreSQL **code** and **message** (e.g. `42501` = permission denied, `42P01` = table missing).
5. **Permission denied (42501)** – If the schema was run as `postgres` (or another user) but the app connects with a different user (from `DATABASE_URL`), that user may lack SELECT on `branches`. Connect to PostgreSQL as a superuser and run (replace `your_app_user` with the username from your `DATABASE_URL`):
   ```sql
   GRANT USAGE ON SCHEMA public TO your_app_user;
   GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO your_app_user;
   GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO your_app_user;
   ```
   Then retry loading warehouses.

After fixing, the API returns **503** with a clear message instead of 500; the logs always show the exact error so you can fix the root cause.

---

## 500 on checkout (POST /api/billing/sales) – “Checkout failed”

If the frontend shows **“Checkout failed”** and the network tab shows **500** for `POST .../api/billing/sales`:

### 1. Check backend container logs (required)

1. In **Dokploy**, open your **backend** application.
2. Open **Logs** (or **Container logs**).
3. Reproduce the error: add products to cart and click **Pay & Print**.
4. In the logs, look for a line like:
   - `Create sale error: ...`  
   - or `API Error: ... POST /api/billing/sales`  
   - and the line below it (the real PostgreSQL or Node error).

The **exact message** in the logs (e.g. relation "sales" does not exist, foreign key violation, column "xyz" does not exist) tells you what to fix.

### 2. Typical causes and fixes

| Log message / cause | What to do |
|---------------------|------------|
| **relation "sales" does not exist** (or 42P01) | Database schema not applied. Run `backend/database/init.pg.sql` (or `schema.pg.sql`) on your PostgreSQL DB. See section 2 above (First run: database install). |
| **No active user in database** | Add at least one user (e.g. Admin) in the app: **User Manage → Add User**, or run the seed in the schema (admin user). |
| **No branch found** | Add at least one branch: **Warehouses → Add Warehouse** (or run the branch seed in the schema). |
| **Insufficient stock for product ID X** | Ensure the product has stock at the current branch: **Inventory** or **Warehouse-wise Stock** and add stock for that product/branch. |
| **foreign key constraint / user_id / branch_id** | Ensure `users` and `branches` tables have rows and the IDs used in the request exist. |

### 3. Manual checks (run these if logs are unclear)

1. **Database connected**  
   Open: `https://backend.iphonecenter.logozodev.com/api/health/db`  
   Expect: `"database": "connected"`.

2. **Tables exist**  
   In your PostgreSQL client (or Dokploy DB shell), run:
   ```sql
   SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sales');
   SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users');
   SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'branch_stock');
   ```
   All should be true. If not, run `backend/database/init.pg.sql` (or `schema.pg.sql`).

3. **At least one user and one branch**  
   ```sql
   SELECT id, username, full_name, role FROM users WHERE is_active = TRUE LIMIT 1;
   SELECT id, name, code FROM branches WHERE is_active = TRUE LIMIT 1;
   ```
   If either is empty, add a user and a branch via the app or schema seed.

4. **Stock for the product you’re selling**  
   For the product and branch you use at checkout:
   ```sql
   SELECT bs.branch_id, bs.product_id, bs.quantity
   FROM branch_stock bs
   WHERE bs.product_id = YOUR_PRODUCT_ID AND bs.branch_id = YOUR_BRANCH_ID;
   ```
   Quantity must be ≥ the quantity you add to cart.

After fixing the cause, redeploy the backend if you changed env or schema, then try checkout again.
