# Novantir Claude Code plugins

A marketplace of Claude Code plugins by Novantir.

| Plugin | What it does |
| --- | --- |
| [secret-input-card](plugins/secret-input-card) | Use any API key, token or password without exposing it in the chat: you paste it into a protected card, it is saved to a gitignored `.env` file or the macOS Keychain, and Claude gets only the variable name, so the programs it runs can use the secret. |
| [roteiro-interativo](plugins/roteiro-interativo) | Turns long manual step-by-step instructions into a pane beside the chat, one step per card, with "it worked" and "I'm stuck" buttons and gates only Claude opens; Claude is told when you get stuck or finish a milestone. |

## Install a plugin

In a Claude Code session:

```
/plugin install <plugin> --marketplace novantir/claude-plugins
```

Answer `y` to add the marketplace, then pick a scope (user, project or local).

## Layout

```
.claude-plugin/marketplace.json   lists the plugins
plugins/<plugin>/                 one folder per plugin
```

Each plugin is checked with `claude plugin validate plugins/<plugin>` and `claude plugin test plugins/<plugin>`.

## License

MIT, see [LICENSE](LICENSE).
