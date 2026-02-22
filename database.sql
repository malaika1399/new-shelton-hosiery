-- =============================================
--  NEW SHELTON HOSIERY – DATABASE SCHEMA
--  Import this file in phpMyAdmin
-- =============================================

CREATE DATABASE IF NOT EXISTS shelton_db;
USE shelton_db;

-- USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    phone VARCHAR(20),
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    description TEXT
);

-- PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    old_price DECIMAL(10,2),
    stock INT DEFAULT 0,
    badge VARCHAR(50),
    is_featured TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- ORDERS TABLE
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(150),
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(10),
    payment_method VARCHAR(50),
    subtotal DECIMAL(10,2),
    tax DECIMAL(10,2),
    total DECIMAL(10,2),
    status VARCHAR(50) DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ORDER ITEMS TABLE
CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT,
    product_id INT,
    product_name VARCHAR(200),
    price DECIMAL(10,2),
    qty INT,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- REVIEWS TABLE
CREATE TABLE IF NOT EXISTS reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT,
    user_name VARCHAR(100),
    user_email VARCHAR(150),
    rating INT CHECK (rating BETWEEN 1 AND 5),
    review TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- NEWSLETTER TABLE
CREATE TABLE IF NOT EXISTS newsletter (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(150) UNIQUE NOT NULL,
    subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── SAMPLE DATA ──
INSERT INTO categories (name, slug) VALUES
('Woolen Classic', 'woolen'),
('Cashmere Luxe', 'cashmere'),
('Cable Knit', 'cable'),
('Cardigans', 'cardigan'),
('Turtlenecks', 'turtleneck');

INSERT INTO products (category_id, name, description, price, old_price, stock, badge, is_featured) VALUES
(1, 'Rosewood Pullover', 'A timeless woolen pullover from premium merino wool.', 1299.00, 1799.00, 50, 'New', 1),
(2, 'Azure Dream Sweater', 'Luxurious cashmere sweater in rich azure blue.', 2499.00, 3200.00, 30, 'Sale', 1),
(3, 'Golden Harvest Knit', 'Classic cable knit in warm golden tones.', 1599.00, NULL, 45, NULL, 1),
(4, 'Violet Mist Cardigan', 'Elegant cardigan in soft violet shades.', 1899.00, 2400.00, 40, 'New', 1),
(1, 'Sage Garden Pullover', 'Fresh sage green woolen pullover.', 1199.00, NULL, 60, NULL, 1),
(2, 'Terracotta Bliss Top', 'Warm terracotta cashmere top.', 2199.00, 2800.00, 25, 'Sale', 1),
(3, 'Olive Twist Sweater', 'Olive toned cable knit sweater.', 1499.00, NULL, 35, NULL, 1),
(4, 'Ocean Breeze Cardigan', 'Breezy ocean-blue long cardigan.', 1799.00, 2200.00, 30, 'New', 1);
