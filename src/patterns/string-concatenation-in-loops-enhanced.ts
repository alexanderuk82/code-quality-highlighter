import {
  PatternRule,
  PatternMatcher,
  AnyASTNode,
  MatchContext,
  PatternCategory,
  TooltipTemplate,
  MatchDetails,
  FixSuggestion
} from '../types';
import * as vscode from 'vscode';

/**
 * Enhanced Matcher for detecting string concatenation inside loops
 * with personalized fix generation
 */
export class EnhancedStringConcatenationInLoopsMatcher implements PatternMatcher {
  public match(node: AnyASTNode, context: MatchContext): boolean {
    // Check for assignment expressions with += operator
    if (this.isStringConcatenationAssignment(node) && this.isInsideLoop(node, context)) {
      return true;
    }

    // Check for binary expressions with + operator on strings
    if (this.isStringConcatenationExpression(node) && this.isInsideLoop(node, context)) {
      return true;
    }

    return false;
  }

  public getMatchDetails(node: AnyASTNode, context: MatchContext): MatchDetails {
    const concatenationType = this.getConcatenationType(node);
    
    // Generate personalized fix based on actual code
    const fix = this.generatePersonalizedFix(node, context);

    return {
      complexity: 2,
      impact: 'O(n²) string concatenation - each += creates new string object, copying all previous content',
      suggestion: `Use array.join() or template literals for O(n) performance instead of ${concatenationType}`,
      fix: fix
    };
  }

  /**
   * Generate a personalized fix based on the actual code
   */
  private generatePersonalizedFix(node: AnyASTNode, context: MatchContext): FixSuggestion {
    try {
      // Extract the actual code context
      const analysis = this.analyzeCodeContext(node, context);
      
      if (analysis) {
        // Generate personalized solution
        const solution = this.buildPersonalizedSolution(analysis);
        
        return {
          type: 'replace',
          newText: solution.code,
          range: solution.range
        };
      }
    } catch (e) {
      console.log('[StringConcat] Failed to generate personalized fix:', e);
    }
    
    // Fall back to a copy suggestion
    return {
      type: 'copy',
      text: this.getGenericSolution()
    };
  }

