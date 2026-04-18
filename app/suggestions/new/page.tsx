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
          Community · suggestions
        </p>
        <h1 className="mt-2 text-[24px] font-semibold tracking-tight">Propose something new</h1>
        <p className="mt-1 text-[13.5px] text-[color:var(--color-fg-muted)]">
          Specific is better than vague. &ldquo;Add a GitHub Issues plugin for Cursor&rdquo; beats
          &ldquo;more integrations.&rdquo;
        </p>

        <NewSuggestionForm />
      </div>
    </div>
  );
}
