"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.expensiveOperationsInLoopsRule = exports.ExpensiveOperationsInLoopsMatcher = void 0;
const types_1 = require("../types");
/**
 * Matcher for detecting expensive operations inside loops
 */
class ExpensiveOperationsInLoopsMatcher {
    constructor() {
        Object.defineProperty(this, "expensiveArrayMethods", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: [
                'find', 'findIndex', 'indexOf', 'includes', 'filter', 'map', 'reduce',
                'some', 'every', 'sort', 'reverse', 'join', 'slice', 'splice'
            ]
        });
        Object.defineProperty(this, "expensiveDOMMethods", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: [
                'querySelector', 'querySelectorAll', 'getElementById', 'getElementsByClassName',
                'getElementsByTagName', 'createElement', 'appendChild', 'removeChild',
                'insertBefore', 'replaceChild'
            ]
        });
        Object.defineProperty(this, "expensiveObjectOperations", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: [
                'Object.keys', 'Object.values', 'Object.entries', 'Object.assign',
                'JSON.stringify', 'JSON.parse'
            ]
        });
    }
    match(node, context) {
        // Only check call expressions inside loops
        if (node.type !== 'CallExpression')
            return false;
        // Check if we're inside a loop
        if (!this.isInsideLoop(node, context))
            return false;
        // Check for expensive array methods
        if (this.isExpensiveArrayMethod(node))
            return true;
        // Check for DOM operations
        if (this.isExpensiveDOMOperation(node))
            return true;
        // Check for expensive object operations
        if (this.isExpensiveObjectOperation(node))
            return true;
        // Check for repeated function calls
        if (this.isRepeatedFunctionCall(node))
            return true;
        return false;
    }
    getMatchDetails(node, _context) {
        const operationType = this.getOperationType(node);
        const methodName = this.getMethodName(node);
        return {
            complexity: this.estimateComplexity(operationType, methodName),
            impact: `${operationType} operation in loop creates O(n²) or worse complexity`,
            suggestion: this.getSuggestion(operationType, methodName)
        };
    }
    isInsideLoop(node, context) {
        // This is a simplified check - in a real implementation,
        // we would traverse up the AST to check parent nodes
        const sourceCode = context.sourceCode;
        const nodeStart = node.start || 0;
        // Look for loop keywords before this node
        const codeBeforeNode = sourceCode.substring(0, nodeStart);
        const loopKeywords = ['for (', 'for(', 'while (', 'while(', 'do {', 'forEach(', '.map(', '.filter('];
        return loopKeywords.some(keyword => {
            const lastIndex = codeBeforeNode.lastIndexOf(keyword);
            if (lastIndex === -1)
                return false;
            // Check if there's a closing brace between the loop and our node
            const codeBetween = sourceCode.substring(lastIndex, nodeStart);
            const openBraces = (codeBetween.match(/{/g) || []).length;
            const closeBraces = (codeBetween.match(/}/g) || []).length;
            return openBraces > closeBraces; // We're still inside the loop
        });
    }
    isExpensiveArrayMethod(node) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const callee = node.callee;
        if (callee?.type === 'MemberExpression') {
            const property = callee.property;
            return property && this.expensiveArrayMethods.includes(property.name);
        }
        return false;
    }
    isExpensiveDOMOperation(node) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const callee = node.callee;
        // Direct DOM method calls
        if (callee?.type === 'Identifier') {
            return this.expensiveDOMMethods.includes(callee.name);
        }
        // document.* or element.* calls
        if (callee?.type === 'MemberExpression') {
            const object = callee.object;
            const property = callee.property;
            if ((object?.name === 'document' || object?.name === 'element') && property) {
                return this.expensiveDOMMethods.includes(property.name);
            }
        }
        return false;
    }
    isExpensiveObjectOperation(node) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const callee = node.callee;
        if (callee?.type === 'MemberExpression') {
            const object = callee.object;
            const property = callee.property;
            if (object?.name === 'Object' && property) {
                return this.expensiveObjectOperations.some(op => op.includes(property.name));
            }
            if (object?.name === 'JSON' && property) {
                return ['stringify', 'parse'].includes(property.name);
            }
        }
        return false;
    }
    isRepeatedFunctionCall(node) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const callee = node.callee;
        // Check for function calls that should be cached
        if (callee?.type === 'MemberExpression') {
            const property = callee.property;
            // Common patterns that should be cached
            const shouldBeCached = [
                'length', 'size', 'count', 'width', 'height',
                'getAttribute', 'getComputedStyle', 'getBoundingClientRect'
            ];
            return property && shouldBeCached.includes(property.name);
        }
        return false;
    }
    getOperationType(node) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const callee = node.callee;
        if (callee?.type === 'MemberExpression') {
            const object = callee.object;
            const property = callee.property;
            if (object?.name === 'document' || this.expensiveDOMMethods.includes(property?.name)) {
                return 'DOM';
            }
            if (this.expensiveArrayMethods.includes(property?.name)) {
                return 'Array';
            }
            if (object?.name === 'Object' || object?.name === 'JSON') {
                return 'Object';
            }
        }
        return 'Function';
    }
    getMethodName(node) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const callee = node.callee;
        if (callee?.type === 'Identifier') {
            return callee.name;
        }
        if (callee?.type === 'MemberExpression') {
            return callee.property?.name || 'unknown';
        }
        return 'unknown';
    }
    estimateComplexity(_operationType, methodName) {
        const complexityMap = {
            'find': 2,
            'indexOf': 2,
            'includes': 2,
            'filter': 2,
            'sort': 3,
            'querySelector': 2,
            'querySelectorAll': 3,
            'Object.keys': 2,
            'JSON.stringify': 2
        };
        return complexityMap[methodName] || 2;
    }
    getSuggestion(operationType, _methodName) {
        const suggestions = {
            'DOM': 'Cache DOM queries outside the loop or use document fragments',
            'Array': 'Cache array methods or use more efficient algorithms like Map/Set',
            'Object': 'Cache object operations outside the loop',
            'Function': 'Move expensive calculations outside the loop or use memoization'
        };
        return suggestions[operationType] || 'Cache this operation outside the loop';
    }
}
exports.ExpensiveOperationsInLoopsMatcher = ExpensiveOperationsInLoopsMatcher;
/**
 * Tooltip template for expensive operations in loops
 */
