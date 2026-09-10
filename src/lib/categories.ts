import type { ArticleCategory } from "@/lib/types";

export const categoryLabels: Record<ArticleCategory, string> = {
  technology: "科技",
  science: "科学自然",
  internet: "互联网文化",
  mind: "心理生活",
  curiosity: "奇闻故事",
};

export const articleCategories = Object.keys(categoryLabels) as ArticleCategory[];