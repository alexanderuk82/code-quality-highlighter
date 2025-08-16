import { PatternMatch, MatchContext, FixSuggestion } from '../types';
/**
 * Universal Personalized Fix Generator - Version 2
 * Generates fixes using the EXACT user code
 */
export declare class PersonalizedFixGenerator {
    private static instance;
    private constructor();
    static getInstance(): PersonalizedFixGenerator;
    /**
     * Generate a personalized fix for any pattern match
     */
    generateFix(match: PatternMatch, context: MatchContext): FixSuggestion | undefined;
    /**
     * Get the exact code that caused the problem
     */
    private getExactProblemCode;
    /**
     * Generate fix for specific pattern
     */
    private generateFixForPattern;
    /**
     * Fix memory leak - using EXACT user code
     */
    private fixMemoryLeak;
    /**
     * Fix nested loops - using EXACT user code
     */
    private fixNestedLoops;
    /**
     * Fix string concatenation - using EXACT user code
     */
    private fixStringConcatenation;
    /**
     * Fix blocking operations - using EXACT user code
     */
    private fixBlockingOperations;
    /**
     * Fix long function - using EXACT user code
     */
    private fixLongFunction;
    /**
     * Fix missing React.memo - using EXACT user code
     */
    private fixMissingMemo;
    /**
     * Fix console usage - using EXACT user code
     */
    private fixConsoleUsage;
    /**
     * Fix expensive operations in loops - using EXACT user code
     */
    private fixExpensiveOperations;
    /**
     * Fix DOM queries in loops - using EXACT user code
     */
    private fixDOMQueries;
    /**
     * Fix inline functions - using EXACT user code
     */
    private fixInlineFunctions;
    /**
     * Fix state mutation - using EXACT user code
     */
    private fixStateMutation;
    /**
     * Fix missing keys - using EXACT user code
     */
    private fixMissingKeys;
    /**
     * Detect file context
     */
    private detectFileContext;
    /**
     * Create a generic fix when we can't parse the code
     */
    private createGenericFix;
    /**
     * Capitalize first letter
     */
    private capitalize;
}
export declare const personalizedFixGenerator: PersonalizedFixGenerator;
//# sourceMappingURL=personalized-fix-generator-v2.d.ts.map