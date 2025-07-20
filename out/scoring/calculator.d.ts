import { PatternMatch, QualityScore, ScoreBreakdown, Severity, PatternCategory } from '../types';
/**
 * Quality score calculator
 */
export declare class ScoreCalculator {
    private static readonly BASE_SCORE;
    private static readonly SCORE_IMPACTS;
    /**
     * Calculate quality score from pattern matches
     */
    calculateScore(matches: PatternMatch[]): QualityScore;
    /**
     * Calculate score breakdown by category
     */
    private calculateBreakdown;
    /**
     * Get human-readable score label
     */
    getScoreLabel(score: number): string;
    /**
     * Get score color for UI
     */
    getScoreColor(score: number): string;
    /**
     * Get detailed score analysis
     */
    getScoreAnalysis(matches: PatternMatch[]): ScoreAnalysis;
    /**
     * Count matches by severity
     */
    private countBySeverity;
    /**
     * Count matches by category
     */
    private countByCategory;
    /**
     * Generate improvement recommendations
     */
    private generateRecommendations;
    /**
     * Calculate score trend (for future use)
     */
    calculateTrend(currentScore: number, previousScore?: number): ScoreTrend;
}
/**
 * Extended score analysis interface
 */
export interface ScoreAnalysis {
    breakdown: ScoreBreakdown;
    severityCounts: Record<Severity, number>;
    categoryCounts: Record<PatternCategory, number>;
    totalIssues: number;
    criticalIssues: number;
    recommendations: string[];
}
/**
 * Score trend information
 */
export interface ScoreTrend {
    direction: 'up' | 'down' | 'neutral';
    change: number;
    message: string;
}
/**
 * Singleton score calculator instance
 */
export declare const scoreCalculator: ScoreCalculator;
//# sourceMappingURL=calculator.d.ts.map