import { parse, ParserPlugin } from '@babel/parser';
import traverse from '@babel/traverse';
import { BaseAnalyzer } from './base';
import { AnyASTNode, PatternMatch, MatchContext, SupportedLanguage, PatternCategory } from '../types';
import { patternEngine } from '../patterns/engine';

/**
 * JavaScript/TypeScript analyzer using Babel parser
 */
export class JavaScriptAnalyzer extends BaseAnalyzer {
  public readonly language: SupportedLanguage = 'javascript';
  protected readonly fileExtensions = ['.js', '.jsx', '.ts', '.tsx'];

  /**
   * Parse JavaScript/TypeScript source code into AST
   */
  public async parseAST(sourceCode: string): Promise<AnyASTNode> {
    try {
      // Determine if this is TypeScript based on syntax
      const isTypeScript = this.containsTypeScriptSyntax(sourceCode);

      const plugins: ParserPlugin[] = [
        'jsx',
        'asyncGenerators',
        'bigInt',
        'classProperties',
        'decorators-legacy',
        'doExpressions',
        'dynamicImport',
        'exportDefaultFrom',
        'exportNamespaceFrom',
        'functionBind',
        'functionSent',
        'importMeta',
        'nullishCoalescingOperator',
        'numericSeparator',
        'objectRestSpread',
        'optionalCatchBinding',
        'optionalChaining',
        'throwExpressions',
        'topLevelAwait'
      ];

      if (isTypeScript) {
        plugins.push('typescript');
      }

      const ast = parse(sourceCode, {
        sourceType: 'module',
        allowImportExportEverywhere: true,
        allowReturnOutsideFunction: true,
        plugins
      });

      return ast as AnyASTNode;
    } catch (error) {
      throw new Error(`Failed to parse JavaScript/TypeScript: ${error}`);
    }
  }

  /**
   * Detect patterns in JavaScript/TypeScript AST
   */
  protected override async detectPatterns(ast: AnyASTNode, context: MatchContext): Promise<PatternMatch[]> {
    const matches: PatternMatch[] = [];

    try {
      // Use pattern engine to detect all registered patterns
      const detectedMatches = await patternEngine.detectPatterns(ast, context);
      matches.push(...detectedMatches);

      // Add language-specific pattern detection
      await this.detectJavaScriptSpecificPatterns(ast, context, matches);

    } catch (error) {
      // Error in JavaScript pattern detection
    }

    return matches;
  }

  /**
   * Detect JavaScript-specific patterns using Babel traverse
   */
  private async detectJavaScriptSpecificPatterns(
    ast: AnyASTNode,
    context: MatchContext,
    matches: PatternMatch[]
  ): Promise<void> {
    // Use Babel traverse for more sophisticated AST traversal
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    traverse(ast as any, {
      // Detect blocking synchronous operations
      CallExpression: (path: any) => {
        this.checkBlockingOperations(path, context, matches);
        this.checkExpensiveOperationsInLoops(path, context, matches);
        this.checkEvalUsage(path, context, matches);
      },

      // Detect console.log in production
      MemberExpression: (path: any) => {
        this.checkConsoleUsage(path, context, matches);
      },

      // Detect magic numbers
      NumericLiteral: (path: any) => {
        this.checkMagicNumbers(path, context, matches);
      },

      // Detect functions that are too long
      FunctionDeclaration: (path: any) => {
        this.checkFunctionLength(path, context, matches);
      },

      ArrowFunctionExpression: (path: any) => {
        this.checkFunctionLength(path, context, matches);
      },

      FunctionExpression: (path: any) => {
        this.checkFunctionLength(path, context, matches);
      },

      // Detect unused variables
      VariableDeclarator: (path: any) => {
        this.checkUnusedVariables(path, context, matches);
      },

      // Detect == instead of ===
      BinaryExpression: (path: any) => {
        this.checkLooseEquality(path, context, matches);
      }
    });
  }

