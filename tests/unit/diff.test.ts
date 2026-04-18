import { describe, it, expect } from "vitest";
import { diffPlugins } from "@/lib/diff";
import type { Plugin } from "@/lib/types";

function basePlugin(): Plugin {
  return {
    slug: "x",
    name: "Test",
    description: "A plugin",
    version: "1.0.0",
    provider: "claude-code",
    category: "productivity",
    author: { name: "Alice" },
    keywords: ["a", "b"],
    sourceId: "src",
    commands: [{ name: "/a", description: "a" }],
    agents: [],
    skills: [],
    hooks: [],
    mcpServers: [],
    versions: [{ version: "1.0.0", releasedAt: "2026-01-01T00:00:00Z" }],
    signals: [],
    policyState: "approved",
    updatedAt: "2026-01-01T00:00:00Z",
  };
}

describe("diffPlugins", () => {
  it("returns empty diff for identical plugins", () => {
    expect(diffPlugins(basePlugin(), basePlugin())).toEqual([]);
  });

  it("reports version bump as changed", () => {
    const before = basePlugin();
    const after = { ...basePlugin(), version: "1.1.0" };
    const changes = diffPlugins(before, after);
    expect(changes).toContainEqual({
      kind: "changed",
      path: "version",
      before: "1.0.0",
      after: "1.1.0",
    });
  });

  it("reports new command as added", () => {
    const before = basePlugin();
    const after = {
      ...basePlugin(),
      commands: [
        { name: "/a", description: "a" },
        { name: "/b", description: "b" },
      ],
    };
    const changes = diffPlugins(before, after);
    expect(changes).toContainEqual({
      kind: "added",
      path: "commands[/b]",
      after: "/b",
    });
  });

  it("reports removed mcp server", () => {
    const before = {
      ...basePlugin(),
      mcpServers: [{ name: "pagerduty", command: "pd" }],
    };
    const after = basePlugin();
    const changes = diffPlugins(before, after);
    expect(changes).toContainEqual({
      kind: "removed",
      path: "mcpServers[pagerduty]",
      before: "pagerduty",
    });
  });

  it("diffs keywords as a set, not a sequence", () => {
    const before = { ...basePlugin(), keywords: ["a", "b", "c"] };
    const after = { ...basePlugin(), keywords: ["a", "c", "d"] };
    const changes = diffPlugins(before, after);
    expect(changes).toContainEqual({ kind: "added", path: "keywords[d]", after: "d" });
    expect(changes).toContainEqual({ kind: "removed", path: "keywords[b]", before: "b" });
    // "a" and "c" unchanged — no entry.
    expect(changes.find((c) => c.path === "keywords[a]")).toBeUndefined();
  });

  it("reports new hook by (event, command) composite", () => {
    const before = basePlugin();
    const after = {
      ...basePlugin(),
      hooks: [{ event: "PreToolUse" as const, command: "/bin/check" }],
    };
    const changes = diffPlugins(before, after);
    expect(changes).toContainEqual({
      kind: "added",
      path: "hooks[PreToolUse:/bin/check]",
      after: "PreToolUse:/bin/check",
    });
  });

  it("orders changes: changed > added > removed", () => {
    const before = {
      ...basePlugin(),
      commands: [
        { name: "/a", description: "a" },
        { name: "/old", description: "o" },
      ],
    };
    const after = {
      ...basePlugin(),
      version: "1.1.0",
      commands: [
        { name: "/a", description: "a" },
        { name: "/new", description: "n" },
      ],
    };
    const changes = diffPlugins(before, after);
    const kinds = changes.map((c) => c.kind);
    expect(kinds.indexOf("changed")).toBeLessThan(kinds.indexOf("added"));
    expect(kinds.indexOf("added")).toBeLessThan(kinds.indexOf("removed"));
  });
});
