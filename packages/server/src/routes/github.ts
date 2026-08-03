import { Router } from 'express'
import { createOrUpdatePullRequest } from '../services/github'

const router = Router()

router.post('/pr', async (req, res) => {
  const { title, body } = req.body as { title?: unknown; body?: unknown }

  if (!title || typeof title !== 'string') {
    return res.status(400).json({ success: false, error: 'PR title is required' })
  }

  try {
    const result = await createOrUpdatePullRequest(
      title,
      typeof body === 'string' ? body : '',
    )
    res.json({ success: true, ...result })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred'
    console.error('Error creating/updating PR:', error)

    if (message.includes('GitHub configuration missing')) {
      return res.status(500).json({ success: false, error: message })
    }

    res.status(500).json({ success: false, error: message })
  }
})

export default router
