import {
  PatternRule,
  PatternMatcher,
  ASTNode,
  MatchContext,
  PatternCategory,
  TooltipTemplate
} from '../types';

/**
 * Detects good ES6+ practices like const/let usage, arrow functions, template literals
 */
export class ModernJavaScriptMatcher implements PatternMatcher {
  public match(node: ASTNode, _context: MatchContext): boolean {
    // Detect const/let declarations (good practice)
    if (node.type === 'VariableDeclaration') {
      const kind = (node as any).kind;
      if (kind === 'const' || kind === 'let') {
        return true; // Good practice!
      }
    }

    // Detect arrow functions (modern)
    if (node.type === 'ArrowFunctionExpression') {
      const body = (node as any).body;
      // Simple arrow functions are good
      if (body && !this.isTooComplex(body)) {
        return true;
      }
    }

    // Detect template literals (modern string handling)
    if (node.type === 'TemplateLiteral') {
      return true;
    }

    // Detect destructuring (modern syntax)
    if (node.type === 'ObjectPattern' || node.type === 'ArrayPattern') {
      return true;
    }

    // Detect spread operator
    if (node.type === 'SpreadElement') {
      return true;
    }

    return false;
  }

  private isTooComplex(node: ASTNode): boolean {
    // Check if arrow function body is too complex
    if (node.type === 'BlockStatement') {
      const statements = (node as any).body || [];
      return statements.length > 10; // Arbitrary complexity threshold
    }
    return false;
  }

  public getMatchDetails(node: ASTNode, _context: MatchContext) {
    let practiceType = 'Modern JavaScript';

    if (node.type === 'VariableDeclaration') {
      const kind = (node as any).kind;
      practiceType = `Using ${kind} (block-scoped)`;
    } else if (node.type === 'ArrowFunctionExpression') {
      practiceType = 'Arrow function (concise syntax)';
    } else if (node.type === 'TemplateLiteral') {
      practiceType = 'Template literal (modern strings)';
    } else if (node.type === 'ObjectPattern' || node.type === 'ArrayPattern') {
      practiceType = 'Destructuring (clean syntax)';
    } else if (node.type === 'SpreadElement') {
      practiceType = 'Spread operator (immutable operations)';
    }

    return {
      impact: practiceType,
      suggestion: 'Keep using modern JavaScript features!'
    };
  }
}

const modernJavaScriptTemplate: TooltipTemplate = {
  title: '✅ GOOD PRACTICE: Modern JavaScript',
  problemDescription: '', // No problem for good practices!
  impactDescription: 'Clean, maintainable code that follows current standards.',
  solutionDescription: 'Keep up the great work using modern JavaScript features!',
  codeExamples: [
    {
      title: 'What you\'re doing right',
      before: '', // No "before" for good practices
      after: `// You're using:
const name = 'John';     // ✓ const for immutable
let count = 0;           // ✓ let for mutable
const add = (a, b) => a + b;  // ✓ arrow functions
const msg = \`Hello \${name}\`;  // ✓ template literals
const { x, y } = point;        // ✓ destructuring`,
      improvement: 'Modern, clean, bug-free code'
    }
  ],
  actions: [],
  learnMoreUrl: '' // No need for learn more on good practices
};

export const modernJavaScriptRule: PatternRule = {
  id: 'modern-javascript',
  name: 'Modern JavaScript',
  description: 'Detects and encourages modern JavaScript best practices',
  category: PatternCategory.Style,
  severity: 'good',
  languages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact'],
  enabled: true,
  matcher: new ModernJavaScriptMatcher(),
  template: modernJavaScriptTemplate,
  scoreImpact: 2  // Positive score for good practices!
};
