/**
 * Air-gap posture.
 *
 * When `ATRIUM_ALLOW_EXTERNAL_FETCH=false`, the server refuses any outbound
 * fetch that hasn't been explicitly allow-listed. Ingest still runs — but
 * only against sources the admin has pre-approved for inbound pulls, not
 * arbitrary URLs submitted via /admin/sources/new.
 *
 * Rationale: a regulated org points Atrium at an internal git mirror +
 * internal artifact storage, sets this flag, and from then on the registry
 * makes zero outbound calls. Clients (Claude Code, Codex, etc.) get their
 * plugins from Atrium's mirrored artifacts at `/mkt/plugins/<slug>/<ver>.tar.gz`.
 *
 * This module returns the current posture + helpers for guards.
 */

export type AirgapMode = "open" | "allowlist" | "strict";

export function getAirgapMode(): AirgapMode {
  const raw = (process.env.ATRIUM_AIRGAP ?? "").toLowerCase();
  if (raw === "strict") return "strict";
  if (raw === "allowlist") return "allowlist";
  // Legacy flag compatibility: ATRIUM_ALLOW_EXTERNAL_FETCH=false maps to strict.
  if ((process.env.ATRIUM_ALLOW_EXTERNAL_FETCH ?? "true").toLowerCase() === "false") {
    return "strict";
  }
  return "open";
}

export function getAllowedHosts(): string[] {
  const raw = process.env.ATRIUM_ALLOWED_HOSTS ?? "";
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Predicate used by every ingest adapter before opening a network connection.
 * Throws a helpful error if the destination isn't permitted in the current
 * air-gap mode.
 */
export function assertOutboundAllowed(url: string): void {
  const mode = getAirgapMode();
  if (mode === "open") return;

  let host: string;
  try {
    host = new URL(url).host;
  } catch {
    throw new Error(`air-gap: refused invalid URL: ${url}`);
  }

  if (mode === "strict") {
    throw new Error(
      `air-gap (strict): outbound fetch to ${host} blocked. Set ATRIUM_AIRGAP=open or add to ATRIUM_ALLOWED_HOSTS.`,
    );
  }

  // allowlist mode
  const allowed = getAllowedHosts();
  if (allowed.length === 0) {
    throw new Error(
      `air-gap (allowlist): ATRIUM_ALLOWED_HOSTS is empty but fetch to ${host} was attempted.`,
    );
  }
  const ok = allowed.some((h) => host === h || host.endsWith(`.${h}`));
  if (!ok) {
    throw new Error(
      `air-gap (allowlist): ${host} is not in ATRIUM_ALLOWED_HOSTS (${allowed.join(", ")}).`,
    );
  }
}

export function describeAirgap(): {
  mode: AirgapMode;
  allowedHosts: string[];
  humanSummary: string;
} {
  const mode = getAirgapMode();
  const allowedHosts = getAllowedHosts();
  let humanSummary = "";
  if (mode === "open") {
    humanSummary = "Atrium may fetch from any public URL. Standard posture for internal networks behind SSO.";
  } else if (mode === "strict") {
    humanSummary =
      "Atrium refuses all outbound fetches. Ingest must go through pre-registered local sources only.";
  } else {
    humanSummary = `Atrium only fetches from hosts in the allow-list (${allowedHosts.length} entries).`;
  }
  return { mode, allowedHosts, humanSummary };
}
