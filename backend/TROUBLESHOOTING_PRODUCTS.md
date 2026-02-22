# Troubleshooting: POST /api/inventory/products (500 or failure)

Use these steps to find and fix why adding a product fails.

**Quick reference:** Replace `<backend_container>` with your backend app name in Dokploy (or run `docker ps` to see the container name). Replace `<db_host>`, `<db_user>`, etc. with values from Dokploy → PostgreSQL → Internal Credentials.

---

## Quick debug (500 on create product)

**0. Production startup** — When `NODE_ENV=production` (e.g. on Dokploy), the backend **waits for PostgreSQL and runs init.pg.sql before accepting requests**, so "tables missing" (503) or blind 500s from missing schema should not occur after a successful deploy. If you see 500, set **`EXPOSE_500_ERROR=1`** in the backend environment, redeploy, and add a product again; the API response body will include the real error message so you can fix it (or check backend logs).

**1. Check backend logs** — Dokploy → your backend app → **Logs**. The real error is there (e.g. `CREATE PRODUCT ERROR:`, missing env, SQL error).

**2. Environment variables** — In Dokploy → backend app → **Environment**, set either:
- **`DATABASE_URL`** = `postgresql://user:password@host:5432/dbname` (copy from PostgreSQL → Internal Credentials),  
- or **`DB_HOST`**, **`DB_PORT`** (5432), **`DB_USER`**, **`DB_PASSWORD`**, **`DB_NAME`**.  
Use the **internal** DB hostname (e.g. `iphone-center-database-xxxxx`), not `localhost`.

**3. Database is auto-initialized** — The backend **runs** `database/init.pg.sql` on startup (see `server.js` → `applySchema()`). You do **not** need to run it manually unless tables are missing or init failed in logs. If you do run it manually:  
`psql -h <db_host> -U <db_user> -d <db_name> -f backend/database/init.pg.sql`

**4. Test the endpoint** — The API **requires auth** and **name, sku, base_price**. A body like `{"test": true}` returns 401 or 400, not the DB error. Use:

```bash
# Get token first
TOKEN=$(curl -s -X POST https://backend.iphonecenter.lk/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"YOUR_PASSWORD"}' | jq -r '.data.accessToken')

# Then create product (correct body)
curl -s -X POST https://backend.iphonecenter.lk/api/inventory/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Test","sku":"TEST-001","base_price":100,"branchId":1}'
```

The response body on 500 includes **message**, **code**, **detail** (the real error). In the browser, open DevTools → Network, retry adding a product, and inspect the failed request’s **Response** tab to see the exact error.

**5. Check if DB is reachable from the backend container** — In Dokploy, open a **terminal** into the **backend** container and run:

```bash
node -e "const {Pool}=require('pg');const p=new Pool({connectionString:process.env.DATABASE_URL});p.query('SELECT 1').then(()=>console.log('DB OK')).catch(e=>console.error('DB Error:',e.message));p.end();"
```

If you use separate vars instead of `DATABASE_URL`, run this (replace placeholders):

```bash
node -e "
const {Pool}=require('pg');
const c=process.env.DB_HOST ? {
  host:process.env.DB_HOST,
  port:process.env.DB_PORT||5432,
  user:process.env.DB_USER,
  password:process.env.DB_PASSWORD,
  database:process.env.DB_NAME
} : {connectionString:process.env.DATABASE_URL};
const p=new Pool(c);
p.query('SELECT 1').then(()=>console.log('DB OK')).catch(e=>console.error('DB Error:',e.message));
p.end();
"
```

If you see **DB OK**, the app can reach Postgres. If you see **DB Error**, fix `DATABASE_URL` or `DB_*` and restart the backend.

---

## Common causes of 500 in Dockerized Node.js APIs

