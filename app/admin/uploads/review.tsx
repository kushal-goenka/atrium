"use client";

import { useState, useTransition } from "react";
import { reviewUploadedSkillAction } from "@/app/users/[id]/upload/actions";

export function UploadReview({
  uploadId,
  current,
}: {
  uploadId: string;
  current: string;
}) {
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState(current);
  const [error, setError] = useState<string | null>(null);

  function decide(decision: "approved" | "rejected") {
    setError(null);
    startTransition(async () => {
      const res = await reviewUploadedSkillAction(uploadId, decision);
      if (res.ok) {
        setStatus(decision);
      } else {
        setError(res.error ?? "failed");
      }
    });
  }

  if (status !== "quarantined") {
    return (
      <span className="shrink-0 self-start font-mono text-[11px] text-[color:var(--color-fg-subtle)]">
        {status}
      </span>
    );
  }

  return (
    <div className="shrink-0 self-start">
      <div className="flex gap-1.5">
        <button
          type="button"
          onClick={() => decide("approved")}
          disabled={pending}
          className="rounded-md bg-[color:var(--color-accent)] px-2.5 py-1 text-[12px] font-medium text-[color:var(--color-accent-fg)] disabled:opacity-60"
        >
          {pending ? "…" : "Approve"}
        </button>
        <button
          type="button"
          onClick={() => decide("rejected")}
          disabled={pending}
          className="rounded-md border border-[color:var(--color-border)] px-2.5 py-1 text-[12px] font-medium text-[color:var(--color-fg-muted)] hover:border-[color:var(--color-danger)] hover:text-[color:var(--color-danger)] disabled:opacity-60"
        >
          Reject
        </button>
      </div>
      {error ? (
        <p className="mt-1 text-[11px] text-[color:var(--color-danger)]">{error}</p>
      ) : null}
    </div>
  );
}
