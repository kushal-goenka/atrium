"use client";

import { useState, useTransition } from "react";
import { Badge } from "./badge";
import {
  applyCurationAction,
  suggestCurationAction,
} from "@/app/plugins/[slug]/curation-actions";

interface Suggestion {
  category: string;
  keywords: string[];
  rationale: string;
  provider: string;
  model: string;
}

const CATEGORIES = [
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
];

export function CurationPanel({
  pluginSlug,
  currentCategory,
  currentKeywords,
}: {
  pluginSlug: string;
  currentCategory: string;
  currentKeywords: string[];
}) {
  const [pending, startTransition] = useTransition();
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<string>(currentCategory);
  const [keywords, setKeywords] = useState<string[]>(currentKeywords);
  const [keywordInput, setKeywordInput] = useState("");
  const [applied, setApplied] = useState(false);

  const dirty = category !== currentCategory || !arrEq(keywords, currentKeywords);

  function runSuggest() {
    setError(null);
    setApplied(false);
    startTransition(async () => {
      const res = await suggestCurationAction(pluginSlug);
      if (res.ok && res.category && res.keywords) {
        const next: Suggestion = {
          category: res.category,
          keywords: res.keywords,
          rationale: res.rationale ?? "",
          provider: res.provider ?? "unknown",
          model: res.model ?? "unknown",
        };
        setSuggestion(next);
        setCategory(next.category);
        setKeywords(next.keywords);
      } else {
        setError(res.error ?? "unknown error");
      }
    });
  }

  function acceptCurrent() {
    setError(null);
    startTransition(async () => {
      const res = await applyCurationAction(pluginSlug, category, keywords);
      if (res.ok) {
        setApplied(true);
        setSuggestion(null);
      } else {
        setError(res.error ?? "failed to save");
      }
    });
  }

  function addKeyword() {
    const trimmed = keywordInput.trim().toLowerCase();
    if (!trimmed || keywords.includes(trimmed) || keywords.length >= 8) return;
    setKeywords([...keywords, trimmed]);
    setKeywordInput("");
  }

  function removeKeyword(k: string) {
    setKeywords(keywords.filter((x) => x !== k));
  }

  return (
    <div className="rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[color:var(--color-bg-elev)] p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-[13px] font-semibold tracking-tight">Curation</h2>
        <Badge variant={suggestion ? "info" : "neutral"}>
          {suggestion ? `${suggestion.provider}` : "Category + tags"}
        </Badge>
      </div>

      <p className="mt-1 text-[12px] text-[color:var(--color-fg-muted)]">
        {suggestion
          ? suggestion.rationale
          : "Ask the configured LLM to suggest a category and search tags. You can edit before applying."}
      </p>

      <div className="mt-4 space-y-3">
        <div>
          <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-[color:var(--color-fg-subtle)]">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="h-9 w-full rounded-[var(--radius)] border border-[color:var(--color-border)] bg-[color:var(--color-bg-elev)] px-2 text-[13px] focus:border-[color:var(--color-border-strong)] focus:outline-none"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-[color:var(--color-fg-subtle)]">
            Tags
          </label>
          <div className="flex flex-wrap items-center gap-1.5 rounded-[var(--radius)] border border-[color:var(--color-border)] bg-[color:var(--color-bg-sunken)] p-2">
            {keywords.map((k) => (
              <span
                key={k}
                className="inline-flex items-center gap-1 rounded-full bg-[color:var(--color-accent-soft)] px-2 py-0.5 font-mono text-[11px] text-[color:var(--color-accent)]"
              >
                {k}
                <button
                  type="button"
                  onClick={() => removeKeyword(k)}
                  className="hover:text-[color:var(--color-danger)]"
                  aria-label={`remove ${k}`}
                >
                  ×
                </button>
              </span>
            ))}
            <input
              type="text"
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addKeyword();
                }
              }}
              placeholder={keywords.length >= 8 ? "max 8" : "add tag…"}
              disabled={keywords.length >= 8}
              className="min-w-[80px] flex-1 bg-transparent text-[12px] outline-none placeholder:text-[color:var(--color-fg-subtle)]"
            />
          </div>
        </div>
      </div>

      {error ? (
        <p className="mt-3 text-[12px] text-[color:var(--color-danger)]">{error}</p>
      ) : null}
      {applied ? (
        <p className="mt-3 text-[12px] text-[color:var(--color-ok)]">
          ✓ Override saved. Catalog will refresh.
        </p>
      ) : null}

      <div className="mt-4 flex items-center gap-2 border-t border-[color:var(--color-border)] pt-3">
        <button
          type="button"
          onClick={runSuggest}
          disabled={pending}
          className="inline-flex h-8 items-center rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-bg-elev)] px-2.5 text-[12px] font-medium hover:border-[color:var(--color-border-strong)] disabled:opacity-60"
        >
          {pending ? "Thinking…" : suggestion ? "Re-suggest" : "✨ Suggest"}
        </button>
        <button
          type="button"
          onClick={acceptCurrent}
          disabled={pending || !dirty}
          className="inline-flex h-8 items-center rounded-md bg-[color:var(--color-accent)] px-2.5 text-[12px] font-medium text-[color:var(--color-accent-fg)] disabled:opacity-60"
        >
          Apply override
        </button>
      </div>
    </div>
  );
}

function arrEq(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}
