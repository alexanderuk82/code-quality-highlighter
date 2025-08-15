"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.patternEngine = exports.PatternEngine = void 0;
/**
 * Core pattern detection engine
 */
class PatternEngine {
    constructor() {
        Object.defineProperty(this, "rules", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map()
        });
        Object.defineProperty(this, "rulesByLanguage", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map()
        });
        Object.defineProperty(this, "rulesByCategory", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map()
        });
    }
    /**
     * Register a pattern rule
     */
    registerRule(rule) {
        this.rules.set(rule.id, rule);
        this.indexRuleByLanguage(rule);
        this.indexRuleByCategory(rule);
    }
    /**
     * Register multiple pattern rules
     */
    registerRules(rules) {
        rules.forEach(rule => this.registerRule(rule));
    }
    /**
     * Get a rule by ID
     */
    getRule(ruleId) {
        return this.rules.get(ruleId);
    }
    /**
     * Get all rules for a specific language
     */
    getRulesForLanguage(language) {
        return this.rulesByLanguage.get(language) || [];
    }
    /**
     * Get all rules for a specific category
     */
    getRulesForCategory(category) {
        return this.rulesByCategory.get(category) || [];
    }
    /**
     * Get all enabled rules
     */
    getEnabledRules() {
        return Array.from(this.rules.values()).filter(rule => rule.enabled);
    }
    /**
     * Detect patterns in AST for a specific language
     */
    async detectPatterns(ast, context, enabledCategories) {
        const matches = [];
        const applicableRules = this.getApplicableRules(context.language, enabledCategories);
        for (const rule of applicableRules) {
            try {
                const ruleMatches = await this.applyRule(rule, ast, context);
                matches.push(...ruleMatches);
            }
            catch (error) {
                // Error applying rule
            }
        }
        return matches;
    }
    /**
     * Apply a single rule to AST
     */
    async applyRule(rule, ast, context) {
        const matches = [];
        // Traverse AST and apply rule matcher
        this.traverseAST(ast, (node) => {
            try {
                if (rule.matcher.match(node, context)) {
                    const details = typeof rule.matcher.getMatchDetails === 'function'
                        ? rule.matcher.getMatchDetails(node, context)
                        : undefined;
                    const match = {
                        ruleId: rule.id,
                        severity: rule.severity,
                        category: rule.category,
                        range: this.createRange(node),
                        node,
                        context: {
                            ...context,
                            lineNumber: node.loc?.start.line || 1,
                            columnNumber: node.loc?.start.column || 1
                        },
                        template: rule.template, // Add template here
                        details
                    };
                    matches.push(match);
                }
            }
            catch (error) {
                // Skip individual node errors to avoid breaking entire analysis
            }
        });
        return matches;
    }
    /**
     * Get applicable rules for language and categories
     */
    getApplicableRules(language, enabledCategories) {
        const languageRules = this.getRulesForLanguage(language);
        if (!enabledCategories || enabledCategories.length === 0) {
            return languageRules.filter(rule => rule.enabled);
        }
        return languageRules.filter(rule => rule.enabled && enabledCategories.includes(rule.category));
    }
    /**
     * Index rule by language for faster lookup
     */
    indexRuleByLanguage(rule) {
        rule.languages.forEach(language => {
            const existing = this.rulesByLanguage.get(language) || [];
            existing.push(rule);
            this.rulesByLanguage.set(language, existing);
        });
    }
    /**
     * Index rule by category for faster lookup
     */
    indexRuleByCategory(rule) {
        const existing = this.rulesByCategory.get(rule.category) || [];
        existing.push(rule);
        this.rulesByCategory.set(rule.category, existing);
    }
    /**
     * Traverse AST and apply visitor function
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    traverseAST(node, visitor) {
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
            }
            else if (value && typeof value === 'object' && value.type) {
                this.traverseAST(value, visitor);
            }
        });
    }
    /**
     * Create range from AST node
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    createRange(node) {
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
    setRuleEnabled(ruleId, enabled) {
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
    setCategoryEnabled(category, enabled) {
        const rules = this.getRulesForCategory(category);
        rules.forEach(rule => {
            rule.enabled = enabled;
        });
    }
    /**
     * Get statistics about registered rules
     */
    getStatistics() {
        const total = this.rules.size;
        const enabled = this.getEnabledRules().length;
        const byLanguage = {};
        const bySeverity = {
            critical: 0,
            warning: 0,
            info: 0,
            good: 0
        };
        const byCategory = {};
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
    clear() {
        this.rules.clear();
        this.rulesByLanguage.clear();
        this.rulesByCategory.clear();
    }
}
exports.PatternEngine = PatternEngine;
/**
 * Singleton pattern engine instance
 */
exports.patternEngine = new PatternEngine();
//# sourceMappingURL=engine.js.map