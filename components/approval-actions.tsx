"use client";

import { useState } from "react";
import Link from "next/link";

type State = "idle" | "approving" | "approved";

export function ApprovalActions({
  pluginName,
  pluginSlug,
}: {
  pluginName: string;
  pluginSlug: string;
}) {
  const [state, setState] = useState<State>("idle");

  function onApprove() {
    setState("approving");
    // v0.1 is stubbed — in M2 this calls a Server Action that updates
    // Plugin.policyState and writes an AuditLog row.
    setTimeout(() => setState("approved"), 600);
  }

  if (state === "approved") {
    return (
      <span className="shrink-0 rounded-md border border-[color:var(--color-ok)]/30 bg-[color:var(--color-ok)]/10 px-2.5 py-1 text-[12px] font-medium text-[color:var(--color-ok)]">
        Approved · {pluginName}
      </span>
    );
  }

  return (
    <div className="flex shrink-0 items-center gap-1.5">
      <Link
        href={`/plugins/${pluginSlug}`}
        className="rounded-md border border-[color:var(--color-border)] px-2.5 py-1 text-[12px] font-medium hover:border-[color:var(--color-border-strong)]"
      >
        Review
      </Link>
      <button
        type="button"
        onClick={onApprove}
        disabled={state === "approving"}
        className="rounded-md bg-[color:var(--color-accent)] px-2.5 py-1 text-[12px] font-medium text-[color:var(--color-accent-fg)] disabled:opacity-60"
      >
        {state === "approving" ? "Approving…" : "Approve"}
      </button>
    </div>
  );
}
