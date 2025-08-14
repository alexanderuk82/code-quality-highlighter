import { parse } from '@babel/parser';
import { File } from '@babel/types';
import { MultipleArrayIterationsMatcher } from '../../../src/patterns/multiple-array-iterations';
import { MatchContext } from '../../../src/types';

describe('MultipleArrayIterationsMatcher', () => {
  let matcher: MultipleArrayIterationsMatcher;
  let context: MatchContext;

  beforeEach(() => {
    matcher = new MultipleArrayIterationsMatcher();
    context = {
      filePath: 'test.js',
      language: 'javascript',
      lineNumber: 1,
      columnNumber: 1,
      sourceCode: '',
      surroundingCode: ''
    };
  });

  // Helper function to find call expressions
  function findCallExpression(ast: File, methodName: string) {
    let found: any = null;
    
    function traverse(node: any) {
      if (node && typeof node === 'object') {
        if (node.type === 'CallExpression' && 
            node.callee?.type === 'MemberExpression' &&
            node.callee?.property?.name === methodName) {
          found = node;
          return;
        }
        
        for (const key in node) {
          if (Array.isArray(node[key])) {
            node[key].forEach(traverse);
          } else if (node[key] && typeof node[key] === 'object') {
            traverse(node[key]);
          }
        }
      }
    }
    
    traverse(ast);
    return found;
  }

  describe('chained array methods', () => {
    it('should detect map().filter() chain', () => {
      const code = `
        const result = users
          .map(user => user.name)
          .filter(name => name.length > 3);
      `;
      
      context.sourceCode = code;
      const parseResult = parse(code, { sourceType: 'module' });
      const ast = parseResult as File;
      const callExpression = findCallExpression(ast, 'filter');
      
      const result = matcher.match(callExpression, context);
      expect(result).toBe(true);
    });

    it('should detect map().filter().reduce() chain', () => {
      const code = `
        const total = data
          .map(item => item.value)
          .filter(value => value > 0)
          .reduce((sum, value) => sum + value, 0);
      `;
      
      context.sourceCode = code;
      const parseResult = parse(code, { sourceType: 'module' });
      const ast = parseResult as File;
      const callExpression = findCallExpression(ast, 'reduce');
      
      const result = matcher.match(callExpression, context);
      expect(result).toBe(true);
    });

    it('should detect long chains', () => {
      const code = `
        const result = array
          .map(x => x * 2)
          .filter(x => x > 10)
          .sort((a, b) => a - b)
          .slice(0, 5)
          .reverse();
      `;
      
      context.sourceCode = code;
      const parseResult = parse(code, { sourceType: 'module' });
      const ast = parseResult as File;
      const callExpression = findCallExpression(ast, 'reverse');
      
      const result = matcher.match(callExpression, context);
      expect(result).toBe(true);
    });
  });

  describe('single method calls', () => {
    it('should not detect single map() call', () => {
      const code = `
        const names = users.map(user => user.name);
      `;
      
      context.sourceCode = code;
      const parseResult = parse(code, { sourceType: 'module' });
      const ast = parseResult as File;
      const callExpression = findCallExpression(ast, 'map');
      
      const result = matcher.match(callExpression, context);
      expect(result).toBe(false);
    });

    it('should not detect single filter() call', () => {
      const code = `
        const active = users.filter(user => user.active);
      `;
      
      context.sourceCode = code;
      const parseResult = parse(code, { sourceType: 'module' });
      const ast = parseResult as File;
      const callExpression = findCallExpression(ast, 'filter');
      
      const result = matcher.match(callExpression, context);
      expect(result).toBe(false);
    });
  });

  describe('non-chainable methods', () => {
    it('should not detect forEach() as chainable', () => {
      const code = `
        users.forEach(user => console.log(user.name));
      `;
      
      context.sourceCode = code;
      const parseResult = parse(code, { sourceType: 'module' });
      const ast = parseResult as File;
      const callExpression = findCallExpression(ast, 'forEach');
      
      const result = matcher.match(callExpression, context);
      expect(result).toBe(false);
    });

    it('should not detect find() as chainable', () => {
      const code = `
        const user = users.find(user => user.id === 1);
      `;
      
      context.sourceCode = code;
      const parseResult = parse(code, { sourceType: 'module' });
      const ast = parseResult as File;
      const callExpression = findCallExpression(ast, 'find');
      
      const result = matcher.match(callExpression, context);
      expect(result).toBe(false);
    });
  });

  describe('getMatchDetails', () => {
    it('should return correct details for map().filter() chain', () => {
      const code = `
        const result = users
          .map(user => user.name)
          .filter(name => name.length > 3);
      `;
      
      context.sourceCode = code;
      const parseResult = parse(code, { sourceType: 'module' });
      const ast = parseResult as File;
      const callExpression = findCallExpression(ast, 'filter');
      
      const details = matcher.getMatchDetails(callExpression, context);
      
      expect(details.complexity).toBeGreaterThan(2);
      expect(details.impact).toContain('2 separate iterations');
      expect(details.impact).toContain('users');
      expect(details.suggestion).toContain('reduce()');
    });

    it('should return correct details for long chain', () => {
      const code = `
        const result = data
          .map(x => x * 2)
          .filter(x => x > 0)
          .reduce((sum, x) => sum + x, 0);
      `;
      
      context.sourceCode = code;
      const parseResult = parse(code, { sourceType: 'module' });
      const ast = parseResult as File;
      const callExpression = findCallExpression(ast, 'reduce');
      
      const details = matcher.getMatchDetails(callExpression, context);
      
      expect(details.complexity).toBeGreaterThan(4);
      expect(details.impact).toContain('3 separate iterations');
      expect(details.suggestion).toContain('single');
    });
  });

  describe('edge cases', () => {
    it('should handle nested method calls', () => {
      const code = `
        const result = users
          .map(user => user.posts.filter(post => post.published))
          .filter(posts => posts.length > 0);
      `;
      
      context.sourceCode = code;
      const parseResult = parse(code, { sourceType: 'module' });
      const ast = parseResult as File;
      const callExpression = findCallExpression(ast, 'filter');
      
      // Should detect the outer chain, not the inner filter
      const result = matcher.match(callExpression, context);
      expect(result).toBe(true);
    });

    it('should handle malformed nodes gracefully', () => {
      const malformedNode = {
        type: 'CallExpression',
        callee: null
      };
      
      const result = matcher.match(malformedNode, context);
      expect(result).toBe(false);
    });

    it('should handle non-array method calls', () => {
      const code = `
        const result = obj.method1().method2();
      `;
      
      context.sourceCode = code;
      const parseResult = parse(code, { sourceType: 'module' });
      const ast = parseResult as File;
      const callExpression = findCallExpression(ast, 'method2');
      
      const result = matcher.match(callExpression, context);
      expect(result).toBe(false);
    });
  });
});
