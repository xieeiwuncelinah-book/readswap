-- ReadSwap Database Schema
-- Run in SQLite: sqlite3 database/readswap.db < schema.sql

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  contact TEXT UNIQUE NOT NULL
);

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
);

-- Sample data
INSERT OR IGNORE INTO users (name, contact) VALUES ('Sample User', 'sample@email.com');
INSERT OR IGNORE INTO books (user_id, title, author, genre, condition, price, type, image) 
VALUES (1, 'Sample Book', 'John Doe', 'Fiction', 'Good', 10.99, 'sell', 'sample.jpg');
