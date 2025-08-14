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
exports.activate = activate;
exports.deactivate = deactivate;
// Minimal test extension to verify activation
const vscode = __importStar(require("vscode"));
function activate(context) {
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
function deactivate() {
    console.log('Code Quality Highlighter deactivated');
}
//# sourceMappingURL=extension-simple.js.map