import { PatternMatch, MatchContext, FixSuggestion } from '../types';
/**
 * Enhanced Personalized Fix Generator
 * Handles more patterns including setTimeout
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
     * Fix memory leak - ENHANCED to handle all types
     */
    private fixMemoryLeak;
    /**
     * Get function/class context around the problem code
     */
    private getFunctionContext;
    /**
     * Fix nested loops - using EXACT user code
     */
    private fixNestedLoops;
    private fixStringConcatenation;
    private fixBlockingOperations;
    private fixLongFunction;
    private fixMissingMemo;
    private fixConsoleUsage;
    private fixExpensiveOperations;
    private fixDOMQueries;
    private fixInlineFunctions;
    private fixStateMutation;
    private fixMissingKeys;
    private detectFileContext;
    private createGenericFix;
    private capitalize;
}
export declare const personalizedFixGenerator: PersonalizedFixGenerator;
//# sourceMappingURL=personalized-fix-generator.d.ts.map