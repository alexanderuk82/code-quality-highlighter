import { AnyASTNode, PatternMatcher, MatchContext, MatchDetails, TooltipTemplate, PatternRule } from '../types';
/**
 * Detects inefficient repeated object property access within loops
 *
 * Problematic patterns:
 * - Repeated obj.prop access in loops
 * - Deep property access like obj.a.b.c in loops
 * - Method calls on same object repeatedly
 *
 * Performance impact: Eliminates redundant property resolution
 */
export declare class InefficientObjectAccessMatcher implements PatternMatcher {
    match(node: AnyASTNode, context: MatchContext): boolean;
    getMatchDetails(node: AnyASTNode, _context: MatchContext): MatchDetails;
    private isRelevantNode;
    private isInsideLoop;
    private isDirectlyInLoop;
    private isRepeatedPropertyAccess;
    private isDeepPropertyAccess;
    private isRepeatedMethodCall;
    private getPropertyPath;
    private getMethodPath;
    private getPropertyDepth;
    private countPropertyAccessInLoop;
    private countMethodCallInLoop;
    private getAccessType;
    private calculateComplexity;
    private getSuggestion;
}
/**
 * Tooltip template for inefficient object access
 */
declare const inefficientObjectAccessTemplate: TooltipTemplate;
/**
 * Inefficient object access pattern rule
 */
export declare const inefficientObjectAccessRule: PatternRule;
export { inefficientObjectAccessTemplate };
//# sourceMappingURL=inefficient-object-access.d.ts.map