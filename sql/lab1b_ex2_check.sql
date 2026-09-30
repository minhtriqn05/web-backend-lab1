-- =============================================
-- Lab 1b - Exercise 2: Cross-check the Node.js results in MySQL Workbench
-- (resets the data exactly like setupDatabaseAndSeedData() and then runs
--  the same SQL as each question)
-- =============================================
USE store_db;

-- Reset & seed (same as setupDatabaseAndSeedData in mysql_extended.js)
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE items;
TRUNCATE TABLE categories;
SET FOREIGN_KEY_CHECKS = 1;

INSERT INTO categories (name, description) VALUES
('Food', 'Daily essentials and groceries'),
('Electronics', 'Gadgets, phones and computers'),
('Clothing', 'Apparel and fashion items'),
('Books', 'Educational and entertainment books'),
('Home & Living', 'Furniture and home appliances'),
('Sports & Outdoors', 'Sporting goods and outdoor equipment');

INSERT INTO items (category_id, item_name, price, quantity) VALUES
(1, 'Apple', 25000.00, 100),
(1, 'Milk', 32000.00, 50),
(1, 'Bread', 15000.00, 30),
(2, 'Smartphone', 5500000.00, 15),
(2, 'Wireless Mouse', 250000.00, 40),
(3, 'T-Shirt', 120000.00, 60),
(3, 'Jeans', 350000.00, 25),
(4, 'Node.js Programming', 180000.00, 20),
(5, 'Desk Lamp', 150000.00, 35),
(5, 'Coffee Mug', 45000.00, 80),
(2, 'Gaming Headset', 1200000.00, 10);

-- Q1. Filter & sort
SELECT id, item_name, price, quantity
FROM items
WHERE price >= 500000 AND quantity > 0
ORDER BY price DESC;

-- Q2. LIKE search ('Gaming' / 'Wireless')
SELECT id, item_name, price, quantity FROM items WHERE item_name LIKE '%Gaming%';
SELECT id, item_name, price, quantity FROM items WHERE item_name LIKE '%Wireless%';

-- Q3. Aggregate functions
SELECT SUM(quantity) AS total_quantity,
       ROUND(AVG(price), 2) AS average_price,
       COUNT(*) AS total_items
FROM items;

-- Q4. GROUP BY & HAVING
SELECT c.id AS category_id, c.name AS category_name,
       COUNT(i.id) AS total_items,
       SUM(i.price * i.quantity) AS inventory_value
FROM categories c
INNER JOIN items i ON i.category_id = c.id
GROUP BY c.id, c.name
HAVING inventory_value > 10000000
ORDER BY inventory_value DESC;

-- Q5. LEFT JOIN - categories without items
SELECT c.id, c.name, c.description
FROM categories c
LEFT JOIN items i ON i.category_id = c.id
WHERE i.id IS NULL;

-- Q6. UPDATE item #5 and return the new values
UPDATE items SET quantity = quantity + 10, price = 230000 WHERE id = 5;
SELECT id, item_name, price, quantity FROM items WHERE id = 5;

-- Q7. Subquery - most expensive item
SELECT id, item_name, price, quantity
FROM items
WHERE price = (SELECT MAX(price) FROM items);

-- Q8. Category #1 still has child items, so deleting it violates the foreign key
SELECT c.id, c.name, COUNT(i.id) AS child_items
FROM categories c JOIN items i ON i.category_id = c.id
WHERE c.id = 1
GROUP BY c.id, c.name;
DELETE FROM categories WHERE id = 1;   -- expected: Error 1451 (foreign key constraint fails)
