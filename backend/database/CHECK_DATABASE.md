# Check database tables (PostgreSQL)

Use these commands to verify your database has the required tables and data for the backend (e.g. after 500 on POST /api/inventory/products).

---

## 0. Already inside `psql` (e.g. after `docker exec -it ... psql -U Iphone_Center -d IphoneCenterDB`)

**Do not run shell commands** like `psql -U ... -c "..."` at the `IphoneCenterDB=#` prompt — that causes "syntax error at or near psql". Run **only** the SQL below (paste one block at a time):

```sql
-- Required tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
  AND table_name IN ('branches','users','refresh_tokens','products','branch_stock','barcodes','product_imeis','stock_transfers','customers','sales','sale_items','payments','refunds','audit_logs')
ORDER BY table_name;
```

```sql
-- Row counts (need at least 1 branch and 1 user)
SELECT 'branches' AS tbl, COUNT(*) AS cnt FROM branches
UNION ALL SELECT 'users', COUNT(*) FROM users
UNION ALL SELECT 'products', COUNT(*) FROM products
UNION ALL SELECT 'barcodes', COUNT(*) FROM barcodes
UNION ALL SELECT 'branch_stock', COUNT(*) FROM branch_stock;
```

```sql
-- Branches (must have at least one active)
SELECT id, name, code, is_active FROM branches ORDER BY id;
```

```sql
-- Users (must have at least one active)
SELECT id, username, role, branch_id FROM users WHERE is_active = TRUE ORDER BY id LIMIT 10;
```

If any table is missing from the first query, run the schema from **outside** psql (see section 1 or 2). If `branches` or `users` count is 0, add a branch/user.

---

## 1. From your computer (if you have `psql` and network access to DB)

Replace `USER`, `PASSWORD`, `HOST`, `DB` with values from **Dokploy → PostgreSQL → Internal Credentials** (or your connection string). Use the **internal** hostname (e.g. `iphone-center-database-xxxxx`) if the DB is in the same Dokploy project.

```bash
# Single connection string (recommended)
psql "postgresql://USER:PASSWORD@HOST:5432/DB" -f backend/database/verify_tables.sql

# Or separate vars
export PGPASSWORD='PASSWORD'
psql -h HOST -p 5432 -U USER -d DB -f backend/database/verify_tables.sql
```

---

## 2. From Dokploy: terminal into the **database** container

1. In Dokploy, open your **PostgreSQL** application.
2. Open **Terminal** (or use a shell that can run inside the DB container).
3. Run (replace `USER` and `DB` with your DB user and database name):

```bash
# If psql is available and you're inside the DB container:
psql -U USER -d DB -f /path/to/verify_tables.sql
```

If the schema was applied there, the working directory may not have the file. Use the inline check instead:

```bash
psql -U user_iphone_center -d iphone-center-db -c "
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
AND table_name IN ('branches','users','products','barcodes','branch_stock')
ORDER BY 1;
"
```

```bash
# Row counts (need at least 1 branch and 1 user)
psql -U user_iphone_center -d iphone-center-db -c "
SELECT 'branches' AS tbl, COUNT(*) FROM branches
UNION ALL SELECT 'users', COUNT(*) FROM users
UNION ALL SELECT 'products', COUNT(*) FROM products;
"
```

```bash
# List branches (must have at least one active for adding products)
psql -U user_iphone_center -d iphone-center-db -c "SELECT id, name, code, is_active FROM branches;"
```

---

## 3. From Dokploy: terminal into the **backend** container

If the backend container has network access to the DB and you have the connection string in env:

```bash
# One-liner: run verify script (if database/ is in the image)
node -e "
const { Client } = require('pg');
const cs = process.env.DATABASE_URL;
if (!cs) { console.error('DATABASE_URL not set'); process.exit(1); }
const c = new Client({ connectionString: cs });
c.connect()
  .then(() => c.query(\"SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('branches','users','products','barcodes','branch_stock') ORDER BY 1\"))
  .then(r => { console.log('Tables:', r.rows.map(x => x.table_name)); return c.query('SELECT COUNT(*) FROM branches') })
  .then(r => { console.log('Branches count:', r.rows[0].count); return c.query('SELECT COUNT(*) FROM users') })
  .then(r => { console.log('Users count:', r.rows[0].count); c.end(); })
  .catch(e => { console.error('Error:', e.message); process.exit(1); });
"
```

---

## 4. What you need for “Add product” to work

| Requirement | How to check |
|-------------|--------------|
| Table `branches` exists | In verify output, `branches` appears in table list. |
| Table `users` exists | `users` in table list. |
| Table `products` exists | `products` in table list. |
| Table `barcodes` exists | `barcodes` in table list. |
| Table `branch_stock` exists | `branch_stock` in table list. |
| At least 1 active branch | `SELECT id, name FROM branches WHERE is_active = TRUE;` returns at least one row. |
| At least 1 active user | `SELECT id, username, role FROM users WHERE is_active = TRUE;` returns at least one row. |

If any table is missing, run the full schema:

```bash
psql "postgresql://USER:PASSWORD@HOST:5432/DB" -f backend/database/init.pg.sql
```

If **branches** is empty, add one (e.g. in Dokploy DB terminal):

```sql
INSERT INTO branches (name, code, is_active) VALUES ('Main Store', 'MAIN', TRUE);
```

Then redeploy or restart the backend and try adding a product again.
