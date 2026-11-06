import { expect, mock, test } from 'claude-code/testing'
import type { On } from 'claude-code'

// Fake keys built by concatenation (none is real).
const FAKE = ['sk-ant-admin01-', 'Q'.repeat(40)].join('')
const KEYCHAIN_VALUE = ['test-', 'secret-', '123456'].join('')
const TOOL = 'mcp__secret-input-card__request_secret'

/**
 * What sits beneath the plugin in these tests: the engine's drawing, the kit's in-memory clock
 * and `prompt.submit`, which keeps the messages the plugin sends Claude after the card.
 */
function engineBelow(on: On) {
  const submitted: string[] = []
  on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)
    return <Text>engine</Text>
  })
  on('prompt.submit', (_, e) => {
    submitted.push(e.text)
    return e as never
  })
  const clock = mock.clock(on)
  return { clock, submitted }
}

/** The text the tool handed the model (JSON). */
function resultText(done: unknown): string {
  const result = (done as { result?: unknown }).result
  return typeof result === 'string' ? result : JSON.stringify(done)
}

function card(id: string) {
  return {
    plugin: 'secret-input-card',
    component: 'ToolUse',
    requestId: id,
    props: { tool_use_id: id, tool: TOOL, input: {}, isRunning: false, isErrored: false, isInterrupted: false },
  } as const
}

/** Fake git and chmod (`ignored` decides check-ignore) and an in-memory .env file. */
function fakeHost(on: On, ignored: boolean) {
  const writes: { path: string; text: string }[] = []
  const runs: { argv: readonly string[]; stdin?: string; cwd?: string }[] = []
  on('process.run', (_, e) => {
    runs.push({ argv: e.argv, stdin: e.init?.stdin, cwd: e.init?.cwd })
    const cmd = e.argv.join(' ')
    const exitCode = cmd.startsWith('git rev-parse') ? 0
      : cmd.startsWith('git ls-files') ? 1
        : cmd.startsWith('git check-ignore') ? (ignored ? 0 : 1) : 0
    return { value: { exitCode, stdout: '', stderr: '', isStdoutTruncated: false, isStderrTruncated: false } }
  })
  on('fs.exists', () => ({ value: true }))
  on('fs.read', () => ({ value: '# config\nOTHER=1\nOPENROUTER_API_KEY=old\n' }))
  on('fs.write', (_, e) => {
    writes.push({ path: e.path, text: e.text })
    return { value: undefined }
  })
  return { writes, runs }
}

test('registers the tool and instructs the model', async ($, on) => {
  const registered: unknown[] = []
  on('tool.register', (_, e) => {
    registered.push(e)
    return { value: { tool: TOOL } }
  })
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('prompt.compose', () => ({ sections: [] }))
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  expect(JSON.stringify(registered)).toContain('request_secret')
  const composed = await $.prompt.compose({ model: 'claude-opus-5-5', promptModel: 'claude-opus-5-5',
    surfaces: ['desktop'], tools: [], outputStyle: null, traits: [], sections: [] } as never)
  expect(JSON.stringify(composed)).toContain(TOOL)
  expect(JSON.stringify(composed)).toContain('[secret-input-card]')
})

test('a key pasted into the chat never reaches the model', async ($, on) => {
  const toasts: string[] = []
  on('ui.toast', (_, e) => {
    toasts.push(String((e as { text?: string }).text ?? JSON.stringify(e)))
    return { value: undefined }
  })
  on('prompt.submit', (_, e) => e)
  const kept = await $.prompt.submit({ text: 'hi, how are you?' } as never)
  expect(JSON.stringify(kept)).toContain('how are you')
  const dropped = await $.prompt.submit({ text: 'my key: ' + FAKE } as never)
  expect(JSON.stringify(dropped)).toContain('drop')
  expect(JSON.stringify(dropped)).not.toContain(FAKE)
  expect(toasts.join(' ')).not.toContain(FAKE)
})

