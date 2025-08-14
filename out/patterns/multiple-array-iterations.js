"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.multipleArrayIterationsRule = exports.MultipleArrayIterationsMatcher = void 0;
const types_1 = require("../types");
/**
 * Detects multiple chained array iterations that could be combined
 */
class MultipleArrayIterationsMatcher {
    constructor() {
        Object.defineProperty(this, "chainableMethods", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: ['map', 'filter', 'reduce', 'forEach', 'find', 'some', 'every', 'flatMap']
        });
    }
    match(node, _context) {
        if (node.type !== 'CallExpression')
            return false;
        const callee = node.callee;
        if (callee?.type !== 'MemberExpression')
            return false;
        const property = callee.property;
        if (!property || property.type !== 'Identifier')
            return false;
        // Check if it's an array method
        if (!this.chainableMethods.includes(property.name))
            return false;
        // Check if the object is another array method call
        const object = callee.object;
        if (object?.type === 'CallExpression') {
            const innerCallee = object.callee;
            if (innerCallee?.type === 'MemberExpression') {
                const innerProperty = innerCallee.property;
                if (innerProperty?.type === 'Identifier' &&
                    this.chainableMethods.includes(innerProperty.name)) {
                    // Found chained array methods
                    return true;
                }
            }
        }
        return false;
    }
    getMatchDetails(node, _context) {
        const chainLength = this.countChainLength(node);
        return {
            complexity: chainLength,
            impact: `${chainLength} iterations over the same array`,
            suggestion: 'Combine operations into a single iteration'
        };
    }
    countChainLength(node) {
        let count = 0;
        let current = node;
        while (current?.type === 'CallExpression') {
            const callee = current.callee;
            if (callee?.type === 'MemberExpression') {
                const property = callee.property;
                if (property?.type === 'Identifier' &&
                    this.chainableMethods.includes(property.name)) {
                    count++;
                    current = callee.object;
                }
                else {
                    break;
                }
            }
            else {
                break;
            }
        }
        return count;
    }
}
exports.MultipleArrayIterationsMatcher = MultipleArrayIterationsMatcher;
const multipleArrayIterationsTemplate = {
    title: '🔴 PERFORMANCE: Multiple Array Iterations Detected',
    problemDescription: 'Each array method creates a new iteration over the entire array. Chaining multiple methods results in unnecessary passes through the data.',
    impactDescription: 'With 1,000 items and 3 chained methods, you iterate 3,000 times instead of 1,000.',
    solutionDescription: 'Combine operations into a single iteration using reduce() or a single loop with multiple operations.',
    codeExamples: [
        {
            title: 'Combine filter + map',
            before: `// 2 iterations - inefficient
const result = users
  .filter(user => user.age > 18)
  .map(user => user.name);`,
            after: `// 1 iteration - efficient
const result = users.reduce((acc, user) => {
  if (user.age > 18) {
    acc.push(user.name);
  }
  return acc;
}, []);

// Or with flatMap
const result = users.flatMap(user => 
  user.age > 18 ? [user.name] : []
);`,
            improvement: '50% fewer iterations'
        },
        {
            title: 'Combine filter + map + reduce',
            before: `// 3 iterations
const total = orders
  .filter(order => order.status === 'completed')
  .map(order => order.amount)
  .reduce((sum, amount) => sum + amount, 0);`,
            after: `// 1 iteration
const total = orders.reduce((sum, order) => {
  if (order.status === 'completed') {
    return sum + order.amount;
  }
  return sum;
}, 0);`,
            improvement: '66% fewer iterations'
        }
    ],
    actions: [
        {
            label: 'Copy Optimized Solution',
            type: 'copy',
            payload: 'optimized-code'
        }
    ],
    learnMoreUrl: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce'
};
exports.multipleArrayIterationsRule = {
    id: 'multiple-array-iterations',
    name: 'Multiple Array Iterations',
    description: 'Detects chained array methods that iterate multiple times',
    category: types_1.PatternCategory.Performance,
    severity: 'warning',
    languages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact'],
    enabled: true,
    matcher: new MultipleArrayIterationsMatcher(),
    template: multipleArrayIterationsTemplate,
    scoreImpact: -8
};
//# sourceMappingURL=multiple-array-iterations.js.map