"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inefficientObjectAccessTemplate = exports.inefficientObjectAccessRule = exports.InefficientObjectAccessMatcher = void 0;
const types_1 = require("../types");
/**
 * Detects inefficient repeated object property access within loops
 *
 * Problematic patterns:
 * - Repeated obj.prop access in loops
 * - Deep property access like obj.a.b.c in loops
 * - Method calls on same object repeatedly
 *
 * Performance impact: Eliminates redundant property resolution
 */
class InefficientObjectAccessMatcher {
    match(node, context) {
        if (!this.isRelevantNode(node))
            return false;
        if (!this.isInsideLoop(node, context))
            return false;
        return this.isRepeatedPropertyAccess(node, context) ||
            this.isDeepPropertyAccess(node) ||
            this.isRepeatedMethodCall(node, context);
    }
    getMatchDetails(node, _context) {
        const accessType = this.getAccessType(node);
        const propertyPath = this.getPropertyPath(node);
        return {
            complexity: this.calculateComplexity(node),
            impact: `${accessType} '${propertyPath}' resolved on every loop iteration`,
            suggestion: this.getSuggestion(accessType, propertyPath)
        };
    }
    isRelevantNode(node) {
        return node.type === 'MemberExpression' || node.type === 'CallExpression';
    }
    isInsideLoop(node, context) {
        const sourceCode = context.sourceCode;
        const nodeStart = node.start || 0;
        if (nodeStart <= 0)
            return false;
        return this.isDirectlyInLoop(sourceCode, nodeStart);
    }
    isDirectlyInLoop(sourceCode, nodeStart) {
        const codeBeforeNode = sourceCode.substring(0, nodeStart);
        const loopKeywords = ['for (', 'for(', 'while (', 'while(', 'do {', '.forEach(', '.map(', '.filter('];
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
    isRepeatedPropertyAccess(node, context) {
        if (node.type !== 'MemberExpression')
            return false;
        const propertyPath = this.getPropertyPath(node);
        if (!propertyPath || propertyPath.split('.').length < 2)
            return false;
        // Also consider repeated access to the same base path (e.g., user.profile.*)
        const basePath = propertyPath.split('.').slice(0, -1).join('.');
        // Check if this property is accessed multiple times in the same loop
        return this.countPropertyAccessInLoop(propertyPath, context) > 1 ||
            (!!basePath && this.countPropertyAccessInLoop(basePath + '.', context) > 1);
    }
    isDeepPropertyAccess(node) {
        if (node.type !== 'MemberExpression')
            return false;
        const depth = this.getPropertyDepth(node);
        return depth >= 3; // obj.a.b.c or deeper
    }
    isRepeatedMethodCall(node, context) {
        if (node.type !== 'CallExpression')
            return false;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const callee = node.callee;
        if (!callee || callee.type !== 'MemberExpression')
            return false;
        const methodPath = this.getMethodPath(node);
        if (!methodPath)
            return false;
        // Check if this method is called multiple times in the same loop
        return this.countMethodCallInLoop(methodPath, context) > 1;
    }
    getPropertyPath(node) {
        if (node.type !== 'MemberExpression')
            return '';
        const parts = [];
        let current = node;
        while (current && current.type === 'MemberExpression') {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const property = current.property;
            if (property?.name) {
                parts.unshift(property.name);
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            current = current.object;
        }
        if (current?.type === 'Identifier') {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const name = current.name;
            if (name) {
                parts.unshift(name);
            }
        }
        return parts.join('.');
    }
    getMethodPath(node) {
        if (node.type !== 'CallExpression')
            return '';
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const callee = node.callee;
        if (!callee || callee.type !== 'MemberExpression')
            return '';
        return this.getPropertyPath(callee);
    }
    getPropertyDepth(node) {
        let depth = 0;
        let current = node;
        while (current && current.type === 'MemberExpression') {
            depth++;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            current = current.object;
        }
        return depth;
    }
    countPropertyAccessInLoop(propertyPath, context) {
        const sourceCode = context.sourceCode;
        // Simple heuristic: count occurrences of the property path in the source
        // In a real implementation, this would need more sophisticated AST analysis
        const regex = new RegExp(propertyPath.replace(/\./g, '\\.'), 'g');
        const matches = sourceCode.match(regex);
        return matches ? matches.length : 0;
    }
    countMethodCallInLoop(methodPath, context) {
        const sourceCode = context.sourceCode;
        // Simple heuristic: count occurrences of the method call pattern
        const regex = new RegExp(methodPath.replace(/\./g, '\\.') + '\\s*\\(', 'g');
        const matches = sourceCode.match(regex);
        return matches ? matches.length : 0;
    }
    getAccessType(node) {
        if (node.type === 'CallExpression') {
            return 'Method call';
        }
        else if (node.type === 'MemberExpression') {
            const depth = this.getPropertyDepth(node);
            if (depth >= 3) {
                return 'Deep property access';
            }
            else {
                return 'Property access';
            }
        }
        return 'Object access';
    }
    calculateComplexity(node) {
        if (node.type === 'MemberExpression') {
            const depth = this.getPropertyDepth(node);
            return Math.max(5, Math.min(depth * 2, 8));
        }
        else if (node.type === 'CallExpression') {
            return 6; // Method calls are generally more expensive
        }
        return 4;
    }
    getSuggestion(accessType, propertyPath) {
        if (accessType.includes('Deep')) {
            return `Cache '${propertyPath}' in a variable before the loop`;
        }
        else if (accessType.includes('Method')) {
            return `Cache the result of '${propertyPath}()' outside the loop if it doesn't change`;
        }
        else {
            return `Store '${propertyPath}' in a local variable before the loop`;
        }
    }
}
exports.InefficientObjectAccessMatcher = InefficientObjectAccessMatcher;
/**
 * Tooltip template for inefficient object access
 */
const inefficientObjectAccessTemplate = {
    title: '🔴 PERFORMANCE CRITICAL: Inefficient Object Access in Loop',
    problemDescription: 'Repeated property access or method calls within loops cause unnecessary property resolution on every iteration.',
    impactDescription: 'Each property access involves prototype chain traversal and property lookup. In tight loops, this creates significant overhead.',
    solutionDescription: 'Cache frequently accessed properties and method results in variables before the loop.',
    codeExamples: [
        {
            title: 'Problematic: Repeated Property Access',
            before: `// Property resolved on every iteration
for (let i = 0; i < items.length; i++) {
  if (items[i].user.profile.settings.theme === 'dark') {
    // Process dark theme items
  }
}`,
            after: `// Cache property before loop
const isDarkTheme = (item) => item.user.profile.settings.theme === 'dark';
for (let i = 0; i < items.length; i++) {
  if (isDarkTheme(items[i])) {
    // Process dark theme items
  }
}`,
            improvement: '3-5x faster for deep property access'
        },
        {
            title: 'Better: Cache Multiple Properties',
            before: `// Multiple property lookups per iteration
for (const user of users) {
  console.log(\`\${user.profile.name} - \${user.profile.email}\`);
  if (user.profile.settings.notifications) {
    sendNotification(user.profile.email);
  }
}`,
            after: `// Cache properties once
for (const user of users) {
  const profile = user.profile;
  const { name, email, settings } = profile;
  
  console.log(\`\${name} - \${email}\`);
  if (settings.notifications) {
    sendNotification(email);
  }
}`,
            improvement: '2-3x faster, more readable'
        }
    ],
    actions: [
        {
            label: 'Cache property pattern',
            type: 'copy',
            payload: 'const cachedValue = obj.prop; // Use cachedValue in loop'
        },
        {
            label: 'Destructure pattern',
            type: 'copy',
            payload: 'const { prop1, prop2 } = obj; // Use prop1, prop2 in loop'
        }
    ],
    learnMoreUrl: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Property_Accessors'
};
exports.inefficientObjectAccessTemplate = inefficientObjectAccessTemplate;
/**
 * Inefficient object access pattern rule
 */
exports.inefficientObjectAccessRule = {
    id: 'inefficient-object-access',
    name: 'Inefficient Object Access',
    description: 'Detects repeated property access or method calls within loops that should be cached',
    category: types_1.PatternCategory.Performance,
    severity: 'critical',
    languages: ['javascript', 'typescript', 'typescriptreact', 'javascriptreact'],
    enabled: true,
    matcher: new InefficientObjectAccessMatcher(),
    template: inefficientObjectAccessTemplate,
    scoreImpact: -15
};
//# sourceMappingURL=inefficient-object-access.js.map