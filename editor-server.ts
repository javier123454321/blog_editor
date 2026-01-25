import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { exec, execFile } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3100;
const BLOG_DIR = path.join(__dirname, 'blog', 'src', 'blog');
const GIT_DIR = path.join(__dirname, 'blog');

// Middleware
app.use(cors({
  origin: 'http://localhost:5173'
}));
app.use(express.json());

// Health check endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Blog Editor API is running' });
});

// Password authentication endpoint
app.post('/auth', (req: Request, res: Response) => {
  const { password } = req.body;

  if (!password || typeof password !== 'string') {
    return res.status(400).json({ success: false, error: 'Password is required' });
  }

  const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
  const expectedHash = process.env.BLOG_EDITOR_PASSWORD_HASH;

  if (passwordHash === expectedHash) {
    return res.json({ success: true });
  } else {
    return res.status(401).json({ success: false, error: 'Invalid password' });
  }
});

// Auth middleware for protected routes
const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const authPassword = req.headers['x-auth-password'] as string;

  if (!authPassword) {
    res.status(401).json({ success: false, error: 'Authorization header missing' });
    return;
  }

  const passwordHash = crypto.createHash('sha256').update(authPassword).digest('hex');
  const expectedHash = process.env.BLOG_EDITOR_PASSWORD_HASH;

  if (passwordHash === expectedHash) {
    next();
  } else {
    res.status(401).json({ success: false, error: 'Unauthorized' });
  }
};

// Apply auth middleware to all routes except / and /auth
app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.path === '/' || (req.path === '/auth' && req.method === 'POST')) {
    next();
  } else {
    authMiddleware(req, res, next);
  }
});

// Helper function to recursively get markdown files
function getMarkdownFiles(dir: string, baseDir: string = dir): Array<{ path: string; name: string }> {
  let files: Array<{ path: string; name: string }> = [];

  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    entries.forEach(entry => {
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.relative(baseDir, fullPath);

      if (entry.isDirectory()) {
        files = files.concat(getMarkdownFiles(fullPath, baseDir));
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        files.push({
          path: relativePath,
          name: entry.name
        });
      }
    });
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error);
  }

  return files;
}

// GET /files endpoint
app.get('/files', (req: Request, res: Response) => {
  try {
    if (!fs.existsSync(BLOG_DIR)) {
      return res.json({ files: [] });
    }

    const files = getMarkdownFiles(BLOG_DIR);
    res.json({ files });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to list files' });
  }
});

// GET /file/:path endpoint
app.get('/file/:path', (req: Request, res: Response) => {
   try {
     let filePath = req.params.path;
     
     // Decode URL-encoded path
     filePath = decodeURIComponent(filePath);

     // Validate path - prevent directory traversal
     if (filePath.includes('..')) {
       return res.status(400).json({ success: false, error: 'Invalid path' });
     }

     const fullPath = path.join(BLOG_DIR, filePath);

     // Ensure the resolved path is within BLOG_DIR
     const resolvedPath = path.resolve(fullPath);
     const resolvedBlogDir = path.resolve(BLOG_DIR);
     
     if (!resolvedPath.startsWith(resolvedBlogDir)) {
       return res.status(400).json({ success: false, error: 'Invalid path' });
     }

     if (!fs.existsSync(fullPath)) {
       return res.status(404).json({ success: false, error: 'File not found' });
     }

     const content = fs.readFileSync(fullPath, 'utf-8');
     res.json({ content, path: filePath });
   } catch (error) {
     res.status(500).json({ success: false, error: 'Failed to read file' });
   }
});

// POST /file/:path endpoint
app.post('/file/:path', (req: Request, res: Response) => {
   try {
     const { content } = req.body;

     if (content === undefined || typeof content !== 'string') {
       return res.status(400).json({ success: false, error: 'Content is required' });
     }

     let filePath = req.params.path;
     
     // Decode URL-encoded path
     filePath = decodeURIComponent(filePath);

     // Validate path - prevent directory traversal
     if (filePath.includes('..')) {
       return res.status(400).json({ success: false, error: 'Invalid path' });
     }

     const fullPath = path.join(BLOG_DIR, filePath);

     // Ensure the resolved path is within BLOG_DIR
     const resolvedPath = path.resolve(fullPath);
     const resolvedBlogDir = path.resolve(BLOG_DIR);
     
     if (!resolvedPath.startsWith(resolvedBlogDir)) {
       return res.status(400).json({ success: false, error: 'Invalid path' });
     }

     // Create directories if they don't exist
     const dir = path.dirname(fullPath);
     if (!fs.existsSync(dir)) {
       fs.mkdirSync(dir, { recursive: true });
     }

     // Write the file
     fs.writeFileSync(fullPath, content, 'utf-8');
     res.json({ success: true, path: filePath });
   } catch (error) {
     res.status(500).json({ success: false, error: 'Failed to save file' });
   }
});

// GET /branches endpoint
app.get('/branches', (req: Request, res: Response) => {
  execFile('git', ['branch'], { cwd: GIT_DIR }, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing git branch: ${error.message}`);
      return res.status(500).json({ success: false, error: 'Failed to list branches' });
    }

    if (stderr) {
      console.error(`git branch stderr: ${stderr}`);
    }

    const branches = stdout.split('\n')
      .filter(line => line.trim() !== '')
      .map(line => {
        const isCurrent = line.startsWith('*');
        const name = line.replace('*', '').trim();
        return { name, current: isCurrent };
      });

    res.json({ branches });
  });
});

// Start server
app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

export { app };
