// mysql_extended.js - Lab 1b Exercise 2: EXTENDED REQUIREMENT (items table + Q1-Q8)
require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// ---------------------------------------------------------------
// Sample data for the extended exercise (from the lab sheet)
// ---------------------------------------------------------------
async function setupDatabaseAndSeedData(pool) {
  // Make sure the parent table exists (created in mysql_demo.js)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS categories (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL UNIQUE,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create the items table with a foreign key referencing categories
  await pool.query(`
    CREATE TABLE IF NOT EXISTS items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      category_id INT NOT NULL,
      item_name VARCHAR(150) NOT NULL,
      price DECIMAL(12,2) NOT NULL,
      quantity INT DEFAULT 0,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
    );
  `);

  // Clear old data so the environment always resets to a known state
  await pool.query('SET FOREIGN_KEY_CHECKS = 0;');
  await pool.query('TRUNCATE TABLE items;');
  await pool.query('TRUNCATE TABLE categories;');
  await pool.query('SET FOREIGN_KEY_CHECKS = 1;');

  // Seed the categories table
  await pool.query(`
    INSERT INTO categories (name, description) VALUES
    ('Food', 'Daily essentials and groceries'),
    ('Electronics', 'Gadgets, phones and computers'),
    ('Clothing', 'Apparel and fashion items'),
    ('Books', 'Educational and entertainment books'),
    ('Home & Living', 'Furniture and home appliances'),
    ('Sports & Outdoors', 'Sporting goods and outdoor equipment');
  `);

  // Seed the items table
  // Note: 'Sports & Outdoors' intentionally has no items, for the LEFT JOIN exercise (Question 5).
  await pool.query(`
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
    (5, 'Coffee Mug', 45000.00, 80);
  `);

  // Extra item (added so that the 'Gaming' keyword search in Question 2 returns a row)
  await pool.query(`
    INSERT INTO items (category_id, item_name, price, quantity) VALUES
    (2, 'Gaming Headset', 1200000.00, 10);
  `);

  console.log('Table structure and sample data initialized successfully!');
}

// ---------------------------------------------------------------
// Question 1 (Filter & sort): price >= 500,000 AND quantity > 0, highest price first
// ---------------------------------------------------------------
async function q1FilterAndSort() {
  const sql = `
    SELECT id, item_name, price, quantity
    FROM items
    WHERE price >= ? AND quantity > ?
    ORDER BY price DESC`;
  const [rows] = await pool.execute(sql, [500000, 0]);
  console.table(rows);
}

// ---------------------------------------------------------------
// Question 2 (Wildcard / LIKE search) with a prepared statement
// ---------------------------------------------------------------
async function searchItemsByKeyword(keyword) {
  const sql = 'SELECT id, item_name, price, quantity FROM items WHERE item_name LIKE ?';
  const [rows] = await pool.execute(sql, [`%${keyword}%`]);
  console.log(`Keyword "${keyword}": ${rows.length} item(s) found`);
  console.table(rows);
  return rows;
}

// ---------------------------------------------------------------
// Question 3 (Aggregate functions): SUM(quantity), AVG(price), COUNT(*)
// ---------------------------------------------------------------
async function q3Aggregates() {
  const sql = `
    SELECT SUM(quantity)          AS total_quantity,
           ROUND(AVG(price), 2)   AS average_price,
           COUNT(*)               AS total_items
    FROM items`;
  const [rows] = await pool.execute(sql);
  console.table(rows);
}

// ---------------------------------------------------------------
// Question 4 (GROUP BY & HAVING): inventory value per category > 10,000,000
// ---------------------------------------------------------------
async function q4CategoryStatistics() {
  const sql = `
    SELECT c.id                     AS category_id,
           c.name                   AS category_name,
           COUNT(i.id)              AS total_items,
           SUM(i.price * i.quantity) AS inventory_value
    FROM categories c
    INNER JOIN items i ON i.category_id = c.id
    GROUP BY c.id, c.name
    HAVING inventory_value > ?
    ORDER BY inventory_value DESC`;
  const [rows] = await pool.execute(sql, [10000000]);
  console.table(rows);
}

