import { execQuery } from "../utils/sqliteDb";
import { devLog, devWarn } from "../lib/devLog";
import { extractTitle, extractImportant } from "../utils/nodeDataUtils";
import type { StructuredQuerySpec, QueryResult } from "../types/query";
import type { PersistedNode } from "../utils/serialization";
import { TodoStatus, type Todo, type TODONodeData } from "../types/common";

/**
 * Maps ReactFlow node types to the query spec node types
 */
function mapNodeTypeToQueryType(nodeType: string | undefined): string | null {
  if (!nodeType) return null;
  const mapping: Record<string, string> = {
    NoteNode: "note",
    TODONode: "todo",
    PDFNode: "pdf",
    ImageNode: "image",
    AudioNode: "audio",
    VideoNode: "video",
    LinkNode: "link",
  };
  return mapping[nodeType] || null;
}

/**
 * Extracts createdAt from node data JSON
 */
function extractCreatedAt(data: unknown): number | undefined {
  if (!data || typeof data !== "object") return undefined;
  const obj = data as Record<string, unknown>;
  const createdAt = obj.createdAt;
  if (typeof createdAt === "number") return createdAt;
  return undefined;
}

/**
 * Extracts status from node data JSON (for TODOs)
 */
function extractStatus(data: unknown): string | undefined {
  if (!data || typeof data !== "object") return undefined;
  const obj: TODONodeData = data as TODONodeData;
  const dueDate = obj.dueDate;
  // For TODOs, check if there are todos with status
  if (obj.todos && Array.isArray(obj.todos)) {
    // Return the first incomplete todo's status, or "completed" if all are done
    const todos = obj.todos as Todo[];
    const hasIncomplete = todos.some((t) => !t.completed);
    const hasOverdue = todos.some(
      (t) => !t.completed && dueDate !== undefined && dueDate < Date.now()
    );
    return hasIncomplete
      ? TodoStatus.Incomplete
      : hasOverdue
      ? TodoStatus.Overdue
      : TodoStatus.Complete;
  }
  return undefined;
}

/**
 * Extracts dueDate from node data JSON (for TODOs)
 */
function extractDueDate(data: unknown): number | undefined {
  if (!data || typeof data !== "object") return undefined;
  const obj = data as Record<string, unknown>;
  const dueDate = obj.dueDate;
  if (typeof dueDate === "number") return dueDate;
  return undefined;
}

/**
 * Extracts content/body from node data JSON (for notes)
 */
function extractNoteContent(data: unknown): string | undefined {
  if (!data || typeof data !== "object") return undefined;
  const obj = data as Record<string, unknown>;
  const content = obj.content;
  if (typeof content === "string" && content.trim() !== "") return content;
  return undefined;
}

/**
 * QueryService - executes StructuredQuerySpec against SQLite
 */
