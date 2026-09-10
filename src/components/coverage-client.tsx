"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { CoverageRecord } from "@/lib/coverage";
import type { VocabularyEntry } from "@/lib/types";
import { displayTranslation } from "@/lib/utils";

interface CoveragePayload {
  meta: { source: string; authority: string; count: number };
  entries: VocabularyEntry[];
}

type Status = "all" | "covered" | "remaining";

export function CoverageClient({
  initialCovered,
  initialTotal,
  records,
}: {
  initialCovered: number;
  initialTotal: number;
  records: Record<string, CoverageRecord>;
}) {
  const [payload, setPayload] = useState<CoveragePayload | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<Status>("all");
  const [letter, setLetter] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 60;

  useEffect(() => {
    let cancelled = false;
    fetch("/data/vocabulary.json", { cache: "force-cache" })
      .then(async (response) => {
        if (!response.ok) return null;
        try {
          return (await response.json()) as CoveragePayload;
        } catch {
          return null;
        }
      })
      .then((data) => {
        if (!cancelled && data) setPayload(data);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const entries = useMemo(() => payload?.entries ?? [], [payload]);
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return entries.filter((entry) => {
      const covered = Boolean(records[entry.lemma]);
      if (status === "covered" && !covered) return false;
      if (status === "remaining" && covered) return false;
      if (letter !== "all" && entry.lemma[0] !== letter) return false;
      if (!normalized) return true;
      return (
        entry.display.toLowerCase().includes(normalized) ||
        entry.lemma.toLowerCase().includes(normalized) ||
        entry.translation.toLowerCase().includes(normalized)
      );
    });
  }, [entries, letter, query, records, status]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize);
  const covered = payload ? entries.filter((entry) => records[entry.lemma]).length : initialCovered;
  const total = payload?.meta.count ?? initialTotal;
  const percentage = total ? (covered / total) * 100 : 0;
  const letters = "abcdefghijklmnopqrstuvwxyz".split("");

  function updateQuery(value: string) {
    setQuery(value);
    setPage(1);
  }

  return (
    <>
      <div className="coverage-stats">
        <div className="stat-block">
          <strong>{covered}</strong>
          <span>已经出现过的词</span>
        </div>
        <div className="stat-block">
          <strong>{total - covered}</strong>
          <span>还没进入文章的词</span>
        </div>
        <div className="stat-block">
          <strong>{percentage.toFixed(1)}%</strong>
          <span>完整覆盖进度</span>
        </div>
      </div>

      <div className="progress-track" style={{ marginBottom: 28 }}>
        <span style={{ width: `${percentage}%` }} />
      </div>

      <div className="toolbar">
        <input
          className="search-field"
          type="search"
          value={query}
          onChange={(event) => updateQuery(event.target.value)}
          placeholder="搜索单词或中文释义"
          aria-label="搜索词表"
        />
        <select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as Status);
            setPage(1);
          }}
          aria-label="按覆盖状态筛选"
        >
          <option value="all">全部状态</option>
          <option value="covered">已覆盖</option>
          <option value="remaining">未覆盖</option>
        </select>
        <select
          value={letter}
          onChange={(event) => {
            setLetter(event.target.value);
            setPage(1);
          }}
          aria-label="按首字母筛选"
        >
          <option value="all">全部字母</option>
          {letters.map((item) => (
            <option value={item} key={item}>
              {item.toUpperCase()}
            </option>
          ))}
        </select>
      </div>

      {!payload ? (
        <div className="empty-state">正在打开词汇地图…</div>
      ) : visible.length ? (
        <div className="coverage-list">
          {visible.map((entry) => {
            const record = records[entry.lemma];
            return (
              <article className="coverage-word" data-covered={Boolean(record)} key={entry.id}>
                <div className="coverage-word__word">
                  <strong>{entry.display}</strong>
                  <span>{entry.partOfSpeech.join(" / ")}</span>
                </div>
                <div className="coverage-word__meaning">{displayTranslation(entry.translation)}</div>
                {record ? (
                  <Link className="coverage-link" href={`/articles/${record.articleSlug}`}>
                    首次出现
                  </Link>
                ) : (
                  <span className="coverage-link" style={{ color: "var(--muted)", textDecoration: "none" }}>
                    待覆盖
                  </span>
                )}
              </article>
            );
          })}
        </div>
      ) : (
        <div className="empty-state">
          <h2>没有符合条件的词</h2>
          <p>调整关键词或筛选条件再试一次。</p>
        </div>
      )}

      {payload && filtered.length > pageSize ? (
        <div className="pagination">
          <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1}>
            ←
          </button>
          <span>
            第 {page} / {pageCount} 页
          </span>
          <button
            type="button"
            onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
            disabled={page === pageCount}
          >
            →
          </button>
        </div>
      ) : null}
    </>
  );
}