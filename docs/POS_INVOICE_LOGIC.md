# Enterprise POS Logic – Phone Shop (Invoices, PDF, Customer, Pay Now Popup)

This document describes **logic only** for: customer capture on POS, Pay Now → invoice popup with Download/Print PDF, saving invoice data, and a new Invoices page.

---

## 1. Overall flow (enterprise POS way)

```
POS Page
  ├── Customer: Name + Phone (optional but recommended)
  ├── Cart: Add products, discount
  └── [Pay Now]
        │
        ├── 1. Save or link customer (name + phone → customers table)
        ├── 2. Create sale (sales + sale_items, reduce branch_stock) via API
        ├── 3. Show POPUP with full invoice details
        │       ├── [Download PDF] → generate and download PDF
        │       └── [Print]        → open print dialog (or same PDF in new tab and print)
        └── 4. Close popup → cart cleared; user can start next sale
```

All invoice data is already saved in DB when the sale is created (step 2). The popup only **displays** that data and offers Download/Print.

---

## 2. Customer: name and phone on POS → auto-save to database

**Logic:**

- On the **Phone Shop POS** page, add two fields above or beside the Order Details panel:
  - **Customer name** (optional)
  - **Phone number** (optional)
- When user clicks **Pay Now**:
  1. If name or phone is filled:
     - **Option A (recommended):** Call API to **find or create** customer:
       - `GET /api/customers?phone=...` or search by phone. If found → use `customer_id`.
       - If not found → `POST /api/customers` with `{ name, phone }` → get `id` → use as `customer_id`.
     - **Option B:** Send name + phone in the sale payload; backend creates customer if not exists and links to sale.
  2. Send `customerId` in the **create sale** request body: `POST /api/billing/sales` with `{ ..., customerId: customer_id }`.
- Backend already supports `customer_id` on `sales`. No change needed there if you pass `customerId`.

**Data flow:**

- POS: `customerName`, `customerPhone` (state).
- On Pay Now: ensure customer exists in DB (create if new) → get `customerId` → include in sale payload → customer data is “automatically” saved and linked to the invoice.

---

## 3. Pay Now → popup with invoice + Download + Print

**Logic:**

1. **Pay Now** (as today):
   - Validate cart not empty.
   - Resolve customer (name/phone → get or create `customerId`).
   - Call `POST /api/billing/sales` with `items`, `discountAmount`, `paidAmount`, `customerId`, etc.
   - On **success**:
     - Store the **sale response** in state (e.g. `lastSale` or pass into modal): invoice number, date, branch, customer name/phone, items, totals, payment method, status.
     - **Open a popup/modal** (no full-page redirect).
   - On error: show toast (e.g. insufficient stock). No popup.

2. **Popup content:**
   - Title: e.g. “Invoice saved” or “Invoice # INV-…”
   - **Full invoice details** (same as you want on PDF):
     - Invoice number, date, time
     - Customer name, phone
     - Branch/cashier if you have it
     - Table: items (name, qty, unit price, subtotal per line)
     - Subtotal, discount, total, payment method, status (e.g. Paid)
   - Two buttons:
     - **Download**: generate PDF from this invoice data and trigger download (e.g. `invoice-INV-xxx.pdf`).
     - **Print**: same PDF (or current view) in a new window and `window.print()`, or open print dialog on the modal content.

3. **After Download/Print:**
   - User can close the popup (e.g. “Done” or X).
   - On close: clear cart, clear customer name/phone (or keep for next sale—your choice). Stay on POS for the next sale.

**Order of operations (important):**

- **First** save the sale via API (so invoice exists in DB and stock is updated).
- **Then** show the popup with the **same** data you got from the API (or re-fetch sale by id). So: save → show popup with saved data → Download/Print from that data.

---

## 4. PDF: print and download invoice

**Logic:**

- **Input:** The sale object you already have (from create-sale response or from `GET /api/billing/sales/:id`).
- **Output:** One PDF that contains the “full invoice details” (same as in the popup).

**Ways to implement:**

