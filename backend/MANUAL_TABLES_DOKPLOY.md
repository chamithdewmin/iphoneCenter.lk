# Add tables manually in PostgreSQL (Dokploy UI)

Use this when you want to create the tables yourself from the Dokploy interface.

---

## If the wget/curl one-liner did nothing

Many Postgres containers **don’t have wget/curl** or have **no outbound internet**, so the pipe command can fail silently.

**Do this instead:**

1. In Dokploy → PostgreSQL app → open **Terminal** / **Exec**.
2. Connect:  
   `PGPASSWORD='nB59FuECHEeNG5cOZ6pi' psql -U user_iphone_center -d iphone-center-db -h localhost`
3. On your PC open **`D:\Iphone Center\backend\database\init.pg.sql`**, select all (Ctrl+A), copy (Ctrl+C).
4. In the terminal, paste (Ctrl+V) into the `psql` prompt, then press **Enter**.
5. When it finishes, type `\dt` to see tables, then `\q` to exit.

That’s the most reliable way when the one-liner does nothing.

---

## Step 1: Open the PostgreSQL app in Dokploy

1. Log in to **Dokploy**.
2. Open the project that has your **PostgreSQL** database (e.g. `iphone-center-database`).
3. Click the **PostgreSQL** application (the database service, not the backend).

---

## Step 2: Open a terminal in the Postgres container

1. In the PostgreSQL app page, look for one of:
   - **Terminal**
   - **Exec**
   - **Console**
   - **Shell** (or “Open Shell”)
2. Click it. A terminal opens **inside** the PostgreSQL container (you’ll see a shell prompt like `#` or `$`).

---

## Step 3: Connect to your database

From **Internal Credentials** (on the same PostgreSQL app page in Dokploy), note:

- **User:** e.g. `user_iphone_center`
- **Database Name:** e.g. `iphone-center-db`
- **Password:** (copy it)

In the terminal, connect with `psql` (replace with your actual user, database, and password):

```bash
PGPASSWORD='nB59FuECHEeNG5cOZ6pi' psql -U user_iphone_center -d iphone-center-db -h localhost
```

(Use your real password from Internal Credentials.)

You should see a prompt like `iphone-center-db=>`.

---

## Step 4: Run the schema (create tables)

**Option A – Download and run from GitHub (if repo is public)**

Exit psql first (`\q`), then in the same terminal run:

```bash
PGPASSWORD='nB59FuECHEeNG5cOZ6pi' wget -qO- 'https://raw.githubusercontent.com/chamithdewmin/iphoneCenter.lk/main/backend/database/init.pg.sql' | psql -U user_iphone_center -d iphone-center-db -h localhost
```

Use `init.pg.sql` (safe to run more than once). If you only have `schema.pg.sql` in the repo, use that URL instead. Replace `YOUR_PASSWORD` with the real password.

**Option B – Run SQL by pasting inside psql (use this if the wget/curl command did nothing)**

1. Stay in the `psql` session (or connect again with the command from Step 3). You should see a prompt like `iphone-center-db=>`.
2. On your computer, open the file **`D:\Iphone Center\backend\database\init.pg.sql`** in Notepad or Cursor (your iPhone Center project).
3. Select **all** the text (Ctrl+A), then copy (Ctrl+C).
4. In the Dokploy terminal, **click in the psql window** and paste (Ctrl+V or right‑click Paste). The whole script will be inserted.
5. Press **Enter**. PostgreSQL runs the script. You should see lines like `CREATE TYPE`, `CREATE TABLE`, `CREATE INDEX`, etc. Ignore “already exists” if you run it again.
6. When the prompt returns (`iphone-center-db=>`), type `\dt` and Enter to list tables.

If the terminal doesn’t paste well, paste in smaller chunks (e.g. copy from “DO $$ BEGIN” up to the next “END $$;” and run, then the next block).

---

## Step 5: Check that tables exist

Still in `psql`, run:

```sql
\dt
```

You should see a list of tables: `branches`, `users`, `customers`, `products`, `sales`, etc.

Then type `\q` and Enter to exit psql.

---

## Step 6: Restart the backend

In Dokploy, open your **backend** app and **Restart** (or Redeploy) it. The app should now see the tables and the “Database schema not applied” error should go away.

---

## If Dokploy has “Database” / “Query” UI

Some setups expose a web UI to run SQL:

1. Open the PostgreSQL app in Dokploy.
2. If you see **Database**, **Query**, **SQL**, or **phpPgAdmin** (or similar), open it.
3. Log in with the same **User**, **Password**, and **Database name** from Internal Credentials.
4. Open a “Query” or “SQL” window, paste the full contents of **`backend/database/init.pg.sql`**, and run it.

If your Dokploy doesn’t show this, use the Terminal method above.

---

## Quick reference (from Dokploy terminal)

```bash
# 1) Set password (use your real one from Internal Credentials)
export PGPASSWORD='YOUR_PASSWORD'

# 2) Connect
psql -U user_iphone_center -d iphone-center-db -h localhost

# 3) Inside psql: list tables
\dt

# 4) Exit
\q
```

To run the schema in one go from the shell (after \q):

```bash
PGPASSWORD='YOUR_PASSWORD' wget -qO- 'https://raw.githubusercontent.com/chamithdewmin/iphoneCenter.lk/main/backend/database/init.pg.sql' | psql -U user_iphone_center -d iphone-center-db -h localhost
```

Replace `YOUR_PASSWORD` and the GitHub URL/branch if yours is different.
