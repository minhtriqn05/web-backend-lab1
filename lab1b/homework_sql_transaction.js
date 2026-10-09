// homework_sql_transaction.js - Lab 1b Homework 1
// Managing order transactions with SQL transaction integrity (mysql2/promise)
require('dotenv').config();
const mysql = require('mysql2/promise');

const DB_NAME = 'store_transaction_db';
let pool;

// ---------------------------------------------------------------
// 0. Create the database, the 4 tables and the sample data
// ---------------------------------------------------------------
async function setupDatabase() {
  // Connect without a database first, so we can create store_transaction_db
  const admin = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT
  });
  await admin.query(`CREATE DATABASE IF NOT EXISTS ${DB_NAME}`);
  await admin.end();

  pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    database: DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  // Reset so every run starts from the same state
  await pool.query('DROP TABLE IF EXISTS order_items, orders, products, customers');

  await pool.query(`
    CREATE TABLE customers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      full_name VARCHAR(100) NOT NULL,
      balance DECIMAL(12,2) NOT NULL DEFAULT 0
    )`);
  await pool.query(`
    CREATE TABLE products (
      id INT AUTO_INCREMENT PRIMARY KEY,
      product_name VARCHAR(150) NOT NULL,
      price DECIMAL(12,2) NOT NULL,
      stock INT NOT NULL DEFAULT 0
    )`);
  await pool.query(`
    CREATE TABLE orders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      customer_id INT NOT NULL,
      total_amount DECIMAL(12,2) NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    )`);
  await pool.query(`
    CREATE TABLE order_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      order_id INT NOT NULL,
      product_id INT NOT NULL,
      quantity INT NOT NULL,
      price DECIMAL(12,2) NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    )`);

  await pool.query(`
    INSERT INTO customers (full_name, balance) VALUES
    ('Nguyen Minh Tri', 10000000.00),
    ('Tran Thi Mai', 500000.00)`);
  await pool.query(`
    INSERT INTO products (product_name, price, stock) VALUES
    ('Logitech MX Master 3S', 2500000.00, 10),
    ('Keychron K2', 2200000.00, 1),
    ('XL Gaming Mouse Pad', 200000.00, 50)`);

  console.log(`-> Database ${DB_NAME} and sample data are ready.`);
}

// ---------------------------------------------------------------
// Place an order inside ONE transaction (5 strict steps)
// ---------------------------------------------------------------
async function placeOrder(customerId, productId, quantity) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Step 1: check balance >= total AND stock >= quantity
    //         (FOR UPDATE locks the rows until COMMIT/ROLLBACK)
    const [[customer]] = await conn.execute(
      'SELECT id, full_name, balance FROM customers WHERE id = ? FOR UPDATE', [customerId]);
    const [[product]] = await conn.execute(
      'SELECT id, product_name, price, stock FROM products WHERE id = ? FOR UPDATE', [productId]);
    if (!customer || !product) throw new Error('Customer or product not found');

    const total = Number(product.price) * quantity;
    if (Number(customer.balance) < total) {
      throw new Error(`Insufficient balance: ${customer.full_name} has ${customer.balance} but the order costs ${total}`);
    }
    if (product.stock < quantity) {
      throw new Error(`Out of stock: only ${product.stock} "${product.product_name}" left, ${quantity} requested`);
    }

    // Step 2: deduct the amount from the customer's balance
    await conn.execute('UPDATE customers SET balance = balance - ? WHERE id = ?', [total, customerId]);

    // Step 3: deduct the quantity from the product's stock
    await conn.execute('UPDATE products SET stock = stock - ? WHERE id = ?', [quantity, productId]);

    // Step 4: insert a new order record
    const [orderResult] = await conn.execute(
      'INSERT INTO orders (customer_id, total_amount) VALUES (?, ?)', [customerId, total]);

    // Step 5: insert the order line item
    await conn.execute(
      'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
      [orderResult.insertId, productId, quantity, product.price]);

    await conn.commit();
    console.log(`COMMIT  -> Order #${orderResult.insertId} created: ${customer.full_name} bought ${quantity} x "${product.product_name}" (total ${total})`);
    return orderResult.insertId;
  } catch (error) {
    await conn.rollback();
    console.log(`ROLLBACK -> ${error.message}. No data was changed.`);
    return null;
  } finally {
    conn.release();
  }
}

async function showState(title) {
  console.log(`\n--- ${title} ---`);
  const [customers] = await pool.query('SELECT id, full_name, balance FROM customers');
  const [products] = await pool.query('SELECT id, product_name, price, stock FROM products');
  const [orders] = await pool.query('SELECT id, customer_id, total_amount FROM orders');
  const [items] = await pool.query('SELECT id, order_id, product_id, quantity, price FROM order_items');
  console.log('customers:'); console.table(customers);
  console.log('products:'); console.table(products);
  console.log(`orders: ${orders.length} row(s)`); if (orders.length) console.table(orders);
  console.log(`order_items: ${items.length} row(s)`); if (items.length) console.table(items);
}

async function main() {
  try {
    await setupDatabase();
    await showState('INITIAL STATE');

    console.log('\n=== Case 1: valid order (enough balance & stock) ===');
    await placeOrder(1, 1, 2);   // Tri buys 2 x MX Master 3S = 5,000,000

    console.log('\n=== Case 2: insufficient balance ===');
    await placeOrder(2, 2, 1);   // Mai has 500,000 but K2 costs 2,200,000

    console.log('\n=== Case 3: out of stock ===');
    await placeOrder(1, 2, 2);   // 2 x K2 = 4,400,000 (Tri can pay) but only 1 K2 left

    await showState('FINAL STATE (only Case 1 was saved)');
  } catch (error) {
    console.error('MySQL error:', error.message);
  } finally {
    if (pool) await pool.end();
    console.log('\n-> Connection pool closed.');
  }
}

main();
