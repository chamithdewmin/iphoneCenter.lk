-- Create brands table for PostgreSQL
-- Run this script in your PostgreSQL database

CREATE TABLE IF NOT EXISTS brands (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_brands_name ON brands(name);
CREATE INDEX IF NOT EXISTS idx_brands_is_active ON brands(is_active);

-- Migrate existing brands from products table to brands table
-- This will extract unique brands from products and insert them into brands table
INSERT INTO brands (name, description, is_active)
SELECT DISTINCT 
    brand as name,
    NULL as description,
    TRUE as is_active
FROM products
WHERE brand IS NOT NULL 
  AND brand != ''
  AND brand NOT IN (SELECT name FROM brands)
ON CONFLICT (name) DO NOTHING;

-- Verify the brands table was created
SELECT COUNT(*) as brand_count FROM brands;
