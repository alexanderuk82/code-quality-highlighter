import * as vscode from 'vscode';
import { JavaScriptAnalyzer, TypeScriptAnalyzer } from './analyzers/javascript';
import { AnalyzerFactory } from './analyzers/base';
import { decorationManager } from './ui/decorations';
import { patternEngine } from './patterns/engine';
import { nestedLoopRule } from './patterns/nested-loops';
import { blockingSyncOperationsRule } from './patterns/blocking-sync-operations';
import { expensiveOperationsInLoopsRule } from './patterns/expensive-operations-in-loops';
import { stringConcatenationInLoopsRule } from './patterns/string-concatenation-in-loops';
import { domQueriesInLoopsRule } from './patterns/dom-queries-in-loops';
import { memoryLeaksRule } from './patterns/memory-leaks';
import { multipleArrayIterationsRule } from './patterns/multiple-array-iterations';
import { inefficientObjectAccessRule } from './patterns/inefficient-object-access';
import { infiniteRecursionRisksRule } from './patterns/infinite-recursion-risks';
import { scoreCalculator } from './scoring/calculator';
import {
  AnalysisResult,
  ExtensionConfig,
  ExtensionState,
  SupportedLanguage,
  PatternCategory,
  PatternMatch
} from './types';

/**
 * Main extension class
 */
export class CodeQualityExtension {
  private statusBarItem: vscode.StatusBarItem;
  private analysisTimeout: NodeJS.Timeout | undefined;
  private extensionState: ExtensionState;
  private config: ExtensionConfig;

