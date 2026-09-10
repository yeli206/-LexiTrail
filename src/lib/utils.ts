import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function normalizeToken(token: string) {
  const normalized = token.toLowerCase().replaceAll("’", "'");
  return normalized.endsWith("'s") ? normalized.slice(0, -2) : normalized;
}

export function displayTranslation(translation: string) {
  return translation.replaceAll("\\n", "；").replaceAll("；；", "；");
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(`${value}T00:00:00+08:00`));
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function percent(value: number, total: number) {
  if (total === 0) return 0;
  return (value / total) * 100;
}