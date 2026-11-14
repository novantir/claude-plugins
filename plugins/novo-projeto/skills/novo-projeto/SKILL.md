---
name: novo-projeto
description: Use when Rafael wants to start a new project, in any category ("cria um projeto novo", "começa um produto chamado X", "novo jogo", "nova tool", "cria o repo do Y", "inicia o projeto"). The skill asks what is missing, creates the folder in the right category of ~/projects (produtos, jogos, tools or oficina), starts git, writes the AGENTS.md from the category template, the README, the .gitignore and, for products, the docs/ skeleton with the process settings, and leaves ready the steps that depend on Rafael's OK (GitHub repository and cockpit registration). Do not use it to move or rename a project that already exists, nor to create subfolders inside a repository.
---

# New project

Creates one of Rafael's projects the way the others already are: in the category folder, with an `AGENTS.md` in the standard format, a `README.md`, a `.gitignore` and git started. A product is also born with `docs/` and the process settings (Full Stop, review and ronda). The knowledge that applies to every project of a category lives in this skill's templates, in `templates/`: when a new rule proves useful in several projects, it goes into the template, and the next projects are born with it.

## 1. Ask only what is missing

Before creating anything, have these answers (ask at once whatever the request did not say):

| Item | Rule |
|---|---|
| **Name** | lowercase, no accents, words separated by hyphens (`nfse-rapida`). It becomes the name of the folder and of the repository. |
| **Category** | `produtos` (what is sold or published: software, channel, site), `jogos`, `tools` (a tool reused across products; code only) or `oficina` (how the programming gets done: tools of the process itself). In doubt between tools and oficina: tools serves the products, oficina serves Rafael while programming. |
| **One sentence** | what the project is, for the second line of the `AGENTS.md` and the README. Write it in English there, like the rest of both files (global "Language" rule). |
| **Stack** | only if already decided. With no decision, the `AGENTS.md` keeps the section open; do not invent. |
| **GitHub repository** | private by default, in the `novantir` organization. Public only if Rafael says so. |

Final path: `~/projects/<categoria>/<nome>`. If the folder already exists, stop and say so: this skill overwrites nothing.

## 2. Create the folder and the files

1. `mkdir -p ~/projects/<categoria>/<nome> && cd` into it, and `git init -b main`.
2. **`AGENTS.md`:** copy this skill's `templates/AGENTS-<categoria>.md` (the skill folder is at `${CLAUDE_PLUGIN_ROOT}/skills/novo-projeto/templates/`, or next to this file) and fill in the `{{fields}}`. The title is always `# AGENTS.md — <Project name>`, and the next line says what the project is. Do not delete sections of the template, except the block the template itself marks as deletable (with the stack still to be decided, it stays); what has not been decided yet stays marked as "to be decided".
3. **`README.md`:** from `templates/README.md`.
4. **`.gitignore`:** from `templates/gitignore-base` plus the stack's block, if there is one (`gitignore-node`, `gitignore-python`, `gitignore-java`, `gitignore-godot`).
5. **Only in `produtos`, the `docs/` skeleton:**
   - `docs/README.md`, from `templates/docs-README.md`;
   - `docs/troubleshooting/.gitkeep` and `docs/processo/.gitkeep`;
   - `docs/processo/full-stop-send.md`, from the template of the `full-stop-send` skill, if the plugin is installed: ask it for the file, as in the `REVIEW.md` step;
   - `docs/processo/ronda.md`, from the template of the `ronda` skill, the same way.

   Fill in only what can already be known; the rest stays `{{a decidir}}`. A missing plugin: say which one at the end, instead of inventing the file.
6. **`REVIEW.md`:** if the `revisao-pr` skill is installed, ask it ("cria o REVIEW.md") and fill in only what can already be known (the stack's sensitive paths, the nit ceiling); the rest stays `{{a decidir}}`. It is the file the PR reviewer reads to know what counts as a defect in this code.
7. No `CLAUDE.md` in the repository: Claude Code reads the `AGENTS.md` directly (global rule).
8. First commit, in Portuguese: `chore: nasce o projeto <nome> (<categoria>)`.

## 3. What depends on Rafael's OK

Leave the commands ready and **ask for the OK before running** each one:

- **GitHub repository:** `gh repo create novantir/<nome> --private --source=. --remote=origin --push`.
- **Cockpit:** add the project's entry to `~/projects/oficina/cockpit/config/cockpit.json`, in the MacBook Pro's `projects` list, at the end of the list (the tests check the order), in the format `{ "id": "<nome>", "label": "<Nome>", "path": "~/projects/<categoria>/<nome>", "github": "novantir/<nome>" }` (without GitHub: `"github": null, "expect_git": false, "expect_remote": false, "files": true`). Then, in the cockpit: `make validate`, `make test`, `make sign`, commit, and the publish (`zsh scripts/publish.sh`) only with Rafael's OK.
- **Linear:** create the project `<Nome>` in the Novantir team, with a summary of the AGENTS.md in Portuguese (Linear is for Rafael) and the repository link, and one issue for each next step already known. Every product has a project in Linear: it is where Rafael follows what was done and what is missing.
- **Lab or production:** not part of this skill. The dev and staging environments on the Vostro are the `publicar-no-lab` skill; production is Rafael's decision.

## 4. When done

Say in one line where the project ended up, what was created and what is still waiting for Rafael's OK. If, while filling in the template, you noticed a rule that was missing from the category template, say that too: the template is where knowledge accumulates, and changing it is a PR in the `claude-plugins` repository.
