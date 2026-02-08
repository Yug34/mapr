import { SUMMARIZE_MAX_INPUT_CHARS } from "@/constants";
import { getErrorMessage } from "@/lib/utils";

/**
 * API endpoint URL - relative path so Vite proxy (dev) or same-origin (prod) handles it.
 * Vite proxy in vite.config.ts forwards /api to the Vercel dev server.
 */
const API_URL = "/api/summarize";

/**
 * Stream a summary of the given text using the OpenAI API via serverless proxy.
 * The API key is kept secure on the server-side.
 * @param text The text to summarize
 * @param onChunk Callback function called with each chunk of text as it arrives
 * @returns Promise that resolves when streaming is complete
 */
export async function streamSummarizeWithOpenAI(
  text: string,
  onChunk: (chunk: string) => void
): Promise<string> {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error("Text to summarize cannot be empty.");
  }

  let input = trimmed;
  if (input.length > SUMMARIZE_MAX_INPUT_CHARS) {
    input = input.slice(0, SUMMARIZE_MAX_INPUT_CHARS) + "\n[... truncated]";
  }

  const apiUrl = API_URL;
  let fullContent = "";

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: input }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      let errorMessage: string;
      try {
        const parsed = JSON.parse(errorBody) as { error?: string };
        errorMessage = parsed.error ?? (errorBody || response.statusText);
      } catch {
        errorMessage = errorBody || response.statusText;
      }
      throw new Error(errorMessage);
    }

    if (!response.body) {
      throw new Error("No response body from API");
    }

    // Stream the response
    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      fullContent += chunk;
      onChunk(chunk);
    }

    const content = fullContent.trim();
    if (!content) {
      throw new Error("Empty summary response from API");
    }
    return content;
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    throw new Error(`Failed to summarize: ${errorMessage}`);
  }
}