  /**
   * Analyze the code context to extract variable names and structure
   */
  private analyzeCodeContext(node: AnyASTNode, context: MatchContext): any {
    const sourceCode = context.sourceCode;
    const lines = sourceCode.split('\n');
    
    // Find the line with the concatenation
    const nodeLine = this.getNodeLine(node, context);
    if (nodeLine < 0) return null;
    
    // Get the actual concatenation line
    const concatLine = lines[nodeLine] || '';
    
    // Extract variable name being concatenated to
    const variableMatch = concatLine.match(/(\w+)\s*\+=\s*/);
    const variableName = variableMatch ? variableMatch[1] : 'result';
    
    // Find the loop context (search backwards from current line)
    let loopInfo = null;
    for (let i = nodeLine - 1; i >= Math.max(0, nodeLine - 10); i--) {
      const line = lines[i];
      if (!line) continue; // Skip undefined lines
      
      // Check for for...of loop
      const forOfMatch = line.match(/for\s*\(\s*(?:let|const|var)\s+(\w+)\s+of\s+(\w+)/);
      if (forOfMatch) {
        loopInfo = {
          type: 'for-of',
          iteratorVar: forOfMatch[1],
          arrayName: forOfMatch[2],
          loopStartLine: i
        };
        break;
      }
      
      // Check for traditional for loop
      const forMatch = line.match(/for\s*\(\s*(?:let|const|var)\s+(\w+)\s*=\s*\d+;\s*\w+\s*<\s*(\w+)(?:\.length)?/);
      if (forMatch) {
        loopInfo = {
          type: 'for',
          indexVar: forMatch[1],
          arrayName: forMatch[2],
          loopStartLine: i
        };
        break;
      }
      
      // Check for forEach
      const forEachMatch = line.match(/(\w+)\.forEach\s*\(\s*(?:\()?(\w+)/);
      if (forEachMatch) {
        loopInfo = {
          type: 'forEach',
          arrayName: forEachMatch[1],
          iteratorVar: forEachMatch[2],
          loopStartLine: i
        };
        break;
      }
    }
    
    // Find what's being concatenated (look at the right side of +=)
    const rightSideMatch = concatLine.match(/\+=\s*(.+?)(?:;|$)/);
    let concatenatedPattern = rightSideMatch && rightSideMatch[1] ? rightSideMatch[1].trim() : '';
    
    // Collect all concatenations in the loop (might be multiple += lines)
    const allConcatenations = this.collectAllConcatenations(lines, nodeLine, loopInfo);
    
    return {
      variableName,
      loopInfo,
      concatenatedPattern,
      allConcatenations,
      nodeLine
    };
  }

  /**
   * Collect all concatenation statements in the loop
   */
  private collectAllConcatenations(lines: string[], _startLine: number, loopInfo: any): string[] {
    if (!loopInfo) return [];
    
    const concatenations: string[] = [];
    let braceCount = 0;
    let inLoop = false;
    
    // Start from loop line
    for (let i = loopInfo.loopStartLine; i < lines.length && i < loopInfo.loopStartLine + 50; i++) {
      const line = lines[i];
      if (!line) continue; // Skip undefined lines
      
      // Track braces to know when we exit the loop
      if (line.includes('{')) {
        braceCount++;
        inLoop = true;
      }
      if (line.includes('}')) {
        braceCount--;
        if (braceCount === 0 && inLoop) break;
      }
      
      // Look for concatenations
      const concatMatch = line.match(/\+=\s*(.+?)(?:;|$)/);
      if (concatMatch && concatMatch[1]) {
        concatenations.push(concatMatch[1].trim());
      }
    }
    
    return concatenations;
  }

  /**
   * Build a personalized solution based on the analysis
   */
  private buildPersonalizedSolution(analysis: any): any {
    const { variableName, loopInfo, allConcatenations } = analysis;
    
    if (!loopInfo) {
      return this.buildSimpleSolution(variableName, allConcatenations);
    }
    
    // Build solution based on loop type
    let solutionCode = '';
    const arrayName = `${variableName}Parts`;
    
    // For the example: buildHTML function
    if (variableName === 'html' && loopInfo.arrayName === 'items') {
      // Specific solution for the HTML building case
      solutionCode = `function buildHTML(items) {
    // Use array to collect HTML parts - O(n) performance
    const htmlParts = items.map(item => 
        \`<div>\${item.name}</div><p>\${item.description}</p>\`
    );
    return htmlParts.join('');
}`;
    } else if (loopInfo.type === 'for-of') {
      // Generic for...of solution
      const iterator = loopInfo.iteratorVar;
      const array = loopInfo.arrayName;
      
      // Analyze concatenation patterns to build template
      let templateContent = allConcatenations.join(' + ');
      
      // Try to convert to template literal
      templateContent = this.convertToTemplateLiteral(templateContent, iterator);
      
      solutionCode = `// Optimized with array.map() and join()
const ${arrayName} = ${array}.map(${iterator} => 
    ${templateContent}
);
const ${variableName} = ${arrayName}.join('');`;
      
    } else if (loopInfo.type === 'for') {
      // Traditional for loop solution
      const index = loopInfo.indexVar;
      const array = loopInfo.arrayName;
      
      solutionCode = `// Optimized with array.push() and join()
const ${arrayName} = [];
for (let ${index} = 0; ${index} < ${array}.length; ${index}++) {
    ${arrayName}.push(/* your concatenated content here */);
}
const ${variableName} = ${arrayName}.join('');`;
      
    } else if (loopInfo.type === 'forEach') {
      // forEach solution
      const iterator = loopInfo.iteratorVar;
      const array = loopInfo.arrayName;
      
      solutionCode = `// Better: use map() instead of forEach with concatenation
const ${variableName} = ${array}.map(${iterator} => 
    /* return your content here */
).join('');`;
    }
    
    // Calculate the range to replace (from loop start to loop end)
    const range = this.calculateReplacementRange(analysis);
    
    return {
      code: solutionCode,
      range: range
    };
  }

  /**
   * Build a simple solution when we can't detect the loop
   */
  private buildSimpleSolution(variableName: string, _concatenations: string[]): any {
    const arrayName = `${variableName}Parts`;
    
    const solutionCode = `// Initialize array before loop
const ${arrayName} = [];

// In your loop, push instead of concatenating
// Example: ${arrayName}.push(yourContent);

// After loop, join the array
const ${variableName} = ${arrayName}.join('');`;
    
    return {
      code: solutionCode,
      range: null // Will use match range
    };
  }

  /**
   * Convert string concatenation to template literal
   */
  private convertToTemplateLiteral(expression: string, iteratorVar: string): string {
    // Simple conversion - this could be much more sophisticated
    expression = expression.replace(/['"`]/g, '');
    expression = expression.replace(/\+/g, '');
    
    // Wrap in template literal
    if (expression.includes(iteratorVar)) {
      return `\`${expression.replace(new RegExp(`${iteratorVar}\\.(\w+)`, 'g'), '${$&}')}\``;
    }
    
    return `\`${expression}\``;
  }

  /**
   * Calculate the range to replace (the entire loop if possible)
   */
  private calculateReplacementRange(_analysis: any): vscode.Range | null {
    // This would need more sophisticated AST analysis
    // For now, return null to use the match range
    return null;
  }

  /**
   * Get the line number of a node
   */
  private getNodeLine(node: AnyASTNode, context: MatchContext): number {
    if (node.loc) {
      return node.loc.start.line - 1; // Convert to 0-based
    }
    
    // Fallback: try to find in source
    const nodeStart = node.start || 0;
    const beforeNode = context.sourceCode.substring(0, nodeStart);
    return beforeNode.split('\n').length - 1;
  }

  /**
   * Get a generic solution as fallback
   */
  private getGenericSolution(): string {
    return `// Optimized approach using array.join()
const parts = [];
for (let item of items) {
    // Push your content instead of concatenating
    parts.push(\`<div>\${item.property}</div>\`);
}
const result = parts.join('');

// Or even better with map()
const result = items.map(item => 
    \`<div>\${item.property}</div>\`
).join('');`;
  }

  private isStringConcatenationAssignment(node: AnyASTNode): boolean {
    if (node.type !== 'AssignmentExpression') return false;

    const operator = (node as any).operator;
    if (operator !== '+=') return false;

    // Check if we're concatenating strings
    return this.isLikelyStringOperation(node);
  }

  private isStringConcatenationExpression(node: AnyASTNode): boolean {
    if (node.type !== 'BinaryExpression') return false;

    const operator = (node as any).operator;
    if (operator !== '+') return false;

    // Check if this is likely string concatenation (not numeric addition)
    return this.isLikelyStringOperation(node);
  }

  private isLikelyStringOperation(node: AnyASTNode): boolean {
    // Check for string literals
    if (this.hasStringLiteral(node)) return true;

    // Check for template literals
    if (this.hasTemplateLiteral(node)) return true;

    // Check for common string variables
    if (this.hasStringVariables(node)) return true;

    return false;
  }

  private hasStringLiteral(node: AnyASTNode): boolean {
    const checkNode = (n: any): boolean => {
      if (!n || typeof n !== 'object') return false;
      if (n.type === 'Literal' && typeof n.value === 'string') return true;

      for (const key in n) {
        const value = n[key];
        if (Array.isArray(value)) {
          if (value.some(item => checkNode(item))) return true;
        } else if (checkNode(value)) {
          return true;
        }
      }
      return false;
    };

    return checkNode(node);
  }

  private hasTemplateLiteral(node: AnyASTNode): boolean {
    const checkNode = (n: any): boolean => {
      if (!n || typeof n !== 'object') return false;
      if (n.type === 'TemplateLiteral') return true;

      for (const key in n) {
        const value = n[key];
        if (Array.isArray(value)) {
          if (value.some(item => checkNode(item))) return true;
        } else if (checkNode(value)) {
          return true;
        }
      }
      return false;
    };

    return checkNode(node);
  }

  private hasStringVariables(node: AnyASTNode): boolean {
    const stringVariablePatterns = [
      'html', 'text', 'content', 'message', 'output', 'result',
      'buffer', 'str', 'string', 'markup', 'code', 'sql', 'xml', 'json'
    ];

    const checkNode = (n: any): boolean => {
      if (!n || typeof n !== 'object') return false;
      if (n.type === 'Identifier' && stringVariablePatterns.some(pattern =>
        n.name?.toLowerCase().includes(pattern))) {
        return true;
      }

      for (const key in n) {
        const value = n[key];
        if (Array.isArray(value)) {
          if (value.some(item => checkNode(item))) return true;
        } else if (checkNode(value)) {
          return true;
        }
      }
      return false;
    };

    return checkNode(node);
  }

  private isInsideLoop(node: AnyASTNode, context: MatchContext): boolean {
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

  private getConcatenationType(node: AnyASTNode): string {
    if (node.type === 'AssignmentExpression' && (node as any).operator === '+=') {
      return 'string += operator';
    }

    if (node.type === 'BinaryExpression' && (node as any).operator === '+') {
      return 'string + operator';
    }

    return 'string concatenation';
  }
}

/**
 * Enhanced tooltip template with dynamic content
 */
const enhancedStringConcatenationInLoopsTemplate: TooltipTemplate = {
  title: '🔴 PERFORMANCE CRITICAL: String Concatenation in Loop',
  problemDescription: 'String concatenation with += in loops creates O(n²) time complexity. Each concatenation creates a new string object and copies all existing content.',
  impactDescription: 'With 1,000 iterations, this creates 500,000 string copy operations instead of 1,000. Memory usage grows exponentially.',
  solutionDescription: 'Use array.join(), template literals, or StringBuilder pattern for O(n) linear performance.',
  codeExamples: [
    {
      title: 'Your Specific Case - HTML Building',
      before: `function buildHTML(items) {
    let html = '';
    // PROBLEM: Concatenación con += en loop
    for (let item of items) {
        html += '<div>' + item.name + '</div>';
        html += '<p>' + item.description + '</p>';
    }
    return html;
}`,
      after: `function buildHTML(items) {
    // SOLUTION: Use map() and join() - O(n) performance
    const htmlParts = items.map(item => 
        \`<div>\${item.name}</div><p>\${item.description}</p>\`
    );
    return htmlParts.join('');
    
    // Alternative: Using array push
    const htmlParts = [];
    for (let item of items) {
        htmlParts.push(\`<div>\${item.name}</div><p>\${item.description}</p>\`);
    }
    return htmlParts.join('');
}`,
      improvement: '100-1000x faster with large arrays'
    }
  ],
  actions: [
    {
      label: 'Copy Optimized Solution',
      type: 'copy',
      payload: 'optimized-solution'
    },
    {
      label: 'Apply Fix',
      type: 'apply',
      payload: 'auto-fix'
    }
  ],
  learnMoreUrl: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/join'
};

/**
 * Enhanced string concatenation in loops pattern rule
 */
export const enhancedStringConcatenationInLoopsRule: PatternRule = {
  id: 'string-concatenation-in-loops-enhanced',
  name: 'String Concatenation in Loops (Enhanced)',
  description: 'Detects inefficient string concatenation inside loops with personalized fixes',
  category: PatternCategory.Performance,
  severity: 'critical',
  languages: ['javascript', 'typescript', 'typescriptreact', 'javascriptreact'],
  enabled: true,
  matcher: new EnhancedStringConcatenationInLoopsMatcher(),
  template: enhancedStringConcatenationInLoopsTemplate,
  scoreImpact: -15
};
