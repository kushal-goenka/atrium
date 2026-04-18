"use client";

import { useState } from "react";

export function FlagForRescan({ pluginSlug }: { pluginSlug: string }) {
  const [state, setState] = useState<"idle" | "flagging" | "flagged">("idle");

  function onFlag() {
    setState("flagging");
    // v0.1 is stubbed — in M4 this enqueues a scanner run for the plugin.
    setTimeout(() => setState("flagged"), 500);
  }

  if (state === "flagged") {
    return (
      <p className="text-[11.5px] text-[color:var(--color-ok)]">
        ✓ Re-scan queued for <span className="font-mono">{pluginSlug}</span>.
      </p>
    );
  }

  return (
    <p className="text-[11.5px] text-[color:var(--color-fg-subtle)]">
      Wrong info?{" "}
      <button
        type="button"
        onClick={onFlag}
        disabled={state === "flagging"}
        className="text-[color:var(--color-accent)] hover:underline disabled:opacity-60"
      >
        {state === "flagging" ? "Flagging…" : "Flag for re-scan"}
      </button>
    </p>
  );
}
