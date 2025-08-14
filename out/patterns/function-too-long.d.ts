import { PatternRule, PatternMatcher, ASTNode, MatchContext } from '../types';
/**
 * Detects functions that are too long (>50 lines)
 */
export declare class FunctionTooLongMatcher implements PatternMatcher {
    private readonly WARNING_LINES;
    match(node: ASTNode, _context: MatchContext): boolean;
    private isFunctionNode;
    private calculateFunctionLines;
    getMatchDetails(node: ASTNode, _context: MatchContext): {
        complexity: number;
        impact: string;
        suggestion: string;
    };
}
export declare const functionTooLongRule: PatternRule;
//# sourceMappingURL=function-too-long.d.ts.map