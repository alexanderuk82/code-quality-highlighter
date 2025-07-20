import { PatternRule, PatternMatcher, ASTNode, MatchContext } from '../types';
/**
 * Matcher for detecting nested loops (O(n²) complexity)
 */
export declare class NestedLoopMatcher implements PatternMatcher {
    match(node: ASTNode, _context: MatchContext): boolean;
    getMatchDetails(node: ASTNode, _context: MatchContext): {
        complexity: number;
        impact: string;
        suggestion: string;
    };
    private isLoopStatement;
    private containsNestedLoop;
    private getLoopBody;
    private hasLoopInBody;
    private hasLoopAnywhere;
    private countNestedLoops;
}
/**
 * Nested loop pattern rule
 */
export declare const nestedLoopRule: PatternRule;
//# sourceMappingURL=nested-loops.d.ts.map