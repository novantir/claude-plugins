import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Destination, SecretRequest } from '../types'

/**
 * secret-input-card: API keys without going through the chat.
 *
 * Claude calls the `request_secret` tool (destination, name, reason) and it answers at once:
 * "card opened". The call's row in the chat becomes a live card with a field that shows only
 * dots; you paste the key and press Submit, and the plugin itself writes it to the destination:
 * a `.env` file that git ignores (left at mode 600) or the macOS Keychain. The plugin then sends
 * Claude a message ("saved, N characters"), which starts a new turn. Nothing waits inside a
 * hook: a hook's time budget counts even `$.clock.sleep`, and a 15-minute wait would not fit.
 *
 * The value lives only in this module's memory until it is written, and is wiped right after.
 * None of it goes to `$.state`, the tool result, the message to Claude, logs or toasts.
 *
 * Also: an instruction in the system prompt (use the tool instead of asking for the key in the
 * chat) and a guard that holds back a message when a key is pasted straight into the chat.
 */

const requests = atom({ plugin: 'secret-input-card', key: 'requests' } as const, {}, { shape: 'requests-1' })

const PREFIX = '[secret-input-card]'
/** A card with no answer for longer than this stops taking the key (ask for another). */
const EXPIRE_MS = 60 * 60 * 1000
/** Where an `env` request writes when Claude names no file: most templates already gitignore it. */
const DEFAULT_ENV_FILE = '.env.local'
const MASK = '•'
// Card icons (neutral gray stroke, readable on light and dark themes).
const KEY_ICON = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#9a9aa2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="7.5" cy="15.5" r="4.5"/><path d="M10.7 12.3 21 2"/><path d="m16 7 3 3"/><path d="m19 4 2 2"/></svg>'
const SHIELD_ICON = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#9a9aa2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>'
const ENV_NAME = /^[A-Za-z_][A-Za-z0-9_]*$/
const KEYCHAIN_NAME = /^[A-Za-z0-9._@:-]{1,128}$/
/** Things that look like keys: held back when pasted straight into the chat. */
const SECRET_PATTERNS: ReadonlyArray<[string, RegExp]> = [
  ['Anthropic', /\bsk-ant-[A-Za-z0-9_-]{20,}/],
  ['OpenAI/OpenRouter', /\bsk-(?:proj-|admin-|or-v1-|svcacct-)?[A-Za-z0-9_-]{32,}/],
  ['AWS', /\bAKIA[A-Z0-9]{16}\b/],
  ['GitHub', /\b(?:ghp|gho|ghs|ghu)_[A-Za-z0-9]{30,}|\bgithub_pat_[A-Za-z0-9_]{40,}/],
  ['Stripe', /\b(?:sk|rk)_(?:live|test)_[A-Za-z0-9]{20,}/],
  ['Firecrawl', /\bfc-[a-f0-9]{32}\b/],
  ['Supabase', /\bsbp_[a-f0-9]{40}\b/],
  ['Slack', /\bxox[abprs]-[A-Za-z0-9-]{20,}/],
  ['Google', /\bAIza[A-Za-z0-9_-]{35}\b/],
]

const INSTRUCTION = [
  'secret-input-card plugin: whenever you need the user to provide an API key, token, password or other secret,',
  'call the mcp__secret-input-card__request_secret tool instead of asking them to paste it in the chat, in a',
  'terminal or into a file. Destinations: "env" (a variable in a .env file that git ignores; give the file, or it',
  `defaults to ${DEFAULT_ENV_FILE}, and the variable name) and "keychain" (the macOS Keychain; give service and`,
  'account). Write the reason in one sentence. The tool only opens the card and answers at once: end your turn',
  `saying the card is open and wait; when the user submits (or cancels), a "${PREFIX} ..." message arrives with the`,
  'outcome and the variable name, never the value. Then use the key by name, without ever seeing it: load the .env',
  'file into the environment of the command that needs it (set -a; . ./.env.local; set +a; <command>), or hand the',
  'file to a tool that reads one (supabase secrets set --env-file .env.local); for the Keychain, read it only inside',
  'the command that uses it (KEY="$(security find-generic-password -a <account> -s <service> -w)" <command>). Never',
  'print, echo, cat or grep the value, never write it into code or another file, and never repeat it. Sending it to',
  'an outside service (Railway variables, Supabase secrets) is a change to that service: ask the user first.',
].join(' ')

