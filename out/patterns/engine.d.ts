import { PatternRule, PatternMatch, ASTNode, MatchContext, SupportedLanguage, PatternCategory, Severity } from '../types';
/**
 * Core pattern detection engine
 */
export declare class PatternEngine {
    private rules;
    private rulesByLanguage;
    private rulesByCategory;
    /**
     * Register a pattern rule
     */
    registerRule(rule: PatternRule): void;
    /**
     * Register multiple pattern rules
     */
    registerRules(rules: PatternRule[]): void;
    /**
     * Get a rule by ID
     */
    getRule(ruleId: string): PatternRule | undefined;
    /**
     * Get all rules for a specific language
     */
    getRulesForLanguage(language: SupportedLanguage): PatternRule[];
    /**
     * Get all rules for a specific category
     */
    getRulesForCategory(category: PatternCategory): PatternRule[];
    /**
     * Get all enabled rules
     */
    getEnabledRules(): PatternRule[];
    /**
     * Detect patterns in AST for a specific language
     */
    detectPatterns(ast: ASTNode, context: MatchContext, enabledCategories?: PatternCategory[]): Promise<PatternMatch[]>;
    /**
     * Apply a single rule to AST
     */
    private applyRule;
    /**
     * Get applicable rules for language and categories
     */
    private getApplicableRules;
    /**
     * Index rule by language for faster lookup
     */
    private indexRuleByLanguage;
    /**
     * Index rule by category for faster lookup
     */
    private indexRuleByCategory;
    /**
     * Traverse AST and apply visitor function
     */
    private traverseAST;
    /**
     * Create range from AST node
     */
    private createRange;
    /**
     * Enable or disable a rule
     */
    setRuleEnabled(ruleId: string, enabled: boolean): boolean;
    /**
     * Enable or disable rules by category
     */
    setCategoryEnabled(category: PatternCategory, enabled: boolean): void;
    /**
     * Get statistics about registered rules
     */
    getStatistics(): {
        total: number;
        enabled: number;
        byLanguage: Record<string, number>;
        bySeverity: Record<Severity, number>;
        byCategory: Record<string, number>;
    };
    /**
     * Clear all rules
     */
    clear(): void;
}
/**
 * Singleton pattern engine instance
 */
export declare const patternEngine: PatternEngine;
//# sourceMappingURL=engine.d.ts.map