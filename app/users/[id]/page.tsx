import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { currentUser, findUser, MOCK_USERS } from "@/lib/users";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/badge";
import { formatRelative } from "@/lib/utils";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return MOCK_USERS.map((u) => ({ id: u.id }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> },
): Promise<Metadata> {
  const { id } = await params;
  const u = findUser(id);
  return u ? { title: u.name } : {};
}

/**
 * Real install history from the Install table. Returns the most recent N
 * rows for this user, joined with the plugin rows so we can render the
 * plugin name + version without a second query.
 */
async function recentInstallsFor(userId: string) {
  const rows = await prisma.install.findMany({
    where: { userId },
    orderBy: { issuedAt: "desc" },
    take: 10,
    include: { plugin: { select: { slug: true, name: true, provider: true } } },
  });
  return rows.map((r) => ({
    plugin: r.plugin,
    version: r.version,
    clientType: r.clientType,
    at: r.issuedAt.toISOString(),
  }));
}

const roleBadgeVariant = {
  admin: "accent",
  curator: "info",
  installer: "ok",
  viewer: "neutral",
} as const;

export default async function UserPage(
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = findUser(id);
  if (!user) return notFound();
  const [me, uploads, activity] = await Promise.all([
    currentUser(),
    prisma.uploadedSkill.findMany({
      where: { uploadedBy: user.id },
      orderBy: { createdAt: "desc" },
    }),
    recentInstallsFor(user.id),
  ]);
  const isSelf = me.id === user.id;

  return (
    <div>
      <Link
        href="/admin/users"
        className="inline-flex items-center gap-1.5 text-[12.5px] text-[color:var(--color-fg-subtle)] hover:text-[color:var(--color-fg-muted)]"
      >
        ← Back to users
      </Link>

      <header className="mt-4 flex flex-wrap items-start gap-4 border-b border-[color:var(--color-border)] pb-6">
        <Avatar user={user} size={64} />
        <div className="min-w-0 flex-1">
          <h1 className="text-[26px] font-semibold tracking-tight">{user.name}</h1>
          <p className="mt-1 font-mono text-[13px] text-[color:var(--color-fg-muted)]">
            {user.email}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <Badge variant={roleBadgeVariant[user.role]}>{user.role}</Badge>
            {user.team ? <Badge>{user.team}</Badge> : null}
          </div>
          <p className="mt-2 text-[12.5px] text-[color:var(--color-fg-subtle)]">
            Last seen {formatRelative(user.lastSeen)}.
          </p>
        </div>
        {isSelf ? (
          <Link
            href={`/users/${user.id}/upload`}
            className="inline-flex h-9 shrink-0 items-center self-center rounded-md bg-[color:var(--color-accent)] px-3 text-[13px] font-medium text-[color:var(--color-accent-fg)]"
          >
            + Upload a skill
          </Link>
        ) : null}
      </header>

      <section className="mt-8">
        <h2 className="mb-2 text-[14px] font-semibold tracking-tight">Recent activity</h2>
        <p className="mb-3 text-[12px] text-[color:var(--color-fg-subtle)]">
          Most recent install events recorded for this identity.
        </p>
        {activity.length === 0 ? (
          <div className="rounded-[var(--radius-lg)] border border-dashed border-[color:var(--color-border-strong)] px-6 py-8 text-center text-[13px] text-[color:var(--color-fg-subtle)]">
            No install events yet.
          </div>
        ) : (
          <ul className="divide-y divide-[color:var(--color-border)] rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[color:var(--color-bg-elev)]">
            {activity.map((a, i) => (
              <li key={i} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <Link
                    href={`/plugins/${a.plugin.slug}`}
                    className="truncate text-[13.5px] font-medium hover:underline"
                  >
                    {a.plugin.name}{" "}
                    <span className="font-mono text-[11.5px] text-[color:var(--color-fg-subtle)]">
                      {a.version}
                    </span>
                  </Link>
                  <p className="mt-0.5 text-[11.5px] text-[color:var(--color-fg-subtle)]">
                    via {a.clientType ?? (a.plugin.provider === "openai" ? "ChatGPT" : a.plugin.provider === "gemini" ? "Gemini" : "Claude Code")}
                  </p>
                </div>
                <span className="shrink-0 font-mono text-[11.5px] text-[color:var(--color-fg-subtle)]">
                  {formatRelative(a.at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8">
        <h2 className="mb-2 text-[14px] font-semibold tracking-tight">
          Contributions{" "}
          <span className="ml-1 font-mono text-[11.5px] text-[color:var(--color-fg-subtle)]">
            {uploads.length}
          </span>
        </h2>
        <p className="text-[12.5px] text-[color:var(--color-fg-muted)]">
          Skills this user has uploaded. Approved contributions appear in the catalog under the
          <code className="ml-1 font-mono">user-contributions</code> source.
        </p>
        {uploads.length === 0 ? (
          <div className="mt-3 rounded-[var(--radius-lg)] border border-dashed border-[color:var(--color-border-strong)] px-6 py-8 text-center text-[13px] text-[color:var(--color-fg-subtle)]">
            {isSelf ? (
              <>
                Nothing uploaded yet.{" "}
                <Link
                  href={`/users/${user.id}/upload`}
                  className="text-[color:var(--color-accent)] hover:underline"
                >
                  Publish your first skill →
                </Link>
              </>
            ) : (
              "No contributions yet."
            )}
          </div>
        ) : (
          <ul className="mt-3 divide-y divide-[color:var(--color-border)] rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[color:var(--color-bg-elev)]">
            {uploads.map((u) => (
              <li key={u.id} className="flex items-start justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[13.5px] font-medium">{u.name}</span>
                    <Badge
                      variant={
                        u.policyState === "approved"
                          ? "ok"
                          : u.policyState === "rejected"
                            ? "danger"
                            : "warn"
                      }
                    >
                      {u.policyState}
                    </Badge>
                    <Badge>{u.category}</Badge>
                  </div>
                  <p className="mt-1 text-[12.5px] text-[color:var(--color-fg-muted)]">
                    {u.description}
                  </p>
                </div>
                <span className="shrink-0 font-mono text-[11.5px] text-[color:var(--color-fg-subtle)]">
                  {formatRelative(u.createdAt.toISOString())}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Avatar({ user, size = 40 }: { user: { email: string; initials: string }; size?: number }) {
  const palette = ["#b8562c", "#2a5d9f", "#14784a", "#a76a0a", "#7a2a9f", "#1f7a78"];
  let h = 0;
  for (let i = 0; i < user.email.length; i++) h = (h * 31 + user.email.charCodeAt(i)) >>> 0;
  const bg = palette[h % palette.length];
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white"
      style={{ background: bg, width: size, height: size, fontSize: Math.round(size * 0.32) }}
    >
      {user.initials}
    </span>
  );
}
