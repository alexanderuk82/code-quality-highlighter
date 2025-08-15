import { AnyASTNode, PatternMatcher, MatchContext, MatchDetails, TooltipTemplate, PatternRule, PatternCategory } from '../types';

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
export class InefficientObjectAccessMatcher implements PatternMatcher {
  public match(node: AnyASTNode, context: MatchContext): boolean {
    if (!this.isRelevantNode(node)) return false;
    if (!this.isInsideLoop(node, context)) return false;

  return this.isRepeatedPropertyAccess(node, context) ||
       this.isDeepPropertyAccess(node) ||
           this.isRepeatedMethodCall(node, context);
  }

  public getMatchDetails(node: AnyASTNode, _context: MatchContext): MatchDetails {
    const accessType = this.getAccessType(node);
    const propertyPath = this.getPropertyPath(node);

    return {
      complexity: this.calculateComplexity(node),
      impact: `${accessType} '${propertyPath}' resolved on every loop iteration`,
      suggestion: this.getSuggestion(accessType, propertyPath)
    };
  }

  private isRelevantNode(node: AnyASTNode): boolean {
    return node.type === 'MemberExpression' || node.type === 'CallExpression';
  }

  private isInsideLoop(node: AnyASTNode, context: MatchContext): boolean {
    const sourceCode = context.sourceCode;
    const nodeStart = node.start || 0;

    if (nodeStart <= 0) return false;

    return this.isDirectlyInLoop(sourceCode, nodeStart);
  }

  private isDirectlyInLoop(sourceCode: string, nodeStart: number): boolean {
    const codeBeforeNode = sourceCode.substring(0, nodeStart);
    const loopKeywords = ['for (', 'for(', 'while (', 'while(', 'do {', '.forEach(', '.map(', '.filter('];

    return loopKeywords.some(keyword => {
      const lastIndex = codeBeforeNode.lastIndexOf(keyword);
      if (lastIndex === -1) return false;

      const codeBetween = sourceCode.substring(lastIndex, nodeStart);
      const openBraces = (codeBetween.match(/{/g) || []).length;
      const closeBraces = (codeBetween.match(/}/g) || []).length;

      return openBraces > closeBraces;
    });
  }

  private isRepeatedPropertyAccess(node: AnyASTNode, context: MatchContext): boolean {
    if (node.type !== 'MemberExpression') return false;

    const propertyPath = this.getPropertyPath(node);
    if (!propertyPath || propertyPath.split('.').length < 2) return false;

    // Also consider repeated access to the same base path (e.g., user.profile.*)
    const basePath = propertyPath.split('.').slice(0, -1).join('.');

    // Check if this property is accessed multiple times in the same loop
  return this.countPropertyAccessInLoop(propertyPath, context) > 1 ||
       (!!basePath && this.countPropertyAccessInLoop(basePath + '.', context) > 1);
  }

  private isDeepPropertyAccess(node: AnyASTNode): boolean {
    if (node.type !== 'MemberExpression') return false;

    const depth = this.getPropertyDepth(node);
    return depth >= 3; // obj.a.b.c or deeper
  }

  private isRepeatedMethodCall(node: AnyASTNode, context: MatchContext): boolean {
    if (node.type !== 'CallExpression') return false;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const callee = (node as any).callee;
    if (!callee || callee.type !== 'MemberExpression') return false;

    const methodPath = this.getMethodPath(node);
    if (!methodPath) return false;

    // Check if this method is called multiple times in the same loop
    return this.countMethodCallInLoop(methodPath, context) > 1;
  }

  private getPropertyPath(node: AnyASTNode): string {
    if (node.type !== 'MemberExpression') return '';

    const parts: string[] = [];
    let current = node;

    while (current && current.type === 'MemberExpression') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const property = (current as any).property;
      if (property?.name) {
        parts.unshift(property.name);
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      current = (current as any).object;
    }

    if (current?.type === 'Identifier') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const name = (current as any).name;
      if (name) {
        parts.unshift(name);
      }
    }

    return parts.join('.');
  }

  private getMethodPath(node: AnyASTNode): string {
    if (node.type !== 'CallExpression') return '';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const callee = (node as any).callee;
    if (!callee || callee.type !== 'MemberExpression') return '';

    return this.getPropertyPath(callee);
  }

  private getPropertyDepth(node: AnyASTNode): number {
    let depth = 0;
    let current = node;

    while (current && current.type === 'MemberExpression') {
      depth++;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      current = (current as any).object;
    }

    return depth;
  }

  private countPropertyAccessInLoop(propertyPath: string, context: MatchContext): number {
    const sourceCode = context.sourceCode;

    // Simple heuristic: count occurrences of the property path in the source
    // In a real implementation, this would need more sophisticated AST analysis
    const regex = new RegExp(propertyPath.replace(/\./g, '\\.'), 'g');
    const matches = sourceCode.match(regex);

    return matches ? matches.length : 0;
  }

  private countMethodCallInLoop(methodPath: string, context: MatchContext): number {
    const sourceCode = context.sourceCode;

    // Simple heuristic: count occurrences of the method call pattern
    const regex = new RegExp(methodPath.replace(/\./g, '\\.') + '\\s*\\(', 'g');
    const matches = sourceCode.match(regex);

    return matches ? matches.length : 0;
  }

  private getAccessType(node: AnyASTNode): string {
    if (node.type === 'CallExpression') {
      return 'Method call';
    } else if (node.type === 'MemberExpression') {
      const depth = this.getPropertyDepth(node);
      if (depth >= 3) {
        return 'Deep property access';
      } else {
        return 'Property access';
      }
    }
    return 'Object access';
  }

  private calculateComplexity(node: AnyASTNode): number {
    if (node.type === 'MemberExpression') {
      const depth = this.getPropertyDepth(node);
      return Math.max(5, Math.min(depth * 2, 8));
    } else if (node.type === 'CallExpression') {
      return 6; // Method calls are generally more expensive
    }
    return 4;
  }

  private getSuggestion(accessType: string, propertyPath: string): string {
    if (accessType.includes('Deep')) {
      return `Cache '${propertyPath}' in a variable before the loop`;
    } else if (accessType.includes('Method')) {
      return `Cache the result of '${propertyPath}()' outside the loop if it doesn't change`;
    } else {
      return `Store '${propertyPath}' in a local variable before the loop`;
    }
  }
}

/**
 * Tooltip template for inefficient object access
 */
const inefficientObjectAccessTemplate: TooltipTemplate = {
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

/**
 * Inefficient object access pattern rule
 */
export const inefficientObjectAccessRule: PatternRule = {
  id: 'inefficient-object-access',
  name: 'Inefficient Object Access',
  description: 'Detects repeated property access or method calls within loops that should be cached',
  category: PatternCategory.Performance,
  severity: 'critical',
  languages: ['javascript', 'typescript', 'typescriptreact', 'javascriptreact'],
  enabled: true,
  matcher: new InefficientObjectAccessMatcher(),
  template: inefficientObjectAccessTemplate,
  scoreImpact: -15
};

export { inefficientObjectAccessTemplate };