const expensiveOperationsInLoopsTemplate = {
    title: '🔴 PERFORMANCE CRITICAL: Expensive Operation in Loop',
    problemDescription: 'Expensive operations inside loops create multiplicative performance degradation. Each iteration repeats costly computations that could be done once.',
    impactDescription: 'With 1,000 iterations, a 10ms operation becomes 10 seconds of blocking time. DOM queries can be 100x slower in loops.',
    solutionDescription: 'Move expensive operations outside loops, cache results, or use more efficient data structures like Map/Set for lookups.',
    codeExamples: [
        {
            title: 'Array Operations in Loops',
            before: `// ❌ O(n²) - find() runs for each iteration
for (let i = 0; i < users.length; i++) {
  const userPost = posts.find(p => p.userId === users[i].id);
  const userRole = roles.find(r => r.userId === users[i].id);
  results.push({ user: users[i], post: userPost, role: userRole });
}`,
            after: `// ✅ O(n) - Create lookup maps once
const postsByUserId = new Map(posts.map(p => [p.userId, p]));
const rolesByUserId = new Map(roles.map(r => [r.userId, r]));

for (let i = 0; i < users.length; i++) {
  const user = users[i];
  results.push({
    user,
    post: postsByUserId.get(user.id),
    role: rolesByUserId.get(user.id)
  });
}`,
            improvement: '1000x faster with large datasets (O(n²) → O(n))'
        },
        {
            title: 'DOM Operations in Loops',
            before: `// ❌ Queries DOM on every iteration
for (let i = 0; i < items.length; i++) {
  const container = document.querySelector('.container');
  const element = document.createElement('div');
  element.textContent = items[i].name;
  container.appendChild(element);
}`,
            after: `// ✅ Cache DOM reference and use fragment
const container = document.querySelector('.container');
const fragment = document.createDocumentFragment();

for (let i = 0; i < items.length; i++) {
  const element = document.createElement('div');
  element.textContent = items[i].name;
  fragment.appendChild(element);
}

container.appendChild(fragment);`,
            improvement: '50-100x faster DOM manipulation'
        },
        {
            title: 'Object Operations in Loops',
            before: `// ❌ JSON.stringify in every iteration
for (let i = 0; i < data.length; i++) {
  const serialized = JSON.stringify(config);
  processData(data[i], serialized);
}

// ❌ Repeated property access
for (let i = 0; i < items.length; i++) {
  if (items[i].value > settings.threshold.max) {
    results.push(items[i]);
  }
}`,
            after: `// ✅ Cache expensive operations
const serializedConfig = JSON.stringify(config);
for (let i = 0; i < data.length; i++) {
  processData(data[i], serializedConfig);
}

// ✅ Cache property access
const maxThreshold = settings.threshold.max;
for (let i = 0; i < items.length; i++) {
  if (items[i].value > maxThreshold) {
    results.push(items[i]);
  }
}`,
            improvement: 'Eliminates redundant serialization and property lookups'
        }
    ],
    actions: [
        {
            label: 'Copy Optimized Solution',
            type: 'copy',
            payload: 'optimized-loop'
        },
        {
            label: 'Apply Quick Fix',
            type: 'apply',
            payload: 'cache-operation'
        },
        {
            label: 'Learn About Loop Optimization',
            type: 'explain',
            payload: 'loop-optimization'
        }
    ],
    learnMoreUrl: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Loops_and_iteration'
};
/**
 * Expensive operations in loops pattern rule
 */
exports.expensiveOperationsInLoopsRule = {
    id: 'expensive-operations-in-loops',
    name: 'Expensive Operations in Loops',
    description: 'Detects expensive operations that should be moved outside loops',
    category: types_1.PatternCategory.Performance,
    severity: 'critical',
    languages: ['javascript', 'typescript', 'typescriptreact', 'javascriptreact'],
    enabled: true,
    matcher: new ExpensiveOperationsInLoopsMatcher(),
    template: expensiveOperationsInLoopsTemplate,
    scoreImpact: -15
};
//# sourceMappingURL=expensive-operations-in-loops.js.map