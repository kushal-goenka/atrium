/**
 * Org-level branding for a self-hosted Atrium instance.
 *
 * All fields are read from env vars at request time. Operators can theme
 * their deployment without touching code — set `ATRIUM_ORG_*` variables
 * in their runtime environment.
 *
 * Logos: operators either set `ATRIUM_ORG_LOGO_URL` to a hosted SVG/PNG,
 * or drop a file at `public/brand/org-logo.svg` in their build and point
 * the env var at `/brand/org-logo.svg`. Either works.
 */
export interface Branding {
  /** Long-form org name. "Acme Corp, Inc." */
  orgName: string;
  /** Short display name used in the top nav. "Acme" */
  orgShortName: string;
  /** Homepage URL to link the org name to. */
  orgUrl?: string;
  /** URL (absolute or site-relative) to the org logo. */
  orgLogoUrl?: string;
  /** The hostname developers use for `/plugin marketplace add <this>`. */
  atriumHostname: string;
  /** Optional hex override for the accent color (keeps dark/light both). */
  accentHex?: string;
  /** Email address shown to users requesting plugin additions. */
  supportEmail?: string;
  /** GitHub issue URL (or any URL) devs can use to propose a plugin. */
  proposalUrl?: string;
}

const DEFAULT_BRANDING: Branding = {
  orgName: "Your Organization",
  orgShortName: "Your org",
  atriumHostname: "atrium.example.com",
};

export function getBranding(): Branding {
  const publicUrl = process.env.ATRIUM_PUBLIC_URL;
  const hostname = publicUrl
    ? publicUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")
    : DEFAULT_BRANDING.atriumHostname;

  return {
    orgName: process.env.ATRIUM_ORG_NAME || DEFAULT_BRANDING.orgName,
    orgShortName: process.env.ATRIUM_ORG_SHORT_NAME || process.env.ATRIUM_ORG_NAME || DEFAULT_BRANDING.orgShortName,
    orgUrl: process.env.ATRIUM_ORG_URL || undefined,
    orgLogoUrl: process.env.ATRIUM_ORG_LOGO_URL || undefined,
    atriumHostname: hostname,
    accentHex: process.env.ATRIUM_ACCENT_HEX || undefined,
    supportEmail: process.env.ATRIUM_SUPPORT_EMAIL || undefined,
    proposalUrl: process.env.ATRIUM_PROPOSAL_URL || undefined,
  };
}
