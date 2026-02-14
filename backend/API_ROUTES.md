# API Routes Documentation

Complete API routes reference for the Enterprise POS Backend System.

## Base URL
```
http://localhost:3000/api
```

## Authentication

All routes except `/api/auth/login` and `/api/auth/refresh` require authentication via Bearer token:
```
Authorization: Bearer <access_token>
```

---

## 🔐 Authentication Routes

### Register User
**POST** `/api/auth/register`
- **Access**: Admin only
- **Body**:
  ```json
  {
    "username": "string (min 3 chars)",
    "email": "valid email",
    "password": "string (min 6 chars)",
    "fullName": "string",
    "role": "admin|manager|cashier",
    "branchId": "number (optional)"
  }
  ```

### Login
**POST** `/api/auth/login`
- **Body**:
  ```json
  {
    "username": "string",
    "password": "string"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "accessToken": "string",
      "refreshToken": "string",
      "user": { ... }
    }
  }
  ```

### Refresh Token
**POST** `/api/auth/refresh`
- **Body**:
  ```json
  {
    "refreshToken": "string"
  }
  ```

### Logout
**POST** `/api/auth/logout`
- **Body**:
  ```json
  {
    "refreshToken": "string"
  }
  ```

### Get Profile
**GET** `/api/auth/profile`

---

## 🏢 Branch Routes

### Get All Branches
**GET** `/api/branches`
- Admin sees all branches, others see only their branch

### Get Branch by ID
**GET** `/api/branches/:id`

### Create Branch
**POST** `/api/branches`
- **Access**: Manager/Admin
- **Body**:
  ```json
  {
    "name": "string (required)",
    "code": "string (required, unique)",
    "address": "string (optional)",
    "phone": "string (optional)",
    "email": "string (optional)"
  }
  ```

### Update Branch
**PUT** `/api/branches/:id`
- **Access**: Manager/Admin

### Disable Branch
**DELETE** `/api/branches/:id`
- **Access**: Manager/Admin

---

## 📦 Inventory Routes

### Products

#### Get All Products
**GET** `/api/inventory/products`
- **Query Params**: `?search=string&category=string&brand=string`

#### Get Product by ID
**GET** `/api/inventory/products/:id`

#### Create Product
**POST** `/api/inventory/products`
- **Access**: Manager/Admin
- **Body**:
  ```json
  {
    "name": "string (required)",
    "sku": "string (required, unique)",
    "description": "string (optional)",
    "category": "string (optional)",
    "brand": "string (optional)",
    "basePrice": "number (required)"
  }
  ```

### Stock

#### Get Branch Stock
**GET** `/api/inventory/stock`
- Returns stock for user's branch (or specified branch for admin)

#### Update Stock
**PUT** `/api/inventory/stock`
- **Access**: Manager/Admin
- **Body**:
  ```json
  {
    "productId": "number (required)",
    "quantity": "number (required)",
    "minStockLevel": "number (optional)"
  }
  ```

### IMEI

#### Add IMEI
**POST** `/api/inventory/imei`
- **Access**: Manager/Admin
- **Body**:
  ```json
  {
    "productId": "number (required)",
    "imei": "string (required, 15 digits)",
    "purchasePrice": "number (optional)"
  }
  ```

#### Get IMEIs
**GET** `/api/inventory/imei`
- **Query Params**: `?productId=number&status=available|sold|reserved|transferred|returned`

### Stock Transfers

#### Transfer Stock
**POST** `/api/inventory/transfers`
- **Access**: Manager/Admin
- **Body**:
  ```json
  {
    "toBranchId": "number (required)",
    "productId": "number (required)",
    "quantity": "number (required)",
    "imei": "string (optional)",
    "notes": "string (optional)"
  }
  ```

#### Complete Transfer
**PUT** `/api/inventory/transfers/:id/complete`
- **Access**: Manager/Admin

### Barcode

#### Generate Barcode
**GET** `/api/inventory/barcode/generate/:productId`
- **Access**: Manager/Admin

#### Validate Barcode
**GET** `/api/inventory/barcode/validate/:barcode`

---

## 💰 Billing Routes

### Sales

#### Create Sale
**POST** `/api/billing/sales`
- **Body**:
  ```json
  {
    "customerId": "number (optional)",
    "items": [
      {
        "productId": "number (required)",
        "quantity": "number (required, min 1)",
        "unitPrice": "number (required, min 0)",
        "discount": "number (optional)",
        "imei": "string (optional, 15 digits)"
      }
    ],
    "discountAmount": "number (optional)",
    "taxRate": "number (optional)",
    "paidAmount": "number (optional, min 0)",
    "notes": "string (optional)"
  }
  ```

#### Get All Sales
**GET** `/api/billing/sales`
- **Query Params**: 
  - `?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`
  - `?paymentStatus=paid|partial|due`
  - `?customerId=number`
  - `?limit=number&offset=number`
  - `?branchId=number` (admin only)

#### Get Sale by ID
**GET** `/api/billing/sales/:id`
- Can use sale ID or invoice number

#### Add Payment
**POST** `/api/billing/sales/:saleId/payments`
- **Body**:
  ```json
  {
    "amount": "number (required, min 0)",
    "paymentMethod": "cash|card|bank_transfer|mobile_payment|other (optional)",
    "paymentReference": "string (optional)",
    "notes": "string (optional)"
  }
  ```

#### Cancel Sale
**PUT** `/api/billing/sales/:id/cancel`
- **Access**: Manager/Admin
- **Body**:
  ```json
  {
    "reason": "string (optional)"
  }
  ```

### Refunds

#### Create Refund
**POST** `/api/billing/sales/:saleId/refunds`
- **Access**: Manager/Admin
- **Body**:
  ```json
  {
    "amount": "number (required, min 0)",
    "reason": "string (optional)"
  }
  ```

#### Process Refund
**PUT** `/api/billing/refunds/:id/process`
- **Access**: Manager/Admin
- **Body**:
  ```json
  {
    "action": "approve|reject"
  }
  ```

---

## 📊 Reports Routes

All reports require authentication and respect branch isolation.

### Sales Report
**GET** `/api/reports/sales`
- **Query Params**: `?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&branchId=number` (admin only)

### Profit Report
**GET** `/api/reports/profit`
- **Query Params**: `?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&branchId=number` (admin only)

### Stock Report
**GET** `/api/reports/stock`
- **Query Params**: `?branchId=number&lowStock=true` (admin only)

### Due Payments Report
**GET** `/api/reports/due-payments`
- **Query Params**: `?branchId=number&customerId=number` (admin only)

### Daily Sales Summary
**GET** `/api/reports/daily-summary`
- **Query Params**: `?date=YYYY-MM-DD&branchId=number` (admin only)

### Top Selling Products
**GET** `/api/reports/top-products`
- **Query Params**: `?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&branchId=number&limit=10` (admin only)

---

## 👥 Customer Routes

### Get All Customers
**GET** `/api/customers`
- **Query Params**: `?search=string`

### Get Customer by ID
**GET** `/api/customers/:id`

### Create Customer
**POST** `/api/customers`
- **Body**:
  ```json
  {
    "name": "string (required)",
    "phone": "string (optional)",
    "email": "string (optional)",
    "address": "string (optional)"
  }
  ```

### Update Customer
**PUT** `/api/customers/:id`
- **Body**: Same as create (all fields optional)

---

## Response Format

### Success Response
```json
{
  "success": true,
  "message": "Optional message",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message"
}
```

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict (Duplicate)
- `500` - Internal Server Error

## Rate Limiting

- 100 requests per 15 minutes per IP address
- Applied to all `/api/` routes
