import { PatternRule, PatternMatcher, ASTNode, MatchContext } from '../types';
/**
 * Detects useEffect hooks with missing or incorrect dependencies
 */
export declare class MissingDependenciesMatcher implements PatternMatcher {
    match(node: ASTNode, context: MatchContext): boolean;
    private isReactFile;
    private extractUsedVariables;
    private isExternalVariable;
}
export declare const missingDependenciesRule: PatternRule;
//# sourceMappingURL=missing-dependencies.d.ts.map