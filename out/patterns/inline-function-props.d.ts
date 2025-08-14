import { PatternRule, PatternMatcher, ASTNode, MatchContext } from '../types';
/**
 * Detects inline arrow functions in JSX props (React performance issue)
 */
export declare class InlineFunctionPropsMatcher implements PatternMatcher {
    match(node: ASTNode, context: MatchContext): boolean;
    private isReactFile;
    private isSimpleReference;
    private hasNestedCalls;
}
export declare const inlineFunctionPropsRule: PatternRule;
//# sourceMappingURL=inline-function-props.d.ts.map