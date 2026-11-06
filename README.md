# Novantir Claude Code plugins

A marketplace of Claude Code plugins by Novantir.

| Plugin | What it does |
| --- | --- |
| [secret-input-card](plugins/secret-input-card) | Claude asks for an API key in a card inside the chat; you paste it there and it is written to a gitignored `.env` file or the macOS Keychain without ever reaching the model. |

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
