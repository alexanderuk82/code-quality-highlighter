import { parse } from '@babel/parser';
import { MatchContext, SupportedLanguage } from '../../../src/types';
import { synchronousXhrRule } from '../../../src/patterns/synchronous-xhr';

const matcher: any = (synchronousXhrRule as any).matcher;

describe('synchronous-xhr', () => {
  const context: MatchContext = {
    filePath: 'test.js',
    language: 'javascript' as SupportedLanguage,
    lineNumber: 1,
    columnNumber: 1,
    sourceCode: ''
  };

  it('detects xhr.open with false (sync)', () => {
    const code = `const xhr = new XMLHttpRequest(); xhr.open('GET', '/a', false);`;
    const ast: any = parse(code, { sourceType: 'module' });
    const stmt = ast.program.body[1].expression; // xhr.open(...)
    expect(matcher.match(stmt, context)).toBe(true);
  });

  it('does not flag async xhr', () => {
    const code = `const xhr = new XMLHttpRequest(); xhr.open('GET', '/a', true);`;
    const ast: any = parse(code, { sourceType: 'module' });
    const stmt = ast.program.body[1].expression;
    expect(matcher.match(stmt, context)).toBe(false);
  });
});
