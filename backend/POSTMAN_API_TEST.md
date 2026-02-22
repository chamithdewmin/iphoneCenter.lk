# Test API with Postman (Add Product & Login)

Use your **backend base URL** (e.g. `https://backend.iphonecenter.lk`). No trailing slash.

---

## Step 1: Get access token (Login)

**Request**

- **Method:** `POST`
- **URL:** `https://backend.iphonecenter.lk/api/auth/login`
- **Headers:**
  - `Content-Type`: `application/json`
- **Body (raw JSON):**

```json
{
  "username": "admin",
  "password": "YOUR_PASSWORD"
}
```

Or use email instead of username:

```json
{
  "username": "admin@example.com",
  "password": "YOUR_PASSWORD"
}
```

**Success response (200):**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "...",
    "user": {
      "id": 23,
      "username": "admin",
      "email": "...",
      "fullName": "...",
      "role": "admin",
      "branchId": null,
      "branchName": null,
      "branchCode": null
    }
  }
}
```

**Copy** `data.accessToken` and use it in the next request.

---

## Step 2: Create product (Add Product)

**Request**

- **Method:** `POST`
- **URL:** `https://backend.iphonecenter.lk/api/inventory/products`
- **Headers:**
  - `Content-Type`: `application/json`
  - `Authorization`: `Bearer YOUR_ACCESS_TOKEN`  
    (replace `YOUR_ACCESS_TOKEN` with the token from Step 1)
- **Body (raw JSON):**

**Minimal (required only):**

```json
{
  "name": "Test Phone",
  "sku": "SKU-001",
  "basePrice": 100
}
```

**With optional fields (admin must send branchId):**

```json
{
  "name": "iPhone 15 Pro",
  "sku": "IP15PRO-001",
  "basePrice": 250000,
  "description": "128GB",
  "category": "Smartphone",
  "brand": "Apple",
  "initialQuantity": 5,
  "branchId": 70
}
```

**Notes:**

- Use `basePrice` or `base_price` (number, ≥ 0).
- **Admin:** must send `branchId` (e.g. `70`, `71`) – use an active branch ID from your `branches` table.
- **Manager / Staff / Cashier:** do **not** send `branchId`; the backend uses their assigned branch.
- `initialQuantity` is optional (default 0). `branchId` for admin must match an active branch.

**Success response (201):**

```json
{
  "success": true,
  "message": "Product created successfully",
  "data": {
    "id": 1,
    "name": "Test Phone",
    "sku": "SKU-001",
    "barcode": "..."
  }
}
```

**Error examples:**

- **400** – Validation (e.g. missing name/sku/base price, or admin without branchId):
  ```json
  { "success": false, "message": "Please select a branch for this product" }
  ```
- **401** – Invalid or missing token:
  ```json
  { "success": false, "message": "Session expired or invalid. Please sign in again." }
  ```
- **409** – SKU already exists:
  ```json
  { "success": false, "message": "SKU already exists" }
  ```
- **500** – Server/DB error; body will have the real error:
  ```json
  { "success": false, "message": "relation \"products\" does not exist", "code": "42P01", "detail": "..." }
  ```

---

## Postman setup summary

| Step | Method | URL | Body |
|------|--------|-----|------|
| 1. Login | POST | `{{baseUrl}}/api/auth/login` | `{"username":"admin","password":"YOUR_PASSWORD"}` |
| 2. Add product | POST | `{{baseUrl}}/api/inventory/products` | See JSON above |

**Environment variable (optional):**

- `baseUrl` = `https://backend.iphonecenter.lk`

Then use `{{baseUrl}}` in the URL bar.

**After Step 1:** In the Login response, copy `data.accessToken`. In the Add Product request, set header:

- Key: `Authorization`  
- Value: `Bearer <paste token here>`

---

## Quick copy-paste (curl)

**1. Login and save token:**

```bash
curl -s -X POST https://backend.iphonecenter.lk/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"admin\",\"password\":\"YOUR_PASSWORD\"}"
```

**2. Create product (replace TOKEN and branchId if admin):**

```bash
curl -s -X POST https://backend.iphonecenter.lk/api/inventory/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d "{\"name\":\"Test Phone\",\"sku\":\"SKU-001\",\"basePrice\":100,\"branchId\":70}"
```

If you get **500**, the response body’s `message` (and `detail`) will show the real error (e.g. wrong database or missing table).

---

## If you see "Internal server error Check backend server logs (e.g. Dokploy container logs) for details"

That **exact message is not sent by this backend**. It is often added by **Dokploy** or a **reverse proxy** when they replace the body on 500.

**What to do:**

1. **Check Response Headers in Postman**  
   If you see **`X-Error-Source: iphone-center-api`**, the body is from this app (and we send the real error). If you **don’t** see that header, the response was likely replaced by a proxy.

2. **Get the real error from backend logs**  
   - In Dokploy, open your **backend** app → **Logs** (or **Terminal**).  
   - Reproduce the 500 (e.g. Add Product in Postman).  
   - Look for lines like `[Express Error]` or `Create product error` – the next lines will show the real error (e.g. `relation "products" does not exist`, connection refused, etc.).

3. **Fix the cause**  
   - **"relation … does not exist"** or **"42P01"** → Backend is using the wrong database or tables are missing. Set **DATABASE_URL** (or **DB_NAME=IphoneCenterDB**) so the backend uses the same DB where you ran `verify_tables.sql`, then redeploy.  
   - **Connection refused / ECONNREFUSED** → Backend can’t reach PostgreSQL; fix **DATABASE_URL** host (use internal DB host from Dokploy).  
   - **28P01** → Wrong DB user/password; fix **DB_USER** / **DB_PASSWORD** or **DATABASE_URL**.
