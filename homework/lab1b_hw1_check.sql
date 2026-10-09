-- Lab 1b - Homework 1: cross-check in MySQL Workbench after running homework_sql_transaction.js
USE store_transaction_db;
SELECT * FROM customers;      -- Tri: 5,000,000 (10,000,000 - 5,000,000) | Mai: 500,000 (unchanged)
SELECT * FROM products;       -- MX Master 3S: stock 8 | Keychron K2: stock 1 (unchanged)
SELECT * FROM orders;         -- only 1 order
SELECT * FROM order_items;    -- only 1 line item
