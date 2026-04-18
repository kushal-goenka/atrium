"use client";

import { useActionState } from "react";
import { createSuggestionAction, type CreateSuggestionState } from "../actions";

const INITIAL: CreateSuggestionState = { ok: false };

export function NewSuggestionForm() {
  const [state, formAction, pending] = useActionState(createSuggestionAction, INITIAL);

  return (
    <form action={formAction} className="mt-8 space-y-5">
      {state.error ? (
        <div className="rounded-[var(--radius)] border border-[color:var(--color-danger)]/30 bg-[color:var(--color-danger)]/10 px-3 py-2 text-[13px] text-[color:var(--color-danger)]">
          {state.error}
        </div>
      ) : null}

      <Field label="Title" error={state.fieldErrors?.title}>
        <input
          name="title"
          type="text"
          required
          maxLength={160}
          placeholder="Add a Snyk scanner plugin for DevSecOps workflows"
          className="h-10 w-full rounded-[var(--radius)] border border-[color:var(--color-border)] bg-[color:var(--color-bg-elev)] px-3 text-[14px] focus:border-[color:var(--color-border-strong)] focus:outline-none"
        />
      </Field>

      <Field
        label="Type"
        error={state.fieldErrors?.kind}
        hint="What do you wish an agent could do?"
      >
        <select
          name="kind"
          defaultValue="plugin-request"
          className="h-10 w-full rounded-[var(--radius)] border border-[color:var(--color-border)] bg-[color:var(--color-bg-elev)] px-3 text-[14px] focus:border-[color:var(--color-border-strong)] focus:outline-none"
        >
          <option value="plugin-request">Plugin request — a full plugin</option>
          <option value="skill-request">Skill request — a specific task-triggered skill</option>
          <option value="capability-gap">Capability gap — agents handle X poorly today</option>
          <option value="integration">Integration — connect to an MCP server / tool / service</option>
          <option value="general">Discussion — open-ended</option>
        </select>
      </Field>

      <Field label="Target provider" hint="If specific to one client, pick it here.">
        <select
          name="provider"
          defaultValue=""
          className="h-10 w-full rounded-[var(--radius)] border border-[color:var(--color-border)] bg-[color:var(--color-bg-elev)] px-3 text-[14px] focus:border-[color:var(--color-border-strong)] focus:outline-none"
        >
          <option value="">(any / not applicable)</option>
          <option value="claude-code">Claude Code</option>
          <option value="openai">OpenAI / ChatGPT</option>
          <option value="gemini">Gemini</option>
          <option value="mcp">MCP-generic</option>
          <option value="generic">Other agent framework</option>
        </select>
      </Field>

      <Field
        label="Details"
        error={state.fieldErrors?.body}
        hint="Markdown. Lead with what you'd do with it."
      >
        <textarea
          name="body"
          required
          minLength={10}
          maxLength={4000}
          rows={7}
          placeholder={`What task is the agent doing poorly today? What should it do instead?\n\nExamples:\n- "Claude can't summarize a Linear cycle well — a plugin could pull the cycle's issues + status and output a retro doc"\n- "Agents keep re-inventing SQL joins against our warehouse — a skill that injects our star-schema docs before any /sql call"\n- "Add an MCP server for our internal Slack; read-only is fine"`}
          className="w-full rounded-[var(--radius)] border border-[color:var(--color-border)] bg-[color:var(--color-bg-elev)] p-3 font-mono text-[13px] leading-relaxed focus:border-[color:var(--color-border-strong)] focus:outline-none"
        />
      </Field>

      <div className="flex items-center gap-3 border-t border-[color:var(--color-border)] pt-4">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-10 items-center rounded-md bg-[color:var(--color-accent)] px-4 text-[13.5px] font-medium text-[color:var(--color-accent-fg)] disabled:opacity-60"
        >
          {pending ? "Submitting…" : "Submit suggestion"}
        </button>
        <span className="text-[11.5px] text-[color:var(--color-fg-subtle)]">
          You&apos;ll automatically upvote your own suggestion.
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
