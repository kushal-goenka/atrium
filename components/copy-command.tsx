"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export function CopyCommand({
  command,
  label,
  className,
}: {
  command: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      /* clipboard may be blocked — silent fail is acceptable */
    }
  }

  return (
    <div className={cn("rounded-[var(--radius)] border border-[color:var(--color-border)] bg-[color:var(--color-bg-sunken)]", className)}>
      {label ? (
        <div className="border-b border-[color:var(--color-border)] px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-[color:var(--color-fg-subtle)]">
          {label}
        </div>
      ) : null}
      <div className="flex items-center gap-2 px-3 py-2.5">
        <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap font-mono text-[12.5px] text-[color:var(--color-fg)]">
          {command}
        </code>
        <button
          type="button"
          onClick={onCopy}
          className="shrink-0 rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-bg-elev)] px-2 py-1 text-[11.5px] font-medium text-[color:var(--color-fg-muted)] transition-colors hover:border-[color:var(--color-border-strong)] hover:text-[color:var(--color-fg)]"
        >
          {copied ? "copied" : "copy"}
        </button>
      </div>
    </div>
  );
}
