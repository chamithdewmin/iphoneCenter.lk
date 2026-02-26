-- ============================================
-- DROP AND RECREATE PRODUCTS (PostgreSQL)
-- ============================================
-- WARNING: This script DELETES all data in:
--   sale_items, stock_transfers, barcodes, product_imeis, branch_stock, products
-- Run only on a dev DB or when you intend to wipe product-related data.
-- Sales headers (sales table) are kept; only sale_items (line items) are dropped.
--
-- Run: psql "postgresql://USER:PASS@HOST:5432/IphoneCenterDB" -f drop_and_recreate_products.sql

-- Step 1: Drop tables that reference products (order matters)
DROP TABLE IF EXISTS sale_items;
DROP TABLE IF EXISTS stock_transfers;
DROP TABLE IF EXISTS barcodes;
DROP TABLE IF EXISTS product_imeis;
DROP TABLE IF EXISTS branch_stock;

-- Step 2: Drop products
DROP TABLE IF EXISTS products;

-- Step 3: Recreate products (matches init.pg.sql – no VIN)
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    sku VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    category VARCHAR(100),
    brand VARCHAR(100),
    wholesale_price DECIMAL(10, 2),
    retail_price DECIMAL(10, 2),
    base_price DECIMAL(10, 2) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_brand ON products(brand);
CREATE INDEX idx_products_is_active ON products(is_active);

-- Step 4: Recreate tables that reference products
CREATE TABLE branch_stock (
    id SERIAL PRIMARY KEY,
    branch_id INT NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INT NOT NULL DEFAULT 0,
    reserved_quantity INT NOT NULL DEFAULT 0,
    min_stock_level INT DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(branch_id, product_id)
);
CREATE INDEX idx_branch_stock_branch_id ON branch_stock(branch_id);
CREATE INDEX idx_branch_stock_product_id ON branch_stock(product_id);
CREATE INDEX idx_branch_stock_quantity ON branch_stock(quantity);

CREATE TABLE product_imeis (
    id SERIAL PRIMARY KEY,
    product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    branch_id INT NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    imei VARCHAR(20) UNIQUE NOT NULL,
    color VARCHAR(50),
    status imei_status DEFAULT 'available',
    sale_id INT NULL,
    purchase_price DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_product_imeis_imei ON product_imeis(imei);
CREATE INDEX idx_product_imeis_product_id ON product_imeis(product_id);
CREATE INDEX idx_product_imeis_branch_id ON product_imeis(branch_id);
CREATE INDEX idx_product_imeis_status ON product_imeis(status);
CREATE INDEX idx_product_imeis_sale_id ON product_imeis(sale_id);

DO $$ BEGIN
    ALTER TABLE product_imeis ADD CONSTRAINT fk_product_imeis_sale
        FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE barcodes (
    id SERIAL PRIMARY KEY,
    product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    barcode VARCHAR(100) UNIQUE NOT NULL,
    barcode_type VARCHAR(20) DEFAULT 'CODE128',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_barcodes_barcode ON barcodes(barcode);
CREATE INDEX idx_barcodes_product_id ON barcodes(product_id);

CREATE TABLE stock_transfers (
    id SERIAL PRIMARY KEY,
    transfer_number VARCHAR(50) UNIQUE NOT NULL,
    from_branch_id INT NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    to_branch_id INT NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INT NOT NULL,
    imei VARCHAR(20) NULL,
    status transfer_status DEFAULT 'pending',
    requested_by INT NULL REFERENCES users(id) ON DELETE SET NULL,
    approved_by INT NULL REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL
);
CREATE INDEX idx_stock_transfers_transfer_number ON stock_transfers(transfer_number);
CREATE INDEX idx_stock_transfers_from_branch ON stock_transfers(from_branch_id);
CREATE INDEX idx_stock_transfers_to_branch ON stock_transfers(to_branch_id);
CREATE INDEX idx_stock_transfers_product_id ON stock_transfers(product_id);
CREATE INDEX idx_stock_transfers_status ON stock_transfers(status);

CREATE TABLE sale_items (
    id SERIAL PRIMARY KEY,
    sale_id INT NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    imei VARCHAR(20) NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    discount_amount DECIMAL(10, 2) DEFAULT 0,
    subtotal DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_sale_items_sale_id ON sale_items(sale_id);
CREATE INDEX idx_sale_items_product_id ON sale_items(product_id);
CREATE INDEX idx_sale_items_imei ON sale_items(imei);
