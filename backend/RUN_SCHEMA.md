# Fix: "Database schema not applied"

**From the latest version:** The backend **auto-creates all tables** on startup using `backend/database/init.pg.sql`. When you deploy or restart the backend, it runs this script so you usually **don’t need to run the schema manually**. If you still see the error, use one of the options below or check that `DATABASE_URL` is set and the DB is reachable.

That message means the backend is connected to PostgreSQL, but the **tables** (`customers`, `users`, `branches`, etc.) do not exist yet. You can run the schema **once** manually (options below) or redeploy/restart the backend so it runs the auto-init.

---

## Option 1: From Dokploy – PostgreSQL container terminal (easiest if repo is public)

1. In **Dokploy**, open your **PostgreSQL** application (e.g. `iphone-center-database`).
2. Open **Terminal** / **Exec** (shell inside the Postgres container).
3. Run this (replace `YOUR_PASSWORD` with the password from Internal Credentials, and fix the GitHub URL if your repo/branch is different):

```bash
PGPASSWORD='YOUR_PASSWORD' wget -qO- 'https://raw.githubusercontent.com/chamithdewmin/iphoneCenter.lk/main/backend/database/schema.pg.sql' | psql -U user_iphone_center -d iphone-center-db -h localhost
```

- If the repo is **private**, use **Option 2** or **Option 3** instead.
- If `wget` is not available in the container, try:
  ```bash
  PGPASSWORD='YOUR_PASSWORD' curl -sL 'https://raw.githubusercontent.com/chamithdewmin/iphoneCenter.lk/main/backend/database/schema.pg.sql' | psql -U user_iphone_center -d iphone-center-db -h localhost
  ```

4. You should see `CREATE TYPE`, `CREATE TABLE`, etc. If there are no errors, the schema is applied.
5. **Restart the backend** app in Dokploy (or wait for the next request). The panel should stop showing "Database schema not applied".

---

## Option 2: From your computer (pgAdmin, DBeaver, or psql)

Use this if you can connect to your PostgreSQL from your PC (e.g. you exposed the DB port or use a tunnel).

1. Get the **connection details** from Dokploy → PostgreSQL → Internal Credentials:
   - Host (e.g. your server IP if port is exposed)
   - Port: 5432
   - User: `user_iphone_center`
   - Password: (from Internal Credentials)
   - Database: `iphone-center-db`

2. Connect with **pgAdmin**, **DBeaver**, or **psql**.

3. Run the schema file:
   - **pgAdmin / DBeaver:** Open `backend/database/schema.pg.sql` and execute it (Query Tool / Execute).
   - **psql (Windows PowerShell):**
     ```powershell
     $env:PGPASSWORD='YOUR_PASSWORD'; psql -h YOUR_HOST -p 5432 -U user_iphone_center -d iphone-center-db -f "D:\Iphone Center\backend\database\schema.pg.sql"
     ```
   - **psql (Mac/Linux):**
     ```bash
     PGPASSWORD='YOUR_PASSWORD' psql -h YOUR_HOST -p 5432 -U user_iphone_center -d iphone-center-db -f backend/database/schema.pg.sql
     ```

4. Restart the backend app (or reload the panel). The error should go away.

---

## Option 3: From the server (SSH) with Docker

Use this if you have SSH to the server where Dokploy runs and the repo (or schema file) is there.

1. SSH into the server.
2. Go to the project folder (or copy `backend/database/schema.pg.sql` there).
3. Run (replace `YOUR_PASSWORD` and ensure the network name matches the one used by your backend; list with `docker network ls`):

```bash
docker run --rm \
  --network dokploy_default \
  -v "$(pwd)/backend/database/schema.pg.sql:/schema.pg.sql" \
  postgres:16-alpine \
  psql "postgresql://user_iphone_center:YOUR_PASSWORD@iphone-center-database-2r1ljm:5432/iphone-center-db" -f /schema.pg.sql
```

If your backend uses a different Docker network, replace `dokploy_default` (e.g. inspect the backend container: `docker inspect <backend_container_id>` and check `Networks`).

4. Restart the backend. The panel should work.

---

## After running the schema

- **Restart the backend** in Dokploy (Stop → Deploy, or Redeploy).
- Reload the frontend panel; pages that use customers, users, products, etc. should load without "Database schema not applied".

If you still see errors, check the **backend container logs** in Dokploy for the exact PostgreSQL error (e.g. permission or missing table).