test('an invalid request is refused before the card opens', async ($, on) => {
  on('tool.call', () => ({ result: {} }))
  const bad = await $.tool.call({ tool: TOOL, destination: 'vault', name: 'x', reason: 'x' })
  expect(JSON.stringify(bad)).toContain('destination must be env or keychain')
  const badName = await $.tool.call({ tool: TOOL, destination: 'keychain', service: 'a b', name: 'x', reason: 'x' })
  expect(JSON.stringify(badName)).toContain('letters, digits')
})

test('the card answers at once, saves to the Keychain and Claude only gets the summary', async ($, on) => {
  const { runs } = fakeHost(on, true)
  on('tool.call', () => ({ result: {} }))
  const { submitted } = engineBelow(on)

  const opened = await $.tool.call({ tool: TOOL, tool_use_id: 'tu1', destination: 'keychain', service: 'my-app',
    name: 'api', title: 'Test key', reason: 'The app needs its API key' })
  expect(resultText(opened)).toContain('"card_opened":true')

  for (const surface of ['desktop', 'terminal'] as const) {
    const ui = await $.ui.mount({ ...card('tu1'), surface })
    expect((await ui.find({ type: 'Text', text: /Test key/ }))?.text).toBe('Test key')
    expect((await ui.find({ type: 'Text', text: /^Secrets$/ }))?.text).toBe('Secrets')
    expect((await ui.find({ type: 'Text', text: /never shown/ }))?.text).toBe('Stored securely, never shown to Claude')
    await ui.unmount()
  }
  const ui = await $.ui.mount({ ...card('tu1'), surface: 'desktop' })
  await ui.input({ key: 'secret', text: KEYCHAIN_VALUE, kind: 'change' })
  const field = await ui.find({ type: 'Input', key: 'secret' })
  expect(JSON.stringify(field)).not.toContain(KEYCHAIN_VALUE)
  expect(JSON.stringify(field)).toContain('•'.repeat(KEYCHAIN_VALUE.length))
  // One Submit (the field's own), and the account named once, on the "Goes to" line.
  expect(Boolean(await ui.find({ type: 'Button', key: 'submit' }))).toBe(false)
  expect(Boolean(await ui.find({ type: 'Text', text: /^my-app \/ api$/ }))).toBe(false)
  await ui.input({ key: 'secret', text: '•'.repeat(KEYCHAIN_VALUE.length), kind: 'submit' })
  expect((await ui.find({ type: 'Text', text: /saved$/ }))?.text).toBe('Test key: saved')
  await ui.unmount()

  expect(submitted.length).toBe(1)
  expect(submitted[0]).toContain('[secret-input-card] Test key: saved')
  expect(submitted[0]).toContain(`${KEYCHAIN_VALUE.length} characters`)
  expect(submitted.join(' ')).not.toContain(KEYCHAIN_VALUE)
  const add = runs.find(r => r.argv.includes('-i'))
  expect(add?.argv.join(' ')).not.toContain(KEYCHAIN_VALUE)
  expect(add?.stdin).toContain(KEYCHAIN_VALUE)
})

test('cancelling tells Claude that nothing was saved', async ($, on) => {
  fakeHost(on, true)
  on('tool.call', () => ({ result: {} }))
  const { submitted } = engineBelow(on)
  await $.tool.call({ tool: TOOL, tool_use_id: 'tu2', destination: 'env', name: 'OPENROUTER_API_KEY',
    title: 'OpenRouter API key', reason: 'rotate the key' })
  const ui = await $.ui.mount({ ...card('tu2'), surface: 'desktop' })
  expect((await ui.find({ type: 'Text', text: /^Goes to: / }))?.text).toBe('Goes to: .env.local → OPENROUTER_API_KEY')
  expect(Boolean(await ui.find({ type: 'Text', text: /^OPENROUTER_API_KEY$/ }))).toBe(false)
  await ui.press({ key: 'cancel' })
  await ui.unmount()
  expect(submitted).toEqual(['[secret-input-card] OpenRouter API key: the user cancelled the request; nothing was saved.'])
})

