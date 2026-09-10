# Article authoring

## Contract

Each article is a Markdown file in `content/articles/` with YAML frontmatter.
The English body must be 650-750 words. Each article declares 35-45 focus words from the canonical vocabulary list. The completed corpus covers all 2,085 entries.

The renderer automatically turns every English token into an interactive span
and adds `word-target` to words present in the vocabulary list. Do not manually
bold the target words in the Markdown source.

## Workflow

1. Pick focus words from `content/focus-sets.json` that have not been covered.
2. Write an original English article around a concrete story or question.
3. Use reliable sources and record 3-5 links in the frontmatter.
4. Run `pnpm content:validate`.
5. Regenerate dictionary chunks after adding or changing article text.
6. Run `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build`.

## Local data rebuild

The raw PDF and ECDICT CSV stay in `.cache/` and are not committed.

```bash
python scripts/extract_vocabulary.py --pdf "大学英语六级词汇乱序版.pdf" --ecdict ".cache/ECDICT/ecdict.csv"
python scripts/build_dictionary.py --ecdict ".cache/ECDICT/ecdict.csv"
```

`pnpm content:validate` is the source of truth for article length, focus-word
presence, source count, and first-batch coverage.