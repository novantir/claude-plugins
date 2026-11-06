# secret-input-card

A Claude Code plugin that lets Claude **use an API key, token or password without it ever appearing in the conversation**. When Claude needs one, it opens a protected card inside the chat. You paste it there and press **Submit**; the plugin writes it straight to a gitignored `.env` file or the macOS Keychain. Claude gets a confirmation and the variable name, never the value, so the secret never ends up in a message, a script or a file by mistake.

## What it's for

Any secret Claude needs for your work: API keys for any provider (OpenAI, Anthropic, Stripe, Google Maps, Twilio, SendGrid…), personal access tokens (GitHub, GitLab, npm), database URLs and passwords, webhook signing secrets, cloud credentials (AWS, Cloudflare, Vercel…), and so on. Once a secret is saved, the programs Claude runs can use it by name, for example to:

- **Run your code**: start the app, a script or the tests with the `.env` file loaded, so the code reads `STRIPE_SECRET_KEY`, `DATABASE_URL` or any other variable from its environment.
- **Call an API**: make a request to any service's API with the token in a header, without the token appearing in the command Claude shows you.
- **Use a CLI**: hand the saved key to a tool that needs it, such as `gh`, `npm publish`, `psql` or a cloud provider's CLI.
- **Configure a service**: set a variable on Railway, Vercel, Fly.io or Render, a secret for Supabase Edge Functions (`supabase secrets set --env-file .env.local`) or for GitHub Actions, without the key going through the chat or into the code.

The card only stores the secret. Configuring a service is a separate step: it needs access to your account there, and Claude asks for your go-ahead as it would for any other change to an outside service.

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

## What it runs, reads, writes and sends

Everything happens on your computer. The plugin makes **no network requests** and sends nothing to any service. The only thing it sends anywhere is a short message to Claude in the same session, described below, which never holds the secret.

### The hooks and what each one changes

- **`session.start`**: registers one tool, `request_secret`, which the plugin itself answers (it is the tool's implementation, not a stand-in for another tool).
- **`tool.call`**: handles calls to `request_secret` only; every other tool call passes through unchanged. It checks the request (see below) and answers at once with `{"card_opened": true, "destination", "name", "where", "message"}`, or refuses the call with the reason.
- **`prompt.compose`**: adds one section to the system prompt and changes nothing else. It tells Claude to ask for secrets with the card instead of in the chat, to use a saved secret by its variable name without printing it, and to ask you before sending it to an outside service. The full text is `INSTRUCTION` in [`hooks/register.tsx`](hooks/register.tsx).
- **`prompt.submit`**: checks each message you type against the key patterns listed above, on your computer. A message that matches is not sent to Claude, and a toast tells you why; every other message passes through unchanged.
- **`ui.render`** on the tool's row (`ToolUse`): draws the card. On a folded group of tool calls (`ToolGroup`) that holds a `request_secret` call: unfolds the group so the card shows.

### The messages it submits to Claude

After each card the plugin submits one message to Claude in the same session, built only from the card's title, the character count, the variable name and the destination:

- `[secret-input-card] <title>: saved (<N> characters). <NAME> added in <file> (mode 600). The value never went through the chat; you can go on.` (`replaced` instead of `added` when the variable already existed)
- `[secret-input-card] <title>: saved (<N> characters). saved in the macOS Keychain (service <service>, account <account>). The value never went through the chat; you can go on.`
- `[secret-input-card] <title>: the user cancelled the request; nothing was saved.`

### The programs it runs, and why

- `git rev-parse --is-inside-work-tree`, `git ls-files --error-unmatch -- <file>` and `git check-ignore -q -- <file>`, in the `.env` file's folder: to refuse a `.env` file that git would commit.
- `chmod 600 <file>`: so only your user can read the `.env` file.
- `/usr/bin/security -i`, with `add-generic-password -U -a <account> -s <service> -w <value>` on its standard input (so the value never appears in a command line or in `ps`): to save a Keychain item.
- `/usr/bin/security find-generic-password -a <account> -s <service>`, without `-w`: to confirm the item exists, without reading its value.

`<file>`, `<account>` and `<service>` are the ones shown on the card before you press Submit.

### What it reads and writes

- **Writes**: only the `.env` file shown on the card, and only the one `NAME=value` line (appended, or replacing the line that already sets that variable). This file is meant to be read by your programs (shells, dotenv libraries, service CLIs); that is the point of saving the secret there. The plugin refuses a file git would commit, a file already tracked, and committed templates such as `.env.example`.
- **Reads**: the same `.env` file, to keep its other lines as they are when it adds or replaces the line. Those lines may hold other secrets; they are written back unchanged and never sent anywhere. It never reads a Keychain value.
- **Keeps in session state**: each card's title, reason, destination, variable name, character count and status. Never the value.

### Why there is no `userConfig` option for the secret

The secret is typed by you into the card, at the moment Claude needs it, and saved to your own `.env` file or Keychain. The plugin never takes a credential already on your machine and sends it anywhere.

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

## Privacy

The plugin collects nothing and makes no network requests; see [PRIVACY.md](PRIVACY.md).
