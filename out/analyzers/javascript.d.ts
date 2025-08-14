import { BaseAnalyzer } from './base';
import { AnyASTNode, PatternMatch, MatchContext, SupportedLanguage } from '../types';
/**
 * JavaScript/TypeScript analyzer using Babel parser
 */
export declare class JavaScriptAnalyzer extends BaseAnalyzer {
    readonly language: SupportedLanguage;
    protected readonly fileExtensions: string[];
    /**
     * Parse JavaScript/TypeScript source code into AST
     */
    parseAST(sourceCode: string): Promise<AnyASTNode>;
    /**
     * Detect patterns in JavaScript/TypeScript AST
     */
    protected detectPatterns(ast: AnyASTNode, context: MatchContext): Promise<PatternMatch[]>;
    /**
     * Detect JavaScript-specific patterns using Babel traverse
     */
    private detectJavaScriptSpecificPatterns;
    /**
     * Check for blocking synchronous operations
     */
    private checkBlockingOperations;
    /**
     * Check for expensive operations in loops
     */
    private checkExpensiveOperationsInLoops;
    /**
     * Check for eval usage
     */
    private checkEvalUsage;
    /**
     * Check for console usage
     */
    private checkConsoleUsage;
    /**
     * Check for magic numbers
     */
    private checkMagicNumbers;
    /**
     * Check function length
     */
    private checkFunctionLength;
    /**
     * Check for unused variables
     */
    private checkUnusedVariables;
    /**
     * Check for loose equality (== instead of ===)
     */
    private checkLooseEquality;
    /**
     * Helper: Check if path is inside a loop
     */
    private isInsideLoop;
    /**
     * Helper: Check if node is a loop
     */
    private isLoopNode;
    /**
     * Helper: Check if numeric literal is in meaningful context
     */
    private isInMeaningfulContext;
    /**
     * Helper: Count lines in AST node
     */
    private countLines;
    /**
     * Helper: Detect TypeScript syntax
     */
    private containsTypeScriptSyntax;
    /**
     * Override supports method to handle TypeScript files
     */
    supports(filePath: string): boolean;
}
/**
 * TypeScript-specific analyzer that extends JavaScript analyzer
 */
export declare class TypeScriptAnalyzer extends JavaScriptAnalyzer {
    readonly language: SupportedLanguage;
    protected readonly fileExtensions: string[];
    /**
     * Detect TypeScript-specific patterns
     */
    protected detectPatterns(ast: AnyASTNode, context: MatchContext): Promise<PatternMatch[]>;
    /**
     * Detect TypeScript-specific patterns
     */
    private detectTypeScriptSpecificPatterns;
    /**
     * Check for missing type annotations
     */
    private checkMissingTypeAnnotations;
    /**
     * Check for any type usage
     */
    private checkAnyTypeUsage;
    /**
     * Check for non-null assertions
     */
    private checkNonNullAssertion;
}
//# sourceMappingURL=javascript.d.ts.map