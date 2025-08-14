import { PatternRule, PatternMatcher, ASTNode, MatchContext } from '../types';
/**
 * Detects multiple chained array iterations that could be combined
 */
export declare class MultipleArrayIterationsMatcher implements PatternMatcher {
    private readonly chainableMethods;
    match(node: ASTNode, _context: MatchContext): boolean;
    getMatchDetails(node: ASTNode, _context: MatchContext): {
        complexity: number;
        impact: string;
        suggestion: string;
    };
    private countChainLength;
}
export declare const multipleArrayIterationsRule: PatternRule;
//# sourceMappingURL=multiple-array-iterations.d.ts.map