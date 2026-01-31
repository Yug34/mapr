import { CreateMLCEngine, type MLCEngine } from "@mlc-ai/web-llm";
import type { StructuredQuerySpec, Scope } from "../types/query";
import { SUMMARIZE_MAX_INPUT_CHARS } from "../constants";

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
} as const;

export type ModelKey = keyof typeof AVAILABLE_MODELS;

/**
 * LLM Service - handles natural language to StructuredQuerySpec conversion
 * Uses WebLLM with small, quantized models for local inference
 */
export class LLMService {
  private engine: MLCEngine | null = null;
  private isLoading = false;
  private loadProgress = 0;
  private isReady = false;
  private currentModel: ModelKey = "qwen15b"; // Default to Qwen2.5-1.5B

  /**
   * Set the model to use (must be called before initialize)
   */
  setModel(modelKey: ModelKey): void {
    if (this.isReady || this.isLoading) {
      throw new Error(
        "Cannot change model after initialization. Dispose first.",
      );
    }
    this.currentModel = modelKey;
  }

  // Get current model info
  getCurrentModel(): (typeof AVAILABLE_MODELS)[ModelKey] {
    return AVAILABLE_MODELS[this.currentModel];
  }

  // Check if WebGPU is available
  async checkWebGPUSupport(): Promise<boolean> {
    if (!navigator.gpu) {
      return false;
    }
    try {
      const adapter = await navigator.gpu.requestAdapter();
      return adapter !== null;
    } catch {
      return false;
    }
  }

  // Initialize the LLM engine with progress callback
  async initialize(
    onProgress?: (progress: number, text: string) => void,
  ): Promise<void> {
    if (this.isReady && this.engine) {
      return;
    }

    if (this.isLoading) {
      throw new Error("LLM is already loading");
    }

    this.isLoading = true;
    this.loadProgress = 0;

    try {
      const hasWebGPU = await this.checkWebGPUSupport();
      if (!hasWebGPU) {
        console.warn(
          "[LLMService] WebGPU not available, falling back to WASM/CPU",
        );
      }

      const modelConfig = AVAILABLE_MODELS[this.currentModel];
      onProgress?.(0, `Initializing ${modelConfig.name}...`);

      // Initialize WebLLM with the selected model using CreateMLCEngine
      this.engine = await CreateMLCEngine(modelConfig.name, {
        initProgressCallback: (report: { progress: number; text?: string }) => {
          this.loadProgress = report.progress;
          const progressText =
            report.text ||
            `Loading ${modelConfig.name}: ${Math.round(report.progress * 100)}%`;
          onProgress?.(report.progress, progressText);
        },
      });

      this.isReady = true;
      this.isLoading = false;
      onProgress?.(1, "Model ready!");
    } catch (error) {
      this.isLoading = false;
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to initialize LLM: ${errorMessage}`);
    }
  }

  // Whether the LLM is ready for inference (initialize has completed successfully).
  getIsReady(): boolean {
    return this.isReady;
  }

  // Get initialization status
  getStatus(): {
    isReady: boolean;
    isLoading: boolean;
    progress: number;
    model: (typeof AVAILABLE_MODELS)[ModelKey];
  } {
    return {
      isReady: this.isReady,
      isLoading: this.isLoading,
      progress: this.loadProgress,
      model: AVAILABLE_MODELS[this.currentModel],
    };
  }

  // Build the system prompt for query interpretation
  // Optimized for smaller models with clear, structured instructions
  private buildSystemPrompt(): string {
    // For smaller models, we use a more direct, example-based prompt
    return `
You convert Natural Langauge to a structured JSON query spec.

CRITICAL: Return ONLY valid JSON. No other text or explanation.

Always include "scope" ({"type": "global"} or {"type": "tab", "tabId": "..."}).

Omit dateFilters, statusFilter, textSearch, mustHaveTags, mustNotHaveTags, limit, sort unless the user explicitly asks in natural language.

Do NOT add dateFilters when the user doesn't mention dates—e.g. "show all todos" = scope + nodeTypes only. Use Unix timestamps (ms) only when the user asks for date filtering in natural language.

Include optional fields only when asked: nodeTypes (type mentioned); mustHaveTags/mustNotHaveTags (tags); textSearch ("containing"/"about"/"search"); dateFilters ("this week"/"due today"); statusFilter ("incomplete"/"completed"); limit ("first N"); sort ("sort by"/"newest").

Examples:
"show all todos" → {"scope": {"type": "global"}, "nodeTypes": ["todo"]}
"show todos" → {"scope": {"type": "global"}, "nodeTypes": ["todo"]}
"notes with tag important" → {"scope": {"type": "global"}, "nodeTypes": ["note"], "mustHaveTags": ["important"]}
"todos due this week" → {"scope": {"type": "global"}, "nodeTypes": ["todo"], "dateFilters": [{"field": "dueDate", "op": "between", "value": {"from": <start>, "to": <end>}}]}
"incomplete todos" → {"scope": {"type": "global"}, "nodeTypes": ["todo"], "statusFilter": {"field": "status", "values": ["incomplete"]}}`;
  }

  // Build the user prompt for a specific query
  private buildUserPrompt(nlQuery: string, scope: Scope): string {
    const scopeDescription =
      scope.type === "tab"
        ? `Scope: tab ID "${scope.tabId}"`
        : "Scope: global (all tabs)";

    return `Query: "${nlQuery}"
${scopeDescription}

Convert to JSON query spec. Include ONLY fields that the query explicitly asks for. Do not add dateFilters, statusFilter, or other optional fields unless the user asked for them. Return ONLY the JSON object.`;
  }

  /**
   * Parse and validate the LLM's JSON response
   * More lenient parsing for smaller models that might have formatting issues
   */
  private parseAndValidateResponse(
    response: string,
  ): StructuredQuerySpec | null {
    // Try to extract JSON from the response (in case LLM adds extra text)
    let jsonStr = response.trim();

    // Remove markdown code blocks if present
    jsonStr = jsonStr.replace(/^```json\s*/i, "");
    jsonStr = jsonStr.replace(/^```\s*/i, "");
    jsonStr = jsonStr.replace(/\s*```$/i, "");

    // Try to find JSON object boundaries
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }

