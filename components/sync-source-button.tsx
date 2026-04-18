"use client";

import { useState, useTransition } from "react";
import { syncSourceAction } from "@/app/admin/sources/actions";
import { cn } from "@/lib/utils";

type State =
  | { kind: "idle" }
  | { kind: "success"; pluginCount: number; unchanged?: boolean }
  | { kind: "error"; message: string };

export function SyncSourceButton({
  sourceKey,
  disabled,
  disabledReason,
  className,
}: {
  sourceKey: string;
  disabled?: boolean;
  disabledReason?: string;
  className?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<State>({ kind: "idle" });

  function onClick() {
    setState({ kind: "idle" });
    startTransition(async () => {
      const result = await syncSourceAction(sourceKey);
      if (result.ok) {
        setState({
          kind: "success",
          pluginCount: result.pluginCount ?? 0,
          unchanged: result.unchanged,
        });
      } else {
        setState({ kind: "error", message: result.error ?? "Unknown error" });
      }
      // Surface is ephemeral; reset after a few seconds.
      setTimeout(() => setState({ kind: "idle" }), 6000);
    });
  }

  if (disabled) {
    return (
      <span
        title={disabledReason}
        className={cn(
          "inline-flex cursor-not-allowed items-center rounded-md border border-dashed border-[color:var(--color-border)] px-2 py-1 text-[12px] text-[color:var(--color-fg-subtle)]",
          className,
        )}
      >
        Sync now
      </span>
    );
  }

  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className="inline-flex items-center rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-bg-elev)] px-2.5 py-1 text-[12px] font-medium hover:border-[color:var(--color-border-strong)] disabled:opacity-60"
      >
        {pending ? "Syncing…" : "Sync now"}
      </button>
      {state.kind === "success" ? (
        <span className="text-[11.5px] text-[color:var(--color-ok)]">
          ✓ {state.unchanged ? "no changes" : `${state.pluginCount} plugins`}
        </span>
      ) : null}
      {state.kind === "error" ? (
        <span
          title={state.message}
          className="truncate text-[11.5px] text-[color:var(--color-danger)]"
        >
          ✕ {state.message.slice(0, 40)}
          {state.message.length > 40 ? "…" : ""}
        </span>
      ) : null}
    </div>
  );
}
