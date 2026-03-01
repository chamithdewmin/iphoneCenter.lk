-- ============================================
-- Enterprise Pre-Order: expected_delivery_date, cancel fields, converted_sale_id
-- sale_items: allow custom_product_name for convert-to-sale from per-order custom items
-- ============================================
-- Run: psql "postgresql://USER:PASS@HOST:5432/DB" -f backend/database/migrations/add_preorder_enterprise_fields.pg.sql

-- per_orders: add expected_delivery_date, cancel tracking, link to converted sale
ALTER TABLE per_orders
  ADD COLUMN IF NOT EXISTS expected_delivery_date DATE NULL,
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP NULL,
  ADD COLUMN IF NOT EXISTS cancelled_by INT NULL REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS cancel_reason TEXT NULL,
  ADD COLUMN IF NOT EXISTS converted_sale_id INT NULL;

-- FK to sales (may not exist yet in some setups)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'per_orders' AND constraint_name = 'per_orders_converted_sale_id_fkey'
  ) THEN
    ALTER TABLE per_orders
      ADD CONSTRAINT per_orders_converted_sale_id_fkey
      FOREIGN KEY (converted_sale_id) REFERENCES sales(id) ON DELETE SET NULL;
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_per_orders_expected_delivery_date ON per_orders(expected_delivery_date);
CREATE INDEX IF NOT EXISTS idx_per_orders_converted_sale_id ON per_orders(converted_sale_id);
CREATE INDEX IF NOT EXISTS idx_per_orders_cancelled_at ON per_orders(cancelled_at);

-- sale_items: allow custom lines (no product_id) for convert-to-sale from per-order custom items
ALTER TABLE sale_items ADD COLUMN IF NOT EXISTS custom_product_name VARCHAR(300) NULL;
ALTER TABLE sale_items ALTER COLUMN product_id DROP NOT NULL;

-- Constraint: each sale_item has either product_id or custom_product_name
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'sale_items' AND constraint_name = 'chk_sale_item_product_or_custom'
  ) THEN
    ALTER TABLE sale_items ADD CONSTRAINT chk_sale_item_product_or_custom CHECK (
      (product_id IS NOT NULL) OR
      (custom_product_name IS NOT NULL AND trim(custom_product_name) <> '')
    );
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

COMMENT ON COLUMN per_orders.expected_delivery_date IS 'Expected delivery date for enterprise pre-order.';
COMMENT ON COLUMN per_orders.converted_sale_id IS 'Set when pre-order is converted to sale.';
COMMENT ON COLUMN sale_items.custom_product_name IS 'For ad-hoc/custom items (e.g. from per-order convert).';
