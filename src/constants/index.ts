/**
 * Available model configurations
 * All models use q4f16_1 quantization (4-bit with 16-bit float)
 */
export const AVAILABLE_MODELS = {
  // Recommended - good balance of size and capability
  qwen15b: {
    name: "Qwen2.5-1.5B-Instruct-q4f16_1-MLC",
    size: "~1GB",
    description: "Recommended: Good balance of size and JSON output quality.",
  },
  // Smallest option - fastest download, may struggle with complex JSON
  tinyllama: {
    name: "TinyLlama-1.1B-Chat-v1.0-q4f16_1-MLC",
    size: "~700MB",
    description: "Smallest model, fastest download. Good for simple queries.",
  },
  // Alternative small option
  llama1b: {
    name: "Llama-3.2-1B-Instruct-q4f16_1-MLC",
    size: "~880MB",
    description: "Meta's small model, instruction-tuned.",
  },
  // Larger option if needed (not recommended for initial use)
  phi3mini: {
    name: "Phi-3-mini-4k-instruct-q4f16_1-MLC",
    size: "~2.3GB",
    description: "Larger model, best quality but slow download.",
  },
  smol360m: {
    name: "SmolLM-360M-Instruct-q4f16_1-MLC",
    size: "~400MB",
    description: "Fastest. 360M params, good for simple queries.",
  },
  // Very small Qwen, fast
  qwen05b: {
    name: "Qwen2.5-0.5B-Instruct-q4f16_1-MLC",
    size: "~500MB",
    description: "Qwen 0.5B, very fast, small footprint.",
  },
} as const;

export type ModelKey = keyof typeof AVAILABLE_MODELS;

export const DEFAULT_MODEL: ModelKey = "qwen05b";

/** OpenAI model used for summarisation. Use gpt-4o-mini if gpt-5-nano is not available. */
export const OPENAI_SUMMARY_MODEL = "gpt-5-nano";

/** Max characters sent to the LLM for summarisation to respect context limits. */
export const SUMMARIZE_MAX_INPUT_CHARS = 128000;

/** Max tokens sent to the LLM for summarisation to respect context limits.
 * Increased for reasoning models (e.g., gpt-5-nano) that use tokens for internal reasoning. */
export const SUMMARIZE_MAX_OUTPUT_TOKENS = 4096;
