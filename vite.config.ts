import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { createTutorMiddleware } from './server/tutor.ts'

export default defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, process.cwd(), ''), ...process.env }
  const middleware = createTutorMiddleware({ provider: env.AI_PROVIDER, model: env.AI_MODEL, apiKey: env.AI_API_KEY })
  return {
    server: { host: '127.0.0.1' },
    plugins: [react(), {
      name: 'private-learning-tutor',
      configureServer(server) { server.middlewares.use(middleware) },
      configurePreviewServer(server) { server.middlewares.use(middleware) },
    }],
  }
})
