import { useState } from "react";
import { queryService } from "../services/queryService";
import { interpretQuery } from "../services/interpretQueryService";
import type { StructuredQuerySpec, QueryResult, Scope } from "../types/query";
import { useCanvasStore } from "../store/canvasStore";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { cn } from "@/lib/utils";
import { devLog } from "@/lib/devLog";
import { Star, ChevronDown, ChevronRight, Check, X } from "lucide-react";
import { format } from "date-fns";
import { NodeType } from "@/types/common";

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
  const [showJsonSection, setShowJsonSection] = useState(false);
  const { activeTabId, requestFocusNode } = useCanvasStore();

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

      devLog("[QueryDevPanel] Executing spec:", spec);
      const queryResults = await queryService.execute(spec);
      devLog("[QueryDevPanel] Results:", queryResults);

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

      devLog("[QueryDevPanel] Interpreting NL query:", nlQuery);
      devLog("[QueryDevPanel] Scope:", queryScope);

      const spec = await interpretQuery(nlQuery, queryScope);

      devLog("[QueryDevPanel] Interpreted spec:", spec);

      // Update JSON display
      setQueryJson(JSON.stringify(spec, null, 2));

      // Execute the query
      const queryResults = await queryService.execute(spec);
      devLog("[QueryDevPanel] Results:", queryResults);

      setResults(queryResults);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error("[QueryDevPanel] Error:", err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const exampleNLQueries = [
    "All nodes containing Dostoyevsky",
    "All nodes marked important",
    "Incomplete TODOs due this week",
  ];

  const loadNLExample = (example: string) => {
    setNlQuery(example);
  };

  return (
    <div className="flex h-full flex-col min-h-0 font-mono text-xs">
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-4 flex flex-col gap-4">
          {/* Natural Language Query Section */}
          <div className="space-y-2">
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
            <div className="flex">
              <Input
                value={nlQuery}
                onChange={(e) => setNlQuery(e.target.value)}
                placeholder="Show all todos due this week"
                className="font-mono text-xs rounded-r-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleExecuteNL();
                  }
                }}
              />
              <Button
                onClick={handleExecuteNL}
                disabled={loading}
                size="sm"
                className="bg-green-600 h-9 hover:bg-green-700 rounded-l-none"
              >
                {loading ? "Processing..." : "Search"}
              </Button>
            </div>
            <div>
              <span className="font-semibold block mb-2">Examples:</span>
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
          </div>

          {/* JSON Query Section (toggleable) */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1 px-2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowJsonSection((v) => !v)}
              >
                {showJsonSection ? (
                  <ChevronDown className="size-4" />
                ) : (
                  <ChevronRight className="size-4" />
                )}
                <span className="text-xs">Query</span>
              </Button>
              {showJsonSection && (
                <Button
                  onClick={handleExecuteJson}
                  disabled={loading}
                  size="sm"
                >
                  {loading ? "Executing..." : "Execute Query"}
                </Button>
              )}
            </div>
            {showJsonSection && (
              <div>
                <textarea
                  value={queryJson}
                  onChange={(e) => setQueryJson(e.target.value)}
                  className={cn(
                    "w-full h-[200px] font-mono text-[11px] p-2 rounded-md border bg-background",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  )}
                />
              </div>
            )}
          </div>

          <Separator />

          {error && (
            <div className="p-2 bg-destructive/10 border border-destructive/30 rounded-md text-destructive text-xs">
              <strong>Error:</strong> {error}
            </div>
          )}

          {results.length > 0 && (
            <div>
              <strong className="block mb-2">
                Results ({results.length}):
              </strong>
              <p className="text-muted-foreground text-[11px] mb-2">
                Click a result to focus and zoom to that node on the canvas.
              </p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs font-bold">Title</TableHead>
                    <TableHead className="text-xs font-bold">Type</TableHead>
                    <TableHead className="text-xs">
                      <Star className="size-4 inline fill-amber-500 text-amber-500" />
                    </TableHead>
                    {results.some((r) => r.type === NodeType.Todo) && (
                      <TableHead className="text-xs font-bold">Due</TableHead>
                    )}
                    <TableHead className="text-xs font-bold">Text</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((result) => (
                    <TableRow
                      key={result.nodeId}
                      className="cursor-pointer hover:bg-gray-200"
                      onClick={() =>
                        requestFocusNode(result.nodeId, result.tabId)
                      }
                    >
                      <TableCell
                        className={cn(
                          "flex gap-1 text-[11px] py-1.5 max-w-[120px] px-0",
                          "truncate"
                        )}
                        title={result.title}
                      >
                        {result.title ?? "—"}
                      </TableCell>
                      <TableCell className="text-[11px] py-1.5">
                        {result.type.charAt(0).toUpperCase() +
                          result.type.slice(1)}
                      </TableCell>
                      <TableCell
                        className="text-[11px] py-1.5 max-w-[100px]"
                        title={result.important ? "Important" : undefined}
                      >
                        {result.important ? (
                          <span className="flex w-4 h-4 items-center justify-center bg-green-500 rounded-xs">
                            <Check
                              className="size-4 inline text-white"
                              strokeWidth={3}
                            />
                          </span>
                        ) : (
                          <span className="flex w-4 h-4 items-center justify-center bg-red-500 rounded-xs">
                            <X
                              className="size-4 inline text-white"
                              strokeWidth={3}
                            />
                          </span>
                        )}
                      </TableCell>
                      {results.some((r) => r.type === NodeType.Todo) && (
                        <TableCell className="text-[11px] py-1.5">
                          {result.type === NodeType.Todo &&
                          result.dueDate != null ? (
                            (() => {
                              const d = new Date(result.dueDate);
                              return format(
                                d,
                                d.getFullYear() === new Date().getFullYear()
                                  ? "MMM d"
                                  : "MMM d, yyyy"
                              );
                            })()
                          ) : (
                            <>—</>
                          )}
                        </TableCell>
                      )}
                      <TableCell className="text-[11px] py-1.5">
                        {result.type === "note" &&
                        result.noteContent != null &&
                        result.noteContent !== "" ? (
                          <details className="inline">
                            <summary className="cursor-pointer hover:underline">
                              {result.noteContent.length} chars
                            </summary>
                            <pre
                              className={cn(
                                "mt-1 p-1.5 text-[10px] overflow-auto max-h-24",
                                "whitespace-pre-wrap break-words",
                                "bg-muted rounded border"
                              )}
                            >
                              {result.noteContent}
                            </pre>
                          </details>
                        ) : (result.type === NodeType.Image ||
                            result.type === NodeType.PDF) &&
                          result.plainText != null &&
                          result.plainText !== "" ? (
                          <details className="inline">
                            <summary className="cursor-pointer hover:underline">
                              {result.plainText.length} chars
                            </summary>
                            <pre
                              className={cn(
                                "mt-1 p-1.5 text-[10px] overflow-auto max-h-24",
                                "whitespace-pre-wrap break-words",
                                "bg-muted rounded border"
                              )}
                            >
                              {result.plainText}
                            </pre>
                          </details>
                        ) : (
                          <>—</>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