// Only in this module's memory, never in $.state: what was pasted, per request. A reload of the
// plugin starts empty, and a card opened before it reads as expired.
const buffers = new Map<string, string>()
let toolName = 'mcp__secret-input-card__request_secret'

function forget(id: string): void {
  if (buffers.has(id)) buffers.set(id, '')
  buffers.delete(id)
}

function setRequest($: EngineInterface, id: string, change: (r: SecretRequest) => SecretRequest) {
  return update($, requests, all => (all[id] ? { ...all, [id]: change(all[id]) } : all))
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const started = await next(e)
    const { tool } = await $.tool.register({
      name: 'request_secret',
      description: 'Asks the user for an API key, token or password in a protected card inside the chat and writes it '
        + 'to its destination (a .env file that git ignores, or the macOS Keychain) without the value ever reaching '
        + 'the model. Use it whenever you need a secret, instead of asking the user to paste it in the chat or a '
        + `terminal. Answers at once that the card opened; the outcome (saved or not, how many characters) arrives `
        + `later in a "${PREFIX} ..." message.`,
      isDeferred: false,
      inputSchema: {
        type: 'object',
        properties: {
          destination: { type: 'string', enum: ['env', 'keychain'],
            description: 'env: a variable in a .env file; keychain: an item in the macOS Keychain' },
          name: { type: 'string',
            description: 'env: the variable name (e.g. OPENROUTER_API_KEY); keychain: the account' },
          file: { type: 'string',
            description: `env only: the .env file (absolute, or relative to the session); default ${DEFAULT_ENV_FILE}` },
          service: { type: 'string', description: 'keychain only: the service of the Keychain item' },
          title: { type: 'string', description: 'Short card title (e.g. "OpenRouter API key"); optional' },
          reason: { type: 'string', description: 'Why the key is needed, in one sentence (shown on the card)' },
        },
        required: ['destination', 'name', 'reason'],
      },
    })
    toolName = tool
    return started
  })

  on('prompt.compose', async ($, e, next) => {
    const composed = await next(e)
    return { sections: [...composed.sections, { id: 'secret-input-card:instruction', text: INSTRUCTION,
      scope: 'session' as const }] }
  })

  // A key pasted straight into the chat: the message does not reach the model; the user is told.
  on('prompt.submit', ($, e, next) => {
    if (e.command || e.isMeta) return next(e)
    const hit = SECRET_PATTERNS.find(([, re]) => re.test(e.text))
    if (!hit) return next(e)
    $.ui.toast(`secret-input-card: that looks like a key (${hit[0]}). The message was not sent to Claude: `
      + 'ask Claude for a secret card instead.')
    return { drop: `secret-input-card: the message held what looks like a key (${hit[0]}) and was not sent.` }
  }).catch(($, e, next) => (next.called ? next(e) : next(e)))

  on('tool.call', async ($, e, next) => {
    if (e.tool !== toolName) return next(e)
    const input = (e as { input?: Record<string, unknown> }).input ?? (e as unknown as Record<string, unknown>)
    const destination = String(input.destination ?? '') as Destination
    const name = String(input.name ?? '').trim()
    const reason = String(input.reason ?? '').trim().slice(0, 300) || 'no reason given'
    const title = String(input.title ?? '').trim().slice(0, 80) || defaultTitle(destination, name)
    let where = ''
    if (destination === 'env') {
      const file = String(input.file ?? '').trim() || DEFAULT_ENV_FILE
      const problem = checkEnvTarget(file, name)
      if (problem) return { deny: `secret-input-card: ${problem}` }
      let ignored: Awaited<ReturnType<typeof gitIgnored>>
      try {
        ignored = await gitIgnored($, file)
      } catch (err) {
        return { deny: `secret-input-card: could not ask git whether ${file} is ignored (${describeError(err)})` }
      }
      if (ignored === 'tracked-or-not-ignored') {
        return { deny: `secret-input-card: ${file} is not in .gitignore (or is already tracked); add it to .gitignore first` }
      }
      where = file
    } else if (destination === 'keychain') {
      const service = String(input.service ?? '').trim()
      if (!KEYCHAIN_NAME.test(service) || !KEYCHAIN_NAME.test(name)) {
        return { deny: 'secret-input-card: Keychain service and name: letters, digits and . _ @ : - only (up to 128)' }
      }
      where = service
    } else {
      return { deny: 'secret-input-card: destination must be env or keychain' }
    }

    const id = e.tool_use_id
    const request: SecretRequest = { id, destination, name, where, title, reason, typed: 0, status: 'waiting',
      message: '', createdAt: await $.clock.now() }
    buffers.set(id, '')
    await update($, requests, all => ({ ...all, [id]: request }))
    $.ui.toast(`secret-input-card: a card is waiting in the chat for ${title}.`)
    // Answer now: the card stays live in the chat and the outcome comes later, via $.prompt.submit.
    return { result: JSON.stringify({ card_opened: true, destination, name, where,
      message: `The card is open for the user. End your turn and wait for the "${PREFIX} ..." message with the outcome.` }) }
  }).catch(($, e, next) => {
    if (e.tool !== toolName) return next.called ? next(e) : next(e)
    // The failure comes before any value exists (the card has not opened yet).
    return { deny: `secret-input-card: the plugin failed to handle the request; nothing was saved `
      + `(${describeError(next.error).slice(0, 200)})` }
  })

  // The transcript folds runs of tool calls into one count line ("Ran 3 commands"), and a folded
  // call draws no ToolUse row: the card would never show. A group holding a request_secret call
  // unfolds, so each call is its own row and ours draws the card.
  on('ui.render', { component: 'ToolGroup' }, async ($, e, next) => {
    if (e.props.isExpanded || !e.props.calls.some(call => call.tool === toolName)) return next(e)
    return next({ ...e, props: { ...e.props, isExpanded: true } })
  })

  on('ui.render', { component: 'ToolUse' }, async ($, e, next) => {
    if (e.props.tool !== toolName) return next(e)
    const request = (await read($, requests))[e.props.tool_use_id]
    if (!request) return next(e)
    const elements = $.ui.resolve(e)
    const { Box, Text, Button } = elements
    // Icons only where the surface draws Svg (desktop, vscode, mobile); plain text in the terminal.
    const Svg = 'Svg' in elements ? elements.Svg : undefined
    const icon = (source: string, size: number) => (Svg ? <Svg source={source} alt="" width={size} height={size} /> : null)
    const target = request.destination === 'env' ? `${request.where} → ${request.name}`
      : `macOS Keychain → ${request.where} / ${request.name}`
    const header = (
      <Box flexDirection="row" alignItems="center" gap={1}>
        {icon(KEY_ICON, 16)}
        <Text>Secrets</Text>
      </Box>
    )
    const isExpired = request.status === 'waiting' && (!buffers.has(request.id)
      || (await $.clock.now()) - request.createdAt >= EXPIRE_MS)
    if (request.status === 'saved' || request.status === 'cancelled' || isExpired) {
      const done = request.status === 'saved'
      const note = isExpired ? 'this card expired (ask Claude for a new one)' : request.message
      return (
        <Box flexDirection="column" borderStyle="round" paddingX={2} paddingY={1} gap={1}>
          {header}
          <Box flexDirection="column">
            <Text bold>{done ? `${request.title}: saved` : `${request.title}: nothing saved`}</Text>
            <Text dimColor>{target}{note ? ` · ${note}` : ''}</Text>
          </Box>
        </Box>
      )
    }
    if (e.surface === 'mobile') {
      return (
        <Box flexDirection="column" borderStyle="round" paddingX={2} paddingY={1} gap={1}>
          {header}
          <Text bold>{request.title}</Text>
          <Text dimColor>Open this session on your computer to paste the key (the mobile app has no input field yet).</Text>
        </Box>
      )
    }
    const { Input } = $.ui.resolve(e)
    const busy = request.status === 'saving'
    return (
      <Box flexDirection="column" borderStyle="round" paddingX={2} paddingY={1} gap={1}>
        {header}
        <Box flexDirection="column">
          <Text bold>{request.title}</Text>
          <Text dimColor>{request.reason}</Text>
          <Text dimColor>Goes to: {target}</Text>
        </Box>
        {/* The field's own Enter button is the only Submit. The desktop draws Input at a fixed
            width: neither a full-width wrapper nor flexGrow widens it (tried in 0.1.2 and 0.1.3). */}
        <Box flexDirection="column">
          <Input
            key="secret"
            placeholder="paste the key here"
            submitLabel={busy ? 'Saving…' : 'Submit'}
            value={MASK.repeat(request.typed)}
            autoFocus
            onInput={(value: string) => void onField($, request.id, value)}
            onSubmit={(value: string) => void onField($, request.id, value).then(() => save($, request.id))}
          />
        </Box>
        {request.message ? <Text dimColor>{request.message}</Text> : null}
        <Box flexDirection="row" justifyContent="space-between" alignItems="center" gap={2}>
          <Box flexDirection="row" alignItems="center" gap={1} flexShrink={1}>
            {icon(SHIELD_ICON, 14)}
            <Text dimColor>Stored securely, never shown to Claude</Text>
          </Box>
          <Button key="cancel" label="Cancel" variant="secondary" onPress={() => void cancel($, request.id)} />
        </Box>
      </Box>
    )
  })
}

