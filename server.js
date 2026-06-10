const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'posts.json');
const PUBLIC_DIR = path.join(__dirname, 'public');

// Ensure data folder and file exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));
}

// Middleware
app.use(express.json());
app.use(express.static(PUBLIC_DIR));

// Helper function to read posts
const readPosts = () => {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading database file:', err);
    return [];
  }
};

// Helper function to write posts
const writePosts = (posts) => {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(posts, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error writing to database file:', err);
    return false;
  }
};

// Helper function to create slug from title
const generateSlug = (title) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '') // remove invalid chars
    .replace(/\s+/g, '-') // collapse whitespace and replace by -
    .replace(/-+/g, '-'); // collapse dashes
};

// GET: All posts
app.get('/api/posts', (req, res) => {
  const posts = readPosts();
  // Sort posts by date descending
  posts.sort((a, b) => new Date(b.date) - new Date(a.date));
  res.json(posts);
});

// GET: Single post by ID or slug
app.get('/api/posts/:identifier', (req, res) => {
  const { identifier } = req.params;
  const posts = readPosts();
  const post = posts.find(p => p.id === identifier || p.slug === identifier);
  
  if (post) {
    res.json(post);
  } else {
    res.status(404).json({ error: 'Post tidak ditemukan' });
  }
});

// POST: Create or Update post
app.post('/api/posts', (req, res) => {
  const { id, title, summary, content, category, status } = req.body;
  
  if (!title || !content) {
    return res.status(400).json({ error: 'Judul dan konten wajib diisi' });
  }

  const posts = readPosts();
  let updatedPost;

  if (id) {
    // Edit existing post
    const index = posts.findIndex(p => p.id === id.toString());
    if (index === -1) {
      return res.status(404).json({ error: 'Post tidak ditemukan untuk diedit' });
    }

    updatedPost = {
      ...posts[index],
      title,
      slug: generateSlug(title),
      summary: summary || title.substring(0, 100) + '...',
      content,
      category: category || 'Umum',
      status: status || 'draft',
      updatedAt: new Date().toISOString()
    };
    posts[index] = updatedPost;
  } else {
    // Create new post
    updatedPost = {
      id: Date.now().toString(),
      title,
      slug: generateSlug(title),
      summary: summary || title.substring(0, 100) + '...',
      content,
      category: category || 'Umum',
      date: new Date().toISOString(),
      status: status || 'draft'
    };
    posts.push(updatedPost);
  }

  if (writePosts(posts)) {
    res.status(id ? 200 : 210).json(updatedPost);
  } else {
    res.status(500).json({ error: 'Gagal menyimpan data ke file' });
  }
});

// DELETE: Remove a post
app.delete('/api/posts/:id', (req, res) => {
  const { id } = req.params;
  const posts = readPosts();
  const filteredPosts = posts.filter(p => p.id !== id.toString());

  if (posts.length === filteredPosts.length) {
    return res.status(404).json({ error: 'Post tidak ditemukan untuk dihapus' });
  }

  if (writePosts(filteredPosts)) {
    res.json({ success: true, message: 'Post berhasil dihapus' });
  } else {
    res.status(500).json({ error: 'Gagal memperbarui file setelah penghapusan' });
  }
});

// Serve frontend single page app index for any unmatched route (SPA routing support)
app.get('*', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server MiniCMS berjalan di http://localhost:${PORT}`);
});
