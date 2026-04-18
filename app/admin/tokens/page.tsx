import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/badge";
import { TokenCreator } from "./creator";
import { TokenRevokeButton } from "./revoke-button";
import { formatRelative } from "@/lib/utils";
import { findUser } from "@/lib/users";

export const metadata = { title: "API tokens" };
export const dynamic = "force-dynamic";

export default async function TokensPage() {
  const tokens = await prisma.apiToken.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <Link
        href="/admin"
        className="inline-flex items-center gap-1.5 text-[12.5px] text-[color:var(--color-fg-subtle)] hover:text-[color:var(--color-fg-muted)]"
      >
        ← Back to admin
      </Link>

      <header className="mt-4 mb-6 border-b border-[color:var(--color-border)] pb-6">
        <p className="text-[11.5px] font-mono uppercase tracking-[0.08em] text-[color:var(--color-fg-subtle)]">
          Admin · API tokens
        </p>
        <h1 className="mt-2 text-[24px] font-semibold tracking-tight">API tokens</h1>
        <p className="mt-1 max-w-2xl text-[13.5px] text-[color:var(--color-fg-muted)]">
          Bearer tokens for the public API at{" "}
          <code className="font-mono text-[12px]">/api/v1</code>. Tokens are hashed at rest
          (SHA-256); the plaintext is shown exactly once on creation. Scope the minimum
          capabilities each caller needs.
        </p>
        <p className="mt-2 text-[12.5px] text-[color:var(--color-fg-muted)]">
          See the spec at{" "}
          <a
            href="/api/v1/openapi.json"
            className="font-mono text-[color:var(--color-accent)] hover:underline"
          >
            /api/v1/openapi.json
          </a>
          .
        </p>
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
        <section>
          <h2 className="mb-3 text-[14px] font-semibold">Active tokens</h2>
          {tokens.length === 0 ? (
            <div className="rounded-[var(--radius-lg)] border border-dashed border-[color:var(--color-border-strong)] px-6 py-12 text-center text-[13px] text-[color:var(--color-fg-subtle)]">
              No tokens yet. Create one on the right to expose the API.
            </div>
          ) : (
            <ul className="space-y-3">
              {tokens.map((t) => {
                const scopes = t.scopes.split(",").map((s) => s.trim());
                const issuer = findUser(t.userId);
                const revoked = !!t.revokedAt;
                return (
                  <li
                    key={t.id}
                    className={`rounded-[var(--radius-lg)] border border-[color:var(--color-border)] p-4 ${
                      revoked
                        ? "bg-[color:var(--color-bg-sunken)] opacity-60"
                        : "bg-[color:var(--color-bg-elev)]"
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[14px] font-semibold">{t.name}</span>
                          {revoked ? <Badge variant="danger">Revoked</Badge> : null}
                          {!revoked && t.expiresAt && t.expiresAt < new Date() ? (
                            <Badge variant="warn">Expired</Badge>
                          ) : null}
                        </div>
                        <p className="mt-1 font-mono text-[11.5px] text-[color:var(--color-fg-subtle)]">
                          hash {t.tokenHash.slice(0, 12)}… · issued by{" "}
                          {issuer ? (
                            <Link
                              href={`/users/${issuer.id}`}
                              className="text-[color:var(--color-accent)] hover:underline"
                            >
                              {issuer.name}
                            </Link>
                          ) : (
                            t.userId
                          )}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          {scopes.map((s) => (
                            <Badge key={s}>{s}</Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 text-[11.5px] text-[color:var(--color-fg-subtle)]">
                        <span>created {formatRelative(t.createdAt.toISOString())}</span>
                        {t.lastUsedAt ? (
                          <span>last used {formatRelative(t.lastUsedAt.toISOString())}</span>
                        ) : (
                          <span className="italic">never used</span>
                        )}
                        {!revoked ? <TokenRevokeButton tokenId={t.id} /> : null}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <aside>
          <h2 className="mb-3 text-[14px] font-semibold">Issue a new token</h2>
          <TokenCreator />
        </aside>
      </div>
    </div>
  );
}
