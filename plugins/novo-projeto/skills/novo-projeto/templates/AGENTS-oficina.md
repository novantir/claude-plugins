# AGENTS.md — {{Name}}

{{One sentence: which part of the programming process this repository takes care of.}}

This is the repository's only instructions file. It applies together with Rafael's global rules (`~/.claude/CLAUDE.md`); where they differ, this one prevails.

## 1. What it is

- **Takes care of:** {{the piece of the process: configuration, plugins, monitoring, factory, server…}}
- **Neighbors in `oficina/`:** `claude-config` (global rules), `claude-plugins` (skills and plugins), `cockpit` (monitor), `flux-capacitor` (app factory), `servidor-vostro` (lab). Do not duplicate what already lives in one of them; point to it.

## 2. Stack

{{Language and dependencies. In the oficina, prefer what is already on the machine (the system Python, zsh) and no external dependency without a written reason.}}

## 3. How to run and validate

{{Commands to run, test and validate, in the order a PR has to pass them.}}

## 4. Conventions

- Docs, UI and commits in Portuguese; identifiers in English. Small commits, `tipo: descrição`.
- Runs the same on both machines with Claude (MacBook Pro and Alienware) and, when it applies, on the Linux server.
- Every rule change has a date and a reason in the file itself.

## 5. Critical rules

- Secrets only through an environment variable or the Keychain; never in a file, a log or a command argument.
- Read-only inside the projects this tool watches; it never writes to them.
- What reaches the other machines (publish, installer) only goes out with Rafael's OK.

## 6. Workflow

- A PR and a stop before the merge (**Full Stop**, `full-stop-send` plugin).

## 7. Reminders

{{Start empty.}}
