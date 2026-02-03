import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

// Minimal types for the route (self-contained for serverless)
type Scope = { type: "tab"; tabId: string } | { type: "global" };

type NodeType = "note" | "todo" | "pdf" | "image" | "audio" | "video" | "link";

interface StructuredQuerySpec {
  scope: Scope;
  nodeTypes?: NodeType[];
  mustHaveTags?: string[];
  mustNotHaveTags?: string[];
  textSearch?: {
    query: string;
    mode: "full-text" | "fuzzy";
  };
  dateFilters?: {
    field: "createdAt" | "updatedAt" | "dueDate";
    op: "before" | "after" | "between";
    value: number | { from: number; to: number };
  }[];
  statusFilter?: {
    field: "status";
    values: string[];
  };
  limit?: number;
  sort?: {
    field: "createdAt" | "updatedAt" | "dueDate";
    direction: "asc" | "desc";
  };
}

const SYSTEM_PROMPT = `
You convert Natural Langauge to a structured JSON query spec.

CRITICAL: Return ONLY valid JSON. No other text or explanation.

Always include "scope" ({"type": "global"} or {"type": "tab", "tabId": "..."}).

Omit dateFilters, statusFilter, textSearch, mustHaveTags, mustNotHaveTags, limit, sort unless the user explicitly asks in natural language.

Do NOT add dateFilters when the user doesn't mention dates—e.g. "show all todos" = scope + nodeTypes only. Use Unix timestamps (ms) only when the user asks for date filtering in natural language.

Include optional fields only when asked: nodeTypes (type mentioned); mustHaveTags/mustNotHaveTags (tags); textSearch ("containing"/"about"/"search"); dateFilters ("this week"/"due today"); statusFilter ("incomplete"/"completed"); limit ("first N"); sort ("sort by"/"newest").

Examples:
"show all todos" → {"scope": {"type": "global"}, "nodeTypes": ["todo"]}
"show todos" → {"scope": {"type": "global"}, "nodeTypes": ["todo"]}
"notes with tag important" → {"scope": {"type": "global"}, "nodeTypes": ["note"], "mustHaveTags": ["important"]}
"todos due this week" → {"scope": {"type": "global"}, "nodeTypes": ["todo"], "dateFilters": [{"field": "dueDate", "op": "between", "value": {"from": <start>, "to": <end>}}]}
"incomplete todos" → {"scope": {"type": "global"}, "nodeTypes": ["todo"], "statusFilter": {"field": "status", "values": ["incomplete"]}}
`.trim();

function buildUserPrompt(nlQuery: string, scope: Scope): string {
  const scopeDescription =
    scope.type === "tab"
      ? `Scope: tab ID "${scope.tabId}"`
      : "Scope: global (all tabs)";

  return `Query: "${nlQuery}"
${scopeDescription}

Convert to JSON query spec. Include ONLY fields that the query explicitly asks for. Do not add dateFilters, statusFilter, or other optional fields unless the user asked for them. Return ONLY the JSON object.`;
}

function parseAndValidateResponse(
  response: string,
  scope: Scope
): StructuredQuerySpec | null {
  let jsonStr = response.trim();

  jsonStr = jsonStr.replace(/^```json\s*/i, "");
  jsonStr = jsonStr.replace(/^```\s*/i, "");
  jsonStr = jsonStr.replace(/\s*```$/i, "");

  const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    jsonStr = jsonMatch[0];
  }

  try {
    const parsed = JSON.parse(jsonStr) as Partial<StructuredQuerySpec>;

    if (!parsed.scope || typeof parsed.scope !== "object") {
      return null;
    }

    if (parsed.scope.type !== "tab" && parsed.scope.type !== "global") {
      return null;
    }

    if (parsed.scope.type === "tab" && typeof parsed.scope.tabId !== "string") {
      return null;
    }

    const spec: StructuredQuerySpec = {
      scope,
      ...(parsed.nodeTypes && { nodeTypes: parsed.nodeTypes }),
      ...(parsed.mustHaveTags && { mustHaveTags: parsed.mustHaveTags }),
      ...(parsed.mustNotHaveTags && {
        mustNotHaveTags: parsed.mustNotHaveTags,
      }),
      ...(parsed.textSearch && { textSearch: parsed.textSearch }),
      ...(parsed.dateFilters && { dateFilters: parsed.dateFilters }),
      ...(parsed.statusFilter && { statusFilter: parsed.statusFilter }),
      ...(parsed.limit && { limit: parsed.limit }),
      ...(parsed.sort && { sort: parsed.sort }),
    };

    return spec;
  } catch {
    return null;
  }
}

export const config = {
  runtime: "edge",
};

export default async function handler(req: Request) {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const body = await req.json();
    const { nlQuery, scope } = body as { nlQuery?: string; scope?: Scope };

    if (!nlQuery || typeof nlQuery !== "string" || !nlQuery.trim()) {
      return new Response(
        JSON.stringify({ error: "nlQuery must be a non-empty string." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!scope || typeof scope !== "object") {
      return new Response(JSON.stringify({ error: "scope is required." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (
      scope.type !== "global" &&
      (scope.type !== "tab" || typeof scope.tabId !== "string")
    ) {
      return new Response(
        JSON.stringify({
          error:
            "scope must be { type: 'global' } or { type: 'tab', tabId: string }.",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error:
            "OpenAI API key not configured. Set OPENAI_API_KEY in .env.local and run the API server (e.g. vercel dev) from the project root.",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const openai = createOpenAI({ apiKey });
    const userPrompt = buildUserPrompt(nlQuery.trim(), scope);

    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      system: SYSTEM_PROMPT,
      prompt: userPrompt,
      temperature: 0,
      maxTokens: 300,
    });

    if (!text) {
      return new Response(
        JSON.stringify({ error: "Empty response from OpenAI." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    let spec = parseAndValidateResponse(text, scope);

    if (!spec) {
      const retryPrompt = `${userPrompt}\n\nRemember: Return ONLY valid JSON, no other text.`;
      const retry = await generateText({
        model: openai("gpt-4o-mini"),
        system: SYSTEM_PROMPT,
        prompt: retryPrompt,
        temperature: 0,
        maxTokens: 300,
      });

      spec = parseAndValidateResponse(retry.text, scope);
      if (!spec) {
        return new Response(
          JSON.stringify({
            error: `Failed to parse response as valid query spec. Response: ${retry.text}`,
          }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    return new Response(JSON.stringify(spec), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[interpret-query] Error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    return new Response(
      JSON.stringify({ error: `Interpret query failed: ${errorMessage}` }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
