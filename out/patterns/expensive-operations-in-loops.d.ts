import { PatternRule, PatternMatcher, ASTNode, MatchContext } from '../types';
/**
 * Matcher for detecting expensive operations inside loops
 */
export declare class ExpensiveOperationsInLoopsMatcher implements PatternMatcher {
    private readonly expensiveArrayMethods;
    private readonly expensiveDOMMethods;
    private readonly _expensiveObjectOperations;
    match(node: ASTNode, context: MatchContext): boolean;
    getMatchDetails(node: ASTNode, _context: MatchContext): {
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