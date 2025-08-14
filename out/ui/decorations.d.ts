import * as vscode from 'vscode';
import { PatternMatch } from '../types';
/**
 * Manages text decorations and hover providers for code quality highlighting
 */
export declare class DecorationManager {
    private decorationTypes;
    private activeDecorations;
    private hoverProvider;
    constructor();
    /**
     * Register hover provider for showing detailed tooltips
     */
    private registerHoverProvider;
    /**
     * Provide hover content for a position
     */
    private provideHover;
    /**
     * Create detailed hover with problem, solution, and code examples
     */
    private createDetailedHover;
    /**
     * Get score impact for a rule
     */
    private getScoreImpact;
    /**
     * Initialize decoration types for each severity level
     */
    private initializeDecorationTypes;
    /**
     * Apply decorations to the active editor
     */
    applyDecorations(editor: vscode.TextEditor, matches: PatternMatch[]): void;
    /**
     * Clear decorations for a specific editor
     */
    clearDecorations(editor: vscode.TextEditor): void;
    /**
     * Clear all decorations
     */
    clearAllDecorations(): void;
    /**
     * Get active decorations for a file
     */
    getActiveDecorations(filePath: string): PatternMatch[];
    /**
     * Update decorations when configuration changes
     */
    updateConfiguration(): void;
    /**
     * Group pattern matches by severity
     */
    private groupMatchesBySeverity;
    /**
     * Create decoration options from pattern matches
     */
    private createDecorationOptions;
    /**
     * Convert range to VS Code Range
     */
    private convertToVSCodeRange;
    /**
     * Get icon for severity level
     */
    private getSeverityIcon;
    /**
     * Get color for severity level
     */
    private getSeverityColor;
    /**
     * Adjust opacity for theme
     */
    private adjustOpacityForTheme;
    /**
     * Dispose all decoration types and hover provider
     */
    dispose(): void;
}
/**
 * Singleton decoration manager instance
 */
export declare const decorationManager: DecorationManager;
//# sourceMappingURL=decorations.d.ts.map