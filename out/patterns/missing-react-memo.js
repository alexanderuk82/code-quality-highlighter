"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.missingReactMemoRule = exports.MissingReactMemoMatcher = void 0;
const types_1 = require("../types");
/**
 * Detects React functional components that could benefit from React.memo
 */
class MissingReactMemoMatcher {
    match(node, context) {
        if (!this.isReactFile(context))
            return false;
        // Check for function declarations that are components
        if (node.type === 'FunctionDeclaration' || node.type === 'ArrowFunctionExpression') {
            const name = this.getFunctionName(node);
            // React components start with uppercase
            if (name && /^[A-Z]/.test(name)) {
                // Check if it returns JSX
                if (this.returnsJSX(node)) {
                    // Check if it's not already wrapped in memo
                    if (!this.isWrappedInMemo(node, context)) {
                        // Check if component is pure (no hooks that would prevent memoization)
                        if (this.isPureComponent(node)) {
                            return true;
                        }
                    }
                }
            }
        }
        return false;
    }
    isReactFile(context) {
        return context.language === 'javascriptreact' ||
            context.language === 'typescriptreact' ||
            context.filePath.includes('.jsx') ||
            context.filePath.includes('.tsx');
    }
    getFunctionName(node) {
        if (node.type === 'FunctionDeclaration') {
            return node.id?.name || null;
        }
        // For arrow functions, check if assigned to a variable
        const parent = node.parent;
        if (parent?.type === 'VariableDeclarator') {
            return parent.id?.name || null;
        }
        return null;
    }
    returnsJSX(node) {
        const body = node.body;
        // Direct return of JSX
        if (body?.type === 'JSXElement' || body?.type === 'JSXFragment') {
            return true;
        }
        // Return statement with JSX
        if (body?.type === 'BlockStatement') {
            const statements = body.body || [];
            for (const stmt of statements) {
                if (stmt.type === 'ReturnStatement' &&
                    (stmt.argument?.type === 'JSXElement' ||
                        stmt.argument?.type === 'JSXFragment' ||
                        stmt.argument?.type === 'ConditionalExpression')) {
                    return true;
                }
            }
        }
        return false;
    }
    isWrappedInMemo(node, context) {
        // Check if the component is wrapped in React.memo
        const sourceCode = context.sourceCode;
        const name = this.getFunctionName(node);
        if (name) {
            // Simple check for React.memo wrapper
            return sourceCode.includes(`React.memo(${name})`) ||
                sourceCode.includes(`memo(${name})`);
        }
        return false;
    }
    isPureComponent(node) {
        // Check if component doesn't use state or complex hooks
        // that would make memoization ineffective
        const body = node.body;
        if (body?.type === 'BlockStatement') {
            const hasStateHooks = this.hasHooks(body, ['useState', 'useReducer', 'useContext']);
            return !hasStateHooks;
        }
        return true;
    }
    hasHooks(node, hookNames) {
        if (node.type === 'CallExpression') {
            const callee = node.callee;
            if (callee?.type === 'Identifier' && hookNames.includes(callee.name)) {
                return true;
            }
        }
        for (const key in node) {
            const value = node[key];
            if (Array.isArray(value)) {
                for (const item of value) {
                    if (item && typeof item === 'object' && this.hasHooks(item, hookNames)) {
                        return true;
                    }
                }
            }
            else if (value && typeof value === 'object' && value.type) {
                if (this.hasHooks(value, hookNames)) {
                    return true;
                }
            }
        }
        return false;
    }
}
exports.MissingReactMemoMatcher = MissingReactMemoMatcher;
const missingReactMemoTemplate = {
    title: '🟠 REACT OPTIMIZATION: Component Could Use React.memo',
    problemDescription: 'This functional component re-renders whenever its parent re-renders, even if props haven\'t changed. React.memo can prevent unnecessary re-renders.',
    impactDescription: 'Without memoization, complex components re-render unnecessarily, impacting performance in large applications.',
    solutionDescription: 'Wrap pure components in React.memo to only re-render when props actually change.',
    codeExamples: [
        {
            title: 'Basic Memoization',
            before: `// Re-renders on every parent render
const UserCard = ({ user, onClick }) => {
  return (
    <div className="user-card">
      <h3>{user.name}</h3>
      <p>{user.email}</p>
      <button onClick={onClick}>View Profile</button>
    </div>
  );
};`,
            after: `// Only re-renders when props change
const UserCard = React.memo(({ user, onClick }) => {
  return (
    <div className="user-card">
      <h3>{user.name}</h3>
      <p>{user.email}</p>
      <button onClick={onClick}>View Profile</button>
    </div>
  );
});

// Or with custom comparison
const UserCard = React.memo(Component, (prevProps, nextProps) => {
  return prevProps.user.id === nextProps.user.id;
});`,
            improvement: 'Prevents unnecessary re-renders'
        },
        {
            title: 'Export Pattern',
            before: `const ExpensiveList = ({ items }) => {
  const processedItems = items.map(complexProcessing);
  
  return (
    <ul>
      {processedItems.map(item => (
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>
  );
};

export default ExpensiveList;`,
            after: `const ExpensiveList = ({ items }) => {
  const processedItems = items.map(complexProcessing);
  
  return (
    <ul>
      {processedItems.map(item => (
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>
  );
};

export default React.memo(ExpensiveList);

// With TypeScript
export default React.memo<ListProps>(ExpensiveList);`,
            improvement: 'Significant performance gain for expensive components'
        }
    ],
    actions: [
        {
            label: 'Copy React.memo Solution',
            type: 'copy',
            payload: 'optimized-code'
        }
    ],
    learnMoreUrl: 'https://react.dev/reference/react/memo'
};
exports.missingReactMemoRule = {
    id: 'missing-react-memo',
    name: 'Missing React Memo',
    description: 'Detects components that could benefit from React.memo',
    category: types_1.PatternCategory.Performance,
    severity: 'info',
    languages: ['javascriptreact', 'typescriptreact'],
    enabled: true,
    matcher: new MissingReactMemoMatcher(),
    template: missingReactMemoTemplate,
    scoreImpact: -5
};
//# sourceMappingURL=missing-react-memo.js.map