| Cause | Symptom | Fix |
|-------|---------|-----|
| **Tables missing** (schema not run) | PostgreSQL `42P01` "relation does not exist" | Set `WAIT_FOR_DB=1` and redeploy, or run `init.pg.sql` manually (see below). |
| **Wrong DB host** | `ECONNREFUSED` / `ENOTFOUND` | Use **internal** DB hostname from Dokploy (e.g. `iphone-center-database-xxxxx`), not `localhost`. |
| **Missing env** | `DATABASE_URL` undefined, pool fails | Set `DATABASE_URL` or `DB_HOST`+`DB_USER`+`DB_PASSWORD`+`DB_NAME` in backend Environment. |
| **Schema out of date** | `42703` undefined column | Run `backend/database/init.pg.sql` on the DB and restart backend. |
| **Invalid request body** | Validation fails or controller throws | Send `name`, `sku`, `base_price` (and for admin, `branchId`). Use DevTools → Network to see response body. |
| **Unhandled exception** | Any thrown error in route/controller | All errors go through global error handler; check backend logs for `[Express Error]` and full stack. |

---

## Full Express error logging and global error handler

Every error is passed to the **global error handler** in `middleware/errorHandler.js` (registered last in `server.js`). It:

1. **Logs the full error to stdout** (so Docker/Dokploy logs show it):
   - `[Express Error]` + message, code, stack, detail, request method/url
2. **Logs structured JSON** to `logs/error.log` and `logs/combined.log` via Winston
3. **Maps known errors** to friendly status codes (e.g. 42P01 → 503 "Database tables missing", 23505 → 409 "SKU already exists")
4. **In production**, for generic 500s, returns `"Internal server error"` to the client (no stack/detail) while still logging the real error server-side

To see the **real** cause of a 500:

- **Dokploy**: open your backend app → **Logs**, search for `[Express Error]` or `Create product error`
- **Docker**: `docker logs <backend_container> --tail 200`

Example log line:

```
[Express Error] relation "products" does not exist
  code: 42P01
  stack: ...
  request: POST /api/inventory/products ...
```

---

## Request validation (POST /api/inventory/products)

Validation runs **before** the controller (`routes/inventoryRoutes.js` → `createProductValidation`, `handleValidationErrors`). Required:

- **name** (non-empty string)
- **sku** (non-empty string)
- **base_price** or **basePrice** (number ≥ 0)

Optional (validated if present):

- **description** (string, max 2000)
- **category**, **brand** (string, max 100)
- **initialQuantity** (integer ≥ 0)
- **branchId** (integer ≥ 1, required for admin when adding product)

Invalid types or missing required fields return **400** with an `errors` array; the controller is not called. This reduces 500s from bad input.

---

## PostgreSQL connection verified on startup

- **Default**: The server **starts listening first** (avoids 502 while DB is starting). Then it runs `applySchema()` in the background to create tables. If the DB is slow, the first few requests might hit "tables missing" (503).
- **Optional (recommended for Dokploy)**: Set **`WAIT_FOR_DB=1`** (or **`RUN_INIT_BEFORE_LISTEN=1`**) in the backend Environment. On startup the app will:
  1. Wait for PostgreSQL (retries with backoff)
  2. Run **init.pg.sql** (create tables if not exist)
  3. Then start the HTTP server

So by the time the first request arrives, the DB is verified and tables exist. This avoids 500s from missing tables on first deploy.

---

## Auto-run init.pg.sql on container start

The backend **already** runs `backend/database/init.pg.sql` on container start:

- **Without** `WAIT_FOR_DB=1`: After the HTTP server starts, `applySchema()` runs in the background (see `server.js`). Logs: *"Database: installing on first run in background..."* and *"✅ Database init completed"* or an error.
- **With** `WAIT_FOR_DB=1`: Before the server listens, the app runs `verifyConnection()` then `applySchema()` (see `config/initDatabase.js`). Logs: *"WAIT_FOR_DB=1: verifying PostgreSQL..."*, *"✅ Database connection verified"*, *"✅ Database init completed"*, then *"Server running..."*.

Schema file path: **`backend/database/init.pg.sql`** (relative to project root). It uses `CREATE TABLE IF NOT EXISTS`, so it is safe to run on every start.

