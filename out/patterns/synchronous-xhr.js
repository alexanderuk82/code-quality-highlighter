"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.synchronousXhrRule = void 0;
const types_1 = require("../types");
class SynchronousXhrMatcher {
    match(node, _context) {
        if (!node)
            return false;
        // Match xhr.open(method, url, false)
        if (node.type === 'CallExpression') {
            const callee = node.callee;
            if (callee?.type === 'MemberExpression' && callee.property?.name === 'open') {
                const args = node.arguments || [];
                if (args.length >= 3) {
                    const third = args[2];
                    // Explicit false literal marks sync XHR
                    if (third && third.value === false) {
                        return true;
                    }
                }
            }
        }
        // new XMLHttpRequest() followed by .open with false is handled by above; here we keep minimal matching
        return false;
    }
}
const template = {
    title: '🔴 PERFORMANCE: Synchronous XHR Detected',
    problemDescription: 'Synchronous XMLHttpRequest blocks the main thread and freezes the UI until the request completes.',
    impactDescription: 'Severe UX degradation, jank, and potential timeouts in the browser.',
    solutionDescription: 'Use async APIs (fetch/await) or async XHR (third parameter true) and handle completion via promises or callbacks.',
    codeExamples: [
        {
            title: 'Replace sync XHR with fetch',
            before: `const xhr = new XMLHttpRequest();
xhr.open('GET', '/api/data', false); // sync ❌
xhr.send();
const res = xhr.responseText;`,
            after: 'const res = await fetch(\'/api/data\').then(r => r.text()); // async ✅',
            improvement: 'Non-blocking request keeps UI responsive'
        }
    ],
    actions: [
        { label: 'Copy fetch example', type: 'copy', payload: 'const res = await fetch(\'/api/data\').then(r => r.text());' }
    ],
    learnMoreUrl: 'https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/Synchronous_and_Asynchronous_Requests'
};
exports.synchronousXhrRule = {
    id: 'synchronous-xhr',
    name: 'Synchronous XHR',
    description: 'Detects synchronous XMLHttpRequest usage',
    category: types_1.PatternCategory.Performance,
    severity: 'critical',
    languages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact'],
    enabled: true,
    matcher: new SynchronousXhrMatcher(),
    template,
    scoreImpact: -15
};
//# sourceMappingURL=synchronous-xhr.js.map