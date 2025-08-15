import {
  PatternRule,
  PatternMatcher,
  ASTNode,
  MatchContext,
  PatternCategory,
  TooltipTemplate
} from '../types';

/**
 * Detects inline arrow functions in JSX props (React performance issue)
 */
export class InlineFunctionPropsMatcher implements PatternMatcher {
  public match(node: ASTNode, context: MatchContext): boolean {
    // Only check in React files
    if (!this.isReactFile(context)) return false;

    // Check if this is a JSX attribute
    if (node.type !== 'JSXAttribute') return false;

    const value = (node as any).value;
    if (!value) return false;

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

  public getMatchDetails(_node: ASTNode, _context: MatchContext) {
    return {
      impact: 'Inline functions create a new reference every render and can break memoization of children.',
      suggestion: 'Wrap the handler with useCallback or move it outside the render path to keep a stable reference.',
      fix: {
        type: 'copy' as const,
        title: 'useCallback handler template',
        text: '// In the component body\nconst handleClick = React.useCallback((...args) => {\n  // logic here\n}, []);\n\n// In JSX\n<Button onClick={handleClick}>Click</Button>'
      }
    } as const;
  }

  private isReactFile(context: MatchContext): boolean {
    return context.language === 'javascriptreact' ||
           context.language === 'typescriptreact' ||
           context.filePath.includes('.jsx') ||
           context.filePath.includes('.tsx');
  }

  private isSimpleReference(node: ASTNode): boolean {
    // Check if it's just a simple function that returns a prop or constant
    const body = (node as any).body;
    if (body?.type === 'Identifier' ||
        body?.type === 'Literal' ||
        (body?.type === 'MemberExpression' && !this.hasNestedCalls(body))) {
      return true;
    }
    return false;
  }

  private hasNestedCalls(node: ASTNode): boolean {
    if (node.type === 'CallExpression') return true;

    for (const key in node) {
      const value = (node as any)[key];
      if (value && typeof value === 'object' && value.type) {
        if (this.hasNestedCalls(value)) return true;
      }
    }
    return false;
  }
}

const inlineFunctionPropsTemplate: TooltipTemplate = {
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

export const inlineFunctionPropsRule: PatternRule = {
  id: 'inline-function-props',
  name: 'Inline Function Props',
  description: 'Detects inline functions in React component props',
  category: PatternCategory.Performance,
  severity: 'warning',
  languages: ['javascriptreact', 'typescriptreact'],
  enabled: true,
  matcher: new InlineFunctionPropsMatcher(),
  template: inlineFunctionPropsTemplate,
  scoreImpact: -10
};
