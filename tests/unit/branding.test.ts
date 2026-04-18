import { beforeEach, describe, it, expect, afterEach } from "vitest";
import { getBranding } from "@/lib/branding";

const KEYS = [
  "ATRIUM_ORG_NAME",
  "ATRIUM_ORG_SHORT_NAME",
  "ATRIUM_ORG_URL",
  "ATRIUM_ORG_LOGO_URL",
  "ATRIUM_PUBLIC_URL",
  "ATRIUM_ACCENT_HEX",
  "ATRIUM_SUPPORT_EMAIL",
  "ATRIUM_PROPOSAL_URL",
] as const;

describe("getBranding", () => {
  const saved: Record<string, string | undefined> = {};

  beforeEach(() => {
    for (const k of KEYS) {
      saved[k] = process.env[k];
      delete process.env[k];
    }
  });

  afterEach(() => {
    for (const k of KEYS) {
      if (saved[k] !== undefined) process.env[k] = saved[k];
    }
  });

  it("falls back to generic defaults when no env vars are set", () => {
    const b = getBranding();
    expect(b.orgName).toBe("Your Organization");
    expect(b.orgShortName).toBe("Your org");
    expect(b.atriumHostname).toBe("atrium.example.com");
    expect(b.orgUrl).toBeUndefined();
    expect(b.orgLogoUrl).toBeUndefined();
    expect(b.accentHex).toBeUndefined();
  });

  it("honors ATRIUM_ORG_NAME and derives short name from it when short is not set", () => {
    process.env.ATRIUM_ORG_NAME = "Acme Corp";
    const b = getBranding();
    expect(b.orgName).toBe("Acme Corp");
    expect(b.orgShortName).toBe("Acme Corp");
  });

  it("prefers ATRIUM_ORG_SHORT_NAME when set", () => {
    process.env.ATRIUM_ORG_NAME = "Acme Corp, Inc.";
    process.env.ATRIUM_ORG_SHORT_NAME = "Acme";
    expect(getBranding().orgShortName).toBe("Acme");
  });

  it("derives hostname from ATRIUM_PUBLIC_URL stripping scheme and trailing slash", () => {
    process.env.ATRIUM_PUBLIC_URL = "https://atrium.acme.corp/";
    expect(getBranding().atriumHostname).toBe("atrium.acme.corp");

    process.env.ATRIUM_PUBLIC_URL = "http://localhost:3000";
    expect(getBranding().atriumHostname).toBe("localhost:3000");
  });

  it("passes through optional branding bits when set", () => {
    process.env.ATRIUM_ORG_URL = "https://acme.corp";
    process.env.ATRIUM_ORG_LOGO_URL = "/brand/org-logo.svg";
    process.env.ATRIUM_ACCENT_HEX = "#FF6600";
    process.env.ATRIUM_SUPPORT_EMAIL = "ops@acme.corp";
    process.env.ATRIUM_PROPOSAL_URL = "https://acme.corp/requests";

    const b = getBranding();
    expect(b.orgUrl).toBe("https://acme.corp");
    expect(b.orgLogoUrl).toBe("/brand/org-logo.svg");
    expect(b.accentHex).toBe("#FF6600");
    expect(b.supportEmail).toBe("ops@acme.corp");
    expect(b.proposalUrl).toBe("https://acme.corp/requests");
  });

  it("treats empty-string env vars as unset", () => {
    process.env.ATRIUM_ORG_URL = "";
    expect(getBranding().orgUrl).toBeUndefined();
  });
});