// ---------------------------------------------------------------
// Question 5 (LEFT JOIN): categories that do not have any items yet
// ---------------------------------------------------------------
async function q5CategoriesWithoutItems() {
  const sql = `
    SELECT c.id, c.name, c.description
    FROM categories c
    LEFT JOIN items i ON i.category_id = c.id
    WHERE i.id IS NULL`;
  const [rows] = await pool.execute(sql);
  console.table(rows);
}

// ---------------------------------------------------------------
// Question 6 (UPDATE & return the new values)
// ---------------------------------------------------------------
async function updateItemStockAndPrice(itemId, addQuantity, newPrice) {
  const selectSql = 'SELECT id, item_name, price, quantity FROM items WHERE id = ?';

  const [before] = await pool.execute(selectSql, [itemId]);
  console.log('Before update:');
  console.table(before);

  const [result] = await pool.execute(
    'UPDATE items SET quantity = quantity + ?, price = ? WHERE id = ?',
    [addQuantity, newPrice, itemId]
  );
  console.log(`Updated rows: ${result.affectedRows}`);

  const [after] = await pool.execute(selectSql, [itemId]);
  console.log('After update:');
  console.table(after);
  return after[0];
}

// ---------------------------------------------------------------
// Question 7 (Subquery): the most expensive item
// ---------------------------------------------------------------
async function q7MostExpensiveItem() {
  const sql = `
    SELECT id, item_name, price, quantity
    FROM items
    WHERE price = (SELECT MAX(price) FROM items)`;
  const [rows] = await pool.execute(sql);
  console.table(rows);
}

// ---------------------------------------------------------------
// Question 8 (DELETE & handle foreign key constraints with try/catch)
// ---------------------------------------------------------------
async function deleteCategory(categoryId) {
  try {
    const [result] = await pool.execute('DELETE FROM categories WHERE id = ?', [categoryId]);
    if (result.affectedRows === 0) {
      console.log(`Category #${categoryId} was not found.`);
    } else {
      console.log(`Category #${categoryId} was deleted successfully.`);
    }
  } catch (error) {
    if (error.code === 'ER_ROW_IS_REFERENCED_2' || error.errno === 1451) {
      console.log(`Cannot delete category #${categoryId}: it still contains items. ` +
                  'Please move or delete those items first.');
    } else {
      console.log(`Unexpected error while deleting category #${categoryId}: ${error.message}`);
    }
  }
}

// ---------------------------------------------------------------
// Run everything in order
// ---------------------------------------------------------------
async function main() {
  try {
    await setupDatabaseAndSeedData(pool);

    console.log('\n=== Q1. Items with price >= 500,000 AND quantity > 0 (price DESC) ===');
    await q1FilterAndSort();

    console.log('\n=== Q2. LIKE search by keyword ===');
    await searchItemsByKeyword('Gaming');
    await searchItemsByKeyword('Wireless');

    console.log('\n=== Q3. SUM(quantity), AVG(price), COUNT(*) ===');
    await q3Aggregates();

    console.log('\n=== Q4. Categories with inventory value > 10,000,000 (GROUP BY + HAVING) ===');
    await q4CategoryStatistics();

    console.log('\n=== Q5. Categories without any items (LEFT JOIN ... IS NULL) ===');
    await q5CategoriesWithoutItems();

    console.log('\n=== Q6. Add 10 to the stock of item #5 and set its price to 230,000 ===');
    await updateItemStockAndPrice(5, 10, 230000);

    console.log('\n=== Q7. Most expensive item (subquery) ===');
    await q7MostExpensiveItem();

    console.log('\n=== Q8. Delete categories (foreign key handling) ===');
    await deleteCategory(1); // 'Food' still has items -> friendly error message
    const [temp] = await pool.execute(
      'INSERT INTO categories (name, description) VALUES (?, ?)',
      ['Temporary Category', 'Created only to demonstrate a successful delete']
    );
    await deleteCategory(temp.insertId); // no child items -> deleted successfully
  } catch (error) {
    console.error('MySQL error:', error.message);
  } finally {
    await pool.end();
    console.log('\n-> Connection pool closed.');
  }
}

main();
