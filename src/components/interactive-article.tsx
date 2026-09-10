"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useToast } from "@/components/toast-provider";
import { addWord, removeWord, restoreWord } from "@/lib/wordbook-store";
import type { DictionaryRecord } from "@/lib/types";
import { displayTranslation, normalizeToken } from "@/lib/utils";

interface ActiveWord {
  word: string;
  lemma: string;
  sourceId?: string;
  rect: { top: number; bottom: number; left: number; width: number };
  dictionary?: DictionaryRecord | null;
  loading?: boolean;
  reveal: boolean;
}

const dictionaryCache = new Map<string, DictionaryRecord | null>();

function findSentence(element: HTMLElement) {
  const paragraph = element.closest("p, li, blockquote");
  const text = paragraph?.textContent?.replace(/\s+/g, " ").trim() ?? element.textContent ?? "";
  return text.slice(0, 600);
}

async function loadDictionaryBucket(bucket: string) {
  const response = await fetch(`/data/dictionary/${bucket}.json`, { cache: "force-cache" });
  if (!response.ok) return {};
  try {
    return (await response.json()) as Record<string, DictionaryRecord>;
  } catch {
    return {};
  }
}

async function dictionaryFor(word: string, lemma: string) {
  const normalized = normalizeToken(word);
  const cached = dictionaryCache.get(normalized) ?? dictionaryCache.get(lemma);
  if (cached !== undefined) return cached;
  const bucket = /^[a-z]$/.test(normalized[0] ?? "") ? normalized[0] : "other";
  const records = await loadDictionaryBucket(bucket);
  const record = records[normalized] ?? records[lemma] ?? null;
  dictionaryCache.set(normalized, record);
  return record;
}

function calculatePosition(rect: ActiveWord["rect"]) {
  const width = Math.min(330, window.innerWidth - 24);
  const left = Math.min(Math.max(12, rect.left + rect.width / 2 - width / 2), window.innerWidth - width - 12);
  const estimatedHeight = 190;
  const below = rect.bottom + 10;
  const top = below + estimatedHeight > window.innerHeight ? Math.max(12, rect.top - estimatedHeight - 10) : below;
  return { left, top, width };
}

export function InteractiveArticle({ html, articleSlug, articleTitle }: { html: string; articleSlug: string; articleTitle: string }) {
  const [active, setActive] = useState<ActiveWord | null>(null);
  const [position, setPosition] = useState({ left: 12, top: 12, width: 330 });
  const hoverTimer = useRef<number | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  const close = useCallback(() => {
    if (hoverTimer.current) window.clearTimeout(hoverTimer.current);
    setActive(null);
  }, []);

  const present = useCallback((element: HTMLElement, reveal = false) => {
    const word = element.dataset.word ?? element.textContent ?? "";
    const lemma = element.dataset.lemma ?? normalizeToken(word);
    const rect = element.getBoundingClientRect();
    const next: ActiveWord = {
      word,
      lemma,
      sourceId: element.dataset.sourceId,
      rect: { top: rect.top, bottom: rect.bottom, left: rect.left, width: rect.width },
      reveal,
    };
    setPosition(calculatePosition(next.rect));
    setActive(next);
  }, []);

  const save = useCallback(
    async (element: HTMLElement) => {
      const word = element.dataset.word ?? element.textContent ?? "";
      const lemma = element.dataset.lemma ?? normalizeToken(word);
      const dictionary = await dictionaryFor(word, lemma);
      if (!dictionary) {
        showToast(`本地词典暂未收录 ${word}`);
        return;
      }
      const result = addWord({
        dictionary,
        articleSlug,
        articleTitle,
        sentence: findSentence(element),
        isSyllabus: Boolean(element.dataset.sourceId),
      });
      if (result.duplicate) {
        showToast(`${dictionary.word} 已在这个语境中收藏`);
        return;
      }
      showToast(result.wasNew ? `已收藏 ${dictionary.word}` : `更新了 ${dictionary.word} 的例句`, {
        label: "撤销",
        onClick: () => {
          if (result.previous) restoreWord(result.previous);
          else removeWord(result.word.lemma);
        },
      });
    },
    [articleSlug, articleTitle, showToast],
  );

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") close();
    }
    function onPointerDown(event: PointerEvent) {
      const target = event.target as HTMLElement;
      if (target.closest(".word-popover") || target.closest("[data-word]")) return;
      close();
    }
    window.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("resize", close);
    window.addEventListener("scroll", close, { passive: true });
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("resize", close);
      window.removeEventListener("scroll", close);
    };
  }, [close]);

  const reveal = async () => {
    if (!active || active.loading) return;
    if (active.dictionary !== undefined) {
      setActive({ ...active, reveal: !active.reveal });
      return;
    }
    setActive({ ...active, loading: true, reveal: true });
    const dictionary = await dictionaryFor(active.word, active.lemma);
    setActive((current) => (current ? { ...current, dictionary, loading: false, reveal: true } : current));
  };

  return (
    <div
      ref={wrapperRef}
      className="interactive-article"
      onMouseOver={(event) => {
        if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
        const target = (event.target as HTMLElement).closest<HTMLElement>("[data-word]");
        if (!target) return;
        if (hoverTimer.current) window.clearTimeout(hoverTimer.current);
        hoverTimer.current = window.setTimeout(() => present(target), 200);
      }}
      onMouseLeave={() => {
        if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) close();
      }}
      onClick={(event) => {
        const target = (event.target as HTMLElement).closest<HTMLElement>("[data-word]");
        if (target && !window.matchMedia("(hover: hover) and (pointer: fine)").matches) present(target);
      }}
      onDoubleClick={(event) => {
        const target = (event.target as HTMLElement).closest<HTMLElement>("[data-word]");
        if (!target) return;
        event.preventDefault();
        event.stopPropagation();
        void save(target);
      }}
    >
      <div className="article-body" lang="en" dangerouslySetInnerHTML={{ __html: html }} />

      {active ? (
        <div
          className="word-popover"
          role="dialog"
          aria-label={`${active.word} 的词典操作`}
          style={{ left: position.left, top: position.top, width: position.width }}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="word-popover__head">
            <div>
              <div className="word-popover__word">{active.word}</div>
              <div className="word-popover__prompt">要用本地词典查询“{active.word}”的含义吗？</div>
            </div>
            <button type="button" className="word-popover__close" onClick={close} aria-label="关闭词卡">
              ×
            </button>
          </div>

          <div className="word-popover__actions">
            <button type="button" className="primary" onClick={() => void reveal()} disabled={active.loading}>
              {active.loading ? "查询中…" : active.reveal ? "收起释义" : "查看释义"}
            </button>
            <button
              type="button"
              onClick={() => {
                const span = wrapperRef.current?.querySelector<HTMLElement>(`[data-word="${CSS.escape(active.word)}"]`);
                if (span) void save(span);
              }}
            >
              加入单词本
            </button>
          </div>

          {active.reveal ? (
            <div className="word-popover__definition" aria-live="polite">
              {active.loading ? <p>正在读取本地词典…</p> : null}
              {!active.loading && active.dictionary ? (
                <dl>
                  {active.dictionary.phonetic ? (
                    <>
                      <dt>音标</dt>
                      <dd>/{active.dictionary.phonetic}/</dd>
                    </>
                  ) : null}
                  <dt>释义</dt>
                  <dd>{displayTranslation(active.dictionary.translation)}</dd>
                </dl>
              ) : null}
              {!active.loading && !active.dictionary ? <p>本地词典暂无这个词的释义。</p> : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}