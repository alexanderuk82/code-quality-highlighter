import { PatternRule, PatternMatcher, AnyASTNode, MatchContext } from '../types';
/**
 * Matcher for detecting DOM query operations inside loops
 */
export declare class DOMQueriesInLoopsMatcher implements PatternMatcher {
    private readonly domQueryMethods;
    private readonly domManipulationMethods;
    private readonly expensiveStyleMethods;
    match(node: AnyASTNode, context: MatchContext): boolean;
    getMatchDetails(node: AnyASTNode, _context: MatchContext): {
        complexity: number;
        impact: string;
        suggestion: string;
    };
    private isRelevantNode;
    private isInsideLoop;
    private isDirectlyInLoop;
    private isInFunctionOutsideLoop;
    private findFunctionEndIndex;
    private isDOMQueryMethod;
    private isDOMManipulationMethod;
    private isExpensiveStyleMethod;
    private getMethodName;
    private getDOMOperationType;
    private estimateComplexity;
    private getSuggestion;
    private isDOMContextCall;
}
/**
 * DOM queries in loops pattern rule
 */
export declare const domQueriesInLoopsRule: PatternRule;
//# sourceMappingURL=dom-queries-in-loops.d.ts.map