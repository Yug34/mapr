import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import {
  OPENAI_SUMMARY_MODEL,
  SUMMARIZE_MAX_INPUT_CHARS,
  SUMMARIZE_MAX_OUTPUT_TOKENS,
} from "@/constants";

const apiKey = import.meta.env.VITE_OPENAI_API_KEY as string | undefined;

const openai = createOpenAI({ apiKey });

const SYSTEM_PROMPT =
  "I want you to summarize this piece of text. If this text has sections, summarize each section. Use markdown to format the summary if needed. The summary SHOULD BE UNDER 350 words.";

/**
 * Summarize the given text using the OpenAI API (Vercel AI SDK).
 * Requires VITE_OPENAI_API_KEY in .env.
 */
export async function summarizeWithOpenAI(text: string): Promise<string> {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error("Text to summarize cannot be empty.");
  }

  if (!apiKey) {
    throw new Error(
      "OpenAI API key not set. Add VITE_OPENAI_API_KEY to .env.",
    );
  }

  let input = trimmed;
  if (input.length > SUMMARIZE_MAX_INPUT_CHARS) {
    input =
      input.slice(0, SUMMARIZE_MAX_INPUT_CHARS) + "\n[... truncated]";
  }

  const { text: result } = await generateText({
    model: openai(OPENAI_SUMMARY_MODEL),
    system: SYSTEM_PROMPT,
    prompt: input,
    maxOutputTokens: SUMMARIZE_MAX_OUTPUT_TOKENS,
    temperature: 0.2,
  });

  const content = result?.trim() ?? "";
  if (!content) {
    throw new Error("Empty summary response from OpenAI");
  }
  return content;
}
