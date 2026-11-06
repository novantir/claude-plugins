# Privacy policy: secret-input-card

Last updated: 2026-11-06

secret-input-card is a Claude Code plugin published by Novantir. It runs entirely on your computer, inside Claude Code.

## What it collects

Nothing. The plugin has no server, no analytics and no telemetry, and it makes no network requests. Novantir receives no data from it.

## What it handles, and where it goes

- **The secret you type into the card** is kept only in the plugin's memory until it is written, then wiped. It is written only to the destination shown on the card: a `.env` file on your computer (left readable only by your user) or an item in your macOS Keychain. It is never sent to Claude, to Novantir or to anyone else.
- **What Claude receives** after each card is one message in your own session: the card's title, the number of characters, the variable name and the destination. Never the value.
- **Messages you type** are checked on your computer against common key formats. A message that looks like a key is held back and not sent to Claude; nothing is stored or sent elsewhere.
- **Session state** holds each card's title, reason, destination, variable name, character count and status, on your computer, for the Claude Code session. Never the value.

What happens to your conversation with Claude itself is covered by Anthropic's terms and privacy policy, not by this plugin.

## How long it keeps data

The plugin keeps the value only until it is written. What it writes to your `.env` file or Keychain stays there until you remove it.

## Children

The plugin is a developer tool and is not intended for people under 18.

## Contact

Questions or problems: open an issue at https://github.com/novantir/claude-plugins/issues or write to comercial@novantir.com.br.
