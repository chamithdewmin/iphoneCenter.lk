-- Create categories table for MySQL
-- Run this script in your MySQL database

CREATE TABLE IF NOT EXISTS categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
  AND category NOT IN (SELECT name FROM categories);

-- Verify the categories table was created
SELECT COUNT(*) as category_count FROM categories;
