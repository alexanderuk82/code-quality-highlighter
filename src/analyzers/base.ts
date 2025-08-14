import {
  AnyASTNode,
  AnalysisResult,
  AnalysisError,
  PatternMatch,
  SupportedLanguage,
  MatchContext
} from '../types';

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
  parseAST(sourceCode: string): Promise<AnyASTNode>;

  /**
   * Check if analyzer supports the given file
   */
  supports(filePath: string): boolean;
}

/**
 * Abstract base analyzer class with common functionality
 */
export abstract class BaseAnalyzer implements IAnalyzer {
  public abstract readonly language: SupportedLanguage;
  protected abstract readonly fileExtensions: string[];

  /**
   * Analyze source code and return analysis result
   */
  public async analyze(sourceCode: string, filePath: string): Promise<AnalysisResult> {
    const startTime = performance.now();
    const matches: PatternMatch[] = [];
    const errors: AnalysisError[] = [];

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
      const context: MatchContext = {
        filePath,
        language: this.language,
        lineNumber: 1,
        columnNumber: 1,
        sourceCode
      };

      // Detect patterns
      const detectedMatches = await this.detectPatterns(ast, context);
      matches.push(...detectedMatches);

    } catch (error) {
      errors.push(this.createAnalysisError(error));
    }

    const analysisTime = performance.now() - startTime;

    return this.createAnalysisResult(filePath, matches, errors, analysisTime);
  }

  /**
   * Check if this analyzer supports the given file
   */
  public supports(filePath: string): boolean {
    const extension = this.getFileExtension(filePath);
    return this.fileExtensions.includes(extension);
  }

  /**
   * Abstract method to parse source code into AST
   */
  public abstract parseAST(sourceCode: string): Promise<AnyASTNode>;

  /**
   * Abstract method to detect patterns in AST
   */
  protected abstract detectPatterns(ast: AnyASTNode, context: MatchContext): Promise<PatternMatch[]>;

  /**
   * Get file extension from file path
   */
  protected getFileExtension(filePath: string): string {
    const parts = filePath.split('.');
    return parts.length > 1 ? `.${parts[parts.length - 1]}` : '';
  }

  /**
   * Create empty analysis result
   */
  protected createEmptyResult(filePath: string, analysisTime: number): AnalysisResult {
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
  protected createAnalysisResult(
    filePath: string,
    matches: PatternMatch[],
    errors: AnalysisError[],
    analysisTime: number
  ): AnalysisResult {
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
  protected createAnalysisError(error: unknown): AnalysisError {
    if (error instanceof Error) {
      const result: AnalysisError = {
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
   * Note: This should be injected in a real implementation
   */
  protected getScoreCalculator() {
    // This is a placeholder - in the real implementation,
    // this should be injected via dependency injection
    return {
      calculateScore: (matches: PatternMatch[]) => ({
        value: Math.max(0, 100 - (matches.length * 5)),
        label: 'Calculated',
        breakdown: {
          performance: 25,
          security: 25,
          maintainability: 25,
          style: 25,
          total: 100
        }
      })
    };
  }

  /**
   * Helper method to create range from AST node
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected createRangeFromNode(node: AnyASTNode): any {
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

/**
 * Factory for creating analyzers
 */
export class AnalyzerFactory {
  private static analyzers: Map<SupportedLanguage, IAnalyzer> = new Map();

  /**
   * Register an analyzer for a language
   */
  public static register(language: SupportedLanguage, analyzer: IAnalyzer): void {
    this.analyzers.set(language, analyzer);
  }

  /**
   * Get analyzer for a language
   */
  public static getAnalyzer(language: SupportedLanguage): IAnalyzer | undefined {
    return this.analyzers.get(language);
  }

  /**
   * Get analyzer for a file path
   */
  public static getAnalyzerForFile(filePath: string): IAnalyzer | undefined {
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
  public static getAllAnalyzers(): IAnalyzer[] {
    return Array.from(this.analyzers.values());
  }
}
