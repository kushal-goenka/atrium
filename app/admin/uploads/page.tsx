import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/badge";
import { UploadReview } from "./review";
import { findUser } from "@/lib/users";
import { formatRelative } from "@/lib/utils";

export const metadata = { title: "User uploads" };
export const dynamic = "force-dynamic";

const STATUS_VARIANT: Record<string, "ok" | "warn" | "danger" | "neutral"> = {
  approved: "ok",
  quarantined: "warn",
  rejected: "danger",
};

export default async function UploadsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const filter = params.status ?? "quarantined";

  const uploads = await prisma.uploadedSkill.findMany({
    where: filter === "all" ? {} : { policyState: filter },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div>
      <Link
        href="/admin"
        className="inline-flex items-center gap-1.5 text-[12.5px] text-[color:var(--color-fg-subtle)] hover:text-[color:var(--color-fg-muted)]"
      >
        ← Back to admin
      </Link>

      <header className="mt-4 mb-6 border-b border-[color:var(--color-border)] pb-6">
        <p className="text-[11.5px] font-mono uppercase tracking-[0.08em] text-[color:var(--color-fg-subtle)]">
          Admin · user uploads
        </p>
        <h1 className="mt-2 text-[24px] font-semibold tracking-tight">User-contributed skills</h1>
        <p className="mt-1 max-w-2xl text-[13.5px] text-[color:var(--color-fg-muted)]">
          Skills submitted by engineers show up here. Approve to publish them under the{" "}
          <code className="font-mono">user-contributions</code> source; reject if they duplicate
          or violate policy.
        </p>
      </header>

      <nav className="mb-4 flex flex-wrap gap-1.5">
        {[
          { key: "quarantined", label: "Pending review" },
          { key: "approved", label: "Approved" },
          { key: "rejected", label: "Rejected" },
          { key: "all", label: "All" },
        ].map((t) => (
          <Link
            key={t.key}
            href={t.key === "quarantined" ? "/admin/uploads" : `/admin/uploads?status=${t.key}`}
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

      {uploads.length === 0 ? (
        <div className="rounded-[var(--radius-lg)] border border-dashed border-[color:var(--color-border-strong)] px-8 py-16 text-center text-[13px] text-[color:var(--color-fg-subtle)]">
          Nothing here.
        </div>
      ) : (
        <ul className="space-y-3">
          {uploads.map((u) => {
            const author = findUser(u.uploadedBy);
            const keywords = u.keywords
              .split(",")
              .map((k) => k.trim())
              .filter(Boolean);
            return (
              <li
                key={u.id}
                className="rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[color:var(--color-bg-elev)] p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-[15px] font-semibold">{u.name}</h2>
                      <Badge variant={STATUS_VARIANT[u.policyState] ?? "neutral"}>
                        {u.policyState}
                      </Badge>
                      <Badge>{u.category}</Badge>
                    </div>
                    <p className="mt-1 text-[12px] text-[color:var(--color-fg-subtle)]">
                      by{" "}
                      {author ? (
                        <Link
                          href={`/users/${author.id}`}
                          className="hover:underline"
                        >
                          {author.name}
                        </Link>
                      ) : (
                        u.uploaderName ?? u.uploadedBy
                      )}{" "}
                      · {formatRelative(u.createdAt.toISOString())}
                    </p>
                    <p className="mt-2 text-[13px] leading-relaxed text-[color:var(--color-fg-muted)]">
                      {u.description}
                    </p>
                    {keywords.length > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {keywords.map((k) => (
                          <span
                            key={k}
                            className="rounded-full bg-[color:var(--color-bg-sunken)] px-2 py-0.5 font-mono text-[11px] text-[color:var(--color-fg-muted)]"
                          >
                            {k}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <UploadReview uploadId={u.id} current={u.policyState} />
                </div>
                <details className="mt-3 text-[12.5px]">
                  <summary className="cursor-pointer text-[color:var(--color-fg-muted)] hover:text-[color:var(--color-fg)]">
                    View body ({u.body.length} chars)
                  </summary>
                  <pre className="mt-2 max-h-[320px] overflow-auto rounded-[var(--radius)] border border-[color:var(--color-border)] bg-[color:var(--color-bg-sunken)] p-3 font-mono text-[11.5px] leading-relaxed">
                    {u.body}
                  </pre>
                </details>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