To run it **manually** (e.g. if auto-run failed):

```bash
psql -h <db_host> -U <db_user> -d <db_name> -f backend/database/init.pg.sql
```

Or from inside the backend container (if the file is mounted or copied):

```bash
node -e "
const { applySchema } = require('./config/initDatabase');
applySchema().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
"
```

---

## Production-safe logging

- **Error handler** (`middleware/errorHandler.js`): Logs request method, path, and (in non-production) a safe sample of `req.body` with password-like keys redacted. In production it does **not** send stack or internal detail to the client for 500s.
- **Controller** (`inventoryController.js` createProduct): Logs error **code**, **detail**, **bodyKeys** (no full body). No `console.log(req.body)` in production.
- **Logger** (`utils/logger.js`): In production, console transport uses JSON format so Dokploy/Docker can parse it. Set **`LOG_LEVEL=debug`** only when debugging; use **`info`** or **`warn`** in production.

---

## Step 1 — Check backend container logs

See why the request is failing. Replace `<backend_container>` with your backend container name (Dokploy app name or run `docker ps` to see it):

```bash
dokploy logs <backend_container>
```

Or with Docker directly:

```bash
docker logs <backend_container> --tail 100
```

Look for:

- **`[Express Error]`** — full error message, code, and stack (see "Full Express error logging" above).
- **`Create product error`** — controller-level log with code, detail, bodyKeys.
- **Database connection failed** — DB unreachable; check `DATABASE_URL` / DB container.
- **Missing table/column** — schema not applied or out of date; apply schema (Step 4).
- **Validation error** — missing/invalid `name`, `sku`, or `base_price`; fix request body (400 response).

In development, the API returns the real error in the response body on 500: `message`, `code`, `detail`. In production, 500 responses show a generic "Internal server error"; use backend logs for the real cause.

---

## Step 2 — Ensure the database is running

Check that the Postgres container is up:

```bash
docker ps
```

You should see your database container (e.g. `iphone-center-database-...`). If not, start it:

```bash
docker start <db_container_name>
```

In Dokploy: open the PostgreSQL app and start it if stopped.

---

## Step 3 — Backend environment variables

The backend needs a PostgreSQL connection. In the **backend** app (Dokploy → your backend app → Environment), set **one** of:

**Option A — Single URL (recommended)**  
Copy the **Internal Connection URL** from your PostgreSQL app’s **Internal Credentials** in Dokploy:

```
DATABASE_URL=postgresql://user_iphone_center:PASSWORD@iphone-center-database-xxxxx:5432/iphone-center-db
```

**Option B — Separate vars**

```
DB_HOST=iphone-center-database-xxxxx
DB_PORT=5432
DB_USER=user_iphone_center
DB_PASSWORD=<password>
DB_NAME=iphone-center-db
```

Use the **internal hostname** from the DB’s Internal Credentials (e.g. `iphone-center-database-ewasbn`), not `localhost`.

Then restart the backend (replace `<backend_container>` with your backend app/container name):

```bash
dokploy restart <backend_container>
```

---

## Step 4 — Apply database schema

Tables are created automatically on backend startup from `backend/database/init.pg.sql`. If tables are missing or the error says “relation does not exist” or “column does not exist”, run the schema manually.

**From your machine** (if you can reach the DB). Run from the **project root** (parent of `backend/`):

```bash
# If DATABASE_URL is set in your environment:
psql "$DATABASE_URL" -f backend/database/init.pg.sql
```

Or with separate vars:

```bash
PGPASSWORD='YOUR_PASSWORD' psql -h <db_host> -p 5432 -U <db_user> -d <db_name> -f backend/database/init.pg.sql
```

Replace `<db_host>`, `<db_user>`, `<db_name>` with values from Dokploy → PostgreSQL → Internal Credentials.

**From the Postgres container** (Dokploy → PostgreSQL app → Terminal):

