import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/badge";
import { VoteButton } from "../vote-button";
import { StatusControls } from "./status-controls";
import { currentUser, findUser } from "@/lib/users";
import { formatRelative } from "@/lib/utils";

export const dynamic = "force-dynamic";

const STATUS_VARIANT: Record<string, "accent" | "info" | "ok" | "warn" | "neutral"> = {
  open: "neutral",
  "under-review": "info",
  "in-progress": "warn",
  shipped: "ok",
  closed: "neutral",
};

export default async function SuggestionPage(
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const [suggestion, me] = await Promise.all([
    prisma.suggestion.findUnique({ where: { id } }),
    currentUser(),
  ]);
  if (!suggestion) notFound();

  const voted = await prisma.suggestionVote
    .findUnique({
      where: {
        suggestionId_userId: { suggestionId: suggestion.id, userId: me.id },
      },
    })
    .then((row) => !!row);

  const author = findUser(suggestion.createdBy);
  const isAdmin = me.role === "admin" || me.role === "curator";

  return (
    <div>
      <Link
        href="/suggestions"
        className="inline-flex items-center gap-1.5 text-[12.5px] text-[color:var(--color-fg-subtle)] hover:text-[color:var(--color-fg-muted)]"
      >
        ← Back to suggestions
      </Link>

      <div className="mt-4 flex items-start gap-4">
        <VoteButton suggestionId={suggestion.id} initialVoted={voted} initialVotes={suggestion.votes} />
        <div className="min-w-0 flex-1">
          <h1 className="text-[24px] font-semibold tracking-tight">{suggestion.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[12px] text-[color:var(--color-fg-subtle)]">
            <Badge>{suggestion.kind.replace("-", " ")}</Badge>
            {suggestion.provider ? <Badge variant="info">{suggestion.provider}</Badge> : null}
            <Badge variant={STATUS_VARIANT[suggestion.status] ?? "neutral"}>
              {suggestion.status}
            </Badge>
            <span>
              by{" "}
              {author ? (
                <Link href={`/users/${author.id}`} className="hover:underline">
                  {author.name}
                </Link>
              ) : (
                suggestion.createdByName ?? suggestion.createdBy
              )}{" "}
              · {formatRelative(suggestion.createdAt.toISOString())}
            </span>
          </div>
        </div>
      </div>

      <article className="mt-8 whitespace-pre-wrap rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[color:var(--color-bg-elev)] p-6 text-[14px] leading-relaxed text-[color:var(--color-fg)]">
        {suggestion.body}
      </article>

      {isAdmin ? (
        <div className="mt-6 rounded-[var(--radius)] border border-[color:var(--color-border)] bg-[color:var(--color-bg-sunken)] p-4">
          <h2 className="text-[13px] font-semibold">Admin</h2>
          <p className="mt-1 text-[12px] text-[color:var(--color-fg-muted)]">
            Triage the suggestion. Changing status logs an audit entry.
          </p>
          <div className="mt-3">
            <StatusControls id={suggestion.id} current={suggestion.status} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
