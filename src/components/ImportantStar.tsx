import { cn } from "@/lib/utils";
import { Star } from "lucide-react";

export function ImportantStar({
  important,
  className = "",
}: {
  important?: boolean;
  className?: string;
}) {
  if (!important) return null;
  return (
    <span
      className={cn("absolute pointer-events-none text-amber-500", className)}
      style={{
        filter:
          "drop-shadow(0 0 1px rgb(245 158 11 / 0.6)) drop-shadow(0 0 2px rgb(245 158 11 / 0.42))",
      }}
      aria-label="Important"
    >
      <Star className="size-5 fill-amber-500" />
    </span>
  );
}
