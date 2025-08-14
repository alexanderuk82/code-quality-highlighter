"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodeQualityExtension = void 0;
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const javascript_1 = require("./analyzers/javascript");
const base_1 = require("./analyzers/base");
const decorations_1 = require("./ui/decorations");
const engine_1 = require("./patterns/engine");
const nested_loops_1 = require("./patterns/nested-loops");
const blocking_sync_operations_1 = require("./patterns/blocking-sync-operations");
const expensive_operations_in_loops_1 = require("./patterns/expensive-operations-in-loops");
const string_concatenation_in_loops_1 = require("./patterns/string-concatenation-in-loops");
const dom_queries_in_loops_1 = require("./patterns/dom-queries-in-loops");
const memory_leaks_1 = require("./patterns/memory-leaks");
// import { multipleArrayIterationsRule } from './patterns/multiple-array-iterations';
// import { inefficientObjectAccessRule } from './patterns/inefficient-object-access';
// import { infiniteRecursionRisksRule } from './patterns/infinite-recursion-risks';
const calculator_1 = require("./scoring/calculator");
const types_1 = require("./types");
/**
 * Main extension class
 */
class CodeQualityExtension {
    constructor(context) {
        Object.defineProperty(this, "context", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: context
        });
        Object.defineProperty(this, "statusBarItem", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "analysisTimeout", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "extensionState", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "config", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.extensionState = {
            isActive: false,
            analysisInProgress: false,
            lastAnalysisTime: new Date(),
            totalFilesAnalyzed: 0,
            totalIssuesFound: 0,
            averageScore: 0
        };
        this.config = this.loadConfiguration();
        this.statusBarItem = this.createStatusBarItem();
        this.initializeAnalyzers();
        this.initializePatterns();
        this.setupEventListeners();
    }
    /**
     * Activate the extension
     */
    activate() {
        this.extensionState.isActive = true;
        this.statusBarItem.show();
        // Analyze currently active editor
        const activeEditor = vscode.window.activeTextEditor;
        if (activeEditor && this.shouldAnalyzeFile(activeEditor.document)) {
            this.analyzeDocument(activeEditor.document);
        }
        // Extension activated successfully
    }
    /**
     * Deactivate the extension
     */
    deactivate() {
        this.extensionState.isActive = false;
        this.clearAnalysisTimeout();
        decorations_1.decorationManager.dispose();
        this.statusBarItem.dispose();
        // Extension deactivated successfully
    }
    /**
     * Load extension configuration
     */
    loadConfiguration() {
        const config = vscode.workspace.getConfiguration('codeQuality');
        return {
            enableAutoAnalysis: config.get('enableAutoAnalysis', true),
            activeRulesets: config.get('activeRulesets', [
                types_1.PatternCategory.Performance,
                types_1.PatternCategory.Security,
                types_1.PatternCategory.Maintainability,
                types_1.PatternCategory.Style
            ]),
            strictMode: config.get('strictMode', false),
            showGoodPatterns: config.get('showGoodPatterns', true),
            maxFileSize: config.get('maxFileSize', 5000),
            analysisDelay: config.get('analysisDelay', 500),
            customRules: []
        };
    }
    /**
     * Initialize language analyzers
     */
    initializeAnalyzers() {
        base_1.AnalyzerFactory.register('javascript', new javascript_1.JavaScriptAnalyzer());
        base_1.AnalyzerFactory.register('typescript', new javascript_1.TypeScriptAnalyzer());
        base_1.AnalyzerFactory.register('typescriptreact', new javascript_1.TypeScriptAnalyzer());
        base_1.AnalyzerFactory.register('javascriptreact', new javascript_1.JavaScriptAnalyzer());
    }
    /**
     * Initialize pattern rules
     */
    initializePatterns() {
        // Register core patterns
        engine_1.patternEngine.registerRule(nested_loops_1.nestedLoopRule);
        // Register critical performance patterns (9/9 complete)
        engine_1.patternEngine.registerRule(blocking_sync_operations_1.blockingSyncOperationsRule);
        engine_1.patternEngine.registerRule(expensive_operations_in_loops_1.expensiveOperationsInLoopsRule);
        engine_1.patternEngine.registerRule(string_concatenation_in_loops_1.stringConcatenationInLoopsRule);
        engine_1.patternEngine.registerRule(dom_queries_in_loops_1.domQueriesInLoopsRule);
        engine_1.patternEngine.registerRule(memory_leaks_1.memoryLeaksRule);
        // patternEngine.registerRule(multipleArrayIterationsRule);
        // patternEngine.registerRule(inefficientObjectAccessRule);
        // patternEngine.registerRule(infiniteRecursionRisksRule);
        // TODO: Register remaining 40 patterns
        // Next: Code quality patterns (functions too long, high complexity, etc.)
    }
    /**
     * Setup VS Code event listeners
     */
    setupEventListeners() {
        // Document change events
        this.context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(this.onDocumentChange.bind(this)));
        // Document save events
        this.context.subscriptions.push(vscode.workspace.onDidSaveTextDocument(this.onDocumentSave.bind(this)));
        // Active editor change events
        this.context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(this.onActiveEditorChange.bind(this)));
        // Configuration change events
        this.context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(this.onConfigurationChange.bind(this)));
        // Register commands
        this.registerCommands();
    }
    /**
     * Register extension commands
     */
    registerCommands() {
        // Analyze current file command
        this.context.subscriptions.push(vscode.commands.registerCommand('codeQuality.analyzeFile', () => {
            const activeEditor = vscode.window.activeTextEditor;
            if (activeEditor) {
                this.analyzeDocument(activeEditor.document);
            }
        }));
        // Show quality report command
        this.context.subscriptions.push(vscode.commands.registerCommand('codeQuality.showReport', () => {
            this.showQualityReport();
        }));
        // Configure rules command
        this.context.subscriptions.push(vscode.commands.registerCommand('codeQuality.configureRules', () => {
            this.openConfiguration();
        }));
    }
    /**
     * Handle document change events
     */
    onDocumentChange(event) {
        if (!this.config.enableAutoAnalysis || !this.shouldAnalyzeFile(event.document)) {
            return;
        }
        // Debounce analysis
        this.clearAnalysisTimeout();
        this.analysisTimeout = setTimeout(() => {
            this.analyzeDocument(event.document);
        }, this.config.analysisDelay);
    }
    /**
     * Handle document save events
     */
    onDocumentSave(document) {
        if (this.shouldAnalyzeFile(document)) {
            this.analyzeDocument(document);
        }
    }
    /**
     * Handle active editor change events
     */
    onActiveEditorChange(editor) {
        if (editor && this.shouldAnalyzeFile(editor.document)) {
            this.analyzeDocument(editor.document);
        }
        else {
            this.updateStatusBar(null);
        }
    }
    /**
     * Handle configuration change events
     */
    onConfigurationChange(event) {
        if (event.affectsConfiguration('codeQuality')) {
            this.config = this.loadConfiguration();
            decorations_1.decorationManager.updateConfiguration();
            // Re-analyze current file if auto-analysis is enabled
            const activeEditor = vscode.window.activeTextEditor;
            if (activeEditor && this.config.enableAutoAnalysis) {
                this.analyzeDocument(activeEditor.document);
            }
        }
    }
    /**
     * Analyze a document for code quality issues
     */
    async analyzeDocument(document) {
        if (this.extensionState.analysisInProgress) {
            return;
        }
        try {
            this.extensionState.analysisInProgress = true;
            this.updateStatusBar(null, 'Analyzing...');
            const filePath = document.uri.fsPath;
            const sourceCode = document.getText();
            const language = document.languageId;
            // Check file size limit
            const lineCount = document.lineCount;
            if (lineCount > this.config.maxFileSize) {
                vscode.window.showWarningMessage(`File too large (${lineCount} lines). Analysis skipped. Increase maxFileSize in settings.`);
                return;
            }
            // Get appropriate analyzer
            const analyzer = base_1.AnalyzerFactory.getAnalyzer(language);
            if (!analyzer) {
                // No analyzer found for this language
                return;
            }
            // Perform analysis
            const result = await analyzer.analyze(sourceCode, filePath);
            // Update extension state
            this.updateExtensionState(result);
            // Apply decorations
            const activeEditor = vscode.window.activeTextEditor;
            if (activeEditor && activeEditor.document.uri.fsPath === filePath) {
                decorations_1.decorationManager.applyDecorations(activeEditor, result.matches);
            }
            // Update status bar
            this.updateStatusBar(result);
            // Show errors if any
            if (result.errors.length > 0) {
                // Analysis completed with errors
            }
        }
        catch (error) {
            // Analysis failed with error
            vscode.window.showErrorMessage(`Code analysis failed: ${error}`);
        }
        finally {
            this.extensionState.analysisInProgress = false;
        }
    }
    /**
     * Check if file should be analyzed
     */
    shouldAnalyzeFile(document) {
        const language = document.languageId;
        const analyzer = base_1.AnalyzerFactory.getAnalyzer(language);
        return analyzer?.supports(document.uri.fsPath) ?? false;
    }
    /**
     * Update extension state with analysis result
     */
    updateExtensionState(result) {
        this.extensionState.lastAnalysisTime = new Date();
        this.extensionState.totalFilesAnalyzed++;
        this.extensionState.totalIssuesFound += result.matches.length;
        // Calculate running average score
        const currentAvg = this.extensionState.averageScore;
        const newCount = this.extensionState.totalFilesAnalyzed;
        this.extensionState.averageScore =
            (currentAvg * (newCount - 1) + result.score.value) / newCount;
    }
    /**
     * Create status bar item
     */
    createStatusBarItem() {
        const item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
        item.command = 'codeQuality.showReport';
        item.tooltip = 'Click to show detailed quality report';
        return item;
    }
    /**
     * Update status bar with analysis result
     */
    updateStatusBar(result, customText) {
        if (customText) {
            this.statusBarItem.text = `$(pulse) ${customText}`;
            this.statusBarItem.backgroundColor = undefined;
            return;
        }
        if (!result) {
            this.statusBarItem.text = '$(heart) Code Quality: Ready';
            this.statusBarItem.backgroundColor = undefined;
            return;
        }
        const score = result.score.value;
        const label = result.score.label;
        const issueCount = result.matches.length;
        this.statusBarItem.text = `$(heart) Quality: ${score}% ${label}`;
        this.statusBarItem.tooltip =
            `Score: ${score}% (${issueCount} issue${issueCount !== 1 ? 's' : ''})\nClick for details`;
        // Set background color based on score
        if (score < 60) {
            this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
        }
        else if (score < 80) {
            this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
        }
        else {
            this.statusBarItem.backgroundColor = undefined;
        }
    }
    /**
     * Show detailed quality report
     */
    showQualityReport() {
        const activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor) {
            vscode.window.showInformationMessage('No active file to analyze');
            return;
        }
        const filePath = activeEditor.document.uri.fsPath;
        const matches = decorations_1.decorationManager.getActiveDecorations(filePath);
        if (matches.length === 0) {
            vscode.window.showInformationMessage('No quality issues found in current file');
            return;
        }
        // Create and show quality report webview
        const panel = vscode.window.createWebviewPanel('codeQualityReport', 'Code Quality Report', vscode.ViewColumn.Beside, { enableScripts: true });
        panel.webview.html = this.generateReportHTML(matches);
    }
    /**
     * Generate HTML for quality report
     */
    generateReportHTML(matches) {
        const analysis = calculator_1.scoreCalculator.getScoreAnalysis(matches);
        return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Code Quality Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .score { font-size: 24px; font-weight: bold; margin-bottom: 20px; }
          .critical { color: #ff0000; }
          .warning { color: #ffa500; }
          .info { color: #ffff00; }
          .good { color: #00ff00; }
          .issue { margin: 10px 0; padding: 10px; border-left: 4px solid; }
          .recommendations { margin-top: 20px; }
        </style>
      </head>
      <body>
        <h1>Code Quality Report</h1>
        <div class="score">Overall Score: ${analysis.breakdown.total}%</div>
        
        <h2>Category Breakdown</h2>
        <ul>
          <li>Performance: ${analysis.breakdown.performance}%</li>
          <li>Security: ${analysis.breakdown.security}%</li>
          <li>Maintainability: ${analysis.breakdown.maintainability}%</li>
          <li>Style: ${analysis.breakdown.style}%</li>
        </ul>

        <h2>Issues Found (${analysis.totalIssues})</h2>
        ${matches.map(match => `
          <div class="issue ${match.severity}">
            <strong>${match.ruleId}</strong> (${match.severity})
            <br>Category: ${match.category}
            <br>Line: ${match.context.lineNumber}
          </div>
        `).join('')}

        <div class="recommendations">
          <h2>Recommendations</h2>
          ${analysis.recommendations.map(rec => `<p>${rec}</p>`).join('')}
        </div>
      </body>
      </html>
    `;
    }
    /**
     * Open configuration
     */
    openConfiguration() {
        vscode.commands.executeCommand('workbench.action.openSettings', 'codeQuality');
    }
    /**
     * Clear analysis timeout
     */
    clearAnalysisTimeout() {
        if (this.analysisTimeout) {
            clearTimeout(this.analysisTimeout);
            this.analysisTimeout = undefined;
        }
    }
}
exports.CodeQualityExtension = CodeQualityExtension;
// Extension activation function
function activate(context) {
    const extension = new CodeQualityExtension(context);
    extension.activate();
    // Store extension instance for deactivation
    context.subscriptions.push({
        dispose: () => extension.deactivate()
    });
}
// Extension deactivation function
function deactivate() {
    // Cleanup is handled by the extension instance
}
//# sourceMappingURL=extension-backup.js.map