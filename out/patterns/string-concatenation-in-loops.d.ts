import { PatternRule, PatternMatcher, ASTNode, MatchContext } from '../types';
/**
 * Matcher for detecting string concatenation inside loops
 */
export declare class StringConcatenationInLoopsMatcher implements PatternMatcher {
    match(node: ASTNode, context: MatchContext): boolean;
    getMatchDetails(node: ASTNode, _context: MatchContext): {
        complexity: number;
        impact: string;
        suggestion: string;
    };
    private isStringConcatenationAssignment;
    private isStringConcatenationExpression;
    private isLikelyStringOperation;
    private hasStringLiteral;
    private hasTemplateLiteral;
    private hasStringVariables;
    private hasStringMethods;
    private isInsideLoop;
    private getConcatenationType;
}
/**
 * String concatenation in loops pattern rule
 */
export declare const stringConcatenationInLoopsRule: PatternRule;
//# sourceMappingURL=string-concatenation-in-loops.d.ts.map