  /**
   * Check for blocking synchronous operations
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private checkBlockingOperations(path: any, context: MatchContext, matches: PatternMatch[]): void {
    const node = path.node;

    if (node.callee && node.callee.type === 'MemberExpression') {
      const property = node.callee.property;
      if (property && property.name && property.name.endsWith('Sync')) {
        matches.push({
          ruleId: 'blocking-sync-operations',
          severity: 'critical',
          category: PatternCategory.Performance,
          range: this.createRangeFromNode(node),
          node,
          context
        });
      }
    }
  }

  /**
   * Check for expensive operations in loops
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private checkExpensiveOperationsInLoops(path: any, context: MatchContext, matches: PatternMatch[]): void {
    const node = path.node;

    // Check if we're inside a loop
    if (this.isInsideLoop(path)) {
      // Check for array.find, array.indexOf, etc.
      if (node.callee && node.callee.type === 'MemberExpression') {
        const property = node.callee.property;
        const expensiveMethods = ['find', 'indexOf', 'includes', 'filter', 'map'];

        if (property && expensiveMethods.includes(property.name)) {
          matches.push({
            ruleId: 'expensive-operations-in-loops',
            severity: 'critical',
            category: PatternCategory.Performance,
            range: this.createRangeFromNode(node),
            node,
            context
          });
        }
      }
    }
  }

  /**
   * Check for eval usage
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private checkEvalUsage(path: any, context: MatchContext, matches: PatternMatch[]): void {
    const node = path.node;

    if (node.callee && node.callee.name === 'eval') {
      matches.push({
        ruleId: 'eval-usage',
        severity: 'critical',
        category: PatternCategory.Security,
        range: this.createRangeFromNode(node),
        node,
        context
      });
    }
  }

  /**
   * Check for console usage
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private checkConsoleUsage(path: any, context: MatchContext, matches: PatternMatch[]): void {
    const node = path.node;

    if (node.object && node.object.name === 'console') {
      matches.push({
        ruleId: 'console-usage',
        severity: 'warning',
        category: PatternCategory.Maintainability,
        range: this.createRangeFromNode(node),
        node,
        context
      });
    }
  }

  /**
   * Check for magic numbers
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private checkMagicNumbers(path: any, context: MatchContext, matches: PatternMatch[]): void {
    const node = path.node;
    const value = node.value;

    // Allow common numbers
    if (value === 0 || value === 1 || value === -1) {
      return;
    }

    // Check if it's in a meaningful context (array index, etc.)
    if (this.isInMeaningfulContext(path)) {
      return;
    }

    matches.push({
      ruleId: 'magic-numbers',
      severity: 'info',
      category: PatternCategory.Maintainability,
      range: this.createRangeFromNode(node),
      node,
      context
    });
  }

  /**
   * Check function length
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private checkFunctionLength(path: any, context: MatchContext, matches: PatternMatch[]): void {
    const node = path.node;
    const body = node.body;

    if (body && body.body) {
      const lineCount = this.countLines(body);
      if (lineCount > 50) {
        matches.push({
          ruleId: 'function-too-long',
          severity: 'warning',
          category: PatternCategory.Maintainability,
          range: this.createRangeFromNode(node),
          node,
          context
        });
      }
    }
  }

  /**
   * Check for unused variables
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private checkUnusedVariables(path: any, context: MatchContext, matches: PatternMatch[]): void {
    const node = path.node;
    const binding = path.scope.getBinding(node.id.name);

    if (binding && !binding.referenced) {
      matches.push({
        ruleId: 'unused-variables',
        severity: 'warning',
        category: PatternCategory.Maintainability,
        range: this.createRangeFromNode(node),
        node,
        context
      });
    }
  }

  /**
   * Check for loose equality (== instead of ===)
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private checkLooseEquality(path: any, context: MatchContext, matches: PatternMatch[]): void {
    const node = path.node;

    if (node.operator === '==' || node.operator === '!=') {
      matches.push({
        ruleId: 'loose-equality',
        severity: 'warning',
        category: PatternCategory.Maintainability,
        range: this.createRangeFromNode(node),
        node,
        context
      });
    }
  }

  /**
   * Helper: Check if path is inside a loop
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private isInsideLoop(path: any): boolean {
    let parent = path.parent;
    while (parent) {
      if (this.isLoopNode(parent)) {
        return true;
      }
      parent = parent.parent;
    }
    return false;
  }

  /**
   * Helper: Check if node is a loop
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private isLoopNode(node: any): boolean {
    return [
      'ForStatement',
      'WhileStatement',
      'DoWhileStatement',
      'ForInStatement',
      'ForOfStatement'
    ].includes(node.type);
  }

  /**
   * Helper: Check if numeric literal is in meaningful context
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private isInMeaningfulContext(path: any): boolean {
    const parent = path.parent;
    if (!parent) return false;

    // Array index access
    if (parent.type === 'MemberExpression' && parent.computed) {
      return true;
    }

    // Function parameters with default values
    if (parent.type === 'AssignmentPattern') {
      return true;
    }

    // Object property keys
    if (parent.type === 'Property' && parent.key === path.node) {
      return true;
    }

    return false;
  }

  /**
   * Helper: Count lines in AST node
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private countLines(node: any): number {
    if (!node.loc) return 0;
    return node.loc.end.line - node.loc.start.line + 1;
  }

  /**
   * Helper: Detect TypeScript syntax
   */
  private containsTypeScriptSyntax(sourceCode: string): boolean {
    // Simple heuristics to detect TypeScript
    const typeScriptPatterns = [
      /:\s*(string|number|boolean|object|any|void|never)/,
      /interface\s+\w+/,
      /type\s+\w+\s*=/,
      /as\s+\w+/,
      /<\w+>/,
      /public\s+|private\s+|protected\s+/,
      /readonly\s+/,
      /namespace\s+/,
      /declare\s+/
    ];

    return typeScriptPatterns.some(pattern => pattern.test(sourceCode));
  }

