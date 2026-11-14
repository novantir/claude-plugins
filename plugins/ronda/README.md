# ronda

Skill `ronda`: the periodic upkeep of a repository, in one skill with five modes. Written in Portuguese, for Novantir's repositories.

| Mode | Looks at | May edit |
| --- | --- | --- |
| `saude` | production up, CI on the default branch, new errors | only its own snapshot in `.claude/ronda/` |
| `seguranca` | the repository against the criteria in `REVIEW.md` | nothing |
| `deps` | CVEs, outdated packages, AI models, CI runtime | manifests, only in a live session and with the owner's OK |
| `docs` | coherence between `AGENTS.md`, `README.md` and the code | `README.md` and generated indexes; `AGENTS.md` only in a live session |
| `codigo` | dead code, duplication, missing tests | one small cleanup per area; nothing in a scheduled run |

Every mode returns the same report shape (🔴 / 🟡 / 🟢, with where, what, why and the suggested fix), skips a source it cannot reach instead of aborting, and never touches git: anything left in the working tree goes into a branch and a PR through the [full-stop-send](../full-stop-send) plugin. Reviewing a pull request is the job of [revisao-pr](../revisao-pr).

## Scheduled runs

A scheduled run (a routine, with nobody in the session) asks no questions and may name several modes, which run one after another. It usually starts from a fresh copy of the repository that is thrown away at the end, so:

- `codigo` only maps and reports; cleanups happen in a live session.
- `saude` compares errors over a 7-day window when there is no previous snapshot.
- When the settings name a routine issue, the run first reads the last four weeks of reports there, so a finding already reported comes back as a single line and a finding dismissed in a reply stays out, and then posts the whole report there as one comment. That comment is the only thing the skill writes outside the repository.

## Per-repository settings

The skill reads `docs/processo/ronda.md` from the repository: URLs to probe, the error tracker, extra security searches, the outdated/audit/proof commands per layer, the files that hold AI model names and prices, the risk areas that never get a cleanup, and where the routine runs and posts. A template lives in `skills/ronda/templates/ronda.md`. Without the file the skill works from what it can discover and says so in the report.

## Install

```
/plugin install ronda --marketplace novantir/claude-plugins
```

## License

MIT
