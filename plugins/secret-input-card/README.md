# secret-input-card

A Claude Code plugin that keeps API keys out of the conversation. When Claude needs a key, it asks for it in a card inside the chat instead of asking you to paste it in the chat or a terminal. You paste the key into the card, press **Submit**, and the plugin writes it straight to its destination. Claude only learns that it was saved and how many characters it had.

## How it works

1. Claude calls the `request_secret` tool with a destination, a name and a one-line reason. The tool answers at once ("card opened") and Claude ends its turn.
2. The tool's row in the chat becomes a card: a title, the reason, where the key goes, a field that shows only dots, and **Cancel** / **Submit**.
3. On **Submit**, the plugin writes the key:
   - **`env`**: a variable in a `.env` file (default `.env.local`). The file must be ignored by git and not tracked; committed templates such as `.env.example` are refused. The line is replaced if the variable exists, appended otherwise, and the file is left at mode `600`.
   - **`keychain`**: an item in the macOS Keychain (service and account), written through `security -i` so the value never appears in a command line.
4. The plugin sends Claude a message such as `[secret-input-card] OpenRouter API key: saved (73 characters)…`, which starts a new turn. Cancelling sends `…nothing was saved`. A card left unanswered for an hour expires.

It also adds a short instruction to the system prompt (use the tool, never ask for the value in the chat, never read it back), and it holds back any message you send that looks like a key (Anthropic, OpenAI/OpenRouter, AWS, GitHub, Stripe, Firecrawl, Supabase, Slack, Google), with a notice instead.

## Install

In a Claude Code session:

```
/plugin install secret-input-card --marketplace novantir/claude-plugins
```

Answer `y` to add the marketplace, then pick a scope: **user** (every project on this computer), **project** (everyone on the repository) or **local** (only you, only this repository).

## Security model

- The value lives only in the plugin's memory while the card is open, and is wiped once written. It is never stored in the plugin's state, the tool result, the message to Claude, toasts or logs.
- Error messages from the destination have the value stripped before they are shown.
- The card's field draws dots; the plugin API has no native password field, so a pasted value can flash on screen for an instant before it is masked. Paste the whole key at once: editing in the middle of the dots is not supported.
- Only what Claude can reach is protected: once a key is in a `.env` file, any command that reads that file can see it. The instruction tells Claude not to, but a plugin cannot enforce it.

## Limits

- `keychain` is macOS only; `env` works anywhere git does.
- The mobile app has no input fields yet: the card asks you to open the session on your computer.
- Built on the Claude Code plugin API (`claude-code` hooks), which is in early access and may change between releases.

## Development

```
claude plugin validate plugins/secret-input-card
claude plugin test plugins/secret-input-card
```

## License

MIT, see [LICENSE](../../LICENSE).
