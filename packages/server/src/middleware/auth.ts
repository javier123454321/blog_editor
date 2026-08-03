import crypto from 'crypto'
import type { Request, Response, NextFunction } from 'express'
import { config } from '../config'

export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex')
}

export function isValidPassword(password: string): boolean {
  if (!config.passwordHash) {
    return false
  }
  return hashPassword(password) === config.passwordHash
}

/**
 * Require X-Auth-Password header matching configured hash.
 * Does not log secrets.
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authPassword = req.headers['x-auth-password']

  if (!authPassword || typeof authPassword !== 'string') {
    res.status(401).json({ success: false, error: 'Authorization header missing' })
    return
  }

  if (isValidPassword(authPassword)) {
    next()
    return
  }

  res.status(401).json({ success: false, error: 'Unauthorized' })
}

/** Skip auth for health and login */
export function authGate(req: Request, res: Response, next: NextFunction): void {
  if (req.path === '/' || (req.path === '/auth' && req.method === 'POST')) {
    next()
    return
  }
  authMiddleware(req, res, next)
}
