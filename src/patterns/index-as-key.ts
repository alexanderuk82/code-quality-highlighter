import {
  PatternRule,
  PatternMatcher,
  ASTNode,
  MatchContext,
  PatternCategory,
  TooltipTemplate
} from '../types';

class IndexAsKeyMatcher implements PatternMatcher {
  public match(node: ASTNode, context: MatchContext): boolean {
    if (!this.isReactFile(context)) return false;
    if (node.type !== 'JSXAttribute') return false;
    const attr: any = node as any;
    if (attr.name?.name !== 'key') return false;

    const value = attr.value;
    if (!value) return false;

    if (value.type === 'JSXExpressionContainer') {
      const expr = (value as any).expression;
      // key={index} or key={i}
      if (expr?.type === 'Identifier') {
        const name = expr.name;
        return name === 'index' || name === 'i' || name === 'idx';
      }
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
  title: '🟠 REACT: Using Array Index as Key',
  problemDescription: 'Using array index as a React key can cause rendering bugs when the list changes order, items are inserted/removed, or filtered.',
  impactDescription: 'State may stick to the wrong item, and updates may be inefficient.',
  solutionDescription: 'Use a stable unique identifier (e.g., id) for keys. If none exists, generate stable keys at data creation time.',
  codeExamples: [
    {
      title: 'Prefer stable ids',
      before: '{items.map((item, index) => <Row key={index} item={item} />)}',
      after: '{items.map((item) => <Row key={item.id} item={item} />)}',
      improvement: 'Stable reconciliation and predictable behavior'
    }
  ],
  actions: [
    { label: 'Copy stable key example', type: 'copy', payload: '{items.map((item) => <Row key={item.id} item={item} />)}' }
  ],
  learnMoreUrl: 'https://react.dev/learn/rendering-lists#keeping-list-items-in-order-with-key'
};

export const indexAsKeyRule: PatternRule = {
  id: 'index-as-key',
  name: 'Index as Key',
  description: 'Detects React list rendering using array index as key',
  category: PatternCategory.Maintainability,
  severity: 'warning',
  languages: ['javascriptreact', 'typescriptreact'],
  enabled: true,
  matcher: new IndexAsKeyMatcher(),
  template,
  scoreImpact: -8
};
