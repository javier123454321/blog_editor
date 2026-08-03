import { Router } from 'express'
import * as gitService from '../services/git'

const router = Router()

router.get('/branches', async (_req, res) => {
  try {
    const branches = await gitService.listBranches()
    res.json({ branches })
  } catch (error) {
    console.error('Error listing branches:', error)
    res.status(500).json({ success: false, error: 'Failed to list branches' })
  }
})

router.post('/checkout', async (req, res) => {
  const { branch } = req.body as { branch?: unknown }

  if (!branch || typeof branch !== 'string') {
    return res.status(400).json({ success: false, error: 'Branch name is required' })
  }

  try {
    const result = await gitService.checkoutBranch(branch)
    res.json({ success: true, ...result })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to checkout branch'
    console.error('Error checking out branch:', error)
    res.status(500).json({ success: false, error: `Failed to checkout branch: ${message}` })
  }
})

router.post('/branch/create', async (req, res) => {
  const { name } = req.body as { name?: unknown }

  if (!name || typeof name !== 'string') {
    return res.status(400).json({ success: false, error: 'Branch name is required' })
  }

  try {
    const result = await gitService.createBranch(name)
    res.json({ success: true, ...result })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create branch'
    console.error('Error creating branch:', error)
    res.status(500).json({ success: false, error: `Failed to create branch: ${message}` })
  }
})

router.post('/commit', async (req, res) => {
  const { message } = req.body as { message?: unknown }

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ success: false, error: 'Commit message is required' })
  }

  try {
    const result = await gitService.commitAll(message)
    res.json({ success: true, ...result })
  } catch (error) {
    const messageText = error instanceof Error ? error.message : 'Failed to commit'
    if (messageText === 'Nothing to commit') {
      return res.status(400).json({ success: false, error: messageText })
    }
    console.error('Error committing:', error)
    res.status(500).json({ success: false, error: `Failed to commit: ${messageText}` })
  }
})

router.post('/push', async (_req, res) => {
  try {
    await gitService.push()
    res.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to push'
    console.error('Error pushing:', error)
    res.status(500).json({ success: false, error: `Failed to push: ${message}` })
  }
})

export default router
