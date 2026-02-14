# iPhone Center – Architecture Summary

How the project connects to the database and how the frontend talks to the backend (with code references).

---

## 1. High-level flow

```
┌─────────────────┐         HTTP/HTTPS          ┌─────────────────┐         SQL           ┌──────────────┐
│   Frontend      │  ──── GET/POST /api/... ────►│   Backend       │  ──── pool.query ────►│  PostgreSQL  │
│   (React+Vite)  │  ◄──── JSON response ────────│   (Node+Express)│  ◄──── rows ─────────│  (DB)        │
└─────────────────┘                              └─────────────────┘                       └──────────────┘
```

- **Frontend**: React + Vite. Uses `fetch()` with `getApiBaseUrl()` / `getApiUrl()` and `authFetch()` from `frontend/src/lib/api.js`.
- **Backend**: Node.js + Express. Uses **PostgreSQL** via `pg` and a single connection **pool**.
- **Database**: PostgreSQL (schema in `backend/database/schema.pg.sql`). Tables must be created once (run the schema on your DB).

---

## 2. Database connection (backend)

**Where:** `backend/config/database.js`

- Loads env via `require('dotenv').config()` (from `server.js`).
- Uses either:
  - **`DATABASE_URL`** (e.g. `postgresql://user:pass@host:5432/iphone-center-db`), or
  - **Individual vars:** `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`.
- Exports **pool**, **executeQuery**, **getConnection** (transaction helper). All routes use `executeQuery` or `getConnection` for DB access.
- Converts `?` placeholders to PostgreSQL `$1, $2, ...` internally.

```javascript
// backend/config/database.js (simplified)
const connectionString = process.env.DATABASE_URL || (process.env.DB_HOST ? (...) : null);
const pool = new Pool({
    connectionString: connectionString || 'postgresql://localhost:5432/pos_system',
    max: 10,
    ...
});
// executeQuery(query, params) → [rows]
// getConnection() → { beginTransaction, execute, commit, rollback, release }
```

**Startup:** In `server.js`, the app starts without running migrations; you must run `backend/database/schema.pg.sql` once on your PostgreSQL instance (see `backend/DEPLOYMENT.md`).

**Tables (main):**

| Table            | Purpose                    |
|------------------|----------------------------|
| `branches`       | Store branches             |
| `users`          | Users + auth (JWT)        |
| `refresh_tokens` | Refresh tokens             |
| `customers`      | Customers                  |
| `products`       | Products                   |
| `branch_stock`   | Stock per branch           |
| `sales`          | Sales / billing            |
| `sale_items`     | Sale line items            |
| `payments`       | Payments                   |

---

## 3. How the frontend gets the API base URL

**Where:** `frontend/src/lib/api.js`

- **Production:** backend root = `https://backend.iphonecenter.logozodev.com` (no trailing slash).
- **Local:** `http://localhost:5000` (or set in `.env`).
- **Override:** set **`VITE_API_URL`** in frontend `.env` (or build env in Dokploy). This is the **backend origin** (no `/api` in the URL).

Helpers:

- **`getApiUrl()`** – returns backend origin (e.g. `https://backend.iphonecenter.logozodev.com`).
- **`getApiBaseUrl()`** – returns backend API base (e.g. `https://backend.iphonecenter.logozodev.com/api`). Use for building paths like `getApiBaseUrl() + '/customers'`.

All authenticated API calls use **`authFetch(path, options)`**, which builds the URL as `getApiUrl() + path`. Paths include `/api/...` (e.g. `authFetch('/api/customers')`).

---

## 4. API → backend route → database mapping

All API routes are mounted under `/api` in `backend/server.js`:

- `app.use('/api/auth', authRoutes);`
- `app.use('/api/branches', branchRoutes);`
- `app.use('/api/inventory', inventoryRoutes);`
- `app.use('/api/billing', billingRoutes);`
- `app.use('/api/reports', reportsRoutes);`
- `app.use('/api/customers', customerRoutes);`
- `app.use('/api/users', userRoutes);`

So **backend API base** = `http(s)://<backend-host>/api`.

---

### Public / no auth

| Frontend use           | Method | API path        | Backend route file      | DB operation              |
|------------------------|--------|-----------------|-------------------------|---------------------------|
| Health check           | GET    | `/api/health`   | server.js               | None                      |
| Health + DB check      | GET    | `/api/health/db`| server.js               | pool.query('SELECT 1')    |
| Test connection (DB)   | GET    | `/api/test-connection` | server.js         | pool.query('SELECT 1')    |
| Login                  | POST   | `/api/auth/login`      | authRoutes.js    | Test user or SELECT users |

---

### Protected (auth: Bearer token in `Authorization` header)

