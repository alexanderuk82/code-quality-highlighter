import { PatternRule, PatternMatcher, ASTNode, MatchContext } from '../types';
/**
 * Detects inline arrow functions in JSX props (React performance issue)
 */
export declare class InlineFunctionPropsMatcher implements PatternMatcher {
    match(node: ASTNode, context: MatchContext): boolean;
    getMatchDetails(_node: ASTNode, _context: MatchContext): {
        readonly impact: "Inline functions create a new reference every render and can break memoization of children.";
        readonly suggestion: "Wrap the handler with useCallback or move it outside the render path to keep a stable reference.";
        readonly fix: {
            readonly type: "copy";
            readonly title: "useCallback handler template";
            readonly text: "// In the component body\nconst handleClick = React.useCallback((...args) => {\n  // logic here\n}, []);\n\n// In JSX\n<Button onClick={handleClick}>Click</Button>";
        };
    };
    private isReactFile;
    private isSimpleReference;
    private hasNestedCalls;
}
export declare const inlineFunctionPropsRule: PatternRule;
//# sourceMappingURL=inline-function-props.d.ts.map