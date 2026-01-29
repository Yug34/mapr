export type Scope = { type: "tab"; tabId: string } | { type: "global" };

export type NodeType = "note" | "todo" | "pdf" | "image" | "audio" | "video" | "link";

export interface StructuredQuerySpec {
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

export interface QueryResult {
  nodeId: string;
  type: string;
  title?: string;
  createdAt?: number;
  tags?: string[];
}