  constructor(private context: vscode.ExtensionContext) {
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
  public activate(): void {
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
  public deactivate(): void {
    this.extensionState.isActive = false;
    this.clearAnalysisTimeout();
    decorationManager.dispose();
    this.statusBarItem.dispose();

    // Extension deactivated successfully
  }

  /**
   * Load extension configuration
   */
  private loadConfiguration(): ExtensionConfig {
    const config = vscode.workspace.getConfiguration('codeQuality');

    return {
      enableAutoAnalysis: config.get('enableAutoAnalysis', true),
      activeRulesets: config.get('activeRulesets', [
        PatternCategory.Performance,
        PatternCategory.Security,
        PatternCategory.Maintainability,
        PatternCategory.Style
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
  private initializeAnalyzers(): void {
    AnalyzerFactory.register('javascript', new JavaScriptAnalyzer());
    AnalyzerFactory.register('typescript', new TypeScriptAnalyzer());
    AnalyzerFactory.register('typescriptreact', new TypeScriptAnalyzer());
    AnalyzerFactory.register('javascriptreact', new JavaScriptAnalyzer());
  }

  /**
   * Initialize pattern rules
   */
  private initializePatterns(): void {
    // Register core patterns
    patternEngine.registerRule(nestedLoopRule);

    // Register critical performance patterns (9/9 complete)
    patternEngine.registerRule(blockingSyncOperationsRule);
    patternEngine.registerRule(expensiveOperationsInLoopsRule);
    patternEngine.registerRule(stringConcatenationInLoopsRule);
    patternEngine.registerRule(domQueriesInLoopsRule);
    patternEngine.registerRule(memoryLeaksRule);
    patternEngine.registerRule(multipleArrayIterationsRule);
    patternEngine.registerRule(inefficientObjectAccessRule);
    patternEngine.registerRule(infiniteRecursionRisksRule);

    // TODO: Register remaining 40 patterns
    // Next: Code quality patterns (functions too long, high complexity, etc.)
  }

  /**
   * Setup VS Code event listeners
   */
  private setupEventListeners(): void {
    // Document change events
    this.context.subscriptions.push(
      vscode.workspace.onDidChangeTextDocument(this.onDocumentChange.bind(this))
    );

    // Document save events
    this.context.subscriptions.push(
      vscode.workspace.onDidSaveTextDocument(this.onDocumentSave.bind(this))
    );

    // Active editor change events
    this.context.subscriptions.push(
      vscode.window.onDidChangeActiveTextEditor(this.onActiveEditorChange.bind(this))
    );

    // Configuration change events
    this.context.subscriptions.push(
      vscode.workspace.onDidChangeConfiguration(this.onConfigurationChange.bind(this))
    );

    // Register commands
    this.registerCommands();
  }

  /**
   * Register extension commands
   */
  private registerCommands(): void {
    // Analyze current file command
    this.context.subscriptions.push(
      vscode.commands.registerCommand('codeQuality.analyzeFile', () => {
        const activeEditor = vscode.window.activeTextEditor;
        if (activeEditor) {
          this.analyzeDocument(activeEditor.document);
        }
      })
    );

    // Show quality report command
    this.context.subscriptions.push(
      vscode.commands.registerCommand('codeQuality.showReport', () => {
        this.showQualityReport();
      })
    );

    // Configure rules command
    this.context.subscriptions.push(
      vscode.commands.registerCommand('codeQuality.configureRules', () => {
        this.openConfiguration();
      })
    );
  }

  /**
   * Handle document change events
   */
  private onDocumentChange(event: vscode.TextDocumentChangeEvent): void {
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
  private onDocumentSave(document: vscode.TextDocument): void {
    if (this.shouldAnalyzeFile(document)) {
      this.analyzeDocument(document);
    }
  }

  /**
   * Handle active editor change events
   */
  private onActiveEditorChange(editor: vscode.TextEditor | undefined): void {
    if (editor && this.shouldAnalyzeFile(editor.document)) {
      this.analyzeDocument(editor.document);
    } else {
      this.updateStatusBar(null);
    }
  }

  /**
   * Handle configuration change events
   */
  private onConfigurationChange(event: vscode.ConfigurationChangeEvent): void {
    if (event.affectsConfiguration('codeQuality')) {
      this.config = this.loadConfiguration();
      decorationManager.updateConfiguration();

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
  private async analyzeDocument(document: vscode.TextDocument): Promise<void> {
    if (this.extensionState.analysisInProgress) {
      return;
    }

    try {
      this.extensionState.analysisInProgress = true;
      this.updateStatusBar(null, 'Analyzing...');

      const filePath = document.uri.fsPath;
      const sourceCode = document.getText();
      const language = document.languageId as SupportedLanguage;

      // Check file size limit
      const lineCount = document.lineCount;
      if (lineCount > this.config.maxFileSize) {
        vscode.window.showWarningMessage(
          `File too large (${lineCount} lines). Analysis skipped. Increase maxFileSize in settings.`
        );
        return;
      }

      // Get appropriate analyzer
      const analyzer = AnalyzerFactory.getAnalyzer(language);
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
        decorationManager.applyDecorations(activeEditor, result.matches);
      }

      // Update status bar
      this.updateStatusBar(result);

      // Show errors if any
      if (result.errors.length > 0) {
        // Analysis completed with errors
      }

    } catch (error) {
      // Analysis failed with error
      vscode.window.showErrorMessage(`Code analysis failed: ${error}`);
    } finally {
      this.extensionState.analysisInProgress = false;
    }
  }

  /**
   * Check if file should be analyzed
   */
  private shouldAnalyzeFile(document: vscode.TextDocument): boolean {
    const language = document.languageId as SupportedLanguage;
    const analyzer = AnalyzerFactory.getAnalyzer(language);
    return analyzer?.supports(document.uri.fsPath) ?? false;
  }

  /**
   * Update extension state with analysis result
   */
  private updateExtensionState(result: AnalysisResult): void {
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
  private createStatusBarItem(): vscode.StatusBarItem {
    const item = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      100
    );

    item.command = 'codeQuality.showReport';
    item.tooltip = 'Click to show detailed quality report';

    return item;
  }

  /**
   * Update status bar with analysis result
   */
  private updateStatusBar(result: AnalysisResult | null, customText?: string): void {
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
    } else if (score < 80) {
      this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
    } else {
      this.statusBarItem.backgroundColor = undefined;
    }
  }

  /**
   * Show detailed quality report
   */
  private showQualityReport(): void {
    const activeEditor = vscode.window.activeTextEditor;
    if (!activeEditor) {
      vscode.window.showInformationMessage('No active file to analyze');
      return;
    }

    const filePath = activeEditor.document.uri.fsPath;
    const matches = decorationManager.getActiveDecorations(filePath);

    if (matches.length === 0) {
      vscode.window.showInformationMessage('No quality issues found in current file');
      return;
    }

    // Create and show quality report webview
    const panel = vscode.window.createWebviewPanel(
      'codeQualityReport',
      'Code Quality Report',
      vscode.ViewColumn.Beside,
      { enableScripts: true }
    );

    panel.webview.html = this.generateReportHTML(matches);
  }

  /**
   * Generate HTML for quality report
   */
  private generateReportHTML(matches: PatternMatch[]): string {
    const analysis = scoreCalculator.getScoreAnalysis(matches);

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
  private openConfiguration(): void {
    vscode.commands.executeCommand('workbench.action.openSettings', 'codeQuality');
  }

  /**
   * Clear analysis timeout
   */
  private clearAnalysisTimeout(): void {
    if (this.analysisTimeout) {
      clearTimeout(this.analysisTimeout);
      this.analysisTimeout = undefined;
    }
  }
}

// Extension activation function
export function activate(context: vscode.ExtensionContext): void {
  const extension = new CodeQualityExtension(context);
  extension.activate();

  // Store extension instance for deactivation
  context.subscriptions.push({
    dispose: () => extension.deactivate()
  });
}

// Extension deactivation function
export function deactivate(): void {
  // Cleanup is handled by the extension instance
}
