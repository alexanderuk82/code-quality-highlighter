import {
  PatternRule,
  PatternMatcher,
  AnyASTNode,
  MatchContext,
  PatternCategory,
  TooltipTemplate
} from '../types';

/**
 * Matcher for detecting string concatenation inside loops
 */
export class StringConcatenationInLoopsMatcher implements PatternMatcher {
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

  public getMatchDetails(node: AnyASTNode, context: MatchContext) {
    const concatenationType = this.getConcatenationType(node);
    
    // Extract variable names and context for personalized fix
    const fix = this.generatePersonalizedFix(node, context);

    return {
      complexity: 2,
      impact: 'O(n²) string concatenation - each += creates new string object, copying all previous content',
      suggestion: `Use array.join() or template literals for O(n) performance instead of ${concatenationType}`,
      fix: fix
    };
  }

  private generatePersonalizedFix(node: AnyASTNode, context: MatchContext): any {
    try {
      // Get the variable being concatenated to
      if (node.type === 'AssignmentExpression' && (node as any).operator === '+=') {
        const variableName = this.getVariableName((node as any).left);
        const loopInfo = this.getLoopContext(node, context);
        
        if (variableName && loopInfo) {
          // Generate personalized solution based on actual code
          const arrayName = `${variableName}Parts`;
          const loopVar = loopInfo.iteratorVar || 'item';
          const loopArray = loopInfo.arrayName || 'items';
          
          // Build personalized fix
          let fixCode = `// Initialize array before loop\n`;
          fixCode += `const ${arrayName} = [];\n`;
          fixCode += `// Inside your loop, push instead of concatenating\n`;
          fixCode += `for (let ${loopVar} of ${loopArray}) {\n`;
          fixCode += `  ${arrayName}.push(/* your content here */);\n`;
          fixCode += `}\n`;
          fixCode += `// After loop, join the array\n`;
          fixCode += `const ${variableName} = ${arrayName}.join('');`;
          
          return {
            type: 'copy',
            text: fixCode
          };
        }
      }
    } catch (e) {
      // Fall back to generic fix if extraction fails
      console.log('Failed to generate personalized fix:', e);
    }
    
    // Default generic fix
    return {
      type: 'copy',
      text: `const parts = [];\nfor (let item of items) {\n  parts.push(/* your content */);\n}\nconst result = parts.join('');`
    };
  }

  private getVariableName(node: AnyASTNode): string | null {
    if (node.type === 'Identifier') {
      return (node as any).name;
    }
    return null;
  }

