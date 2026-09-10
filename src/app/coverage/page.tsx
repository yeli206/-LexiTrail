import type { Metadata } from "next";
import { CoverageClient } from "@/components/coverage-client";
import { getCoverage } from "@/lib/coverage";

export const metadata: Metadata = {
  title: "词汇地图",
  description: "查看 2,085 个六级词汇的覆盖状态、剩余词和首次出现的文章。",
};

export default function CoveragePage() {
  const coverage = getCoverage();
  return (
    <main>
      <section className="page-hero">
        <div className="shell">
          <p className="section-kicker">Vocabulary atlas</p>
          <h1>看见每一个词，在哪里第一次出现。</h1>
          <p>这张地图以用户提供的第三方《大学英语六级词汇乱序版》为基线，不是全国大学英语四六级考试官方大纲。文章增加后，覆盖进度会自动重算。</p>
        </div>
      </section>
      <section className="coverage-layout">
        <div className="shell">
          <CoverageClient initialCovered={coverage.covered} initialTotal={coverage.total} records={coverage.records} />
        </div>
      </section>
    </main>
  );
}