# API URLs – Check if all endpoints are working

**Base URL (production):** `https://backend.iphonecenter.logozodev.com`  
**Base URL (local):** `http://localhost:5000`

**API prefix:** `/api` — so full URL = base + path below.

---

## No auth (open in browser or curl)

| Check | Method | Full URL (production) |
|-------|--------|------------------------|
| Root | GET | https://backend.iphonecenter.logozodev.com/ |
| Health | GET | https://backend.iphonecenter.logozodev.com/api/health |
| Health + DB | GET | https://backend.iphonecenter.logozodev.com/api/health/db |
| Test connection | GET | https://backend.iphonecenter.logozodev.com/api/test-connection |

**Quick test in browser:** Open the health URL. You should see JSON like `{"status":"ok", ...}`.  
**DB test:** Open `/api/health/db` or `/api/test-connection` — if DB is connected you get `"database":"connected"`.

**If the panel shows "Database schema not applied..."** → Run the schema once on your PostgreSQL. See **RUN_SCHEMA.md** in this folder for step-by-step (Dokploy terminal, pgAdmin, or Docker).

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
