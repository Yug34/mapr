import { put, Stores } from "../utils/sqliteDb";
import type { NodeTextRecord } from "../utils/sqliteDb";
import { useExtractionStore } from "../store/extractionStore";
import { extractTextFromImage } from "./ocrService";
import { extractTextFromPDF } from "./pdfTextService";

type MediaNodeType = "ImageNode" | "PDFNode";

/**
 * Extract text from uploaded media (image or PDF), store it in node_text,
 * and update extraction status for the node.
 * Designed to be called fire-and-forget after adding an image/PDF node.
 */
export async function extractAndStoreNodeText(
  nodeId: string,
  nodeType: MediaNodeType,
  source: Blob | string
): Promise<void> {
  const { setStatus, setError } = useExtractionStore.getState();
  setStatus(nodeId, "extracting");

  try {
    let plainText: string;
    if (nodeType === "ImageNode") {
      plainText = await extractTextFromImage(source);
    } else if (nodeType === "PDFNode") {
      plainText = await extractTextFromPDF(
        source instanceof Blob ? source : source
      );
    } else {
      setStatus(nodeId, "error");
      setError(nodeId, `Unsupported node type for extraction: ${nodeType}`);
      return;
    }

    const record: NodeTextRecord = {
      nodeId,
      plainText: plainText?.trim() ? plainText.trim() : "N/A",
      updatedAt: Date.now(),
      extracted: 1,
    };
    await put(Stores.node_text, record);
    setStatus(nodeId, "done");
    useExtractionStore.getState().hydrateExtractedFromDb([nodeId]);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[extractionService] Extraction failed for", nodeId, err);
    setError(nodeId, message);
  }
}
