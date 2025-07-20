"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TypeScriptAnalyzer = exports.JavaScriptAnalyzer = void 0;
const parser_1 = require("@babel/parser");
const traverse_1 = __importDefault(require("@babel/traverse"));
const base_1 = require("./base");
const engine_1 = require("../patterns/engine");
/**
 * JavaScript/TypeScript analyzer using Babel parser
 */
class JavaScriptAnalyzer extends base_1.BaseAnalyzer {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "language", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 'javascript'
        });
        Object.defineProperty(this, "fileExtensions", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: ['.js', '.jsx', '.ts', '.tsx']
        });
    }
    /**
     * Parse JavaScript/TypeScript source code into AST
     */
    async parseAST(sourceCode) {
        try {
            // Determine if this is TypeScript based on syntax
            const isTypeScript = this.containsTypeScriptSyntax(sourceCode);
            const ast = (0, parser_1.parse)(sourceCode, {
                sourceType: 'module',
                allowImportExportEverywhere: true,
                allowReturnOutsideFunction: true,
                plugins: [
                    'jsx',
                    'asyncGenerators',
                    'bigInt',
                    'classProperties',
                    'decorators-legacy',
                    'doExpressions',
                    'dynamicImport',
                    'exportDefaultFrom',
                    'exportNamespaceFrom',
                    'functionBind',
                    'functionSent',
                    'importMeta',
                    'nullishCoalescingOperator',
                    'numericSeparator',
                    'objectRestSpread',
                    'optionalCatchBinding',
                    'optionalChaining',
                    'throwExpressions',
                    'topLevelAwait',
                    ...(isTypeScript ? ['typescript'] : [])
                ]
            });
            return ast;
        }
        catch (error) {
            throw new Error(`Failed to parse JavaScript/TypeScript: ${error}`);
        }
    }
    /**
     * Detect patterns in JavaScript/TypeScript AST
     */
    async detectPatterns(ast, context) {
        const matches = [];
        try {
            // Use pattern engine to detect all registered patterns
            const detectedMatches = await engine_1.patternEngine.detectPatterns(ast, context);
            matches.push(...detectedMatches);
            // Add language-specific pattern detection
            await this.detectJavaScriptSpecificPatterns(ast, context, matches);
        }
        catch (error) {
            console.warn('Error in JavaScript pattern detection:', error);
        }
        return matches;
    }
    /**
     * Detect JavaScript-specific patterns using Babel traverse
     */
    async detectJavaScriptSpecificPatterns(ast, context, matches) {
        // Use Babel traverse for more sophisticated AST traversal
        (0, traverse_1.default)(ast, {
            // Detect blocking synchronous operations
            CallExpression: (path) => {
                this.checkBlockingOperations(path, context, matches);
                this.checkExpensiveOperationsInLoops(path, context, matches);
                this.checkEvalUsage(path, context, matches);
            },
            // Detect console.log in production
            MemberExpression: (path) => {
                this.checkConsoleUsage(path, context, matches);
            },
            // Detect magic numbers
            NumericLiteral: (path) => {
                this.checkMagicNumbers(path, context, matches);
            },
            // Detect functions that are too long
            FunctionDeclaration: (path) => {
                this.checkFunctionLength(path, context, matches);
            },
            ArrowFunctionExpression: (path) => {
                this.checkFunctionLength(path, context, matches);
            },
            FunctionExpression: (path) => {
                this.checkFunctionLength(path, context, matches);
            },
            // Detect unused variables
            VariableDeclarator: (path) => {
                this.checkUnusedVariables(path, context, matches);
            },
            // Detect == instead of ===
            BinaryExpression: (path) => {
                this.checkLooseEquality(path, context, matches);
            }
        });
    }
    /**
     * Check for blocking synchronous operations
     */
    checkBlockingOperations(path, context, matches) {
        const node = path.node;
        if (node.callee && node.callee.type === 'MemberExpression') {
            const property = node.callee.property;
            if (property && property.name && property.name.endsWith('Sync')) {
                matches.push({
                    ruleId: 'blocking-sync-operations',
                    severity: 'critical',
                    category: PatternCategory.Performance,
                    range: this.createRangeFromNode(node),
                    node,
                    context
                });
            }
        }
    }
    /**
     * Check for expensive operations in loops
     */
    checkExpensiveOperationsInLoops(path, context, matches) {
        const node = path.node;
        // Check if we're inside a loop
        if (this.isInsideLoop(path)) {
            // Check for array.find, array.indexOf, etc.
            if (node.callee && node.callee.type === 'MemberExpression') {
                const property = node.callee.property;
                const expensiveMethods = ['find', 'indexOf', 'includes', 'filter', 'map'];
                if (property && expensiveMethods.includes(property.name)) {
                    matches.push({
                        ruleId: 'expensive-operations-in-loops',
                        severity: 'critical',
                        category: PatternCategory.Performance,
                        range: this.createRangeFromNode(node),
                        node,
                        context
                    });
                }
            }
        }
    }
    /**
     * Check for eval usage
     */
    checkEvalUsage(path, context, matches) {
        const node = path.node;
        if (node.callee && node.callee.name === 'eval') {
            matches.push({
                ruleId: 'eval-usage',
                severity: 'critical',
                category: PatternCategory.Security,
                range: this.createRangeFromNode(node),
                node,
                context
            });
        }
    }
    /**
     * Check for console usage
     */
    checkConsoleUsage(path, context, matches) {
        const node = path.node;
        if (node.object && node.object.name === 'console') {
            matches.push({
                ruleId: 'console-usage',
                severity: 'warning',
                category: PatternCategory.Maintainability,
                range: this.createRangeFromNode(node),
                node,
                context
            });
        }
    }
    /**
     * Check for magic numbers
     */
    checkMagicNumbers(path, context, matches) {
        const node = path.node;
        const value = node.value;
        // Allow common numbers
        if (value === 0 || value === 1 || value === -1) {
            return;
        }
        // Check if it's in a meaningful context (array index, etc.)
        if (this.isInMeaningfulContext(path)) {
            return;
        }
        matches.push({
            ruleId: 'magic-numbers',
            severity: 'info',
            category: PatternCategory.Maintainability,
            range: this.createRangeFromNode(node),
            node,
            context
        });
    }
    /**
     * Check function length
     */
    checkFunctionLength(path, context, matches) {
        const node = path.node;
        const body = node.body;
        if (body && body.body) {
            const lineCount = this.countLines(body);
            if (lineCount > 50) {
                matches.push({
                    ruleId: 'function-too-long',
                    severity: 'warning',
                    category: PatternCategory.Maintainability,
                    range: this.createRangeFromNode(node),
                    node,
                    context
                });
            }
        }
    }
    /**
     * Check for unused variables
     */
    checkUnusedVariables(path, context, matches) {
        const node = path.node;
        const binding = path.scope.getBinding(node.id.name);
        if (binding && !binding.referenced) {
            matches.push({
                ruleId: 'unused-variables',
                severity: 'warning',
                category: PatternCategory.Maintainability,
                range: this.createRangeFromNode(node),
                node,
                context
            });
        }
    }
    /**
     * Check for loose equality (== instead of ===)
     */
    checkLooseEquality(path, context, matches) {
        const node = path.node;
        if (node.operator === '==' || node.operator === '!=') {
            matches.push({
                ruleId: 'loose-equality',
                severity: 'warning',
                category: PatternCategory.Maintainability,
                range: this.createRangeFromNode(node),
                node,
                context
            });
        }
    }
    /**
     * Helper: Check if path is inside a loop
     */
    isInsideLoop(path) {
        let parent = path.parent;
        while (parent) {
            if (this.isLoopNode(parent)) {
                return true;
            }
            parent = parent.parent;
        }
        return false;
    }
    /**
     * Helper: Check if node is a loop
     */
    isLoopNode(node) {
        return [
            'ForStatement',
            'WhileStatement',
            'DoWhileStatement',
            'ForInStatement',
            'ForOfStatement'
        ].includes(node.type);
    }
    /**
     * Helper: Check if numeric literal is in meaningful context
     */
    isInMeaningfulContext(path) {
        const parent = path.parent;
        if (!parent)
            return false;
        // Array index access
        if (parent.type === 'MemberExpression' && parent.computed) {
            return true;
        }
        // Function parameters with default values
        if (parent.type === 'AssignmentPattern') {
            return true;
        }
        // Object property keys
        if (parent.type === 'Property' && parent.key === path.node) {
            return true;
        }
        return false;
    }
    /**
     * Helper: Count lines in AST node
     */
    countLines(node) {
        if (!node.loc)
            return 0;
        return node.loc.end.line - node.loc.start.line + 1;
    }
    /**
     * Helper: Detect TypeScript syntax
     */
    containsTypeScriptSyntax(sourceCode) {
        // Simple heuristics to detect TypeScript
        const typeScriptPatterns = [
            /:\s*(string|number|boolean|object|any|void|never)/,
            /interface\s+\w+/,
            /type\s+\w+\s*=/,
            /as\s+\w+/,
            /<\w+>/,
            /public\s+|private\s+|protected\s+/,
            /readonly\s+/,
            /namespace\s+/,
            /declare\s+/
        ];
        return typeScriptPatterns.some(pattern => pattern.test(sourceCode));
    }
    /**
     * Override supports method to handle TypeScript files
     */
    supports(filePath) {
        const extension = this.getFileExtension(filePath);
        return this.fileExtensions.includes(extension);
    }
}
exports.JavaScriptAnalyzer = JavaScriptAnalyzer;
/**
 * TypeScript-specific analyzer that extends JavaScript analyzer
 */
