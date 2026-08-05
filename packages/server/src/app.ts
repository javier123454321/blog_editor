import express, { type Express } from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import { config } from './config'
import { authGate } from './middleware/auth'
import authRoutes from './routes/auth'
import filesRoutes from './routes/files'
import gitRoutes from './routes/git'
import githubRoutes from './routes/github'

export function createApp(): Express {
  const app = express()

  app.use(
    cors({
      origin: config.corsOrigin,
    }),
  )
  app.use(express.json({ limit: '25mb' }))

  // Serve static files BEFORE auth gate — assets are public
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = path.dirname(__filename)
  const webDist = path.resolve(__dirname, '../../../packages/web/dist')
  app.use(express.static(webDist))

  // Public auth route is registered before the gate... but gate already allows /auth.
  // Apply gate then mount all routers under /api.
  app.use('/api', authGate)

  app.use('/api', authRoutes)
  // Git router must come before the files router so /file/remote and
  // /file/discard are not shadowed by the /file/* splat.
  app.use('/api', gitRoutes)
  app.use('/api', filesRoutes)
  app.use('/api', githubRoutes)

  // SPA fallback — serve index.html for all non-API routes
  app.get('*', (_req, res) => {
    res.sendFile(path.join(webDist, 'index.html'))
  })

  return app
}
