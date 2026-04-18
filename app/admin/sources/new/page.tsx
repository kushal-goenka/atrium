import { AddSourceForm } from "./form";
import Link from "next/link";

export const metadata = { title: "Add source" };

export default function AddSourcePage() {
  return (
    <div>
      <Link
        href="/admin"
        className="inline-flex items-center gap-1.5 text-[12.5px] text-[color:var(--color-fg-subtle)] hover:text-[color:var(--color-fg-muted)]"
      >
        ← Back to admin
      </Link>

      <div className="mt-4 max-w-[640px]">
        <p className="text-[11.5px] font-mono uppercase tracking-[0.08em] text-[color:var(--color-fg-subtle)]">
          Admin · sources
        </p>
        <h1 className="mt-2 text-[24px] font-semibold tracking-tight">Add a source</h1>
        <p className="mt-1 text-[13.5px] text-[color:var(--color-fg-muted)]">
          Federate plugins from another Atrium-compatible marketplace. New plugins will start in
          quarantine and require curator approval before reaching developers.
        </p>

        <AddSourceForm />
      </div>
    </div>
  );
}
