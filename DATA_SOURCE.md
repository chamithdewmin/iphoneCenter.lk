# Data source – database vs localStorage

This document describes which parts of the app use the **database** (backend API) and which still use **browser localStorage**. The goal is for all business data to be stored only in the database.

---

## ✅ Uses database (API only)

- **Auth** – Login, register, profile, refresh, logout. Tokens in localStorage; user data from API.
- **Users** – List: `GET /api/users`. Add: `POST /api/auth/register`. User Report loads from API.
- **Customers** – List: `GET /api/customers`. Add: `POST /api/customers`. Customer List, Add Customer, Select Customer, Customer Report, Dashboard customer count – all from API.
- **Products** – List: `GET /api/inventory/products`. Add: `POST /api/inventory/products`. Product List, Add Product, POS product list – from API.
- **Dashboard** – Counts and revenue from `GET /api/customers`, `GET /api/inventory/products`, `GET /api/billing/sales`, `GET /api/reports/daily-summary`.
- **Sales (backend)** – Creating a sale uses `POST /api/billing/sales`. If the logged-in user has no branch (e.g. test user), the backend uses the first active branch.
- **Branches** – Backend has `GET/POST/PUT/DELETE /api/branches`. Frontend pages that show “warehouses” can be wired to branches.

---

## ⚠️ Still using localStorage (to be wired later)

These screens currently read/write **localStorage** only. To make them enterprise-ready, add corresponding backend APIs and then switch the frontend to use `authFetch` to those APIs.

| Feature | Storage key | Suggested backend |
|--------|-------------|-------------------|
| Warehouses | `warehouses` | Use **branches** (`/api/branches`) or add a warehouses table. |
| Suppliers | `suppliers` | Add `suppliers` table and `/api/suppliers` CRUD. |
| Billers | `billers` | Add if needed or map to users. |
| Expenses | `expenses` | Add `expenses` table and `/api/expenses` CRUD. |
| Categories | `categories` | Products already have `category` field; optional categories table. |
| Units | `units` | Add if needed for inventory. |
| Orders / Per-orders | `orders`, `perOrders` | Backend has **sales**; map “orders” to sales and use `/api/billing/sales`. |
| Purchases | `purchases` | Add `purchases` table and API if you need purchase orders. |
| Held invoices | `heldInvoices` | Optional: store in DB or keep in session only. |
| Cart | `cart` (CartContext) | Cart can stay in memory/localStorage until checkout; checkout should create a sale via `POST /api/billing/sales`. |

Reports that still use localStorage (e.g. Tax, Payment, Purchase, Expense, Shipping, Discount, Sale, Stock, Warehouse, Supplier, Product reports) should be switched to the existing **report APIs** where available (`/api/reports/sales`, `/api/reports/profit`, `/api/reports/stock`, etc.) or to new report endpoints that read from the database.

---

## Summary

- **Users, customers, products, dashboard KPIs, and POS product list** now use the database only (no localStorage for that data).
- **Sales** are created in the database via the API; ensure the POS/checkout flow calls `POST /api/billing/sales` with the correct payload (items, customerId, paidAmount, etc.).
- All other features listed above still use localStorage until you add backend APIs and wire the frontend to them.

For a full enterprise setup:

1. Run the backend with a valid `DATABASE_URL` and JWT secrets.
2. Apply the schema: `backend/database/schema.pg.sql`.
3. Create at least one branch (via API or schema seed).
4. Use test login (`test` / `test`) or create users via the panel; then create customers and products via the panel. All of that is stored in the database and shared across browsers and devices.
