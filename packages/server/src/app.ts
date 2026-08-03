import express, { type Express } from 'express'
import cors from 'cors'
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

  app.get('/', (_req, res) => {
    res.json({ message: 'Blog Editor API is running' })
  })

  // Public auth route is registered before the gate... but gate already allows /auth.
  // Apply gate then mount all routers.
  app.use(authGate)

  app.use(authRoutes)
  app.use(filesRoutes)
  app.use(gitRoutes)
  app.use(githubRoutes)

  return app
}
