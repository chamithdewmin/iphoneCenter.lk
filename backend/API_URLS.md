# API URLs – Check if all endpoints are working

**Base URL (production):** `https://backend.iphonecenter.logozodev.com`  
**Base URL (local):** `http://localhost:5000`

**Database:** Installs on first run (tables created automatically). Use the URLs below to test the connection.

---

## Test database is connected

Open in browser or curl:

| Purpose | URL (production) |
|---------|-------------------|
| **Test DB connected** | https://backend.iphonecenter.logozodev.com/api/health/db |
| Same (alias) | https://backend.iphonecenter.logozodev.com/api/test-connection |

**Success:** You should see `"database": "connected"` and `"message": "Database connected. Tables ready."`  
**Failure:** You get 503 and `"database": "disconnected"` — check `DATABASE_URL` and that PostgreSQL is running.

---

## No auth (open in browser or curl)

| Check | Method | Full URL (production) |
|-------|--------|------------------------|
| Root | GET | https://backend.iphonecenter.logozodev.com/ |
| Health | GET | https://backend.iphonecenter.logozodev.com/api/health |
| **Health + DB (test DB)** | GET | https://backend.iphonecenter.logozodev.com/api/health/db |
| Test connection (same) | GET | https://backend.iphonecenter.logozodev.com/api/test-connection |

**Quick test in browser:** Open the health URL. You should see JSON like `{"status":"ok", ...}`.  
**DB test:** Open the **test database** URL above — if DB is connected you get `"database":"connected"`.

**If the panel shows "Database schema not applied..."** → Run the schema once on your PostgreSQL. See **RUN_SCHEMA.md** in this folder for step-by-step (Dokploy terminal, pgAdmin, or Docker).

---

## How to check token (correct way)

**Step 1 – Get a token:** Call **POST** `/api/auth/login` with body `{"username":"test","password":"test"}`.  
From the response, copy `data.accessToken`.

**Step 2 – Check token:** Call **GET** `/api/auth/profile` and add a **header** (not body):
- **Header name:** `Authorization`  
- **Header value:** `Bearer <paste_accessToken_here>`

Do **not** send username/password in the body of the profile request. Profile only needs the token in the header.

| Check | Method | Full URL (production) |
|-------|--------|------------------------|
| **Login (get token)** | POST | https://backend.iphonecenter.logozodev.com/api/auth/login |
| Profile (check token) | GET | https://backend.iphonecenter.logozodev.com/api/auth/profile |

---

## Auth required (send `Authorization: Bearer <token>`)

Replace `{id}` with a real ID when testing.

| Check | Method | Full URL (production) |
|-------|--------|------------------------|
| Profile | GET | https://backend.iphonecenter.logozodev.com/api/auth/profile |
| Customers list | GET | https://backend.iphonecenter.logozodev.com/api/customers |
| Customer by ID | GET | https://backend.iphonecenter.logozodev.com/api/customers/1 |
| Users list | GET | https://backend.iphonecenter.logozodev.com/api/users |
| Products list | GET | https://backend.iphonecenter.logozodev.com/api/inventory/products |
| Product by ID | GET | https://backend.iphonecenter.logozodev.com/api/inventory/products/1 |
| Sales list | GET | https://backend.iphonecenter.logozodev.com/api/billing/sales |
| Sale by ID | GET | https://backend.iphonecenter.logozodev.com/api/billing/sales/1 |
| Branches list | GET | https://backend.iphonecenter.logozodev.com/api/branches |
| Branch by ID | GET | https://backend.iphonecenter.logozodev.com/api/branches/1 |
| Daily summary | GET | https://backend.iphonecenter.logozodev.com/api/reports/daily-summary |
| Sales report | GET | https://backend.iphonecenter.logozodev.com/api/reports/sales |
| Profit report | GET | https://backend.iphonecenter.logozodev.com/api/reports/profit |
| Stock report | GET | https://backend.iphonecenter.logozodev.com/api/reports/stock |
| Due payments | GET | https://backend.iphonecenter.logozodev.com/api/reports/due-payments |
| Top products | GET | https://backend.iphonecenter.logozodev.com/api/reports/top-products |

---

## POST/PUT (use Postman, curl, or frontend)

- **Login (no token):** `POST https://backend.iphonecenter.logozodev.com/api/auth/login`  
  Body: `{"username":"test","password":"test"}` (if test login is enabled)
- **Register:** `POST .../api/auth/register` (needs admin token)
- **Create customer:** `POST .../api/customers` (body: `{"name":"..."}`)
- **Create product:** `POST .../api/inventory/products`
- **Create sale:** `POST .../api/billing/sales`

---

## One URL to check “is the API up?”

Open in browser:

**https://backend.iphonecenter.logozodev.com/api/health**

If you see `{"status":"ok", ...}` → API is running.  
Then open **https://backend.iphonecenter.logozodev.com/api/health/db** — if you see `"database":"connected"` → DB is working too.
