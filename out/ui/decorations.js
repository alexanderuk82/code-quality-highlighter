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
 * Manages text decorations and hover providers for code quality highlighting
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
        Object.defineProperty(this, "hoverProvider", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.initializeDecorationTypes();
        this.registerHoverProvider();
    }
    /**
     * Register hover provider for showing detailed tooltips
     */
    registerHoverProvider() {
        this.hoverProvider = vscode.languages.registerHoverProvider(['javascript', 'typescript', 'typescriptreact', 'javascriptreact'], {
            provideHover: (document, position) => {
                return this.provideHover(document, position);
            }
        });
    }
    /**
     * Provide hover content for a position
     */
    provideHover(document, position) {
        const filePath = document.uri.fsPath;
        const matches = this.activeDecorations.get(filePath);
        if (!matches) {
            console.log('[Hover] No matches found for file:', filePath);
            return undefined;
        }
        // Find match at current position
        const match = matches.find(m => {
            const range = this.convertToVSCodeRange(m.range, document);
            return range.contains(position);
        });
        if (!match) {
            console.log('[Hover] No match at position:', position);
            return undefined;
        }
        console.log('[Hover] Found match:', match.ruleId, 'severity:', match.severity, 'has template:', !!match.template);
        if (!match.template) {
            console.log('[Hover] Match has no template!');
            return undefined;
        }
        const hover = this.createDetailedHover(match, document);
        return hover;
    }
    /**
     * Create detailed hover with problem, solution, and code examples
     */
    createDetailedHover(match, document) {
        const template = match.template;
        const markdown = new vscode.MarkdownString();
        markdown.isTrusted = true;
        markdown.supportHtml = true;
        // Title with severity icon
        const severityIcon = this.getSeverityIcon(match.severity);
        markdown.appendMarkdown(`## ${severityIcon} ${template.title}\n\n`);
        // Show the exact code that triggered the match (except for 'good')
        try {
            if (match.severity !== 'good') {
                const vsRange = this.convertToVSCodeRange(match.range, document);
                let snippet = document.getText(vsRange).trim();
                // Truncate very large snippets to keep hovers responsive
                if (snippet.length > 600) {
                    snippet = snippet.slice(0, 600) + '\n...';
                }
                if (snippet.length > 0) {
                    markdown.appendMarkdown('### This code\n');
                    markdown.appendCodeblock(snippet, 'javascript');
                }
            }
        }
        catch (e) {
            // Best effort; avoid breaking the hover if conversion fails
            console.warn('[Hover] Failed to extract code snippet:', e);
        }
        // Personalized fix (if available)
        if (match.details?.fix && match.severity !== 'good') {
            const fx = match.details.fix;
            markdown.appendMarkdown('### 🛠️ Proposed fix (personalized)\n');
            if (fx.type === 'copy' && fx.text) {
                markdown.appendCodeblock(fx.text, 'javascript');
                const copyArgs = encodeURIComponent(JSON.stringify([fx.text]));
                markdown.appendMarkdown(`\n[📋 Copy Solution](command:codeQuality.copySolution?${copyArgs})\n\n`);
            }
            else if (fx.type === 'replace' && fx.newText) {
                markdown.appendCodeblock(fx.newText, 'javascript');
                const target = fx.range ? fx.range : match.range;
                const replaceData = {
                    range: {
                        start: { line: target.start.line, character: target.start.character },
                        end: { line: target.end.line, character: target.end.character }
                    },
                    newCode: fx.newText
                };
                const replaceArgs = encodeURIComponent(JSON.stringify([JSON.stringify(replaceData)]));
                markdown.appendMarkdown(`\n[🔄 Replace Code](command:codeQuality.replaceCode?${replaceArgs} "Replace with proposed fix")\n\n`);
            }
        }
        // Adjust content based on severity
        if (match.severity === 'good') {
            // GREEN - Only positive feedback
            markdown.appendMarkdown('### ✅ Excellent!\n');
            markdown.appendMarkdown(`You're following best practices! ${template.solutionDescription}\n\n`);
            if (template.impactDescription) {
                markdown.appendMarkdown(`**Benefits:** ${template.impactDescription}\n\n`);
            }
            // Show examples of what you're doing right
            if (template.codeExamples && template.codeExamples.length > 0) {
                markdown.appendMarkdown('### 📚 Why This Is Good:\n\n');
                template.codeExamples.forEach(example => {
                    if (example.title) {
                        markdown.appendMarkdown(`**${example.title}**\n\n`);
                    }
                    markdown.appendMarkdown('You\'re using:\n');
                    markdown.appendCodeblock(example.after, 'javascript');
                    if (example.improvement) {
                        markdown.appendMarkdown(`**Benefit:** ${example.improvement}\n\n`);
                    }
                });
            }
        }
        else if (match.severity === 'info') {
            // YELLOW - Score impact and gentle suggestion
            markdown.appendMarkdown('### 📊 Score Impact\n');
            const scoreImpact = this.getScoreImpact(match.ruleId);
            markdown.appendMarkdown(`This affects your score by **${scoreImpact} points**.\n\n`);
            if (template.problemDescription) {
                markdown.appendMarkdown(`**Note:** ${template.problemDescription}\n\n`);
            }
            markdown.appendMarkdown('### 💡 Suggestion\n');
            markdown.appendMarkdown(`${template.solutionDescription}\n\n`);
            // Simple example
            if (template.codeExamples && template.codeExamples.length > 0) {
                const example = template.codeExamples[0];
                if (example) {
                    markdown.appendMarkdown('**Consider this approach:**\n');
                    markdown.appendCodeblock(example.after, 'javascript');
                }
            }
        }
        else if (match.severity === 'warning') {
            // ORANGE - Warning with explanation
            markdown.appendMarkdown('### ⚠️ Warning\n');
            markdown.appendMarkdown(`${template.problemDescription}\n\n`);
            if (template.impactDescription) {
                markdown.appendMarkdown(`**Why it matters:** ${template.impactDescription}\n\n`);
            }
            markdown.appendMarkdown('### 🔧 How to Fix\n');
            markdown.appendMarkdown(`${template.solutionDescription}\n\n`);
            // Show before/after
            if (template.codeExamples && template.codeExamples.length > 0) {
                template.codeExamples.forEach(example => {
                    if (example.title) {
                        markdown.appendMarkdown(`**${example.title}**\n\n`);
                    }
                    markdown.appendMarkdown('Current approach (generic example):\n');
                    markdown.appendCodeblock(example.before, 'javascript');
                    markdown.appendMarkdown('Better approach:\n');
                    markdown.appendCodeblock(example.after, 'javascript');
                    // Add copy button for warnings
                    const copyArgs = encodeURIComponent(JSON.stringify([example.after]));
                    markdown.appendMarkdown(`\n[📋 Copy Solution](command:codeQuality.copySolution?${copyArgs})\n\n`);
                    if (example.improvement) {
                        markdown.appendMarkdown(`**Improvement:** ${example.improvement}\n\n`);
                    }
                });
            }
        }
        else {
            // RED (critical) - Full details with all options
            markdown.appendMarkdown('### ❌ Problem\n');
            markdown.appendMarkdown(`${template.problemDescription}\n\n`);
            if (template.impactDescription) {
                markdown.appendMarkdown(`**Impact:** ${template.impactDescription}\n\n`);
            }
            markdown.appendMarkdown('### ✅ Solution\n');
            markdown.appendMarkdown(`${template.solutionDescription}\n\n`);
            // Full code examples with all buttons
            if (template.codeExamples && template.codeExamples.length > 0) {
                template.codeExamples.forEach(example => {
                    markdown.appendMarkdown('---\n\n');
                    if (example.title) {
                        markdown.appendMarkdown(`**${example.title}**\n\n`);
                    }
                    markdown.appendMarkdown('❌ **Before (Problematic):**\n');
                    markdown.appendCodeblock(example.before, 'javascript');
                    markdown.appendMarkdown('✅ **After (Optimized):**\n');
                    markdown.appendCodeblock(example.after, 'javascript');
                    // Copy and Replace buttons for critical issues
                    const copyArgs = encodeURIComponent(JSON.stringify([example.after]));
                    markdown.appendMarkdown(`\n[📋 Copy Solution](command:codeQuality.copySolution?${copyArgs} "Click to copy optimized code")`);
                    const replaceData = {
                        range: {
                            start: { line: match.range.start.line, character: match.range.start.character },
                            end: { line: match.range.end.line, character: match.range.end.character }
                        },
                        newCode: example.after
                    };
                    const replaceArgs = encodeURIComponent(JSON.stringify([JSON.stringify(replaceData)]));
                    markdown.appendMarkdown(` | [🔄 Replace Code](command:codeQuality.replaceCode?${replaceArgs} "Replace with optimized code")\n\n`);
                    if (example.improvement) {
                        markdown.appendMarkdown(`**🚀 Performance Gain:** ${example.improvement}\n\n`);
                    }
                });
            }
        }
        // Learn more link (for all severities except good)
        if (template.learnMoreUrl && match.severity !== 'good') {
            markdown.appendMarkdown('---\n\n');
            markdown.appendMarkdown(`📚 [Learn More](${template.learnMoreUrl})\n`);
        }
        return new vscode.Hover(markdown);
    }
    /**
     * Get score impact for a rule
     */
    getScoreImpact(ruleId) {
        // This would ideally come from the pattern rule
        const impacts = {
            'function-too-long': -8,
            'missing-react-memo': -5,
            'console-logs': -3
            // Add more as needed
        };
        return impacts[ruleId] || -3;
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
        // Store matches with their templates for hover provider
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
            const range = this.convertToVSCodeRange(match.range, editor.document);
            return {
                range,
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
    convertToVSCodeRange(range, document) {
        if (range instanceof vscode.Range) {
            return range;
        }
        // Handle our custom range format
        const startLine = Math.max(0, range.start.line);
        const startChar = Math.max(0, range.start.character);
        const endLine = Math.max(startLine, range.end.line);
        const endChar = Math.max(0, range.end.character);
        // Ensure range is within document bounds
        const documentLineCount = document.lineCount;
        const validStartLine = Math.min(startLine, documentLineCount - 1);
        const validEndLine = Math.min(endLine, documentLineCount - 1);
        return new vscode.Range(new vscode.Position(validStartLine, startChar), new vscode.Position(validEndLine, endChar));
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
     * Dispose all decoration types and hover provider
     */
    dispose() {
        this.decorationTypes.forEach(decorationType => {
            decorationType.dispose();
        });
        this.decorationTypes.clear();
        this.activeDecorations.clear();
        if (this.hoverProvider) {
            this.hoverProvider.dispose();
        }
    }
}
exports.DecorationManager = DecorationManager;
/**
 * Singleton decoration manager instance
 */
exports.decorationManager = new DecorationManager();
//# sourceMappingURL=decorations.js.map