// ---------------------------------------------------------------------------- card

async function save($: EngineInterface, id: string) {
  const request = (await read($, requests))[id]
  const buffer = buffers.get(id)
  if (!request || buffer === undefined || request.status !== 'waiting') return
  let value = buffer.trim()
  if (!value) {
    await setRequest($, id, r => ({ ...r, message: 'paste the key before submitting' }))
    return
  }
  await setRequest($, id, r => ({ ...r, status: 'saving', message: 'saving…' }))
  const length = value.length
  let message: string
  try {
    message = request.destination === 'env'
      ? await saveEnv($, request.where, request.name, value)
      : await saveKeychain($, request.where, request.name, value)
  } catch (err) {
    // The error text is ours or the destination's; the value is stripped from it all the same.
    const text = describeError(err).split(value).join('[key]')
    await setRequest($, id, r => ({ ...r, status: 'waiting', message: `not saved: ${text}` }))
    return
  } finally {
    value = ''
  }
  forget(id)
  await setRequest($, id, r => ({ ...r, status: 'saved', typed: 0, message }))
  void $.prompt.submit({ text: `${PREFIX} ${request.title}: saved (${length} characters). ${message}. `
    + 'The value never went through the chat; you can go on.' })
}

async function cancel($: EngineInterface, id: string) {
  const request = (await read($, requests))[id]
  if (!request || request.status !== 'waiting') return
  forget(id)
  await setRequest($, id, r => ({ ...r, status: 'cancelled', typed: 0, message: 'cancelled by the user' }))
  void $.prompt.submit({ text: `${PREFIX} ${request.title}: the user cancelled the request; nothing was saved.` })
}

