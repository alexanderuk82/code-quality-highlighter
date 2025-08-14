import { AnyASTNode, PatternMatcher, MatchContext, MatchDetails, TooltipTemplate, PatternRule } from '../types';
/**
 * Detects multiple array iterations that can be optimized into single-pass operations
 *
 * Problematic patterns:
 * - arr.map().filter().reduce() chains
 * - Multiple separate iterations over the same array
 * - Nested array methods creating O(n²) complexity
 *
 * Performance impact: Reduces O(3n) to O(n) complexity
 */
export declare class MultipleArrayIterationsMatcher implements PatternMatcher {
    private readonly chainableArrayMethods;
    match(node: AnyASTNode, context: MatchContext): boolean;
    getMatchDetails(node: AnyASTNode, _context: MatchContext): MatchDetails;
    private isRelevantNode;
    private hasChainedArrayMethods;
    private getChainLength;
    private getArrayName;
    private hasMultipleIterationsOnSameArray;
    private calculateComplexity;
    private getSuggestion;
}
/**
 * Tooltip template for multiple array iterations
 */
declare const multipleArrayIterationsTemplate: TooltipTemplate;
/**
 * Multiple array iterations pattern rule
 */
export declare const multipleArrayIterationsRule: PatternRule;
export { multipleArrayIterationsTemplate };
//# sourceMappingURL=multiple-array-iterations.d.ts.map