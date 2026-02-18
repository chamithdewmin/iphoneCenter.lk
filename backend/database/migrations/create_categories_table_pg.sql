-- Create categories table for PostgreSQL
-- Run this script in your PostgreSQL database

CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON categories(is_active);

-- Migrate existing categories from products table to categories table
-- This will extract unique categories from products and insert them into categories table
INSERT INTO categories (name, description, is_active)
SELECT DISTINCT 
    category as name,
    NULL as description,
    TRUE as is_active
FROM products
WHERE category IS NOT NULL 
  AND category != ''
  AND category NOT IN (SELECT name FROM categories)
ON CONFLICT (name) DO NOTHING;

-- Verify the categories table was created
SELECT COUNT(*) as category_count FROM categories;
