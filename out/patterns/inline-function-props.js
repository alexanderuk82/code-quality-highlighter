"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inlineFunctionPropsRule = exports.InlineFunctionPropsMatcher = void 0;
const types_1 = require("../types");
/**
 * Detects inline arrow functions in JSX props (React performance issue)
 */
class InlineFunctionPropsMatcher {
    match(node, context) {
        // Only check in React files
        if (!this.isReactFile(context))
            return false;
        // Check if this is a JSX attribute
        if (node.type !== 'JSXAttribute')
            return false;
        const value = node.value;
        if (!value)
            return false;
        // Check if value is JSXExpressionContainer with arrow function
        if (value.type === 'JSXExpressionContainer') {
            const expression = value.expression;
            if (expression?.type === 'ArrowFunctionExpression' ||
                expression?.type === 'FunctionExpression') {
                // Check if it's not a simple reference (e.g., not just passing a prop)
                if (!this.isSimpleReference(expression)) {
                    return true;
                }
            }
            // Also check for inline bind() calls
            if (expression?.type === 'CallExpression') {
                const callee = expression.callee;
                if (callee?.type === 'MemberExpression' &&
                    callee.property?.name === 'bind') {
                    return true;
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
    isSimpleReference(node) {
        // Check if it's just a simple function that returns a prop or constant
        const body = node.body;
        if (body?.type === 'Identifier' ||
            body?.type === 'Literal' ||
            (body?.type === 'MemberExpression' && !this.hasNestedCalls(body))) {
            return true;
        }
        return false;
    }
    hasNestedCalls(node) {
        if (node.type === 'CallExpression')
            return true;
        for (const key in node) {
            const value = node[key];
            if (value && typeof value === 'object' && value.type) {
                if (this.hasNestedCalls(value))
                    return true;
            }
        }
        return false;
    }
}
exports.InlineFunctionPropsMatcher = InlineFunctionPropsMatcher;
const inlineFunctionPropsTemplate = {
    title: '🔴 REACT PERFORMANCE: Inline Function in Props',
    problemDescription: 'Creating functions inline in JSX props causes React to create a new function instance on every render, breaking memoization and causing unnecessary re-renders of child components.',
    impactDescription: 'Child components using React.memo or PureComponent will re-render on every parent render, defeating optimization.',
    solutionDescription: 'Define functions outside render, use useCallback hook, or pass data via props instead of callbacks.',
    codeExamples: [
        {
            title: 'Event Handler Optimization',
            before: `// Creates new function every render
<Button onClick={() => handleClick(item.id)}>
  Click me
</Button>

// Also problematic with bind
<Button onClick={handleClick.bind(this, item.id)}>
  Click me
</Button>`,
            after: `// Option 1: useCallback hook
const handleItemClick = useCallback((id) => {
  handleClick(id);
}, []);

<Button onClick={handleItemClick} data-id={item.id}>
  Click me
</Button>

// Option 2: Stable reference
const handleItemClick = useCallback(() => {
  handleClick(item.id);
}, [item.id]);

<Button onClick={handleItemClick}>
  Click me
</Button>`,
            improvement: 'Prevents unnecessary re-renders'
        },
        {
            title: 'Array Mapping Optimization',
            before: `// Creates new function for each item
{items.map(item => (
  <Item 
    key={item.id}
    onClick={() => deleteItem(item.id)}
    onEdit={() => editItem(item.id)}
  />
))}`,
            after: `// Option 1: Move logic to child component
{items.map(item => (
  <Item 
    key={item.id}
    item={item}
    onDelete={deleteItem}
    onEdit={editItem}
  />
))}

// In Item component:
const handleDelete = () => onDelete(item.id);
const handleEdit = () => onEdit(item.id);

// Option 2: Memoized component
const MemoizedItem = React.memo(Item);`,
            improvement: 'Reduces renders from N*M to N'
        }
    ],
    actions: [
        {
            label: 'Copy useCallback Solution',
            type: 'copy',
            payload: 'optimized-code'
        }
    ],
    learnMoreUrl: 'https://react.dev/reference/react/useCallback'
};
exports.inlineFunctionPropsRule = {
    id: 'inline-function-props',
    name: 'Inline Function Props',
    description: 'Detects inline functions in React component props',
    category: types_1.PatternCategory.Performance,
    severity: 'warning',
    languages: ['javascriptreact', 'typescriptreact'],
    enabled: true,
    matcher: new InlineFunctionPropsMatcher(),
    template: inlineFunctionPropsTemplate,
    scoreImpact: -10
};
//# sourceMappingURL=inline-function-props.js.map