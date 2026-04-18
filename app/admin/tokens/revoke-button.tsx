"use client";

import { useState, useTransition } from "react";
import { revokeTokenAction } from "./actions";

export function TokenRevokeButton({ tokenId }: { tokenId: string }) {
  const [pending, startTransition] = useTransition();
  const [confirm, setConfirm] = useState(false);

  if (confirm) {
    return (
      <div className="inline-flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => {
            startTransition(async () => {
              await revokeTokenAction(tokenId);
              setConfirm(false);
            });
          }}
          disabled={pending}
          className="rounded-md bg-[color:var(--color-danger)] px-2 py-1 text-[11px] font-medium text-white disabled:opacity-60"
        >
          {pending ? "…" : "Confirm revoke"}
        </button>
        <button
          type="button"
          onClick={() => setConfirm(false)}
          className="rounded-md border border-[color:var(--color-border)] px-2 py-1 text-[11px]"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirm(true)}
      className="rounded-md border border-[color:var(--color-border)] px-2 py-1 text-[11px] font-medium text-[color:var(--color-fg-muted)] hover:border-[color:var(--color-danger)] hover:text-[color:var(--color-danger)]"
    >
      Revoke
    </button>
  );
}
