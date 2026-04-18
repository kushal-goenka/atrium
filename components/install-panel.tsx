"use client";

import { useMemo, useState } from "react";
import type { Plugin } from "@/lib/types";
import { INSTALL_TARGETS, targetsForProvider } from "@/lib/install-targets";
import { cn } from "@/lib/utils";

type Props = {
  plugin: Plugin;
  hostname: string;
  orgName: string;
};

export function InstallPanel({ plugin, hostname, orgName }: Props) {
  const available = useMemo(() => targetsForProvider(plugin.provider), [plugin.provider]);
  // Default to whichever target list the plugin's provider best fits.
  const [targetKey, setTargetKey] = useState(available[0]?.key ?? INSTALL_TARGETS[0]!.key);
  const target = INSTALL_TARGETS.find((t) => t.key === targetKey) ?? INSTALL_TARGETS[0]!;
  const ctx = { hostname, orgName };

  const setup = target.setup(ctx);
  const install = target.install(ctx, plugin);
  const note = target.note?.(ctx, plugin) ?? null;

  return (
    <div className="rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[color:var(--color-bg-elev)] p-5">
      <h2 className="text-[13px] font-semibold tracking-tight">Install</h2>

      <div
        role="tablist"
        aria-label="Install client"
        className="mt-2 -mx-1 flex flex-wrap gap-1 overflow-x-auto pb-1"
      >
        {available.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={t.key === target.key}
            onClick={() => setTargetKey(t.key)}
            className={cn(
              "whitespace-nowrap rounded-md px-2 py-1 text-[11.5px] font-medium transition-colors",
              t.key === target.key
                ? "bg-[color:var(--color-accent-soft)] text-[color:var(--color-accent)]"
                : "text-[color:var(--color-fg-subtle)] hover:text-[color:var(--color-fg-muted)]",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <p className="mt-1 text-[12px] text-[color:var(--color-fg-muted)]">{target.tagline}</p>

      {setup.length > 0 ? (
        <div className="mt-3 space-y-2">
          {setup.map((cmd, i) => (
            <Block key={i} cmd={cmd} />
          ))}
        </div>
      ) : null}

      <div className="mt-3 space-y-2">
        {install.map((cmd, i) => (
          <Block key={i} cmd={cmd} />
        ))}
      </div>

      {note ? (
        <p className="mt-2 text-[11.5px] italic text-[color:var(--color-fg-subtle)]">{note}</p>
      ) : null}
    </div>
  );
}

function Block({ cmd }: { cmd: { kind: "shell" | "slash" | "json"; label: string; body: string; file?: string } }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(cmd.body);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      /* silent */
    }
  }

  const prefix = cmd.kind === "shell" ? "$ " : cmd.kind === "slash" ? "" : "";

  return (
    <div className="overflow-hidden rounded-[var(--radius)] border border-[color:var(--color-border)] bg-[color:var(--color-bg-sunken)]">
      <div className="flex items-center justify-between border-b border-[color:var(--color-border)] px-3 py-1.5 text-[10.5px] font-medium uppercase tracking-wider text-[color:var(--color-fg-subtle)]">
        <span>
          {cmd.label}
          {cmd.file ? (
            <span className="ml-1.5 font-mono normal-case tracking-normal text-[10px]">
              {cmd.file}
            </span>
          ) : null}
        </span>
        <button
          type="button"
          onClick={copy}
          className="text-[10px] font-medium text-[color:var(--color-fg-muted)] hover:text-[color:var(--color-fg)]"
        >
          {copied ? "copied" : "copy"}
        </button>
      </div>
      <pre className="max-h-[240px] overflow-auto px-3 py-2 font-mono text-[12px] leading-relaxed text-[color:var(--color-fg)]">
        {cmd.kind === "json" ? cmd.body : `${prefix}${cmd.body}`}
      </pre>
    </div>
  );
}
