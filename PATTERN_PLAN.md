# PATTERN IMPLEMENTATION PLAN
## Total Goal: 75+ Patterns (50% of 150 planned)

### ✅ ALREADY IMPLEMENTED (6)
1. nested-loops
2. blocking-sync-operations  
3. expensive-operations-in-loops
4. string-concatenation-in-loops
5. dom-queries-in-loops
6. memory-leaks

---

## 🎯 PRIORITY 1: CRITICAL PERFORMANCE (14 patterns)
### JavaScript Core (7)
- [ ] multiple-array-iterations - Multiple .map().filter().reduce() chains
- [ ] inefficient-object-access - Repeated deep property access
- [ ] infinite-recursion-risks - Missing base cases
- [ ] excessive-dom-manipulation - Multiple DOM updates without batching
- [ ] synchronous-xhr - Using sync XMLHttpRequest
- [ ] large-array-spreading - [...huge] in functions
- [ ] repeated-regex-compilation - new RegExp in loops

### React Performance (7)
- [ ] inline-function-props - () => {} in JSX props
- [ ] missing-react-memo - Components without memoization
- [ ] objects-in-render - Creating objects/arrays in render
- [ ] missing-keys-in-lists - Array rendering without keys
- [ ] index-as-key - Using array index as React key
- [ ] expensive-initial-state - useState with function calls
- [ ] missing-usememo - Expensive calculations without useMemo

---

## 🔴 PRIORITY 2: REACT HOOKS & STATE (15 patterns)
### Hooks Issues (8)
- [ ] missing-dependencies - useEffect missing deps
- [ ] stale-closures - Outdated values in callbacks
- [ ] conditional-hooks - Hooks in conditions
- [ ] hooks-in-loops - Hooks inside loops
- [ ] wrong-hooks-order - Inconsistent hook calls
- [ ] missing-cleanup - useEffect without cleanup
- [ ] infinite-rerender - setState in render
- [ ] unnecessary-rerenders - Poor dependency arrays

### State Management (7)
- [ ] direct-state-mutation - Mutating state directly
- [ ] async-state-batching - Multiple setState calls
- [ ] derived-state-as-state - Storing computed values
- [ ] props-in-state - Copying props to state
- [ ] missing-prevstate - setState without callback
- [ ] complex-state-logic - Need useReducer
- [ ] global-state-abuse - Context for local state

---

## 🟠 PRIORITY 3: CODE QUALITY (20 patterns)
### Functions & Complexity (10)
- [ ] function-too-long - Functions > 50 lines
- [ ] too-many-parameters - Functions with > 5 params
- [ ] high-cyclomatic-complexity - Complex branching
- [ ] deeply-nested-code - > 4 levels of nesting
- [ ] duplicate-code-blocks - Copy-pasted code
- [ ] dead-code - Unreachable code
- [ ] magic-numbers - Hardcoded values
- [ ] god-functions - Functions doing too much
- [ ] unclear-variable-names - a, b, temp, data
- [ ] missing-error-handling - No try-catch

### React Component Quality (10)
- [ ] huge-components - Components > 200 lines
- [ ] prop-drilling - Passing props > 3 levels
- [ ] missing-proptypes - No type checking
- [ ] any-typescript - Using 'any' type
- [ ] mixed-concerns - Logic and UI mixed
- [ ] inline-styles - Styles in JSX
- [ ] no-error-boundaries - Missing error handling
- [ ] console-logs - console.log in production
- [ ] commented-code - Leftover comments
- [ ] todo-comments - Unresolved TODOs

---

## 🟡 PRIORITY 4: ASYNC & PROMISES (10 patterns)
### JavaScript Async (5)
- [ ] unhandled-promises - Missing .catch()
- [ ] async-without-await - async function no await
- [ ] promise-constructor - new Promise antipattern
- [ ] blocking-await - await in loops
- [ ] race-conditions - Concurrent state updates

