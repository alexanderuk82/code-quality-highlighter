import { 
  PatternRule, 
  PatternMatcher, 
  ASTNode, 
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

  public match(node: ASTNode, context: MatchContext): boolean {
    if (!this.isRelevantNode(node)) return false;
    if (!this.isInsideLoop(node, context)) return false;

    return this.isDOMQueryMethod(node) || 
           this.isDOMManipulationMethod(node) || 
           this.isExpensiveStyleMethod(node);
  }

  public getMatchDetails(node: ASTNode, _context: MatchContext) {
    const operationType = this.getDOMOperationType(node);
    
    return {
      complexity: this.estimateComplexity(operationType),
      impact: `${operationType} operation in loop forces browser reflow/repaint on each iteration`,
      suggestion: this.getSuggestion(operationType)
    };
  }

  private isRelevantNode(node: ASTNode): boolean {
    return node.type === 'CallExpression' || 
           node.type === 'MemberExpression';
  }

  private isInsideLoop(node: ASTNode, context: MatchContext): boolean {
    const sourceCode = context.sourceCode;
    const nodeStart = node.start || 0;
    
    const codeBeforeNode = sourceCode.substring(0, nodeStart);
    const loopKeywords = [
      'for (', 'for(', 'while (', 'while(', 'do {',
      '.forEach(', '.map(', '.filter(', '.reduce('
    ];
    
    return loopKeywords.some(keyword => {
      const lastIndex = codeBeforeNode.lastIndexOf(keyword);
      if (lastIndex === -1) return false;
      
      const codeBetween = sourceCode.substring(lastIndex, nodeStart);
      const openBraces = (codeBetween.match(/{/g) || []).length;
      const closeBraces = (codeBetween.match(/}/g) || []).length;
      
      return openBraces > closeBraces;
    });
  }

  private isDOMQueryMethod(node: ASTNode): boolean {
    const methodName = this.getMethodName(node);
    return methodName ? this.domQueryMethods.includes(methodName) : false;
  }

  private isDOMManipulationMethod(node: ASTNode): boolean {
    const methodName = this.getMethodName(node);
    return methodName ? this.domManipulationMethods.includes(methodName) : false;
  }

  private isExpensiveStyleMethod(node: ASTNode): boolean {
    const methodName = this.getMethodName(node);
    return methodName ? this.expensiveStyleMethods.includes(methodName) : false;
  }

  private getMethodName(node: ASTNode): string | null {
    if (node.type === 'CallExpression' && node.callee?.type === 'MemberExpression') {
      return node.callee.property?.name || null;
    }
    return null;
  }

  private getDOMOperationType(node: ASTNode): string {
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
