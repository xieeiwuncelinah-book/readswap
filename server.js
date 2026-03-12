const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Ensure images dir exists
const imagesDir = path.join(__dirname, 'public/images');
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

// Multer setup for image upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'public/images/'),
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '_' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

// SQLite database
const dbPath = path.join(__dirname, 'database/readswap.db');
const db = new sqlite3.Database(dbPath);

// Initialize database
db.serialize(() => {
  // Users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      contact TEXT UNIQUE NOT NULL
    )
  `);

  // Books table
  db.run(`
    CREATE TABLE IF NOT EXISTS books (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      author TEXT,
      genre TEXT,
      condition TEXT,
      price REAL,
      type TEXT CHECK(type IN ('sell', 'exchange')) NOT NULL,
      image TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);

  // Sample data (users + books)
  db.get("SELECT COUNT(*) as count FROM users", (err, row) => {
    if (row.count === 0) {
      db.run("INSERT INTO users (name, contact) VALUES ('Sample User', 'sample@email.com')");
      db.run(`INSERT INTO books (user_id, title, author, genre, condition, price, type, image) 
              VALUES (1, 'Sample Book', 'John Doe', 'Fiction', 'Good', 10.99, 'sell', 'sample.jpg')`);
    }
  });
});

// Routes

// Register user
app.post('/register', (req, res) => {
  const { name, contact } = req.body;
  if (!name || !contact) {
    return res.status(400).json({ error: 'Name and contact required' });
  }
  db.run('INSERT INTO users (name, contact) VALUES (?, ?)', [name, contact], function(err) {
    if (err) {
      return res.status(400).json({ error: 'Contact already registered' });
    }
    res.json({ userId: this.lastID });
  });
});

// Get all books (with user info)
app.get('/books', (req, res) => {
  db.all(`
    SELECT b.*, u.name, u.contact 
    FROM books b 
    JOIN users u ON b.user_id = u.id 
    ORDER BY b.id DESC
  `, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Search books
app.get('/books/search', (req, res) => {
  const q = req.query.q || '';
  db.all(`
    SELECT b.*, u.name, u.contact 
    FROM books b 
    JOIN users u ON b.user_id = u.id 
    WHERE b.title LIKE ? OR b.genre LIKE ?
    ORDER BY b.id DESC
  `, [`%${q}%`, `%${q}%`], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Add book (with image)
app.post('/books', upload.single('image'), (req, res) => {
  const { title, author, genre, condition, price, type, userId } = req.body;
  if (!title || !userId || !req.file) {
    return res.status(400).json({ error: 'Missing required fields or image' });
  }
  const image = req.file.filename;
  db.run(
    'INSERT INTO books (user_id, title, author, genre, condition, price, type, image) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [userId, title, author || '', genre || '', condition || '', parseFloat(price) || 0, type, image],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ bookId: this.lastID });
    }
  );
});

app.listen(PORT, () => {
  console.log(`ReadSwap server running at http://localhost:${PORT}`);
});

db.close;
