import { describe, it, expect } from "vitest";
import { ManifestError, parseManifest, parseManifestJson } from "@/lib/manifest";

const VALID = {
  name: "my-marketplace",
  owner: { name: "Acme", email: "ops@acme.corp" },
  plugins: [
    {
      name: "awesome",
      description: "Does awesome things",
      version: "1.0.0",
      category: "productivity",
      author: { name: "Jane" },
      keywords: ["cool", "useful"],
      license: "MIT",
    },
  ],
};

describe("parseManifest", () => {
  it("accepts a valid manifest", () => {
    const out = parseManifest(VALID);
    expect(out.name).toBe("my-marketplace");
    expect(out.plugins).toHaveLength(1);
    expect(out.plugins[0]?.name).toBe("awesome");
    expect(out.plugins[0]?.keywords).toEqual(["cool", "useful"]);
  });

  it("treats owner as optional", () => {
    const { owner, ...rest } = VALID;
    expect(parseManifest(rest).owner).toBeUndefined();
  });

  it("throws on non-object root", () => {
    expect(() => parseManifest("nope")).toThrow(ManifestError);
    expect(() => parseManifest(null)).toThrow(ManifestError);
    expect(() => parseManifest([])).toThrow(ManifestError);
  });

  it("errors when a required plugin field is missing", () => {
    const broken = {
      name: "m",
      plugins: [{ description: "no version or name" }],
    };
    expect(() => parseManifest(broken)).toThrow(ManifestError);
  });

  it("reports a useful path in the error", () => {
    const broken = {
      name: "m",
      plugins: [{ name: "ok", description: "ok", version: "1.0.0" }, { name: "", description: "x", version: "1" }],
    };
    try {
      parseManifest(broken);
      expect.fail("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(ManifestError);
      expect((err as ManifestError).path).toBe("$.plugins[1].name");
    }
  });

  it("rejects non-string keywords", () => {
    const broken = {
      name: "m",
      plugins: [{ name: "x", description: "y", version: "1", keywords: ["a", 42] }],
    };
    expect(() => parseManifest(broken)).toThrow(/string/);
  });

  it("normalizes empty-string optional fields to undefined", () => {
    const plugin = { name: "x", description: "y", version: "1", license: "" };
    const out = parseManifest({ name: "m", plugins: [plugin] });
    expect(out.plugins[0]?.license).toBeUndefined();
  });
});

describe("parseManifestJson", () => {
  it("parses well-formed JSON", () => {
    const out = parseManifestJson(JSON.stringify(VALID));
    expect(out.name).toBe("my-marketplace");
  });

  it("wraps JSON parse errors", () => {
    try {
      parseManifestJson("{not json");
      expect.fail("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(ManifestError);
      expect((err as ManifestError).message).toMatch(/invalid JSON/);
    }
  });
});
