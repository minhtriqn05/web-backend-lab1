// =============================================
// Lab 1 - Exercise 3: MongoDB shop_db (mongosh / Compass shell)
// Connection: mongodb://localhost:27017
// =============================================

// 1. Switch to the shop_db database
use shop_db;

// 2. Insert 2 order documents into the orders collection (insertMany)
db.orders.insertMany([
  {
    order_code: "ORD-2026-001",
    customer_name: "Nguyen Van A",
    customer_email: "nguyenvana@gmail.com",
    total_amount: 37500000,
    status: "completed",
    items: [
      { product_name: "Laptop Dell XPS 15", quantity: 1, price: 35000000 },
      { product_name: "Logitech MX Master 3S Mouse", quantity: 1, price: 2500000 }
    ],
    created_at: new Date()
  },
  {
    order_code: "ORD-2026-002",
    customer_name: "Tran Thi B",
    customer_email: "tranthib@gmail.com",
    total_amount: 2200000,
    status: "pending",
    items: [
      { product_name: "Keychron K2 Mechanical Keyboard", quantity: 1, price: 2200000 }
    ],
    created_at: new Date()
  }
]);

// 3. Query documents (Find) - orders with status 'completed'
db.orders.find({ status: "completed" }).pretty();

// 4. Update an order's status (Update)
db.orders.updateOne(
  { order_code: "ORD-2026-002" },
  { $set: { status: "processing" } }
);

// Check the result of the update
db.orders.find({ order_code: "ORD-2026-002" });

// =============================================
// EXTENDED REQUIREMENT: Array queries and aggregation
// =============================================

// ---------- Q1. Insert varied data ----------
db.orders.insertMany([
  {
    order_code: "ORD-2026-003",
    customer_name: "Le Van C",
    customer_email: "levanc@gmail.com",
    total_amount: 9200000,
    status: "completed",
    items: [
      { product_name: "Samsung Odyssey G5 Monitor", quantity: 1, price: 6500000 },
      { product_name: "Logitech MX Master 3S Mouse", quantity: 1, price: 2500000 },
      { product_name: "XL Gaming Mouse Pad", quantity: 1, price: 200000 }
    ],
    created_at: new Date()
  },
  {
    order_code: "ORD-2026-004",
    customer_name: "Pham Thi D",
    customer_email: "phamthid@gmail.com",
    total_amount: 850000,
    status: "cancelled",
    items: [
      { product_name: "Anker USB-C Hub 7-in-1", quantity: 1, price: 850000 }
    ],
    created_at: new Date()
  }
]);

// ---------- Q2. Conditional & nested-document queries ----------
// Q2a. total_amount >= 5,000,000 VND AND status = 'completed'
db.orders.find(
  { total_amount: { $gte: 5000000 }, status: "completed" },
  { _id: 0, order_code: 1, customer_name: 1, total_amount: 1, status: 1 }
);

// Q2b. Orders that include "Logitech MX Master 3S Mouse" in the items array
db.orders.find(
  { "items.product_name": "Logitech MX Master 3S Mouse" },
  { _id: 0, order_code: 1, customer_name: 1, "items.product_name": 1 }
);

// ---------- Q3. Array update ($push + $inc) ----------
db.orders.updateOne(
  { order_code: "ORD-2026-002" },
  {
    $push: { items: { product_name: "XL Gaming Mouse Pad", quantity: 1, price: 200000 } },
    $inc: { total_amount: 200000 }
  }
);
db.orders.find({ order_code: "ORD-2026-002" });

// ---------- Q4. Aggregation Framework statistics ----------
// Q4a. Total revenue from all completed orders ($match + $group)
db.orders.aggregate([
  { $match: { status: "completed" } },
  { $group: { _id: null, totalRevenue: { $sum: "$total_amount" }, completedOrders: { $sum: 1 } } }
]);

// Q4b. Number of orders grouped by status
db.orders.aggregate([
  { $group: { _id: "$status", totalOrders: { $sum: 1 } } },
  { $sort: { totalOrders: -1 } }
]);
