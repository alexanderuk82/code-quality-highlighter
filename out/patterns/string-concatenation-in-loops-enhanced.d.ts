import { PatternRule, PatternMatcher, AnyASTNode, MatchContext, MatchDetails } from '../types';
/**
 * Enhanced Matcher for detecting string concatenation inside loops
 * with personalized fix generation
 */
export declare class EnhancedStringConcatenationInLoopsMatcher implements PatternMatcher {
    match(node: AnyASTNode, context: MatchContext): boolean;
    getMatchDetails(node: AnyASTNode, context: MatchContext): MatchDetails;
    /**
     * Generate a personalized fix based on the actual code
     */
    private generatePersonalizedFix;
    /**
     * Analyze the code context to extract variable names and structure
     */
    private analyzeCodeContext;
    /**
     * Collect all concatenation statements in the loop
     */
    private collectAllConcatenations;
    /**
     * Build a personalized solution based on the analysis
     */
    private buildPersonalizedSolution;
    /**
     * Build a simple solution when we can't detect the loop
     */
    private buildSimpleSolution;
    /**
     * Convert string concatenation to template literal
     */
    private convertToTemplateLiteral;
    /**
     * Calculate the range to replace (the entire loop if possible)
     */
    private calculateReplacementRange;
    /**
     * Get the line number of a node
     */
    private getNodeLine;
    /**
     * Get a generic solution as fallback
     */
    private getGenericSolution;
    private isStringConcatenationAssignment;
    private isStringConcatenationExpression;
    private isLikelyStringOperation;
    private hasStringLiteral;
    private hasTemplateLiteral;
    private hasStringVariables;
    private isInsideLoop;
    private getConcatenationType;
}
/**
 * Enhanced string concatenation in loops pattern rule
 */
export declare const enhancedStringConcatenationInLoopsRule: PatternRule;
//# sourceMappingURL=string-concatenation-in-loops-enhanced.d.ts.map