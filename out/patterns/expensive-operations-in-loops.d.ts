import { PatternRule, PatternMatcher, AnyASTNode, MatchContext } from '../types';
/**
 * Matcher for detecting expensive operations inside loops
 */
export declare class ExpensiveOperationsInLoopsMatcher implements PatternMatcher {
    private readonly expensiveArrayMethods;
    private readonly expensiveDOMMethods;
    private readonly expensiveObjectOperations;
    match(node: AnyASTNode, context: MatchContext): boolean;
    getMatchDetails(node: AnyASTNode, _context: MatchContext): {
        complexity: number;
        impact: string;
        suggestion: string;
    };
    private isInsideLoop;
    private isExpensiveArrayMethod;
    private isExpensiveDOMOperation;
    private isExpensiveObjectOperation;
    private isRepeatedFunctionCall;
    private getOperationType;
    private getMethodName;
    private estimateComplexity;
    private getSuggestion;
}
/**
 * Expensive operations in loops pattern rule
 */
export declare const expensiveOperationsInLoopsRule: PatternRule;
//# sourceMappingURL=expensive-operations-in-loops.d.ts.map