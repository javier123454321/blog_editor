import { Router } from 'express'
import { isValidPassword } from '../middleware/auth'

const router = Router()

router.post('/auth', (req, res) => {
  const { password } = req.body as { password?: unknown }

  if (!password || typeof password !== 'string') {
    return res.status(400).json({ success: false, error: 'Password is required' })
  }

  if (isValidPassword(password)) {
    return res.json({ success: true })
  }

  return res.status(401).json({ success: false, error: 'Invalid password' })
})

export default router
