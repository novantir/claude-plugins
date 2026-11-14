# AGENTS.md — {{Tool name}}

{{One sentence: what the tool does and which products use it.}}

This is the repository's only instructions file. It applies together with Rafael's global rules (`~/.claude/CLAUDE.md`); where they differ, this one prevails.

## 1. What it is

- **Does:** {{input → output, in 2 or 3 lines}}
- **Used by:** {{products or flows that depend on it}}
- **Rule of the `tools/` folder:** only code lives here. The piece produced (video, report, collected data) belongs to the product that asked for it and is kept there, never here.

## 2. Stack

{{Language, runtime and dependencies pinned in {{lock file}}. To be decided, if it has not been yet.}}

## 3. How to run

{{Exact command, with an example input and the expected output. Say what needs to be installed and what costs money (paid API): cost only with Rafael's OK, shown first.}}

## 4. Conventions

- Docs and commits in Portuguese; code and names in English. Small commits, `tipo: descrição`.
- Every function that calls a paid service shows the estimated cost first and accepts a dry mode (`--dry-run`).
- No secret in the repository; keys through environment variables, asked for through the `secret-input-card` plugin.
- A change that alters the tool's output comes with a new example in `exemplos/` and an updated `CHANGELOG.md`.

## 5. Critical rules

- Never publish, send or post anything on its own: the tool produces, Rafael publishes.
- A piece with an AI voice, avatar or image says so in its description, always.
- {{Other rules}}

## 6. Workflow

- A PR for everything that changes behavior; a stop before the merge (**Full Stop**, `full-stop-send` plugin).

## 7. Reminders

{{Pitfalls of the APIs and formats. Start empty.}}
