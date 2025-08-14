// Debug script para verificar la extensión
const vscode = require('vscode');

// Este comando te ayudará a debuggear
vscode.commands.registerCommand('codeQuality.debug', () => {
    vscode.window.showInformationMessage('Extension is working!');
    
    const editor = vscode.window.activeTextEditor;
    if (editor) {
        vscode.window.showInformationMessage(`File: ${editor.document.fileName}`);
        vscode.window.showInformationMessage(`Language: ${editor.document.languageId}`);
    }
});

// Ejecuta esto en la consola de VS Code:
// 1. Ctrl+Shift+P -> "Developer: Toggle Developer Tools"
// 2. En la consola: vscode.commands.executeCommand('codeQuality.analyzeFile')
