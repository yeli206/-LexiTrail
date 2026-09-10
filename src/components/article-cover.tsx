import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

const palettes = [
  ["#1746d1", "#d8ff3e", "#f0542d"],
  ["#f0542d", "#f6e7d4", "#1746d1"],
  ["#173c32", "#ffb5a7", "#d8ff3e"],
  ["#153d8a", "#f7c948", "#ef476f"],
  ["#241a52", "#b8f2e6", "#ff6b35"],
] as const;

export function ArticleCover({
  title,
  seed,
  compact = false,
  className,
}: {
  title: string;
  seed: number;
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
      <span className="article-cover__index">{String(seed + 1).padStart(2, "0")}</span>
      <span className="article-cover__word">{title.split(/\s+/).slice(0, 2).join(" ")}</span>
    </div>
  );
}