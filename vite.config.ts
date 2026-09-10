import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { resolve } from 'node:path'
import { existsSync } from 'node:fs'
import { createTutorMiddleware } from './server/tutor.ts'

export default defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, process.cwd(), ''), ...process.env }
  const localCodex = resolve(process.cwd(), 'node_modules/.bin/codex')
  const provider = env.AI_PROVIDER || (existsSync(localCodex) ? 'codex-cli' : undefined)
  const middleware = createTutorMiddleware({
    provider,
    model: env.AI_MODEL,
    apiKey: env.AI_API_KEY,
    codexBin: env.CODEX_BIN || localCodex,
  })
  return {
    server: { host: '127.0.0.1' },
    preview: { host: '127.0.0.1' },
    plugins: [react(), {
      name: 'private-learning-tutor',
      configureServer(server) { server.middlewares.use(middleware) },
      configurePreviewServer(server) { server.middlewares.use(middleware) },
    }],
  }
})
