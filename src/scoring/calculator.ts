import { 
  PatternMatch, 
  QualityScore, 
  ScoreBreakdown, 
  Severity, 
  PatternCategory 
} from '../types';

/**
 * Quality score calculator
 */
export class ScoreCalculator {
  private static readonly BASE_SCORE = 100;
  private static readonly SCORE_IMPACTS: Record<Severity, number> = {
    critical: -15,
    warning: -8,
    info: -3,
    good: +2
  };

  /**
   * Calculate quality score from pattern matches
   */
  public calculateScore(matches: PatternMatch[]): QualityScore {
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
  private calculateBreakdown(matches: PatternMatch[]): ScoreBreakdown {
    const categoryScores: Record<PatternCategory, number> = {
      [PatternCategory.Performance]: ScoreCalculator.BASE_SCORE,
      [PatternCategory.Security]: ScoreCalculator.BASE_SCORE,
      [PatternCategory.Maintainability]: ScoreCalculator.BASE_SCORE,
      [PatternCategory.Style]: ScoreCalculator.BASE_SCORE
    };

    // Apply penalties and bonuses
    matches.forEach(match => {
      const impact = ScoreCalculator.SCORE_IMPACTS[match.severity];
      categoryScores[match.category] += impact;
    });

    // Ensure scores stay within bounds
    Object.keys(categoryScores).forEach(category => {
      const cat = category as PatternCategory;
      categoryScores[cat] = Math.max(0, Math.min(100, categoryScores[cat]));
    });

    // Calculate weighted total score
    const weights = {
      [PatternCategory.Performance]: 0.35,
      [PatternCategory.Security]: 0.30,
      [PatternCategory.Maintainability]: 0.25,
      [PatternCategory.Style]: 0.10
    };

    const weightedTotal = Object.entries(categoryScores).reduce((total, [category, score]) => {
      const weight = weights[category as PatternCategory];
      return total + (score * weight);
    }, 0);

    return {
      performance: categoryScores[PatternCategory.Performance],
      security: categoryScores[PatternCategory.Security],
      maintainability: categoryScores[PatternCategory.Maintainability],
      style: categoryScores[PatternCategory.Style],
      total: Math.round(weightedTotal)
    };
  }

  /**
   * Get human-readable score label
   */
  public getScoreLabel(score: number): string {
    if (score >= 90) return 'Excellent ⭐';
    if (score >= 80) return 'Very Good 🎯';
    if (score >= 70) return 'Good 👍';
    if (score >= 60) return 'Fair ⚠️';
    if (score >= 40) return 'Poor 📉';
    return 'Critical 🔨';
  }

  /**
   * Get score color for UI
   */
  public getScoreColor(score: number): string {
    if (score >= 90) return '#4CAF50'; // Green
    if (score >= 80) return '#8BC34A'; // Light Green
    if (score >= 70) return '#FFC107'; // Yellow
    if (score >= 60) return '#FF9800'; // Orange
    if (score >= 40) return '#FF5722'; // Deep Orange
    return '#F44336'; // Red
  }

  /**
   * Get detailed score analysis
   */
  public getScoreAnalysis(matches: PatternMatch[]): ScoreAnalysis {
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
  private countBySeverity(matches: PatternMatch[]): Record<Severity, number> {
    return matches.reduce((counts, match) => {
      counts[match.severity] = (counts[match.severity] || 0) + 1;
      return counts;
    }, {} as Record<Severity, number>);
  }

  /**
   * Count matches by category
   */
  private countByCategory(matches: PatternMatch[]): Record<PatternCategory, number> {
    return matches.reduce((counts, match) => {
      counts[match.category] = (counts[match.category] || 0) + 1;
      return counts;
    }, {} as Record<PatternCategory, number>);
  }

  /**
   * Generate improvement recommendations
   */
  private generateRecommendations(
    breakdown: ScoreBreakdown, 
    severityCounts: Record<Severity, number>
  ): string[] {
    const recommendations: string[] = [];

    // Critical issues recommendations
    if (severityCounts.critical > 0) {
      recommendations.push(
        `🔴 Address ${severityCounts.critical} critical issue${severityCounts.critical > 1 ? 's' : ''} immediately`
      );
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
    } else if (breakdown.total >= 80) {
      recommendations.push('👍 Good code quality with room for minor improvements');
    } else if (breakdown.total >= 60) {
      recommendations.push('⚠️ Moderate code quality - focus on critical issues first');
    } else {
      recommendations.push('🔨 Code quality needs significant improvement');
    }

    return recommendations;
  }

  /**
   * Calculate score trend (for future use)
   */
  public calculateTrend(currentScore: number, previousScore?: number): ScoreTrend {
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
export const scoreCalculator = new ScoreCalculator();