| Frontend use        | Method | API path                    | Backend route file     | DB operation           |
|---------------------|--------|-----------------------------|------------------------|------------------------|
| Profile             | GET    | `/api/auth/profile`         | authRoutes.js          | Test user or SELECT users |
| Register user       | POST   | `/api/auth/register`       | authRoutes.js          | INSERT users           |
| Refresh token       | POST   | `/api/auth/refresh`        | authRoutes.js          | refresh_tokens          |
| Logout              | POST   | `/api/auth/logout`         | authRoutes.js          | Revoke token           |
| Customers list      | GET    | `/api/customers`            | customerRoutes.js      | SELECT customers       |
| Customer by ID      | GET    | `/api/customers/:id`       | customerRoutes.js      | SELECT customers       |
| Create customer     | POST   | `/api/customers`            | customerRoutes.js      | INSERT customers       |
| Update customer     | PUT    | `/api/customers/:id`       | customerRoutes.js      | UPDATE customers       |
| Users list          | GET    | `/api/users`               | userRoutes.js          | SELECT users           |
| Products list       | GET    | `/api/inventory/products`  | inventoryRoutes.js     | SELECT products (+ stock) |
| Create product      | POST   | `/api/inventory/products`  | inventoryRoutes.js     | INSERT products        |
| Sales list          | GET    | `/api/billing/sales`       | billingRoutes.js       | SELECT sales           |
| Create sale         | POST   | `/api/billing/sales`        | billingRoutes.js       | INSERT sales, sale_items, payments |
| Branches list       | GET    | `/api/branches`             | branchRoutes.js        | SELECT branches        |
| Daily summary       | GET    | `/api/reports/daily-summary`| reportsRoutes.js      | SELECT aggregates      |

---

## 5. Code flow examples

### Example 1: Login

1. **Frontend** (`frontend/src/contexts/AuthContext.jsx`):  
   Builds URL from `VITE_API_URL` + `/api/auth/login`, then  
   `fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) })`.
2. **Backend** (`backend/routes/authRoutes.js`): POST `/api/auth/login` → authController.login (test user or DB user), returns `{ success, data: { accessToken, refreshToken, user } }`.
3. Frontend stores tokens via `setTokens(accessToken, refreshToken)` and sets user in context.

### Example 2: Customers list

1. **Frontend** (e.g. `frontend/src/pages/Customers.jsx`):  
   `authFetch('/api/customers')` → in `api.js` this is  
   `fetch(getApiUrl() + '/api/customers', { headers: { Authorization: 'Bearer ' + token } })`.
2. **Backend** (`backend/routes/customerRoutes.js`): GET `/api/customers` protected by `authenticate` (JWT), then customerController.getAllCustomers →  
   `executeQuery('SELECT * FROM customers WHERE 1=1 ... ORDER BY name ASC', params)`.
3. Response: `{ success: true, data: customers }`.

### Example 3: Create customer

1. **Frontend** (`frontend/src/pages/people/customers/AddCustomer.jsx`):  
   `authFetch('/api/customers', { method: 'POST', body: JSON.stringify({ name, phone, email, address }) })`.
2. **Backend** (`backend/controllers/customerController.js`): createCustomer → getConnection(), INSERT into customers, commit.
3. Response: `{ success: true, message: '...', data: { id, name } }`.

---

## 6. Important files quick reference

| Purpose              | File(s) |
|----------------------|--------|
| DB connection        | `backend/config/database.js` |
| DB schema            | `backend/database/schema.pg.sql` |
| API base URL & auth  | `frontend/src/lib/api.js` → `getApiUrl()`, `getApiBaseUrl()`, `authFetch()` |
| Auth context         | `frontend/src/contexts/AuthContext.jsx` |
| Backend app & routes | `backend/server.js` |
| Auth API             | `backend/routes/authRoutes.js` |
| Customers API        | `backend/routes/customerRoutes.js` |
| Users API            | `backend/routes/userRoutes.js` |
| Inventory API        | `backend/routes/inventoryRoutes.js` |
| Billing API          | `backend/routes/billingRoutes.js` |
| Reports API          | `backend/routes/reportsRoutes.js` |
| Branches API         | `backend/routes/branchRoutes.js` |
| Auth middleware      | `backend/middleware/auth.js` (JWT Bearer) |
| Error handler        | `backend/middleware/errorHandler.js` |

---

## 7. Environment (summary)

**Backend (`.env` or Dokploy Environment):**

- **`DATABASE_URL`** or `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` for PostgreSQL.
- **`JWT_SECRET`**, **`JWT_REFRESH_SECRET`** (required; 32+ chars in production).
- **`CORS_ORIGIN`** – frontend origin (e.g. `https://iphonecenter.logozodev.com`).
- **`PORT`** (default 5000).
- Optional: `TEST_LOGIN_USERNAME`, `TEST_LOGIN_PASSWORD` for demo login without DB.

**Frontend:**

- **`VITE_API_URL`** – backend origin, no trailing slash (e.g. `https://backend.iphonecenter.logozodev.com`). For local: `http://localhost:5000`.

**CORS** (`backend/server.js`): Uses `CORS_ORIGIN` in production; credentials allowed.

---

Full path: **frontend → getApiUrl() + path → backend /api routes → executeQuery / pool (database.js) → PostgreSQL**. Auth for protected routes via **Bearer** token in `Authorization` header (tokens stored in localStorage; user data from server).
