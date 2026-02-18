-- Add brands table migration
-- This creates a brands table to store brand information separately

CREATE TABLE IF NOT EXISTS brands (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Optional: Migrate existing brands from products table to brands table
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
ON DUPLICATE KEY UPDATE name=name;
