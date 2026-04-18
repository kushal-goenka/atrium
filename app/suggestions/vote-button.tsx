"use client";

import { useState, useTransition } from "react";
import { toggleVoteAction } from "./actions";
import { cn } from "@/lib/utils";

export function VoteButton({
  suggestionId,
  initialVoted,
  initialVotes,
}: {
  suggestionId: string;
  initialVoted: boolean;
  initialVotes: number;
}) {
  const [pending, startTransition] = useTransition();
  const [voted, setVoted] = useState(initialVoted);
  const [votes, setVotes] = useState(initialVotes);

  function onClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    startTransition(async () => {
      const res = await toggleVoteAction(suggestionId);
      if (res.ok) {
        setVoted(res.voted);
        setVotes(res.votes);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      aria-pressed={voted}
      aria-label={voted ? "Remove upvote" : "Upvote"}
      className={cn(
        "flex shrink-0 flex-col items-center justify-center gap-0.5 rounded-md border px-2.5 py-1.5 text-[11px] font-medium transition-colors",
        voted
          ? "border-[color:var(--color-accent)] bg-[color:var(--color-accent-soft)] text-[color:var(--color-accent)]"
          : "border-[color:var(--color-border)] bg-[color:var(--color-bg-sunken)] text-[color:var(--color-fg-muted)] hover:border-[color:var(--color-border-strong)] hover:text-[color:var(--color-fg)]",
      )}
    >
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
        <path d="M5 1.5 L1 5.5 H3.5 V8.5 H6.5 V5.5 H9 Z" fill="currentColor" />
      </svg>
      <span className="font-mono text-[12.5px]">{votes}</span>
    </button>
  );
}
