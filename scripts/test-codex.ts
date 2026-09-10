import { resolve } from 'node:path'
import { createCodexAdapter } from '../server/tutor.ts'

const adapter = createCodexAdapter({
  provider: 'codex-cli',
  codexBin: resolve(process.cwd(), 'node_modules/.bin/codex'),
  codexTimeoutMs: 90_000,
})

if (!await adapter.probe()) {
  console.error('Codex CLI is installed but not logged in. Run: npm run ai:login')
  process.exitCode = 1
} else {
  const answer = await adapter.run('Reply with exactly: SATZGARTEN_CODEX_CONNECTED')
  if (answer.trim() !== 'SATZGARTEN_CODEX_CONNECTED') {
    console.error(`Unexpected Codex reply: ${answer.trim()}`)
    process.exitCode = 1
  } else {
    console.log('✓ Codex CLI authenticated')
    console.log('✓ Safe read-only subprocess completed')
    console.log('✓ SatzGarten AI connection ready')
  }
}
