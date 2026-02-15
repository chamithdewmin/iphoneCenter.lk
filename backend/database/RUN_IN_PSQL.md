# Run schema from inside PostgreSQL container (psql)

You are in the **Postgres** container. The file `/app/database/schema.pg.sql` does **not** exist here (that path is only in the **backend** container).

Use one of these:

---

## Option 1: Copy file into container, then run (recommended)

**On your PC** (PowerShell or CMD), from the folder that has your project (or use the full path):

```bash
docker cp "D:\Iphone Center\backend\database\init.pg.sql" 73b395e80b7e:/tmp/init.pg.sql
```

Use your **actual Postgres container ID** if different (you had `73b395e80b7e`).

**Then inside the Postgres container** (in the same psql session where you see `iphonecenter=#`):

```sql
\i /tmp/init.pg.sql
```

Press Enter. You should see `CREATE TYPE`, `CREATE TABLE`, etc. Then:

```sql
\dt
\q
```

---

## Option 2: Paste the SQL

1. On your PC open: **`D:\Iphone Center\backend\database\init.pg.sql`**
2. Select all (Ctrl+A), copy (Ctrl+C)
3. In the terminal where you have `iphonecenter=#`, paste (Ctrl+V or right‑click Paste)
4. Press **Enter**
5. When it finishes, type `\dt` then `\q`

---

## If you're not in psql yet

Connect first (inside the Postgres container):

```bash
psql -U postgres -d iphonecenter
```

Then run `\i /tmp/init.pg.sql` (after copying the file as in Option 1) or paste the file contents (Option 2).
