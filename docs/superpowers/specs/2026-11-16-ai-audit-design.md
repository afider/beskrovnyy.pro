# Audit fixes

## Intent

Apply the findings from the 2026-11-16 build audit in order, verifying each
change and keeping a local production preview available for review.

## Constraints agreed with the user

- Work on branch `ai-audit` in this checkout.
- Ask the user whether to commit and push after each verified item.
- Never commit or push without that item's approval.
- Preserve the existing site content, appearance, and 29 HTML routes.

## Approach

Upgrade the existing Astro application and make focused fixes in the audit's
order. Keep file-based MDX routes. A rewrite or a content-collection migration
would add unrelated changes and is unnecessary here. Dependency upgrades may
include the minimum API changes required for the new versions to build.

## Sequence and acceptance

1. Dependencies: supported compatible Astro/integrations; successful build,
   dependency audit, output parity, and browser checks.
2. Reproducibility: tracked lock-file, tested Node version, clean `npm ci` build.
3. Titles: nonempty, correct titles on every generated page.
4. Images: resolved metadata, actual 1x/2x sizes, correct MIME/source ordering.
5. Search: safe concurrent loading, latest query wins, recoverable errors,
   and restored scrolling when the search panel closes.
6. Languages: correct document language and Pagefind language indexes.
7. Quality gates: working type/style checks, build verification in CI, and
   deprecated application APIs updated.
8. Repository hygiene: remove unused generated/platform artifacts.

Each item remains reviewable before the next item's implementation begins.
