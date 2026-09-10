"use client";

import { useState } from "react";
import type { VocabularyEntry } from "@/lib/types";
import { displayTranslation } from "@/lib/utils";

export function VocabularyPreview({ entries }: { entries: VocabularyEntry[] }) {
  const [revealed, setRevealed] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setRevealed((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <aside className="vocab-panel" aria-label="本篇文章的六级词汇">
      <div className="vocab-panel__top">
        <div>
          <h2>先测验，再阅读</h2>
          <p className="vocab-panel__hint">共 {entries.length} 个六级词。先凭记忆猜一猜，再点开核对。</p>
        </div>
        <span className="count-pill">{entries.length}</span>
      </div>
      <div className="vocab-list">
        {entries.map((entry) => {
          const isRevealed = revealed.has(entry.id);
          return (
            <button type="button" className="vocab-item" data-revealed={isRevealed} key={entry.id} onClick={() => toggle(entry.id)} aria-expanded={isRevealed}>
              <strong>{entry.display}</strong>
              <span>{entry.partOfSpeech.join(" / ")} · {displayTranslation(entry.translation)}</span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}