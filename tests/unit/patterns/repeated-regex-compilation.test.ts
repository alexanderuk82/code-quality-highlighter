import { parse } from '@babel/parser';
import { MatchContext, SupportedLanguage } from '../../../src/types';
import { repeatedRegexCompilationRule } from '../../../src/patterns/repeated-regex-compilation';

const matcher: any = (repeatedRegexCompilationRule as any).matcher;

describe('repeated-regex-compilation', () => {
  const context: MatchContext = {
    filePath: 'test.js',
    language: 'javascript' as SupportedLanguage,
    lineNumber: 1,
    columnNumber: 1,
    sourceCode: ''
  };

  it('detects new RegExp within a loop', () => {
    const code = `for (let i=0;i<10;i++){ const r = new RegExp('^a'); }`;
    const ast: any = parse(code, { sourceType: 'module' });
    const loop = ast.program.body[0];
    expect(matcher.match(loop, context)).toBe(true);
  });

  it('does not flag regex outside loops', () => {
    const code = `const r = new RegExp('^a'); for (let i=0;i<10;i++){ count++; }`;
    const ast: any = parse(code, { sourceType: 'module' });
    const loop = ast.program.body[1];
    expect(matcher.match(loop, context)).toBe(false);
  });
});
