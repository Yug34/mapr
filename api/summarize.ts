import { streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

const SYSTEM_PROMPT =
  "I want you to summarize the piece of text that the user provides. Keep the summary under 200 words. Use markdown to format the summary and highlight the most important points:";

export const config = {
  runtime: "edge", // Use edge runtime for faster responses
};

export default async function handler(req: Request) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const { text } = await req.json();

    if (!text || typeof text !== "string" || !text.trim()) {
      return new Response(
        JSON.stringify({ error: "Text to summarize cannot be empty." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "OpenAI API key not configured." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const openai = createOpenAI({ apiKey });

    // Truncate if too long (128k chars max)
    const MAX_INPUT_CHARS = 128000;
    let input = text.trim();
    if (input.length > MAX_INPUT_CHARS) {
      input = input.slice(0, MAX_INPUT_CHARS) + "\n[... truncated]";
    }

    const result = await streamText({
      model: openai("gpt-4o-mini"), // Use gpt-4o-mini as fallback
      system: SYSTEM_PROMPT,
      prompt: input,
      maxOutputTokens: 4096,
      temperature: 0.2,
    });

    // Return streaming response
    return new Response(result.textStream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("[Summarize API] Error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    return new Response(
      JSON.stringify({ error: `Failed to summarize: ${errorMessage}` }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
