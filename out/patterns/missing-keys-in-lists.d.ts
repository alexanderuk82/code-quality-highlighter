import { PatternRule, PatternMatcher, ASTNode, MatchContext } from '../types';
/**
 * Detects array rendering in React without proper keys
 */
export declare class MissingKeysInListsMatcher implements PatternMatcher {
    match(node: ASTNode, context: MatchContext): boolean;
    private isReactFile;
    private returnsJSX;
    private getReturnedJSX;
    private hasKeyProp;
    private hasIndexAsKey;
}
export declare const missingKeysInListsRule: PatternRule;
//# sourceMappingURL=missing-keys-in-lists.d.ts.map