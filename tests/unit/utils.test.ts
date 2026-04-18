import { describe, it, expect } from "vitest";
import { cn, formatNumber, formatRelative } from "@/lib/utils";

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("a", "b")).toBe("a b");
  });

  it("conditionally includes classes", () => {
    expect(cn("a", false && "b", "c")).toBe("a c");
  });

  it("de-duplicates conflicting tailwind utilities", () => {
    // later wins
    expect(cn("p-2", "p-4")).toBe("p-4");
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });

  it("handles nested arrays and objects", () => {
    expect(cn(["a", "b"], { c: true, d: false })).toBe("a b c");
  });
});

describe("formatNumber", () => {
  it("returns plain integers under 1000", () => {
    expect(formatNumber(0)).toBe("0");
    expect(formatNumber(42)).toBe("42");
    expect(formatNumber(999)).toBe("999");
  });

  it("uses k suffix for thousands with one decimal under 10k", () => {
    expect(formatNumber(1000)).toBe("1.0k");
    expect(formatNumber(1200)).toBe("1.2k");
    expect(formatNumber(9999)).toBe("10.0k");
  });

  it("drops decimal above 10k", () => {
    expect(formatNumber(10_000)).toBe("10k");
    expect(formatNumber(15_432)).toBe("15k");
  });

  it("uses M suffix for millions", () => {
    expect(formatNumber(1_000_000)).toBe("1.0M");
    expect(formatNumber(3_500_000)).toBe("3.5M");
  });
});

describe("formatRelative", () => {
  const now = new Date("2026-04-17T12:00:00Z");

  it("returns 'just now' for very recent timestamps", () => {
    expect(formatRelative("2026-04-17T11:59:40Z", now)).toBe("just now");
  });

  it("uses minute granularity under an hour", () => {
    expect(formatRelative("2026-04-17T11:45:00Z", now)).toBe("15m ago");
  });

  it("uses hour granularity under a day", () => {
    expect(formatRelative("2026-04-17T06:00:00Z", now)).toBe("6h ago");
  });

  it("uses day granularity under a month", () => {
    expect(formatRelative("2026-04-12T12:00:00Z", now)).toBe("5d ago");
  });

  it("uses month granularity under a year", () => {
    expect(formatRelative("2026-01-01T12:00:00Z", now)).toBe("3mo ago");
  });

  it("uses year granularity after a year", () => {
    expect(formatRelative("2023-04-17T12:00:00Z", now)).toBe("3y ago");
  });
});
