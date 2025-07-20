"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.domQueriesInLoopsRule = exports.DOMQueriesInLoopsMatcher = void 0;
const types_1 = require("../types");
/**
 * Matcher for detecting DOM query operations inside loops
 */
class DOMQueriesInLoopsMatcher {
    constructor() {
        Object.defineProperty(this, "domQueryMethods", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: [
                'querySelector', 'querySelectorAll', 'getElementById', 'getElementsByClassName',
                'getElementsByTagName', 'getElementsByName', 'closest', 'matches'
            ]
        });
        Object.defineProperty(this, "domManipulationMethods", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: [
                'appendChild', 'removeChild', 'insertBefore', 'replaceChild',
                'createElement', 'createTextNode', 'createDocumentFragment',
                'insertAdjacentHTML', 'insertAdjacentElement', 'insertAdjacentText'
            ]
        });
        Object.defineProperty(this, "expensiveStyleMethods", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: [
                'getComputedStyle', 'getBoundingClientRect', 'getClientRects',
                'offsetWidth', 'offsetHeight', 'clientWidth', 'clientHeight',
                'scrollWidth', 'scrollHeight', 'offsetTop', 'offsetLeft'
            ]
        });
    }
    match(node, context) {
        if (!this.isRelevantNode(node))
            return false;
        if (!this.isInsideLoop(node, context))
            return false;
        return this.isDOMQueryMethod(node) ||
            this.isDOMManipulationMethod(node) ||
            this.isExpensiveStyleMethod(node);
    }
    getMatchDetails(node, _context) {
        const operationType = this.getDOMOperationType(node);
        return {
            complexity: this.estimateComplexity(operationType),
            impact: `${operationType} operation in loop forces browser reflow/repaint on each iteration`,
            suggestion: this.getSuggestion(operationType)
        };
    }
    isRelevantNode(node) {
        return node.type === 'CallExpression' ||
            node.type === 'MemberExpression';
    }
    isInsideLoop(node, context) {
        const sourceCode = context.sourceCode;
        const nodeStart = node.start || 0;
        const codeBeforeNode = sourceCode.substring(0, nodeStart);
        const loopKeywords = [
            'for (', 'for(', 'while (', 'while(', 'do {',
            '.forEach(', '.map(', '.filter(', '.reduce('
        ];
        return loopKeywords.some(keyword => {
            const lastIndex = codeBeforeNode.lastIndexOf(keyword);
            if (lastIndex === -1)
                return false;
            const codeBetween = sourceCode.substring(lastIndex, nodeStart);
            const openBraces = (codeBetween.match(/{/g) || []).length;
            const closeBraces = (codeBetween.match(/}/g) || []).length;
            return openBraces > closeBraces;
        });
    }
    isDOMQueryMethod(node) {
        const methodName = this.getMethodName(node);
        return methodName ? this.domQueryMethods.includes(methodName) : false;
    }
    isDOMManipulationMethod(node) {
        const methodName = this.getMethodName(node);
        return methodName ? this.domManipulationMethods.includes(methodName) : false;
    }
    isExpensiveStyleMethod(node) {
        const methodName = this.getMethodName(node);
        return methodName ? this.expensiveStyleMethods.includes(methodName) : false;
    }
    getMethodName(node) {
        if (node.type === 'CallExpression' && node.callee?.type === 'MemberExpression') {
            return node.callee.property?.name || null;
        }
        return null;
    }
    getDOMOperationType(node) {
        const methodName = this.getMethodName(node);
        if (methodName && this.domQueryMethods.includes(methodName)) {
            return 'DOM Query';
        }
        if (methodName && this.domManipulationMethods.includes(methodName)) {
            return 'DOM Manipulation';
        }
        if (methodName && this.expensiveStyleMethods.includes(methodName)) {
            return 'Style/Layout';
        }
        return 'DOM Operation';
    }
    estimateComplexity(operationType) {
        const complexityMap = {
            'DOM Query': 3,
            'DOM Manipulation': 2,
            'Style/Layout': 4
        };
        return complexityMap[operationType] || 2;
    }
    getSuggestion(operationType) {
        const suggestions = {
            'DOM Query': 'Cache DOM elements outside the loop',
            'DOM Manipulation': 'Use document fragments for bulk operations',
            'Style/Layout': 'Cache layout properties outside the loop'
        };
        return suggestions[operationType] || 'Cache DOM operations outside the loop';
    }
}
exports.DOMQueriesInLoopsMatcher = DOMQueriesInLoopsMatcher;
/**
 * Tooltip template for DOM queries in loops
 */
const domQueriesInLoopsTemplate = {
    title: '🔴 PERFORMANCE CRITICAL: DOM Operations in Loop',
    problemDescription: 'DOM queries and manipulations inside loops force the browser to recalculate layout and styles repeatedly, causing severe performance degradation.',
    impactDescription: 'Each DOM operation can trigger reflow/repaint. With 1,000 iterations, this creates 1,000 expensive browser operations instead of 1.',
    solutionDescription: 'Cache DOM elements outside loops, use document fragments for bulk operations, or batch DOM changes to minimize browser reflows.',
    codeExamples: [
        {
            title: 'DOM Query Caching',
            before: `// ❌ Queries DOM on every iteration
for (let i = 0; i < items.length; i++) {
  const container = document.querySelector('.container');
  const element = document.createElement('div');
  element.textContent = items[i].name;
  container.appendChild(element);
}`,
            after: `// ✅ Cache DOM references and use fragment
const container = document.querySelector('.container');
const fragment = document.createDocumentFragment();

for (let i = 0; i < items.length; i++) {
  const element = document.createElement('div');
  element.textContent = items[i].name;
  fragment.appendChild(element);
}
container.appendChild(fragment);`,
            improvement: '10-100x faster DOM operations'
        },
        {
            title: 'Style Queries Optimization',
            before: `// ❌ Forces style recalculation each iteration
for (let i = 0; i < elements.length; i++) {
  const height = elements[i].offsetHeight;
  const style = getComputedStyle(elements[i]);
  elements[i].style.top = height + 'px';
}`,
            after: `// ✅ Batch style queries and updates
const heights = elements.map(el => el.offsetHeight);
const styles = elements.map(el => getComputedStyle(el));

elements.forEach((el, i) => {
  el.style.top = heights[i] + 'px';
});`,
            improvement: 'Eliminates layout thrashing'
        }
    ],
    actions: [
        {
            label: 'Copy Fragment Solution',
            type: 'copy',
            payload: 'document-fragment-solution'
        },
        {
            label: 'Apply Quick Fix',
            type: 'apply',
            payload: 'cache-dom-queries'
        },
        {
            label: 'Learn About DOM Performance',
            type: 'explain',
            payload: 'dom-performance'
        }
    ],
    learnMoreUrl: 'https://developer.mozilla.org/en-US/docs/Web/API/DocumentFragment'
};
/**
 * DOM queries in loops pattern rule
 */
exports.domQueriesInLoopsRule = {
    id: 'dom-queries-in-loops',
    name: 'DOM Queries in Loops',
    description: 'Detects expensive DOM operations inside loops that cause performance issues',
    category: types_1.PatternCategory.Performance,
    severity: 'critical',
    languages: ['javascript', 'typescript', 'typescriptreact', 'javascriptreact'],
    enabled: true,
    matcher: new DOMQueriesInLoopsMatcher(),
    template: domQueriesInLoopsTemplate,
    scoreImpact: -15
};
//# sourceMappingURL=dom-queries-in-loops.js.map