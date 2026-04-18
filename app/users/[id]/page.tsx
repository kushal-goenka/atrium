import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { findUser, MOCK_USERS } from "@/lib/users";
import { plugins as staticPlugins } from "@/data/plugins";
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

// Deterministic "pretend" activity so the profile page isn't empty before
// real install telemetry lands.
function activityFor(userId: string) {
  const hash = Array.from(userId).reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 0);
  const count = 3 + (hash % 4);
  return staticPlugins.slice(hash % 4, (hash % 4) + count).map((p, i) => ({
    plugin: p,
    at: new Date(Date.now() - ((i + 1) * 24 * 3600 * 1000 * (1 + (hash % 3)))).toISOString(),
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
  const activity = activityFor(user.id);

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
      </header>

      <section className="mt-8">
        <h2 className="mb-2 text-[14px] font-semibold tracking-tight">Recent activity</h2>
        <p className="mb-3 text-[12px] text-[color:var(--color-fg-subtle)]">
          Install events recorded against this identity. Real telemetry replaces this feed when
          the <code className="font-mono">Install</code> model is wired up.
        </p>
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
                    {a.plugin.version}
                  </span>
                </Link>
                <p className="mt-0.5 text-[11.5px] text-[color:var(--color-fg-subtle)]">
                  installed via {a.plugin.provider === "openai" ? "ChatGPT" : a.plugin.provider === "gemini" ? "Gemini" : "Claude Code"}
                </p>
              </div>
              <span className="shrink-0 font-mono text-[11.5px] text-[color:var(--color-fg-subtle)]">
                {formatRelative(a.at)}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="mb-2 text-[14px] font-semibold tracking-tight">Contributions</h2>
        <p className="text-[12.5px] text-[color:var(--color-fg-muted)]">
          Skills and plugins this user has published to the internal source land here. The
          upload flow lives on the user profile (own profile only) once implemented.
        </p>
        <div className="mt-3 rounded-[var(--radius-lg)] border border-dashed border-[color:var(--color-border-strong)] px-6 py-8 text-center text-[13px] text-[color:var(--color-fg-subtle)]">
          No contributions yet.
        </div>
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
