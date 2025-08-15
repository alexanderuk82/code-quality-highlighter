import {
  PatternRule,
  PatternMatcher,
  AnyASTNode,
  MatchContext,
  PatternCategory,
  TooltipTemplate
} from '../types';

/**
 * Matcher for detecting DOM query operations inside loops
 */
export class DOMQueriesInLoopsMatcher implements PatternMatcher {
  private readonly domQueryMethods = [
    'querySelector', 'querySelectorAll', 'getElementById', 'getElementsByClassName',
    'getElementsByTagName', 'getElementsByName', 'closest', 'matches'
  ];

  private readonly domManipulationMethods = [
    'appendChild', 'removeChild', 'insertBefore', 'replaceChild',
    'createElement', 'createTextNode', 'createDocumentFragment',
    'insertAdjacentHTML', 'insertAdjacentElement', 'insertAdjacentText'
  ];

  private readonly expensiveStyleMethods = [
    'getComputedStyle', 'getBoundingClientRect', 'getClientRects',
    'offsetWidth', 'offsetHeight', 'clientWidth', 'clientHeight',
    'scrollWidth', 'scrollHeight', 'offsetTop', 'offsetLeft'
  ];

  public match(node: AnyASTNode, context: MatchContext): boolean {
    if (!this.isRelevantNode(node)) return false;
    if (!this.isInsideLoop(node, context)) return false;

    return this.isDOMQueryMethod(node) ||
           this.isDOMManipulationMethod(node) ||
           this.isExpensiveStyleMethod(node);
  }

  public getMatchDetails(node: AnyASTNode, _context: MatchContext) {
    const operationType = this.getDOMOperationType(node);

    const fixSnippets: Record<string, string> = {
      'DOM Query': '// Cache DOM query outside the loop\nconst container = document.querySelector(\'.container\');\nfor (/* items */) {\n  // use container here\n}',
      'DOM Manipulation': '// Batch DOM updates with a DocumentFragment\nconst fragment = document.createDocumentFragment();\nfor (/* items */) {\n  const el = document.createElement(\'div\');\n  fragment.appendChild(el);\n}\ncontainer.appendChild(fragment);',
      'Style/Layout': '// Cache expensive style/layout reads\nconst sizes = elements.map(el => el.getBoundingClientRect());\nelements.forEach((el, i) => {\n  el.style.top = sizes[i].top + \'px\';\n});'
    };

    return {
      complexity: this.estimateComplexity(operationType),
      impact: `${operationType} operation in loop forces browser reflow/repaint on each iteration`,
      suggestion: this.getSuggestion(operationType),
      fix: {
        type: 'copy' as const,
        title: operationType + ': recommended structure',
        text: fixSnippets[operationType] || '// Move DOM operations outside the loop when possible\n// or batch them using a DocumentFragment'
      }
    } as const;
  }

  private isRelevantNode(node: AnyASTNode): boolean {
    return node.type === 'CallExpression' ||
           node.type === 'MemberExpression';
  }

  private isInsideLoop(node: AnyASTNode, context: MatchContext): boolean {
    const sourceCode = context.sourceCode;
    const nodeStart = node.start || 0;

    if (nodeStart <= 0) return false;

    return this.isDirectlyInLoop(sourceCode, nodeStart) && !this.isInFunctionOutsideLoop(sourceCode, nodeStart);
  }

  private isDirectlyInLoop(sourceCode: string, nodeStart: number): boolean {
    const codeBeforeNode = sourceCode.substring(0, nodeStart);
    const loopKeywords = ['for (', 'for(', 'while (', 'while(', 'do {', '.forEach(', '.map(', '.filter(', '.reduce('];

    return loopKeywords.some(keyword => {
      const lastIndex = codeBeforeNode.lastIndexOf(keyword);
      if (lastIndex === -1) return false;

      const codeBetween = sourceCode.substring(lastIndex, nodeStart);
      const openBraces = (codeBetween.match(/{/g) || []).length;
      const closeBraces = (codeBetween.match(/}/g) || []).length;

      return openBraces > closeBraces;
    });
  }

