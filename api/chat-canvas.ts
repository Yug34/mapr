import { streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

const SYSTEM_PREFIX = `You are a canvas assistant. You must only answer questions about the user's canvas: its nodes, notes, todos, tabs, and content. You can help find things, summarize content, or plan based on what is on the canvas.

If the user asks about anything that is not about this canvas (e.g. general knowledge, coding, recipes, or any other unrelated topic), respond with exactly one short, polite sentence refusing, for example: "I can only help with questions about your canvas (notes, todos, and content)." Do not answer the unrelated question.

When you mention or cite a node from the canvas (e.g. when listing nodes, referring to a specific note, or answering "which nodes..."), make it a clickable citation using this exact markdown format: [Node Title](node:nodeId) where nodeId is the node's id from the context (e.g. n1, n2). Use the node's title (or a short label) as the link text. Example: the node "About mapr" with id n1 should be written as [About mapr](node:n1). This allows the user to click and zoom to that node on the canvas.

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
