import type { StructuredQuerySpec, Scope } from "../types/query";

/** Use relative URL so Vite proxy (/api -> localhost:3000) is used in dev, avoiding CORS. */
const INTERPRET_API_PATH = "/api/interpret-query";

/**
 * Interpret a natural language query into a StructuredQuerySpec using the OpenAI API.
 * The API key is kept secure on the server-side.
 */
export async function interpretQuery(
  nlQuery: string,
  scope: Scope
): Promise<StructuredQuerySpec> {
  const trimmed = nlQuery.trim();
  if (!trimmed) {
    throw new Error("Query cannot be empty");
  }

  const response = await fetch(INTERPRET_API_PATH, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ nlQuery: trimmed, scope }),
  });

  if (!response.ok) {
    const err = await response
      .json()
      .catch(() => ({ error: response.statusText }));
    throw new Error(err.error || `API request failed: ${response.statusText}`);
  }

  const body = await response.json();
  if (!body || typeof body !== "object" || !body.scope) {
    throw new Error("Invalid response from interpret-query API");
  }

  return body as StructuredQuerySpec;
}
