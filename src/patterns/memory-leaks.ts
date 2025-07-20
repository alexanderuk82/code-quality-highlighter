import { 
  PatternRule, 
  PatternMatcher, 
  ASTNode, 
  MatchContext, 
  PatternCategory,
  TooltipTemplate
} from '../types';

/**
 * Matcher for detecting potential memory leaks
 */
export class MemoryLeaksMatcher implements PatternMatcher {
  private readonly eventMethods = [
    'addEventListener', 'on', 'bind', 'subscribe', 'watch'
  ];

  private readonly _cleanupMethods = [
    'removeEventListener', 'off', 'unbind', 'unsubscribe', 'unwatch'
  ];

  private readonly timerMethods = [
    'setTimeout', 'setInterval', 'requestAnimationFrame', 'requestIdleCallback'
  ];

  private readonly _cleanupTimerMethods = [
    'clearTimeout', 'clearInterval', 'cancelAnimationFrame', 'cancelIdleCallback'
  ];

  public match(node: ASTNode, context: MatchContext): boolean {
    // Check for event listeners without cleanup
    if (this.isEventListenerWithoutCleanup(node, context)) return true;

    // Check for timers without cleanup
    if (this.isTimerWithoutCleanup(node, context)) return true;

    // Check for DOM references that might leak
    if (this.isDOMReferenceInClosure(node, context)) return true;

    // Check for circular references
    if (this.isCircularReference(node, context)) return true;

    return false;
  }

  public getMatchDetails(node: ASTNode, context: MatchContext) {
    const leakType = this.getLeakType(node, context);
    
    return {
      complexity: 1,
      impact: `${leakType} can cause memory leaks if not properly cleaned up`,
      suggestion: this.getSuggestion(leakType)
    };
  }

  private isEventListenerWithoutCleanup(node: ASTNode, context: MatchContext): boolean {
    if (node.type !== 'CallExpression') return false;

    const methodName = this.getMethodName(node);
    if (!methodName || !this.eventMethods.includes(methodName)) return false;

    // Check if this is inside a function/component that should have cleanup
    if (this.isInComponentOrFunction(node, context)) {
      return !this.hasCorrespondingCleanup(methodName, context);
    }

    return false;
  }

  private isTimerWithoutCleanup(node: ASTNode, context: MatchContext): boolean {
    if (node.type !== 'CallExpression') return false;

    const methodName = this.getMethodName(node);
    if (!methodName || !this.timerMethods.includes(methodName)) return false;

    // Check if timer result is stored for cleanup
    if (!this.isTimerResultStored(node)) return true;

    // Check if there's corresponding cleanup
    return !this.hasCorrespondingTimerCleanup(methodName, context);
  }

  private isDOMReferenceInClosure(node: ASTNode, context: MatchContext): boolean {
    // Check for DOM element references stored in closures
    if (node.type === 'VariableDeclarator') {
      const init = node.init;
      if (this.isDOMQuery(init) && this.isInClosure(node, context)) {
        return true;
      }
    }

    return false;
  }

  private isCircularReference(node: ASTNode, _context: MatchContext): boolean {
    // Simple heuristic for circular references
    if (node.type === 'AssignmentExpression') {
      const left = node.left;
      const right = node.right;

      // Check for patterns like obj.parent = parentObj; parentObj.child = obj;
      if (this.isPropertyAssignment(left) && this.isPropertyAssignment(right)) {
        return this.mightCreateCircularReference(left, right);
      }
    }

    return false;
  }

  private getMethodName(node: ASTNode): string | null {
    if (node.type === 'CallExpression') {
      const callee = node.callee;
      
      if (callee?.type === 'Identifier') {
        return callee.name;
      }
      
      if (callee?.type === 'MemberExpression') {
        return callee.property?.name || null;
      }
    }
    
    return null;
  }

  private isInComponentOrFunction(node: ASTNode, context: MatchContext): boolean {
    // Check if we're inside a React component, function, or class method
    const sourceCode = context.sourceCode;
    const nodeStart = node.start || 0;
    
    const codeBeforeNode = sourceCode.substring(0, nodeStart);
    
    // Look for function/component patterns
    const patterns = [
      'function', 'const ', 'let ', 'var ',
      'useEffect', 'componentDidMount', 'componentWillUnmount'
    ];
    
    return patterns.some(pattern => codeBeforeNode.includes(pattern));
  }

