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

const IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'avif', 'svg', 'pdf']

export interface ImageInfo {
  url: string
  name: string
}

function getImageFiles(dir: string, baseDir: string = dir): ImageInfo[] {
  let images: ImageInfo[] = []

  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      const relative = path.relative(baseDir, fullPath).split(path.sep).join('/')
      const ext = path.extname(entry.name).toLowerCase().replace(/^\./, '')

      if (entry.isDirectory()) {
        images = images.concat(getImageFiles(fullPath, baseDir))
      } else if (entry.isFile() && IMAGE_EXTENSIONS.includes(ext)) {
        images.push({
          url: `${config.imagesUrlPrefix.replace(/\/+$/, '')}/${relative}`,
          name: entry.name,
        })
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error)
  }

  return images
}

export function listImages(): ImageInfo[] {
  if (!fs.existsSync(config.imagesDir)) {
    return []
  }
  return getImageFiles(config.imagesDir).sort((a, b) => a.url.localeCompare(b.url))
}

export function saveImage(originalName: string, base64: string): { url: string } {
  if (typeof originalName !== 'string' || typeof base64 !== 'string' || !base64) {
    throw new PathError('Name and image data are required')
  }

  const ext = path.extname(originalName).toLowerCase().replace(/^\./, '')
  if (!IMAGE_EXTENSIONS.includes(ext)) {
    throw new PathError('Unsupported image type')
  }

  const rawBase = path.basename(originalName, path.extname(originalName))
  const base = rawBase.replace(/[^a-zA-Z0-9_-]/g, '-').replace(/^-+|-+$/g, '') || 'image'

  let filename = `${base}.${ext}`
  let fullPath = resolveWithin(config.imagesDir, filename)
  let suffix = 1
  while (fs.existsSync(fullPath)) {
    filename = `${base}-${suffix}.${ext}`
    fullPath = resolveWithin(config.imagesDir, filename)
    suffix += 1
  }

  const buffer = Buffer.from(base64, 'base64')
  if (buffer.length === 0) {
    throw new PathError('Invalid image data')
  }

  ensureDirForFile(fullPath)
  fs.writeFileSync(fullPath, buffer)

  const prefix = config.imagesUrlPrefix.replace(/\/+$/, '')
  return { url: `${prefix}/${filename}` }
}
