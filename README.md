# Web Backend & Database Lab 1

- **Course:** Web Application and Database Development Practicum (Backend & Database)
- **Class:** CSBU109.R11.KHBC
- **Student:** Nguyễn Minh Trí – 23560042

Source code of the **Lab 1** and **Lab 1B** in-class exercises. Screenshots and explanations for every question are in the submitted report `Lab1_23560042_NguyenMinhTri.docx`.

## Repository structure

| Path | Exercise |
|---|---|
| `lab1-backend/` | Lab 1 – Exercise 1: Express server (`/`, `/api/health`, `/api/greeting`) |
| `sql/lab1_ex2_ecommerce.sql` | Lab 1 – Exercise 2: sample script (`ecommerce_db`, `users`, `products`) |
| `sql/lab1_ex2_extended.sql` | Lab 1 – Exercise 2: extended DDL (`orders`, `order_items`) |
| `sql/lab1_ex2_queries.sql` | Lab 1 – Exercise 2: Q1–Q4 |
| `mongodb/lab1_ex3_shop_db.js` | Lab 1 – Exercise 3: `shop_db` commands (mongosh) and Q1–Q4 |
| `lab1b/json_xml_demo.js` | Lab 1B – Exercise 1: JSON ↔ XML with `xml2js`, `validateAndMerge()` |
| `lab1b/mysql_demo.js`, `lab1b/mysql_extended.js` | Lab 1B – Exercise 2: `mysql2` connection pool, prepared statements, Questions 1–8 |
| `sql/lab1b_ex2_check.sql` | Lab 1B – Exercise 2: SQL used to cross-check the results in MySQL Workbench |
| `lab1b/mongoose_demo.js`, `lab1b/mongoose_extended.js` | Lab 1B – Exercise 3: Mongoose schema, validation, hooks, Questions 1–10 |

## How to run

Requirements: Node.js (LTS), MySQL Server 8.x and a local MongoDB server (`mongodb://localhost:27017`).

### Lab 1 – Exercise 1

```bash
cd lab1-backend
npm install
node server.js   # http://localhost:5000  (PORT can be set in .env, default 5000)
```

### Lab 1 – Exercises 2 and 3

- MySQL Workbench: run `sql/lab1_ex2_ecommerce.sql`, then `sql/lab1_ex2_extended.sql`, then `sql/lab1_ex2_queries.sql` (each script once).
- MongoDB Compass / mongosh: run the commands in `mongodb/lab1_ex3_shop_db.js` in order.

### Lab 1B

1. Create the database in MySQL: `CREATE DATABASE IF NOT EXISTS store_db;`
2. Install the packages and create `lab1b/.env` (this file is not committed):

```bash
cd lab1b
npm install
```

```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=<your MySQL password>
DB_NAME=store_db
DB_PORT=3306
MONGO_URI=mongodb://localhost:27017/shop_mongoose_db
```

3. Run the exercises from the `lab1b` folder:

```bash
node json_xml_demo.js      # Exercise 1 (writes product.json, product.xml, product_final.json)
node mysql_demo.js         # Exercise 2 – basic CRUD (run on a fresh store_db: category names are UNIQUE)
node mysql_extended.js     # Exercise 2 – Questions 1–8 (resets the sample data on every run)
node mongoose_demo.js      # Exercise 3 – basic CRUD
node mongoose_extended.js  # Exercise 3 – Questions 1–10 (resets the users and posts collections)
```

## Notes

- `node_modules/` and `.env` are excluded by `.gitignore`, so no passwords are stored in this repository.
- Lab 1 – Exercise 2: four products priced 150,000–750,000 VND are inserted in Q1, because all three sample products cost more than 1,000,000 VND and Q2 would otherwise return no rows.
- Lab 1B – Exercise 2: one extra item, *Gaming Headset*, is added to the sample data, because no sample item contains the keyword "Gaming" used in Question 2.