  private getLoopContext(node: AnyASTNode, context: MatchContext): any {
    // This would need to traverse up the AST to find the loop
    // For now, return a simplified version
    const sourceCode = context.sourceCode;
    const nodeStart = node.start || 0;
    const codeBeforeNode = sourceCode.substring(Math.max(0, nodeStart - 200), nodeStart);
    
    // Try to extract loop variable names with regex (simplified)
    const forOfMatch = codeBeforeNode.match(/for\s*\(\s*(?:let|const|var)\s+(\w+)\s+of\s+(\w+)/i);
    if (forOfMatch) {
      return {
        iteratorVar: forOfMatch[1],
        arrayName: forOfMatch[2]
      };
    }
    
    const forInMatch = codeBeforeNode.match(/for\s*\(\s*(?:let|const|var)\s+(\w+)\s+in\s+(\w+)/i);
    if (forInMatch) {
      return {
        iteratorVar: forInMatch[1],
        arrayName: forInMatch[2]
      };
    }
    
    return null;
  }

  // Commented out - not used currently but kept for future enhancements
  // private extractConcatenatedContent(node: AnyASTNode, context: MatchContext): string {
  //   // Extract the actual content being concatenated
  //   const nodeWithRight = node as any;
  //   if (nodeWithRight.right) {
  //     const start = nodeWithRight.right.start || 0;
  //     const end = nodeWithRight.right.end || start + 10;
  //     return context.sourceCode.substring(start, end);
  //   }
  //   return '';
  // }

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
    // Heuristics to detect string operations:

    // 1. String literals involved
    if (this.hasStringLiteral(node)) return true;

    // 2. Template literals
    if (this.hasTemplateLiteral(node)) return true;

    // 3. Common string variables/properties
    if (this.hasStringVariables(node)) return true;

    // 4. String method calls
    if (this.hasStringMethods(node)) return true;

    return false;
  }

  private hasStringLiteral(node: AnyASTNode): boolean {
    // Check all properties recursively for string literals
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    // Common string variable patterns
    const stringVariablePatterns = [
      'html', 'text', 'content', 'message', 'output', 'result',
      'buffer', 'str', 'string', 'markup', 'code', 'sql'
    ];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  private hasStringMethods(node: AnyASTNode): boolean {
    const stringMethods = [
      'toString', 'valueOf', 'charAt', 'charCodeAt', 'concat',
      'indexOf', 'lastIndexOf', 'slice', 'substring', 'substr',
      'toLowerCase', 'toUpperCase', 'trim', 'replace', 'split'
    ];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const checkNode = (n: any): boolean => {
      if (!n || typeof n !== 'object') return false;

      if (n.type === 'CallExpression' && n.callee?.type === 'MemberExpression') {
        const property = n.callee.property;
        if (property && stringMethods.includes(property.name)) {
          return true;
        }
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
    // Simplified loop detection - in real implementation, traverse AST parents
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
 * Tooltip template for string concatenation in loops
 */
const stringConcatenationInLoopsTemplate: TooltipTemplate = {
  title: '🔴 PERFORMANCE CRITICAL: String Concatenation in Loop',
  problemDescription: 'String concatenation with += in loops creates O(n²) time complexity. Each concatenation creates a new string object and copies all existing content.',
  impactDescription: 'With 1,000 iterations, this creates 500,000 string copy operations instead of 1,000. Memory usage grows exponentially.',
  solutionDescription: 'Use array.join(), template literals, or StringBuilder pattern for O(n) linear performance.',
  codeExamples: [
    {
      title: 'HTML Generation in Loops',
      before: `// ❌ O(n²) - Each += copies entire string
let html = '';
for (let i = 0; i < items.length; i++) {
  html += '<div class="item">';
  html += '<h3>' + items[i].title + '</h3>';
  html += '<p>' + items[i].description + '</p>';
  html += '</div>';
}`,
      after: `// ✅ O(n) - Array join is linear
const htmlParts = [];
for (let i = 0; i < items.length; i++) {
  htmlParts.push(
    '<div class="item">',
    '<h3>' + items[i].title + '</h3>',
    '<p>' + items[i].description + '</p>',
    '</div>'
  );
}
const html = htmlParts.join('');

// ✅ Even better with template literals
const html = items.map(item => \`
  <div class="item">
    <h3>\${item.title}</h3>
    <p>\${item.description}</p>
  </div>
\`).join('');`,
      improvement: '100-1000x faster with large datasets'
    },
    {
      title: 'CSV/SQL Generation',
      before: `// ❌ Inefficient string building
let csv = 'name,email,age\\n';
for (let i = 0; i < users.length; i++) {
  csv += users[i].name + ',';
  csv += users[i].email + ',';
  csv += users[i].age + '\\n';
}

let sql = 'INSERT INTO users VALUES ';
for (let i = 0; i < users.length; i++) {
  sql += '(' + users[i].id + ',"' + users[i].name + '"),';
}`,
      after: `// ✅ Efficient array-based building
const csvRows = ['name,email,age'];
for (let i = 0; i < users.length; i++) {
  csvRows.push(\`\${users[i].name},\${users[i].email},\${users[i].age}\`);
}
const csv = csvRows.join('\\n');

// ✅ SQL with map and join
const sql = 'INSERT INTO users VALUES ' + 
  users.map(user => \`(\${user.id},"\${user.name}")\`).join(',');`,
      improvement: 'Linear performance and cleaner code'
    },
    {
      title: 'Log Message Building',
      before: `// ❌ String concatenation in loop
let logMessage = 'Processing items: ';
for (let i = 0; i < items.length; i++) {
  logMessage += items[i].id + ' ';
  if (items[i].error) {
    logMessage += '(ERROR: ' + items[i].error + ') ';
  }
}`,
      after: `// ✅ Array-based message building
const logParts = ['Processing items:'];
for (let i = 0; i < items.length; i++) {
  logParts.push(items[i].id);
  if (items[i].error) {
    logParts.push(\`(ERROR: \${items[i].error})\`);
  }
}
const logMessage = logParts.join(' ');

// ✅ Or use filter and map
const logMessage = 'Processing items: ' + 
  items.map(item => 
    item.error ? \`\${item.id} (ERROR: \${item.error})\` : item.id
  ).join(' ');`,
      improvement: 'Better performance and more readable code'
    }
  ],
  actions: [
    {
      label: 'Copy Array.join() Solution',
      type: 'copy',
      payload: 'array-join-solution'
    },
    {
      label: 'Apply Quick Fix',
      type: 'apply',
      payload: 'convert-to-array-join'
    },
    {
      label: 'Learn About String Performance',
      type: 'explain',
      payload: 'string-performance'
    }
  ],
  learnMoreUrl: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/join'
};

/**
 * String concatenation in loops pattern rule
 */
export const stringConcatenationInLoopsRule: PatternRule = {
  id: 'string-concatenation-in-loops',
  name: 'String Concatenation in Loops',
  description: 'Detects inefficient string concatenation inside loops',
  category: PatternCategory.Performance,
  severity: 'critical',
  languages: ['javascript', 'typescript', 'typescriptreact', 'javascriptreact'],
  enabled: true,
  matcher: new StringConcatenationInLoopsMatcher(),
  template: stringConcatenationInLoopsTemplate,
  scoreImpact: -15
};
