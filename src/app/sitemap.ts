import type { MetadataRoute } from "next";
import { getAllArticles } from "@/lib/articles";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000");
  const staticRoutes = ["", "/articles", "/coverage", "/wordbook"].map((route) => ({
    url: `${base}${route}`,
    lastModified: new Date(),
  }));
  const articleRoutes = getAllArticles().map((article) => ({
    url: `${base}/articles/${article.slug}`,
    lastModified: new Date(article.reviewedAt),
  }));
  return [...staticRoutes, ...articleRoutes];
}