export class QueryService {
  /**
   * Execute a StructuredQuerySpec and return matching nodes
   */
  async execute(spec: StructuredQuerySpec): Promise<QueryResult[]> {
    // Build the SQL query
    const { sql, bind } = this.buildQuery(spec);

    devLog("[QueryService] Executing query:", sql);
    devLog("[QueryService] Bind params:", bind);

    // Execute query (LEFT JOIN node_text for extracted media text)
    const rows = await execQuery<{
      id: string;
      tabId: string;
      data: string;
      plainText?: string | null;
    }>(sql, bind);

    devLog("[QueryService] Raw rows returned:", rows.length);

    // Parse results
    const results: QueryResult[] = [];

    for (const row of rows) {
      let persistedNode: PersistedNode;
      try {
        persistedNode = JSON.parse(row.data) as PersistedNode;
      } catch {
        devWarn("[QueryService] Failed to parse node data for", row.id);
        continue; // Skip invalid JSON
      }

      // Get the persisted node type
      const nodeType = persistedNode.type;
      if (!nodeType) {
        devWarn("[QueryService] Node missing type:", row.id);
        continue;
      }

      // Map to query type
      const queryType = mapNodeTypeToQueryType(nodeType);
      if (!queryType) {
        devWarn("[QueryService] Unknown node type:", nodeType);
        continue;
      }

      // Apply nodeTypes filter if specified
      if (spec.nodeTypes && spec.nodeTypes.length > 0) {
        if (!spec.nodeTypes.includes(queryType as any)) continue;
      }

      // Extract fields from the nested data
      const title = extractTitle(persistedNode.data);
      const important = extractImportant(persistedNode.data);
      const createdAt = extractCreatedAt(persistedNode.data);
      const status = extractStatus(persistedNode.data);
      const dueDate = extractDueDate(persistedNode.data);
      const noteContent =
        nodeType === "NoteNode"
          ? extractNoteContent(persistedNode.data)
          : undefined;

      // Apply important filter
      if (spec.importantOnly && !important) continue;

      // Apply status filter
      if (spec.statusFilter) {
        if (!status || !spec.statusFilter.values.includes(status)) {
          continue;
        }
      }

      // Apply date filters
      if (spec.dateFilters && spec.dateFilters.length > 0) {
        let passesDateFilters = true;
        for (const dateFilter of spec.dateFilters) {
          let value: number | undefined;
          if (dateFilter.field === "createdAt") {
            value = createdAt;
          } else if (dateFilter.field === "dueDate") {
            value = dueDate;
          }
          // updatedAt not available in current schema

          if (value === undefined) {
            passesDateFilters = false;
            break;
          }

          if (dateFilter.op === "before") {
            if (typeof dateFilter.value === "number") {
              if (value >= dateFilter.value) {
                passesDateFilters = false;
                break;
              }
            }
          } else if (dateFilter.op === "after") {
            if (typeof dateFilter.value === "number") {
              if (value <= dateFilter.value) {
                passesDateFilters = false;
                break;
              }
            }
          } else if (dateFilter.op === "between") {
            if (
              typeof dateFilter.value === "object" &&
              "from" in dateFilter.value &&
              "to" in dateFilter.value
            ) {
              if (
                value < dateFilter.value.from ||
                value > dateFilter.value.to
              ) {
                passesDateFilters = false;
                break;
              }
            }
          }
        }
        if (!passesDateFilters) continue;
      }

      // Apply text search (include node_text.plainText for media OCR/PDF)
      if (spec.textSearch) {
        const searchQuery = spec.textSearch.query.toLowerCase();
        const searchableText = [
          title,
          JSON.stringify(persistedNode.data),
          row.plainText ?? "",
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        if (spec.textSearch.mode === "full-text") {
          // Simple substring match for now
          if (!searchableText.includes(searchQuery)) continue;
        } else if (spec.textSearch.mode === "fuzzy") {
          // Simple substring match for now (can be enhanced later)
          if (!searchableText.includes(searchQuery)) continue;
        }
      }

      // Store result with all extracted fields
      const result: QueryResult = {
        nodeId: row.id,
        tabId: row.tabId,
        type: queryType,
        title,
        createdAt,
        dueDate,
        important,
        plainText:
          row.plainText != null && row.plainText !== ""
            ? row.plainText
            : undefined,
        noteContent,
      };

      results.push(result);
    }

    // Apply sorting
    if (spec.sort) {
      results.sort((a, b) => {
        let aValue: number | undefined;
        let bValue: number | undefined;

        if (spec.sort!.field === "createdAt") {
          aValue = a.createdAt;
          bValue = b.createdAt;
        } else if (spec.sort!.field === "dueDate") {
          aValue = a.dueDate;
          bValue = b.dueDate;
        }

        if (aValue === undefined && bValue === undefined) return 0;
        if (aValue === undefined) return 1;
        if (bValue === undefined) return -1;

        const diff = aValue - bValue;
        return spec.sort!.direction === "asc" ? diff : -diff;
      });
    }

    // Apply limit
    if (spec.limit) {
      return results.slice(0, spec.limit);
    }

    return results;
  }

  /**
   * Build SQL query from StructuredQuerySpec
   */
  private buildQuery(spec: StructuredQuerySpec): {
    sql: string;
    bind: (string | number | null)[];
  } {
    const bind: (string | number | null)[] = [];
    const conditions: string[] = [];

    // Scope handling
    if (spec.scope.type === "tab") {
      conditions.push("tabId = ?");
      bind.push(spec.scope.tabId);
    }
    // For global scope, no tabId filter

    // Build SELECT query with LEFT JOIN node_text for extracted media text
    let sql =
      "SELECT n.id, n.tabId, n.data, nt.plainText FROM nodes n LEFT JOIN node_text nt ON n.id = nt.nodeId";

    if (conditions.length > 0) {
      sql +=
        " WHERE " +
        conditions.map((c) => c.replace(/^tabId/, "n.tabId")).join(" AND ");
    }

    // Note: We can't filter by nodeTypes, important, dates, or text at the SQL level
    // because they're stored in JSON. We'll filter in JavaScript after fetching.
    // This is acceptable for Phase 2 as a non-LLM query service.

    return { sql, bind };
  }
}

export const queryService = new QueryService();