### React Async (5)
- [ ] fetch-in-useeffect - No cleanup for fetch
- [ ] missing-loading-state - No loading indicators
- [ ] missing-error-state - No error handling UI
- [ ] multiple-api-calls - Unoptimized requests
- [ ] missing-suspense - Could use Suspense

---

## 🔵 PRIORITY 5: SECURITY (10 patterns)
### JavaScript Security (5)
- [ ] eval-usage - Using eval()
- [ ] innerhtml-usage - XSS vulnerability
- [ ] unsafe-regex - ReDoS vulnerability
- [ ] prototype-pollution - __proto__ access
- [ ] weak-random - Math.random for security

### React Security (5)
- [ ] dangerouslysetinnerhtml - XSS risk
- [ ] unsafe-href - javascript: URLs
- [ ] exposed-secrets - API keys in code
- [ ] missing-validation - No input validation
- [ ] unsafe-dependencies - Vulnerable packages

---

## 🟢 PRIORITY 6: BEST PRACTICES (10 patterns)
### Modern JavaScript (5)
- [ ] var-usage - Using var instead of const/let
- [ ] no-template-literals - String concatenation
- [ ] old-array-methods - for loops vs map/filter
- [ ] callback-hell - Nested callbacks
- [ ] missing-optional-chaining - obj && obj.prop

### React Best Practices (5)
- [ ] class-components - Not using hooks
- [ ] fragment-missing - Extra divs
- [ ] controlled-components - Uncontrolled inputs
- [ ] missing-accessibility - No ARIA labels
- [ ] poor-folder-structure - Unorganized code

---

## 📊 SUMMARY
- **Already Done**: 6 patterns
- **To Implement**: 69 patterns
- **Total**: 75 patterns (50% of goal)

## 🚀 IMPLEMENTATION ORDER
1. **Week 1**: Priority 1 - Critical Performance (14)
2. **Week 2**: Priority 2 - React Hooks & State (15)
3. **Week 3**: Priority 3 - Code Quality (20)
4. **Week 4**: Priority 4 & 5 - Async & Security (20)
5. **Week 5**: Priority 6 - Best Practices (10)

---

## ▶ NEXT PHASE: 20 NEW PATTERNS (10 JS + 10 React)

Notes
- Follow existing contracts in `src/types.ts` and examples like `nested-loops.ts` and `inline-function-props.ts`.
- Provide complete Tooltip templates (problem, impact, solution, codeExamples, actions/learnMore).
- Register in `initializePatterns()` in `src/extension.ts`.
- Add unit tests in `tests/unit/patterns/*` mirroring `nested-loops.test.ts`.

### JavaScript (10)
1) id: excessive-dom-manipulation
	- category: Perf, severity: warning, languages: js/ts
	- Detect: multiple DOM write ops (innerText, style, classList, appendChild) in tight sequence/loop without batching (rAF/fragment).
	- Score: -8; Tests: simple loop updating DOM; Template: suggest batching or rAF.

2) id: synchronous-xhr
	- category: Perf, severity: critical, languages: js/ts
	- Detect: new XMLHttpRequest with third arg false or xhr.open(..., false) or deprecated sync fetch polyfills.
	- Score: -15; Tests: flag sync XHR; Template: switch to async fetch/await.

3) id: large-array-spreading
	- category: Perf, severity: warning, languages: js/ts
	- Detect: spread on identifiers with likely large size (heuristic: name like list/array/items and used in loops) or spread in hot loops.
	- Score: -8; Tests: spread in loop; Template: use push/apply or preallocate.

4) id: repeated-regex-compilation
	- category: Perf, severity: warning, languages: js/ts
	- Detect: new RegExp(...) or /literal/ inside loops or frequently called functions.
	- Score: -8; Tests: regex in loop; Template: hoist regex.

5) id: unhandled-promises
	- category: Maint, severity: warning, languages: js/ts
	- Detect: call returning Promise not awaited and not .then/.catch; await without try/catch in top-level critical paths.
	- Score: -8; Tests: missing catch; Template: add catch or try/catch.