  /**
   * Override supports method to handle TypeScript files
   */
  public override supports(filePath: string): boolean {
    const extension = this.getFileExtension(filePath);
    return this.fileExtensions.includes(extension);
  }
}

/**
 * TypeScript-specific analyzer that extends JavaScript analyzer
 */
export class TypeScriptAnalyzer extends JavaScriptAnalyzer {
  public override readonly language: SupportedLanguage = 'typescript';
  protected override readonly fileExtensions = ['.ts', '.tsx'];

  /**
   * Detect TypeScript-specific patterns
   */
  protected override async detectPatterns(ast: AnyASTNode, context: MatchContext): Promise<PatternMatch[]> {
    // Get base JavaScript patterns
    const matches = await super.detectPatterns(ast, context);

    // Add TypeScript-specific pattern detection
    await this.detectTypeScriptSpecificPatterns(ast, context, matches);

    return matches;
  }

  /**
   * Detect TypeScript-specific patterns
   */
  private async detectTypeScriptSpecificPatterns(
    ast: AnyASTNode,
    context: MatchContext,
    matches: PatternMatch[]
  ): Promise<void> {
    traverse(ast as any, {
      // Detect missing type annotations
      FunctionDeclaration: (path: any) => {
        this.checkMissingTypeAnnotations(path, context, matches);
      },

      ArrowFunctionExpression: (path: any) => {
        this.checkMissingTypeAnnotations(path, context, matches);
      },

      // Detect any type usage
      TSAnyKeyword: (path: any) => {
        this.checkAnyTypeUsage(path, context, matches);
      },

      // Detect non-null assertions
      TSNonNullExpression: (path: any) => {
        this.checkNonNullAssertion(path, context, matches);
      }
    });
  }

  /**
   * Check for missing type annotations
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private checkMissingTypeAnnotations(path: any, context: MatchContext, matches: PatternMatch[]): void {
    const node = path.node;

    // Check return type annotation
    if (!node.returnType) {
      matches.push({
      ruleId: 'missing-return-type',
      severity: 'info',
      category: PatternCategory.Maintainability,
      range: this.createRangeFromNode(node),
      node,
      context
      });
    }

    // Check parameter type annotations
    if (node.params) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      node.params.forEach((param: any) => {
        if (!param.typeAnnotation) {
          matches.push({
            ruleId: 'missing-parameter-type',
            severity: 'info',
            category: PatternCategory.Maintainability,
            range: this.createRangeFromNode(param),
            node: param,
            context
          });
        }
      });
    }
  }

  /**
   * Check for any type usage
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private checkAnyTypeUsage(path: any, context: MatchContext, matches: PatternMatch[]): void {
    const node = path.node;

    matches.push({
      ruleId: 'any-type-usage',
      severity: 'warning',
      category: PatternCategory.Maintainability,
      range: this.createRangeFromNode(node),
      node,
      context
    });
  }

  /**
   * Check for non-null assertions
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private checkNonNullAssertion(path: any, context: MatchContext, matches: PatternMatch[]): void {
    const node = path.node;

    matches.push({
      ruleId: 'non-null-assertion',
      severity: 'warning',
      category: PatternCategory.Maintainability,
      range: this.createRangeFromNode(node),
      node,
      context
    });
  }
}
