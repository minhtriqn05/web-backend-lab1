// =============================================
// Lab 1 - Homework 2: Blog System NoSQL Database (blog_db)
// Run in MongoDB Shell (mongosh) / Compass shell - localhost:27017
// =============================================

// 1. Create the blog_db database and the posts collection
use blog_db;
db.posts.drop();   // reset so the script can be re-run

// 2. Insert 3 posts with embedded objects (author) and arrays (tags, comments)
db.posts.insertMany([
  {
    title: "Getting Started with Node.js",
    category: "Tech",
    views: 150,
    author: { name: "Nguyen Minh Tri", email: "minhtri@gmail.com" },
    tags: ["nodejs", "javascript", "backend"],
    comments: [
      { user: "Tran Thi Mai", content: "Very clear introduction!", created_at: new Date("2026-10-01") },
      { user: "Le Van Nam", content: "Thanks for sharing.", created_at: new Date("2026-10-02") }
    ]
  },
  {
    title: "Building REST APIs with Express",
    category: "Tech",
    views: 80,
    author: { name: "Tran Thi Mai", email: "mai.tran@gmail.com" },
    tags: ["nodejs", "express", "backend"],
    comments: [
      { user: "Nguyen Minh Tri", content: "Can you add a part about middleware?", created_at: new Date("2026-10-03") }
    ]
  },
  {
    title: "10 Tips for Learning Chinese",
    category: "Education",
    views: 220,
    author: { name: "Le Van Nam", email: "nam.le@gmail.com" },
    tags: ["language", "chinese", "study"],
    comments: []
  }
]);

// Query 1: posts in the 'Tech' category AND with views >= 100
db.posts.find(
  { category: "Tech", views: { $gte: 100 } },
  { _id: 0, title: 1, category: 1, views: 1 }
);

// Query 2: all posts tagged with 'nodejs'
db.posts.find(
  { tags: "nodejs" },
  { _id: 0, title: 1, tags: 1 }
);

// Update: add a new comment ($push) and increase views by 1 ($inc), found by title
db.posts.updateOne(
  { title: "Building REST APIs with Express" },
  {
    $push: { comments: { user: "Pham Thi Lan", content: "Great tutorial, thank you!", created_at: new Date() } },
    $inc: { views: 1 }
  }
);
db.posts.find(
  { title: "Building REST APIs with Express" },
  { _id: 0, title: 1, views: 1, comments: 1 }
);

// Aggregation: totalViews and totalPosts grouped by category
db.posts.aggregate([
  { $group: { _id: "$category", totalViews: { $sum: "$views" }, totalPosts: { $sum: 1 } } },
  { $sort: { totalViews: -1 } }
]);
