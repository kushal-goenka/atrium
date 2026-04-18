import Link from "next/link";
import { Badge } from "@/components/badge";
import { MOCK_USERS } from "@/lib/users";
import { formatRelative } from "@/lib/utils";

export const metadata = { title: "Users" };

const ROLE_STYLE = {
  admin: "accent",
  curator: "info",
  installer: "ok",
  viewer: "neutral",
} as const;

export default function UsersPage() {
  return (
    <div>
      <Link
        href="/admin"
        className="inline-flex items-center gap-1.5 text-[12.5px] text-[color:var(--color-fg-subtle)] hover:text-[color:var(--color-fg-muted)]"
      >
        ← Back to admin
      </Link>

      <header className="mt-4 mb-6 flex flex-wrap items-start justify-between gap-3 border-b border-[color:var(--color-border)] pb-6">
        <div>
          <p className="text-[11.5px] font-mono uppercase tracking-[0.08em] text-[color:var(--color-fg-subtle)]">
            Admin · users
          </p>
          <h1 className="mt-2 text-[24px] font-semibold tracking-tight">Users</h1>
          <p className="mt-1 max-w-2xl text-[13.5px] text-[color:var(--color-fg-muted)]">
            Four built-in roles ship with Atrium. Custom roles arrive in v0.2 along with SSO-backed
            invitations. For now this view is read-only.
          </p>
        </div>
        <button
          type="button"
          disabled
          className="inline-flex h-9 shrink-0 items-center rounded-md border border-dashed border-[color:var(--color-border)] px-3 text-[13px] font-medium text-[color:var(--color-fg-subtle)]"
        >
          Invite user — v0.2
        </button>
      </header>

      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[color:var(--color-border)]">
        <table className="w-full text-[13.5px]">
          <thead className="bg-[color:var(--color-bg-sunken)] text-[11px] font-medium uppercase tracking-wider text-[color:var(--color-fg-subtle)]">
            <tr>
              <th className="px-4 py-2.5 text-left">User</th>
              <th className="px-4 py-2.5 text-left">Role</th>
              <th className="px-4 py-2.5 text-right">Last seen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[color:var(--color-border)]">
            {MOCK_USERS.map((u) => (
              <tr key={u.email} className="hover:bg-[color:var(--color-bg-sunken)]">
                <td className="px-4 py-3">
                  <Link
                    href={`/users/${u.id}`}
                    className="font-medium hover:underline"
                  >
                    {u.name}
                  </Link>
                  <div className="font-mono text-[11.5px] text-[color:var(--color-fg-subtle)]">
                    {u.email}{u.team ? ` · ${u.team}` : ""}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={ROLE_STYLE[u.role as keyof typeof ROLE_STYLE]}>{u.role}</Badge>
                </td>
                <td className="px-4 py-3 text-right font-mono text-[11.5px] text-[color:var(--color-fg-subtle)]">
                  {formatRelative(u.lastSeen)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
