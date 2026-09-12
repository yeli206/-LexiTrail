import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

const palettes = [
  ["#7485a2", "#c7cfb7", "#9d7b7b"],
  ["#957b83", "#ddd2c4", "#73859a"],
  ["#73877f", "#c8bbb4", "#b7c3a7"],
  ["#7888a4", "#d1c5a8", "#9c818b"],
  ["#777086", "#bdcdc7", "#b0927e"],
] as const;

function getCoverVariant(number: number) {
  return (number - 1) % 8;
}

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
  const variant = getCoverVariant(number);
  const style = {
    "--cover-a": palette[0],
    "--cover-b": palette[1],
    "--cover-c": palette[2],
    "--shape-shift": `${(seed % 9) * 2}px`,
  } as CSSProperties;

  return (
    <div className={cn("article-cover", `article-cover--v${variant + 1}`, compact && "article-cover--compact", className)} style={style} aria-hidden="true">
      <span className="article-cover__shape article-cover__shape--one" />
      <span className="article-cover__shape article-cover__shape--two" />
      <span className="article-cover__shape article-cover__shape--three" />
      <span className="article-cover__index">{String(number).padStart(2, "0")}</span>
      <span className="article-cover__word">{title.split(/\s+/).slice(0, 2).join(" ")}</span>
    </div>
  );
}