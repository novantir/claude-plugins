# secret-input-card

A Claude Code plugin that lets Claude **use an API key without the key ever appearing in the conversation**. When Claude needs a key, it opens a protected card inside the chat. You paste the key there and press **Submit**; the plugin writes it straight to a gitignored `.env` file or the macOS Keychain. Claude gets a confirmation and the variable name, never the value, so the key never ends up in a message, a script or a file by mistake.

## What it's for

Once the key is saved, the programs Claude runs can use it by name:

- **Call an API**: Claude runs your script with the `.env` file loaded, and the script reads `OPENAI_API_KEY` from its environment to call the OpenAI API.
- **Configure a service**: Claude passes the saved key to a service's own CLI, for example to set a variable on Railway or a secret for Supabase Edge Functions (`supabase secrets set --env-file .env.local`), without the key going through the chat or into the code.

The card only stores the key. Configuring a service is a separate step: it needs access to your account there, and Claude asks for your go-ahead as it would for any other change to an outside service.

## How it works

1. Claude calls the `request_secret` tool with a destination, a name and a one-line reason. The tool answers at once ("card opened") and Claude ends its turn.
2. The tool's row in the chat becomes a card: a title, the reason, where the key goes, a field that shows only dots, and **Cancel** / **Submit**.
3. On **Submit**, the plugin writes the key:
   - **`env`**: a variable in a `.env` file (default `.env.local`). Inside a git repository the file must be ignored by git and not tracked (outside one there is nothing to commit it to, so it is written as is); committed templates such as `.env.example` are refused. The line is replaced if the variable exists, appended otherwise, and the file is left at mode `600`. A value with characters a shell would read specially is quoted so that both `. .env.local` and dotenv libraries read it back unchanged.
   - **`keychain`**: an item in the macOS Keychain (service and account), written through `security -i` so the value never appears in a command line.
4. The plugin sends Claude a message such as `[secret-input-card] OpenRouter API key: saved (73 characters). OPENROUTER_API_KEY added in .env.local (mode 600)…`, which starts a new turn. Cancelling sends `…nothing was saved`. A card left unanswered for an hour expires.

It also adds a short instruction to the system prompt: use the tool instead of asking for the key in the chat; use the saved key by name (load the `.env` file into the command that needs it, or read the Keychain item inside that command) without ever printing it; and ask before sending it to an outside service, and it holds back any message you send that looks like a key (Anthropic, OpenAI/OpenRouter, AWS, GitHub, Stripe, Firecrawl, Supabase, Slack, Google), with a notice instead.

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

## What it runs and touches

Everything happens on your computer. The plugin makes no network requests and sends nothing to any service.

- **Commands**: for `env`, in the `.env` file's folder, `git rev-parse --is-inside-work-tree`, `git ls-files --error-unmatch -- <file>` and `git check-ignore -q -- <file>` (is the file ignored and untracked?), then `chmod 600 <file>`. For `keychain`, `/usr/bin/security -i` with an `add-generic-password` command on its standard input, then `/usr/bin/security find-generic-password -a <account> -s <service>` to confirm the item exists (without `-w`, so the password is not printed).
- **Files**: it reads and writes only the `.env` file named on the card.
- **Conversation**: it adds one instruction to the system prompt; it checks each message you send against the key patterns above, on your computer, and holds back a match; and after each card it sends Claude one message with the outcome, the character count, the variable name and the destination, never the value.
- **Session state**: each card's title, reason, destination, variable name, character count and status. Never the value.

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

MIT, see [LICENSE](LICENSE).
