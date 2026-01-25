import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3001;

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

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

export default app;
