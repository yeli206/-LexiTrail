"use client";

import { useReading } from "@/hooks/use-reading";
import { toggleRead } from "@/lib/reading-store";

export function ReadToggle({ slug, compact = false }: { slug: string; compact?: boolean }) {
  const state = useReading();
  const checked = Boolean(state.completed[slug]);

  return (
    <label className={compact ? "read-toggle read-toggle--compact" : "read-toggle"} title={checked ? "标记为未读" : "标记为已读"}>
      <input type="checkbox" checked={checked} aria-label={checked ? "标记为未读" : "标记为已读"} onChange={() => toggleRead(slug)} />
      <span aria-hidden="true">{checked ? "✓" : ""}</span>
      {!compact ? <b>{checked ? "已读完" : "读完打勾"}</b> : null}
    </label>
  );
}