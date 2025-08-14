// Test setup file
// This file runs before each test file

// Mock VS Code API since we're running in Node.js environment
const mockVSCode = {
  window: {
    createTextEditorDecorationType: jest.fn(() => ({
      dispose: jest.fn()
    })),
    createStatusBarItem: jest.fn(() => ({
      text: '',
      tooltip: '',
      show: jest.fn(),
      hide: jest.fn(),
      dispose: jest.fn()
    })),
    showErrorMessage: jest.fn(),
    showWarningMessage: jest.fn(),
    showInformationMessage: jest.fn(),
    createWebviewPanel: jest.fn()
  },
  workspace: {
    getConfiguration: jest.fn(() => ({
      get: jest.fn((_key: string, defaultValue?: any) => defaultValue)
    })),
    onDidChangeTextDocument: jest.fn(),
    onDidSaveTextDocument: jest.fn(),
    onDidChangeConfiguration: jest.fn()
  },
  commands: {
    registerCommand: jest.fn(),
    executeCommand: jest.fn()
  },
  languages: {
    createDiagnosticCollection: jest.fn(),
    registerHoverProvider: jest.fn(),
    registerCodeActionsProvider: jest.fn()
  },
  Range: jest.fn().mockImplementation((start, end) => ({ start, end })),
  Position: jest.fn().mockImplementation((line, character) => ({ line, character })),
  StatusBarAlignment: {
    Left: 1,
    Right: 2
  },
  OverviewRulerLane: {
    Left: 1,
    Center: 2,
    Right: 4,
    Full: 7
  },
  ViewColumn: {
    Active: -1,
    Beside: -2,
    One: 1,
    Two: 2,
    Three: 3
  },
  ThemeColor: jest.fn().mockImplementation((id) => ({ id })),
  ThemeIcon: jest.fn().mockImplementation((id, color) => ({ id, color }))
};

// Mock the vscode module
jest.mock('vscode', () => mockVSCode, { virtual: true });

// Global test timeout
jest.setTimeout(10000);

// Console setup for better test output
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (args[0]?.includes?.('Warning: ')) {
      return;
    }
    originalError.apply(console, args);
  };
});

afterAll(() => {
  console.error = originalError;
});
