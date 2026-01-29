import { useState } from "react";
import { queryService } from "../services/queryService";
import type { StructuredQuerySpec, QueryResult } from "../types/query";
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
  const [results, setResults] = useState<QueryResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { tabs, activeTabId } = useCanvasStore();

  const handleExecute = async () => {
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

  const exampleQueries = {
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

  const loadExample = (example: StructuredQuerySpec) => {
    setQueryJson(JSON.stringify(example, null, 2));
  };

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
          onClick={handleExecute}
          disabled={loading}
          style={{
            padding: "8px 16px",
            fontSize: 12,
            cursor: loading ? "not-allowed" : "pointer",
            backgroundColor: loading ? "#ccc" : "#007bff",
            color: "white",
            border: "none",
            borderRadius: 4,
          }}
        >
          {loading ? "Executing..." : "Execute Query"}
        </button>
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
