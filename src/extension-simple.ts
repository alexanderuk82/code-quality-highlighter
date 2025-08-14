// Minimal test extension to verify activation
import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    console.log('Code Quality Highlighter is activating...');
    
    // Show that extension is working
    vscode.window.showInformationMessage('Code Quality Highlighter activated!');
    
    // Create a simple status bar item
    const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
    statusBar.text = '$(heart) Quality: TEST MODE';
    statusBar.show();
    
    // Register a simple command
    const disposable = vscode.commands.registerCommand('codeQuality.analyzeFile', () => {
        vscode.window.showInformationMessage('Analyzing code... (test mode)');
    });
    
    context.subscriptions.push(disposable);
    context.subscriptions.push(statusBar);
    
    console.log('Code Quality Highlighter activated successfully!');
}

export function deactivate() {
    console.log('Code Quality Highlighter deactivated');
}
