import { createApp } from './app'
import { config } from './config'

const app = createApp()

app.listen(config.port, '0.0.0.0', () => {
  console.log(`Server is running on http://localhost:${config.port}`)
  console.log(`Blog dir: ${config.blogDir}`)
  console.log(`Git dir:  ${config.gitDir}`)
})

export { app }