  private hasCorrespondingCleanup(eventMethod: string, context: MatchContext): boolean {
    const cleanupMap: Record<string, string> = {
      'addEventListener': 'removeEventListener',
      'on': 'off',
      'bind': 'unbind',
      'subscribe': 'unsubscribe',
      'watch': 'unwatch'
    };

    const cleanupMethod = cleanupMap[eventMethod];
    return cleanupMethod ? context.sourceCode.includes(cleanupMethod) : false;
  }

  private isTimerResultStored(node: ASTNode): boolean {
    // Check if timer is assigned to a variable (for later cleanup)
    const parent = this.getParentNode(node);
    return parent?.type === 'VariableDeclarator' || 
           parent?.type === 'AssignmentExpression';
  }

  private hasCorrespondingTimerCleanup(timerMethod: string, context: MatchContext): boolean {
    const cleanupMap: Record<string, string> = {
      'setTimeout': 'clearTimeout',
      'setInterval': 'clearInterval',
      'requestAnimationFrame': 'cancelAnimationFrame',
      'requestIdleCallback': 'cancelIdleCallback'
    };

    const cleanupMethod = cleanupMap[timerMethod];
    return cleanupMethod ? context.sourceCode.includes(cleanupMethod) : false;
  }

  private isDOMQuery(node: ASTNode | null): boolean {
    if (!node || node.type !== 'CallExpression') return false;

    const methodName = this.getMethodName(node);
    const domMethods = [
      'querySelector', 'querySelectorAll', 'getElementById',
      'getElementsByClassName', 'getElementsByTagName'
    ];

    return methodName ? domMethods.includes(methodName) : false;
  }

  private isInClosure(node: ASTNode, context: MatchContext): boolean {
    // Simple check for closure patterns
    const sourceCode = context.sourceCode;
    const nodeStart = node.start || 0;
    
    const codeBeforeNode = sourceCode.substring(0, nodeStart);
    
    // Look for closure indicators
    return codeBeforeNode.includes('function(') || 
           codeBeforeNode.includes('() =>') ||
           codeBeforeNode.includes('function ');
  }

  private isPropertyAssignment(node: ASTNode): boolean {
    return node.type === 'MemberExpression';
  }

  private mightCreateCircularReference(left: ASTNode, right: ASTNode): boolean {
    // Very basic heuristic - would need more sophisticated analysis
    return left.type === 'MemberExpression' && right.type === 'MemberExpression';
  }

  private getParentNode(_node: ASTNode): ASTNode | null {
    // In a real implementation, this would traverse the AST parent chain
    // For now, return null as we don't have parent references
    return null;
  }

  private getLeakType(node: ASTNode, context: MatchContext): string {
    const methodName = this.getMethodName(node);
    
    if (methodName && this.eventMethods.includes(methodName)) {
      return 'Event Listener';
    }
    
    if (methodName && this.timerMethods.includes(methodName)) {
      return 'Timer';
    }
    
    if (this.isDOMReferenceInClosure(node, context)) {
      return 'DOM Reference';
    }
    
    if (this.isCircularReference(node, context)) {
      return 'Circular Reference';
    }
    
    return 'Memory Leak';
  }

  private getSuggestion(leakType: string): string {
    const suggestions: Record<string, string> = {
      'Event Listener': 'Add removeEventListener in cleanup (useEffect return, componentWillUnmount)',
      'Timer': 'Store timer ID and call clearTimeout/clearInterval in cleanup',
      'DOM Reference': 'Avoid storing DOM references in closures or clear them explicitly',
      'Circular Reference': 'Break circular references by setting properties to null'
    };
    
    return suggestions[leakType] || 'Implement proper cleanup to prevent memory leaks';
  }
}

/**
 * Tooltip template for memory leaks
 */
