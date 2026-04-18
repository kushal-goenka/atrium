import type { Plugin, PluginCategory } from "../types";
import { complete } from "./client";

const VALID_CATEGORIES: readonly PluginCategory[] = [
  "productivity",
  "data",
  "devops",
  "security",
  "design",
  "writing",
  "research",
  "ops",
  "finance",
  "sales",
  "other",
];

export interface CurationSuggestion {
  category: PluginCategory;
  keywords: string[];
  rationale: string;
  provider: string;
  model: string;
}

const SYSTEM_PROMPT = `You are an experienced registry curator.

Given a plugin's name, description, and capabilities, you suggest:
  1. A single category from the fixed list: productivity, data, devops, security, design, writing, research, ops, finance, sales, other.
  2. A small set of 3-6 relevant search keywords. Use lowercase, short, and descriptive tags. Do not repeat words from the plugin name.

Respond ONLY with JSON matching this shape, no prose:
{
  "category": "<one of the categories>",
  "keywords": ["tag", "tag", "tag"],
  "rationale": "<one sentence on why>"
}`;

export async function suggestCuration(plugin: Plugin): Promise<CurationSuggestion> {
  const context = buildContext(plugin);

  const response = await complete({
    system: SYSTEM_PROMPT,
    user: context,
    maxOutputTokens: 400,
  });

  const parsed = parseJsonFromResponse(response.text);

  const category = normalizeCategory(parsed.category);
  const keywords = normalizeKeywords(parsed.keywords);
  const rationale = typeof parsed.rationale === "string" ? parsed.rationale : "";

  return {
    category,
    keywords,
    rationale,
    provider: response.provider,
    model: response.model,
  };
}

function buildContext(plugin: Plugin): string {
  const lines: string[] = [];
  lines.push(`Name: ${plugin.name}`);
  lines.push(`Description: ${plugin.description}`);
  lines.push(`Provider: ${plugin.provider}`);
  lines.push(`Author: ${plugin.author.name}`);
  if (plugin.commands.length) {
    lines.push(`Commands: ${plugin.commands.map((c) => c.name).join(", ")}`);
  }
  if (plugin.actions?.length) {
    lines.push(
      `OpenAI actions: ${plugin.actions.map((a) => `${a.name}${a.scope ? ` (${a.scope})` : ""}`).join(", ")}`,
    );
  }
  if (plugin.extensions?.length) {
    lines.push(`Gemini extensions: ${plugin.extensions.map((e) => e.name).join(", ")}`);
  }
  if (plugin.mcpServers.length) {
    lines.push(`MCP servers: ${plugin.mcpServers.map((m) => m.name).join(", ")}`);
  }
  if (plugin.skills.length) {
    lines.push(`Skills: ${plugin.skills.map((s) => s.name).join(", ")}`);
  }
  return lines.join("\n");
}

function parseJsonFromResponse(text: string): Record<string, unknown> {
  // Models sometimes wrap JSON in fences; strip them.
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace < 0 || lastBrace < firstBrace) {
    throw new Error(`model returned no JSON object (got: ${cleaned.slice(0, 80)}…)`);
  }
  const slice = cleaned.slice(firstBrace, lastBrace + 1);
  try {
    const parsed = JSON.parse(slice);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    throw new Error("top-level JSON is not an object");
  } catch (err) {
    throw new Error(
      `failed to parse JSON from model response: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}

function normalizeCategory(v: unknown): PluginCategory {
  if (typeof v !== "string") return "other";
  const lower = v.toLowerCase();
  return (VALID_CATEGORIES.find((c) => c === lower) ?? "other") as PluginCategory;
}

function normalizeKeywords(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((k): k is string => typeof k === "string")
    .map((k) => k.toLowerCase().trim())
    .filter((k) => k.length > 0 && k.length < 40)
    .slice(0, 8);
}
