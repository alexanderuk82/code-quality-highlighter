import { PatternRule, PatternMatcher, ASTNode, MatchContext } from '../types';
/**
 * Detects React functional components that could benefit from React.memo
 */
export declare class MissingReactMemoMatcher implements PatternMatcher {
    match(node: ASTNode, context: MatchContext): boolean;
    private isReactFile;
    private getFunctionName;
    private returnsJSX;
    private isWrappedInMemo;
    private isPureComponent;
    private hasHooks;
}
export declare const missingReactMemoRule: PatternRule;
//# sourceMappingURL=missing-react-memo.d.ts.map