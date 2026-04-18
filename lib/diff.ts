/**
 * Minimal plugin-manifest diff.
 *
 * We're deliberately not a general JSON-diff library — the plugin manifest
 * has a known shape, and a field-aware diff surfaces exactly the changes
 * an admin cares about (added commands, version bumps, new hooks).
 *
 * The output is a flat list of entries grouped by section, ready for the
 * fork-diff UI to render without further transformation.
 */

import type { Plugin } from "./types";

export type DiffChange =
  | { kind: "added"; path: string; after: string }
  | { kind: "removed"; path: string; before: string }
  | { kind: "changed"; path: string; before: string; after: string };

/**
 * Compare a snapshotted manifest (e.g. the fork's frozen copy) against a
 * current manifest (e.g. what upstream reports now).
 *
 * Returns an ordered list, largest changes first (changed > added > removed).
 */
export function diffPlugins(before: Plugin, after: Plugin): DiffChange[] {
  const changes: DiffChange[] = [];

  // Scalar fields that matter to admins.
  const scalarFields: (keyof Plugin)[] = [
    "name",
    "description",
    "version",
    "category",
    "license",
    "homepage",
  ];
  for (const f of scalarFields) {
    const b = before[f];
    const a = after[f];
    if (b === a) continue;
    if (b === undefined) {
      changes.push({ kind: "added", path: String(f), after: stringify(a) });
    } else if (a === undefined) {
      changes.push({ kind: "removed", path: String(f), before: stringify(b) });
    } else {
      changes.push({
        kind: "changed",
        path: String(f),
        before: stringify(b),
        after: stringify(a),
      });
    }
  }

  // Author (nested object).
  if (before.author?.name !== after.author?.name) {
    changes.push({
      kind: "changed",
      path: "author.name",
      before: before.author?.name ?? "—",
      after: after.author?.name ?? "—",
    });
  }

  // Keywords — set diff.
  appendSetDiff(changes, "keywords", before.keywords, after.keywords);

  // Named arrays — compared by name field.
  appendNamedArrayDiff(changes, "commands", before.commands, after.commands);
  appendNamedArrayDiff(changes, "agents", before.agents, after.agents);
  appendNamedArrayDiff(changes, "skills", before.skills, after.skills);
  appendNamedArrayDiff(changes, "mcpServers", before.mcpServers, after.mcpServers);
  appendNamedArrayDiff(changes, "actions", before.actions ?? [], after.actions ?? []);
  appendNamedArrayDiff(changes, "extensions", before.extensions ?? [], after.extensions ?? []);

  // Hooks are keyed by (event + command) since they don't have a unique name.
  const beforeHookKeys = new Set((before.hooks ?? []).map((h) => `${h.event}:${h.command}`));
  const afterHookKeys = new Set((after.hooks ?? []).map((h) => `${h.event}:${h.command}`));
  for (const k of afterHookKeys) {
    if (!beforeHookKeys.has(k)) {
      changes.push({ kind: "added", path: `hooks[${k}]`, after: k });
    }
  }
  for (const k of beforeHookKeys) {
    if (!afterHookKeys.has(k)) {
      changes.push({ kind: "removed", path: `hooks[${k}]`, before: k });
    }
  }

  // Versions array (informational — shows new releases upstream).
  const beforeVersions = new Set(before.versions.map((v) => v.version));
  const afterVersions = new Set(after.versions.map((v) => v.version));
  for (const v of afterVersions) {
    if (!beforeVersions.has(v)) {
      changes.push({ kind: "added", path: `versions[${v}]`, after: v });
    }
  }

  // Order: changed first, then added, then removed (what admins look at first).
  const rank: Record<DiffChange["kind"], number> = { changed: 0, added: 1, removed: 2 };
  changes.sort((a, b) => rank[a.kind] - rank[b.kind] || a.path.localeCompare(b.path));
  return changes;
}

function appendNamedArrayDiff(
  out: DiffChange[],
  field: string,
  before: { name: string }[],
  after: { name: string }[],
) {
  const beforeNames = new Set(before.map((i) => i.name));
  const afterNames = new Set(after.map((i) => i.name));
  for (const n of afterNames) {
    if (!beforeNames.has(n)) out.push({ kind: "added", path: `${field}[${n}]`, after: n });
  }
  for (const n of beforeNames) {
    if (!afterNames.has(n)) out.push({ kind: "removed", path: `${field}[${n}]`, before: n });
  }
}

function appendSetDiff(out: DiffChange[], field: string, before: string[], after: string[]) {
  const b = new Set(before);
  const a = new Set(after);
  const added = [...a].filter((x) => !b.has(x));
  const removed = [...b].filter((x) => !a.has(x));
  for (const x of added) out.push({ kind: "added", path: `${field}[${x}]`, after: x });
  for (const x of removed) out.push({ kind: "removed", path: `${field}[${x}]`, before: x });
}

function stringify(v: unknown): string {
  if (typeof v === "string") return v;
  if (v === undefined || v === null) return "—";
  return JSON.stringify(v);
}
