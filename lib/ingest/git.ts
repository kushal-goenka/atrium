import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { promisify } from "node:util";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { parseManifestJson, type RawMarketplaceManifest } from "../manifest";
import { assertOutboundAllowed } from "../airgap";

const exec = promisify(execFile);

export interface GitIngestResult {
  manifest: RawMarketplaceManifest;
  contentHash: string;
  raw: string;
  /** Short SHA of the cloned commit. */
  commit: string;
}

export interface GitIngestOptions {
  /** Subdirectory in the repo where `.claude-plugin/marketplace.json` lives. Default: repo root. */
  subpath?: string;
  /** Branch to clone. Default: the remote HEAD. */
  branch?: string;
  /** Maximum wait for the clone, in ms. Default: 60s. */
  timeoutMs?: number;
}

/**
 * Clones a repo shallowly, reads its marketplace.json, cleans up the clone,
 * and returns the parsed manifest.
 *
 * We never keep the repo on disk — the clone exists only for the duration of
 * this call. This keeps the attack surface for malicious repos minimal:
 * we never execute anything from them, only read one JSON file.
 */
export async function fetchFromGit(url: string, opts: GitIngestOptions = {}): Promise<GitIngestResult> {
  if (!isValidGitUrl(url)) {
    throw new Error(`refusing to clone suspicious URL: ${url}`);
  }

  // Air-gap check applies only to URLs with a host we can reason about; ssh-form
  // `git@host:path` URLs are checked by extracting the host manually.
  try {
    const normalized = url.startsWith("git@")
      ? `https://${url.slice(4).replace(":", "/")}`
      : url;
    assertOutboundAllowed(normalized);
  } catch (err) {
    // Preserve the precise air-gap error so the UI surfaces it.
    throw err;
  }

  const dir = await mkdtemp(join(tmpdir(), "atrium-ingest-"));
  try {
    const cloneArgs = ["clone", "--depth", "1", "--single-branch"];
    if (opts.branch) cloneArgs.push("--branch", opts.branch);
    cloneArgs.push("--", url, dir);

    await exec("git", cloneArgs, { timeout: opts.timeoutMs ?? 60_000 });

    const manifestPath = join(dir, opts.subpath ?? "", ".claude-plugin", "marketplace.json");
    const raw = await readFile(manifestPath, "utf8");
    const manifest = parseManifestJson(raw);

    const { stdout: commitOut } = await exec("git", ["rev-parse", "--short", "HEAD"], {
      cwd: dir,
    });
    const commit = commitOut.trim();
    const contentHash = await sha256Hex(raw);

    return { manifest, contentHash, raw, commit };
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

/**
 * A cautious allow-list. Accepts https git URLs (GitHub, GitLab, Bitbucket,
 * self-hosted) and ssh-form URLs. Rejects the common shell-injection vectors.
 */
export function isValidGitUrl(url: string): boolean {
  if (url.length > 2048) return false;
  if (/[\s;&|`$(){}<>]/.test(url)) return false;

  // ssh: git@host:owner/repo.git
  if (/^[a-zA-Z0-9_.-]+@[a-zA-Z0-9.-]+:[a-zA-Z0-9_./-]+$/.test(url)) {
    return true;
  }

  // https:// or http:// (the caller's protocol check handles http prod-gating).
  try {
    const u = new URL(url);
    return u.protocol === "https:" || u.protocol === "http:" || u.protocol === "git:";
  } catch {
    return false;
  }
}

async function sha256Hex(input: string): Promise<string> {
  const buf = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
