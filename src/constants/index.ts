/** OpenAI model used for summarisation. Use gpt-4o-mini if gpt-5-nano is not available. */
export const OPENAI_SUMMARY_MODEL = "gpt-5-nano";

/** Max characters sent to the LLM for summarisation to respect context limits. */
export const SUMMARIZE_MAX_INPUT_CHARS = 128000;

/** Max tokens sent to the LLM for summarisation to respect context limits.
 * Increased for reasoning models (e.g., gpt-5-nano) that use tokens for internal reasoning. */
export const SUMMARIZE_MAX_OUTPUT_TOKENS = 4096;
