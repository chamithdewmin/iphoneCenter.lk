# Fix 502 Bad Gateway on backend.iphonecenter.lk (Dokploy)

**Symptoms:** `502 (Bad Gateway)` when opening https://backend.iphonecenter.lk/ and "can not get logs from container which is dead or marked for removal".

**Cause:** The backend container **exits on startup** (so it is "dead"). The proxy then returns 502 because there is no process listening on port 5000.

---

## 1. Required environment variables (Dokploy → Backend app → Environment)

Set these in your **backend** application in Dokploy (not in code). Missing or wrong values will make the process exit and the container die.

| Variable | Required | Notes |
|----------|----------|--------|
| `NODE_ENV` | Yes | Set to `production` |
| `PORT` | Optional | Default `5000` – must match what Dokploy/proxy expects |
| **Database (use one of the two options below)** | | |
| `DATABASE_URL` | **Recommended** | Full URL, e.g. `postgresql://USER:PASSWORD@HOST:5432/DATABASE` |
| **OR** `DB_HOST` + `DB_USER` + `DB_PASSWORD` + `DB_NAME` | | Host = internal Postgres service name (e.g. `postgres` or your Postgres app name in Dokploy). Port defaults to `5432`; set `DB_PORT` if different. |
| `JWT_SECRET` | **Yes** | Long random string; **must be 32+ characters** in production |
| `JWT_REFRESH_SECRET` | **Yes** | Long random string; **must be 32+ characters** in production |
| `CORS_ORIGIN` | Yes for frontend | Your frontend URL, e.g. `https://iphonecenter.lk` or `https://cloud.iphonecenter.lk` (comma-separated if multiple) |

**Example `DATABASE_URL`** (get user/password/database from your Postgres app’s Internal Credentials in Dokploy):

```text
postgresql://user_iphone_center:YOUR_PASSWORD@postgres:5432/iphone-center-db
```

Replace `postgres` with the **internal hostname** of your PostgreSQL service in Dokploy (often the app/service name). Use the same user, password, and database name as in the Postgres app.

---

## 2. Ensure PostgreSQL is running and reachable

- The backend uses **PostgreSQL** (port 5432), not MySQL.
- In Dokploy, your **backend** and **PostgreSQL** must be in the same project/network so the backend can connect to the DB host (e.g. `postgres` or the name shown in Dokploy).
- If the DB is in another project, use the full internal hostname or a DATABASE_URL that points to it.

---

## 3. Tables must exist (first deploy)

On first deploy the backend runs `database/init.pg.sql` automatically. If it cannot connect to Postgres, startup fails and the container exits (502).

- If you prefer to create tables yourself, see **MANUAL_TABLES_DOKPLOY.md**.
- After creating tables, **restart the backend** so it can connect and serve.

---

## 4. How to see why the container died

After a failed deploy:

1. In Dokploy, open the **backend** application.
2. Check **Build logs** and **Deploy logs** (not only “container logs”, which are unavailable once the container is dead).
3. Look for lines right after “Database: verifying PostgreSQL…” or “Startup failed:” – the next lines usually show the real error (e.g. missing `JWT_SECRET`, or database connection refused).

If you see:

- **"Missing required environment variables: JWT_SECRET, JWT_REFRESH_SECRET"** → Add both in the backend Environment tab; use 32+ character random strings.
- **"Database connection error" / "Database verification failed"** → Fix `DATABASE_URL` or `DB_HOST`/`DB_USER`/`DB_PASSWORD`/`DB_NAME` so they point to your running Postgres (correct host, port 5432, user, password, database).

---

## 5. Quick checklist

- [ ] PostgreSQL app is running in Dokploy (same project as backend or reachable host).
- [ ] Backend has `DATABASE_URL` **or** `DB_HOST` + `DB_USER` + `DB_PASSWORD` + `DB_NAME` (and `DB_PORT` if not 5432).
- [ ] Backend has `JWT_SECRET` and `JWT_REFRESH_SECRET`, each 32+ characters.
- [ ] Backend has `NODE_ENV=production` and `CORS_ORIGIN` set to your frontend URL(s).
- [ ] Redeploy the backend after changing env vars; check build/deploy logs if you still get 502.

After fixing env vars and redeploying, https://backend.iphonecenter.lk/health should return `{"status":"ok",...}` and the 502 should stop.
