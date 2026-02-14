# Project Structure

Complete folder structure for the Enterprise POS Backend System.

```
backend/
├── config/
│   ├── database.js          # MySQL connection pool configuration
│   └── constants.js         # Application constants (roles, statuses, etc.)
│
├── controllers/
│   ├── authController.js     # Authentication logic (login, register, refresh)
│   ├── branchController.js  # Branch management (CRUD operations)
│   ├── billingController.js # POS & billing (sales, payments, refunds)
│   ├── inventoryController.js # Inventory management (stock, IMEI, transfers, barcode)
│   ├── reportsController.js # Reports & analytics (sales, profit, stock, due)
│   └── customerController.js # Customer management
│
├── database/
│   └── schema.sql           # Complete MySQL database schema with:
│                            #   - All tables with proper indexes
│                            #   - Foreign key relationships
│                            #   - Initial data (admin user, default branch)
│
├── examples/
│   └── billingTransactionExample.js # Example transaction-safe billing code
│
├── middleware/
│   ├── auth.js              # JWT authentication middleware
│   ├── roleGuard.js         # Role-based access control (Admin/Manager/Cashier)
│   ├── branchGuard.js       # Branch data isolation middleware
│   └── errorHandler.js      # Global error handling
│
├── routes/
│   ├── authRoutes.js        # Authentication endpoints
│   ├── branchRoutes.js      # Branch management endpoints
│   ├── inventoryRoutes.js   # Inventory endpoints
│   ├── billingRoutes.js     # Billing/POS endpoints
│   ├── reportsRoutes.js     # Reports endpoints
│   └── customerRoutes.js    # Customer endpoints
│
├── utils/
│   ├── logger.js            # Winston logger configuration
│   └── helpers.js           # Utility functions (invoice numbers, barcode, etc.)
│
├── logs/                    # Log files (auto-generated)
│   ├── error.log
│   └── combined.log
│
├── server.js                # Main Express application entry point
├── package.json             # Dependencies and scripts
├── README.md                # Complete documentation
├── API_ROUTES.md            # API routes reference
└── PROJECT_STRUCTURE.md      # This file
```

## Key Files

### Core Application
- **server.js**: Main Express app with middleware setup, route registration, error handling
- **package.json**: All dependencies and npm scripts

### Configuration
- **config/database.js**: MySQL connection pool with transaction support
- **config/constants.js**: Centralized constants for roles, statuses, payment methods

### Controllers (Business Logic)
- **authController.js**: User registration, login, token refresh, profile
- **branchController.js**: Branch CRUD with access control
- **billingController.js**: Transaction-safe sales, payments, refunds, cancellations
- **inventoryController.js**: Products, stock, IMEI tracking, transfers, barcodes
- **reportsController.js**: Sales, profit, stock, due payments reports
- **customerController.js**: Customer management

### Middleware (Security & Access Control)
- **auth.js**: JWT token verification, refresh token validation
- **roleGuard.js**: Role-based access (Admin/Manager/Cashier)
- **branchGuard.js**: Branch data isolation (non-admin users restricted to their branch)
- **errorHandler.js**: Centralized error handling with proper status codes

### Routes (API Endpoints)
All routes are organized by feature:
- `/api/auth/*` - Authentication
- `/api/branches/*` - Branch management
- `/api/inventory/*` - Inventory operations
- `/api/billing/*` - POS & billing
- `/api/reports/*` - Reports & analytics
- `/api/customers/*` - Customer management

### Database
- **schema.sql**: Complete database schema with:
  - 15+ tables with proper relationships
  - Indexes on frequently queried columns
  - Foreign key constraints
  - InnoDB engine for transactions
  - Initial admin user and default branch

### Examples
- **billingTransactionExample.js**: Demonstrates transaction-safe billing with:
  - Stock validation
  - IMEI tracking
  - Payment processing
  - Error handling and rollback

## Design Patterns

1. **MVC Architecture**: Controllers handle business logic, routes define endpoints
2. **Middleware Chain**: Authentication → Role Check → Branch Guard → Controller
3. **Transaction Safety**: All critical operations use database transactions
4. **Connection Pooling**: Efficient database connection management
5. **Error Handling**: Centralized error handler with proper logging
6. **Security**: JWT tokens, password hashing, role-based access, branch isolation

## Database Tables

### Authentication & Users
- `users` - User accounts with roles
- `refresh_tokens` - JWT refresh tokens

### Branch Management
- `branches` - Branch information

### Products & Inventory
- `products` - Product catalog
- `branch_stock` - Stock per branch
- `product_imeis` - IMEI tracking
- `barcodes` - Product barcodes
- `stock_transfers` - Inter-branch transfers

### POS & Billing
- `customers` - Customer information
- `sales` - Sales/invoices
- `sale_items` - Sale line items
- `payments` - Payment records
- `refunds` - Refund records

### Audit
- `audit_logs` - System audit trail

## Security Features

✅ JWT authentication with refresh tokens  
✅ Password hashing with bcrypt  
✅ Role-based access control  
✅ Branch data isolation  
✅ Rate limiting  
✅ Security headers (Helmet)  
✅ Input validation  
✅ SQL injection protection (parameterized queries)  
✅ CORS configuration  

## Best Practices Implemented

✅ Transaction-safe operations  
✅ Proper error handling  
✅ Comprehensive logging  
✅ RESTful API design  
✅ Database indexing  
✅ Connection pooling  
✅ Code organization  
✅ Documentation  
