"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import type { Plugin, PluginCategory, Source } from "@/lib/types";
import { PluginCard } from "./plugin-card";
import { cn } from "@/lib/utils";

type Props = {
  plugins: Plugin[];
  sources: Source[];
};

type Filter = "all" | PluginCategory;

const categoryLabels: Record<Filter, string> = {
  all: "All",
  productivity: "Productivity",
  data: "Data",
  devops: "DevOps",
  security: "Security",
  design: "Design",
  writing: "Writing",
  research: "Research",
  ops: "Ops",
  finance: "Finance",
  sales: "Sales",
  other: "Other",
};

function parseCategory(v: string | null): Filter {
  if (!v) return "all";
  if (v === "all" || (categoryLabels as Record<string, string>)[v]) return v as Filter;
  return "all";
}

export function Catalog({ plugins, sources }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const initialQuery = searchParams.get("q") ?? "";
  const initialCategory = parseCategory(searchParams.get("category"));
  const initialSource = searchParams.get("source") ?? "all";

  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState<Filter>(initialCategory);
  const [sourceId, setSourceId] = useState<string | "all">(initialSource);

  // Debounced URL sync: write the current filter state to the URL ~250ms after
  // the user stops typing. Avoids a navigation on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => {
      const next = new URLSearchParams();
      if (query) next.set("q", query);
      if (category !== "all") next.set("category", category);
      if (sourceId !== "all") next.set("source", sourceId);
      const search = next.toString();
      const href = search ? `${pathname}?${search}` : pathname;
      startTransition(() => router.replace(href, { scroll: false }));
    }, 250);
    return () => clearTimeout(t);
    // Don't depend on router/pathname — they're stable across renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, category, sourceId]);

  const categories = useMemo<Filter[]>(() => {
    const set = new Set<Filter>(["all"]);
    plugins.forEach((p) => set.add(p.category));
    return Array.from(set);
  }, [plugins]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return plugins.filter((p) => {
      if (category !== "all" && p.category !== category) return false;
      if (sourceId !== "all" && p.sourceId !== sourceId) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.keywords.some((k) => k.toLowerCase().includes(q)) ||
        p.author.name.toLowerCase().includes(q) ||
        p.commands.some((c) => c.name.toLowerCase().includes(q))
      );
    });
  }, [plugins, query, category, sourceId]);

  const sourceMap = useMemo(() => new Map(sources.map((s) => [s.id, s])), [sources]);

  function reset() {
    setQuery("");
    setCategory("all");
    setSourceId("all");
  }

  const hasActiveFilters = query !== "" || category !== "all" || sourceId !== "all";

  return (
    <div>
      <div className="flex flex-col gap-3">
        <div className="relative">
          <svg
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[color:var(--color-fg-subtle)]"
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden
          >
            <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
            <path d="m13 13-2.5-2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            id="catalog-search"
            name="q"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search plugins, commands, authors…"
            aria-label="Search plugins"
            className="h-11 w-full rounded-[var(--radius)] border border-[color:var(--color-border)] bg-[color:var(--color-bg-elev)] pl-10 pr-4 text-[14px] text-[color:var(--color-fg)] placeholder:text-[color:var(--color-fg-subtle)] focus:border-[color:var(--color-border-strong)] focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={cn(
                "h-8 rounded-full border px-3 text-[12.5px] font-medium transition-colors",
                category === c
                  ? "border-[color:var(--color-accent)] bg-[color:var(--color-accent-soft)] text-[color:var(--color-accent)]"
                  : "border-[color:var(--color-border)] bg-[color:var(--color-bg-elev)] text-[color:var(--color-fg-muted)] hover:border-[color:var(--color-border-strong)] hover:text-[color:var(--color-fg)]",
              )}
            >
              {categoryLabels[c]}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2">
            <label
              htmlFor="source-filter"
              className="text-[12px] text-[color:var(--color-fg-subtle)]"
            >
              Source
            </label>
            <select
              id="source-filter"
              value={sourceId}
              onChange={(e) => setSourceId(e.target.value as typeof sourceId)}
              className="h-8 rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-bg-elev)] px-2 text-[12.5px] text-[color:var(--color-fg-muted)] focus:border-[color:var(--color-border-strong)] focus:outline-none"
            >
              <option value="all">All sources</option>
              {sources.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between text-[12.5px] text-[color:var(--color-fg-subtle)]">
        <span>
          <span className="font-mono text-[color:var(--color-fg-muted)]">{filtered.length}</span>{" "}
          {filtered.length === 1 ? "plugin" : "plugins"}
          {query ? (
            <>
              {" "}matching{" "}
              <em className="not-italic text-[color:var(--color-fg-muted)]">&ldquo;{query}&rdquo;</em>
            </>
          ) : null}
        </span>
        {hasActiveFilters ? (
          <button
            type="button"
            onClick={reset}
            className="font-medium text-[color:var(--color-fg-muted)] hover:text-[color:var(--color-fg)] hover:underline"
          >
            Clear filters
          </button>
        ) : null}
      </div>

      {filtered.length === 0 ? (
        <div className="mt-8 rounded-[var(--radius)] border border-dashed border-[color:var(--color-border-strong)] px-8 py-16 text-center text-[color:var(--color-fg-subtle)]">
          No plugins match those filters yet.
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p) => (
            <PluginCard key={p.slug} plugin={p} source={sourceMap.get(p.sourceId)} />
          ))}
        </div>
      )}
    </div>
  );
}
