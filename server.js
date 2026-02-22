// ============================================================
//  NEW SHELTON HOSIERY – Node.js + Express Backend
//  Run: node server.js   |   Visit: http://localhost:3000
// ============================================================

const express  = require('express');
const mysql    = require('mysql2');
const bcrypt   = require('bcryptjs');
const session  = require('express-session');
const path     = require('path');
const cors     = require('cors');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── MIDDLEWARE ──
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
// Serve static files from public folder
app.use(express.static(path.join(__dirname, 'public')));

// Also try serving directly if public folder not found
app.use(express.static(__dirname));
app.use(session({
  secret: 'shelton_secret_2025',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24 }  // 1 day
}));

// ── DEBUG ROUTE - shows folder structure ──
app.get('/debug', (req, res) => {
  const fs = require("fs");
  const root = __dirname;
  let files = [];
  try { files = fs.readdirSync(root); } catch(e) {}
  let pubFiles = [];
  try { pubFiles = fs.readdirSync(path.join(root, "public")); } catch(e) { pubFiles = ["public folder NOT found"]; }
  res.json({
    root_directory: root,
    root_files: files,
    public_files: pubFiles
  });
});

// ── DATABASE ──
const db = mysql.createPool({
  host:     process.env.DB_HOST || 'localhost',
  user:     process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'shelton_db',
  waitForConnections: true,
  connectionLimit: 10
});

// Test DB connection
db.getConnection((err, conn) => {
  if (err) console.error('❌ DB Connection Error:', err.message);
  else { console.log('✅ Database connected!'); conn.release(); }
});

// ── AUTH MIDDLEWARE ──
function requireLogin(req, res, next) {
  if (req.session.user) return next();
  res.status(401).json({ success: false, message: 'Please login first.' });
}

// ────────────────────────────────────────────────────────────
//  ROUTES
// ────────────────────────────────────────────────────────────

// ── REGISTER ──
app.post('/api/register', async (req, res) => {
  const { first_name, last_name, email, phone, password, confirm_password } = req.body;

  if (!first_name || !last_name || !email || !password)
    return res.json({ success: false, message: 'Please fill all required fields.' });

  if (password.length < 8)
    return res.json({ success: false, message: 'Password must be at least 8 characters.' });

  if (password !== confirm_password)
    return res.json({ success: false, message: 'Passwords do not match.' });

  try {
    const [existing] = await db.promise().query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0)
      return res.json({ success: false, message: 'An account with this email already exists.' });

    const hashed = await bcrypt.hash(password, 10);
    await db.promise().query(
      'INSERT INTO users (first_name, last_name, email, phone, password) VALUES (?,?,?,?,?)',
      [first_name, last_name, email, phone || '', hashed]
    );
    res.json({ success: true, message: 'Account created! Welcome to New Shelton Hosiery.' });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: 'Server error. Please try again.' });
  }
});

// ── LOGIN ──
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.json({ success: false, message: 'Please enter your email and password.' });

  try {
    const [rows] = await db.promise().query('SELECT * FROM users WHERE email = ?', [email]);
    if (!rows.length)
      return res.json({ success: false, message: 'Invalid email or password.' });

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.json({ success: false, message: 'Invalid email or password.' });

    req.session.user = { id: user.id, name: user.first_name, email: user.email };
    res.json({ success: true, message: 'Login successful!', user: { name: user.first_name, email: user.email } });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: 'Server error. Please try again.' });
  }
});

// ── LOGOUT ──
app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true, message: 'Logged out.' });
});

// ── GET CURRENT USER ──
app.get('/api/me', (req, res) => {
  if (req.session.user) res.json({ loggedIn: true, user: req.session.user });
  else res.json({ loggedIn: false });
});

// ── GET ALL PRODUCTS ──
app.get('/api/products', async (req, res) => {
  try {
    const { category, search, sort } = req.query;
    let sql = `SELECT p.*, c.name as category_name FROM products p
               LEFT JOIN categories c ON p.category_id = c.id WHERE 1=1`;
    const params = [];

    if (category) { sql += ' AND c.slug = ?'; params.push(category); }
    if (search)   { sql += ' AND p.name LIKE ?'; params.push('%' + search + '%'); }

    if (sort === 'price_asc')  sql += ' ORDER BY p.price ASC';
    else if (sort === 'price_desc') sql += ' ORDER BY p.price DESC';
    else if (sort === 'newest') sql += ' ORDER BY p.created_at DESC';
    else sql += ' ORDER BY p.is_featured DESC, p.created_at DESC';

    const [rows] = await db.promise().query(sql, params);
    res.json({ success: true, products: rows });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: 'Could not fetch products.' });
  }
});

