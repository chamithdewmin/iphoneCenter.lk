# Debug 500 on POST /api/inventory/products (Dokploy + PostgreSQL)

Use this guide when `POST /api/inventory/products` returns 500. The backend has no ORM “model” – it uses raw SQL with `config/database.js` (pg pool).

---

## 1. Route and validation (reference)

**File:** `routes/inventoryRoutes.js`

```javascript
router.post('/products', authenticate, createProductValidation, handleValidationErrors, inventoryController.createProduct);
```

- **Middleware order:** authenticate → createProductValidation → handleValidationErrors → createProduct  
- **Validation:** `name`, `sku`, `base_price` (or `basePrice`) required; optional: `description`, `category`, `brand`, `initialQuantity`, `branchId` (integer ≥ 1).

---

## 2. Database schema: `products` table

**From:** `database/init.pg.sql`

```sql
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    sku VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    category VARCHAR(100),
    brand VARCHAR(100),
    base_price DECIMAL(10, 2) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Columns used by create product:** `name`, `sku`, `description`, `category`, `brand`, `base_price`. No product model file – the controller builds the INSERT from `req.body`.

---

## 3. Example request payload (frontend / Postman)

**Minimal (required only):**

```json
{
  "name": "iPhone 15 Pro",
  "sku": "IP15-091",
  "basePrice": 250000
}
```

**Full (admin must send `branchId`):**

```json
{
  "name": "iPhone 15 Pro",
  "sku": "IP15-091",
  "basePrice": 250000,
  "description": "128GB",
  "category": "Smartphone",
  "brand": "Apple",
  "initialQuantity": 5,
  "branchId": 70
}
```

- **Admin:** must send `branchId` (active branch id from `branches` table).  
- **Manager/Staff/Cashier:** do not send `branchId`; backend uses `req.user.branch_id`.  
- Use `basePrice` or `base_price` (number ≥ 0).

---

## 4. Commands to get logs and schema

**Backend container name** may be different (e.g. `iphone-center-backend-13nigw`). List running containers:

```bash
docker ps --filter "name=iphone-center" --format "table {{.Names}}\t{{.Status}}"
```

**Tail backend logs (replace container name if needed):**

```bash
docker logs $(docker ps -q --filter "name=iphone-center-backend") --tail=100
```

Or with explicit name:

```bash
docker logs iphone-center-backend-13nigw-xxxxx --tail=100
```

**Products table schema in PostgreSQL (replace user/db if needed):**

```bash
docker exec -it <POSTGRES_CONTAINER_NAME> psql -U Iphone_Center -d IphoneCenterDB -c "\d products"
```

Example (from earlier in this project):

```bash
docker exec -it iphone-center-database-fln2my.1.1q8x1uvzqrcrtoenh916awbnb psql -U Iphone_Center -d IphoneCenterDB -c "\d products"
```

**Check that backend is using the same database:**

Backend startup logs should show:

```
Database name: IphoneCenterDB (must match your data, e.g. IphoneCenterDB)
```

If you see `pos_system` or another name, set **DATABASE_URL** or **DB_NAME=IphoneCenterDB** in the backend environment and redeploy.

---

## 5. Exact causes of 500 and fixes

| Cause | What you see in logs / response | Fix |
|-------|----------------------------------|-----|
| **Wrong database** | `relation "products" does not exist` (42P01) or empty/wrong DB | Set **DATABASE_URL** (or **DB_NAME=IphoneCenterDB**) so backend uses the same DB where tables exist. Redeploy. |
| **DB connection failed** | `ECONNREFUSED`, `ENOTFOUND`, `ETIMEDOUT` | Use **internal** DB host from Dokploy (e.g. `iphone-center-database-xxxxx`), not `localhost`. Fix **DATABASE_URL** or **DB_HOST**. |
| **DB auth failed** | `28P01` or “authentication failed” | Correct **DB_USER** / **DB_PASSWORD** (or **DATABASE_URL**). |
| **Missing table** | `relation "products" does not exist` | Run `database/init.pg.sql` on that DB, or fix DB name so backend points to the DB where schema was applied. |
| **Invalid `branchId`** | Should return **400** “Selected branch not found…” | Use an existing active branch id (e.g. from `SELECT id FROM branches WHERE is_active = TRUE`). |
| **Admin without branchId** | **400** “Please select a branch for this product” | Send `branchId` in the request body for admin users. |
| **INSERT failed (e.g. type/constraint)** | Logs: “Create product error” with `code` / `detail` | Match request to schema: `base_price` number, `sku` unique, `name` non-empty. Check logs for Postgres `code` (e.g. 23505 = unique, 23502 = not null). |
| **Connection pool / getConnection** | “Create product error (outer)” in logs, no relation error | Check DB connectivity and pool config in `config/database.js`. Ensure backend env has correct **DATABASE_URL**. |

---

## 6. What to paste when asking for help

If you need to share for debugging, collect:

1. **Last 50–100 lines of backend logs** (from the command in section 4), especially around the time of the failing request.  
2. **Response body** of the 500 (Postman or browser Network tab).  
3. **Response headers** – note if `X-Error-Source: iphone-center-api` is present (confirms the body is from this app).  
4. **Exact request body** you sent (JSON).  
5. **Output of:**  
   `docker exec -it <db_container> psql -U Iphone_Center -d IphoneCenterDB -c "\d products"`  
   (so we can confirm schema matches.)

The logs will show either `[Express Error]` (global handler) or `Create product error` / `Create product error (outer)` (controller). The next line(s) will contain the real error message and, for Postgres, `code` and `detail`.

---

## 7. Quick checklist

- [ ] **DATABASE_URL** (or **DB_NAME**) points to **IphoneCenterDB** (or the DB where you ran init.pg.sql).  
- [ ] Backend startup log shows `Database name: IphoneCenterDB`.  
- [ ] Request includes **Authorization: Bearer &lt;token&gt;** (from `POST /api/auth/login`).  
- [ ] Body has **name**, **sku**, **basePrice** (or **base_price**).  
- [ ] For **admin**, body includes **branchId** = an existing active branch id.  
- [ ] **SKU** is unique (not already in `products`).  
- [ ] Backend container logs are checked for the real error when the 500 occurs.
