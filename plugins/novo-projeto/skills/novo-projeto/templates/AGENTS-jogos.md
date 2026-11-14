# AGENTS.md — {{Game name}}

{{One sentence: what game it is, for which platform.}}

This is the repository's only instructions file. It applies together with Rafael's global rules (`~/.claude/CLAUDE.md`); where they differ, this one prevails. The current state and the next action live in `CONTEXTO.md`, updated at the end of each session.

## 1. What it is

- **Game:** {{genre, core idea, in 2 or 3 lines}}
- **Platform:** {{Windows · macOS · web · mobile}}
- **Status:** {{prototype · first playable level · polishing}}, since {{date}}.

## 2. Engine and tools

- **Engine:** {{Godot 4.x · Unreal 5.x · to be decided}}, version pinned in {{file}}.
- **Development machine:** {{Alienware (Windows) · MacBook Pro}}. Distribution builds come from {{machine}}.
- **Large assets** (`.png`, `.wav`, `.blend`, binary scenes) go through Git LFS; `.gitattributes` says which.

## 3. How to run and test

{{Command or step to open it in the editor, run the main scene and run the automatic check, if there is one.}}

## 4. Conventions

- Docs and commit messages in Portuguese; code, node names, scenes and assets in English.
- Small commits, `tipo: descrição`. A binary scene or asset: one per commit, with a description of what changed, because the diff does not show it.
- Never edit a binary file (`.uasset`, binary `.tscn`, `.blend`) as text.
- Design decisions in `docs/design/`, with a date.

## 5. Critical rules

- Service keys (AI, voice, stores) never in the project nor in the final package; only the variable's name.
- No third-party asset without a license recorded in `ASSETS.md` (name, author, URL, license, where it is used, whether it is AI-generated).
- Publishing to the store, the jam or anywhere: only Rafael.

## 6. Workflow

- A code change follows **Full Stop / Full Send** (`full-stop-send` plugin) when the repository has `docs/processo/full-stop-send.md`; without it, only Full Stop: a PR and a stop before the merge.
- End of session: update `CONTEXTO.md` (what got done, what got stuck, the next action).

## 7. Reminders

{{Pitfalls of the engine and the machine. Start empty.}}