If the schema file is not inside the DB container, paste the contents of `backend/database/init.pg.sql` into the terminal, or use `wget`/`curl` from a public URL (see **RUN_SCHEMA.md**).

**From the server (Docker)** — run from the **project root** so the path to the file is correct. Use the same Docker network as your backend (check with `docker network ls`; often `dokploy_default`):

```bash
cd /path/to/your/project   # project root (contains backend/)
docker run --rm --network dokploy_default \
  -v "$(pwd)/backend/database/init.pg.sql:/init.pg.sql" \
  postgres:16-alpine \
  psql "postgresql://USER:PASSWORD@DB_HOST:5432/DB_NAME" -f /init.pg.sql
```

Replace `USER`, `PASSWORD`, `DB_HOST`, `DB_NAME` with values from Dokploy → PostgreSQL → Internal Credentials.

After applying the schema, **restart the backend**.

---

## Step 5 — Verify products table columns

Confirm the `products` table has the expected columns (e.g. `base_price`). Run from **project root**:

```bash
psql "$DATABASE_URL" -f backend/database/verify_products_columns.sql
```

If `DATABASE_URL` is not set, use: `PGPASSWORD='...' psql -h <host> -p 5432 -U <user> -d <dbname> -f backend/database/verify_products_columns.sql`

Or in `psql`:

```sql
SELECT column_name, data_type, is_nullable
  FROM information_schema.columns
 WHERE table_schema = 'public' AND table_name = 'products'
 ORDER BY ordinal_position;
```

You should see: `id`, `name`, `sku`, `description`, `category`, `brand`, `base_price`, `is_active`, `created_at`, `updated_at`. If `base_price` (or others) are missing, run **Step 4** again with the latest `init.pg.sql`.

---

## Step 6 — Test the API manually

The create-product endpoint **requires authentication** and expects **`name`**, **`sku`**, and **`base_price`** (not `price` or `quantity`).

### 6a. Get a JWT token

Login (replace URL and credentials with yours):

```bash
curl -s -X POST https://backend.iphonecenter.lk/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"YOUR_PASSWORD"}' | jq -r '.data.accessToken'
```

Or without `jq`:

```bash
curl -s -X POST https://backend.iphonecenter.lk/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"YOUR_PASSWORD"}'
```

Copy the `data.accessToken` value from the response.

### 6b. Create a product (correct body)

Use the token and the **correct** body fields:

```bash
curl -X POST https://backend.iphonecenter.lk/api/inventory/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "name": "Test Product",
    "sku": "TEST-SKU-001",
    "base_price": 100,
    "description": "Optional description",
    "category": "Phones",
    "brand": "Test",
    "initialQuantity": 10,
    "branchId": 1
  }'
```

- **Required:** `name` (string), `sku` (string), `base_price` (number).
- **Optional:** `description`, `category`, `brand`, `initialQuantity`, `branchId` (admin must send `branchId` for initial stock).

**Wrong (will fail):**

- `"price": 100` — use **`base_price`**, not `price`.
- `"quantity": 10` — use **`initialQuantity`** for stock; optionally **`branchId`** for which branch.
- Missing **`Authorization: Bearer <token>`** — returns 401.

If the request fails, the response body and backend logs (Step 1) will show the exact error (`message`, `code`, `detail`).

---

## Summary

| Issue | What to do |
|-------|------------|
| 500 + logs show “column does not exist” | Run init.pg.sql (Step 4), verify columns (Step 5), restart backend. |
| 500 + “null value in column” | Send all required fields: `name`, `sku`, `base_price`; ensure `base_price` is a number. |
| 500 + “connection refused” / “ENOTFOUND” | DB not running (Step 2) or wrong `DATABASE_URL` / `DB_HOST` (Step 3). |
| 401 on POST | Add header: `Authorization: Bearer <access_token>` (Step 6a). |
| 400 “Product name is required” / “Valid base price…” | Fix body: use `name`, `sku`, `base_price` (number). |
| 409 “SKU already exists” | Use a different `sku` value. |
