import { Router } from 'express'
import { PathError } from '../lib/paths'
import * as filesService from '../services/files'

const router = Router()

router.get('/files', (_req, res) => {
  try {
    const files = filesService.listMarkdownFiles()
    res.json({ files })
  } catch {
    res.status(500).json({ success: false, error: 'Failed to list files' })
  }
})

/** Prefer query ?path= for nested paths; also support /file/* splat */
function getPathFromRequest(req: {
  query: Record<string, unknown>
  params: Record<string, string>
}): string {
  if (typeof req.query.path === 'string' && req.query.path.length > 0) {
    return req.query.path
  }
  // Express 4: req.params[0] for /file/*
  const splat = req.params[0] || req.params.path || ''
  return splat
}

router.get(['/file', '/file/*'], (req, res) => {
  try {
    const filePath = getPathFromRequest(req)
    if (!filePath) {
      return res.status(400).json({ success: false, error: 'Path is required' })
    }
    const result = filesService.readMarkdownFile(filePath)
    res.json(result)
  } catch (error) {
    if (error instanceof PathError) {
      return res.status(error.status).json({ success: false, error: error.message })
    }
    res.status(500).json({ success: false, error: 'Failed to read file' })
  }
})

router.post(['/file', '/file/*'], (req, res) => {
  try {
    const { content } = req.body as { content?: unknown }
    if (content === undefined || typeof content !== 'string') {
      return res.status(400).json({ success: false, error: 'Content is required' })
    }

    const filePath = getPathFromRequest(req)
    if (!filePath) {
      return res.status(400).json({ success: false, error: 'Path is required' })
    }

    const result = filesService.writeMarkdownFile(filePath, content)
    res.json({ success: true, ...result })
  } catch (error) {
    if (error instanceof PathError) {
      return res.status(error.status).json({ success: false, error: error.message })
    }
    res.status(500).json({ success: false, error: 'Failed to save file' })
  }
})

export default router
