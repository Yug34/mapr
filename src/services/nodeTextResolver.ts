import { get, Stores } from "../utils/sqliteDb";
import type { NodeTextRecord } from "../utils/sqliteDb";
import type { NoteNodeData, LinkNodeData } from "../types/common";

/**
 * Resolve the summarisable plain text for a node.
 * - NoteNode: title + content from node data.
 * - ImageNode / PDFNode: plainText from node_text table (extracted text).
 * - LinkNode: title or url.
 * - Other types: null.
 */
export async function resolveNodeText(
  nodeId: string,
  nodeType: string,
  nodeData: unknown
): Promise<string | null> {
  if (nodeType === "LinkNode") {
    const data = nodeData as LinkNodeData;
    const text = (data?.title ?? data?.url ?? "").trim();
    return text || null;
  }

  if (nodeType === "NoteNode") {
    const data = nodeData as NoteNodeData;
    const parts = [data?.title, data?.content].filter(
      (s): s is string => typeof s === "string" && s.trim() !== ""
    );
    const text = parts.join("\n").trim();
    return text || null;
  }

  if (nodeType === "ImageNode" || nodeType === "PDFNode") {
    const record = await get<NodeTextRecord>(Stores.node_text, nodeId);
    if (!record?.plainText || record.plainText.trim() === "") {
      return null;
    }
    return record.plainText.trim();
  }

  return null;
}
