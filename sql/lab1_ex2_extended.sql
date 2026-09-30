-- =============================================
-- Lab 1 - Exercise 2 (Extended requirement)
-- Orders feature for ecommerce_db
-- =============================================
USE ecommerce_db;

-- ---------------------------------------------
-- PART 1. Extend the database structure (DDL)
-- ---------------------------------------------

-- 1.1 orders table (order management)
CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  status ENUM('pending', 'completed', 'cancelled') DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_orders_user
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 1.2 order_items table (order line items)
CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,   -- unit price at the time of purchase
  CONSTRAINT fk_order_items_order
    FOREIGN KEY (order_id) REFERENCES orders(id),
  CONSTRAINT fk_order_items_product
    FOREIGN KEY (product_id) REFERENCES products(id),
  CONSTRAINT chk_order_items_quantity
    CHECK (quantity > 0)
);

-- 1.3 Check the new table structures
DESCRIBE orders;
DESCRIBE order_items;