/** The field shows dots: each edit arrives as dots + what changed; the real text stays in the buffer. */
async function onField($: EngineInterface, id: string, value: string) {
  const current = buffers.get(id)
  if (current === undefined) return
  let lead = 0
  while (lead < value.length && value[lead] === MASK) lead += 1
  const rest = value.slice(lead)
  const next = (rest === '' && lead <= current.length ? current.slice(0, lead) : current.slice(0, lead) + rest)
    .replace(/[\r\n]+/g, '')
  buffers.set(id, next)
  await setRequest($, id, r => ({ ...r, typed: next.length, message: '' }))
}

// ---------------------------------------------------------------------------- destinations

/** Short text for any error (the engine sometimes rejects with an object, not an Error). */
function describeError(err: unknown): string {
  if (err instanceof Error) return `${err.name}: ${err.message}`.slice(0, 300)
  if (typeof err === 'string') return err.slice(0, 300)
  try {
    return JSON.stringify(err).slice(0, 300)
  } catch {
    return String(err).slice(0, 300)
  }
}

/** Card title: what Claude gave, or a default from the destination. */
function defaultTitle(destination: Destination, name: string): string {
  return destination === 'env' ? name : `Password for ${name}`
}

function basename(path: string): string {
  return path.split('/').pop() ?? path
}

