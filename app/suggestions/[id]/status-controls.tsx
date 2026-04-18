"use client";

import { useState, useTransition } from "react";
import { setSuggestionStatusAction } from "../actions";
import { cn } from "@/lib/utils";

type Status = "open" | "under-review" | "in-progress" | "shipped" | "closed";

const ALL: Status[] = ["open", "under-review", "in-progress", "shipped", "closed"];

export function StatusControls({ id, current }: { id: string; current: string }) {
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<string>(current);

  function pick(next: Status) {
    if (next === status) return;
    startTransition(async () => {
      const res = await setSuggestionStatusAction(id, next);
      if (res.ok) setStatus(next);
    });
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {ALL.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => pick(s)}
          disabled={pending}
          className={cn(
            "rounded-full border px-3 py-1 text-[12px] font-medium disabled:opacity-60",
            status === s
              ? "border-[color:var(--color-accent)] bg-[color:var(--color-accent-soft)] text-[color:var(--color-accent)]"
              : "border-[color:var(--color-border)] bg-[color:var(--color-bg-elev)] text-[color:var(--color-fg-muted)] hover:border-[color:var(--color-border-strong)]",
          )}
        >
          {s}
        </button>
      ))}
    </div>
  );
}
