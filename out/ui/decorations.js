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
exports.decorationManager = exports.DecorationManager = void 0;
const vscode = __importStar(require("vscode"));
/**
 * Manages text decorations for code quality highlighting
 */
class DecorationManager {
    constructor() {
        Object.defineProperty(this, "decorationTypes", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map()
        });
        Object.defineProperty(this, "activeDecorations", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map()
        });
        this.initializeDecorationTypes();
    }
    /**
     * Initialize decoration types for each severity level
     */
    initializeDecorationTypes() {
        const decorationConfigs = {
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
                ...(config.overviewRulerColor && {
                    overviewRulerColor: config.overviewRulerColor,
                    overviewRulerLane: vscode.OverviewRulerLane.Right
                }),
                isWholeLine: false,
                rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed,
                // Add gutter icon for critical issues
                ...(severity === 'critical' && {
                    gutterIconPath: vscode.Uri.parse('data:image/svg+xml;base64,' + Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#ff0000" viewBox="0 0 16 16"><circle cx="8" cy="8" r="8"/></svg>').toString('base64')),
                    gutterIconSize: 'auto'
                }),
                // Add hover message styling
                ...(severity === 'critical' && {
                    textDecoration: 'underline wavy #ff0000'
                }),
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
            this.decorationTypes.set(severity, decorationType);
        });
    }
    /**
     * Apply decorations to the active editor
     */
    applyDecorations(editor, matches) {
        if (!editor)
            return;
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
    clearDecorations(editor) {
        if (!editor)
            return;
        const filePath = editor.document.uri.fsPath;
        this.activeDecorations.delete(filePath);
        this.decorationTypes.forEach(decorationType => {
            editor.setDecorations(decorationType, []);
        });
    }
    /**
     * Clear all decorations
     */
    clearAllDecorations() {
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getActiveDecorations(filePath) {
        return this.activeDecorations.get(filePath) || [];
    }
    /**
     * Update decorations when configuration changes
     */
    updateConfiguration() {
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
    groupMatchesBySeverity(matches) {
        const grouped = new Map();
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
    createDecorationOptions(matches, editor) {
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
    convertToVSCodeRange(range, editor) {
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
        return new vscode.Range(new vscode.Position(validStartLine, startChar), new vscode.Position(validEndLine, endChar));
    }
    /**
     * Create hover message for pattern match
     */
    createHoverMessage(match) {
        const message = new vscode.MarkdownString();
        message.isTrusted = true;
        message.supportHtml = true;
        const severityIcon = this.getSeverityIcon(match.severity);
        const severityLabel = this.getSeverityLabel(match.severity);
        message.appendMarkdown(`### ${severityIcon} ${severityLabel}\n\n`);
        message.appendMarkdown(`**Rule:** ${match.ruleId}\n\n`);
        message.appendMarkdown(`**Category:** ${match.category}\n\n`);
        message.appendMarkdown('Click for detailed analysis and solutions...');
        return message;
    }
    /**
     * Get icon for severity level
     */
    getSeverityIcon(severity) {
        const icons = {
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
    getSeverityLabel(severity) {
        const labels = {
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
    getSeverityColor(severity) {
        const colors = {
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
    adjustOpacityForTheme(backgroundColor, theme) {
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
    dispose() {
        this.decorationTypes.forEach(decorationType => {
            decorationType.dispose();
        });
        this.decorationTypes.clear();
        this.activeDecorations.clear();
    }
}
exports.DecorationManager = DecorationManager;
/**
 * Singleton decoration manager instance
 */
exports.decorationManager = new DecorationManager();
//# sourceMappingURL=decorations.js.map