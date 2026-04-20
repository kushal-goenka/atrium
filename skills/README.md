# Atrium operations skills

Skills that turn Atrium's own ops into interactive Q&A flows you can run inside Claude Code (or any SKILL.md-aware agent).

Instead of reading [`docs/AGENT-SETUP.md`](../docs/AGENT-SETUP.md) top-to-bottom and running commands by hand, install these skills in your agent and just say *"set up Atrium for my org"* — the skill walks you through inputs, validates them, and executes.

## What's here

| Skill | Trigger | What it does |
|---|---|---|
| [`atrium-setup-org`](atrium-setup-org/SKILL.md) | "set up Atrium for my org", "provision Atrium" | Interactive new-deployment Q&A: org name, hosting target, auth, DB, LLM provider, air-gap, initial sources. Executes per step with verification. |
| [`atrium-setup-dev`](atrium-setup-dev/SKILL.md) | "get Atrium running locally" | Zero-prompt local dev bootstrap: clone, install, seed, start. |
| [`atrium-add-provider`](atrium-add-provider/SKILL.md) | "add an LLM provider to Atrium" | Pick provider, collect key (or skip for Ollama), test, seed to DB. |
| [`atrium-diagnose`](atrium-diagnose/SKILL.md) | "check if Atrium is healthy", "Atrium is broken" | Runs `/api/health`, verifies DB, checks providers, inspects recent sync errors, produces a diagnostic report. |

## How to install

Two paths.

### Path 1: point Claude Code at this repo as a marketplace (recommended)

This repo publishes itself as an Atrium-compatible marketplace via [`.claude-plugin/marketplace.json`](../.claude-plugin/marketplace.json). From inside Claude Code:

```
/plugin marketplace add https://github.com/kushal-goenka/atrium
/plugin install atrium-ops
```

Now the four skills above load into every Claude Code session automatically. Any skill-aware client (Cursor, Continue, etc.) can consume the same marketplace.

### Path 2: copy the SKILL.md files you want

Plain markdown files. Drop them into your project's `.claude/skills/` directory (or the equivalent path your agent looks in). No runtime dependency on Atrium itself — the skill's prompts and command instructions are self-contained.

## How each skill is structured

Each `SKILL.md` starts with YAML frontmatter that tells the agent when to load the skill, then a markdown body that defines the Q&A flow:

```markdown
---
name: atrium-setup-org
description: Interactively provision an Atrium deployment for an organization.
trigger: when the user asks to set up Atrium for their org, provision Atrium, or deploy Atrium
---

# body
## Phase 1 — gather inputs
…
## Phase 2 — execute
…
## Phase 3 — verify
…
```

The body is written in **imperative instructions to the agent**, not user-facing prose. A skill isn't a tutorial for humans — it's a script for the agent to run, with the human answering questions along the way.

## Contributing a skill

If you write a skill worth sharing, PR it to this directory. Requirements:

1. Frontmatter has `name`, `description`, and `trigger` fields.
2. Body has a clear Phase 1 (gather) / Phase 2 (execute) / Phase 3 (verify) structure.
3. Every destructive command (db push, deploy, secret write) has a pre-flight confirm.
4. Every phase has an explicit success signal so the agent knows when to move on.
5. Failures surface the exact error, not a summary. No "something went wrong".

See [`docs/AGENT-SETUP.md`](../docs/AGENT-SETUP.md) for the non-interactive version of the same flows; skills are the Q&A equivalent.
