import { PatternRule, PatternMatcher, ASTNode, MatchContext } from '../types';
/**
 * Matcher for detecting potential memory leaks
 */
export declare class MemoryLeaksMatcher implements PatternMatcher {
    private readonly eventMethods;
    private readonly _cleanupMethods;
    private readonly timerMethods;
    private readonly _cleanupTimerMethods;
    match(node: ASTNode, context: MatchContext): boolean;
    getMatchDetails(node: ASTNode, context: MatchContext): {
        complexity: number;
        impact: string;
        suggestion: string;
    };
    private isEventListenerWithoutCleanup;
    private isTimerWithoutCleanup;
    private isDOMReferenceInClosure;
    private isCircularReference;
    private getMethodName;
    private isInComponentOrFunction;
    private hasCorrespondingCleanup;
    private isTimerResultStored;
    private hasCorrespondingTimerCleanup;
    private isDOMQuery;
    private isInClosure;
    private isPropertyAssignment;
    private mightCreateCircularReference;
    private getParentNode;
    private getLeakType;
    private getSuggestion;
}
/**
 * Memory leaks pattern rule
 */
export declare const memoryLeaksRule: PatternRule;
//# sourceMappingURL=memory-leaks.d.ts.map