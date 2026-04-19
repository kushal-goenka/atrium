import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  assertOutboundAllowed,
  getAirgapMode,
  getAllowedHosts,
  describeAirgap,
} from "@/lib/airgap";

const KEYS = ["ATRIUM_AIRGAP", "ATRIUM_ALLOWED_HOSTS"];

describe("air-gap", () => {
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
      else delete process.env[k];
    }
  });

  it("defaults to open", () => {
    expect(getAirgapMode()).toBe("open");
    expect(() => assertOutboundAllowed("https://example.com")).not.toThrow();
  });

  it("strict mode refuses any outbound URL", () => {
    process.env.ATRIUM_AIRGAP = "strict";
    expect(getAirgapMode()).toBe("strict");
    expect(() => assertOutboundAllowed("https://github.com/x/y")).toThrow(/strict/);
  });

  it("allowlist mode accepts exact host + subdomain matches", () => {
    process.env.ATRIUM_AIRGAP = "allowlist";
    process.env.ATRIUM_ALLOWED_HOSTS = "github.com, internal.corp";
    expect(getAllowedHosts()).toEqual(["github.com", "internal.corp"]);

    expect(() => assertOutboundAllowed("https://github.com/foo")).not.toThrow();
    expect(() => assertOutboundAllowed("https://gitlab.internal.corp/repo")).not.toThrow();
  });

  it("allowlist mode refuses hosts outside the list", () => {
    process.env.ATRIUM_AIRGAP = "allowlist";
    process.env.ATRIUM_ALLOWED_HOSTS = "internal.corp";
    expect(() => assertOutboundAllowed("https://github.com/foo")).toThrow(/not in ATRIUM_ALLOWED_HOSTS/);
  });

  it("describeAirgap reports a human-readable summary", () => {
    process.env.ATRIUM_AIRGAP = "strict";
    const d = describeAirgap();
    expect(d.mode).toBe("strict");
    expect(d.humanSummary).toMatch(/refuses all outbound/i);
  });

  it("refuses malformed URLs in any non-open mode", () => {
    process.env.ATRIUM_AIRGAP = "strict";
    expect(() => assertOutboundAllowed("not-a-url")).toThrow(/invalid URL/);
  });
});
