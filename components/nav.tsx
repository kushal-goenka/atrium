import Link from "next/link";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";
import { getBranding } from "@/lib/branding";

export function Nav() {
  const brand = getBranding();

  return (
    <header className="sticky top-0 z-30 border-b border-[color:var(--color-border)] bg-[color:var(--color-bg)]/80 backdrop-blur">
      <div className="mx-auto flex max-w-[1200px] items-center gap-6 px-6 py-3.5">
        <Link href="/" className="flex items-center gap-2 rounded-md">
          <Logo size={24} showWordmark={!brand.orgLogoUrl} />
          {brand.orgLogoUrl ? (
            <>
              <span className="text-[color:var(--color-fg-subtle)]">·</span>
              {/* Org logo: next/image skipped since operators may point at external SVGs. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={brand.orgLogoUrl}
                alt={brand.orgName}
                className="h-5 max-w-[120px] object-contain"
              />
            </>
          ) : brand.orgShortName !== "Your org" ? (
            <>
              <span className="text-[color:var(--color-fg-subtle)]">·</span>
              <span className="text-[13.5px] font-medium text-[color:var(--color-fg-muted)]">
                {brand.orgShortName}
              </span>
            </>
          ) : null}
        </Link>

        <nav className="flex items-center gap-1 text-[13.5px] text-[color:var(--color-fg-muted)]">
          <Link
            href="/"
            className="rounded-md px-2.5 py-1.5 font-medium hover:bg-[color:var(--color-bg-sunken)] hover:text-[color:var(--color-fg)]"
          >
            Browse
          </Link>
          <Link
            href="/sources"
            className="rounded-md px-2.5 py-1.5 font-medium hover:bg-[color:var(--color-bg-sunken)] hover:text-[color:var(--color-fg)]"
          >
            Sources
          </Link>
          <Link
            href="/admin"
            className="rounded-md px-2.5 py-1.5 font-medium hover:bg-[color:var(--color-bg-sunken)] hover:text-[color:var(--color-fg)]"
          >
            Admin
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <ThemeToggle />
          <a
            href="https://github.com/kushal-goenka/atrium#readme"
            className="hidden text-[13.5px] font-medium text-[color:var(--color-fg-muted)] hover:text-[color:var(--color-fg)] sm:inline"
          >
            Docs
          </a>
          <a
            href="https://github.com/kushal-goenka/atrium"
            className="text-[13.5px] font-medium text-[color:var(--color-fg-muted)] hover:text-[color:var(--color-fg)]"
          >
            GitHub
          </a>
        </div>
      </div>
    </header>
  );
}
