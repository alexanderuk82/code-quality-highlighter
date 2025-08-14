import { AnyASTNode, PatternMatcher, MatchContext, MatchDetails, TooltipTemplate, PatternRule, PatternCategory } from '../types';

/**
 * Detects multiple array iterations that can be optimized into single-pass operations
 *
 * Problematic patterns:
 * - arr.map().filter().reduce() chains
 * - Multiple separate iterations over the same array
 * - Nested array methods creating O(n²) complexity
 *
 * Performance impact: Reduces O(3n) to O(n) complexity
 */
export class MultipleArrayIterationsMatcher implements PatternMatcher {
  private readonly chainableArrayMethods = [
    'map', 'filter', 'reduce', 'sort', 'reverse', 'slice', 'concat'
  ];

  public match(node: AnyASTNode, context: MatchContext): boolean {
    if (!this.isRelevantNode(node)) return false;

    return this.hasChainedArrayMethods(node) ||
           this.hasMultipleIterationsOnSameArray(node, context);
  }

  public getMatchDetails(node: AnyASTNode, _context: MatchContext): MatchDetails {
    const chainLength = this.getChainLength(node);
    const arrayName = this.getArrayName(node);

    return {
      complexity: this.calculateComplexity(chainLength),
      impact: `${chainLength} separate iterations over array '${arrayName}' - O(${chainLength}n) complexity`,
      suggestion: this.getSuggestion(node, chainLength)
    };
  }

  private isRelevantNode(node: AnyASTNode): boolean {
    return node.type === 'CallExpression';
  }

  private hasChainedArrayMethods(node: AnyASTNode): boolean {
    if (node.type !== 'CallExpression') return false;

    const chainLength = this.getChainLength(node);
    return chainLength >= 2;
  }

  private getChainLength(node: AnyASTNode): number {
    let current = node;
    let length = 0;

    while (current && current.type === 'CallExpression') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const callee = (current as any).callee;

      if (callee?.type === 'MemberExpression') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const property = (callee as any).property;
        const methodName = property?.name;

        if (this.chainableArrayMethods.includes(methodName)) {
          length++;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          current = (callee as any).object;
        } else {
          break;
        }
      } else {
        break;
      }
    }

    return length;
  }

  private getArrayName(node: AnyASTNode): string {
    let current = node;

    // Traverse up the chain to find the original array
    while (current && current.type === 'CallExpression') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const callee = (current as any).callee;

      if (callee?.type === 'MemberExpression') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const object = (callee as any).object;

        if (object?.type === 'Identifier') {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return (object as any).name || 'array';
        } else if (object?.type === 'CallExpression') {
          current = object;
        } else {
          break;
        }
      } else {
        break;
      }
    }

    return 'array';
  }

  private hasMultipleIterationsOnSameArray(_node: AnyASTNode, _context: MatchContext): boolean {
    // This would require more complex analysis of the surrounding scope
    // For now, focus on chained methods which are easier to detect
    return false;
  }

  private calculateComplexity(chainLength: number): number {
    // Each additional method in the chain multiplies the complexity
    return Math.min(chainLength * 2, 10); // Cap at 10 for very long chains
  }

  private getSuggestion(_node: AnyASTNode, chainLength: number): string {
    if (chainLength <= 2) {
      return 'Consider combining operations into a single reduce() call';
    } else if (chainLength <= 3) {
      return 'Use a single reduce() or for-loop to avoid multiple iterations';
    } else {
      return 'Refactor into a single-pass algorithm using reduce() or traditional loop';
    }
  }
}

/**
 * Tooltip template for multiple array iterations
 */
const multipleArrayIterationsTemplate: TooltipTemplate = {
  title: '🔴 PERFORMANCE CRITICAL: Multiple Array Iterations',
  problemDescription: 'Chained array methods create multiple iterations over the same data, causing O(n×methods) complexity instead of O(n).',
  impactDescription: 'Each additional method in the chain multiplies processing time. For large arrays, this can cause significant performance degradation.',
  solutionDescription: 'Combine operations into a single pass using reduce() or a traditional for-loop.',
  codeExamples: [
    {
      title: 'Problematic: Multiple Iterations',
      before: `// O(3n) - Three separate iterations
const result = users
  .map(user => ({ ...user, age: user.age + 1 }))
  .filter(user => user.active)
  .reduce((sum, user) => sum + user.score, 0);`,
      after: `// O(n) - Single iteration
const result = users.reduce((sum, user) => {
  if (user.active) {
    return sum + user.score + 1; // age increment applied inline
  }
  return sum;
}, 0);`,
      improvement: '3x faster for large arrays'
    },
    {
      title: 'Alternative: For-loop optimization',
      before: `// Multiple iterations
const processed = data
  .filter(item => item.valid)
  .map(item => item.value * 2)
  .sort((a, b) => a - b);`,
      after: `// Single pass + sort
const processed = [];
for (const item of data) {
  if (item.valid) {
    processed.push(item.value * 2);
  }
}
processed.sort((a, b) => a - b);`,
      improvement: '2x faster, more readable'
    }
  ],
  actions: [
    {
      label: 'Copy optimized reduce()',
      type: 'copy',
      payload: 'array.reduce((acc, item) => { /* combined logic */ }, initialValue)'
    },
    {
      label: 'Copy for-loop pattern',
      type: 'copy',
      payload: 'const result = []; for (const item of array) { /* combined logic */ }'
    }
  ],
  learnMoreUrl: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce'
};

/**
 * Multiple array iterations pattern rule
 */
export const multipleArrayIterationsRule: PatternRule = {
  id: 'multiple-array-iterations',
  name: 'Multiple Array Iterations',
  description: 'Detects chained array methods that create multiple iterations over the same data',
  category: PatternCategory.Performance,
  severity: 'critical',
  languages: ['javascript', 'typescript', 'typescriptreact', 'javascriptreact'],
  enabled: true,
  matcher: new MultipleArrayIterationsMatcher(),
  template: multipleArrayIterationsTemplate,
  scoreImpact: -15
};

export { multipleArrayIterationsTemplate };
