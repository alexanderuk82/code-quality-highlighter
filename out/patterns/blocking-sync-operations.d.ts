import { PatternRule, PatternMatcher, ASTNode, MatchContext } from '../types';
/**
 * Matcher for detecting blocking synchronous operations
 */
export declare class BlockingSyncOperationsMatcher implements PatternMatcher {
    private readonly blockingOperations;
    match(node: ASTNode, _context: MatchContext): boolean;
    getMatchDetails(node: ASTNode, _context: MatchContext): {
        complexity: number;
        impact: string;
        suggestion: string;
    };
    private isDirectSyncCall;
    private isFsSyncCall;
    private isChildProcessSyncCall;
    private isCryptoSyncCall;
    private getOperationName;
    private estimateBlockingTime;
}
/**
 * Blocking sync operations pattern rule
 */
export declare const blockingSyncOperationsRule: PatternRule;
//# sourceMappingURL=blocking-sync-operations.d.ts.map