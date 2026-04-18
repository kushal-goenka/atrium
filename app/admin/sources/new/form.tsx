"use client";

import { useActionState, useState } from "react";
import { createSourceAction, type CreateSourceState } from "../actions";

const INITIAL: CreateSourceState = { ok: false };

export function AddSourceForm() {
  const [state, formAction, pending] = useActionState(createSourceAction, INITIAL);
  const [kind, setKind] = useState<"git" | "http" | "local">("git");

  return (
    <form action={formAction} className="mt-8 space-y-6">
      {state.error ? (
        <div className="rounded-[var(--radius)] border border-[color:var(--color-danger)]/30 bg-[color:var(--color-danger)]/10 px-3 py-2 text-[13px] text-[color:var(--color-danger)]">
          {state.error}
        </div>
      ) : null}

      <Field label="Name" hint="Human-readable. We derive a URL-safe key from this.">
        <input
          name="name"
          type="text"
          required
          placeholder="Acme Data Platform plugins"
          className="h-10 w-full rounded-[var(--radius)] border border-[color:var(--color-border)] bg-[color:var(--color-bg-elev)] px-3 text-[14px] focus:border-[color:var(--color-border-strong)] focus:outline-none"
        />
        {state.fieldErrors?.name ? <ErrorLine>{state.fieldErrors.name}</ErrorLine> : null}
      </Field>

      <Field label="Kind" hint="Where atrium pulls the marketplace.json from.">
        <div className="flex flex-wrap gap-1.5">
          {(["git", "http", "local"] as const).map((k) => (
            <label
              key={k}
              className={`cursor-pointer rounded-full border px-3 py-1.5 text-[12.5px] font-medium ${
                kind === k
                  ? "border-[color:var(--color-accent)] bg-[color:var(--color-accent-soft)] text-[color:var(--color-accent)]"
                  : "border-[color:var(--color-border)] bg-[color:var(--color-bg-elev)] text-[color:var(--color-fg-muted)] hover:border-[color:var(--color-border-strong)]"
              }`}
            >
              <input
                type="radio"
                name="kind"
                value={k}
                checked={kind === k}
                onChange={() => setKind(k)}
                className="sr-only"
              />
              {kind === k ? "● " : ""}{labels[k]}
            </label>
          ))}
        </div>
        {state.fieldErrors?.kind ? <ErrorLine>{state.fieldErrors.kind}</ErrorLine> : null}
      </Field>

      {kind !== "local" ? (
        <Field
          label={kind === "git" ? "Repository URL" : "Marketplace URL"}
          hint={
            kind === "git"
              ? "Public git repo containing .claude-plugin/marketplace.json"
              : "Raw URL to a marketplace.json"
          }
        >
          <input
            name="url"
            type="url"
            placeholder={
              kind === "git"
                ? "https://github.com/your-org/internal-plugins"
                : "https://example.com/marketplace.json"
            }
            className="h-10 w-full rounded-[var(--radius)] border border-[color:var(--color-border)] bg-[color:var(--color-bg-elev)] px-3 font-mono text-[13px] focus:border-[color:var(--color-border-strong)] focus:outline-none"
          />
          {state.fieldErrors?.url ? <ErrorLine>{state.fieldErrors.url}</ErrorLine> : null}
        </Field>
      ) : null}

      <Field
        label="Trust tier"
        hint="Affects the default policy state for plugins from this source."
      >
        <select
          name="trust"
          defaultValue="community"
          className="h-10 w-full rounded-[var(--radius)] border border-[color:var(--color-border)] bg-[color:var(--color-bg-elev)] px-3 text-[14px] focus:border-[color:var(--color-border-strong)] focus:outline-none"
        >
          <option value="official">Official — signed, first-party</option>
          <option value="verified">Verified — known maintainer</option>
          <option value="community">Community — open source, unreviewed</option>
          <option value="internal">Internal — your organization</option>
        </select>
        {state.fieldErrors?.trust ? <ErrorLine>{state.fieldErrors.trust}</ErrorLine> : null}
      </Field>

      <div className="flex items-center gap-3 border-t border-[color:var(--color-border)] pt-6">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-10 items-center rounded-md bg-[color:var(--color-accent)] px-4 text-[13.5px] font-medium text-[color:var(--color-accent-fg)] disabled:opacity-60"
        >
          {pending ? "Adding…" : "Add source"}
        </button>
        <a
          href="/admin"
          className="text-[13px] text-[color:var(--color-fg-muted)] hover:text-[color:var(--color-fg)]"
        >
          Cancel
        </a>
        <span className="ml-auto text-[11.5px] text-[color:var(--color-fg-subtle)]">
          New plugins quarantine by default.
        </span>
      </div>
    </form>
  );
}

const labels = {
  git: "Git repo",
  http: "HTTP URL",
  local: "Local upload",
};

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  // Wrapping the input in the label gives it an accessible name without needing
  // an explicit htmlFor/id pairing. For fieldset-shaped groups (radios) we use
  // aria-label on the group instead; see the radio block above.
  return (
    <label className="block">
      <div className="mb-1 flex items-baseline justify-between gap-3">
        <span className="text-[13px] font-medium text-[color:var(--color-fg)]">{label}</span>
        {hint ? (
          <span className="text-[11.5px] text-[color:var(--color-fg-subtle)]">{hint}</span>
        ) : null}
      </div>
      {children}
    </label>
  );
}

function ErrorLine({ children }: { children: React.ReactNode }) {
  return <p className="mt-1 text-[12px] text-[color:var(--color-danger)]">{children}</p>;
}
