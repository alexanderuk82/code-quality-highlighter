import { parse } from '@babel/parser';
import { MatchContext, SupportedLanguage } from '../../../src/types';
import { objectsInRenderRule } from '../../../src/patterns/objects-in-render';

const matcher: any = (objectsInRenderRule as any).matcher;

describe('objects-in-render', () => {
  const context: MatchContext = {
    filePath: 'test.tsx',
    language: 'typescriptreact' as SupportedLanguage,
    lineNumber: 1,
    columnNumber: 1,
    sourceCode: ''
  };

  it('detects object literal in JSX prop', () => {
    const code = `const C = () => <div style={{color:'red'}} />;`;
    const ast: any = parse(code, { sourceType: 'module', plugins: ['typescript', 'jsx'] });
  // Arrow body is a JSXElement directly (no .expression)
  const jsxAttr = ast.program.body[0].declarations[0].init.body.openingElement.attributes[0];
    expect(matcher.match(jsxAttr, context)).toBe(true);
  });

  it('ignores stable reference props', () => {
    const code = `const style = {}; const C = () => <div style={style} />;`;
    const ast: any = parse(code, { sourceType: 'module', plugins: ['typescript', 'jsx'] });
  const jsxAttr = ast.program.body[1].declarations[0].init.body.openingElement.attributes[0];
    expect(matcher.match(jsxAttr, context)).toBe(false);
  });
});