- **Frontend (recommended for “logic”):**
  - Use a library (e.g. **jsPDF** or **react-pdf**) to build a PDF from the sale data (header, table of items, totals, customer name/phone, invoice #, date).
  - **Download:** generate PDF blob → create object URL → `<a download="invoice-xxx.pdf">` click.
  - **Print:** same PDF in new tab and `window.print()`, or print the modal content (CSS `@media print` to hide everything except the invoice).
- **Backend:**
  - Add e.g. `GET /api/billing/sales/:id/pdf` that returns PDF (using something like **pdfkit** or **puppeteer**). Frontend then opens that URL in new tab (print) or fetches and downloads the file.

**What the PDF should contain (same as popup):**

- Shop name / logo (optional)
- Invoice number, date, time
- Customer name, phone
- Items table: name, quantity, unit price, line total
- Subtotal, discount, total
- Payment method, status (Paid/Unpaid)

So: **one source of truth** (sale in DB) → same layout for popup and PDF.

---

## 5. Save “all invoice data” and new “Invoices” page

**Logic:**

- **You already save** all invoice data when you call `POST /api/billing/sales`:
  - `sales`: invoice_number, branch_id, customer_id, user_id, total_amount, discount_amount, tax, paid_amount, due_amount, payment_status, notes, created_at, etc.
  - `sale_items`: per line (product_id, quantity, unit_price, discount_amount, subtotal).
  - Customer is in `customers` (id, name, phone, …). Sale links via `customer_id`.
- So no extra “save” step is needed for the list you described; the list is **read** from the DB.

**New page: “Invoices”**

- **Route:** e.g. `/invoices` (or `/billing/invoices`).
- **Sidebar:** Add a new item: “Invoices” with an icon (e.g. Receipt or FileText).
- **Page behaviour:**
  - **List:** Table of invoices (same as your reference image):
    - Columns: Invoice #, Client (name), Date, Items (count), Total, Payment (method), Status (Paid/Unpaid/Partial).
    - Optional: Pending payments total at top (sum of `due_amount` where status not Paid).
  - **Data source:** `GET /api/billing/sales` (already exists). Filter by branch for non-admin; admin sees all. Each row = one sale; “Client” = join to `customers` (name); “Items” = count of `sale_items` for that sale.
  - **Actions per row:**
    - **View:** open detail (e.g. modal or `/invoices/:id`) with full invoice (same as popup content).
    - **Download:** same PDF logic as in Pay Now popup, but for that sale id (e.g. `GET /api/billing/sales/:id` then generate PDF, or call `GET /api/billing/sales/:id/pdf` if you add it).
    - **Print:** same as Download but open in new tab and print.
    - **Edit:** only if you support editing (e.g. add payment, change status). Can link to a “Sale detail / Add payment” page.
    - **Delete:** only if backend supports void/cancel (e.g. `PUT /api/billing/sales/:id/cancel`). Don’t hard-delete; “cancel” and keep record.
    - **Mark Paid:** call e.g. `POST /api/billing/sales/:id/payments` with remaining amount so `due_amount` becomes 0 and status becomes Paid.

**“Save PDF details” / “first upload image save pdf details”:**

- Interpret as: **persist everything needed to show and export the invoice.**
- That is already done by saving the sale (and customer) in the DB. The “PDF details” are just a **view** of that same data (invoice #, client, date, items, totals). So:
  - **Save:** sale + sale_items + customer (as above).
  - **Invoices page:** reads that saved data and shows the table.
  - **Download/Print:** generate PDF from that same saved data (by sale id). No separate “upload” of PDF required; you generate PDF on demand from DB.

---

## 6. Concise implementation checklist

| # | What | How (logic) |
|---|------|-------------|
| 1 | Customer on POS | Add name + phone fields on Phone Shop POS. On Pay Now: find or create customer via API, get `customerId`, send in sale payload. |
| 2 | Pay Now → popup | After successful `POST /api/billing/sales`, open modal with full invoice (from API response). Buttons: Download PDF, Print. On close: clear cart (and optionally customer fields). |
| 3 | PDF (download/print) | One layout from sale object. Frontend: jsPDF (or similar) to build PDF; Download = blob + link; Print = same PDF or modal with `window.print()`. Or backend: `/sales/:id/pdf` returns PDF. |
| 4 | Invoice data saved | Already done when sale is created. Sales + sale_items + customer (if created). No extra save. |
| 5 | New “Invoices” page | New route + sidebar “Invoices”. Table from `GET /api/billing/sales` (with customer name, item count). Row actions: View, Download PDF, Print, (Edit,) (Delete/Cancel,) Mark Paid. |
| 6 | Pending payments | Sum `due_amount` for sales where payment_status != 'paid' (from same list or a small summary API). |

---

## 7. API you already have (no change for “logic”)

- `POST /api/billing/sales` – create sale (items, discount, paidAmount, **customerId** optional).
- `GET /api/billing/sales` – list sales (for Invoices page).
- `GET /api/billing/sales/:id` – one sale with items (for popup/PDF/detail).
- `POST /api/billing/sales/:saleId/payments` – add payment (for “Mark Paid”).
- Customer: `GET /api/customers`, `POST /api/customers` (find or create by name/phone).

This is the full **enterprise POS way** for your phone shop: customer name/phone on POS → auto-save customer → Pay Now → save sale → show invoice popup with Download + Print → all data in DB → new Invoices page to list and re-download/print any invoice.
