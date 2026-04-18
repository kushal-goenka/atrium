/**
 * Parser for Anthropic's `.claude-plugin/marketplace.json` format.
 *
 * We're deliberately permissive on unknown fields (forward compatibility) but
 * strict on required shape so a malformed manifest fails early with a useful
 * error pointing at the offending field.
 *
 * Reference: https://docs.anthropic.com/claude-code/plugins
 */

export interface RawMarketplaceManifest {
  name: string;
  owner?: { name: string; email?: string; url?: string };
  plugins: RawPlugin[];
}

export interface RawPlugin {
  name: string;
  /** Filesystem path within the source repo, or remote URL. */
  source?: string;
  description: string;
  version: string;
  category?: string;
  author?: { name: string; email?: string; url?: string };
  keywords?: string[];
  homepage?: string;
  license?: string;
}

export class ManifestError extends Error {
  constructor(
    message: string,
    public readonly path: string,
  ) {
    super(`${message} (at ${path})`);
    this.name = "ManifestError";
  }
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function requireString(v: unknown, path: string): string {
  if (typeof v !== "string" || v.length === 0) {
    throw new ManifestError("expected non-empty string", path);
  }
  return v;
}

function optionalString(v: unknown, path: string): string | undefined {
  if (v === undefined || v === null) return undefined;
  if (typeof v !== "string") throw new ManifestError("expected string", path);
  return v.length ? v : undefined;
}

function parseAuthor(v: unknown, path: string): RawPlugin["author"] {
  if (v === undefined || v === null) return undefined;
  if (!isRecord(v)) throw new ManifestError("expected object", path);
  return {
    name: requireString(v.name, `${path}.name`),
    email: optionalString(v.email, `${path}.email`),
    url: optionalString(v.url, `${path}.url`),
  };
}

function parseKeywords(v: unknown, path: string): string[] | undefined {
  if (v === undefined) return undefined;
  if (!Array.isArray(v)) throw new ManifestError("expected string array", path);
  return v.map((k, i) => requireString(k, `${path}[${i}]`));
}

function parsePlugin(v: unknown, path: string): RawPlugin {
  if (!isRecord(v)) throw new ManifestError("expected object", path);
  return {
    name: requireString(v.name, `${path}.name`),
    description: requireString(v.description, `${path}.description`),
    version: requireString(v.version, `${path}.version`),
    source: optionalString(v.source, `${path}.source`),
    category: optionalString(v.category, `${path}.category`),
    homepage: optionalString(v.homepage, `${path}.homepage`),
    license: optionalString(v.license, `${path}.license`),
    author: parseAuthor(v.author, `${path}.author`),
    keywords: parseKeywords(v.keywords, `${path}.keywords`),
  };
}

export function parseManifest(raw: unknown): RawMarketplaceManifest {
  if (!isRecord(raw)) {
    throw new ManifestError("manifest must be an object", "$");
  }

  const name = requireString(raw.name, "$.name");

  const owner = (() => {
    if (raw.owner === undefined) return undefined;
    if (!isRecord(raw.owner)) throw new ManifestError("expected object", "$.owner");
    return {
      name: requireString(raw.owner.name, "$.owner.name"),
      email: optionalString(raw.owner.email, "$.owner.email"),
      url: optionalString(raw.owner.url, "$.owner.url"),
    };
  })();

  if (!Array.isArray(raw.plugins)) {
    throw new ManifestError("plugins must be an array", "$.plugins");
  }
  const plugins = raw.plugins.map((p, i) => parsePlugin(p, `$.plugins[${i}]`));

  return { name, owner, plugins };
}

/** Convenience: parse from a JSON string, with a nicer error shape. */
export function parseManifestJson(json: string): RawMarketplaceManifest {
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new ManifestError(`invalid JSON: ${msg}`, "$");
  }
  return parseManifest(data);
}
