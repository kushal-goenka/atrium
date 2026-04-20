---
name: atrium-diagnose
description: Diagnose a running Atrium instance. Probes health, database, providers, recent sync errors, and produces a diagnostic report.
trigger: when the user asks to check if Atrium is healthy, something is broken with Atrium, why isn't Atrium working, or diagnose Atrium
---

# Atrium diagnostic

Walk the operator through a standard diagnostic of their running Atrium instance, producing a report they can paste into an issue or share with their platform team.

Ask for the base URL first: **"What's the Atrium URL?"** (e.g. `https://atrium.acme.corp` or `http://localhost:3000`). Store as `$BASE`.

Then run the checks below in order. Collect results as you go. At the end, produce the summary report.

---

## Check 1 — Health endpoint

```bash
curl -fsS "$BASE/api/health"
```

Expected: 200 OK with `{"status":"ok","checks":{"db":{"status":"ok", …}, …}}`.

Interpretation:

| Observation | Likely cause |
|---|---|
| Connection refused | Service not running or wrong URL |
| 502 / 504 | Service up but failing to respond. Check upstream proxy timeouts. |
| `status: degraded`, `db.status: down` | DB unreachable or migrations not applied |
| 200 OK | Base service healthy; continue |

---

## Check 2 — Marketplace endpoint

```bash
curl -fsS "$BASE/mkt/marketplace.json" | jq '{ name, plugin_count: (.plugins | length) }'
```

Expected: non-empty `plugins` array. A zero-plugin result means:

- Seed didn't run, or
- All plugins are quarantined, or
- Plugin-DB migration happened but repo wasn't populated.

Check the header for `x-atrium-host` — it should match the configured `ATRIUM_PUBLIC_URL`.

---

## Check 3 — Browse catalog

```bash
curl -fsS -o /dev/null -w "%{http_code}" "$BASE/"
```

Expected: 200. If 500, the logs will show a rendering error (usually a Prisma query failure) — ask the operator to tail their app logs and share the stack trace.

---

## Check 4 — Public API

If the operator has a bearer token:

```bash
TOKEN="<their token>"
curl -fsS -H "Authorization: Bearer $TOKEN" "$BASE/api/v1/plugins?provider=claude-code" \
  | jq '{ total, first: (.plugins[0] // null) | {slug, version} }'
```

Expected: `total` ≥ 1. If 401, the token is invalid or revoked; suggest issuing a new one at `/admin/tokens`.

If no token is available, skip to Check 5 — API is intentionally authenticated.

---

## Check 5 — Air-gap posture

From the admin dashboard (requires auth if `admin-password` mode is on):

```bash
# Visual check only — direct the operator to /admin and have them
# read the air-gap banner at the top.
echo "Direct the operator to $BASE/admin and ask: what does the air-gap banner say?"
```

Expected: banner shows `open` (or `allowlist`/`strict` if that was the intent). If ingest isn't working and the mode is `strict`, that's the cause.

---

## Check 6 — LLM providers

Direct the operator to `$BASE/admin/providers`. Ask them to hit **Test** on each configured provider and report back.

Interpret the results:

| Test result | Action |
|---|---|
| ✓ pong / short success | Provider healthy |
| 401 | API key wrong or revoked by upstream; re-issue and update |
| Connection refused on Ollama | Sidecar not running — `docker compose ps`, restart with `--profile ollama up -d` |
| timeout | Network path broken — check egress rules, reverse proxy, DNS |

If **no provider** is configured, that's not a bug but it means AI curation features won't work. Offer to run the `atrium-add-provider` skill.

---

## Check 7 — Recent sync errors

From the admin dashboard's Sources panel, each source row shows its recent sync history. If any source has consecutive errors, note:

- Source `key`
- Last error message (truncated in the panel; the full message is in the `MarketplaceSnapshot.error` DB column)

Most common: SSH key not configured for a private git repo, upstream rate limit hit, or the upstream manifest is malformed.

---

## Check 8 — Audit log recency

Direct the operator to `$BASE/admin` and look at the Audit log panel. The most recent entry's timestamp should be within the expected cadence:

- `ingest sync` entries: every `ATRIUM_INGEST_INTERVAL` seconds (default 3600)
- `install` entries: whenever someone uses the catalog
- `approve/quarantine/block` entries: on admin actions

A stale audit log (no entries in the last N hours) suggests the ingest scheduler isn't running.

---

## Produce the diagnostic report

Format as a single block the operator can paste into an issue or Slack:

```
Atrium diagnostic — <timestamp> — <base-url>

Checks
  1. /api/health                <ok | down | degraded>
  2. /mkt/marketplace.json      <N plugins | empty | error>
  3. Browse catalog             <200 | 5xx>
  4. Public API                 <ok | 401 | skipped>
  5. Air-gap mode               <open | allowlist | strict>
  6. LLM providers              <N configured, M healthy>
  7. Sync errors                <none | list>
  8. Audit log recency          <latest entry timestamp>

Environment
  Hosting target:   <fly | railway | vercel | self-host | unknown>
  DB kind:          <postgres | sqlite>
  Auth mode:        <open | admin-password | sso>
  Atrium version:   <from /api/health>

Recommendations
  - <action 1, if any>
  - <action 2, if any>
```

If every check passes, say so explicitly: "No issues found. Atrium is healthy." Don't manufacture recommendations if there aren't any.

---

## Escalation

If the report shows failures the operator can't resolve with the remediations above, tell them:

1. Copy the diagnostic block
2. Tail the app logs for the last 5 minutes and capture any stack traces
3. File a GitHub issue at https://github.com/kushal-goenka/atrium/issues/new including both

Never attempt to modify the running DB or restart services without the operator's explicit approval.
