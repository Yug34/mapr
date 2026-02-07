export type Scope = { type: "tab"; tabId: string } | { type: "global" };

export type NodeType =
  | "note"
  | "todo"
  | "pdf"
  | "image"
  | "audio"
  | "video"
  | "link";

export interface StructuredQuerySpec {
  scope: Scope;
  nodeTypes?: NodeType[];
  importantOnly?: boolean;
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
  important?: boolean;
  /** Extracted text from media (image OCR / PDF) when present in node_text */
  plainText?: string;
}