function dirname(path: string): string {
  const index = path.lastIndexOf('/')
  return index < 0 ? '.' : index === 0 ? '/' : path.slice(0, index)
}

function checkEnvTarget(file: string, name: string): string | null {
  if (!ENV_NAME.test(name)) return `invalid variable name "${name}" (letters, digits and _; not starting with a digit)`
  const base = basename(file).toLowerCase()
  if (!(base === '.env' || base.startsWith('.env.') || base.endsWith('.env'))) return `${file} is not a .env file`
  if (/example|sample|template|dist/.test(base)) return `${file} is a committed template; use the real .env file`
  return null
}

/** `ignored`, `no-repo` (outside a git repository) or `tracked-or-not-ignored`. */
async function gitIgnored($: EngineInterface, file: string): Promise<'ignored' | 'no-repo' | 'tracked-or-not-ignored'> {
  const cwd = dirname(file)
  const base = basename(file)
  const inside = await $.process.run(['git', 'rev-parse', '--is-inside-work-tree'], { cwd }).catch(() => null)
  if (!inside || inside.exitCode !== 0) return 'no-repo'
  const tracked = await $.process.run(['git', 'ls-files', '--error-unmatch', '--', base], { cwd })
  if (tracked.exitCode === 0) return 'tracked-or-not-ignored'
  const ignored = await $.process.run(['git', 'check-ignore', '-q', '--', base], { cwd })
  return ignored.exitCode === 0 ? 'ignored' : 'tracked-or-not-ignored'
}

/**
 * The .env line. A value with other characters goes in single quotes, which both a shell (`. .env.local`) and
 * dotenv libraries read literally; only a value holding a single quote needs double quotes, with `\ " $ \``
 * escaped so a shell does not expand them.
 */
function envLine(name: string, value: string): string {
  if (/^[A-Za-z0-9_\-.:/+=@]+$/.test(value)) return `${name}=${value}`
  if (!value.includes("'")) return `${name}='${value}'`
  return `${name}="${value.replace(/[\\"$`]/g, c => `\\${c}`)}"`
}

async function saveEnv($: EngineInterface, file: string, name: string, value: string): Promise<string> {
  const exists = await $.fs.exists(file)
  const lines = exists ? (await $.fs.read(file)).split('\n') : []
  const re = new RegExp(`^\\s*(export\\s+)?${name}\\s*=`)
  let replaced = false
  const out = lines.map(line => {
    const match = re.exec(line)
    if (!match) return line
    replaced = true
    return (match[1] ?? '') + envLine(name, value)
  })
  if (!replaced) {
    if (out.length && out[out.length - 1] === '') out.pop()
    out.push(envLine(name, value), '')
  }
  await $.fs.write(file, out.join('\n'))
  const chmod = await $.process.run(['chmod', '600', file]).catch(() => null)
  out.fill('')
  return `${name} ${replaced ? 'replaced' : 'added'} in ${file}${chmod && chmod.exitCode === 0 ? ' (mode 600)' : ''}`
}

async function saveKeychain($: EngineInterface, service: string, account: string, value: string): Promise<string> {
  if (/["\\\r\n]/.test(value)) throw new Error('the key has quotes, a backslash or a line break; use a .env file')
  // `security -i` reads the command from stdin: the value never appears in argv or `ps`.
  const script = `add-generic-password -U -a "${account}" -s "${service}" -w "${value}"\n`
  const run = await $.process.run(['/usr/bin/security', '-i'], { stdin: script, timeoutMs: 15000 })
  if (run.exitCode !== 0) throw new Error(`the Keychain refused it (code ${run.exitCode})`)
  const check = await $.process.run(['/usr/bin/security', 'find-generic-password', '-a', account, '-s', service])
  if (check.exitCode !== 0) throw new Error('the Keychain did not confirm the saved item')
  return `saved in the macOS Keychain (service ${service}, account ${account})`
}
