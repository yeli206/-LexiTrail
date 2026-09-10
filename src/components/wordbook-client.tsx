"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { useToast } from "@/components/toast-provider";
import { useWordbook } from "@/hooks/use-wordbook";
import {
  clearWordbook,
  downloadWordbookCsv,
  downloadWordbookJson,
  parseWordbookBackup,
  removeWord,
  replaceWordbook,
} from "@/lib/wordbook-store";
import { displayTranslation, formatDate } from "@/lib/utils";

export function WordbookClient() {
  const state = useWordbook();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  const words = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return state.words;
    return state.words.filter(
      (word) =>
        word.display.toLowerCase().includes(normalized) ||
        word.translation.toLowerCase().includes(normalized) ||
        word.occurrences.some((occurrence) => occurrence.articleTitle.toLowerCase().includes(normalized)),
    );
  }, [query, state.words]);

  async function importBackup(file: File) {
    try {
      const parsed = parseWordbookBackup(JSON.parse(await file.text()));
      replaceWordbook(parsed);
      showToast(`已导入 ${parsed.words.length} 个单词`);
    } catch {
      showToast("导入失败，请选择由本站导出的 JSON 文件");
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <>
      <div className="toolbar">
        <input
          className="search-field"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="搜索单词、释义或文章"
          aria-label="搜索单词本"
        />
        <div className="wordbook-actions">
          <button type="button" onClick={downloadWordbookJson} disabled={!state.words.length}>
            导出 JSON
          </button>
          <button type="button" onClick={downloadWordbookCsv} disabled={!state.words.length}>
            导出 CSV
          </button>
          <button type="button" onClick={() => inputRef.current?.click()}>
            导入备份
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void importBackup(file);
            }}
          />
        </div>
      </div>

      {words.length ? (
        <div className="wordbook-list">
          {words.map((word) => (
            <article className="wordbook-row" key={word.lemma}>
              <div>
                <div className="wordbook-row__word">{word.display}</div>
                <span className="wordbook-row__phonetic">
                  {word.phonetic ? `/${word.phonetic}/` : word.partOfSpeech.join(" / ")}
                </span>
              </div>
              <div className="wordbook-row__body">
                <p>{displayTranslation(word.translation)}</p>
                {word.occurrences.slice(0, 3).map((occurrence) => (
                  <div className="wordbook-row__context" key={`${occurrence.articleSlug}-${occurrence.savedAt}`}>
                    “{occurrence.sentence}”
                    <br />
                    <small>
                      来自{" "}
                      <Link className="text-link" href={`/articles/${occurrence.articleSlug}`}>
                        {occurrence.articleTitle}
                      </Link>{" "}
                      · {formatDate(occurrence.savedAt.slice(0, 10))}
                    </small>
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => removeWord(word.lemma)} aria-label={`删除 ${word.display}`}>
                删除
              </button>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h2>{state.words.length ? "没有匹配的单词" : "单词本还是空的"}</h2>
          <p>
            {state.words.length
              ? "换个关键词继续找。"
              : "去文章里双击任意英文单词，它和所在原句就会保存在这台设备上。"}
          </p>
          {!state.words.length ? (
            <Link className="button-secondary" href="/articles">
              开始阅读
            </Link>
          ) : null}
        </div>
      )}

      {state.words.length ? (
        <div className="toolbar" style={{ marginTop: 28, justifyContent: "flex-end" }}>
          <button
            type="button"
            className="button-quiet"
            onClick={() => {
              if (window.confirm("确定清空本设备上的全部收藏吗？此操作无法撤销。")) {
                clearWordbook();
                showToast("单词本已清空");
              }
            }}
          >
            清空单词本
          </button>
        </div>
      ) : null}
    </>
  );
}