class TypeScriptAnalyzer extends JavaScriptAnalyzer {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "language", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 'typescript'
        });
        Object.defineProperty(this, "fileExtensions", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: ['.ts', '.tsx']
        });
    }
    /**
     * Detect TypeScript-specific patterns
     */
    async detectPatterns(ast, context) {
        // Get base JavaScript patterns
        const matches = await super.detectPatterns(ast, context);
        // Add TypeScript-specific pattern detection
        await this.detectTypeScriptSpecificPatterns(ast, context, matches);
        return matches;
    }
    /**
     * Detect TypeScript-specific patterns
     */
    async detectTypeScriptSpecificPatterns(ast, context, matches) {
        (0, traverse_1.default)(ast, {
            // Detect missing type annotations
            FunctionDeclaration: (path) => {
                this.checkMissingTypeAnnotations(path, context, matches);
            },
            ArrowFunctionExpression: (path) => {
                this.checkMissingTypeAnnotations(path, context, matches);
            },
            // Detect any type usage
            TSAnyKeyword: (path) => {
                this.checkAnyTypeUsage(path, context, matches);
            },
            // Detect non-null assertions
            TSNonNullExpression: (path) => {
                this.checkNonNullAssertion(path, context, matches);
            }
        });
    }
    /**
     * Check for missing type annotations
     */
    checkMissingTypeAnnotations(path, context, matches) {
        const node = path.node;
        // Check return type annotation
        if (!node.returnType) {
            matches.push({
                ruleId: 'missing-return-type',
                severity: 'info',
                category: PatternCategory.Maintainability,
                range: this.createRangeFromNode(node),
                node,
                context
            });
        }
        // Check parameter type annotations
        if (node.params) {
            node.params.forEach((param) => {
                if (!param.typeAnnotation) {
                    matches.push({
                        ruleId: 'missing-parameter-type',
                        severity: 'info',
                        category: PatternCategory.Maintainability,
                        range: this.createRangeFromNode(param),
                        node: param,
                        context
                    });
                }
            });
        }
    }
    /**
     * Check for any type usage
     */
    checkAnyTypeUsage(path, context, matches) {
        const node = path.node;
        matches.push({
            ruleId: 'any-type-usage',
            severity: 'warning',
            category: PatternCategory.Maintainability,
            range: this.createRangeFromNode(node),
            node,
            context
        });
    }
    /**
     * Check for non-null assertions
     */
    checkNonNullAssertion(path, context, matches) {
        const node = path.node;
        matches.push({
            ruleId: 'non-null-assertion',
            severity: 'warning',
            category: PatternCategory.Maintainability,
            range: this.createRangeFromNode(node),
            node,
            context
        });
    }
}
exports.TypeScriptAnalyzer = TypeScriptAnalyzer;
//# sourceMappingURL=javascript.js.map