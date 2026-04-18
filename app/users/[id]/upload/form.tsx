"use client";

import { useActionState } from "react";
import { uploadSkillAction, type UploadSkillState } from "./actions";

const INITIAL: UploadSkillState = { ok: false };

export function UploadSkillForm({
  targetUserId,
  uploaderName,
}: {
  targetUserId: string;
  uploaderName: string;
}) {
  const [state, formAction, pending] = useActionState(uploadSkillAction, INITIAL);

  return (
    <form action={formAction} className="mt-8 space-y-5">
      <input type="hidden" name="targetUserId" value={targetUserId} />

      {state.error ? (
        <div className="rounded-[var(--radius)] border border-[color:var(--color-danger)]/30 bg-[color:var(--color-danger)]/10 px-3 py-2 text-[13px] text-[color:var(--color-danger)]">
          {state.error}
        </div>
      ) : null}

      <Field label="Skill name" error={state.fieldErrors?.name}>
        <input
          name="name"
          type="text"
          required
          maxLength={80}
          placeholder="PR summary"
          className="h-10 w-full rounded-[var(--radius)] border border-[color:var(--color-border)] bg-[color:var(--color-bg-elev)] px-3 text-[14px] focus:border-[color:var(--color-border-strong)] focus:outline-none"
        />
      </Field>

      <Field
        label="Short description"
        error={state.fieldErrors?.description}
        hint="One sentence on what it does. Shown in search."
      >
        <input
          name="description"
          type="text"
          required
          maxLength={400}
          placeholder="Walks a PR diff and produces a 3-bullet summary for the description field."
          className="h-10 w-full rounded-[var(--radius)] border border-[color:var(--color-border)] bg-[color:var(--color-bg-elev)] px-3 text-[14px] focus:border-[color:var(--color-border-strong)] focus:outline-none"
        />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Category" error={state.fieldErrors?.category}>
          <select
            name="category"
            defaultValue="writing"
            className="h-10 w-full rounded-[var(--radius)] border border-[color:var(--color-border)] bg-[color:var(--color-bg-elev)] px-3 text-[14px] focus:border-[color:var(--color-border-strong)] focus:outline-none"
          >
            {[
              "productivity",
              "data",
              "devops",
              "security",
              "design",
              "writing",
              "research",
              "ops",
              "finance",
              "sales",
              "other",
            ].map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Tags" hint="Comma-separated (AI can suggest more later).">
          <input
            name="keywords"
            type="text"
            maxLength={200}
            placeholder="summary, github, review"
            className="h-10 w-full rounded-[var(--radius)] border border-[color:var(--color-border)] bg-[color:var(--color-bg-elev)] px-3 font-mono text-[13px] focus:border-[color:var(--color-border-strong)] focus:outline-none"
          />
        </Field>
      </div>

      <Field
        label="SKILL.md body"
        error={state.fieldErrors?.body}
        hint="Markdown. This is what the agent reads when your skill activates."
      >
        <textarea
          name="body"
          required
          minLength={40}
          maxLength={40000}
          rows={12}
          placeholder={`# ${uploaderName}'s PR summary skill\n\nWhen the user asks "summarize this PR", walk the diff, identify the top 3 structural changes, and write bullets suitable for the PR description field.\n\nAvoid commenting on style nits.`}
          className="w-full rounded-[var(--radius)] border border-[color:var(--color-border)] bg-[color:var(--color-bg-elev)] p-3 font-mono text-[12.5px] leading-relaxed focus:border-[color:var(--color-border-strong)] focus:outline-none"
        />
      </Field>

      <div className="flex items-center gap-3 border-t border-[color:var(--color-border)] pt-4">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-10 items-center rounded-md bg-[color:var(--color-accent)] px-4 text-[13.5px] font-medium text-[color:var(--color-accent-fg)] disabled:opacity-60"
        >
          {pending ? "Uploading…" : "Submit for review"}
        </button>
        <span className="text-[11.5px] text-[color:var(--color-fg-subtle)]">
          Lands in quarantine. A curator reviews before it appears in the catalog.
        </span>
      </div>
    </form>
  );
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-1 flex items-baseline justify-between gap-3">
        <span className="text-[13px] font-medium">{label}</span>
        {hint ? (
          <span className="text-[11.5px] text-[color:var(--color-fg-subtle)]">{hint}</span>
        ) : null}
      </div>
      {children}
      {error ? (
        <p className="mt-1 text-[12px] text-[color:var(--color-danger)]">{error}</p>
      ) : null}
    </label>
  );
}
