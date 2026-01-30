"use client";

import { useState, useRef, useEffect } from "react";
import { Pencil } from "lucide-react";
import { Button } from "./button";
import { Input } from "./input";
import { cn } from "@/lib/utils";

interface EditableNodeTitleProps {
  /** Display value when not editing (e.g. title ?? fileName) */
  displayValue: string;
  onSave: (value: string) => void;
  className?: string;
  /** Tooltip / native title on the label */
  title?: string;
  /** Optional class for the input when editing */
  inputClassName?: string;
}

/**
 * Inline editable title: shows displayValue + edit icon; click icon to edit;
 * on blur or Enter saves and persists. Use for node names (image, PDF, etc.).
 */
export function EditableNodeTitle({
  displayValue,
  onSave,
  className,
  title,
  inputClassName,
}: EditableNodeTitleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(displayValue);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isEditing) {
      setEditValue(displayValue);
      const input = containerRef.current?.querySelector("input");
      if (input) {
        input.focus();
        input.select();
      }
    }
  }, [isEditing, displayValue]);

  const handleSave = () => {
    const trimmed = editValue.trim();
    onSave(trimmed);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    }
    if (e.key === "Escape") {
      setEditValue(displayValue);
      setIsEditing(false);
      containerRef.current?.querySelector<HTMLInputElement>("input")?.blur();
    }
  };

  if (isEditing) {
    return (
      <div
        ref={containerRef}
        className={cn("flex min-w-0 flex-1 items-center gap-1", className)}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <Input
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className={cn("h-8 text-sm", inputClassName)}
          aria-label="Edit title"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex min-w-0 flex-1 items-center gap-1 overflow-hidden",
        className,
      )}
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <span
        className="min-w-0 flex-1 truncate"
        title={title ?? displayValue}
      >
        {displayValue || "Untitled"}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-7 w-7 shrink-0"
        onClick={(e) => {
          e.stopPropagation();
          setIsEditing(true);
        }}
        aria-label="Edit title"
      >
        <Pencil className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
