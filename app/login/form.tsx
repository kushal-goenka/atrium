"use client";

import { useState } from "react";

export function LoginForm({ nextPath }: { nextPath: string }) {
  const [pending, setPending] = useState(false);

  return (
    <form
      method="post"
      action="/api/login"
      className="mt-4 space-y-3"
      onSubmit={() => setPending(true)}
    >
      <input type="hidden" name="next" value={nextPath} />
      <label className="block">
        <span className="mb-1 block text-[12px] font-medium text-[color:var(--color-fg)]">
          Admin password
        </span>
        <input
          type="password"
          name="password"
          required
          autoFocus
          autoComplete="current-password"
          className="h-10 w-full rounded-[var(--radius)] border border-[color:var(--color-border)] bg-[color:var(--color-bg-elev)] px-3 font-mono text-[13px] focus:border-[color:var(--color-border-strong)] focus:outline-none"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-10 w-full items-center justify-center rounded-md bg-[color:var(--color-accent)] text-[13.5px] font-medium text-[color:var(--color-accent-fg)] disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
