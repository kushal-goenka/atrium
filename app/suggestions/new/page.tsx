import Link from "next/link";
import { NewSuggestionForm } from "./form";

export const metadata = { title: "New suggestion" };
export const dynamic = "force-dynamic";

export default function NewSuggestionPage() {
  return (
    <div>
      <Link
        href="/suggestions"
        className="inline-flex items-center gap-1.5 text-[12.5px] text-[color:var(--color-fg-subtle)] hover:text-[color:var(--color-fg-muted)]"
      >
        ← Back to suggestions
      </Link>

      <div className="mt-4 max-w-[640px]">
        <p className="text-[11.5px] font-mono uppercase tracking-[0.08em] text-[color:var(--color-fg-subtle)]">
          Capability wishlist · new
        </p>
        <h1 className="mt-2 text-[24px] font-semibold tracking-tight">
          What should an agent do better?
        </h1>
        <p className="mt-1 text-[13.5px] text-[color:var(--color-fg-muted)]">
          Concrete beats vague. &ldquo;Add an MCP server for our internal Linear&rdquo; beats
          &ldquo;more integrations.&rdquo; &ldquo;A skill that rewrites SQL against our warehouse
          schema&rdquo; beats &ldquo;help with data.&rdquo;
        </p>

        <NewSuggestionForm />
      </div>
    </div>
  );
}
