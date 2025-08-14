import {
  PatternRule,
  PatternMatch,
  AnyASTNode,
  MatchContext,
  SupportedLanguage,
  PatternCategory,
  Severity
} from '../types';

/**
 * Core pattern detection engine
 */
export class PatternEngine {
  private rules: Map<string, PatternRule> = new Map();
  private rulesByLanguage: Map<SupportedLanguage, PatternRule[]> = new Map();
  private rulesByCategory: Map<PatternCategory, PatternRule[]> = new Map();

  /**
   * Register a pattern rule
   */
  public registerRule(rule: PatternRule): void {
    this.rules.set(rule.id, rule);
    this.indexRuleByLanguage(rule);
    this.indexRuleByCategory(rule);
  }

  /**
   * Register multiple pattern rules
   */
  public registerRules(rules: PatternRule[]): void {
    rules.forEach(rule => this.registerRule(rule));
  }

  /**
   * Get a rule by ID
   */
  public getRule(ruleId: string): PatternRule | undefined {
    return this.rules.get(ruleId);
  }

  /**
   * Get all rules for a specific language
   */
  public getRulesForLanguage(language: SupportedLanguage): PatternRule[] {
    return this.rulesByLanguage.get(language) || [];
  }

  /**
   * Get all rules for a specific category
   */
  public getRulesForCategory(category: PatternCategory): PatternRule[] {
    return this.rulesByCategory.get(category) || [];
  }

  /**
   * Get all enabled rules
   */
  public getEnabledRules(): PatternRule[] {
    return Array.from(this.rules.values()).filter(rule => rule.enabled);
  }

  /**
   * Detect patterns in AST for a specific language
   */
  public async detectPatterns(
    ast: AnyASTNode,
    context: MatchContext,
    enabledCategories?: PatternCategory[]
  ): Promise<PatternMatch[]> {
    const matches: PatternMatch[] = [];
    const applicableRules = this.getApplicableRules(context.language, enabledCategories);

    for (const rule of applicableRules) {
      try {
        const ruleMatches = await this.applyRule(rule, ast, context);
        matches.push(...ruleMatches);
      } catch (error) {
        // Error applying rule
      }
    }

    return matches;
  }

  /**
   * Apply a single rule to AST
   */
  private async applyRule(
    rule: PatternRule,
    ast: AnyASTNode,
    context: MatchContext
  ): Promise<PatternMatch[]> {
    const matches: PatternMatch[] = [];

    // Traverse AST and apply rule matcher
    this.traverseAST(ast, (node) => {
      try {
        if (rule.matcher.match(node, context)) {
          const match: PatternMatch = {
            ruleId: rule.id,
            severity: rule.severity,
            category: rule.category,
            range: this.createRange(node),
            node,
            context: {
              ...context,
              lineNumber: node.loc?.start.line || 1,
              columnNumber: node.loc?.start.column || 1
            }
          };
          matches.push(match);
        }
      } catch (error) {
        // Skip individual node errors to avoid breaking entire analysis
      }
    });

    return matches;
  }

  /**
   * Get applicable rules for language and categories
   */
  private getApplicableRules(
    language: SupportedLanguage,
    enabledCategories?: PatternCategory[]
  ): PatternRule[] {
    const languageRules = this.getRulesForLanguage(language);

    if (!enabledCategories || enabledCategories.length === 0) {
      return languageRules.filter(rule => rule.enabled);
    }

    return languageRules.filter(rule =>
      rule.enabled && enabledCategories.includes(rule.category)
    );
  }

  /**
   * Index rule by language for faster lookup
   */
  private indexRuleByLanguage(rule: PatternRule): void {
    rule.languages.forEach(language => {
      const existing = this.rulesByLanguage.get(language) || [];
      existing.push(rule);
      this.rulesByLanguage.set(language, existing);
    });
  }

  /**
   * Index rule by category for faster lookup
   */
  private indexRuleByCategory(rule: PatternRule): void {
    const existing = this.rulesByCategory.get(rule.category) || [];
    existing.push(rule);
    this.rulesByCategory.set(rule.category, existing);
  }

  /**
   * Traverse AST and apply visitor function
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private traverseAST(node: any, visitor: (node: any) => void): void {
    if (!node || typeof node !== 'object') {
      return;
    }

    visitor(node);

    // Traverse all child nodes
    Object.values(node).forEach(value => {
      if (Array.isArray(value)) {
        value.forEach(item => {
          if (item && typeof item === 'object' && item.type) {
            this.traverseAST(item, visitor);
          }
        });
      } else if (value && typeof value === 'object' && (value as any).type) {
        this.traverseAST(value, visitor);
      }
    });
  }

  /**
   * Create range from AST node
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private createRange(node: any): any {
    // This will be replaced with actual VS Code Range when integrating
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

  /**
   * Enable or disable a rule
   */
  public setRuleEnabled(ruleId: string, enabled: boolean): boolean {
    const rule = this.rules.get(ruleId);
    if (rule) {
      rule.enabled = enabled;
      return true;
    }
    return false;
  }

  /**
   * Enable or disable rules by category
   */
  public setCategoryEnabled(category: PatternCategory, enabled: boolean): void {
    const rules = this.getRulesForCategory(category);
    rules.forEach(rule => {
      rule.enabled = enabled;
    });
  }

  /**
   * Get statistics about registered rules
   */
  public getStatistics() {
    const total = this.rules.size;
    const enabled = this.getEnabledRules().length;
    const byLanguage: Record<string, number> = {};
    const bySeverity: Record<Severity, number> = {
      critical: 0,
      warning: 0,
      info: 0,
      good: 0
    };
    const byCategory: Record<string, number> = {};

    this.rules.forEach(rule => {
      // Count by severity
      bySeverity[rule.severity]++;

      // Count by category
      byCategory[rule.category] = (byCategory[rule.category] || 0) + 1;

      // Count by language
      rule.languages.forEach(lang => {
        byLanguage[lang] = (byLanguage[lang] || 0) + 1;
      });
    });

    return {
      total,
      enabled,
      byLanguage,
      bySeverity,
      byCategory
    };
  }

  /**
   * Clear all rules
   */
  public clear(): void {
    this.rules.clear();
    this.rulesByLanguage.clear();
    this.rulesByCategory.clear();
  }
}

/**
 * Singleton pattern engine instance
 */
export const patternEngine = new PatternEngine();
