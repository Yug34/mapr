import { createWorker } from "tesseract.js";

/** Minimum confidence (0–100) to keep a word; lower-confidence words are often OCR noise. */
const CONFIDENCE_THRESHOLD = 60;

/**
 * Extract text from an image using Tesseract.js OCR (worker-based).
 * Accepts a Blob or a data URL / blob URL string.
 * Filters out low-confidence words to reduce garbage (e.g. "Bo", "json TT") from borders/decorations.
 */
export async function extractTextFromImage(
  source: Blob | string,
): Promise<string> {
  const worker = await createWorker("eng", 1, {
    logger: () => {}, // suppress progress logs in production
  });
  try {
    const result = await worker.recognize(source);
    const rawText = result.data.text?.trim() ?? "";
    const words = result.data.words ?? [];

    if (words.length === 0) return rawText;

    const filtered = words
      .filter((w) => w.confidence >= CONFIDENCE_THRESHOLD)
      .map((w) => w.text)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    if (!filtered || filtered.length < rawText.length * 0.2) {
      return rawText;
    }
    return filtered;
  } finally {
    await worker.terminate();
  }
}
