"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.memoryLeaksRule = exports.MemoryLeaksMatcher = void 0;
const types_1 = require("../types");
/**
 * Matcher for detecting potential memory leaks
 */
class MemoryLeaksMatcher {
    constructor() {
        Object.defineProperty(this, "eventMethods", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: [
                'addEventListener', 'on', 'bind', 'subscribe', 'watch'
            ]
        });
        Object.defineProperty(this, "_cleanupMethods", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: [
                'removeEventListener', 'off', 'unbind', 'unsubscribe', 'unwatch'
            ]
        });
        Object.defineProperty(this, "timerMethods", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: [
                'setTimeout', 'setInterval', 'requestAnimationFrame', 'requestIdleCallback'
            ]
        });
        Object.defineProperty(this, "_cleanupTimerMethods", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: [
                'clearTimeout', 'clearInterval', 'cancelAnimationFrame', 'cancelIdleCallback'
            ]
        });
    }
    match(node, context) {
        // Check for event listeners without cleanup
        if (this.isEventListenerWithoutCleanup(node, context))
            return true;
        // Check for timers without cleanup
        if (this.isTimerWithoutCleanup(node, context))
            return true;
        // Check for DOM references that might leak
        if (this.isDOMReferenceInClosure(node, context))
            return true;
        // Check for circular references
        if (this.isCircularReference(node, context))
            return true;
        return false;
    }
    getMatchDetails(node, context) {
        const leakType = this.getLeakType(node, context);
        return {
            complexity: 1,
            impact: `${leakType} can cause memory leaks if not properly cleaned up`,
            suggestion: this.getSuggestion(leakType)
        };
    }
    isEventListenerWithoutCleanup(node, context) {
        if (node.type !== 'CallExpression')
            return false;
        const methodName = this.getMethodName(node);
        if (!methodName || !this.eventMethods.includes(methodName))
            return false;
        // Check if this is inside a function/component that should have cleanup
        if (this.isInComponentOrFunction(node, context)) {
            return !this.hasCorrespondingCleanup(methodName, context);
        }
        return false;
    }
    isTimerWithoutCleanup(node, context) {
        if (node.type !== 'CallExpression')
            return false;
        const methodName = this.getMethodName(node);
        if (!methodName || !this.timerMethods.includes(methodName))
            return false;
        // Check if timer result is stored for cleanup
        if (!this.isTimerResultStored(node))
            return true;
        // Check if there's corresponding cleanup
        return !this.hasCorrespondingTimerCleanup(methodName, context);
    }
    isDOMReferenceInClosure(node, context) {
        // Check for DOM element references stored in closures
        if (node.type === 'VariableDeclarator') {
            const init = node.init;
            if (this.isDOMQuery(init) && this.isInClosure(node, context)) {
                return true;
            }
        }
        return false;
    }
    isCircularReference(node, _context) {
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
    getMethodName(node) {
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
    isInComponentOrFunction(node, context) {
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
    hasCorrespondingCleanup(eventMethod, context) {
        const cleanupMap = {
            'addEventListener': 'removeEventListener',
            'on': 'off',
            'bind': 'unbind',
            'subscribe': 'unsubscribe',
            'watch': 'unwatch'
        };
        const cleanupMethod = cleanupMap[eventMethod];
        return cleanupMethod ? context.sourceCode.includes(cleanupMethod) : false;
    }
    isTimerResultStored(node) {
        // Check if timer is assigned to a variable (for later cleanup)
        const parent = this.getParentNode(node);
        return parent?.type === 'VariableDeclarator' ||
            parent?.type === 'AssignmentExpression';
    }
    hasCorrespondingTimerCleanup(timerMethod, context) {
        const cleanupMap = {
            'setTimeout': 'clearTimeout',
            'setInterval': 'clearInterval',
            'requestAnimationFrame': 'cancelAnimationFrame',
            'requestIdleCallback': 'cancelIdleCallback'
        };
        const cleanupMethod = cleanupMap[timerMethod];
        return cleanupMethod ? context.sourceCode.includes(cleanupMethod) : false;
    }
    isDOMQuery(node) {
        if (!node || node.type !== 'CallExpression')
            return false;
        const methodName = this.getMethodName(node);
        const domMethods = [
            'querySelector', 'querySelectorAll', 'getElementById',
            'getElementsByClassName', 'getElementsByTagName'
        ];
        return methodName ? domMethods.includes(methodName) : false;
    }
    isInClosure(node, context) {
        // Simple check for closure patterns
        const sourceCode = context.sourceCode;
        const nodeStart = node.start || 0;
        const codeBeforeNode = sourceCode.substring(0, nodeStart);
        // Look for closure indicators
        return codeBeforeNode.includes('function(') ||
            codeBeforeNode.includes('() =>') ||
            codeBeforeNode.includes('function ');
    }
    isPropertyAssignment(node) {
        return node.type === 'MemberExpression';
    }
    mightCreateCircularReference(left, right) {
        // Very basic heuristic - would need more sophisticated analysis
        return left.type === 'MemberExpression' && right.type === 'MemberExpression';
    }
    getParentNode(_node) {
        // In a real implementation, this would traverse the AST parent chain
        // For now, return null as we don't have parent references
        return null;
    }
    getLeakType(node, context) {
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
    getSuggestion(leakType) {
        const suggestions = {
            'Event Listener': 'Add removeEventListener in cleanup (useEffect return, componentWillUnmount)',
            'Timer': 'Store timer ID and call clearTimeout/clearInterval in cleanup',
            'DOM Reference': 'Avoid storing DOM references in closures or clear them explicitly',
            'Circular Reference': 'Break circular references by setting properties to null'
        };
        return suggestions[leakType] || 'Implement proper cleanup to prevent memory leaks';
    }
}
exports.MemoryLeaksMatcher = MemoryLeaksMatcher;
/**
 * Tooltip template for memory leaks
 */
const memoryLeaksTemplate = {
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
exports.memoryLeaksRule = {
    id: 'memory-leaks',
    name: 'Memory Leaks',
    description: 'Detects patterns that can cause memory leaks',
    category: types_1.PatternCategory.Performance,
    severity: 'critical',
    languages: ['javascript', 'typescript', 'typescriptreact', 'javascriptreact'],
    enabled: true,
    matcher: new MemoryLeaksMatcher(),
    template: memoryLeaksTemplate,
    scoreImpact: -15
};
//# sourceMappingURL=memory-leaks.js.map