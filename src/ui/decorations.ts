import * as vscode from 'vscode';
import { PatternMatch, Severity, DecorationConfig } from '../types';

/**
 * Manages text decorations for code quality highlighting
 */
export class DecorationManager {
  private decorationTypes: Map<Severity, vscode.TextEditorDecorationType> = new Map();
  private activeDecorations: Map<string, PatternMatch[]> = new Map();

  constructor() {
    this.initializeDecorationTypes();
  }

  /**
   * Initialize decoration types for each severity level
   */
  private initializeDecorationTypes(): void {
    const decorationConfigs: Record<Severity, DecorationConfig> = {
      critical: {
        severity: 'critical',
        backgroundColor: 'rgba(255, 0, 0, 0.15)',
        borderColor: '#ff0000',
        borderStyle: '2px solid',
        borderRadius: '3px',
        overviewRulerColor: '#ff0000'
      },
      warning: {
        severity: 'warning',
        backgroundColor: 'rgba(255, 165, 0, 0.10)',
        borderColor: '#ffa500',
        borderStyle: '1px solid',
        borderRadius: '3px',
        overviewRulerColor: '#ffa500'
      },
      info: {
        severity: 'info',
        backgroundColor: 'rgba(255, 255, 0, 0.08)',
        borderColor: '#ffff00',
        borderStyle: '1px dashed',
        borderRadius: '2px',
        overviewRulerColor: '#ffff00'
      },
      good: {
        severity: 'good',
        backgroundColor: 'rgba(0, 255, 0, 0.08)',
        borderColor: '#00ff00',
        borderStyle: '1px solid',
        borderRadius: '2px',
        overviewRulerColor: '#00ff00'
      }
    };

    Object.entries(decorationConfigs).forEach(([severity, config]) => {
      const decorationType = vscode.window.createTextEditorDecorationType({
        backgroundColor: config.backgroundColor,
        border: `${config.borderStyle} ${config.borderColor}`,
        borderRadius: config.borderRadius,
        overviewRulerColor: config.overviewRulerColor,
        overviewRulerLane: vscode.OverviewRulerLane.Right,
        isWholeLine: false,
        rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed,
        
        // Add gutter icon for critical issues
        ...(severity === 'critical' && {
          gutterIconPath: new vscode.ThemeIcon('error', new vscode.ThemeColor('errorForeground')),
          gutterIconSize: 'auto'
        }),

        // Add hover message styling
        textDecoration: severity === 'critical' ? 'underline wavy #ff0000' : undefined,

        // Light theme overrides
        light: {
          backgroundColor: this.adjustOpacityForTheme(config.backgroundColor, 'light'),
          borderColor: config.borderColor
        },

        // Dark theme overrides
        dark: {
          backgroundColor: this.adjustOpacityForTheme(config.backgroundColor, 'dark'),
          borderColor: config.borderColor
        }
      });

      this.decorationTypes.set(severity as Severity, decorationType);
    });
  }

  /**
   * Apply decorations to the active editor
   */
  public applyDecorations(editor: vscode.TextEditor, matches: PatternMatch[]): void {
    if (!editor) return;

    const filePath = editor.document.uri.fsPath;
    this.activeDecorations.set(filePath, matches);

    // Group matches by severity
    const matchesBySeverity = this.groupMatchesBySeverity(matches);

    // Apply decorations for each severity level
    this.decorationTypes.forEach((decorationType, severity) => {
      const severityMatches = matchesBySeverity.get(severity) || [];
      const decorationOptions = this.createDecorationOptions(severityMatches, editor);
      
      editor.setDecorations(decorationType, decorationOptions);
    });
  }

  /**
   * Clear decorations for a specific editor
   */
  public clearDecorations(editor: vscode.TextEditor): void {
    if (!editor) return;

    const filePath = editor.document.uri.fsPath;
    this.activeDecorations.delete(filePath);

    this.decorationTypes.forEach(decorationType => {
      editor.setDecorations(decorationType, []);
    });
  }

  /**
   * Clear all decorations
   */
  public clearAllDecorations(): void {
    this.activeDecorations.clear();
    
    vscode.window.visibleTextEditors.forEach(editor => {
      this.decorationTypes.forEach(decorationType => {
        editor.setDecorations(decorationType, []);
      });
    });
  }

  /**
   * Get active decorations for a file
   */
  public getActiveDecorations(filePath: string): PatternMatch[] {
    return this.activeDecorations.get(filePath) || [];
  }

