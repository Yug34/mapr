import type { NodeProps } from "@xyflow/react";
import type { NoteNodeData } from "../../types/common";
import { useEffect, useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { useCanvas } from "../../hooks/useCanvas";
import { HandlesArray } from "../../utils/components";
import { ImportantStar } from "../ImportantStar";

export function NoteNode(props: NodeProps) {
  const { data, id } = props;
  const noteNodeData = data as NoteNodeData;
  const { updateNodeData, setNodes, setNoteNodeEditing } = useCanvas();

  const [nodeTitle, setNodeTitle] = useState(noteNodeData.title);
  const [nodeContent, setNodeContent] = useState(noteNodeData.content);
  const [isEditing, setIsEditing] = useState(false);
  const [isTitleFocused, setIsTitleFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const nodeRef = useRef<HTMLDivElement>(null);

  const isEditingTitleOrContent = isTitleFocused || isEditing;
  useEffect(() => {
    setNodes((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, draggable: !isEditingTitleOrContent } : n
      )
    );
  }, [id, isEditingTitleOrContent, setNodes]);

  useEffect(() => {
    setNoteNodeEditing(isEditingTitleOrContent);
    return () => setNoteNodeEditing(false);
  }, [isEditingTitleOrContent, setNoteNodeEditing]);

  const handleNodeUpdate = (newTitle: string, newContent: string) => {
    updateNodeData(id, {
      title: newTitle,
      content: newContent,
    } as NoteNodeData);
  };

  useEffect(() => {
    // Handle clicks outside the node to stop editing
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
      // FIXME?: Use a small delay to ensure the event is properly captured
      setTimeout(() => {
        document.addEventListener("mousedown", handleClickOutside, true);
      }, 0);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside, true);
    };
  }, [isEditing]);

  return (
    <div ref={nodeRef} className="w-[380px] min-w-[380px]">
      <div className="relative w-[380px] min-w-[380px] max-w-[380px] p-5 bg-[#FFFFA5] -rotate-[1deg] shadow-[0_2px_4px_rgba(0,0,0,0.4)]">
        <ImportantStar
          important={noteNodeData.important}
          className="top-2 right-2"
        />
        <div
          className="note-tape absolute -top-[22px] left-1/2 -translate-x-1/2 h-12 w-[180px] min-w-[100px] max-w-[180px] rotate-[1deg] bg-white/30 shadow-[inset_0_0_1em_0.5em_rgba(255,255,255,0.1)] [filter:drop-shadow(0_1px_0.7px_hsla(0,0%,0%,0.3))]"
          aria-hidden
        />
        <h3 className="m-0 mb-2 text-lg font-semibold">
          <input
            id="title"
            className="font-semibold w-full break-words overflow-wrap-anywhere bg-transparent border-none p-0.5 rounded text-inherit focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 focus:ring-offset-[#FFFFA5]"
            value={nodeTitle}
            onClick={(e) => {
              e.stopPropagation();
              (e.target as HTMLInputElement).focus();
            }}
            onChange={(e) => {
              const newTitle = e.target.value;
              setNodeTitle(newTitle);
              handleNodeUpdate(newTitle, nodeContent);
            }}
            onFocus={() => setIsTitleFocused(true)}
            onBlur={(e) => {
              setIsTitleFocused(false);
              const trimmedTitle = e.target.value.trim();
              setNodeTitle(trimmedTitle);
              handleNodeUpdate(trimmedTitle, nodeContent);
            }}
          />
        </h3>
        {isEditing ? (
          <textarea
            ref={textareaRef}
            id="content"
            value={nodeContent}
            className="h-[200px] min-h-[200px] leading-none w-full mt-2 resize-none break-words bg-transparent border-none p-0 focus:outline-none focus:ring-0 overflow-auto"
            onClick={(e) => {
              e.stopPropagation();
              (e.target as HTMLTextAreaElement).focus();
              setIsEditing(true);
            }}
            onChange={(e) => {
              const newContent = e.target.value;
              setNodeContent(newContent);
              handleNodeUpdate(nodeTitle, newContent);
            }}
            onBlur={() => {
              setTimeout(() => {
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
            className="h-[200px] min-h-[200px] leading-none w-full mt-2 break-words cursor-text overflow-auto [&_p]:mb-2 [&_p:last-child]:mb-0"
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
          >
            <ReactMarkdown
              components={{
                p: ({ children }) => <p>{children}</p>,
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
                  <ul className="list-none p-0 m-0 my-2 [&_li]:list-none [&_li]:before:content-['-'] [&_li]:before:mr-[0.75em] [&_li]:mt-1">
                    {children}
                  </ul>
                ),
                li: ({ children }) => <li>{children}</li>,
              }}
            >
              {nodeContent}
            </ReactMarkdown>
          </div>
        )}
        <HandlesArray nodeId={id} />
      </div>
    </div>
  );
}
