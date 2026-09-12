# Article authoring

## Contract

Each article is a Markdown file in `content/articles/` with YAML frontmatter.
The English body must be 650-750 words. Each article declares 46-47 focus words from the canonical vocabulary list. The completed corpus assigns every one of the 2,085 entries to exactly one article.

The renderer automatically turns every English token into an interactive span
and adds `word-target` to words present in the vocabulary list. Do not manually
bold the target words in the Markdown source.

## Workflow

1. Add the article body and a provisional `focusWords` list.
2. Write an original English article around a concrete story or question.
3. Use reliable sources and record 3-5 links in the frontmatter.
4. Run `pnpm content:validate` and keep the body at 650-750 English words.
5. Run `python scripts/assign_vocabulary.py` to redistribute all vocabulary fairly, then regenerate dictionary chunks.
6. Run `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build`.

## Local data rebuild

The raw PDF and ECDICT CSV stay in `.cache/` and are not committed.

```bash
python scripts/extract_vocabulary.py --pdf "大学英语六级词汇乱序版.pdf" --ecdict ".cache/ECDICT/ecdict.csv"
python scripts/build_dictionary.py --ecdict ".cache/ECDICT/ecdict.csv"
```

`pnpm content:validate` is the source of truth for article length, one-time word ownership, source count, and 100% coverage.