import { PatternRule, PatternMatcher, ASTNode, MatchContext } from '../types';
/**
 * Matcher for detecting DOM query operations inside loops
 */
export declare class DOMQueriesInLoopsMatcher implements PatternMatcher {
    private readonly domQueryMethods;
    private readonly domManipulationMethods;
    private readonly expensiveStyleMethods;
    match(node: ASTNode, context: MatchContext): boolean;
    getMatchDetails(node: ASTNode, _context: MatchContext): {
        complexity: number;
        impact: string;
        suggestion: string;
    };
    private isRelevantNode;
    private isInsideLoop;
    private isDOMQueryMethod;
    private isDOMManipulationMethod;
    private isExpensiveStyleMethod;
    private getMethodName;
    private getDOMOperationType;
    private estimateComplexity;
    private getSuggestion;
}
/**
 * DOM queries in loops pattern rule
 */
export declare const domQueriesInLoopsRule: PatternRule;
//# sourceMappingURL=dom-queries-in-loops.d.ts.map