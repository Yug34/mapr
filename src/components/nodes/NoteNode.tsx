import { Handle, Position } from "@xyflow/react";
import type { NodeProps } from "@xyflow/react";
import type { NoteNodeData } from "../../types/common";
import { useEffect, useState, useRef } from "react";
import ReactMarkdown from "react-markdown";

export function NoteNode(props: NodeProps) {
  const { data } = props;
  const noteNodeData = data as NoteNodeData;

  const [nodeTitle, setNodeTitle] = useState(noteNodeData.title);
  const [nodeContent, setNodeContent] = useState(noteNodeData.content);
  const [isEditing, setIsEditing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const nodeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log(nodeContent);
  }, [nodeContent]);

  useEffect(() => {
    console.log(nodeTitle);
  }, [nodeTitle]);

  // Handle clicks outside the node to stop editing
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isEditing &&
        nodeRef.current &&
        !nodeRef.current.contains(event.target as Node)
      ) {
        setIsEditing(false);
      }
    };

    if (isEditing) {
      // Use a small delay to ensure the event is properly captured
      setTimeout(() => {
        document.addEventListener("mousedown", handleClickOutside, true);
      }, 0);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside, true);
    };
  }, [isEditing]);

  return (
    <div ref={nodeRef} className="sticky-note sticky-note-one">
      <input
        id="title"
        className="font-semibold mb-1 w-full break-words overflow-wrap-anywhere"
        value={nodeTitle}
        onClick={(e) => {
          e.stopPropagation();
          (e.target as HTMLInputElement).focus();
        }}
        onChange={(e) => {
          console.log(e);
          setNodeTitle(e.target.value);
        }}
        onBlur={(e) => {
          setNodeTitle(e.target.value.trim());
        }}
      />
      {isEditing ? (
        <textarea
          ref={textareaRef}
          id="content"
          value={nodeContent}
          className="min-h-[100px] leading-none w-full pb-2 resize-none break-words"
          onClick={(e) => {
            e.stopPropagation();
            (e.target as HTMLTextAreaElement).focus();
            setIsEditing(true);
          }}
          onChange={(e) => {
            setNodeContent(e.target.value);
          }}
          onBlur={() => {
            setTimeout(() => {
              // Using delay to allow for focus changes within the node
              if (
                nodeRef.current &&
                !nodeRef.current.contains(document.activeElement)
              ) {
                setIsEditing(false);
              }
            }, 100);
          }}
          autoFocus
        />
      ) : (
        <div
          className="min-h-[100px] leading-none w-full pb-2 break-words cursor-text"
          onClick={(e) => {
            e.stopPropagation();
            setIsEditing(true);
          }}
        >
          <ReactMarkdown
            components={{
              p: ({ children }) => (
                <div className="mb-2 last:mb-0">{children}</div>
              ),
              strong: ({ children }) => (
                <strong className="font-bold">{children}</strong>
              ),
              em: ({ children }) => <em className="italic">{children}</em>,
              a: ({ href, children }) => (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  {children}
                </a>
              ),
              ul: ({ children }) => (
                <ul className="list-disc list-inside mb-2 space-y-1">
                  {children}
                </ul>
              ),
              li: ({ children }) => (
                <li className="ml-[2px] [&>div]:inline [&>div]:mb-0">
                  {children}
                </li>
              ),
            }}
          >
            {nodeContent}
          </ReactMarkdown>
        </div>
      )}
      <Handle type="source" position={Position.Top} />
      <Handle type="target" position={Position.Bottom} />
    </div>
  );
}
