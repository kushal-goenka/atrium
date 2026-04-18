"use client";

import { useState, useTransition } from "react";
import { pinVersionAction, forkPluginAction } from "@/app/plugins/[slug]/pin-fork-actions";

export function PinForkPanel({
  pluginSlug,
  pluginVersion,
  versions,
  currentPin,
  sourceKind,
}: {
  pluginSlug: string;
  pluginVersion: string;
  versions: { version: string }[];
  currentPin?: string;
  sourceKind: "git" | "http" | "local";
}) {
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState<string>(currentPin ?? pluginVersion);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  function pin() {
    setMsg(null);
    startTransition(async () => {
      const res = await pinVersionAction(pluginSlug, selected);
      setMsg(res.ok ? { kind: "ok", text: `Pinned to ${selected}` } : { kind: "err", text: res.error ?? "failed" });
    });
  }

  function unpin() {
    setMsg(null);
    startTransition(async () => {
      const res = await pinVersionAction(pluginSlug, null);
      setMsg(res.ok ? { kind: "ok", text: "Unpinned" } : { kind: "err", text: res.error ?? "failed" });
    });
  }

  function fork() {
    setMsg(null);
    startTransition(async () => {
      const res = await forkPluginAction(pluginSlug, {
        internalSourceKey: "acme-internal",
        note: "forked via plugin detail",
      });
      setMsg(
        res.ok
          ? { kind: "ok", text: `Forked to ${res.forkKey}` }
          : { kind: "err", text: res.error ?? "failed" },
      );
    });
  }

  const isExternal = sourceKind !== "local";

  return (
    <div className="rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[color:var(--color-bg-elev)] p-5">
      <h2 className="text-[13px] font-semibold tracking-tight">Distribution</h2>
      <p className="mt-1 text-[12px] text-[color:var(--color-fg-muted)]">
        Pin to a specific version or fork into your internal source to diverge from upstream.
      </p>

      <div className="mt-4 space-y-2">
        <label className="block text-[11px] font-medium uppercase tracking-wider text-[color:var(--color-fg-subtle)]">
          Pin version
        </label>
        <div className="flex items-center gap-2">
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="h-8 flex-1 rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-bg-elev)] px-2 text-[12.5px] focus:border-[color:var(--color-border-strong)] focus:outline-none"
          >
            {versions.map((v) => (
              <option key={v.version} value={v.version}>
                {v.version}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={pin}
            disabled={pending}
            className="rounded-md bg-[color:var(--color-accent)] px-2.5 py-1 text-[12px] font-medium text-[color:var(--color-accent-fg)] disabled:opacity-60"
          >
            Pin
          </button>
          {currentPin ? (
            <button
              type="button"
              onClick={unpin}
              disabled={pending}
              className="rounded-md border border-[color:var(--color-border)] px-2.5 py-1 text-[12px] font-medium disabled:opacity-60"
            >
              Unpin
            </button>
          ) : null}
        </div>
        {currentPin ? (
          <p className="text-[11px] text-[color:var(--color-info)]">
            Currently serving <span className="font-mono">{currentPin}</span> regardless of upstream.
          </p>
        ) : null}
      </div>

      {isExternal ? (
        <div className="mt-5 border-t border-[color:var(--color-border)] pt-4">
          <label className="block text-[11px] font-medium uppercase tracking-wider text-[color:var(--color-fg-subtle)]">
            Fork to internal
          </label>
          <p className="mt-1 text-[12px] text-[color:var(--color-fg-muted)]">
            Snapshots the current manifest and registers an internal copy you can modify without
            touching upstream.
          </p>
          <button
            type="button"
            onClick={fork}
            disabled={pending}
            className="mt-2 inline-flex rounded-md border border-[color:var(--color-border)] px-3 py-1.5 text-[12px] font-medium hover:border-[color:var(--color-border-strong)] disabled:opacity-60"
          >
            Fork to Acme Corp internal
          </button>
        </div>
      ) : null}

      {msg ? (
        <p
          className={`mt-3 text-[12px] ${
            msg.kind === "ok"
              ? "text-[color:var(--color-ok)]"
              : "text-[color:var(--color-danger)]"
          }`}
        >
          {msg.kind === "ok" ? "✓ " : "✕ "}
          {msg.text}
        </p>
      ) : null}
    </div>
  );
}
