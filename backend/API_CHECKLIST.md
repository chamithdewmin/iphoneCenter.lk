# API checklist – endpoints to check

Use your backend base URL, e.g. `https://backend.iphonecenter.logozodev.com`.

---

## No auth (good for quick checks)

| Method | Path | How to check |
|--------|------|----------------|
| GET | `/` | Open in browser or `curl`. Expect `{"ok":true,"service":"iphone-center-api",...}` |
| GET | `/health` or `/api/health` | Expect `{"status":"ok","timestamp":"...","uptime":...}` |
| GET | `/health/db` or `/api/health/db` | Expect `{"status":"ok","database":"connected"}` or 503 if DB down |
| GET | `/api/auth/login` | Expect 405 + message "Method not allowed. Use POST..." |

---

## Auth (no token)

| Method | Path | Body | How to check |
|--------|------|------|----------------|
| POST | `/api/auth/login` | `{"username":"test","password":"test"}` | Expect 200 + `accessToken`, `refreshToken`, `user`. Use for test/demo login. |

---

## Auth (with Bearer token)

Use header: `Authorization: Bearer <accessToken>` (from login response).

| Method | Path | Note |
|--------|------|------|
| GET | `/api/auth/profile` | Current user |
| POST | `/api/auth/refresh` | Body: `{"refreshToken":"..."}` |
| POST | `/api/auth/logout` | Body: `{"refreshToken":"..."}` (optional) |
| POST | `/api/auth/register` | Admin only. Body: username, email, password, fullName, role, branchId? |

| Method | Path | Note |
|--------|------|------|
| GET | `/api/branches` | List branches |
| GET | `/api/branches/:id` | One branch |
| POST | `/api/branches` | Manager/Admin. Create branch |
| PUT | `/api/branches/:id` | Manager/Admin |
| DELETE | `/api/branches/:id` | Manager/Admin. Disable |

| Method | Path | Note |
|--------|------|------|
| GET | `/api/inventory/products` | ?search=&category=&brand= |
| GET | `/api/inventory/products/:id` | |
| POST | `/api/inventory/products` | Manager/Admin. Create product |
| GET | `/api/inventory/stock` | Branch stock |
| PUT | `/api/inventory/stock` | Manager/Admin |
| POST | `/api/inventory/imei` | Manager/Admin |
| GET | `/api/inventory/imei` | ?productId=&status= |
| POST | `/api/inventory/transfers` | Manager/Admin |
| PUT | `/api/inventory/transfers/:id/complete` | Manager/Admin |
| GET | `/api/inventory/barcode/generate/:productId` | Manager/Admin |
| GET | `/api/inventory/barcode/validate/:barcode` | |

| Method | Path | Note |
|--------|------|------|
| POST | `/api/billing/sales` | Create sale |
| GET | `/api/billing/sales` | ?startDate=&endDate=&paymentStatus=&customerId=&limit=&offset= |
| GET | `/api/billing/sales/:id` | |
| POST | `/api/billing/sales/:saleId/payments` | Add payment |
| PUT | `/api/billing/sales/:id/cancel` | Manager/Admin |
| POST | `/api/billing/sales/:saleId/refunds` | Manager/Admin |
| PUT | `/api/billing/refunds/:id/process` | Manager/Admin |

| Method | Path | Note |
|--------|------|------|
| GET | `/api/reports/sales` | ?startDate=&endDate=&branchId= |
| GET | `/api/reports/profit` | ?startDate=&endDate=&branchId= |
| GET | `/api/reports/stock` | ?branchId=&lowStock= |
| GET | `/api/reports/due-payments` | ?branchId=&customerId= |
| GET | `/api/reports/daily-summary` | ?date=&branchId= |
| GET | `/api/reports/top-products` | ?startDate=&endDate=&branchId=&limit= |

| Method | Path | Note |
|--------|------|------|
| GET | `/api/customers` | ?search= |
| GET | `/api/customers/:id` | |
| POST | `/api/customers` | Create customer |
| PUT | `/api/customers/:id` | Update customer |

| Method | Path | Note |
|--------|------|------|
| GET | `/api/users` | **Admin only.** List all users in the database (no password hashes). |

---

## Quick curl examples (replace BASE)

```bash
BASE=https://backend.iphonecenter.logozodev.com

# Health (no auth)
curl -s "$BASE/api/health"
curl -s "$BASE/api/health/db"

# Login (test user)
curl -s -X POST "$BASE/api/auth/login" -H "Content-Type: application/json" -d '{"username":"test","password":"test"}'

# Profile (use token from login)
TOKEN=<paste_access_token_here>
curl -s "$BASE/api/auth/profile" -H "Authorization: Bearer $TOKEN"

# List all users (admin only)
curl -s "$BASE/api/users" -H "Authorization: Bearer $TOKEN"
```

Full route details and request bodies: see `API_ROUTES.md`.
