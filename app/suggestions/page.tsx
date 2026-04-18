import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/badge";
import { VoteButton } from "./vote-button";
import { currentUser, findUser } from "@/lib/users";
import { formatRelative } from "@/lib/utils";

export const metadata = { title: "Suggestions" };
export const dynamic = "force-dynamic";

const STATUS_VARIANT: Record<string, "accent" | "info" | "ok" | "warn" | "neutral"> = {
  open: "neutral",
  "under-review": "info",
  "in-progress": "warn",
  shipped: "ok",
  closed: "neutral",
};

const KIND_LABEL: Record<string, string> = {
  "plugin-request": "Plugin request",
  "skill-request": "Skill request",
  "capability-gap": "Capability gap",
  integration: "Integration",
  general: "Discussion",
  // Legacy values still in DB — kept so pre-rename rows render sanely.
  feature: "Atrium feature (legacy)",
  bug: "Bug (legacy)",
};

export default async function SuggestionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const filter = params.status ?? "open";

  const [suggestions, me] = await Promise.all([
    prisma.suggestion.findMany({
      where: filter === "all" ? {} : { status: filter },
      orderBy: [{ votes: "desc" }, { createdAt: "desc" }],
      take: 50,
    }),
    currentUser(),
  ]);

  const myVotes = await prisma.suggestionVote.findMany({
    where: { userId: me.id, suggestionId: { in: suggestions.map((s) => s.id) } },
    select: { suggestionId: true },
  });
  const votedSet = new Set(myVotes.map((v) => v.suggestionId));

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-start justify-between gap-3 border-b border-[color:var(--color-border)] pb-6">
        <div>
          <p className="text-[11.5px] font-mono uppercase tracking-[0.08em] text-[color:var(--color-fg-subtle)]">
            Capability wishlist
          </p>
          <h1 className="mt-2 text-[24px] font-semibold tracking-tight">Suggestions</h1>
          <p className="mt-1 max-w-2xl text-[13.5px] text-[color:var(--color-fg-muted)]">
            What should agents do that they don&apos;t do well today? Request a plugin, a skill, an
            integration, or flag a gap. Upvote the ideas you&apos;d use. Curators turn the top of
            the list into real work — or file bugs against Atrium itself on{" "}
            <a
              href="https://github.com/kushal-goenka/atrium/issues"
              className="text-[color:var(--color-accent)] underline-offset-4 hover:underline"
            >
              GitHub
            </a>
            .
          </p>
        </div>
        <Link
          href="/suggestions/new"
          className="inline-flex h-9 shrink-0 items-center rounded-md bg-[color:var(--color-accent)] px-3 text-[13px] font-medium text-[color:var(--color-accent-fg)]"
        >
          New suggestion
        </Link>
      </header>

      <nav
        role="tablist"
        aria-label="Filter by status"
        className="mb-4 flex flex-wrap gap-1.5"
      >
        {[
          { key: "open", label: "Open" },
          { key: "under-review", label: "Under review" },
          { key: "in-progress", label: "In progress" },
          { key: "shipped", label: "Shipped" },
          { key: "closed", label: "Closed" },
          { key: "all", label: "All" },
        ].map((t) => (
          <Link
            key={t.key}
            href={t.key === "open" ? "/suggestions" : `/suggestions?status=${t.key}`}
            className={`rounded-full border px-3 py-1.5 text-[12.5px] font-medium ${
              filter === t.key
                ? "border-[color:var(--color-accent)] bg-[color:var(--color-accent-soft)] text-[color:var(--color-accent)]"
                : "border-[color:var(--color-border)] bg-[color:var(--color-bg-elev)] text-[color:var(--color-fg-muted)] hover:border-[color:var(--color-border-strong)]"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {suggestions.length === 0 ? (
        <div className="rounded-[var(--radius-lg)] border border-dashed border-[color:var(--color-border-strong)] px-8 py-16 text-center text-[13px] text-[color:var(--color-fg-subtle)]">
          Nothing in this bucket yet.
          <div className="mt-2">
            <Link
              href="/suggestions/new"
              className="text-[color:var(--color-accent)] hover:underline"
            >
              Submit the first one →
            </Link>
          </div>
        </div>
      ) : (
        <ul className="space-y-2">
          {suggestions.map((s) => {
            const author = findUser(s.createdBy);
            return (
              <li
                key={s.id}
                className="flex items-start gap-3 rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[color:var(--color-bg-elev)] p-4"
              >
                <VoteButton
                  suggestionId={s.id}
                  initialVoted={votedSet.has(s.id)}
                  initialVotes={s.votes}
                />
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/suggestions/${s.id}`}
                    className="text-[14px] font-semibold tracking-tight hover:underline"
                  >
                    {s.title}
                  </Link>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11.5px] text-[color:var(--color-fg-subtle)]">
                    <Badge>{KIND_LABEL[s.kind] ?? s.kind}</Badge>
                    {s.provider ? <Badge variant="info">{s.provider}</Badge> : null}
                    <Badge variant={STATUS_VARIANT[s.status] ?? "neutral"}>{s.status}</Badge>
                    <span>
                      by{" "}
                      {author ? (
                        <Link href={`/users/${author.id}`} className="hover:underline">
                          {author.name}
                        </Link>
                      ) : (
                        s.createdByName ?? s.createdBy
                      )}
                    </span>
                    <span aria-hidden>·</span>
                    <span>{formatRelative(s.createdAt.toISOString())}</span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-[12.5px] leading-relaxed text-[color:var(--color-fg-muted)]">
                    {s.body}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
