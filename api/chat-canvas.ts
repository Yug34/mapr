import { streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

const SYSTEM_PREFIX = `You are a canvas assistant. You must only answer questions about the user's canvas: its nodes, notes, todos, tabs, and content. You can help find things, summarize content, or plan based on what is on the canvas.

If the user asks about anything that is not about this canvas (e.g. general knowledge, coding, recipes, or any other unrelated topic), respond with exactly one short, polite sentence refusing, for example: "I can only help with questions about your canvas (notes, todos, and content)." Do not answer the unrelated question.

Here is the current canvas context:

`;

export const config = {
  runtime: "edge",
};

export default async function handler(req: Request) {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const body = await req.json();
    const {
      messages,
      canvasContext,
    }: {
      messages?: Array<{ role: "user" | "assistant"; content: string }>;
      canvasContext?: string;
    } = body;

    if (
      !Array.isArray(messages) ||
      messages.length === 0 ||
      typeof canvasContext !== "string" ||
      !canvasContext.trim()
    ) {
      return new Response(
        JSON.stringify({
          error:
            "Request must include non-empty messages array and non-empty canvasContext string.",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const last = messages[messages.length - 1];
    if (!last || last.role !== "user") {
      return new Response(
        JSON.stringify({
          error: "Last message must have role 'user'.",
        }),
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
    const system = SYSTEM_PREFIX + canvasContext.trim();

    const result = await streamText({
      model: openai("gpt-4o-mini"),
      system,
      messages,
      maxOutputTokens: 2048,
      temperature: 0.2,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("[chat-canvas] Error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    return new Response(
      JSON.stringify({ error: `Chat failed: ${errorMessage}` }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
