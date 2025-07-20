"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scoreCalculator = exports.ScoreCalculator = void 0;
const types_1 = require("../types");
/**
 * Quality score calculator
 */
class ScoreCalculator {
    /**
     * Calculate quality score from pattern matches
     */
    calculateScore(matches) {
        const breakdown = this.calculateBreakdown(matches);
        const totalScore = Math.max(0, Math.min(100, breakdown.total));
        return {
            value: totalScore,
            label: this.getScoreLabel(totalScore),
            breakdown
        };
    }
    /**
     * Calculate score breakdown by category
     */
    calculateBreakdown(matches) {
        const categoryScores = {
            [types_1.PatternCategory.Performance]: ScoreCalculator.BASE_SCORE,
            [types_1.PatternCategory.Security]: ScoreCalculator.BASE_SCORE,
            [types_1.PatternCategory.Maintainability]: ScoreCalculator.BASE_SCORE,
            [types_1.PatternCategory.Style]: ScoreCalculator.BASE_SCORE
        };
        // Apply penalties and bonuses
        matches.forEach(match => {
            const impact = ScoreCalculator.SCORE_IMPACTS[match.severity];
            categoryScores[match.category] += impact;
        });
        // Ensure scores stay within bounds
        Object.keys(categoryScores).forEach(category => {
            const cat = category;
            categoryScores[cat] = Math.max(0, Math.min(100, categoryScores[cat]));
        });
        // Calculate weighted total score
        const weights = {
            [types_1.PatternCategory.Performance]: 0.35,
            [types_1.PatternCategory.Security]: 0.30,
            [types_1.PatternCategory.Maintainability]: 0.25,
            [types_1.PatternCategory.Style]: 0.10
        };
        const weightedTotal = Object.entries(categoryScores).reduce((total, [category, score]) => {
            const weight = weights[category];
            return total + (score * weight);
        }, 0);
        return {
            performance: categoryScores[types_1.PatternCategory.Performance],
            security: categoryScores[types_1.PatternCategory.Security],
            maintainability: categoryScores[types_1.PatternCategory.Maintainability],
            style: categoryScores[types_1.PatternCategory.Style],
            total: Math.round(weightedTotal)
        };
    }
    /**
     * Get human-readable score label
     */
    getScoreLabel(score) {
        if (score >= 90)
            return 'Excellent ⭐';
        if (score >= 80)
            return 'Very Good 🎯';
        if (score >= 70)
            return 'Good 👍';
        if (score >= 60)
            return 'Fair ⚠️';
        if (score >= 40)
            return 'Poor 📉';
        return 'Critical 🔨';
    }
    /**
     * Get score color for UI
     */
    getScoreColor(score) {
        if (score >= 90)
            return '#4CAF50'; // Green
        if (score >= 80)
            return '#8BC34A'; // Light Green
        if (score >= 70)
            return '#FFC107'; // Yellow
        if (score >= 60)
            return '#FF9800'; // Orange
        if (score >= 40)
            return '#FF5722'; // Deep Orange
        return '#F44336'; // Red
    }
    /**
     * Get detailed score analysis
     */
    getScoreAnalysis(matches) {
        const breakdown = this.calculateBreakdown(matches);
        const severityCounts = this.countBySeverity(matches);
        const categoryCounts = this.countByCategory(matches);
        return {
            breakdown,
            severityCounts,
            categoryCounts,
            totalIssues: matches.length,
            criticalIssues: severityCounts.critical,
            recommendations: this.generateRecommendations(breakdown, severityCounts)
        };
    }
    /**
     * Count matches by severity
     */
    countBySeverity(matches) {
        return matches.reduce((counts, match) => {
            counts[match.severity] = (counts[match.severity] || 0) + 1;
            return counts;
        }, {});
    }
    /**
     * Count matches by category
     */
    countByCategory(matches) {
        return matches.reduce((counts, match) => {
            counts[match.category] = (counts[match.category] || 0) + 1;
            return counts;
        }, {});
    }
    /**
     * Generate improvement recommendations
     */
    generateRecommendations(breakdown, severityCounts) {
        const recommendations = [];
        // Critical issues recommendations
        if (severityCounts.critical > 0) {
            recommendations.push(`🔴 Address ${severityCounts.critical} critical issue${severityCounts.critical > 1 ? 's' : ''} immediately`);
        }
        // Category-specific recommendations
        if (breakdown.performance < 70) {
            recommendations.push('⚡ Focus on performance optimizations');
        }
        if (breakdown.security < 70) {
            recommendations.push('🔒 Review security vulnerabilities');
        }
        if (breakdown.maintainability < 70) {
            recommendations.push('🔧 Improve code maintainability');
        }
        if (breakdown.style < 70) {
            recommendations.push('✨ Clean up code style issues');
        }
        // Overall recommendations
        if (breakdown.total >= 90) {
            recommendations.push('🎉 Excellent code quality! Keep it up!');
        }
        else if (breakdown.total >= 80) {
            recommendations.push('👍 Good code quality with room for minor improvements');
        }
        else if (breakdown.total >= 60) {
            recommendations.push('⚠️ Moderate code quality - focus on critical issues first');
        }
        else {
            recommendations.push('🔨 Code quality needs significant improvement');
        }
        return recommendations;
    }
    /**
     * Calculate score trend (for future use)
     */
    calculateTrend(currentScore, previousScore) {
        if (!previousScore) {
            return { direction: 'neutral', change: 0, message: 'Initial analysis' };
        }
        const change = currentScore - previousScore;
        if (Math.abs(change) < 2) {
            return { direction: 'neutral', change, message: 'No significant change' };
        }
        if (change > 0) {
            return {
                direction: 'up',
                change,
                message: `Improved by ${change} points`
            };
        }
        return {
            direction: 'down',
            change,
            message: `Decreased by ${Math.abs(change)} points`
        };
    }
}
exports.ScoreCalculator = ScoreCalculator;
Object.defineProperty(ScoreCalculator, "BASE_SCORE", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: 100
});
Object.defineProperty(ScoreCalculator, "SCORE_IMPACTS", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: {
        critical: -15,
        warning: -8,
        info: -3,
        good: +2
    }
});
/**
 * Singleton score calculator instance
 */
exports.scoreCalculator = new ScoreCalculator();
//# sourceMappingURL=calculator.js.map