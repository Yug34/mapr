import type { ComponentProps, CSSProperties } from "react";
import { cn } from "@/lib/utils";

const variables = {
  "--media-primary-color": "var(--primary)",
  "--media-secondary-color": "var(--background)",
  "--media-text-color": "var(--foreground)",
  "--media-background-color": "var(--background)",
  "--media-control-hover-background": "var(--accent)",
  "--media-font-family": "var(--font-sans)",
  "--media-range-track-background": "var(--border)",
} as CSSProperties;

export type ImageViewerProps = ComponentProps<"div"> & {
  style?: CSSProperties;
};
export const ImageViewer = ({
  className,
  style,
  ...props
}: ImageViewerProps) => (
  <div
    className={cn("relative overflow-hidden rounded-lg border", className)}
    style={{ ...variables, ...style }}
    {...props}
  />
);

export type ImageViewerContentProps = ComponentProps<"img">;
export const ImageViewerContent = ({
  className,
  ...props
}: ImageViewerContentProps) => (
  <img
    className={cn("block max-w-full h-auto select-none", className)}
    {...props}
  />
);
