## Copilot instructions for this repo

Goal: Help implement and evolve a VS Code extension that analyzes JS/TS/React files, highlights patterns, and shows rich tooltips with a quality score.

Architecture (read these first)
- `src/extension.ts`: registers analyzers, pattern rules, commands, status bar, and event listeners (change/save/active editor/config).
- `src/patterns/engine.ts`: holds `PatternRule`s and traverses AST, calling each rule’s `matcher.match(node, context)`; injects `template` into matches.
- `src/analyzers/javascript.ts`: Babel-based parser and extra checks; `TypeScriptAnalyzer` extends it. Base utilities in `src/analyzers/base.ts`.
- `src/ui/decorations.ts`: renders severity-based decorations and builds hover Markdown using `match.template` with Copy/Replace command links.
- `src/scoring/calculator.ts`: maps severities to score impact and applies category weights; used in status bar and report webview.

Contracts (see `src/types.ts`)
- PatternRule: `{ id, category, severity, languages, matcher, template, scoreImpact, enabled }`.
- PatternMatcher: implement `match(node, context)` (+ optional `getMatchDetails`).
- PatternMatch: must include `range` (derived from `node.loc`), `severity`, `category`, optional `template` for tooltips.
- TooltipTemplate: problem/impact/solution + `codeExamples[]` and optional actions/learnMore.

Build/test/package
- Build/watch: `npm run compile` / `npm run watch`. Tests: `npm test` (Jest + ts-jest). Single test: `npm test -- tests/unit/patterns/nested-loops.test.ts`.
- Package/publish: `npm run package` (vsce). Install VSIX to try locally.

Add a pattern (example-driven)
- Start from `src/patterns/nested-loops.ts` (critical Perf) or `inline-function-props.ts` (React warning). Export a `PatternRule` + `PatternMatcher`.
- Provide a complete `template`; without it, `decorations.ts` hover returns undefined and users see no details.
- Register in `initializePatterns()` in `src/extension.ts` via `patternEngine.registerRule(...)`.

Analyzer guidance
- Parser: `@babel/parser` with many plugins; TS mode toggled by heuristics in `containsTypeScriptSyntax`. TS-only patterns should account for this.
- Prefer generic rules in `src/patterns` via engine traversal; use `@babel/traverse` inside the JS/TS analyzer when you need context-sensitive JS checks.

UI/Scoring conventions
- Severity → visuals: critical=red, warning=orange, info=yellow, good=green; hover content varies by severity (good = praise/benefits only).
- Score impacts: critical -15, warning -8, info -3, good +2; category weights: Perf 35%, Sec 30%, Maint 25%, Style 10%.

Testing
- Pattern matcher tests live in `tests/unit/patterns/*`; build ASTs with `@babel/parser` and assert `matcher.match(...)` and `getMatchDetails(...)` (see `nested-loops.test.ts`).

Gotchas
- Ensure AST nodes carry `loc`; ranges are created from `loc` and later converted to VS Code `Range` in `decorations.ts`.
- React-only rules should check file type (see `isReactFile` in `inline-function-props.ts`). PHP parser is present but no analyzer is wired yet.
