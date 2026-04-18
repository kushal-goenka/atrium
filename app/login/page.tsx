import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthMode, isAdmin } from "@/lib/auth";
import { LoginForm } from "./form";

export const metadata = { title: "Log in" };
export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const mode = getAuthMode();
  const params = await searchParams;

  if (mode === "open") {
    redirect("/admin");
  }

  if (await isAdmin()) {
    redirect(params.next ?? "/admin");
  }

  return (
    <div className="mx-auto mt-12 max-w-[420px]">
      <div className="rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[color:var(--color-bg-elev)] p-6">
        <h1 className="text-[22px] font-semibold tracking-tight">Admin login</h1>
        <p className="mt-1 text-[13px] text-[color:var(--color-fg-muted)]">
          Atrium is running in{" "}
          <code className="font-mono text-[12px]">admin-password</code> mode. Browse is open to
          everyone; admin actions are gated.
        </p>

        {params.error ? (
          <div className="mt-4 rounded-[var(--radius)] border border-[color:var(--color-danger)]/30 bg-[color:var(--color-danger)]/10 px-3 py-2 text-[12.5px] text-[color:var(--color-danger)]">
            Invalid password.
          </div>
        ) : null}

        <LoginForm nextPath={params.next ?? "/admin"} />

        <p className="mt-4 text-[11.5px] text-[color:var(--color-fg-subtle)]">
          For full per-user auth (OIDC / SAML) switch to{" "}
          <code className="font-mono">ATRIUM_AUTH_MODE=sso</code> — arrives in v0.2.
        </p>
      </div>

      <p className="mt-6 text-center text-[12px] text-[color:var(--color-fg-subtle)]">
        <Link href="/" className="hover:text-[color:var(--color-fg-muted)]">
          ← Back to browse
        </Link>
      </p>
    </div>
  );
}
