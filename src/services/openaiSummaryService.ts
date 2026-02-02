import { generateText, streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import {
  OPENAI_SUMMARY_MODEL,
  SUMMARIZE_MAX_INPUT_CHARS,
  SUMMARIZE_MAX_OUTPUT_TOKENS,
} from "@/constants";

const apiKey = import.meta.env.VITE_OPENAI_API_KEY as string | undefined;

const openai = createOpenAI({ apiKey });

const SYSTEM_PROMPT =
  "I want you to summarize the piece of text that the user provides. Keep the summary under 200 words. Use markdown to format the summary and highlight the most important points:";

/**
 * Stream a summary of the given text using the OpenAI API (Vercel AI SDK).
 * Requires VITE_OPENAI_API_KEY in .env.
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

  if (!apiKey) {
    throw new Error("OpenAI API key not set. Add VITE_OPENAI_API_KEY to .env.");
  }

  let input = trimmed;
  if (input.length > SUMMARIZE_MAX_INPUT_CHARS) {
    input = input.slice(0, SUMMARIZE_MAX_INPUT_CHARS) + "\n[... truncated]";
  }

  let fullContent = "";

  const result = await streamText({
    model: openai(OPENAI_SUMMARY_MODEL),
    system: SYSTEM_PROMPT,
    prompt: input,
    maxOutputTokens: SUMMARIZE_MAX_OUTPUT_TOKENS,
    temperature: 0.2,
  });

  for await (const chunk of result.textStream) {
    fullContent += chunk;
    onChunk(chunk);
  }

  const content = fullContent.trim();
  if (!content) {
    throw new Error("Empty summary response from OpenAI");
  }
  return content;
}
