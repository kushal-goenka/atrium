"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type Mode = "light" | "dark" | "system";

const KEY = "atrium:theme";

/**
 * Applies the effective theme class to <html>.
 * Runs before React hydrates via the inline script in app/layout.tsx, and
 * again here when the user flips the toggle.
 */
function apply(mode: Mode) {
  const root = document.documentElement;
  if (mode === "system") {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    root.classList.toggle("dark", prefersDark);
  } else {
    root.classList.toggle("dark", mode === "dark");
  }
}

export function ThemeToggle() {
  const [mode, setMode] = useState<Mode>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = (localStorage.getItem(KEY) as Mode | null) ?? "system";
    setMode(saved);
    setMounted(true);

    if (saved === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const onChange = () => apply("system");
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    }
  }, []);

  function pick(next: Mode) {
    setMode(next);
    localStorage.setItem(KEY, next);
    apply(next);
  }

  return (
    <div
      role="group"
      aria-label="Theme"
      className="relative inline-flex items-center rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-bg-elev)] p-0.5"
    >
      {(["light", "system", "dark"] as const).map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => pick(m)}
          aria-label={`Theme: ${m}`}
          aria-pressed={mounted && mode === m}
          className={cn(
            "relative grid h-7 w-7 place-items-center rounded-full transition-colors",
            mounted && mode === m
              ? "bg-[color:var(--color-bg-sunken)] text-[color:var(--color-fg)]"
              : "text-[color:var(--color-fg-subtle)] hover:text-[color:var(--color-fg-muted)]",
          )}
        >
          {m === "light" ? <Sun /> : m === "dark" ? <Moon /> : <System />}
        </button>
      ))}
    </div>
  );
}

function Sun() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function Moon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function System() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="3" y="4" width="18" height="14" rx="2" />
      <path d="M8 20h8M12 18v2" />
    </svg>
  );
}