const memoryLeaksTemplate: TooltipTemplate = {
  title: '🔴 MEMORY CRITICAL: Potential Memory Leak',
  problemDescription: 'Code that creates event listeners, timers, or references without proper cleanup can cause memory leaks, leading to poor performance and eventual browser crashes.',
  impactDescription: 'Memory leaks accumulate over time, especially in SPAs. Uncleaned event listeners and timers prevent garbage collection of associated objects.',
  solutionDescription: 'Always implement cleanup patterns: remove event listeners, clear timers, break circular references, and nullify DOM references when no longer needed.',
  codeExamples: [
    {
      title: 'Event Listener Cleanup',
      before: `// ❌ Event listener without cleanup
function setupComponent() {
  const button = document.querySelector('#myButton');
  button.addEventListener('click', handleClick);
  
  // Component unmounts but listener remains!
}

// ❌ React useEffect without cleanup
useEffect(() => {
  window.addEventListener('resize', handleResize);
}, []);`,
      after: `// ✅ Proper event listener cleanup
function setupComponent() {
  const button = document.querySelector('#myButton');
  const cleanup = () => {
    button.removeEventListener('click', handleClick);
  };
  
  button.addEventListener('click', handleClick);
  return cleanup;
}

// ✅ React useEffect with cleanup
useEffect(() => {
  const handleResize = () => { /* ... */ };
  window.addEventListener('resize', handleResize);
  
  return () => {
    window.removeEventListener('resize', handleResize);
  };
}, []);`,
      improvement: 'Prevents memory leaks and improves performance'
    },
    {
      title: 'Timer Cleanup',
      before: `// ❌ Timer without cleanup
function startPolling() {
  setInterval(() => {
    fetchData();
  }, 1000);
}

// ❌ Animation without cleanup
function animate() {
  requestAnimationFrame(animate);
  updateAnimation();
}`,
      after: `// ✅ Timer with cleanup
function startPolling() {
  const intervalId = setInterval(() => {
    fetchData();
  }, 1000);
  
  return () => clearInterval(intervalId);
}

// ✅ Animation with cleanup control
let animationId;
function animate() {
  if (shouldContinue) {
    animationId = requestAnimationFrame(animate);
    updateAnimation();
  }
}

function stopAnimation() {
  if (animationId) {
    cancelAnimationFrame(animationId);
  }
}`,
      improvement: 'Prevents runaway timers and excessive CPU usage'
    },
    {
      title: 'DOM Reference Management',
      before: `// ❌ DOM references in closure
function createHandler() {
  const element = document.querySelector('.large-element');
  
  return function() {
    // Closure keeps reference to element
    console.log('Handler called');
  };
}

// ❌ Circular reference
function linkObjects(parent, child) {
  parent.child = child;
  child.parent = parent; // Circular reference!
}`,
      after: `// ✅ Avoid DOM references in closures
function createHandler() {
  const elementId = document.querySelector('.large-element').id;
  
  return function() {
    const element = document.getElementById(elementId);
    console.log('Handler called');
  };
}

// ✅ Break circular references
function linkObjects(parent, child) {
  parent.child = child;
  child.parent = parent;
  
  // Cleanup function
  return () => {
    parent.child = null;
    child.parent = null;
  };
}`,
      improvement: 'Allows proper garbage collection'
    }
  ],
  actions: [
    {
      label: 'Copy Cleanup Pattern',
      type: 'copy',
      payload: 'cleanup-pattern'
    },
    {
      label: 'Apply Quick Fix',
      type: 'apply',
      payload: 'add-cleanup'
    },
    {
      label: 'Learn About Memory Management',
      type: 'explain',
      payload: 'memory-management'
    }
  ],
  learnMoreUrl: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Memory_Management'
};

/**
 * Memory leaks pattern rule
 */
export const memoryLeaksRule: PatternRule = {
  id: 'memory-leaks',
  name: 'Memory Leaks',
  description: 'Detects patterns that can cause memory leaks',
  category: PatternCategory.Performance,
  severity: 'critical',
  languages: ['javascript', 'typescript', 'typescriptreact', 'javascriptreact'],
  enabled: true,
  matcher: new MemoryLeaksMatcher(),
  template: memoryLeaksTemplate,
  scoreImpact: -15
};
