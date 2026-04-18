# Reusable session prompts

Copy-paste these into a fresh Claude Code session to kick off specific work. They assume the session can read the repo.

## 1. Fresh onboarding — any task

```
Read `CLAUDE.md`, then the most recent entry in `docs/SESSION-LOG.md`,
then `docs/PROJECT.md`. After that, work on: <task>.

Don't summarize what you read back to me — just do the work. Commit
atomically. When you're done, append a session-log entry and push.
```

## 2. Work the queue — unassigned

```
Read `CLAUDE.md`, `docs/PROJECT.md`, and the top open GitHub issue
(`gh issue list --state open --limit 1`). Pick up whichever comes
first. Proceed without asking.
```

## 3. Specific feature

```
Read `CLAUDE.md` and `docs/PROJECT.md`. Implement the "<feature name
from PROJECT.md § Next up>" item. Write the ADR in the same commit
if this locks in a durable pattern. Update SESSION-LOG when done.
```

## 4. Bug fix

```
Read `CLAUDE.md`. There's a bug: <description>. Write a failing
regression test first, then fix. One commit. No opportunistic refactoring.
```

## 5. Close a stub

```
Read `CLAUDE.md` § "What's green vs what's stubbed". Close the
"<stub name>" bullet. Remove the callout from CLAUDE.md + PROJECT.md
in the same commit.
```

## 6. Mid-session handoff (context filling up)

> Use this at the *end* of the current session to set up the next one.

```
I'm near context limit. Append a SESSION-LOG entry summarizing what
you shipped this session (commits, tests, stubs removed). Also add
a `HANDOFF.md` note pointing at exactly where to pick up. Commit +
push. The next session will start fresh.
```

## 7. Design review

```
Read `CLAUDE.md`. Start the dev server (`pnpm dev`), screenshot every
page at desktop (1440px), tablet (768), and mobile (375). Produce a
written review with three priorities: what's broken, what's inconsistent,
what's a polish win. Don't change any code yet.
```

## 8. Release

```
Read `CLAUDE.md`. Cut a release:
1. Update version in package.json
2. Write the changelog entry from `git log` since last tag
3. Tag + sign the commit
4. Push the tag
5. Create the GitHub release from the tag
Append a SESSION-LOG entry with the version and any notes.
```
