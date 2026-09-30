-- =============================================
-- Lab 1 - Exercise 2 (Extended requirement)
-- PART 2. Data Manipulation & SQL Queries (DML & DQL)
-- =============================================
USE ecommerce_db;

-- ---------------------------------------------
-- Q1. Insert sample data
-- ---------------------------------------------
-- Extra products priced 100,000 - 1,000,000 VND (so that Q2 returns rows)
INSERT INTO products (id, title, price, stock, category) VALUES
(4, 'Anker USB-C Cable 1m',    150000.00, 50, 'Accessories'),
(5, 'XL Gaming Mouse Pad',     200000.00, 30, 'Accessories'),
(6, 'Logitech K380 Keyboard',  750000.00, 20, 'Accessories'),
(7, 'Samsung EVO 64GB MicroSD',250000.00, 40, 'Storage');

-- At least 3 orders for different users
INSERT INTO orders (id, user_id, total_amount, status) VALUES
(1, 1, 35200000.00, 'completed'),
(2, 2,  2500000.00, 'pending'),
(3, 1,  3000000.00, 'completed'),
(4, 2,   750000.00, 'cancelled');

-- Corresponding line items (price = unit price at the time of purchase)
INSERT INTO order_items (order_id, product_id, quantity, price) VALUES
(1, 1, 1, 35000000.00),
(1, 5, 1,   200000.00),
(2, 2, 1,  2200000.00),
(2, 4, 2,   150000.00),
(3, 3, 1,  2500000.00),
(3, 7, 2,   250000.00),
(4, 6, 1,   750000.00);

SELECT * FROM orders;
SELECT * FROM order_items;

-- ---------------------------------------------
-- Q2. Filter & search products
-- Products priced between 100,000 and 1,000,000 VND, highest price first
-- ---------------------------------------------
SELECT id, title, price, stock, category
FROM products
WHERE price BETWEEN 100000 AND 1000000
ORDER BY price DESC;

-- ---------------------------------------------
-- Q3. Table joins (INNER JOIN users, orders, order_items, products)
-- ---------------------------------------------
SELECT
  o.id          AS `Order ID`,
  u.full_name   AS `Customer Name`,
  p.title       AS `Product Name`,
  oi.quantity   AS `Quantity`,
  oi.price      AS `Unit Price`,
  o.status      AS `Order Status`
FROM orders o
INNER JOIN users u        ON o.user_id = u.id
INNER JOIN order_items oi ON oi.order_id = o.id
INNER JOIN products p     ON oi.product_id = p.id
ORDER BY o.id, oi.id;

-- ---------------------------------------------
-- Q4. Revenue statistics (GROUP BY & AGGREGATE)
-- ---------------------------------------------
-- Q4a. Total revenue from all completed orders
SELECT SUM(total_amount) AS total_revenue
FROM orders
WHERE status = 'completed';

-- Q4b. Number of orders placed by each user
SELECT user_id, COUNT(*) AS total_orders
FROM orders
GROUP BY user_id;
