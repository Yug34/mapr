import { getAll, getAllFromIndex, Stores } from "@/utils/sqliteDb";
import type { TabRecord } from "@/utils/sqliteDb";
import type { PersistedNode } from "@/utils/serialization";
import type { Scope } from "@/types/query";
import { extractTitle, extractImportant } from "@/utils/nodeDataUtils";
import { resolveNodeText } from "./nodeTextResolver";

const MAX_NODES = 80;
const MAX_CONTEXT_CHARS = 10_000;
const PREVIEW_CHARS = 150;

/**
 * Build a single string describing the canvas for the chat system prompt.
 * Uses scope to limit nodes to one tab or all tabs. Caps node count and total length.
 */
export async function buildCanvasContext(scope: Scope): Promise<string> {
  const [tabs, nodes] = await Promise.all([
    getAll<TabRecord>(Stores.tabs),
    scope.type === "tab"
      ? getAllFromIndex<PersistedNode>(Stores.nodes, "tabId", scope.tabId)
      : getAll<PersistedNode>(Stores.nodes),
  ]);

  const tabsSection =
    "## Tabs\n" + tabs.map((t) => `- ${t.title} (id: ${t.id})`).join("\n");

  const nodeList = nodes.slice(0, MAX_NODES);
  const nodeLines: string[] = [];

  let totalChars = tabsSection.length;

  for (const node of nodeList) {
    if (totalChars >= MAX_CONTEXT_CHARS) break;

    const title = extractTitle(node.data);
    const nodeType = node.type ?? "unknown";
    const preview = await resolveNodeText(node.id, nodeType, node.data);
    const previewStr = preview
      ? preview.slice(0, PREVIEW_CHARS) +
        (preview.length > PREVIEW_CHARS ? "…" : "")
      : "";

    const importantTag = extractImportant(node.data) ? " (important)" : "";
    const line = `- **${title || "(no title)"}** [${nodeType}] (id: ${
      node.id
    })${importantTag}${previewStr ? `\n  Preview: ${previewStr}` : ""}`;
    nodeLines.push(line);
    totalChars += line.length;
  }

  const nodesSection =
    "## Nodes\n" +
    (nodeLines.length === 0 ? "(No nodes in scope)" : nodeLines.join("\n"));

  if (nodes.length > MAX_NODES) {
    return (
      tabsSection +
      "\n\n" +
      nodesSection +
      `\n\n(Only first ${MAX_NODES} nodes shown.)`
    );
  }

  return tabsSection + "\n\n" + nodesSection;
}
