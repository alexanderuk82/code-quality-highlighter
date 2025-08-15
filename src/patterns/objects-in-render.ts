import {
  PatternRule,
  PatternMatcher,
  ASTNode,
  MatchContext,
  PatternCategory,
  TooltipTemplate
} from '../types';

class ObjectsInRenderMatcher implements PatternMatcher {
  public match(node: ASTNode, context: MatchContext): boolean {
    if (!this.isReactFile(context)) return false;
    if (node.type !== 'JSXAttribute') return false;
    const value: any = (node as any).value;
    if (!value || value.type !== 'JSXExpressionContainer') return false;
    const expr = value.expression;
    // Object or array literals inline in props
    if (expr?.type === 'ObjectExpression' || expr?.type === 'ArrayExpression') {
      return true;
    }
    return false;
  }

  private isReactFile(context: MatchContext): boolean {
    return context.language === 'javascriptreact' ||
           context.language === 'typescriptreact' ||
           context.filePath.endsWith('.jsx') ||
           context.filePath.endsWith('.tsx');
  }
}

const template: TooltipTemplate = {
  title: '🟠 REACT PERFORMANCE: Objects/Arrays Created in Render',
  problemDescription: 'Creating object/array literals directly in JSX props creates new references every render, breaking memoization.',
  impactDescription: 'Child components re-render unnecessarily when props change by reference.',
  solutionDescription: 'Memoize objects/arrays with useMemo or move them out of render.',
  codeExamples: [
    {
      title: 'Memoize style object',
      before: '<div style={{ color: theme.primary, padding: 8 }} /> // new object each render ❌',
      after: `const style = useMemo(() => ({ color: theme.primary, padding: 8 }), [theme.primary]);
<div style={style} /> // stable ✅`,
      improvement: 'Stable prop identity preserves memoization'
    }
  ],
  actions: [
    { label: 'Copy useMemo snippet', type: 'copy', payload: 'const memo = useMemo(() => ({/* ... */}), [/* deps */]);' }
  ],
  learnMoreUrl: 'https://react.dev/reference/react/useMemo'
};

export const objectsInRenderRule: PatternRule = {
  id: 'objects-in-render',
  name: 'Objects in Render',
  description: 'Detects object/array literals in JSX props',
  category: PatternCategory.Performance,
  severity: 'warning',
  languages: ['javascriptreact', 'typescriptreact'],
  enabled: true,
  matcher: new ObjectsInRenderMatcher(),
  template,
  scoreImpact: -8
};
