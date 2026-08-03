import fs from 'fs'
import path from 'path'
import { config } from '../config'
import { ensureDirForFile, PathError, resolveWithin } from '../lib/paths'

export interface FileInfo {
  path: string
  name: string
}

function getMarkdownFiles(dir: string, baseDir: string = dir): FileInfo[] {
  let files: FileInfo[] = []

  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      const relativePath = path.relative(baseDir, fullPath)

      if (entry.isDirectory()) {
        files = files.concat(getMarkdownFiles(fullPath, baseDir))
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        files.push({
          path: relativePath.split(path.sep).join('/'),
          name: entry.name,
        })
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error)
  }

  return files
}

export function listMarkdownFiles(): FileInfo[] {
  if (!fs.existsSync(config.blogDir)) {
    return []
  }
  return getMarkdownFiles(config.blogDir)
}

export function readMarkdownFile(relativePath: string): { content: string; path: string } {
  const fullPath = resolveWithin(config.blogDir, relativePath)

  if (!fs.existsSync(fullPath)) {
    throw new PathError('File not found', 404)
  }

  const content = fs.readFileSync(fullPath, 'utf-8')
  const normalized = path.relative(config.blogDir, fullPath).split(path.sep).join('/')
  return { content, path: normalized }
}

export function writeMarkdownFile(relativePath: string, content: string): { path: string } {
  if (typeof content !== 'string') {
    throw new PathError('Content is required')
  }

  const fullPath = resolveWithin(config.blogDir, relativePath)
  ensureDirForFile(fullPath)
  fs.writeFileSync(fullPath, content, 'utf-8')

  const normalized = path.relative(config.blogDir, fullPath).split(path.sep).join('/')
  return { path: normalized }
}