  /**
   * Update decorations when configuration changes
   */
  public updateConfiguration(): void {
    // Dispose old decoration types
    this.decorationTypes.forEach(decorationType => {
      decorationType.dispose();
    });
    
    this.decorationTypes.clear();
    this.initializeDecorationTypes();

    // Reapply decorations to all active editors
    vscode.window.visibleTextEditors.forEach(editor => {
      const filePath = editor.document.uri.fsPath;
      const matches = this.activeDecorations.get(filePath);
      if (matches) {
        this.applyDecorations(editor, matches);
      }
    });
  }

  /**
   * Group pattern matches by severity
   */
  private groupMatchesBySeverity(matches: PatternMatch[]): Map<Severity, PatternMatch[]> {
    const grouped = new Map<Severity, PatternMatch[]>();
    
    matches.forEach(match => {
      const existing = grouped.get(match.severity) || [];
      existing.push(match);
      grouped.set(match.severity, existing);
    });

    return grouped;
  }

  /**
   * Create decoration options from pattern matches
   */
  private createDecorationOptions(
    matches: PatternMatch[], 
    editor: vscode.TextEditor
  ): vscode.DecorationOptions[] {
    return matches.map(match => {
      const range = this.convertToVSCodeRange(match.range, editor);
      const hoverMessage = this.createHoverMessage(match);

      return {
        range,
        hoverMessage,
        renderOptions: {
          after: {
            contentText: this.getSeverityIcon(match.severity),
            color: this.getSeverityColor(match.severity),
            margin: '0 0 0 5px'
          }
        }
      };
    });
  }

  /**
   * Convert range to VS Code Range
   */
  private convertToVSCodeRange(range: any, editor: vscode.TextEditor): vscode.Range {
    if (range instanceof vscode.Range) {
      return range;
    }

    // Handle our custom range format
    const startLine = Math.max(0, range.start.line);
    const startChar = Math.max(0, range.start.character);
    const endLine = Math.max(startLine, range.end.line);
    const endChar = Math.max(0, range.end.character);

    // Ensure range is within document bounds
    const documentLineCount = editor.document.lineCount;
    const validStartLine = Math.min(startLine, documentLineCount - 1);
    const validEndLine = Math.min(endLine, documentLineCount - 1);

    return new vscode.Range(
      new vscode.Position(validStartLine, startChar),
      new vscode.Position(validEndLine, endChar)
    );
  }

  /**
   * Create hover message for pattern match
   */
  private createHoverMessage(match: PatternMatch): vscode.MarkdownString {
    const message = new vscode.MarkdownString();
    message.isTrusted = true;
    message.supportHtml = true;

    const severityIcon = this.getSeverityIcon(match.severity);
    const severityLabel = this.getSeverityLabel(match.severity);
    
    message.appendMarkdown(`### ${severityIcon} ${severityLabel}\n\n`);
    message.appendMarkdown(`**Rule:** ${match.ruleId}\n\n`);
    message.appendMarkdown(`**Category:** ${match.category}\n\n`);
    message.appendMarkdown(`Click for detailed analysis and solutions...`);

    return message;
  }

  /**
   * Get icon for severity level
   */
  private getSeverityIcon(severity: Severity): string {
    const icons: Record<Severity, string> = {
      critical: '🔴',
      warning: '🟠',
      info: '🟡',
      good: '✅'
    };
    return icons[severity];
  }

  /**
   * Get label for severity level
   */
  private getSeverityLabel(severity: Severity): string {
    const labels: Record<Severity, string> = {
      critical: 'CRITICAL',
      warning: 'WARNING',
      info: 'INFO',
      good: 'GOOD PRACTICE'
    };
    return labels[severity];
  }

  /**
   * Get color for severity level
   */
  private getSeverityColor(severity: Severity): string {
    const colors: Record<Severity, string> = {
      critical: '#ff0000',
      warning: '#ffa500',
      info: '#ffff00',
      good: '#00ff00'
    };
    return colors[severity];
  }

  /**
   * Adjust opacity for theme
   */
  private adjustOpacityForTheme(backgroundColor: string, theme: 'light' | 'dark'): string {
    // For light theme, use slightly less opacity
    // For dark theme, use slightly more opacity
    const opacityMultiplier = theme === 'light' ? 0.8 : 1.2;
    
    // Extract rgba values and adjust alpha
    const match = backgroundColor.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
    if (match) {
      const [, r, g, b, a] = match;
      const newAlpha = Math.min(1, parseFloat(a || '0') * opacityMultiplier);
      return `rgba(${r}, ${g}, ${b}, ${newAlpha})`;
    }
    
    return backgroundColor;
  }

  /**
   * Dispose all decoration types
   */
  public dispose(): void {
    this.decorationTypes.forEach(decorationType => {
      decorationType.dispose();
    });
    this.decorationTypes.clear();
    this.activeDecorations.clear();
  }
}

/**
 * Singleton decoration manager instance
 */
export const decorationManager = new DecorationManager();
