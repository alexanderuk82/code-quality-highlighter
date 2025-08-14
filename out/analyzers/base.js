"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyzerFactory = exports.BaseAnalyzer = void 0;
/**
 * Abstract base analyzer class with common functionality
 */
class BaseAnalyzer {
    /**
     * Analyze source code and return analysis result
     */
    async analyze(sourceCode, filePath) {
        const startTime = performance.now();
        const matches = [];
        const errors = [];
        try {
            // Validate input
            if (!this.supports(filePath)) {
                throw new Error(`File type not supported: ${filePath}`);
            }
            if (sourceCode.length === 0) {
                return this.createEmptyResult(filePath, performance.now() - startTime);
            }
            // Parse AST
            const ast = await this.parseAST(sourceCode);
            // Create analysis context
            const context = {
                filePath,
                language: this.language,
                lineNumber: 1,
                columnNumber: 1,
                sourceCode
            };
            // Detect patterns
            const detectedMatches = await this.detectPatterns(ast, context);
            matches.push(...detectedMatches);
        }
        catch (error) {
            errors.push(this.createAnalysisError(error));
        }
        const analysisTime = performance.now() - startTime;
        return this.createAnalysisResult(filePath, matches, errors, analysisTime);
    }
    /**
     * Check if this analyzer supports the given file
     */
    supports(filePath) {
        const extension = this.getFileExtension(filePath);
        return this.fileExtensions.includes(extension);
    }
    /**
     * Get file extension from file path
     */
    getFileExtension(filePath) {
        const parts = filePath.split('.');
        return parts.length > 1 ? `.${parts[parts.length - 1]}` : '';
    }
    /**
     * Create empty analysis result
     */
    createEmptyResult(filePath, analysisTime) {
        return {
            filePath,
            language: this.language,
            matches: [],
            score: {
                value: 100,
                label: 'No Code',
                breakdown: {
                    performance: 0,
                    security: 0,
                    maintainability: 0,
                    style: 0,
                    total: 0
                }
            },
            analysisTime,
            errors: []
        };
    }
    /**
     * Create analysis result
     */
    createAnalysisResult(filePath, matches, errors, analysisTime) {
        // Import score calculator here to avoid circular dependency
        const scoreCalculator = this.getScoreCalculator();
        const score = scoreCalculator.calculateScore(matches);
        return {
            filePath,
            language: this.language,
            matches,
            score,
            analysisTime,
            errors
        };
    }
    /**
     * Create analysis error from exception
     */
    createAnalysisError(error) {
        if (error instanceof Error) {
            const result = {
                type: 'runtime',
                message: error.message
            };
            if (error.stack) {
                result.stack = error.stack;
            }
            return result;
        }
        return {
            type: 'runtime',
            message: String(error)
        };
    }
    /**
     * Get score calculator instance
     */
    getScoreCalculator() {
        // Import here to avoid circular dependency
        const { scoreCalculator } = require('../scoring/calculator');
        return scoreCalculator;
    }
    /**
     * Helper method to create range from AST node
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    createRangeFromNode(node) {
        // This will be implemented with actual VS Code Range when we integrate
        if (node.loc) {
            return {
                start: { line: node.loc.start.line - 1, character: node.loc.start.column },
                end: { line: node.loc.end.line - 1, character: node.loc.end.column }
            };
        }
        return {
            start: { line: 0, character: 0 },
            end: { line: 0, character: 0 }
        };
    }
}
exports.BaseAnalyzer = BaseAnalyzer;
/**
 * Factory for creating analyzers
 */
class AnalyzerFactory {
    /**
     * Register an analyzer for a language
     */
    static register(language, analyzer) {
        this.analyzers.set(language, analyzer);
    }
    /**
     * Get analyzer for a language
     */
    static getAnalyzer(language) {
        return this.analyzers.get(language);
    }
    /**
     * Get analyzer for a file path
     */
    static getAnalyzerForFile(filePath) {
        for (const analyzer of this.analyzers.values()) {
            if (analyzer.supports(filePath)) {
                return analyzer;
            }
        }
        return undefined;
    }
    /**
     * Get all registered analyzers
     */
    static getAllAnalyzers() {
        return Array.from(this.analyzers.values());
    }
}
exports.AnalyzerFactory = AnalyzerFactory;
Object.defineProperty(AnalyzerFactory, "analyzers", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: new Map()
});
//# sourceMappingURL=base.js.map