"use client";

import { useState, useTransition } from "react";
import { createTokenAction } from "./actions";

type State =
  | { kind: "idle" }
  | { kind: "issued"; token: string; name: string }
  | { kind: "error"; message: string };

export function TokenCreator() {
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<State>({ kind: "idle" });
  const [copied, setCopied] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await createTokenAction(form);
      if (res.ok && res.token) {
        setState({ kind: "issued", token: res.token, name: res.name ?? "" });
      } else {
        setState({ kind: "error", message: res.error ?? "failed" });
      }
    });
  }

  async function copyToken() {
    if (state.kind !== "issued") return;
    try {
      await navigator.clipboard.writeText(state.token);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* silent */
    }
  }

  if (state.kind === "issued") {
    return (
      <div className="rounded-[var(--radius-lg)] border border-[color:var(--color-ok)]/30 bg-[color:var(--color-ok)]/5 p-5">
        <h3 className="text-[13px] font-semibold text-[color:var(--color-ok)]">
          ✓ Token issued: {state.name}
        </h3>
        <p className="mt-1 text-[12px] text-[color:var(--color-fg-muted)]">
          Copy it now — we don&apos;t store the plaintext. Use it as{" "}
          <code className="font-mono text-[11.5px]">Authorization: Bearer &lt;token&gt;</code>.
        </p>
        <div className="mt-3 flex items-center gap-2 rounded-[var(--radius)] border border-[color:var(--color-border)] bg-[color:var(--color-bg-sunken)] px-3 py-2">
          <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap font-mono text-[12px] text-[color:var(--color-fg)]">
            {state.token}
          </code>
          <button
            type="button"
            onClick={copyToken}
            className="shrink-0 rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-bg-elev)] px-2.5 py-1 text-[11.5px] font-medium hover:border-[color:var(--color-border-strong)]"
          >
            {copied ? "copied" : "copy"}
          </button>
        </div>
        <button
          type="button"
          onClick={() => setState({ kind: "idle" })}
          className="mt-3 text-[11.5px] text-[color:var(--color-fg-muted)] hover:text-[color:var(--color-fg)]"
        >
          Issue another
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4 rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[color:var(--color-bg-elev)] p-5"
    >
      {state.kind === "error" ? (
        <div className="rounded-[var(--radius)] border border-[color:var(--color-danger)]/30 bg-[color:var(--color-danger)]/10 px-3 py-2 text-[12.5px] text-[color:var(--color-danger)]">
          {state.message}
        </div>
      ) : null}

      <label className="block">
        <span className="mb-1 block text-[13px] font-medium">Name</span>
        <input
          name="name"
          type="text"
          required
          placeholder="ci-catalog-sync"
          className="h-10 w-full rounded-[var(--radius)] border border-[color:var(--color-border)] bg-[color:var(--color-bg-elev)] px-3 font-mono text-[13px] focus:border-[color:var(--color-border-strong)] focus:outline-none"
        />
      </label>

      <fieldset>
        <legend className="mb-2 text-[13px] font-medium">Scopes</legend>
        <div className="space-y-1.5 text-[12.5px]">
          <label className="flex items-center gap-2">
            <input type="checkbox" name="scope:read:catalog" defaultChecked className="accent-[color:var(--color-accent)]" />
            <code className="font-mono text-[12px]">read:catalog</code>
            <span className="text-[color:var(--color-fg-subtle)]">— list/detail plugins, sources, metrics</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="scope:write:sources" className="accent-[color:var(--color-accent)]" />
            <code className="font-mono text-[12px]">write:sources</code>
            <span className="text-[color:var(--color-fg-subtle)]">— create sources</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="scope:write:plugins" className="accent-[color:var(--color-accent)]" />
            <code className="font-mono text-[12px]">write:plugins</code>
            <span className="text-[color:var(--color-fg-subtle)]">— approve/quarantine/override</span>
          </label>
        </div>
      </fieldset>

      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-10 items-center rounded-md bg-[color:var(--color-accent)] px-4 text-[13.5px] font-medium text-[color:var(--color-accent-fg)] disabled:opacity-60"
      >
        {pending ? "Issuing…" : "Issue token"}
      </button>
    </form>
  );
}
