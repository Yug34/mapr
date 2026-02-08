const API_URL = "/api/chat-canvas";

export type CanvasChatMessage = { role: "user" | "assistant"; content: string };

/**
 * Stream a canvas-scoped chat response from the API.
 * Calls onChunk for each decoded chunk; resolves when the stream ends.
 */
export async function streamCanvasChat(
  messages: CanvasChatMessage[],
  canvasContext: string,
  onChunk: (chunk: string) => void
): Promise<void> {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, canvasContext }),
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

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    onChunk(chunk);
  }
}
