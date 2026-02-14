# Enterprise POS Backend System

A secure, scalable enterprise Point of Sale (POS) backend system built with Node.js, Express, and PostgreSQL.

## Features

### 🔐 Authentication & Authorization
- JWT-based authentication with refresh tokens
- Role-based access control (Admin, Manager, Cashier)
- Secure password hashing with bcrypt

### 🏢 Branch Management
- Multi-branch support
- Branch-based data isolation
- Admin access to all branches
- Branch CRUD operations

### 💰 POS & Billing
- Transaction-safe billing system
- Partial payments support
- Due payments tracking
- Invoice generation
- Refund & cancellation
- Customer management

### 📦 Inventory Management
- Stock management per branch
- IMEI tracking for products
- Stock transfers between branches
- Barcode generation and validation
- Low stock alerts

### 📊 Reports & Analytics
- Branch-wise sales reports
- Profit analysis
- Stock reports
- Due payments tracking
- Daily sales summary
- Top selling products

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Authentication**: JWT
- **Security**: Helmet, CORS, Rate Limiting
- **Logging**: Winston

## Project Structure

```
backend/
├── config/
│   ├── database.js          # Database connection pool
│   └── constants.js         # Application constants
├── controllers/
│   ├── authController.js    # Authentication logic
│   ├── branchController.js  # Branch management
│   ├── billingController.js # POS & billing
│   ├── inventoryController.js # Inventory management
│   ├── reportsController.js # Reports & analytics
│   └── customerController.js # Customer management
├── database/
│   └── schema.sql           # Database schema
├── middleware/
│   ├── auth.js              # JWT authentication
│   ├── roleGuard.js         # Role-based access control
│   ├── branchGuard.js       # Branch data isolation
│   └── errorHandler.js      # Error handling
├── routes/
│   ├── authRoutes.js
│   ├── branchRoutes.js
│   ├── inventoryRoutes.js
│   ├── billingRoutes.js
│   ├── reportsRoutes.js
│   └── customerRoutes.js
├── utils/
│   ├── logger.js             # Winston logger
│   └── helpers.js           # Helper functions
├── logs/                     # Log files (auto-generated)
├── server.js                 # Main application entry
├── package.json
└── .env.example
```

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your configuration:
   - Database credentials
   - JWT secrets
   - Port number

4. **Set up database**  
   The backend uses **PostgreSQL**. Create a database and run the schema:
   ```bash
   psql -U postgres -d pos_system -f database/schema.pg.sql
   ```
   Or use any PostgreSQL client to run `database/schema.pg.sql`.

5. **Start the server**
   ```bash
   # Development mode (with nodemon)
   npm run dev

   # Production mode
   npm start
   ```

## Database Schema

The system uses PostgreSQL and includes (see `database/schema.pg.sql`):

- **Users & Authentication**: `users`, `refresh_tokens`
- **Branch Management**: `branches`
- **Products & Inventory**: `products`, `branch_stock`, `product_imeis`, `barcodes`, `stock_transfers`
- **POS & Billing**: `customers`, `sales`, `sale_items`, `payments`, `refunds`
- **Audit**: `audit_logs`

All tables include proper indexes, foreign keys, and transaction support.

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user (Admin only)
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout
- `GET /api/auth/profile` - Get current user profile

### Branches
- `GET /api/branches` - Get all branches
- `GET /api/branches/:id` - Get branch by ID
- `POST /api/branches` - Create branch (Manager/Admin)
- `PUT /api/branches/:id` - Update branch (Manager/Admin)
- `DELETE /api/branches/:id` - Disable branch (Manager/Admin)

### Inventory
- `GET /api/inventory/products` - Get all products
- `GET /api/inventory/products/:id` - Get product by ID
- `POST /api/inventory/products` - Create product (Manager/Admin)
- `GET /api/inventory/stock` - Get branch stock
- `PUT /api/inventory/stock` - Update stock (Manager/Admin)
- `POST /api/inventory/imei` - Add IMEI (Manager/Admin)
- `GET /api/inventory/imei` - Get IMEIs
- `POST /api/inventory/transfers` - Transfer stock (Manager/Admin)
- `PUT /api/inventory/transfers/:id/complete` - Complete transfer (Manager/Admin)
- `GET /api/inventory/barcode/generate/:productId` - Generate barcode
- `GET /api/inventory/barcode/validate/:barcode` - Validate barcode

