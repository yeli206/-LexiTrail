import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { unified } from "unified";
import { visit } from "unist-util-visit";
import type { Element, Root, Text } from "hast";
import { getVocabularyEntry } from "@/lib/vocabulary";
import { normalizeToken } from "@/lib/utils";

const TOKEN_PATTERN = /[A-Za-z]+(?:['’][A-Za-z]+)*(?:-[A-Za-z]+)*/g;
const SKIP_PARENTS = new Set(["code", "pre", "script", "style"]);

function wordify(tree: Root) {
  visit(tree, "text", (node: Text, index, parent) => {
    if (index === undefined || !parent) return;
    if (parent.type === "element" && SKIP_PARENTS.has((parent as Element).tagName)) {
      return;
    }
    if (!/[A-Za-z]/.test(node.value)) return;

    const children: Array<Text | Element> = [];
    let cursor = 0;
    for (const match of node.value.matchAll(TOKEN_PATTERN)) {
      const start = match.index ?? 0;
      const raw = match[0];
      if (start > cursor) {
        children.push({ type: "text", value: node.value.slice(cursor, start) });
      }

      const entry = getVocabularyEntry(raw);
      children.push({
        type: "element",
        tagName: "span",
        properties: {
          className: entry ? ["word-token", "word-target"] : ["word-token"],
          "data-word": raw,
          "data-lemma": entry?.lemma ?? normalizeToken(raw),
          "data-source-id": entry?.id,
        },
        children: [{ type: "text", value: raw }],
      });
      cursor = start + raw.length;
    }

    if (cursor < node.value.length) {
      children.push({ type: "text", value: node.value.slice(cursor) });
    }

    parent.children.splice(index, 1, ...children);
    return index + children.length;
  });
}

export async function renderArticleBody(markdown: string) {
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(() => wordify)
    .use(rehypeStringify)
    .process(markdown);

  return String(file);
}