// ── GET SINGLE PRODUCT ──
app.get('/api/products/:id', async (req, res) => {
  try {
    const [rows] = await db.promise().query(
      'SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ?',
      [req.params.id]
    );
    if (!rows.length) return res.json({ success: false, message: 'Product not found.' });
    res.json({ success: true, product: rows[0] });
  } catch (err) {
    res.json({ success: false, message: 'Server error.' });
  }
});

// ── GET CATEGORIES ──
app.get('/api/categories', async (req, res) => {
  try {
    const [rows] = await db.promise().query('SELECT * FROM categories');
    res.json({ success: true, categories: rows });
  } catch (err) {
    res.json({ success: false, message: 'Could not fetch categories.' });
  }
});

// ── PLACE ORDER ──
app.post('/api/orders', async (req, res) => {
  const { first_name, last_name, email, phone, address, city, state, pincode, payment_method, cart } = req.body;

  if (!first_name || !email || !address || !city || !pincode)
    return res.json({ success: false, message: 'Please fill all required fields.' });
  if (!cart || !cart.length)
    return res.json({ success: false, message: 'Your cart is empty.' });

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const tax      = Math.round(subtotal * 0.00);  // No GST for Pakistan (adjust if needed)
  const total    = subtotal + tax;
  const user_id  = req.session.user?.id || null;

  try {
    const [result] = await db.promise().query(
      `INSERT INTO orders (user_id,first_name,last_name,email,phone,address,city,state,pincode,payment_method,subtotal,tax,total)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [user_id, first_name, last_name, email, phone, address, city, state, pincode, payment_method, subtotal, tax, total]
    );
    const orderId = result.insertId;

    // Insert order items
    for (const item of cart) {
      await db.promise().query(
        'INSERT INTO order_items (order_id, product_name, price, qty) VALUES (?,?,?,?)',
        [orderId, item.name, item.price, item.qty]
      );
    }

    const orderRef = 'NSH' + String(orderId).padStart(6, '0');
    res.json({ success: true, order_id: orderRef, message: 'Order placed successfully!' });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: 'Could not place order. Please try again.' });
  }
});

// ── GET USER ORDERS ──
app.get('/api/my-orders', requireLogin, async (req, res) => {
  try {
    const [orders] = await db.promise().query(
      'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC', [req.session.user.id]
    );
    res.json({ success: true, orders });
  } catch (err) {
    res.json({ success: false, message: 'Could not fetch orders.' });
  }
});

// ── NEWSLETTER SUBSCRIBE ──
app.post('/api/newsletter', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.json({ success: false, message: 'Email is required.' });
  try {
    await db.promise().query('INSERT IGNORE INTO newsletter (email) VALUES (?)', [email]);
    res.json({ success: true, message: 'Subscribed successfully!' });
  } catch (err) {
    res.json({ success: false, message: 'Subscription failed.' });
  }
});

// ── CONTACT FORM ──
app.post('/api/contact', async (req, res) => {
  const { name, email, subject, message } = req.body;
  if (!name || !email || !message)
    return res.json({ success: false, message: 'Please fill all required fields.' });
  // In production: send email via Nodemailer here
  console.log('📩 Contact form:', { name, email, subject, message });
  res.json({ success: true, message: 'Message received! We\'ll reply within 24 hours.' });
});

// ── SUBMIT REVIEW ──
app.post('/api/reviews', async (req, res) => {
  const { product_id, user_name, user_email, rating, review } = req.body;
  try {
    await db.promise().query(
      'INSERT INTO reviews (product_id, user_name, user_email, rating, review) VALUES (?,?,?,?,?)',
      [product_id, user_name, user_email, rating, review]
    );
    res.json({ success: true, message: 'Review submitted! Thank you.' });
  } catch (err) {
    res.json({ success: false, message: 'Could not submit review.' });
  }
});

// ── GET PRODUCT REVIEWS ──
app.get('/api/reviews/:product_id', async (req, res) => {
  try {
    const [rows] = await db.promise().query(
      'SELECT * FROM reviews WHERE product_id = ? ORDER BY created_at DESC', [req.params.product_id]
    );
    res.json({ success: true, reviews: rows });
  } catch (err) {
    res.json({ success: false, message: 'Could not fetch reviews.' });
  }
});

// ── SERVE FRONTEND ──
// Serve all HTML pages from /public folder
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

// Serve each HTML page by name
const pages = ['index','shop','cart','checkout','login','about','contact','product-detail','account'];
pages.forEach(page => {
  app.get('/' + page + '.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', page + '.html'), err => {
      if (err) res.status(404).send('Page not found: ' + page);
    });
  });
});

// ── START SERVER ──
app.listen(PORT, () => {
  console.log('');
  console.log('🧣 ═══════════════════════════════════════════');
  console.log('   NEW SHELTON HOSIERY – Server Running!');
  console.log(`   🌐  http://localhost:${PORT}`);
  console.log('🧣 ═══════════════════════════════════════════');
  console.log('');
});

module.exports = app;
