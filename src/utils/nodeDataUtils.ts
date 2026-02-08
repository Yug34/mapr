/**
 * Shared helpers for extracting fields from node data (used by canvasContextBuilder, queryService, etc.)
 */
export function extractTitle(data: unknown): string {
  if (!data || typeof data !== "object") return "";
  const obj = data as Record<string, unknown>;
  return (obj.title as string) ?? (obj.fileName as string) ?? "";
}

export function extractImportant(data: unknown): boolean {
  if (!data || typeof data !== "object") return false;
  return (data as Record<string, unknown>).important === true;
}
