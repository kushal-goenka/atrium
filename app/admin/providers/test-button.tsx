"use client";

import { useState, useTransition } from "react";
import { testProviderAction } from "./actions";

type State =
  | { kind: "idle" }
  | { kind: "success"; sample: string }
  | { kind: "error"; message: string };

export function ProviderTestButton({ providerKey }: { providerKey: string }) {
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<State>({ kind: "idle" });

  function run() {
    setState({ kind: "idle" });
    startTransition(async () => {
      const result = await testProviderAction(providerKey);
      if (result.ok) {
        setState({ kind: "success", sample: result.sample ?? "" });
      } else {
        setState({ kind: "error", message: result.error ?? "unknown error" });
      }
      setTimeout(() => setState({ kind: "idle" }), 6000);
    });
  }

  return (
    <div className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={run}
        disabled={pending}
        className="inline-flex items-center rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-bg-elev)] px-2.5 py-1 text-[11.5px] font-medium hover:border-[color:var(--color-border-strong)] disabled:opacity-60"
      >
        {pending ? "Testing…" : "Test"}
      </button>
      {state.kind === "success" ? (
        <span className="text-[11px] text-[color:var(--color-ok)]">✓ {state.sample.slice(0, 30)}</span>
      ) : null}
      {state.kind === "error" ? (
        <span
          className="truncate text-[11px] text-[color:var(--color-danger)]"
          title={state.message}
        >
          ✕ {state.message.slice(0, 40)}
        </span>
      ) : null}
    </div>
  );
}