test('a gitignored .env: replaces the line and the summary never holds the value', async ($, on) => {
  const { writes } = fakeHost(on, true)
  on('tool.call', () => ({ result: {} }))
  const { submitted } = engineBelow(on)
  await $.tool.call({ tool: TOOL, tool_use_id: 'tu3', destination: 'env', file: '/proj/.env',
    name: 'OPENROUTER_API_KEY', reason: 'configure the app' })
  const ui = await $.ui.mount({ ...card('tu3'), surface: 'desktop' })
  await ui.input({ key: 'secret', text: FAKE, kind: 'submit' })
  await ui.unmount()
  expect(writes.length).toBe(1)
  expect(writes[0]?.path).toBe('/proj/.env')
  expect(writes[0]?.text).toBe(`# config\nOTHER=1\nOPENROUTER_API_KEY=${FAKE}\n`)
  expect(submitted.length).toBe(1)
  expect(submitted[0]).toContain('saved')
  expect(submitted[0]).not.toContain(FAKE)
})

test('with no file named, an env request writes to .env.local', async ($, on) => {
  const { writes } = fakeHost(on, true)
  on('tool.call', () => ({ result: {} }))
  engineBelow(on)
  const opened = await $.tool.call({ tool: TOOL, tool_use_id: 'tu5', destination: 'env', name: 'API_KEY', reason: 'x' })
  expect(resultText(opened)).toContain('".env.local"')
  const ui = await $.ui.mount({ ...card('tu5'), surface: 'desktop' })
  await ui.input({ key: 'secret', text: KEYCHAIN_VALUE, kind: 'submit' })
  await ui.unmount()
  expect(writes[0]?.path.endsWith('/.env.local') || writes[0]?.path === '.env.local').toBe(true)
})

test('a .env file outside .gitignore is refused without opening the card', async ($, on) => {
  const { writes } = fakeHost(on, false)
  on('tool.call', () => ({ result: {} }))
  const denied = await $.tool.call({ tool: TOOL, destination: 'env', file: '/proj/.env', name: 'X', reason: 'y' })
  expect(JSON.stringify(denied)).toContain('gitignore')
  expect(writes.length).toBe(0)
  const example = await $.tool.call({ tool: TOOL, destination: 'env', file: '/proj/.env.example', name: 'X', reason: 'y' })
  expect(JSON.stringify(example)).toContain('committed template')
})

test('a card with no answer expires after an hour', async ($, on) => {
  on('tool.call', () => ({ result: {} }))
  const { clock, submitted } = engineBelow(on)
  await $.tool.call({ tool: TOOL, tool_use_id: 'tu4', destination: 'keychain', service: 's', name: 'a', reason: 'x' })
  await clock.advance(61 * 60 * 1000)
  const ui = await $.ui.mount({ ...card('tu4'), surface: 'desktop' })
  expect((await ui.find({ type: 'Text', text: /expired/ }))?.text).toContain('expired')
  expect(await ui.find({ type: 'Input', key: 'secret' })).toBeUndefined()
  await ui.unmount()
  expect(submitted).toEqual([])
})

test('a folded tool group holding a request_secret call unfolds, so the card shows', async ($, on) => {
  const seen: boolean[] = []
  on('ui.render', ($, e) => {
    seen.push(Boolean((e.props as { isExpanded?: boolean }).isExpanded))
    const { Text } = $.ui.resolve(e)
    return <Text>engine</Text>
  })
  const call = (tool: string) => ({ tool, input: {}, isRunning: false, isErrored: false, isInterrupted: false })
  const group = (calls: ReturnType<typeof call>[]) => ({
    plugin: 'secret-input-card', component: 'ToolGroup', requestId: 'g', surface: 'desktop',
    props: { calls, isActive: false, isExpanded: false },
  } as const)
  const mine = await $.ui.mount(group([call('Bash'), call(TOOL)]) as never)
  await mine.unmount()
  const other = await $.ui.mount(group([call('Bash'), call('Read')]) as never)
  await other.unmount()
  expect(seen).toEqual([true, false])
})
