import * as vscode from 'vscode';
import { PatternMatch } from '../types';
/**
 * Manages text decorations for code quality highlighting
 */
export declare class DecorationManager {
    private decorationTypes;
    private activeDecorations;
    constructor();
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
    getActiveDecorations(filePath: string): any[];
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
     * Create hover message for pattern match
     */
    private createHoverMessage;
    /**
     * Get icon for severity level
     */
    private getSeverityIcon;
    /**
     * Get label for severity level
     */
    private getSeverityLabel;
    /**
     * Get color for severity level
     */
    private getSeverityColor;
    /**
     * Adjust opacity for theme
     */
    private adjustOpacityForTheme;
    /**
     * Dispose all decoration types
     */
    dispose(): void;
}
/**
 * Singleton decoration manager instance
 */
export declare const decorationManager: DecorationManager;
//# sourceMappingURL=decorations.d.ts.map