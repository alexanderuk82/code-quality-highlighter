"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nestedLoopRule = exports.NestedLoopMatcher = void 0;
const types_1 = require("../types");
/**
 * Matcher for detecting nested loops (O(n²) complexity)
 */
class NestedLoopMatcher {
    match(node, _context) {
        // Check if this is a loop statement
        if (!this.isLoopStatement(node)) {
            return false;
        }
        // Check if this loop contains another loop
        return this.containsNestedLoop(node);
    }
    getMatchDetails(node, _context) {
        const nestedLoops = this.countNestedLoops(node);
        // Rough estimate of time complexity: O(n^nestedLoops)
        // const estimatedComplexity = Math.pow(10, nestedLoops);
        return {
            complexity: nestedLoops,
            impact: `O(n^${nestedLoops}) complexity - potential performance bottleneck`,
            suggestion: 'Consider using hash maps, array methods, or algorithmic optimization'
        };
    }
    isLoopStatement(node) {
        // Handle null/undefined nodes
        if (!node || !node.type) {
            return false;
        }
        return [
            'ForStatement',
            'WhileStatement',
            'DoWhileStatement',
            'ForInStatement',
            'ForOfStatement'
        ].includes(node.type);
    }
    containsNestedLoop(node) {
        // Get the body of the loop
        const body = this.getLoopBody(node);
        if (!body)
            return false;
        // Check if body contains another loop
        return this.hasLoopInBody(body);
    }
    getLoopBody(node) {
        switch (node.type) {
            case 'ForStatement':
            case 'WhileStatement':
            case 'DoWhileStatement':
            case 'ForInStatement':
            case 'ForOfStatement':
                return node.body || null;
            default:
                return null;
        }
    }
    hasLoopInBody(body) {
        if (!body)
            return false;
        // Direct check
        if (this.isLoopStatement(body)) {
            return true;
        }
        // Check in block statement
        if (body.type === 'BlockStatement' && body.body) {
            return body.body.some((stmt) => this.hasLoopAnywhere(stmt));
        }
        return false;
    }
    hasLoopAnywhere(node) {
        if (!node)
            return false;
        if (this.isLoopStatement(node)) {
            return true;
        }
        // Recursively check all properties
        for (const key in node) {
            const value = node[key];
            if (Array.isArray(value)) {
                if (value.some(item => item && this.hasLoopAnywhere(item))) {
                    return true;
                }
            }
            else if (value && typeof value === 'object' && value.type) {
                if (this.hasLoopAnywhere(value)) {
                    return true;
                }
            }
        }
        return false;
    }
    countNestedLoops(node, depth = 1) {
        const body = this.getLoopBody(node);
        if (!body)
            return depth;
        let maxDepth = depth;
        const traverse = (n, currentDepth) => {
            if (this.isLoopStatement(n)) {
                maxDepth = Math.max(maxDepth, currentDepth + 1);
                const childBody = this.getLoopBody(n);
                if (childBody) {
                    traverse(childBody, currentDepth + 1);
                }
            }
            // Traverse children
            for (const key in n) {
                const value = n[key];
                if (Array.isArray(value)) {
                    value.forEach(item => {
                        if (item && typeof item === 'object' && item.type) {
                            traverse(item, currentDepth);
                        }
                    });
                }
                else if (value && typeof value === 'object' && value.type) {
                    traverse(value, currentDepth);
                }
            }
        };
        if (body) {
            traverse(body, depth);
        }
        return maxDepth;
    }
}
exports.NestedLoopMatcher = NestedLoopMatcher;
/**
 * Tooltip template for nested loop pattern
 */
const nestedLoopTemplate = {
    title: '🔴 PERFORMANCE CRITICAL: Nested Loops Detected',
    problemDescription: 'Nested loops create O(n²) or higher complexity, causing exponential performance degradation with larger datasets.',
    impactDescription: 'With 1,000 elements, this could result in 1,000,000 iterations instead of 2,000.',
    solutionDescription: 'Use hash maps, Set objects, or array methods like filter/map/reduce to achieve linear O(n) complexity.',
    codeExamples: [
        {
            title: 'Problematic Code',
            before: `// O(n²) - Inefficient nested loops
for (let i = 0; i < users.length; i++) {
  for (let j = 0; j < posts.length; j++) {
    if (users[i].id === posts[j].userId) {
      results.push({user: users[i], post: posts[j]});
    }
  }
}`,
            after: `// O(n) - Optimized with Map
const userMap = new Map(users.map(u => [u.id, u]));
const results = posts
  .filter(post => userMap.has(post.userId))
  .map(post => ({
    user: userMap.get(post.userId),
    post: post
  }));`,
            improvement: '99.9% faster (1M → 2K operations)'
        },
        {
            title: 'Alternative Solution',
            before: `// Finding common elements
const common = [];
for (let i = 0; i < arr1.length; i++) {
  for (let j = 0; j < arr2.length; j++) {
    if (arr1[i] === arr2[j]) {
      common.push(arr1[i]);
    }
  }
}`,
            after: `// Using Set for O(n) lookup
const set2 = new Set(arr2);
const common = arr1.filter(item => set2.has(item));`,
            improvement: 'Linear complexity instead of quadratic'
        }
    ],
    actions: [
        {
            label: 'Copy Optimized Solution',
            type: 'copy',
            payload: 'optimized-code'
        },
        {
            label: 'Apply Quick Fix',
            type: 'apply',
            payload: 'auto-fix'
        },
        {
            label: 'Learn More About Big O',
            type: 'explain',
            payload: 'big-o-explanation'
        }
    ],
    learnMoreUrl: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map'
};
/**
 * Nested loop pattern rule
 */
exports.nestedLoopRule = {
    id: 'nested-loops',
    name: 'Nested Loops',
    description: 'Detects nested loops that create O(n²) or higher complexity',
    category: types_1.PatternCategory.Performance,
    severity: 'critical',
    languages: ['javascript', 'typescript', 'typescriptreact', 'javascriptreact'],
    enabled: true,
    matcher: new NestedLoopMatcher(),
    template: nestedLoopTemplate,
    scoreImpact: -15
};
//# sourceMappingURL=nested-loops.js.map