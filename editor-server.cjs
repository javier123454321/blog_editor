const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3001;
const BLOG_DIR = path.join(__dirname, 'blog/src/blog');

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

// GET /files endpoint
app.get('/files', (req, res) => {
  const files = [];

  function readDirRecursive(dir) {
    fs.readdirSync(dir, { withFileTypes: true }).forEach((file) => {
      const filePath = path.join(dir, file.name);
      if (file.isDirectory()) {
        readDirRecursive(filePath);
      } else if (file.name.endsWith('.md')) {
        files.push({
          path: path.relative(BLOG_DIR, filePath),
          name: path.basename(file.name, '.md'),
        });
      }
    });
  }

  readDirRecursive(BLOG_DIR);
  res.json({ files });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Editor server running at http://localhost:${PORT}`);
});