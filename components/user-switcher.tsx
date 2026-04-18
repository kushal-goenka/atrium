"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import type { User } from "@/lib/users";
import { cn } from "@/lib/utils";

export function UserSwitcher({
  current,
  users,
}: {
  current: User;
  users: User[];
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-bg-elev)] py-1 pl-1 pr-2.5 hover:border-[color:var(--color-border-strong)]"
      >
        <Avatar user={current} />
        <span className="hidden text-[12.5px] font-medium text-[color:var(--color-fg-muted)] sm:inline">
          {current.name.split(" ")[0]}
        </span>
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-[280px] rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[color:var(--color-bg-elev)] p-1 shadow-lg">
          <div className="px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-[color:var(--color-fg-subtle)]">
            Acting as · demo switcher
          </div>
          <form action="/api/impersonate" method="post">
            <input type="hidden" name="redirectTo" value={pathname} />
            <ul className="max-h-[280px] overflow-y-auto">
              {users.map((u) => (
                <li key={u.id}>
                  <button
                    type="submit"
                    name="userId"
                    value={u.id}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-[color:var(--color-bg-sunken)]",
                      u.id === current.id ? "bg-[color:var(--color-bg-sunken)]" : "",
                    )}
                  >
                    <Avatar user={u} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-[12.5px] font-medium">{u.name}</span>
                        {u.id === current.id ? (
                          <span className="text-[10px] text-[color:var(--color-accent)]">✓</span>
                        ) : null}
                      </div>
                      <div className="truncate font-mono text-[11px] text-[color:var(--color-fg-subtle)]">
                        {u.email} · {u.role}
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </form>
          <div className="border-t border-[color:var(--color-border)] px-3 py-2 text-[11px] text-[color:var(--color-fg-subtle)]">
            <Link
              href={`/users/${current.id}`}
              className="font-medium hover:text-[color:var(--color-fg)]"
            >
              View your profile →
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Avatar({ user }: { user: User }) {
  const bg = colorFor(user.email);
  return (
    <span
      className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white"
      style={{ background: bg }}
    >
      {user.initials}
    </span>
  );
}

function colorFor(email: string): string {
  const palette = ["#b8562c", "#2a5d9f", "#14784a", "#a76a0a", "#7a2a9f", "#1f7a78"];
  let h = 0;
  for (let i = 0; i < email.length; i++) h = (h * 31 + email.charCodeAt(i)) >>> 0;
  return palette[h % palette.length]!;
}