### Billing
- `POST /api/billing/sales` - Create sale/bill
- `GET /api/billing/sales` - Get all sales
- `GET /api/billing/sales/:id` - Get sale by ID
- `POST /api/billing/sales/:saleId/payments` - Add payment
- `PUT /api/billing/sales/:id/cancel` - Cancel sale (Manager/Admin)
- `POST /api/billing/sales/:saleId/refunds` - Create refund (Manager/Admin)
- `PUT /api/billing/refunds/:id/process` - Process refund (Manager/Admin)

### Reports
- `GET /api/reports/sales` - Sales report
- `GET /api/reports/profit` - Profit report
- `GET /api/reports/stock` - Stock report
- `GET /api/reports/due-payments` - Due payments report
- `GET /api/reports/daily-summary` - Daily sales summary
- `GET /api/reports/top-products` - Top selling products

### Customers
- `GET /api/customers` - Get all customers
- `GET /api/customers/:id` - Get customer by ID
- `POST /api/customers` - Create customer
- `PUT /api/customers/:id` - Update customer

## Example: Creating a Sale (Billing Transaction)

```javascript
// POST /api/billing/sales
{
  "customerId": 1,  // Optional
  "items": [
    {
      "productId": 1,
      "quantity": 2,
      "unitPrice": 100.00,
      "discount": 0,
      "imei": "123456789012345"  // Optional, for IMEI tracking
    }
  ],
  "discountAmount": 10.00,
  "taxRate": 5,
  "paidAmount": 200.00,
  "notes": "Customer notes"
}
```

The system will:
1. Validate stock availability
2. Calculate totals (subtotal, discount, tax, total)
3. Create sale record
4. Create sale items
5. Update stock quantities
5. Update IMEI status (if provided)
6. Create payment record
7. All within a database transaction for data integrity

## Dokploy / Production deployment

If you see **500 Internal Server Error** or **503 Database schema not applied** on API calls (e.g. `/api/customers`):

1. **Create a PostgreSQL database** and set `DATABASE_URL` in your app environment (e.g. Dokploy Environment tab):
   - Format: `postgresql://USER:PASSWORD@HOST:5432/DATABASE_NAME`
   - Or set `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` (and optionally `DB_PORT`).

2. **Run the schema once** on that database so tables like `customers`, `users`, `branches`, etc. exist:
   ```bash
   psql "$DATABASE_URL" -f database/schema.pg.sql
   ```
   Or connect with any PostgreSQL client and execute the contents of `backend/database/schema.pg.sql`.

3. **Set required env vars**: `JWT_SECRET`, `JWT_REFRESH_SECRET` (32+ characters in production). Optionally `CORS_ORIGIN`, `TEST_LOGIN_USERNAME`, `TEST_LOGIN_PASSWORD`.

4. **Redeploy** and check container logs for any remaining errors (the backend now logs full error codes and messages to stdout).

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Refresh Tokens**: Stored in database with expiration
- **Password Hashing**: bcrypt with salt rounds
- **Role-Based Access**: Admin, Manager, Cashier roles
- **Branch Isolation**: Data isolation per branch
- **Rate Limiting**: Protection against brute force
- **Helmet**: Security headers
- **Input Validation**: Express-validator
- **SQL Injection Protection**: Parameterized queries

## Default Admin Account

After running the schema, a default admin user is created:
- **Username**: `admin`
- **Email**: `admin@pos.com`
- **Password**: `Admin@123` (⚠️ **Change this immediately in production!**)

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 3000 |
| `NODE_ENV` | Environment | development |
| `DATABASE_URL` | Full PostgreSQL URL | - |
| `DB_HOST` | Database host (if not using DATABASE_URL) | localhost |
| `DB_USER` | Database user | postgres |
| `DB_PASSWORD` | Database password | - |
| `DB_NAME` | Database name | pos_system |
| `JWT_SECRET` | JWT secret key | - |
| `JWT_REFRESH_SECRET` | Refresh token secret | - |
| `CORS_ORIGIN` | CORS origin | * |
| `LOG_LEVEL` | Logging level | info |

## Logging

Logs are stored in the `logs/` directory:
- `error.log` - Error logs only
- `combined.log` - All logs

## Best Practices Implemented

✅ Transaction-safe database operations  
✅ Proper error handling and logging  
✅ Input validation and sanitization  
✅ Role-based access control  
✅ Branch-based data isolation  
✅ Connection pooling for performance  
✅ Indexed database queries  
✅ RESTful API design  
✅ Security headers and rate limiting  
✅ Comprehensive error messages  

## License

ISC

## Support

For issues and questions, please contact the development team.
