import { parse } from '@babel/parser';
import { MatchContext, SupportedLanguage } from '../../../src/types';
import { indexAsKeyRule } from '../../../src/patterns/index-as-key';

const matcher: any = (indexAsKeyRule as any).matcher;

describe('index-as-key', () => {
  const context: MatchContext = {
    filePath: 'test.tsx',
    language: 'typescriptreact' as SupportedLanguage,
    lineNumber: 1,
    columnNumber: 1,
    sourceCode: ''
  };

  it('detects key={index}', () => {
    const code = `const C = ({items}) => items.map((item, index) => <li key={index}>{item}</li>);`;
    const ast: any = parse(code, { sourceType: 'module', plugins: ['typescript', 'jsx'] });
  // Arrow body of outer arrow is CallExpression; inner arrow returns JSXElement directly
  const attr = ast.program.body[0].declarations[0].init.body.arguments[0].body.openingElement.attributes[0];
  expect(matcher.match(attr, context)).toBe(true);
  // expect(matcher.match(jsxAttr, context)).toBe(true); // Removed as per the patch intent
  });

  it('does not flag key={item.id}', () => {
    const code = `const C = ({items}) => items.map((item) => <li key={item.id}>{item}</li>);`;
    const ast: any = parse(code, { sourceType: 'module', plugins: ['typescript', 'jsx'] });
  const attr = ast.program.body[0].declarations[0].init.body.arguments[0].body.openingElement.attributes[0];
  expect(matcher.match(attr, context)).toBe(false);
  });
});
