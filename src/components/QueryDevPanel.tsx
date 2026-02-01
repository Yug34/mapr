import { useState, useEffect } from "react";
import { queryService } from "../services/queryService";
import { llmService } from "../services/llmService";
import { AVAILABLE_MODELS } from "../constants";
import type { ModelKey } from "../constants";
import type { StructuredQuerySpec, QueryResult, Scope } from "../types/query";
import { useCanvasStore } from "../store/canvasStore";

export function QueryDevPanel() {
  const [queryJson, setQueryJson] = useState<string>(
    JSON.stringify(
      {
        scope: { type: "global" },
        nodeTypes: ["note"],
      } as StructuredQuerySpec,
      null,
      2,
    ),
  );
  const [nlQuery, setNlQuery] = useState<string>("");
  const [results, setResults] = useState<QueryResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [llmLoading, setLlmLoading] = useState(false);
  const [llmProgress, setLlmProgress] = useState<{
    progress: number;
    text: string;
  } | null>(null);
  const [llmReady, setLlmReady] = useState(false);
  const [scope, setScope] = useState<Scope>({ type: "global" });
  const [selectedModel, setSelectedModel] = useState<ModelKey>("llama1b");
  const { activeTabId } = useCanvasStore();

  // Initialize LLM on mount or when model changes
  useEffect(() => {
    const initLLM = async () => {
      // Set model before initializing
      try {
        llmService.setModel(selectedModel);
      } catch (err) {
        // Model already set, dispose first
        llmService.dispose();
        llmService.setModel(selectedModel);
      }

      try {
        setLlmLoading(true);
        setLlmReady(false);
        await llmService.initialize((progress, text) => {
          setLlmProgress({ progress, text });
        });
        setLlmReady(true);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error("[QueryDevPanel] LLM init error:", err);
        setError(`Failed to initialize LLM: ${errorMessage}`);
      } finally {
        setLlmLoading(false);
        setLlmProgress(null);
      }
    };

    initLLM();
  }, [selectedModel]);

  const handleExecuteJson = async () => {
    setError(null);
    setResults([]);
    setLoading(true);

    try {
      const spec: StructuredQuerySpec = JSON.parse(queryJson);

      // Replace "current-tab" placeholder with actual tabId
      if (spec.scope.type === "tab" && spec.scope.tabId === "current-tab") {
        spec.scope.tabId = activeTabId;
      }

      console.log("[QueryDevPanel] Executing spec:", spec);
      const queryResults = await queryService.execute(spec);
      console.log("[QueryDevPanel] Results:", queryResults);

      setResults(queryResults);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error("[QueryDevPanel] Error:", err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteNL = async () => {
    if (!nlQuery.trim()) {
      setError("Please enter a natural language query");
      return;
    }

    if (!llmReady) {
      setError("LLM is not ready yet. Please wait for initialization.");
      return;
    }

    setError(null);
    setResults([]);
    setLoading(true);

    try {
      // Determine scope
      const queryScope: Scope =
        scope.type === "tab"
          ? { type: "tab", tabId: activeTabId }
          : { type: "global" };

      console.log("[QueryDevPanel] Interpreting NL query:", nlQuery);
      console.log("[QueryDevPanel] Scope:", queryScope);

      // Interpret NL query to StructuredQuerySpec
      const spec = await llmService.interpretQuery(nlQuery, queryScope);

      console.log("[QueryDevPanel] Interpreted spec:", spec);

      // Update JSON display
      setQueryJson(JSON.stringify(spec, null, 2));

      // Execute the query
      const queryResults = await queryService.execute(spec);
      console.log("[QueryDevPanel] Results:", queryResults);

      setResults(queryResults);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error("[QueryDevPanel] Error:", err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const exampleQueries: Record<string, StructuredQuerySpec> = {
    "All notes": {
      scope: { type: "global" },
      nodeTypes: ["note"],
    },
    "All TODOs": {
      scope: { type: "global" },
      nodeTypes: ["todo"],
    },
    "Current tab notes": {
      scope: { type: "tab", tabId: "current-tab" },
      nodeTypes: ["note"],
    },
    "Text search": {
      scope: { type: "global" },
      textSearch: {
        query: "mapr",
        mode: "full-text",
      },
    },
  };

  const exampleNLQueries = [
    "show all todos",
    "find notes with tag important",
    "todos due this week",
    "incomplete todos",
    "all PDFs created last month",
  ];

  const loadExample = (example: StructuredQuerySpec) => {
    setQueryJson(JSON.stringify(example, null, 2));
  };

  const loadNLExample = (example: string) => {
    setNlQuery(example);
  };

  const currentModelInfo = AVAILABLE_MODELS[selectedModel];

  return (
    <div
      style={{
        position: "fixed",
        top: 20,
        right: 20,
        width: 500,
        maxHeight: "90vh",
        backgroundColor: "white",
        border: "1px solid #ccc",
        borderRadius: 8,
        padding: 16,
        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
        zIndex: 1000,
        overflow: "auto",
        fontFamily: "monospace",
        fontSize: 12,
      }}
    >
      <h3 style={{ marginTop: 0 }}>Query Dev Panel</h3>

      {/* Model Selection */}
      {!llmReady && !llmLoading && (
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", marginBottom: 4 }}>
            <strong>Select Model:</strong>
          </label>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value as ModelKey)}
            disabled={llmLoading}
            style={{
              width: "100%",
              padding: 6,
              fontSize: 11,
              border: "1px solid #ccc",
              borderRadius: 4,
            }}
          >
            {Object.entries(AVAILABLE_MODELS).map(([key, model]) => (
              <option key={key} value={key}>
                {model.name} ({model.size}) - {model.description}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* LLM Status */}
      {llmLoading && llmProgress && (
        <div
          style={{
            padding: 8,
            backgroundColor: "#e3f2fd",
            border: "1px solid #90caf9",
            borderRadius: 4,
            marginBottom: 12,
          }}
        >
          <div style={{ marginBottom: 4 }}>
            <strong>Loading {currentModelInfo.name}:</strong> {llmProgress.text}
          </div>
          <div style={{ fontSize: 10, color: "#666", marginBottom: 4 }}>
            Size: {currentModelInfo.size} • {currentModelInfo.description}
          </div>
          <div
            style={{
              width: "100%",
              height: 8,
              backgroundColor: "#ccc",
              borderRadius: 4,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${llmProgress.progress * 100}%`,
                height: "100%",
                backgroundColor: "#2196f3",
                transition: "width 0.3s",
              }}
            />
          </div>
        </div>
      )}

      {llmReady && (
        <div
          style={{
            padding: 8,
            backgroundColor: "#e8f5e9",
            border: "1px solid #81c784",
            borderRadius: 4,
            marginBottom: 12,
            color: "#2e7d32",
          }}
        >
          ✓ LLM Ready ({currentModelInfo.name})
        </div>
      )}

      {/* Natural Language Query Section */}
      <div
        style={{
          marginBottom: 12,
          borderTop: "1px solid #eee",
          paddingTop: 12,
        }}
      >
        <label style={{ display: "block", marginBottom: 4 }}>
          <strong>Natural Language Query:</strong>
        </label>
        <div style={{ marginBottom: 8 }}>
          <strong>Scope:</strong>
          <label style={{ marginLeft: 8, marginRight: 8 }}>
            <input
              type="radio"
              checked={scope.type === "global"}
              onChange={() => setScope({ type: "global" })}
              style={{ marginRight: 4 }}
            />
            Global
          </label>
          <label>
            <input
              type="radio"
              checked={scope.type === "tab"}
              onChange={() => setScope({ type: "tab", tabId: activeTabId })}
              style={{ marginRight: 4 }}
            />
            Current Tab
          </label>
        </div>
        <input
          type="text"
          value={nlQuery}
          onChange={(e) => setNlQuery(e.target.value)}
          placeholder="e.g., 'show all todos due this week'"
          style={{
            width: "100%",
            padding: 8,
            fontSize: 12,
            border: "1px solid #ccc",
            borderRadius: 4,
            marginBottom: 8,
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleExecuteNL();
            }
          }}
        />
        <div style={{ marginBottom: 8 }}>
          <strong>NL Examples:</strong>
          <div
            style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4 }}
          >
            {exampleNLQueries.map((example) => (
              <button
                key={example}
                onClick={() => loadNLExample(example)}
                style={{
                  padding: "2px 6px",
                  fontSize: 10,
                  cursor: "pointer",
                  border: "1px solid #ccc",
                  borderRadius: 4,
                  backgroundColor: "#f5f5f5",
                }}
              >
                {example}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={handleExecuteNL}
          disabled={loading || !llmReady}
          style={{
            padding: "6px 12px",
            fontSize: 11,
            cursor: loading || !llmReady ? "not-allowed" : "pointer",
            backgroundColor: loading || !llmReady ? "#ccc" : "#28a745",
            color: "white",
            border: "none",
            borderRadius: 4,
            marginRight: 8,
          }}
        >
          {loading ? "Processing..." : "Execute NL Query"}
        </button>
      </div>

      {/* JSON Query Section */}
      <div
        style={{
          marginBottom: 12,
          borderTop: "1px solid #eee",
          paddingTop: 12,
        }}
      >
        <div style={{ marginBottom: 12 }}>
          <strong>Examples:</strong>
          <div
            style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}
          >
            {Object.entries(exampleQueries).map(([label, query]) => (
              <button
                key={label}
                onClick={() => loadExample(query)}
                style={{
                  padding: "4px 8px",
                  fontSize: 11,
                  cursor: "pointer",
                  border: "1px solid #ccc",
                  borderRadius: 4,
                  backgroundColor: "#f5f5f5",
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", marginBottom: 4 }}>
            <strong>StructuredQuerySpec (JSON):</strong>
          </label>
          <textarea
            value={queryJson}
            onChange={(e) => setQueryJson(e.target.value)}
            style={{
              width: "100%",
              height: 200,
              fontFamily: "monospace",
              fontSize: 11,
              padding: 8,
              border: "1px solid #ccc",
              borderRadius: 4,
            }}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <button
            onClick={handleExecuteJson}
            disabled={loading}
            style={{
              padding: "6px 12px",
              fontSize: 11,
              cursor: loading ? "not-allowed" : "pointer",
              backgroundColor: loading ? "#ccc" : "#007bff",
              color: "white",
              border: "none",
              borderRadius: 4,
            }}
          >
            {loading ? "Executing..." : "Execute JSON Query"}
          </button>
        </div>
      </div>

      {error && (
        <div
          style={{
            padding: 8,
            backgroundColor: "#fee",
            border: "1px solid #fcc",
            borderRadius: 4,
            marginBottom: 12,
            color: "#c00",
          }}
        >
          <strong>Error:</strong> {error}
        </div>
      )}

      {results.length > 0 && (
        <div>
          <strong>Results ({results.length}):</strong>
          <ul style={{ marginTop: 8, paddingLeft: 20 }}>
            {results.map((result) => (
              <li key={result.nodeId} style={{ marginBottom: 8 }}>
                <div>
                  <strong>ID:</strong> {result.nodeId}
                </div>
                <div>
                  <strong>Type:</strong> {result.type}
                </div>
                {result.title && (
                  <div>
                    <strong>Title:</strong> {result.title}
                  </div>
                )}
                {result.createdAt && (
                  <div>
                    <strong>Created:</strong>{" "}
                    {new Date(result.createdAt).toLocaleString()}
                  </div>
                )}
                {result.tags && result.tags.length > 0 && (
                  <div>
                    <strong>Tags:</strong> {result.tags.join(", ")}
                  </div>
                )}
                {(result.type === "image" || result.type === "pdf") && (
                  <details
                    style={{ marginTop: 4 }}
                    open={!!(result.plainText && result.plainText.length > 0)}
                  >
                    <summary style={{ cursor: "pointer", fontSize: 11 }}>
                      <strong>plainText</strong>
                      {result.plainText != null && result.plainText !== "" ? (
                        <> ({result.plainText.length} chars)</>
                      ) : (
                        <> (no text extracted yet)</>
                      )}
                    </summary>
                    <pre
                      style={{
                        marginTop: 4,
                        padding: 6,
                        fontSize: 10,
                        overflow: "auto",
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                        backgroundColor: "#f5f5f5",
                        borderRadius: 4,
                      }}
                    >
                      {result.plainText != null && result.plainText !== ""
                        ? result.plainText
                        : "(No text extracted yet. OCR/PDF extraction may still be running or may have failed.)"}
                    </pre>
                  </details>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {results.length === 0 && !error && !loading && (
        <div style={{ color: "#666", fontStyle: "italic" }}>
          No results yet. Execute a query to see results.
        </div>
      )}
    </div>
  );
}
