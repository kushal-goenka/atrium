"use client";

import { useState, useTransition } from "react";
import { deleteProviderAction } from "./actions";

export function ProviderDeleteButton({
  providerKey,
  label,
}: {
  providerKey: string;
  label: string;
}) {
  const [pending, startTransition] = useTransition();
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (confirm) {
    return (
      <div className="inline-flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => {
            startTransition(async () => {
              const result = await deleteProviderAction(providerKey);
              if (!result.ok) setError(result.error ?? "failed");
            });
          }}
          disabled={pending}
          className="rounded-md bg-[color:var(--color-danger)] px-2 py-1 text-[11.5px] font-medium text-white disabled:opacity-60"
        >
          {pending ? "Removing…" : `Remove ${label}`}
        </button>
        <button
          type="button"
          onClick={() => setConfirm(false)}
          className="rounded-md border border-[color:var(--color-border)] px-2 py-1 text-[11.5px]"
        >
          Cancel
        </button>
        {error ? <span className="text-[11px] text-[color:var(--color-danger)]">{error}</span> : null}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirm(true)}
      className="inline-flex items-center rounded-md border border-[color:var(--color-border)] px-2.5 py-1 text-[11.5px] font-medium text-[color:var(--color-fg-muted)] hover:border-[color:var(--color-danger)] hover:text-[color:var(--color-danger)]"
    >
      Remove
    </button>
  );
}
