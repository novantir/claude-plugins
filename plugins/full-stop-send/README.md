# Full Stop / Full Send

A Claude Code skill that takes an issue to a merge-ready pull request: branch, small commits, a PR that lists the proof, green CI, and an independent review by a separate reviewer (a subagent that sees only the diff). Written in Portuguese, for Novantir's repositories.

- **Full Stop**, the default, stops at the merge-ready PR and asks the owner.
- **Full Send** merges on its own, but only for the change class the repository allows in writing (for example, only `.md` files under `docs/`), and only with the full gate: green CI, a clean review that cites the head commit, and no secrets in the diff. The merge is pinned to that commit with `gh pr merge --squash --match-head-commit`.

## Per-repository settings

The skill first reads the repository's own settings from `docs/processo/full-stop-send.md`, or from a "Full Stop / Full Send" section of `AGENTS.md` or `CLAUDE.md`. They set:

- the issue tracker and ID format;
- the required CI checks;
- the proof matrix;
- the change class allowed for Full Send.

Without them, only Full Stop applies.

## Install

```
/plugin install full-stop-send --marketplace novantir/claude-plugins
```

## License

MIT
