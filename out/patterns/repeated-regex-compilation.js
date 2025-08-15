"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.repeatedRegexCompilationRule = void 0;
const types_1 = require("../types");
class RepeatedRegexCompilationMatcher {
    match(node, _context) {
        if (!node)
            return false;
        // Detect new RegExp(...) inside loops or function bodies that look frequently called
        if (node.type === 'ForStatement' || node.type === 'ForInStatement' || node.type === 'ForOfStatement' || node.type === 'WhileStatement' || node.type === 'DoWhileStatement') {
            const body = node.body;
            if (body) {
                return this.containsRegexCreation(body);
            }
        }
        return false;
    }
    containsRegexCreation(n) {
        if (!n)
            return false;
        if (n.type === 'NewExpression') {
            const callee = n.callee;
            if ((callee?.type === 'Identifier' && callee.name === 'RegExp')) {
                return true;
            }
        }
        if (n.type === 'Literal' && n.regex) {
            // Babel may represent regex literals differently; keep minimal
            return true;
        }
        for (const key in n) {
            const v = n[key];
            if (Array.isArray(v)) {
                if (v.some((c) => c && typeof c === 'object' && this.containsRegexCreation(c)))
                    return true;
            }
            else if (v && typeof v === 'object') {
                if (this.containsRegexCreation(v))
                    return true;
            }
        }
        return false;
    }
}
const template = {
    title: '🟠 PERFORMANCE: Repeated RegExp Compilation in Loops',
    problemDescription: 'Creating regular expressions repeatedly in hot paths is expensive and unnecessary.',
    impactDescription: 'Increased CPU usage and GC pressure, especially inside loops.',
    solutionDescription: 'Hoist regex creation outside the loop or cache compiled expressions.',
    codeExamples: [
        {
            title: 'Hoist regex outside loop',
            before: `for (const s of list) {
  const re = new RegExp('^foo'); // recompiled on every iteration ❌
  count += re.test(s) ? 1 : 0;
}`,
            after: `const re = /^foo/; // or new RegExp('^foo')
for (const s of list) {
  count += re.test(s) ? 1 : 0; // reused ✅
}`,
            improvement: 'Avoids redundant allocations'
        }
    ],
    actions: [
        { label: 'Copy hoisted example', type: 'copy', payload: 'const re = /pattern/; /* reuse in loop */' }
    ],
    learnMoreUrl: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_expressions'
};
exports.repeatedRegexCompilationRule = {
    id: 'repeated-regex-compilation',
    name: 'Repeated RegExp Compilation',
    description: 'Detects repeated RegExp compilation in loops',
    category: types_1.PatternCategory.Performance,
    severity: 'warning',
    languages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact'],
    enabled: true,
    matcher: new RepeatedRegexCompilationMatcher(),
    template,
    scoreImpact: -8
};
//# sourceMappingURL=repeated-regex-compilation.js.map