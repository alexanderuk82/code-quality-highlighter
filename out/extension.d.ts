import * as vscode from 'vscode';
/**
 * Main extension class
 */
export declare class CodeQualityExtension {
    private context;
    private statusBarItem;
    private analysisTimeout;
    private extensionState;
    private config;
    constructor(context: vscode.ExtensionContext);
    /**
     * Activate the extension
     */
    activate(): void;
    /**
     * Deactivate the extension
     */
    deactivate(): void;
    /**
     * Load extension configuration
     */
    private loadConfiguration;
    /**
     * Initialize language analyzers
     */
    private initializeAnalyzers;
    /**
     * Initialize pattern rules
     */
    private initializePatterns;
    /**
     * Setup VS Code event listeners
     */
    private setupEventListeners;
    /**
     * Register extension commands
     */
    private registerCommands;
    /**
     * Handle document change events
     */
    private onDocumentChange;
    /**
     * Handle document save events
     */
    private onDocumentSave;
    /**
     * Handle active editor change events
     */
    private onActiveEditorChange;
    /**
     * Handle configuration change events
     */
    private onConfigurationChange;
    /**
     * Analyze a document for code quality issues
     */
    private analyzeDocument;
    /**
     * Check if file should be analyzed
     */
    private shouldAnalyzeFile;
    /**
     * Update extension state with analysis result
     */
    private updateExtensionState;
    /**
     * Create status bar item
     */
    private createStatusBarItem;
    /**
     * Update status bar with analysis result
     */
    private updateStatusBar;
    /**
     * Show detailed quality report
     */
    private showQualityReport;
    /**
     * Generate HTML for quality report
     */
    private generateReportHTML;
    /**
     * Open configuration
     */
    private openConfiguration;
    /**
     * Clear analysis timeout
     */
    private clearAnalysisTimeout;
}
export declare function activate(context: vscode.ExtensionContext): void;
export declare function deactivate(): void;
//# sourceMappingURL=extension.d.ts.map