6) id: async-without-await
	- category: Maint, severity: info, languages: js/ts
	- Detect: async function body has no await; may be unnecessary.
	- Score: -3; Tests: async no await; Template: remove async or add await.

7) id: blocking-await-in-loops
	- category: Perf, severity: warning, languages: js/ts
	- Detect: await inside for/for..of where independent calls could be Promise.all.
	- Score: -8; Tests: sequential vs Promise.all; Template: batch with Promise.all.

8) id: eval-usage
	- category: Sec, severity: critical, languages: js/ts
	- Detect: eval(), new Function(), setTimeout/Interval with string arg.
	- Score: -15; Tests: flag eval; Template: avoid eval, use JSON.parse or safe alternatives.

9) id: innerhtml-usage
	- category: Sec, severity: critical, languages: js/ts
	- Detect: element.innerHTML = variable/template; document.write.
	- Score: -15; Tests: flag innerHTML assignment; Template: textContent or sanitized libs.

10) id: unsafe-regex
	 - category: Sec, severity: warning, languages: js/ts
	 - Detect: regex patterns with nested quantifiers (.+)+, catastrophic backtracking heuristics.
	 - Score: -8; Tests: sample unsafe regex; Template: use safe regex or timeouts.

### React (10)
1) id: objects-in-render
	- category: Perf, severity: warning, languages: jsx/tsx
	- Detect: object/array literals in JSX props or as deps; advise useMemo/useCallback.
	- Score: -8; Tests: <Comp style={{...}} fn={() => {}}/>; Template: memoize.

2) id: index-as-key
	- category: Maint, severity: warning, languages: jsx/tsx
	- Detect: key={index} or key={i};
	- Score: -8; Tests: map with index key; Template: use stable IDs.

3) id: expensive-initial-state
	- category: Perf, severity: warning, languages: jsx/tsx
	- Detect: useState(expensiveCall()) instead of lazy initializer () => expensiveCall().
	- Score: -8; Tests: flag direct call; Template: wrap in lazy init.

4) id: missing-usememo
	- category: Perf, severity: info, languages: jsx/tsx
	- Detect: heavy calc in render without useMemo.
	- Score: -3; Tests: CPU-heavy loop; Template: memoize with deps.

5) id: stale-closures
	- category: Hooks, severity: critical, languages: jsx/tsx
	- Detect: useCallback/useEffect using vars not in deps array.
	- Score: -15; Tests: missing deps; Template: add deps or ref.

6) id: conditional-hooks
	- category: Hooks, severity: critical, languages: jsx/tsx
	- Detect: hooks inside if/try/catch/early returns.
	- Score: -15; Tests: hook in condition; Template: move hooks to top level.

7) id: hooks-in-loops
	- category: Hooks, severity: critical, languages: jsx/tsx
	- Detect: hooks inside loops.
	- Score: -15; Tests: hook in loop; Template: refactor structure.

8) id: missing-cleanup
	- category: Hooks, severity: warning, languages: jsx/tsx
	- Detect: useEffect starting subscriptions/timeouts without return cleanup.
	- Score: -8; Tests: setInterval without cleanup; Template: return cleanup.

9) id: infinite-rerender
	- category: Hooks, severity: critical, languages: jsx/tsx
	- Detect: setState in render; or effect setting state with that state in deps causing loop.
	- Score: -15; Tests: reproducing loop; Template: guard conditions/memoization.

10) id: unnecessary-rerenders
	 - category: Perf, severity: warning, languages: jsx/tsx
	 - Detect: useEffect deps include inline functions/objects created in render.
	 - Score: -8; Tests: deps with inline fn; Template: memoize deps.

### Implementation cadence
- Week A: JS (#1–#5) + React (#1–#5)
- Week B: JS (#6–#10) + React (#6–#10)

### Files to add per pattern
- `src/patterns/<id>.ts`: PatternRule + matcher.
- `tests/unit/patterns/<id>.test.ts`: Matcher tests (happy + edge case).
- Register in `initializePatterns()`.
