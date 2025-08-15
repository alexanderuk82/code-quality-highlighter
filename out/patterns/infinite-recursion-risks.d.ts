import { AnyASTNode, PatternMatcher, MatchContext, MatchDetails, TooltipTemplate, PatternRule } from '../types';
/**
 * Detects functions with infinite recursion risks
 *
 * Problematic patterns:
 * - Functions without base cases
 * - Recursive calls without parameter modification
 * - Unbounded recursion depth
 * - Missing termination conditions
 *
 * Performance impact: Prevents stack overflow crashes
 */
export declare class InfiniteRecursionRisksMatcher implements PatternMatcher {
    match(node: AnyASTNode, context: MatchContext): boolean;
    getMatchDetails(node: AnyASTNode, context: MatchContext): MatchDetails;
    private isRelevantNode;
    private hasRecursionRisk;
    private getFunctionName;
    private hasRecursiveCall;
    private containsRecursiveCall;
    private containsAnonymousRecursion;
    private lacksBaseCase;
    private hasNonRecursiveReturn;
    private looksLikeBaseCase;
    private containsFunctionCall;
    private hasDirectRecursiveReturn;
    private hasUnmodifiedRecursion;
    private findRecursiveCallWithSameArgs;
    private lacksDepthLimit;
    private getRiskType;
    private calculateComplexity;
    private getSuggestion;
}
/**
 * Tooltip template for infinite recursion risks
 */
declare const infiniteRecursionRisksTemplate: TooltipTemplate;
/**
 * Infinite recursion risks pattern rule
 */
export declare const infiniteRecursionRisksRule: PatternRule;
export { infiniteRecursionRisksTemplate };
//# sourceMappingURL=infinite-recursion-risks.d.ts.map