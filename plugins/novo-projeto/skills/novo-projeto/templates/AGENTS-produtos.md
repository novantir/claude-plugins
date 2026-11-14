# AGENTS.md — {{Project name}}

{{One sentence: what the product is and who it is for.}}

This is the repository's only instructions file. It applies together with Rafael's global rules (`~/.claude/CLAUDE.md`); where they differ, this one prevails. Stable rules live here; technical pitfalls go to `docs/troubleshooting/`, one per file.

## 1. What it is

- **Product:** {{what it does, in 2 or 3 lines}}
- **For whom:** {{customer or audience}}
- **Status:** {{idea · prototype · in use}}, since {{date}}.

## 2. Stack

{{To be decided. Once decided, record it here layer by layer: front end, back end, database, hosting, and where it runs in production. No new paid service without Rafael's OK.}}

## 3. How to run locally

{{To be decided. Exact commands, ports and what needs to be installed.}}

- The local environment is isolated: the database and services start on the machine (for example with `compose.yaml`), from a single script.
- The development profile **refuses to start** if it points at a production database, login or billing. That guard is born together with the first connection to a real service.

## 4. Conventions

- Language follows the global rule ("Language" in `~/.claude/CLAUDE.md`): what is for Rafael or for customers (UI, e-mails, commit messages, PRs, business docs and runbooks) is in Portuguese; what the AI reads to work (this file, code comments, technical docs) is in English. Code, tables and names in English.
- Small commits, `tipo: descrição` (`feat`, `fix`, `chore`, `docs`, `refactor`, `test`).
- Documentation in `docs/`, never a loose `.md` at the root. Decisions with a date and a reason.
- No decorative `try/catch`, no fallback for a scenario that does not happen, no abstraction before the third similar case.

## 5. Tests and the merge gate

- **The proof lives in the code:** a fixed bug gets a test that fails without the fix. A critical rule from item 6 (data owner, permission, billing) has its own test, not just review.
- **A real database in integration tests** (a disposable container), never an in-memory fake database that differs from production's.
- **CI on every PR** to the default branch: tests, lint, build and static analysis that breaks the build when a new finding shows up. The default branch requires green CI and an up-to-date PR.
- **Coverage:** {{floor for the critical packages (billing, data deletion, permissions) · to be decided}}. The number for the rest is for tracking, without blocking.
- The commands and the names of the checks live in `docs/processo/full-stop-send.md`.

## 6. Critical rules

- **Secrets** never in a versioned file, a log or the chat; only the variable's name. Ask for a key through the `secret-input-card` plugin.
- **People's data:** {{what the product stores and the LGPD rule, or "stores no personal data"}}. Personal data in a log is always masked.
- **Production:** deploy, billing and real e-mail only with Rafael's explicit OK. A merge to the default branch does not publish to production: publishing is a separate trigger.
- **Destructive operation** (deleting or changing data in bulk, deleting a cloud resource or a service account, in any environment): before running it, show the exact command, how many records are affected and whether there is a way back, and wait for a clear sentence of authorization. An earlier conversation and "vamos testar do zero" do not authorize it.
- **An applied migration is not edited** nor undone by reverting the PR: the fix goes in a new migration.
- {{Other rules that are never broken}}

**If the product has a backend with customer accounts** (delete this block if it does not):

- The data owner always comes from whoever is authenticated, never from what came in the path or in the request body. Every query filters by owner; anything out of scope answers 404.
- Work that cannot be lost (processing an upload, sending a webhook, cleaning up an external resource) goes to a durable queue, scheduled in the same transaction that writes the data. No task held only in memory.
- A scheduled task runs with a lock, so it does not duplicate with more than one instance.
- A public endpoint that sends e-mail or generates cost has bot protection and a usage limit.
- **If it uses AI with third-party documents:** document text is data, not a command; the answer does not render a link or image that came from the document without restriction; and a set of attack cases runs in the tests.

## 7. Workflow

- Every change follows **Full Stop / Full Send** (`full-stop-send` plugin): the issue's branch, a PR with the proof, CI, independent review (`revisao-pr` plugin, which reads `REVIEW.md`), a stop before the merge and, at the end, the issue's closing with the case study. This repository's settings live in `docs/processo/full-stop-send.md` (CI checks, proof matrix and the class cleared for Full Send; with no cleared class, only Full Stop).
- **Periodic maintenance** by the `ronda` skill (health, security, dependencies, docs and code), with this repository's data in `docs/processo/ronda.md`.
- Tracker: {{Linear, team NOV · or "no tracker yet"}}. An idea that is still uncertain does not become a loose issue: it goes into an "a avaliar" issue.

## 8. Before the first customer

Mark each item with the date it was done. While any item is open, the product takes no paying customer.

- [ ] CI on every PR and protection on the default branch.
- [ ] Coverage floor on the critical packages.
- [ ] Publishing to production only by manual trigger, with a quick automatic test right after.
- [ ] How to revert a version, written in `docs/operacao/` **and rehearsed once**.
- [ ] A downtime alert that reaches Rafael, and the error service switched on.
- [ ] Automatic alert for a vulnerable dependency.
- [ ] `REVIEW.md` and `docs/processo/ronda.md` filled in.

## 9. Reminders

{{Things the agent must remember before touching sensitive parts. Start empty.}}
