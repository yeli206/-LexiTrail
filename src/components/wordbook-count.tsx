"use client";

import { useWordbook } from "@/hooks/use-wordbook";

export function WordbookCount({ className }: { className?: string }) {
  const state = useWordbook();
  if (!state.words.length) return null;
  return <span className={className ? `count-pill ${className}` : "count-pill"}>{state.words.length}</span>;
}