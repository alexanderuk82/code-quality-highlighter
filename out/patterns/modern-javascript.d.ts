import { PatternRule, PatternMatcher, ASTNode, MatchContext } from '../types';
/**
 * Detects good ES6+ practices like const/let usage, arrow functions, template literals
 */
export declare class ModernJavaScriptMatcher implements PatternMatcher {
    match(node: ASTNode, _context: MatchContext): boolean;
    private isTooComplex;
    getMatchDetails(node: ASTNode, _context: MatchContext): {
        impact: string;
        suggestion: string;
    };
}
export declare const modernJavaScriptRule: PatternRule;
//# sourceMappingURL=modern-javascript.d.ts.map