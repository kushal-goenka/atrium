import { describe, it, expect } from "vitest";
import { slugifyKey } from "@/lib/sources";

describe("slugifyKey", () => {
  it("lowercases and hyphenates", () => {
    expect(slugifyKey("Acme Data Platform")).toBe("acme-data-platform");
  });

  it("strips leading/trailing non-alphanumerics", () => {
    expect(slugifyKey("  Hello!! ")).toBe("hello");
    expect(slugifyKey("--Already-Slug--")).toBe("already-slug");
  });

  it("collapses runs of separators into single hyphen", () => {
    expect(slugifyKey("foo    bar---baz")).toBe("foo-bar-baz");
    expect(slugifyKey("a@b#c$d")).toBe("a-b-c-d");
  });

  it("truncates to 48 characters", () => {
    const long = "x".repeat(80);
    const out = slugifyKey(long);
    expect(out.length).toBe(48);
  });

  it("preserves unicode-adjacent ascii", () => {
    expect(slugifyKey("Pétér's plugins")).toBe("p-t-r-s-plugins");
  });

  it("returns empty string for input with no alphanumerics", () => {
    expect(slugifyKey("!!!")).toBe("");
    expect(slugifyKey("")).toBe("");
  });
});
