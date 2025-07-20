import { ASTNode, AnalysisResult, AnalysisError, PatternMatch, SupportedLanguage, MatchContext } from '../types';
/**
 * Base analyzer interface for all language analyzers
 */
export interface IAnalyzer {
    /**
     * Language this analyzer supports
     */
    readonly language: SupportedLanguage;
    /**
     * Analyze source code and return pattern matches
     */
    analyze(sourceCode: string, filePath: string): Promise<AnalysisResult>;
    /**
     * Parse source code into AST
     */
    parseAST(sourceCode: string): Promise<ASTNode>;
    /**
     * Check if analyzer supports the given file
     */
    supports(filePath: string): boolean;
}
/**
 * Abstract base analyzer class with common functionality
 */
export declare abstract class BaseAnalyzer implements IAnalyzer {
    abstract readonly language: SupportedLanguage;
    protected abstract readonly fileExtensions: string[];
    /**
     * Analyze source code and return analysis result
     */
    analyze(sourceCode: string, filePath: string): Promise<AnalysisResult>;
    /**
     * Check if this analyzer supports the given file
     */
    supports(filePath: string): boolean;
    /**
     * Abstract method to parse source code into AST
     */
    abstract parseAST(sourceCode: string): Promise<ASTNode>;
    /**
     * Abstract method to detect patterns in AST
     */
    protected abstract detectPatterns(ast: ASTNode, context: MatchContext): Promise<PatternMatch[]>;
    /**
     * Get file extension from file path
     */
    protected getFileExtension(filePath: string): string;
    /**
     * Create empty analysis result
     */
    protected createEmptyResult(filePath: string, analysisTime: number): AnalysisResult;
    /**
     * Create analysis result
     */
    protected createAnalysisResult(filePath: string, matches: PatternMatch[], errors: AnalysisError[], analysisTime: number): AnalysisResult;
    /**
     * Create analysis error from exception
     */
    protected createAnalysisError(error: unknown): AnalysisError;
    /**
     * Get score calculator instance
     * Note: This should be injected in a real implementation
     */
    protected getScoreCalculator(): {
        calculateScore: (matches: PatternMatch[]) => {
            value: number;
            label: string;
            breakdown: {
                performance: number;
                security: number;
                maintainability: number;
                style: number;
                total: number;
            };
        };
    };
    /**
     * Helper method to create range from AST node
     */
    protected createRangeFromNode(node: ASTNode): any;
}
/**
 * Factory for creating analyzers
 */
export declare class AnalyzerFactory {
    private static analyzers;
    /**
     * Register an analyzer for a language
     */
    static register(language: SupportedLanguage, analyzer: IAnalyzer): void;
    /**
     * Get analyzer for a language
     */
    static getAnalyzer(language: SupportedLanguage): IAnalyzer | undefined;
    /**
     * Get analyzer for a file path
     */
    static getAnalyzerForFile(filePath: string): IAnalyzer | undefined;
    /**
     * Get all registered analyzers
     */
    static getAllAnalyzers(): IAnalyzer[];
}
//# sourceMappingURL=base.d.ts.map