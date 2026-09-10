import test from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { once } from 'node:events'
import { curriculum, articleDeck } from '../src/data/curriculum.ts'
import { lessonHref, parseHash, practiceHref } from '../src/lib/routes.ts'
import { buildGuidePrompt, buildPrompt, createTutorMiddleware, localRecommendations, parseGuideResponse, validateGuideRequest, validateRequest } from '../server/tutor.ts'

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

test('deep links parse into stable chapter, topic and game routes', () => {
  assert.equal(lessonHref('essen-artikel', 'discover', 'Accusative case'), '#/learn/essen-artikel/discover/accusative-case')
  assert.deepEqual(parseHash('#/learn/essen-artikel/practice/accusative'), { kind: 'lesson', unitId: 'essen-artikel', tab: 'practice', topic: 'accusative' })
  assert.deepEqual(parseHash(practiceHref('sentences')), { kind: 'practice', game: 'sentences' })
  assert.deepEqual(parseHash('#/unknown'), { kind: 'view', view: 'home' })
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

async function withServer(
  config: Parameters<typeof createTutorMiddleware>[0],
  run: (url: string) => Promise<void>,
  fetcher?: typeof fetch,
  codex?: Parameters<typeof createTutorMiddleware>[2],
) {
  const middleware = createTutorMiddleware(config, fetcher, codex)
  const server = createServer((req, res) => { void middleware(req, res, () => { res.writeHead(404); res.end() }) })
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  const address = server.address()
  assert.ok(address && typeof address === 'object')
  try { await run(`http://127.0.0.1:${address.port}`) }
  finally { server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())) }
}

test('guide requests and recommendation links are strictly bounded', () => {
  const guide = validateGuideRequest({ question: 'Teach me accusative', completedUnitIds: ['hallo-verbmotor'], name: 'Private' })
  assert.deepEqual(guide, { question: 'Teach me accusative', completedUnitIds: ['hallo-verbmotor'] })
  assert.equal(validateGuideRequest({ question: 'x', completedUnitIds: ['invented-unit'] }), null)
  assert.match(buildGuidePrompt(guide!), /Return ONLY JSON/)
  assert.equal(localRecommendations('I want to learn accusative articles')[0]?.unitId, 'essen-artikel')
  const parsed = parseGuideResponse(JSON.stringify({ answer: 'Start here.', recommendations: [
    { unitId: 'invented-unit', tab: 'practice', reason: 'unsafe' },
    { unitId: 'essen-artikel', tab: 'examples', topic: 'Accusative case', reason: 'See the pattern.' },
  ] }), 'accusative')
  assert.equal(parsed.recommendations[0]?.unitId, 'essen-artikel')
  assert.ok(parsed.recommendations.every(item => curriculum.some(unit => unit.id === item.unitId)))
})

test('unconfigured tutor is honest and does not attempt external requests', async () => {
  await withServer({}, async url => {
    assert.equal((await (await fetch(`${url}/api/tutor/status`)).json()).available, false)
    assert.equal((await fetch(`${url}/api/tutor`, { method: 'POST' })).status, 503)
    assert.equal((await fetch(`${url}/api/tutor/status`, { headers: { Origin: 'https://evil.example' } })).status, 403)
  })
})

test('Codex guide returns only validated internal course links', async () => {
  const codex = {
    probe: async () => true,
    run: async (prompt: string) => {
      assert.match(prompt, /German A1 learner/)
      return JSON.stringify({ answer: 'The accusative marks the direct object.', recommendations: [
        { unitId: 'essen-artikel', tab: 'discover', topic: 'Accusative case', reason: 'Learn der to den.' },
        { unitId: '../../escape', tab: 'practice', reason: 'bad' },
      ] })
    },
  }
  await withServer({ provider: 'codex-cli', codexBin: '/safe/codex' }, async url => {
    const status = await (await fetch(`${url}/api/tutor/status`)).json()
    assert.equal(status.available, true)
    assert.equal(status.provider, 'codex-cli')
    const response = await fetch(`${url}/api/guide`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question: 'Teach me accusative', completedUnitIds: [] }) })
    assert.equal(response.status, 200)
    const result = await response.json()
    assert.equal(result.recommendations[0].unitId, 'essen-artikel')
    assert.ok(!JSON.stringify(result).includes('../../escape'))
  }, fetch, codex)
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
