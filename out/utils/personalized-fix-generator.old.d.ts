import { PatternMatch, MatchContext, FixSuggestion } from '../types';
/**
 * Universal Personalized Fix Generator
 * Generates context-aware, personalized fixes for all patterns
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
     * Detect file type and framework context
     */
    private detectFileContext;
    /**
     * Extract code elements from the actual code
     */
    private extractCodeElements;
    /**
     * Build personalized fix based on pattern and context
     */
    private buildPersonalizedFix;
    /**
     * Fix for nested loops - personalized
     */
    private fixNestedLoops;
    /**
     * Fix for string concatenation - personalized
     */
    private fixStringConcatenation;
    /**
     * Fix for missing React.memo - personalized
     */
    private fixMissingMemo;
    /**
     * Fix for long functions - personalized
     */
    private fixLongFunction;
    /**
     * Fix for blocking operations - personalized
     */
    private fixBlockingOperations;
    /**
     * Fix for expensive operations in loops
     */
    private fixExpensiveLoops;
    /**
     * Fix for inline functions in React props
     */
    private fixInlineFunctions;
    /**
     * Fix for missing keys in React lists
     */
    private fixMissingKeys;
    /**
     * Fix for direct state mutation in React
     */
    private fixStateMutation;
    /**
     * Fix for memory leaks - usando el código REAL del usuario
     */
    private fixMemoryLeaks;
    /**
     * Extraer contexto de la función que contiene el código
     */
    private extractFunctionContext;
    /**
     * Generar fix genérico para memory leaks
     */
    private buildGenericMemoryLeakFix;
    /**
     * Fix for console usage
     */
    private fixConsoleUsage;
    /**
     * Filter suggestions based on file context
     */
    private filterByContext;
    private extractVariables;
    private extractFunctions;
    private extractClasses;
    private extractImports;
    private extractComponentName;
    private extractLoopInfo;
    private extractMethodCalls;
    private extractParameters;
    private extractProperties;
    private getNodeCode;
    private buildGenericFix;
    private capitalize;
}
export declare const personalizedFixGenerator: PersonalizedFixGenerator;
//# sourceMappingURL=personalized-fix-generator.old.d.ts.map