    try {
      const parsed = JSON.parse(jsonStr) as Partial<StructuredQuerySpec>;

      // Validate required fields
      if (!parsed.scope || typeof parsed.scope !== "object") {
        return null;
      }

      if (parsed.scope.type !== "tab" && parsed.scope.type !== "global") {
        return null;
      }

      if (
        parsed.scope.type === "tab" &&
        typeof parsed.scope.tabId !== "string"
      ) {
        return null;
      }

      // Build valid spec with defaults
      const spec: StructuredQuerySpec = {
        scope: parsed.scope,
        ...(parsed.nodeTypes && { nodeTypes: parsed.nodeTypes }),
        ...(parsed.mustHaveTags && { mustHaveTags: parsed.mustHaveTags }),
        ...(parsed.mustNotHaveTags && {
          mustNotHaveTags: parsed.mustNotHaveTags,
        }),
        ...(parsed.textSearch && { textSearch: parsed.textSearch }),
        ...(parsed.dateFilters && { dateFilters: parsed.dateFilters }),
        ...(parsed.statusFilter && { statusFilter: parsed.statusFilter }),
        ...(parsed.limit && { limit: parsed.limit }),
        ...(parsed.sort && { sort: parsed.sort }),
      };

      return spec;
    } catch (error) {
      console.error("[LLMService] JSON parse error:", error);
      console.error("[LLMService] Response was:", jsonStr);
      return null;
    }
  }

  /**
   * Interpret a natural language query into a StructuredQuerySpec
   */
  async interpretQuery(
    nlQuery: string,
    scope: Scope,
  ): Promise<StructuredQuerySpec> {
    if (!this.isReady || !this.engine) {
      throw new Error("LLM not initialized. Call initialize() first.");
    }

    if (!nlQuery.trim()) {
      throw new Error("Query cannot be empty");
    }

    try {
      const systemPrompt = this.buildSystemPrompt();
      const userPrompt = this.buildUserPrompt(nlQuery, scope);

      // Generate response with lower temperature for more consistent output
      // Smaller models benefit from lower temperature
      const response = await this.engine.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.0, // Very low temperature for structured output
        max_tokens: 300, // Smaller models need shorter outputs
      });

      const content = response.choices[0]?.message?.content || "";

      if (!content) {
        throw new Error("Empty response from LLM");
      }

      console.log("[LLMService] Raw LLM response:", content);

      // Parse and validate
      const spec = this.parseAndValidateResponse(content);

      if (!spec) {
        // Try one retry with a more explicit prompt
        console.log(
          "[LLMService] First attempt failed, retrying with explicit prompt...",
        );
        const retryPrompt = `${userPrompt}\n\nRemember: Return ONLY valid JSON, no other text.`;
        const retryResponse = await this.engine.chat.completions.create({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: retryPrompt },
          ],
          temperature: 0.0,
          max_tokens: 300,
        });

        const retryContent = retryResponse.choices[0]?.message?.content || "";

        const retrySpec = this.parseAndValidateResponse(retryContent);
        if (!retrySpec) {
          throw new Error(
            `Failed to parse LLM response as valid StructuredQuerySpec after retry. Response: ${retryContent}`,
          );
        }

        retrySpec.scope = scope; // Ensure scope matches
        return retrySpec;
      }

      // Ensure scope matches the requested scope
      spec.scope = scope;

      console.log("[LLMService] Parsed StructuredQuerySpec:", spec);
      return spec;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`LLM interpretation failed: ${errorMessage}`);
    }
  }

  /**
   * Summarize the given text. Call initialize() first if not ready.
   * Input is truncated to SUMMARIZE_MAX_INPUT_CHARS to respect context limits.
   */
  async summarizeText(text: string): Promise<string> {
    if (!this.isReady || !this.engine) {
      throw new Error("LLM not initialized. Call initialize() first.");
    }

    const trimmed = text.trim();
    if (!trimmed) {
      throw new Error("Text to summarize cannot be empty.");
    }

    let input = trimmed;
    if (input.length > SUMMARIZE_MAX_INPUT_CHARS) {
      input = input.slice(0, SUMMARIZE_MAX_INPUT_CHARS) + "\n[... truncated]";
    }

    const systemPrompt =
      "Summarize the following text. Use markdown to format the summary. Return ONLY a summary, no preamble or intro.";
    const response = await this.engine.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: input },
      ],
      temperature: 0.2,
      max_tokens: 2048,
    });

    const content = response.choices[0]?.message?.content?.trim() ?? "";
    if (!content) {
      throw new Error("Empty summary response from LLM");
    }
    return content;
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    // WebLLM doesn't expose a dispose method, but we can nullify the reference
    this.engine = null;
    this.isReady = false;
    this.isLoading = false;
    this.loadProgress = 0;
  }
}

export const llmService = new LLMService();
