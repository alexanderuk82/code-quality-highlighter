import { Range } from 'vscode';
/**
 * Severity levels for pattern matches
 */
export type Severity = 'critical' | 'warning' | 'info' | 'good';
/**
 * Pattern categories for organization
 */
export declare enum PatternCategory {
    Performance = "performance",
    Security = "security",
    Maintainability = "maintainability",
    Style = "style"
}
/**
 * Supported programming languages
 */
export type SupportedLanguage = 'javascript' | 'typescript' | 'typescriptreact' | 'javascriptreact' | 'php';
/**
 * AST node types for pattern matching
 */
export interface ASTNode {
    type: string;
    start?: number;
    end?: number;
    loc?: {
        start: {
            line: number;
            column: number;
        };
        end: {
            line: number;
            column: number;
        };
    };
    [key: string]: any;
}
/**
 * Pattern match result
 */
export interface PatternMatch {
    ruleId: string;
    severity: Severity;
    category: PatternCategory;
    range: Range;
    node: ASTNode;
    context: MatchContext;
}
/**
 * Context information for pattern matches
 */
export interface MatchContext {
    filePath: string;
    language: SupportedLanguage;
    lineNumber: number;
    columnNumber: number;
    sourceCode: string;
    surroundingCode?: string;
}
/**
 * Pattern rule definition
 */
export interface PatternRule {
    id: string;
    name: string;
    description: string;
    category: PatternCategory;
    severity: Severity;
    languages: SupportedLanguage[];
    enabled: boolean;
    matcher: PatternMatcher;
    template: TooltipTemplate;
    scoreImpact: number;
}
/**
 * Pattern matcher interface
 */
export interface PatternMatcher {
    match(node: ASTNode, context: MatchContext): boolean;
    getMatchDetails?(node: ASTNode, context: MatchContext): MatchDetails;
}
/**
 * Additional details for pattern matches
 */
export interface MatchDetails {
    complexity?: number;
    impact?: string;
    suggestion?: string;
    examples?: CodeExample[];
}
/**
 * Code example for tooltips
 */
export interface CodeExample {
    title: string;
    before: string;
    after: string;
    improvement?: string;
}
/**
 * Tooltip template configuration
 */
export interface TooltipTemplate {
    title: string;
    problemDescription: string;
    impactDescription: string;
    solutionDescription: string;
    codeExamples: CodeExample[];
    actions: TooltipAction[];
    learnMoreUrl?: string;
}
/**
 * Tooltip action configuration
 */
export interface TooltipAction {
    label: string;
    type: 'copy' | 'apply' | 'explain' | 'configure';
    payload: string;
    command?: string;
}
/**
 * Analysis result for a file
 */
export interface AnalysisResult {
    filePath: string;
    language: SupportedLanguage;
    matches: PatternMatch[];
    score: QualityScore;
    analysisTime: number;
    errors: AnalysisError[];
}
/**
 * Quality score information
 */
export interface QualityScore {
    value: number;
    label: string;
    breakdown: ScoreBreakdown;
}
/**
 * Score breakdown by category
 */
export interface ScoreBreakdown {
    performance: number;
    security: number;
    maintainability: number;
    style: number;
    total: number;
}
/**
 * Analysis error information
 */
export interface AnalysisError {
    type: 'parse' | 'runtime' | 'timeout';
    message: string;
    stack?: string;
    line?: number;
    column?: number;
}
/**
 * Extension configuration
 */
export interface ExtensionConfig {
    enableAutoAnalysis: boolean;
    activeRulesets: PatternCategory[];
    strictMode: boolean;
    showGoodPatterns: boolean;
    maxFileSize: number;
    analysisDelay: number;
    customRules: PatternRule[];
}
/**
 * Ruleset configuration
 */
export interface Ruleset {
    id: string;
    name: string;
    description: string;
    category: PatternCategory;
    rules: string[];
    enabled: boolean;
}
/**
 * Quick fix action
 */
export interface QuickFix {
    title: string;
    description: string;
    range: Range;
    newText: string;
    command?: string;
}
/**
 * Decoration configuration for VS Code
 */
export interface DecorationConfig {
    severity: Severity;
    backgroundColor: string;
    borderColor: string;
    borderStyle: string;
    borderRadius: string;
    overviewRulerColor?: string;
    gutterIconPath?: string;
}
/**
 * Analysis performance metrics
 */
export interface AnalysisMetrics {
    fileSize: number;
    analysisTime: number;
    patternsDetected: number;
    memoryUsage: number;
    errorCount: number;
}
/**
 * Extension state
 */
export interface ExtensionState {
    isActive: boolean;
    analysisInProgress: boolean;
    lastAnalysisTime: Date;
    totalFilesAnalyzed: number;
    totalIssuesFound: number;
    averageScore: number;
}
//# sourceMappingURL=types.d.ts.map