# novo-projeto

Skill `novo-projeto`: starts a new Novantir project the way the existing ones are laid out. Written in Portuguese.

- Asks only what the request did not say: name, category (`produtos`, `jogos`, `tools` or `oficina`), one sentence, stack if decided, GitHub visibility.
- Creates `~/projects/<categoria>/<nome>` with `git init`, an `AGENTS.md` from the category template (`skills/novo-projeto/templates/AGENTS-<categoria>.md`), a `README.md` and a `.gitignore` (base plus the stack block). A product also gets the `docs/` skeleton: `docs/README.md`, `docs/troubleshooting/` and, when the `full-stop-send` and `ronda` plugins are installed, their per-repository settings files in `docs/processo/`. With `revisao-pr` installed, any project also gets a `REVIEW.md` at the root.
- Leaves the GitHub repository and the cockpit registration ready, but runs them only with the owner's OK.

The templates are where the shared knowledge accumulates: a rule that proves useful across projects goes into the template, and the next projects are born with it.

## Install

```
/plugin install novo-projeto --marketplace novantir/claude-plugins
```

## License

MIT
