import type { Metadata } from "next";
import { Nav } from "@/components/nav";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "atrium — the open plugin registry for AI agents",
    template: "%s · atrium",
  },
  description:
    "Self-host your own plugin marketplace. Federate from others. Audit everything. Atrium is an open-source control plane for Claude Code plugins and skills.",
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
  },
  openGraph: {
    title: "atrium",
    description: "The open plugin registry for AI agents.",
    type: "website",
  },
};

// Resolves the saved theme and applies the .dark class before React hydrates.
// Keeps the dark default if nothing is saved (matches our alpha design).
const THEME_INIT_SCRIPT = `
(() => {
  try {
    const saved = localStorage.getItem("atrium:theme") || "dark";
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const dark = saved === "dark" || (saved === "system" && mql.matches);
    document.documentElement.classList.toggle("dark", dark);
  } catch {}
})();
`.trim();

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning lets the theme init script set the .dark class
    // before React hydrates without React flagging it as a mismatch.
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-dvh antialiased">
        <Nav />
        <main className="mx-auto max-w-[1200px] px-6 py-10">{children}</main>
        <footer className="mx-auto max-w-[1200px] px-6 py-8 text-[13px] text-[color:var(--color-fg-subtle)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[color:var(--color-border)] pt-6">
            <span>atrium · Apache 2.0 · self-hostable</span>
            <span className="font-mono">v0.1.0-alpha</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
