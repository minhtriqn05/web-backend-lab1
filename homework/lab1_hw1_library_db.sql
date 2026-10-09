-- =============================================
-- Lab 1 - Homework 1: Library Management Database (library_db)
-- =============================================

-- 1. Create the database (reset to a known state so the script can be re-run)
DROP DATABASE IF EXISTS library_db;
CREATE DATABASE library_db;
USE library_db;

-- 2. authors table
CREATE TABLE authors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  author_name VARCHAR(100) NOT NULL,
  nationality VARCHAR(50)
);

-- 3. books table (author_id -> authors.id)
CREATE TABLE books (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  author_id INT NOT NULL,
  category VARCHAR(50),
  publish_year INT,
  CONSTRAINT fk_books_author
    FOREIGN KEY (author_id) REFERENCES authors(id)
);

-- 4. borrow_records table (book_id -> books.id)
CREATE TABLE borrow_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  book_id INT NOT NULL,
  borrower_name VARCHAR(100) NOT NULL,
  borrow_date DATE NOT NULL,
  return_date DATE,                       -- NULL = not returned yet
  CONSTRAINT fk_borrow_book
    FOREIGN KEY (book_id) REFERENCES books(id)
);

-- 5. Sample data (at least 3 records per table)
INSERT INTO authors (author_name, nationality) VALUES
('Nguyen Nhat Anh', 'Vietnamese'),
('Haruki Murakami', 'Japanese'),
('Robert C. Martin', 'American');

INSERT INTO books (title, author_id, category, publish_year) VALUES
('Toi Thay Hoa Vang Tren Co Xanh', 1, 'Novel', 2010),
('Norwegian Wood', 2, 'Novel', 1987),
('Clean Code', 3, 'Programming', 2008),
('Clean Architecture', 3, 'Programming', 2017);

INSERT INTO borrow_records (book_id, borrower_name, borrow_date, return_date) VALUES
(1, 'Nguyen Minh Tri', '2026-09-20', '2026-09-27'),
(3, 'Tran Thi Mai', '2026-09-25', NULL),
(2, 'Le Van Nam', '2026-10-01', '2026-10-08'),
(4, 'Nguyen Minh Tri', '2026-10-05', NULL);

SELECT * FROM authors;
SELECT * FROM books;
SELECT * FROM borrow_records;

-- 6. JOIN across all 3 tables
SELECT
  b.title          AS `Book Title`,
  a.author_name    AS `Author Name`,
  br.borrower_name AS `Borrower Name`,
  br.borrow_date   AS `Borrow Date`
FROM borrow_records br
INNER JOIN books b   ON br.book_id = b.id
INNER JOIN authors a ON b.author_id = a.id
ORDER BY br.borrow_date;
