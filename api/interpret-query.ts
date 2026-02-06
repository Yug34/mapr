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
You convert Natural Language to a structured JSON query spec.

CRITICAL: Return ONLY valid JSON. No other text or explanation.

ALWAYS include "scope" ({"type": "global"} or {"type": "tab", "tabId": "..."}).

Omit dateFilters, statusFilter, textSearch, mustHaveTags, mustNotHaveTags, limit, sort unless the user explicitly asks in natural language.

Do NOT add dateFilters when the user doesn't mention dates—e.g. "show all todos" = scope + nodeTypes only. Use Unix timestamps (ms) only when the user asks for date filtering in natural language.

Include optional fields only when asked: nodeTypes (type mentioned); mustHaveTags/mustNotHaveTags (tags); textSearch ("containing"/"about"/"search"); dateFilters ("this week"/"due today"/"due in 7 days"); statusFilter ("incomplete"/"completed"/"overdue"); limit ("first N"); sort ("sort by"/"newest").

IMPORTANT: When the user asks about "todos due" or "todos that are due", they typically mean incomplete todos unless they explicitly say "all todos" or "completed todos". If they say "todos due this week" without specifying status, include statusFilter for incomplete todos.

For date ranges:
- "this week" = from start of current week (Monday 00:00:00) to end of current week (Sunday 23:59:59)
- "next 7 days" or "due in less than 7 days" or "due in the next 7 days" = from now to 7 days from now (includes today and future dates up to 7 days)
- "due today" = from start of today to end of today
- "due within 7 days" = same as "next 7 days" (includes overdue items if they're within 7 days)
- Use Unix timestamps in milliseconds

Examples:
"show all todos" → {"scope": {"type": "global"}, "nodeTypes": ["todo"]}
"show todos" → {"scope": {"type": "global"}, "nodeTypes": ["todo"]}
"notes with tag important" → {"scope": {"type": "global"}, "nodeTypes": ["note"], "mustHaveTags": ["important"]}
"todos due this week" → {"scope": {"type": "global"}, "nodeTypes": ["todo"], "statusFilter": {"field": "status", "values": ["incomplete"]}, "dateFilters": [{"field": "dueDate", "op": "between", "value": {"from": <start_of_week_ms>, "to": <end_of_week_ms>}}]}
"incomplete todos" → {"scope": {"type": "global"}, "nodeTypes": ["todo"], "statusFilter": {"field": "status", "values": ["incomplete"]}}
"incomplete todos due in less than 7 days" → {"scope": {"type": "global"}, "nodeTypes": ["todo"], "statusFilter": {"field": "status", "values": ["incomplete"]}, "dateFilters": [{"field": "dueDate", "op": "between", "value": {"from": <now_ms>, "to": <now_plus_7_days_ms>}}]}
"show all todos that are due this week" → {"scope": {"type": "global"}, "nodeTypes": ["todo"], "statusFilter": {"field": "status", "values": ["incomplete"]}, "dateFilters": [{"field": "dueDate", "op": "between", "value": {"from": <start_of_week_ms>, "to": <end_of_week_ms>}}]}
`.trim();

// TODO: the TODO node has the status field that can either be "incomplete" or "complete" or "overdue"

function buildUserPrompt(nlQuery: string, scope: Scope): string {
  const scopeDescription =
    scope.type === "tab"
      ? `Scope: tab ID "${scope.tabId}"`
      : "Scope: global (all tabs)";

  // Get current date/time for accurate timestamp calculation
  const now = Date.now();
  const today = new Date(now);
  const startOfToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  ).getTime();
  const endOfToday = startOfToday + 24 * 60 * 60 * 1000 - 1;

  // Calculate start of week (Monday)
  const dayOfWeek = today.getDay();
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const startOfWeek = startOfToday - daysFromMonday * 24 * 60 * 60 * 1000;
  const endOfWeek = startOfWeek + 7 * 24 * 60 * 60 * 1000 - 1;

  // 7 days from now
  const sevenDaysFromNow = now + 7 * 24 * 60 * 60 * 1000;

  return `Query: "${nlQuery}"
${scopeDescription}

Current date/time context (Unix timestamps in milliseconds):
- Now: ${now}
- Start of today: ${startOfToday}
- End of today: ${endOfToday}
- Start of this week (Monday 00:00:00): ${startOfWeek}
- End of this week (Sunday 23:59:59): ${endOfWeek}
- 7 days from now: ${sevenDaysFromNow}

Convert to JSON query spec. Include ONLY fields that the query explicitly asks for. Use the date/time context above to calculate accurate timestamps. Return ONLY the JSON object.`;
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
      maxOutputTokens: 300,
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
        maxOutputTokens: 300,
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
