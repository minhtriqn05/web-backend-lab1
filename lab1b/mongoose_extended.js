// mongoose_extended.js - Lab 1b Exercise 3: EXTENDED REQUIREMENT (Questions 1-10)
// Advanced data modeling and querying with Mongoose ODM
require('dotenv').config();
const crypto = require('crypto');
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/shop_mongoose_db';

// ================================================================
// Q6. Embedded sub-document schema: addressSchema (street, city, isDefault)
// ================================================================
const addressSchema = new mongoose.Schema({
  street: { type: String, required: true, trim: true },
  city: { type: String, required: true, trim: true },
  isDefault: { type: Boolean, default: false }
});

// ================================================================
// userSchema (base schema from the lab + extended fields)
// ================================================================
const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
    minlength: [2, 'Full name must be at least 2 characters long']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Invalid email format']
  },
  // Q1. Custom validator with Regex: Vietnamese phone number
  //     (10 digits, starting with 03, 05, 07, 08 or 09)
  phone: {
    type: String,
    validate: {
      validator: (value) => /^(03|05|07|08|09)\d{8}$/.test(value),
      message: (props) => `"${props.value}" is not a valid Vietnamese phone number ` +
                          '(10 digits, starting with 03, 05, 07, 08 or 09)'
    }
  },
  password: { type: String, required: [true, 'Password is required'] },
  age: {
    type: Number,
    min: [18, 'User age must be at least 18'],
    max: [100, 'Invalid age']
  },
  role: { type: String, enum: ['user', 'admin', 'manager'], default: 'user' },
  isActive: { type: Boolean, default: true },
  // Q4. Soft delete flag
  isDeleted: { type: Boolean, default: false },
  // Q6. Array of embedded address sub-documents
  addresses: [addressSchema]
}, {
  timestamps: true,
  // Q2. Include virtual fields when the document is serialized to JSON / object
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ================================================================
// Q2. Virtual property: displayInfo = "Full Name <email> [ROLE]"
// ================================================================
userSchema.virtual('displayInfo').get(function () {
  return `${this.fullName} <${this.email}> [${String(this.role).toUpperCase()}]`;
});

// ================================================================
// Q3. Static method: find active users by role, sorted by name (A-Z)
// ================================================================
userSchema.statics.findActiveByRole = function (roleName) {
  return this.find({ role: roleName, isActive: true }).sort({ fullName: 1 });
};

// ================================================================
// Q4. Instance method: soft delete (keep the document, just flag it)
// ================================================================
userSchema.methods.softDelete = function () {
  this.isDeleted = true;
  this.isActive = false;
  return this.save();
};

// ================================================================
// Q5. Middleware hooks
// ================================================================
// pre('save'): simulate hashing the password before it is stored
userSchema.pre('save', function () {
  if (!this.isModified('password')) return; // only hash new / changed passwords
  const hash = crypto.createHash('sha256').update(this.password).digest('hex');
  this.password = `sha256$${hash}`;
  console.log(`[pre-save] Password of "${this.fullName}" hashed before saving`);
});

// pre(/^find/): automatically hide soft-deleted documents from every find query
userSchema.pre(/^find/, function () {
  this.where({ isDeleted: { $ne: true } });
});

const User = mongoose.model('User', userSchema);

// ================================================================
// Q7. References & population: postSchema with author -> User
// ================================================================
const postSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

const Post = mongoose.model('Post', postSchema);

// ================================================================
// Helper functions
// ================================================================
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const brief = (u) => ({ fullName: u.fullName, email: u.email, role: u.role, age: u.age, isActive: u.isActive });

// Q6. Add a new address to the addresses array of a specific user
async function addAddress(userId, address) {
  return User.findByIdAndUpdate(
    userId,
    { $push: { addresses: address } },
    { returnDocument: 'after', runValidators: true }
  );
}

// Q8. Pagination & sorting (most recent users first)
async function getPaginatedUsers(page, limit) {
  const filter = { isDeleted: { $ne: true } };
  const totalUsers = await User.countDocuments(filter);
  const users = await User.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .select('fullName email role createdAt')
    .lean();
  return {
    currentPage: page,
    totalPages: Math.ceil(totalUsers / limit),
    totalUsers,
    users
  };
}

// ================================================================
// Main
// ================================================================
async function main() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('-> Connected to MongoDB via Mongoose:', MONGO_URI);

    // Reset data
    await Post.deleteMany({});
    await User.deleteMany({});
    await User.syncIndexes();

    // Seed users one by one (so each one gets a different createdAt)
    const seed = [
      { fullName: 'Nguyen Van Hung', email: 'hung.nguyen@example.com', phone: '0901234567', password: 'Hung@123', age: 22, role: 'admin' },
      { fullName: 'Tran Thi Mai', email: 'mai.tran@example.com', phone: '0351234567', password: 'Mai@123', age: 25, role: 'manager' },
      { fullName: 'Le Van Nam', email: 'nam.le@example.com', phone: '0781234567', password: 'Nam@123', age: 30, role: 'user' },
      { fullName: 'Pham Thi Lan', email: 'lan.pham@example.com', phone: '0561234567', password: 'Lan@123', age: 28, role: 'user' },
      { fullName: 'Hoang Minh Duc', email: 'duc.hoang@example.com', phone: '0861234567', password: 'Duc@123', age: 35, role: 'manager' },
      { fullName: 'Bui Thi Hoa', email: 'hoa.bui@example.com', phone: '0931234567', password: 'Hoa@123', age: 21, role: 'user' }
    ];
    const created = [];
    for (const data of seed) {
      created.push(await User.create(data));
      await sleep(20);
    }
    console.log(`-> Seeded ${created.length} users`);
    const hung = created[0];

    // ------------------------------------------------------------
    console.log('\n=== Q1. Custom validation with Regex (Vietnamese phone number) ===');
    try {
      await User.create({ fullName: 'Invalid Phone', email: 'invalid.phone@example.com', phone: '0123456789', password: 'Test@123', age: 20 });
    } catch (error) {
      console.log('Validation error:', error.errors.phone.message);
    }

    // ------------------------------------------------------------
    console.log('\n=== Q2. Virtual property displayInfo (included in JSON output) ===');
    console.log('hung.displayInfo =', hung.displayInfo);
    const json = hung.toJSON();
    console.log('JSON output:', JSON.stringify({ fullName: json.fullName, email: json.email, role: json.role, displayInfo: json.displayInfo }, null, 2));

    // ------------------------------------------------------------
    console.log("\n=== Q3. Static method findActiveByRole('user') - sorted A-Z ===");
    const activeUsers = await User.findActiveByRole('user');
    console.table(activeUsers.map(brief));

    // ------------------------------------------------------------
    console.log('\n=== Q4. Instance method softDelete() ===');
    const nam = await User.findOne({ email: 'nam.le@example.com' });
    await nam.softDelete();
    const namRaw = await User.collection.findOne({ email: 'nam.le@example.com' });
    console.log(`"${namRaw.fullName}" -> isDeleted: ${namRaw.isDeleted}, isActive: ${namRaw.isActive} (document still exists in the collection)`);

    // ------------------------------------------------------------
    console.log('\n=== Q5. Middleware hooks: pre-save hashing & pre-find filter ===');
    const hungRaw = await User.collection.findOne({ email: 'hung.nguyen@example.com' });
    console.log('Plain password "Hung@123" is stored as:', hungRaw.password);
    const totalInCollection = await User.collection.countDocuments();
    const visibleUsers = await User.find();
    console.log(`Documents in the collection: ${totalInCollection} | returned by User.find(): ${visibleUsers.length} (soft-deleted user is filtered out)`);
    const namAgain = await User.findOne({ email: 'nam.le@example.com' });
    console.log('User.findOne() for the soft-deleted user returns:', namAgain);

    // ------------------------------------------------------------
    console.log('\n=== Q6. Embedded sub-documents: addAddress() ===');
    await addAddress(hung._id, { street: '268 Ly Thuong Kiet', city: 'Ho Chi Minh City', isDefault: true });
    const hungWithAddress = await addAddress(hung._id, { street: 'Quarter 6, Linh Trung Ward', city: 'Thu Duc City' });
    console.log(`Addresses of ${hungWithAddress.fullName}:`);
    console.table(hungWithAddress.addresses.map((a) => ({ street: a.street, city: a.city, isDefault: a.isDefault })));

    // ------------------------------------------------------------
    console.log("\n=== Q7. References & population: populate('author', 'fullName email role') ===");
    const mai = created[1];
    await Post.create([
      { title: 'Getting started with Node.js', content: 'Node.js lets us run JavaScript on the server.', author: hung._id },
      { title: 'Mongoose tips', content: 'Use populate() to load referenced documents.', author: mai._id }
    ]);
    const posts = await Post.find().populate('author', 'fullName email role').lean();
    posts.forEach((p, i) => console.log(`Post ${i + 1}:`, { title: p.title, author: { fullName: p.author.fullName, email: p.author.email, role: p.author.role } }));

    // ------------------------------------------------------------
    console.log('\n=== Q8. Pagination & sorting: getPaginatedUsers(page, limit) ===');
    for (const page of [1, 2]) {
      const result = await getPaginatedUsers(page, 2);
      console.log(`Page ${result.currentPage}/${result.totalPages} - totalUsers: ${result.totalUsers}`);
      console.table(result.users.map((u) => ({ fullName: u.fullName, role: u.role, createdAt: u.createdAt.toISOString() })));
    }

    // ------------------------------------------------------------
    console.log('\n=== Q9. Aggregation Framework: users by role (count, avgAge, maxAge, minAge) ===');
    const stats = await User.aggregate([
      { $match: { isDeleted: { $ne: true } } },
      {
        $group: {
          _id: '$role',
          totalUsers: { $sum: 1 },
          avgAge: { $avg: '$age' },
          maxAge: { $max: '$age' },
          minAge: { $min: '$age' }
        }
      },
      { $project: { _id: 0, role: '$_id', totalUsers: 1, avgAge: { $round: ['$avgAge', 1] }, maxAge: 1, minAge: 1 } },
      { $sort: { role: 1 } }
    ]);
    console.table(stats);

    // ------------------------------------------------------------
    console.log("\n=== Q10. Selection & lean queries: select('-password').lean() ===");
    const leanUsers = await User.find().select('-password').lean();
    console.log('First result:', leanUsers[0]);
    console.log('Has password field?', 'password' in leanUsers[0]);
    console.log('Is a Mongoose document?', leanUsers[0] instanceof mongoose.Document, '(plain JavaScript object)');
  } catch (error) {
    console.error('Mongoose error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n-> Mongoose connection closed.');
  }
}

main();
