"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.modernJavaScriptRule = exports.ModernJavaScriptMatcher = void 0;
const types_1 = require("../types");
/**
 * Detects good ES6+ practices like const/let usage, arrow functions, template literals
 */
class ModernJavaScriptMatcher {
    match(node, _context) {
        // Detect const/let declarations (good practice)
        if (node.type === 'VariableDeclaration') {
            const kind = node.kind;
            if (kind === 'const' || kind === 'let') {
                return true; // Good practice!
            }
        }
        // Detect arrow functions (modern)
        if (node.type === 'ArrowFunctionExpression') {
            const body = node.body;
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
    isTooComplex(node) {
        // Check if arrow function body is too complex
        if (node.type === 'BlockStatement') {
            const statements = node.body || [];
            return statements.length > 10; // Arbitrary complexity threshold
        }
        return false;
    }
    getMatchDetails(node, _context) {
        let practiceType = 'Modern JavaScript';
        if (node.type === 'VariableDeclaration') {
            const kind = node.kind;
            practiceType = `Using ${kind} (block-scoped)`;
        }
        else if (node.type === 'ArrowFunctionExpression') {
            practiceType = 'Arrow function (concise syntax)';
        }
        else if (node.type === 'TemplateLiteral') {
            practiceType = 'Template literal (modern strings)';
        }
        else if (node.type === 'ObjectPattern' || node.type === 'ArrayPattern') {
            practiceType = 'Destructuring (clean syntax)';
        }
        else if (node.type === 'SpreadElement') {
            practiceType = 'Spread operator (immutable operations)';
        }
        return {
            impact: practiceType,
            suggestion: 'Keep using modern JavaScript features!'
        };
    }
}
exports.ModernJavaScriptMatcher = ModernJavaScriptMatcher;
const modernJavaScriptTemplate = {
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
exports.modernJavaScriptRule = {
    id: 'modern-javascript',
    name: 'Modern JavaScript',
    description: 'Detects and encourages modern JavaScript best practices',
    category: types_1.PatternCategory.Style,
    severity: 'good',
    languages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact'],
    enabled: true,
    matcher: new ModernJavaScriptMatcher(),
    template: modernJavaScriptTemplate,
    scoreImpact: 2 // Positive score for good practices!
};
//# sourceMappingURL=modern-javascript.js.map