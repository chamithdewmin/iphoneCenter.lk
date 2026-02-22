# POS Billing – Enterprise Flow (How It Works)

This document describes how the POS saves invoices and updates stock by branch (enterprise-style).

---

## 1. End-to-end flow

1. **User logs in** as Manager, Staff, or Cashier (admin cannot make sales; they use Dashboard).
2. **User’s branch** is set in the database (`users.branch_id`). All POS sales use this branch.
3. **POS page** (Phone Shop POS):
   - Products are loaded from **API** (`GET /api/inventory/products`) – same products you add in **Add Product**.
   - User adds products to cart, optionally sets a discount, then clicks **Pay Now**.
4. **Pay Now** sends the sale to the backend:
   - **API:** `POST /api/billing/sales`
   - **Body:** `items` (productId, quantity, unitPrice), `discountAmount`, `paidAmount`, `taxRate: 0`, optional `notes`.
5. **Backend** (for the **logged-in user’s branch**):
   - Creates **sale** (invoice) in `sales`.
   - Creates **sale_items** (one row per cart line).
   - **Reduces stock:** `branch_stock.quantity = quantity - sold` for that branch and product.
   - Creates **payment** record if `paidAmount > 0`.
6. **Result:** Invoice is saved, stock for the **login branch** is decreased. User sees a success toast with the invoice number.

---

## 2. Important details

| What | How |
|------|-----|
| **Which branch?** | The branch of the **logged-in user** (`req.user.branch_id`). Set in **Users** (edit user → assign branch). |
| **Stock check** | Before saving, backend checks `branch_stock` for that branch. If quantity is less than cart qty, it returns **"Insufficient stock"** and does not create the sale. |
| **Stock decrease** | After creating `sale_items`, backend runs: `UPDATE branch_stock SET quantity = quantity - ? WHERE branch_id = ? AND product_id = ?` for each item. |
| **Products on POS** | Same as in **Products** list (from DB). Add products in **Add Product** (with branch and initial stock); they appear on POS and stock is tracked per branch. |

---

## 3. API used by POS (Pay Now)

- **URL:** `POST /api/billing/sales`
- **Auth:** Bearer token (user must be logged in).
- **Body example:**
```json
{
  "items": [
    { "productId": 1, "quantity": 2, "unitPrice": 99.99, "discount": 0 }
  ],
  "discountAmount": 5.00,
  "taxRate": 0,
  "paidAmount": 194.98,
  "notes": "Order type: Walk-In"
}
```
- **Success (201):** `{ "success": true, "data": { "invoice_number": "BR1-INV-...", ... } }`
- **Error (400):** e.g. `"Insufficient stock for product ID 1"` – cart qty exceeds branch stock.

---

## 4. How to use it (steps)

1. **Branches:** Create branches (e.g. Warehouses).
2. **Users:** Create cashier/manager/staff and **assign each user to a branch**.
3. **Products:** Add products in **Add Product** and set **initial stock** for a branch. That updates `branch_stock` for that branch.
4. **POS:** Log in as a user with a branch → open POS → add products to cart → set discount if needed → **Pay Now**. Invoice is saved and **that user’s branch** stock is reduced.
5. **Stock view:** Use **Inventory** or **Branch stock** (by branch) to see current quantities; they decrease after each sale for the selling branch.

---

## 5. Files involved

- **Frontend (POS):** `frontend/src/pages/PhoneShopPOS.jsx` – cart, Pay Now calls `POST /api/billing/sales`.
- **Backend (create sale):** `backend/controllers/billingController.js` – `createSale` (validates stock, creates sale + sale_items, decrements `branch_stock`).
- **Route:** `backend/routes/billingRoutes.js` – `POST /sales` with `authenticate`, `branchGuard`.
- **Branch:** Set by `branchGuard` and `req.user.branch_id` (login branch).

This is the standard enterprise POS way: **add product on POS → save invoice → transaction saved → stock for login branch gets reduced.**
