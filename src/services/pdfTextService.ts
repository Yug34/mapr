import * as pdfjsLib from "pdfjs-dist";

// Use same worker as PDFNode so we don't load it twice
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

/**
 * Extract text from a PDF by concatenating text from all pages.
 * Accepts a Blob, ArrayBuffer, or URL string.
 */
export async function extractTextFromPDF(
  source: Blob | ArrayBuffer | string,
): Promise<string> {
  let getDocumentInput: { url?: string; data?: ArrayBuffer } = {};
  if (typeof source === "string") {
    getDocumentInput = { url: source };
  } else if (source instanceof ArrayBuffer) {
    getDocumentInput = { data: source };
  } else {
    const arrayBuffer = await source.arrayBuffer();
    getDocumentInput = { data: arrayBuffer };
  }

  const loadingTask = pdfjsLib.getDocument(getDocumentInput);
  const doc = await loadingTask.promise;
  const numPages = doc.numPages;
  const pageTexts: string[] = [];

  for (let i = 1; i <= numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const text = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");
    pageTexts.push(text);
  }

  return pageTexts.join("\n\n").trim();
}
