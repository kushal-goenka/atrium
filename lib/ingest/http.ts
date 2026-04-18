import { parseManifestJson, type RawMarketplaceManifest } from "../manifest";

export interface HttpIngestResult {
  manifest: RawMarketplaceManifest;
  /** SHA-256 of the raw bytes, hex-encoded. */
  contentHash: string;
  /** Raw JSON as fetched. */
  raw: string;
}

const MAX_BYTES = 2 * 1024 * 1024; // 2 MB; marketplace manifests should be tiny

/**
 * Fetches and parses a marketplace.json from an HTTP(S) URL.
 *
 * - Enforces https in production; allows http only for local development.
 * - Caps body size to protect against malicious infinite streams.
 * - Returns the content hash so callers can dedupe snapshots.
 */
export async function fetchFromHttp(url: string, opts: { timeoutMs?: number } = {}): Promise<HttpIngestResult> {
  const parsedUrl = new URL(url);
  if (parsedUrl.protocol !== "https:" && parsedUrl.protocol !== "http:") {
    throw new Error(`unsupported protocol: ${parsedUrl.protocol}`);
  }
  if (parsedUrl.protocol === "http:" && process.env.NODE_ENV === "production") {
    throw new Error("http:// not permitted in production; use https://");
  }

  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), opts.timeoutMs ?? 10_000);

  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { accept: "application/json" },
      redirect: "follow",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);

    const length = res.headers.get("content-length");
    if (length && Number(length) > MAX_BYTES) {
      throw new Error(`manifest too large: ${length} bytes (max ${MAX_BYTES})`);
    }

    const raw = await res.text();
    if (raw.length > MAX_BYTES) {
      throw new Error(`manifest too large after read: ${raw.length} bytes`);
    }

    const manifest = parseManifestJson(raw);

    // Hash the raw bytes so we can dedupe snapshots with byte-exact equality.
    const contentHash = await sha256Hex(raw);

    return { manifest, contentHash, raw };
  } finally {
    clearTimeout(timeout);
  }
}

async function sha256Hex(input: string): Promise<string> {
  const buf = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
