/**
 * State contract of the secret-input-card plugin. Request metadata only: a secret's value
 * NEVER goes here ($.state survives reloads and may be persisted by the engine).
 */
export type Destination = 'env' | 'keychain'

export type SecretRequest = {
  /** tool_use_id of the request_secret call. */
  id: string
  destination: Destination
  /** The .env variable, or the Keychain account. */
  name: string
  /** The .env file, or the Keychain service. */
  where: string
  /** Short card title ("OpenRouter API key"). */
  title: string
  /** Why Claude asked, in one sentence. */
  reason: string
  /** How many characters the field holds (the card only shows dots). */
  typed: number
  status: 'waiting' | 'saving' | 'saved' | 'cancelled'
  /** Status line shown on the card (never contains the value). */
  message: string
  /** When the card opened ($.clock.now()); after an hour without an answer it expires. */
  createdAt: number
}

declare module 'claude-code' {
  interface PluginState {
    'secret-input-card': { requests: Shaped<Record<string, SecretRequest>> }
  }
}
