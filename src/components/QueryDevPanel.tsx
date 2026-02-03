import { useState } from "react";
import { queryService } from "../services/queryService";
import { interpretQuery } from "../services/interpretQueryService";
import type { StructuredQuerySpec, QueryResult, Scope } from "../types/query";
import { useCanvasStore } from "../store/canvasStore";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";
import { cn } from "@/lib/utils";

export function QueryDevPanel() {
  const [queryJson, setQueryJson] = useState<string>(
    JSON.stringify(
      {
        scope: { type: "global" },
        nodeTypes: ["note"],
      } as StructuredQuerySpec,
      null,
      2
    )
  );
  const [nlQuery, setNlQuery] = useState<string>("");
  const [results, setResults] = useState<QueryResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [scope, setScope] = useState<Scope>({ type: "global" });
  const { activeTabId } = useCanvasStore();

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

    setError(null);
    setResults([]);
    setLoading(true);

    try {
      const queryScope: Scope =
        scope.type === "tab"
          ? { type: "tab", tabId: activeTabId }
          : { type: "global" };

      console.log("[QueryDevPanel] Interpreting NL query:", nlQuery);
      console.log("[QueryDevPanel] Scope:", queryScope);

      const spec = await interpretQuery(nlQuery, queryScope);

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

  return (
    <div className="flex h-full flex-col min-h-0 font-mono text-xs">
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-4 flex flex-col gap-4">
          {/* Natural Language Query Section */}
          <div className="space-y-2">
            <Label className="block font-semibold">
              Natural Language Query:
            </Label>
            <div className="flex items-center gap-4 mb-2">
              <span className="font-semibold">Scope:</span>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  checked={scope.type === "global"}
                  onChange={() => setScope({ type: "global" })}
                  className="rounded"
                />
                Global
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  checked={scope.type === "tab"}
                  onChange={() => setScope({ type: "tab", tabId: activeTabId })}
                  className="rounded"
                />
                Current Tab
              </label>
            </div>
            <Input
              value={nlQuery}
              onChange={(e) => setNlQuery(e.target.value)}
              placeholder="e.g., 'show all todos due this week'"
              className="font-mono text-xs"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleExecuteNL();
                }
              }}
            />
            <div>
              <span className="font-semibold block mb-2">NL Examples:</span>
              <div className="flex flex-wrap gap-1">
                {exampleNLQueries.map((example) => (
                  <Button
                    key={example}
                    variant="outline"
                    size="sm"
                    className="h-6 text-[10px] px-1.5"
                    onClick={() => loadNLExample(example)}
                  >
                    {example}
                  </Button>
                ))}
              </div>
            </div>
            <Button
              onClick={handleExecuteNL}
              disabled={loading}
              size="sm"
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? "Processing..." : "Execute NL Query"}
            </Button>
          </div>

          <Separator />

          {/* JSON Query Section */}
          <div className="space-y-2">
            <span className="font-semibold block">Examples:</span>
            <div className="flex flex-wrap gap-2">
              {Object.entries(exampleQueries).map(([label, query]) => (
                <Button
                  key={label}
                  variant="outline"
                  size="sm"
                  className="h-7 text-[11px]"
                  onClick={() => loadExample(query)}
                >
                  {label}
                </Button>
              ))}
            </div>

            <div>
              <Label className="block font-semibold mb-1">
                StructuredQuerySpec (JSON):
              </Label>
              <textarea
                value={queryJson}
                onChange={(e) => setQueryJson(e.target.value)}
                className={cn(
                  "w-full h-[200px] font-mono text-[11px] p-2 rounded-md border bg-background",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                )}
              />
            </div>

            <Button
              onClick={handleExecuteJson}
              disabled={loading}
              size="sm"
              variant="secondary"
            >
              {loading ? "Executing..." : "Execute JSON Query"}
            </Button>
          </div>

          {error && (
            <div className="p-2 bg-destructive/10 border border-destructive/30 rounded-md text-destructive text-xs">
              <strong>Error:</strong> {error}
            </div>
          )}

          {results.length > 0 && (
            <div>
              <strong>Results ({results.length}):</strong>
              <ul className="mt-2 pl-5 space-y-2 list-disc">
                {results.map((result) => (
                  <li key={result.nodeId} className="space-y-1">
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
                        className="mt-1"
                        open={
                          !!(result.plainText && result.plainText.length > 0)
                        }
                      >
                        <summary className="cursor-pointer text-[11px]">
                          <strong>plainText</strong>
                          {result.plainText != null &&
                          result.plainText !== "" ? (
                            <> ({result.plainText.length} chars)</>
                          ) : (
                            <> (no text extracted yet)</>
                          )}
                        </summary>
                        <pre
                          className={cn(
                            "mt-1 p-1.5 text-[10px] overflow-auto",
                            "whitespace-pre-wrap break-words",
                            "bg-muted rounded"
                          )}
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
            <div className="text-muted-foreground italic">
              No results yet. Execute a query to see results.
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