  private isInFunctionOutsideLoop(sourceCode: string, nodeStart: number): boolean {
    const codeBeforeNode = sourceCode.substring(0, nodeStart);
    const functionMatches = Array.from(codeBeforeNode.matchAll(/\bfunction\s+(\w+)\s*\(/g));

    if (functionMatches.length === 0) return false;

    const lastFunction = functionMatches[functionMatches.length - 1];
    if (!lastFunction) return false;

    const functionStartIndex = lastFunction.index || 0;
    const functionEndIndex = this.findFunctionEndIndex(sourceCode, functionStartIndex);

    if (nodeStart > functionStartIndex && (functionEndIndex === -1 || nodeStart < functionEndIndex)) {
      const codeAfterFunction = sourceCode.substring(functionEndIndex === -1 ? nodeStart : functionEndIndex);
      const loopKeywords = ['for (', 'for(', 'while (', 'while(', 'do {', '.forEach(', '.map(', '.filter(', '.reduce('];
      return loopKeywords.some(keyword => codeAfterFunction.includes(keyword));
    }

    return false;
  }

  private findFunctionEndIndex(sourceCode: string, functionStartIndex: number): number {
    const codeFromFunction = sourceCode.substring(functionStartIndex);
    let braceCount = 0;
    let foundOpenBrace = false;

    for (let i = 0; i < codeFromFunction.length; i++) {
      if (codeFromFunction[i] === '{') {
        foundOpenBrace = true;
        braceCount++;
      } else if (codeFromFunction[i] === '}' && foundOpenBrace) {
        braceCount--;
        if (braceCount === 0) {
          return functionStartIndex + i;
        }
      }
    }

    return -1;
  }

  private isDOMQueryMethod(node: AnyASTNode): boolean {
    const methodName = this.getMethodName(node);
    return methodName ? this.domQueryMethods.includes(methodName) : false;
  }

  private isDOMManipulationMethod(node: AnyASTNode): boolean {
    const methodName = this.getMethodName(node);
    if (!methodName || !this.domManipulationMethods.includes(methodName)) return false;

    // Only detect if it's called on document or has DOM context
    return this.isDOMContextCall(node);
  }

  private isExpensiveStyleMethod(node: AnyASTNode): boolean {
    const methodName = this.getMethodName(node);
    return methodName ? this.expensiveStyleMethods.includes(methodName) : false;
  }

  private getMethodName(node: AnyASTNode): string | null {
    if (node.type === 'CallExpression') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const callNode = node as any;
      // Handle member expressions like obj.method()
      if (callNode.callee?.type === 'MemberExpression') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const memberExpr = callNode.callee as any;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const property = memberExpr.property as any;
        return property?.name || null;
      }
      // Handle direct function calls like getComputedStyle()
      if (callNode.callee?.type === 'Identifier') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const identifier = callNode.callee as any;
        return identifier.name || null;
      }
    }
    return null;
  }

  private getDOMOperationType(node: AnyASTNode): string {
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

  private estimateComplexity(operationType: string): number {
    const complexityMap: Record<string, number> = {
      'DOM Query': 3,
      'DOM Manipulation': 2,
      'Style/Layout': 4
    };
    return complexityMap[operationType] || 2;
  }

  private getSuggestion(operationType: string): string {
    const suggestions: Record<string, string> = {
      'DOM Query': 'Cache DOM elements outside the loop',
      'DOM Manipulation': 'Use document fragments for bulk operations',
      'Style/Layout': 'Cache layout properties outside the loop'
    };
    return suggestions[operationType] || 'Cache DOM operations outside the loop';
  }

  private isDOMContextCall(node: AnyASTNode): boolean {
    if (node.type !== 'CallExpression') return false;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const callNode = node as any;

    // Check if it's called as a member expression (obj.method())
    if (callNode.callee?.type === 'MemberExpression') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const memberExpr = callNode.callee as any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const property = memberExpr.property as any;
      const methodName = property?.name;

      // Always detect DOM methods called on any object (container.appendChild, etc.)
      if (this.domManipulationMethods.includes(methodName) ||
          this.domQueryMethods.includes(methodName) ||
          this.expensiveStyleMethods.includes(methodName)) {
        return true;
      }
    }

    // For direct calls like createElement(), only detect if it's a global DOM method
    if (callNode.callee?.type === 'Identifier') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const identifier = callNode.callee as any;
      const methodName = identifier.name;

      // Only detect global DOM methods, not user-defined functions
      const globalDOMMethods = ['getComputedStyle', 'querySelector', 'querySelectorAll'];
      return globalDOMMethods.includes(methodName);
    }

    return false;
  }
}

/**
 * Tooltip template for DOM queries in loops
 */
const domQueriesInLoopsTemplate: TooltipTemplate = {
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
export const domQueriesInLoopsRule: PatternRule = {
  id: 'dom-queries-in-loops',
  name: 'DOM Queries in Loops',
  description: 'Detects expensive DOM operations inside loops that cause performance issues',
  category: PatternCategory.Performance,
  severity: 'critical',
  languages: ['javascript', 'typescript', 'typescriptreact', 'javascriptreact'],
  enabled: true,
  matcher: new DOMQueriesInLoopsMatcher(),
  template: domQueriesInLoopsTemplate,
  scoreImpact: -15
};
