import {
  PatternRule,
  PatternMatcher,
  ASTNode,
  MatchContext,
  PatternCategory,
  TooltipTemplate
} from '../types';

class SynchronousXhrMatcher implements PatternMatcher {
  public match(node: ASTNode, _context: MatchContext): boolean {
    if (!node) return false;
    // Match xhr.open(method, url, false)
    if (node.type === 'CallExpression') {
      const callee = (node as any).callee;
      if (callee?.type === 'MemberExpression' && callee.property?.name === 'open') {
        const args = (node as any).arguments || [];
        if (args.length >= 3) {
          const third = args[2];
          // Explicit false literal marks sync XHR
          if (third && (third as any).value === false) {
            return true;
          }
        }
      }
    }
    // new XMLHttpRequest() followed by .open with false is handled by above; here we keep minimal matching
    return false;
  }
}

const template: TooltipTemplate = {
  title: '🔴 PERFORMANCE: Synchronous XHR Detected',
  problemDescription: 'Synchronous XMLHttpRequest blocks the main thread and freezes the UI until the request completes.',
  impactDescription: 'Severe UX degradation, jank, and potential timeouts in the browser.',
  solutionDescription: 'Use async APIs (fetch/await) or async XHR (third parameter true) and handle completion via promises or callbacks.',
  codeExamples: [
    {
      title: 'Replace sync XHR with fetch',
      before: `const xhr = new XMLHttpRequest();
xhr.open('GET', '/api/data', false); // sync ❌
xhr.send();
const res = xhr.responseText;`,
      after: 'const res = await fetch(\'/api/data\').then(r => r.text()); // async ✅',
      improvement: 'Non-blocking request keeps UI responsive'
    }
  ],
  actions: [
    { label: 'Copy fetch example', type: 'copy', payload: 'const res = await fetch(\'/api/data\').then(r => r.text());' }
  ],
  learnMoreUrl: 'https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/Synchronous_and_Asynchronous_Requests'
};

export const synchronousXhrRule: PatternRule = {
  id: 'synchronous-xhr',
  name: 'Synchronous XHR',
  description: 'Detects synchronous XMLHttpRequest usage',
  category: PatternCategory.Performance,
  severity: 'critical',
  languages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact'],
  enabled: true,
  matcher: new SynchronousXhrMatcher(),
  template,
  scoreImpact: -15
};
