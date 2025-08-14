import { PatternRule, PatternMatcher, ASTNode, MatchContext } from '../types';
/**
 * Detects direct state mutations in React components
 */
export declare class DirectStateMutationMatcher implements PatternMatcher {
    match(node: ASTNode, context: MatchContext): boolean;
    private isReactFile;
    private isStateVariable;
}
export declare const directStateMutationRule: PatternRule;
//# sourceMappingURL=direct-state-mutation.d.ts.map