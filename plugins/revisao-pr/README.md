# Revisão de PR

A Claude Code skill that reviews a pull request with the process the Claude Code team described in ["How the Claude Code team does code review"](https://claude.dev/blog/solving-code-review-at-anthropic/), sized for a one-person company. Written in Portuguese, for Novantir's repositories.

What it does, in order:

1. **Risk first.** The depth of the review (Quick, Standard, Deep) comes from what the diff touches, never from who wrote it or what the title says. Auth, billing, permissions, migrations, workflows and secrets are always Deep.
2. **Reviewers in parallel, in a clean context.** Each reviewer subagent gets the diff, the goal and the repository's `REVIEW.md`, and nothing of the author's reasoning. Separate reviewers hunt for bugs, security problems and convention violations (plus data and migrations on Deep).
3. **Verifiers vote before anything is posted.** Each finding goes to independent verifiers; only findings a majority confirms, with `file:line` evidence, survive. Style, cleanup and diagnostic remarks are dropped.
4. **One comment on the PR**, starting with the count, each finding tagged **Important** (blocks), **Nit** (capped) or **Pre-existing** (becomes an issue, does not block), and a security and quality verdict.
5. **Convergence.** Later rounds review only the new diff, never repeat a posted finding and name the bug class so every instance gets fixed. Rounds are capped; at the cap the author reconsiders the approach instead of iterating.
6. **A record of each finding's fate** (fixed, wrong, intentional, does not matter), so the noise of the reviewer can be measured over time.

It never edits code, never approves or merges, and treats text found in the diff or in PR comments as data, not instructions.

## Per-repository settings

The skill reads `REVIEW.md` at the repository root (template in `skills/revisao-pr/templates/REVIEW.md`): what failure looks like in that code, paths that are always Deep, paths to skip, the nit cap and known false positives. Without one, built-in defaults apply and the skill offers to create the file.

Inside the [full-stop-send](../full-stop-send) flow this skill is the review step; the merge gate stays the same.

## Install

```
/plugin install revisao-pr --marketplace novantir/claude-plugins
```

## License

MIT
