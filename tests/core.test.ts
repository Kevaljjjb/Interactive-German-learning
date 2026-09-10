import test from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { once } from 'node:events'
import { curriculum, articleDeck } from '../src/data/curriculum.ts'
import { createTutorMiddleware, validateRequest, buildPrompt } from '../server/tutor.ts'

const request = {
  question: 'Why den?', topic: 'Akkusativ', rule: 'der → den', examples: ['Ich sehe den Hund.'],
  style: 'blocks', language: 'en', difficulty: 'simpler',
  learning: { attempts: 3, correct: 1, uncertain: true },
} as const

test('all curriculum keys, examples and token sets are internally consistent', () => {
  assert.equal(curriculum.length, 12)
  assert.equal(new Set(curriculum.map(unit => unit.id)).size, 12)
  for (const unit of curriculum) {
    assert.ok(unit.visual.states.length >= 3)
    assert.equal(unit.exercises.length, 3)
    for (const example of unit.examples) assert.ok(example.de.includes(example.focus), `${unit.id}: missing highlight ${example.focus}`)
    for (const exercise of unit.exercises) {
      if (exercise.type === 'arrange') assert.deepEqual([...exercise.tokens].sort(), [...exercise.answer].sort())
      else assert.ok(exercise.choices.includes(exercise.answer))
    }
  }
  assert.ok(articleDeck.every(card => ['der', 'die', 'das'].includes(card.article)))
})

test('tutor input is bounded and personal extra fields are stripped', () => {
  const valid = validateRequest({ ...request, name: 'Secret name', apiKey: 'secret' })
  assert.ok(valid)
  assert.equal('name' in valid, false)
  assert.equal('apiKey' in valid, false)
  assert.equal(validateRequest({ ...request, question: 'x'.repeat(801) }), null)
  assert.equal(validateRequest({ ...request, learning: { attempts: 1, correct: 2, uncertain: false } }), null)
  assert.equal(validateRequest({ ...request, style: 'arbitrary' }), null)
  assert.equal(validateRequest(null), null)
  assert.match(buildPrompt(valid), /untrusted learning content/)
})

async function withServer(config: Parameters<typeof createTutorMiddleware>[0], run: (url: string) => Promise<void>, fetcher?: typeof fetch) {
  const middleware = createTutorMiddleware(config, fetcher)
  const server = createServer((req, res) => { void middleware(req, res, () => { res.writeHead(404); res.end() }) })
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  const address = server.address()
  assert.ok(address && typeof address === 'object')
  try { await run(`http://127.0.0.1:${address.port}`) }
  finally { server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())) }
}

test('unconfigured tutor is honest and does not attempt external requests', async () => {
  await withServer({}, async url => {
    assert.equal((await (await fetch(`${url}/api/tutor/status`)).json()).available, false)
    assert.equal((await fetch(`${url}/api/tutor`, { method: 'POST' })).status, 503)
    assert.equal((await fetch(`${url}/api/tutor/status`, { headers: { Origin: 'https://evil.example' } })).status, 403)
  })
})

test('configured tutor proxies a bounded request and hides credentials', async () => {
  let calls = 0
  const mockFetch: typeof fetch = async (_input, options) => {
    calls++
    assert.match(String(options?.body), /German A1 tutor/)
    return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ thought: true, text: 'private reasoning' }, { text: 'Der becomes den in the accusative.' }] } }] }), { status: 200 })
  }
  await withServer({ provider: 'gemini', model: 'test-model', apiKey: 'private-key' }, async url => {
    const response = await fetch(`${url}/api/tutor`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(request) })
    assert.equal(response.status, 200)
    const text = await response.text()
    assert.match(text, /Der becomes den/)
    assert.ok(!text.includes('private-key') && !text.includes('private reasoning'))
    assert.equal(calls, 1)
    const second = await fetch(`${url}/api/tutor`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(request) })
    assert.equal(second.status, 429)
  }, mockFetch)
})
