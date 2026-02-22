-- ============================================
-- Per Orders: header + line items (catalog or custom product name)
-- ============================================
-- Run: psql "postgresql://USER:PASS@HOST:5432/DB" -f backend/database/migrations/add_per_orders_table.pg.sql
-- Requires: branches, users, customers, products exist (main schema). set_updated_at() must exist.

CREATE TABLE IF NOT EXISTS per_orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    branch_id INT NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    customer_id INT NULL REFERENCES customers(id) ON DELETE SET NULL,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    customer_name VARCHAR(200),
    customer_phone VARCHAR(30),
    customer_email VARCHAR(100),
    customer_address TEXT,
    subtotal DECIMAL(12, 2) NOT NULL DEFAULT 0,
    advance_payment DECIMAL(12, 2) NOT NULL DEFAULT 0,
    due_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    payment_status VARCHAR(20) NOT NULL DEFAULT 'due',
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_per_orders_branch_id ON per_orders(branch_id);
CREATE INDEX IF NOT EXISTS idx_per_orders_user_id ON per_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_per_orders_customer_id ON per_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_per_orders_order_number ON per_orders(order_number);
CREATE INDEX IF NOT EXISTS idx_per_orders_created_at ON per_orders(created_at);
CREATE INDEX IF NOT EXISTS idx_per_orders_status ON per_orders(status);

CREATE TABLE IF NOT EXISTS per_order_items (
    id SERIAL PRIMARY KEY,
    per_order_id INT NOT NULL REFERENCES per_orders(id) ON DELETE CASCADE,
    product_id INT NULL REFERENCES products(id) ON DELETE SET NULL,
    custom_product_name VARCHAR(300) NULL,
    quantity INT NOT NULL DEFAULT 1,
    unit_price DECIMAL(12, 2) NOT NULL,
    subtotal DECIMAL(12, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_product_or_custom CHECK (
        (product_id IS NOT NULL AND (custom_product_name IS NULL OR custom_product_name = '')) OR
        (product_id IS NULL AND custom_product_name IS NOT NULL AND trim(custom_product_name) <> '')
    )
);

CREATE INDEX IF NOT EXISTS idx_per_order_items_per_order_id ON per_order_items(per_order_id);
CREATE INDEX IF NOT EXISTS idx_per_order_items_product_id ON per_order_items(product_id);

DROP TRIGGER IF EXISTS per_orders_updated_at ON per_orders;
CREATE TRIGGER per_orders_updated_at BEFORE UPDATE ON per_orders
    FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

COMMENT ON TABLE per_orders IS 'Per-order (advance payment) orders; branch_id from admin selection or user profile.';
COMMENT ON TABLE per_order_items IS 'Line items: either product_id (catalog) or custom_product_name (ad-hoc).';
