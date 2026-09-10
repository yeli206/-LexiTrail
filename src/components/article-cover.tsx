import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

const palettes = [
  ["#3157a6", "#c8d99b", "#b96850"],
  ["#9a5f66", "#eadfc6", "#4b6b8c"],
  ["#385a52", "#d4aaa3", "#c5d49b"],
  ["#50698c", "#d6be72", "#9f6875"],
  ["#4c456f", "#b9d7cf", "#c88163"],
] as const;

export function ArticleCover({
  title,
  seed,
  number,
  compact = false,
  className,
}: {
  title: string;
  seed: number;
  number: number;
  compact?: boolean;
  className?: string;
}) {
  const palette = palettes[seed % palettes.length];
  const style = {
    "--cover-a": palette[0],
    "--cover-b": palette[1],
    "--cover-c": palette[2],
    "--shape-shift": `${(seed % 9) * 2}px`,
  } as CSSProperties;

  return (
    <div className={cn("article-cover", compact && "article-cover--compact", className)} style={style} aria-hidden="true">
      <span className="article-cover__shape article-cover__shape--one" />
      <span className="article-cover__shape article-cover__shape--two" />
      <span className="article-cover__shape article-cover__shape--three" />
      <span className="article-cover__index">{String(number).padStart(2, "0")}</span>
      <span className="article-cover__word">{title.split(/\s+/).slice(0, 2).join(" ")}</span>
    </div>
  );
}