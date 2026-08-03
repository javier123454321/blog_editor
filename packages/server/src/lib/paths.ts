import path from 'path'
import fs from 'fs'

export class PathError extends Error {
  status: number

  constructor(message: string, status = 400) {
    super(message)
    this.name = 'PathError'
    this.status = status
  }
}

/**
 * Resolve a user-supplied relative path safely within baseDir.
 * Rejects traversal attempts and absolute paths that escape baseDir.
 */
export function resolveWithin(baseDir: string, relativePath: string): string {
  if (!relativePath || typeof relativePath !== 'string') {
    throw new PathError('Path is required')
  }

  const decoded = decodeURIComponent(relativePath)

  if (decoded.includes('\0')) {
    throw new PathError('Invalid path')
  }

  // Normalize separators and strip leading slashes
  const cleaned = decoded.replace(/\\/g, '/').replace(/^\/+/, '')

  if (cleaned.split('/').some((seg) => seg === '..')) {
    throw new PathError('Invalid path')
  }

  const fullPath = path.join(baseDir, cleaned)
  const resolvedPath = path.resolve(fullPath)
  const resolvedBase = path.resolve(baseDir)

  // Ensure trailing separator comparison so /blog-evil is not under /blog
  const baseWithSep = resolvedBase.endsWith(path.sep)
    ? resolvedBase
    : resolvedBase + path.sep

  if (resolvedPath !== resolvedBase && !resolvedPath.startsWith(baseWithSep)) {
    throw new PathError('Invalid path')
  }

  return resolvedPath
}

/**
 * Convert a path relative to `blogDir` into a path relative to `gitDir`.
 * Files on disk live under `gitDir/<blogSubDir>/…`, so a "foo.md" in the blog
 * content directory maps to e.g. "src/foo.md" in the git repository.
 */
export function toGitRelativePath(gitDir: string, blogDir: string, relativePath: string): string {
  const fullPath = resolveWithin(blogDir, relativePath)
  return path.relative(gitDir, fullPath).split(path.sep).join('/')
}

export function ensureDirForFile(filePath: string): void {
  const dir = path.dirname(filePath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}
