import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

// Load root .env (monorepo root is two levels up from packages/server/src)
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '../../..')

dotenv.config({ path: path.join(repoRoot, '.env') })
dotenv.config() // also allow packages/server/.env

export const config = {
  port: Number(process.env.PORT) || 3001,
  repoRoot,
  /** Markdown content directory inside the blog submodule */
  blogDir: process.env.BLOG_DIR || path.join(repoRoot, 'blog', 'src'),
  /** Directory where uploaded blog images are stored */
  imagesDir: process.env.IMAGES_DIR || path.join(repoRoot, 'blog', 'src', 'images'),
  /** URL prefix images are referenced by in markdown / on the site */
  imagesUrlPrefix: process.env.IMAGES_URL_PREFIX || '/images',
  /** Git working tree (blog submodule root) */
  gitDir: process.env.GIT_DIR || path.join(repoRoot, 'blog'),
  passwordHash: process.env.BLOG_EDITOR_PASSWORD_HASH || '',
  github: {
    token: process.env.GITHUB_TOKEN || '',
    owner: process.env.GITHUB_REPO_OWNER || '',
    repo: process.env.GITHUB_REPO_NAME || '',
  },
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
} as const
