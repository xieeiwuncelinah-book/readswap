// ReadSwap Frontend Script

// Global user
let currentUserId = localStorage.getItem('readswapUserId');

// Registration form handler (index.html)
if (document.querySelector('.register')) {
  const registerForm = document.querySelector('.register');
  const nameInput = registerForm.querySelector('input[placeholder*="Name"]');
  const contactInput = registerForm.querySelector('input[placeholder*="Phone or Email"]');
  const registerBtn = registerForm.querySelector('button');

  registerBtn.addEventListener('click', async () => {
    const name = nameInput.value.trim();
    const contact = contactInput.value.trim();
    
    if (!name || !contact) {
      alert('Please fill name and contact');
      return;
    }

    try {
      const res = await fetch('/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, contact })
      });
      
      const data = await res.json();
      
      if (data.error) {
        alert(data.error);
        return;
      }
      
      localStorage.setItem('readswapUserId', data.userId);
      window.location.href = 'marketplace.html';
    } catch (err) {
      alert('Registration failed. Please try again.');
    }
  });
}

// Marketplace functionality (marketplace.html)
if (document.getElementById('books')) {
  const booksContainer = document.getElementById('books');
  const searchInput = document.getElementById('search');
  let allBooks = [];

  // Load books
  async function loadBooks(query = '') {
    try {
      booksContainer.innerHTML = '<div class="loading">Loading books...</div>';
      
      const url = query ? `/books/search?q=${encodeURIComponent(query)}` : '/books';
      const res = await fetch(url);
      allBooks = await res.json();
      
      displayBooks(allBooks);
    } catch (err) {
      booksContainer.innerHTML = '<div class="error">Failed to load books. Please refresh.</div>';
    }
  }

  // Display books
  function displayBooks(books) {
    if (books.length === 0) {
      booksContainer.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: white; font-size: 1.2rem;">No books found. Be the first to add one!</div>';
      return;
    }
    
    booksContainer.innerHTML = books.map(book => `
      <div class="book-card">
        <img src="/images/${book.image}" alt="${book.title}" class="book-image" onerror="this.src='https://via.placeholder.com/250x200/9b59b6/ffffff?text=No+Image'">
        <h3 class="book-title">${book.title}</h3>
        <div class="book-detail"><strong>Author:</strong> ${book.author || 'Unknown'}</div>
        <div class="book-detail"><strong>Genre:</strong> ${book.genre || 'N/A'}</div>
        <div class="book-detail"><strong>Condition:</strong> ${book.condition || 'N/A'}</div>
        <div class="book-price">$${book.price?.toFixed(2) || '0.00'}</div>
        <div class="type-badge type-${book.type.toLowerCase()}">${book.type.toUpperCase()}</div>
        <div class="seller-info">
          <strong>Seller:</strong> ${book.name}<br>
          <strong>Contact:</strong> ${book.contact}
        </div>
      </div>
    `).join('');
  }

  // Search
  let searchTimeout;
  searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      loadBooks(e.target.value);
    }, 300);
  });

  // Profile click - show user info
  document.querySelector('.profile').addEventListener('click', () => {
    if (currentUserId) {
      alert(`Logged in as User ID: ${currentUserId}`);
    } else {
      window.location.href = 'index.html';
    }
  });

  // Initial load
  loadBooks();
}

// Upload form (marketplace.html)
if (document.querySelector('.upload-section')) {
  const uploadForm = document.querySelector('.upload-section form');
  
  uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!currentUserId) {
      alert('Please register first');
      return;
    }

    const formData = new FormData(uploadForm);
    formData.append('userId', currentUserId);

    try {
      const res = await fetch('/books', {
        method: 'POST',
        body: formData
      });
      
      const data = await res.json();
      
      if (data.error) {
        alert(data.error);
      } else {
        alert('Book added successfully!');
        uploadForm.reset();
        // Reload books
        if (window.loadBooks) loadBooks();
      }
    } catch (err) {
      alert('Upload failed. Try again.');
    }
  });
}
