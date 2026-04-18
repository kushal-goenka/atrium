import { describe, it, expect } from "vitest";
import { isValidGitUrl } from "@/lib/ingest/git";

describe("isValidGitUrl", () => {
  it("accepts https URLs", () => {
    expect(isValidGitUrl("https://github.com/foo/bar")).toBe(true);
    expect(isValidGitUrl("https://github.com/foo/bar.git")).toBe(true);
    expect(isValidGitUrl("https://gitlab.self-hosted.corp/team/repo")).toBe(true);
  });

  it("accepts ssh-form URLs", () => {
    expect(isValidGitUrl("git@github.com:foo/bar.git")).toBe(true);
    expect(isValidGitUrl("git@gitlab.corp:team/repo")).toBe(true);
  });

  it("accepts git:// protocol", () => {
    expect(isValidGitUrl("git://example.com/foo/bar.git")).toBe(true);
  });

  it("rejects shell metacharacters", () => {
    for (const bad of [
      "https://x.com/foo;rm -rf /",
      "https://x.com/foo`touch /tmp/pwned`",
      "https://x.com/foo$(whoami)",
      "https://x.com/foo && echo pwn",
      "https://x.com/foo | cat /etc/passwd",
      "https://x.com/foo\nrm",
    ]) {
      expect(isValidGitUrl(bad), `rejected: ${bad}`).toBe(false);
    }
  });

  it("rejects exotic protocols", () => {
    expect(isValidGitUrl("file:///etc/passwd")).toBe(false);
    expect(isValidGitUrl("ftp://example.com/repo")).toBe(false);
    expect(isValidGitUrl("javascript:alert(1)")).toBe(false);
  });

  it("rejects unreasonably long URLs", () => {
    const long = "https://example.com/" + "a".repeat(3000);
    expect(isValidGitUrl(long)).toBe(false);
  });

  it("rejects empty input", () => {
    expect(isValidGitUrl("")).toBe(false);
  });
});
