import { NextResponse } from "next/server";
import { getBranding } from "@/lib/branding";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Minimal hand-written OpenAPI 3.1 spec. Kept in-code (not generated) so a
 * PR that adds a route must also describe it — forces docs to stay honest.
 */
export async function GET() {
  const brand = getBranding();
  const spec = {
    openapi: "3.1.0",
    info: {
      title: "Atrium Registry API",
      version: "v1",
      description: `Read + write access to the plugin catalog of ${brand.orgName}. All endpoints require a Bearer token issued under Admin → API tokens.`,
    },
    servers: [{ url: `https://${brand.atriumHostname}/api/v1` }],
    components: {
      securitySchemes: {
        bearer: { type: "http", scheme: "bearer", bearerFormat: "at_<hex>" },
      },
      schemas: {
        Plugin: {
          type: "object",
          required: ["slug", "name", "version", "provider", "category", "description"],
          properties: {
            slug: { type: "string" },
            name: { type: "string" },
            version: { type: "string" },
            provider: { type: "string", enum: ["claude-code", "openai", "gemini", "mcp", "generic"] },
            category: { type: "string" },
            description: { type: "string" },
            author: { type: "object", properties: { name: { type: "string" }, email: { type: "string" }, url: { type: "string" } } },
            keywords: { type: "array", items: { type: "string" } },
            sourceId: { type: "string" },
            policyState: { type: "string", enum: ["approved", "quarantined", "blocked"] },
            capabilities: {
              type: "object",
              properties: {
                commands: { type: "array", items: { type: "string" } },
                agents: { type: "array", items: { type: "string" } },
                skills: { type: "array", items: { type: "string" } },
                mcpServers: { type: "array", items: { type: "string" } },
                actions: { type: "array", items: { type: "string" } },
                extensions: { type: "array", items: { type: "string" } },
              },
            },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        Source: {
          type: "object",
          required: ["id", "name", "kind", "trust"],
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            kind: { type: "string", enum: ["git", "http", "local"] },
            url: { type: "string" },
            trust: { type: "string", enum: ["official", "verified", "community", "internal"] },
            pluginCount: { type: "integer" },
            lastSyncedAt: { type: "string", format: "date-time" },
          },
        },
        Error: {
          type: "object",
          required: ["error"],
          properties: { error: { type: "string" } },
        },
      },
    },
    security: [{ bearer: [] }],
    paths: {
      "/plugins": {
        get: {
          summary: "List approved plugins",
          tags: ["Catalog"],
          parameters: [
            { name: "provider", in: "query", schema: { type: "string" } },
            { name: "category", in: "query", schema: { type: "string" } },
            { name: "source", in: "query", schema: { type: "string" } },
            { name: "q", in: "query", schema: { type: "string" } },
          ],
          responses: {
            200: {
              description: "list of plugins",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      total: { type: "integer" },
                      plugins: { type: "array", items: { $ref: "#/components/schemas/Plugin" } },
                    },
                  },
                },
              },
            },
            401: { description: "missing/invalid token", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            429: { description: "rate limit exceeded" },
          },
        },
      },
      "/plugins/{slug}": {
        get: {
          summary: "Plugin detail",
          tags: ["Catalog"],
          parameters: [{ name: "slug", in: "path", required: true, schema: { type: "string" } }],
          responses: {
            200: { description: "full manifest", content: { "application/json": { schema: { $ref: "#/components/schemas/Plugin" } } } },
            404: { description: "not found" },
          },
        },
      },
      "/sources": {
        get: {
          summary: "List sources",
          tags: ["Catalog"],
          responses: {
            200: {
              description: "list of sources",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: { sources: { type: "array", items: { $ref: "#/components/schemas/Source" } } },
                  },
                },
              },
            },
          },
        },
        post: {
          summary: "Create a new source",
          tags: ["Admin"],
          description: "Requires scope write:sources.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["name", "kind"],
                  properties: {
                    name: { type: "string" },
                    kind: { type: "string", enum: ["git", "http", "local"] },
                    url: { type: "string" },
                    trust: { type: "string", enum: ["official", "verified", "community", "internal"] },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: "source created" },
            400: { description: "validation error" },
            409: { description: "duplicate key" },
          },
        },
      },
      "/metrics/usage": {
        get: {
          summary: "Aggregate usage metrics across approved plugins",
          tags: ["Catalog"],
          responses: {
            200: { description: "aggregated totals + per-plugin breakdown" },
          },
        },
      },
    },
  };

  return NextResponse.json(spec, {
    headers: {
      "cache-control": "public, max-age=300",
    },
  });
}
