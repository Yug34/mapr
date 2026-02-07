import type { NodeProps } from "@xyflow/react";
import type { LinkNodeData } from "../../types/common";
import { HandlesArray } from "../../utils/components";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { EditableNodeTitle } from "@/components/ui/editable-node-title";
import { useCanvas } from "../../hooks/useCanvas";
import { Copy, AlertCircle, ExternalLink, Globe } from "lucide-react";
import { ImportantStar } from "../ImportantStar";
import { toast } from "sonner";
import { useCallback, useEffect, useMemo, useState } from "react";

function truncateUrl(url: string, maxLen = 40): string {
  if (url.length <= maxLen) return url;
  return url.slice(0, maxLen - 3) + "...";
}

function getHostname(url: string): string | null {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function LinkNode(props: NodeProps) {
  const { data, id } = props;
  const nodeData = data as LinkNodeData;
  const { updateNodeData } = useCanvas();

  const [faviconError, setFaviconError] = useState(false);
  const valid = useMemo(() => isValidUrl(nodeData.url), [nodeData.url]);
  const hostname = useMemo(
    () => (valid ? getHostname(nodeData.url) : null),
    [nodeData.url, valid]
  );
  const displayLabel = nodeData.title ?? hostname ?? truncateUrl(nodeData.url);

  useEffect(() => {
    setFaviconError(false);
  }, [nodeData.url]);

  const handleOpen = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (valid) window.open(nodeData.url, "_blank", "noopener,noreferrer");
    },
    [nodeData.url, valid]
  );

  const handleCopy = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (valid) {
        navigator.clipboard.writeText(nodeData.url);
        toast.success("Link copied to clipboard");
      }
    },
    [nodeData.url, valid]
  );

  const updateTitle = useCallback(
    (value: string) => {
      updateNodeData(id, {
        ...nodeData,
        title: value || undefined,
      });
    },
    [id, nodeData, updateNodeData]
  );

  return (
    <div className="relative flex flex-col items-center justify-center">
      <ImportantStar
        important={nodeData.important}
        className="-top-2 -right-2"
      />
      <Card className="w-[320px] max-w-full p-0 gap-0 border bg-white overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-2 border-b bg-muted/30 min-h-[2.5rem]">
          {valid && hostname && (
            <>
              {faviconError ? (
                <Globe className="w-5 h-5 shrink-0" />
              ) : (
                <img
                  src={`https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${hostname}&size=32`}
                  alt=""
                  className="w-5 h-5 shrink-0"
                  loading="lazy"
                  onError={() => setFaviconError(true)}
                />
              )}
            </>
          )}
          <div className="flex min-w-0 flex-1 items-center gap-1">
            <EditableNodeTitle
              displayValue={displayLabel}
              onSave={updateTitle}
              title={nodeData.url}
            />
          </div>
          <div className="flex shrink-0 items-center gap-0.5">
            {!valid && (
              <span className="text-destructive" title="Invalid URL">
                <AlertCircle className="h-4 w-4" />
              </span>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleOpen}
              disabled={!valid}
              title="Open link"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleCopy}
              disabled={!valid}
              title="Copy link"
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        <div
          className={`
            px-3 py-2 text-xs break-all text-muted-foreground
            ${!valid ? "text-destructive" : ""}
          `}
          title={nodeData.url}
        >
          {truncateUrl(nodeData.url, 50)}
        </div>
      </Card>
      <HandlesArray nodeId={id} />
    </div>
  );
}
