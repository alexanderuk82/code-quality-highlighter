import { parse } from '@babel/parser';
import { File } from '@babel/types';
import { InfiniteRecursionRisksMatcher } from '../../../src/patterns/infinite-recursion-risks';
import { MatchContext } from '../../../src/types';

describe('InfiniteRecursionRisksMatcher', () => {
  let matcher: InfiniteRecursionRisksMatcher;
  let context: MatchContext;

  beforeEach(() => {
    matcher = new InfiniteRecursionRisksMatcher();
    context = {
      filePath: 'test.js',
      language: 'javascript',
      lineNumber: 1,
      columnNumber: 1,
      sourceCode: '',
      surroundingCode: ''
    };
  });

  // Helper function to find function declarations
  function findFunctionDeclaration(ast: File, functionName: string) {
    let found: any = null;
    
    function traverse(node: any) {
      if (node && typeof node === 'object') {
        if (node.type === 'FunctionDeclaration' && 
            node.id?.name === functionName) {
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

  describe('functions with recursion risks', () => {
    it('should detect function without base case', () => {
      const code = `
        function factorial(n) {
          return n * factorial(n - 1);
        }
      `;
      
      context.sourceCode = code;
      const parseResult = parse(code, { sourceType: 'module' });
      const ast = parseResult as File;
      const functionDeclaration = findFunctionDeclaration(ast, 'factorial');
      
      const result = matcher.match(functionDeclaration, context);
      expect(result).toBe(true);
    });

    it('should detect function with infinite loop risk', () => {
      const code = `
        function countdown() {
          console.log('counting...');
          countdown();
        }
      `;
      
      context.sourceCode = code;
      const parseResult = parse(code, { sourceType: 'module' });
      const ast = parseResult as File;
      const functionDeclaration = findFunctionDeclaration(ast, 'countdown');
      
      const result = matcher.match(functionDeclaration, context);
      expect(result).toBe(true);
    });

    it('should detect function without parameter modification', () => {
      const code = `
        function process(data) {
          if (data.length > 1000) {
            return process(data); // Same parameter!
          }
          return data;
        }
      `;
      
      context.sourceCode = code;
      const parseResult = parse(code, { sourceType: 'module' });
      const ast = parseResult as File;
      const functionDeclaration = findFunctionDeclaration(ast, 'process');
      
      const result = matcher.match(functionDeclaration, context);
      expect(result).toBe(true);
    });

    it('should detect function lacking depth limits', () => {
      const code = `
        function traverse(node) {
          console.log(node.value);
          if (node.children) {
            node.children.forEach(child => traverse(child));
          }
        }
      `;
      
      context.sourceCode = code;
      const parseResult = parse(code, { sourceType: 'module' });
      const ast = parseResult as File;
      const functionDeclaration = findFunctionDeclaration(ast, 'traverse');
      
      const result = matcher.match(functionDeclaration, context);
      expect(result).toBe(true);
    });
  });

  describe('safe recursive functions', () => {
    it('should not detect function with proper base case', () => {
      const code = `
        function factorial(n) {
          if (n <= 1) return 1;
          return n * factorial(n - 1);
        }
      `;
      
      context.sourceCode = code;
      const parseResult = parse(code, { sourceType: 'module' });
      const ast = parseResult as File;
      const functionDeclaration = findFunctionDeclaration(ast, 'factorial');
      
      const result = matcher.match(functionDeclaration, context);
      expect(result).toBe(false);
    });

    it('should not detect function with depth limiting', () => {
      const code = `
        function traverse(node, depth = 0, maxDepth = 100) {
          if (depth > maxDepth) return;
          console.log(node.value);
          if (node.children) {
            node.children.forEach(child => 
              traverse(child, depth + 1, maxDepth)
            );
          }
        }
      `;
      
      context.sourceCode = code;
      const parseResult = parse(code, { sourceType: 'module' });
      const ast = parseResult as File;
      const functionDeclaration = findFunctionDeclaration(ast, 'traverse');
      
      const result = matcher.match(functionDeclaration, context);
      expect(result).toBe(false);
    });

    it('should not detect non-recursive functions', () => {
      const code = `
        function process(data) {
          return data.map(item => item * 2);
        }
      `;
      
      context.sourceCode = code;
      const parseResult = parse(code, { sourceType: 'module' });
      const ast = parseResult as File;
      const functionDeclaration = findFunctionDeclaration(ast, 'process');
      
      const result = matcher.match(functionDeclaration, context);
      expect(result).toBe(false);
    });

    it('should not detect function with multiple return paths', () => {
      const code = `
        function fibonacci(n) {
          if (n <= 0) return 0;
          if (n === 1) return 1;
          return fibonacci(n - 1) + fibonacci(n - 2);
        }
      `;
      
      context.sourceCode = code;
      const parseResult = parse(code, { sourceType: 'module' });
      const ast = parseResult as File;
      const functionDeclaration = findFunctionDeclaration(ast, 'fibonacci');
      
      const result = matcher.match(functionDeclaration, context);
      expect(result).toBe(false);
    });
  });

  describe('getMatchDetails', () => {
    it('should return correct details for function without base case', () => {
      const code = `
        function badRecursion(n) {
          return badRecursion(n - 1);
        }
      `;
      
      context.sourceCode = code;
      const parseResult = parse(code, { sourceType: 'module' });
      const ast = parseResult as File;
      const functionDeclaration = findFunctionDeclaration(ast, 'badRecursion');
      
      const details = matcher.getMatchDetails(functionDeclaration, context);
      
      expect(details.complexity).toBe(10); // Highest risk
      expect(details.impact).toContain('badRecursion');
      expect(details.impact).toContain('lacks clear base case');
      expect(details.suggestion).toContain('Add clear base case');
    });

    it('should return correct details for function lacking depth limits', () => {
      const code = `
        function traverse(node) {
          if (node.children) {
            node.children.forEach(child => traverse(child));
          }
        }
      `;
      
      context.sourceCode = code;
      const parseResult = parse(code, { sourceType: 'module' });
      const ast = parseResult as File;
      const functionDeclaration = findFunctionDeclaration(ast, 'traverse');
      
      const details = matcher.getMatchDetails(functionDeclaration, context);
      
      expect(details.complexity).toBe(8);
      expect(details.impact).toContain('traverse');
      expect(details.impact).toContain('lacks depth limiting');
      expect(details.suggestion).toContain('depth/counter parameter');
    });
  });

  describe('edge cases', () => {
    it('should handle arrow functions', () => {
      const code = `
        const factorial = (n) => {
          return n * factorial(n - 1);
        };
      `;
      
      context.sourceCode = code;
      const parseResult = parse(code, { sourceType: 'module' });
      const ast = parseResult as File;
      
      // Find arrow function expression
      let arrowFunction: any = null;
      function findArrowFunction(node: any) {
        if (node && typeof node === 'object') {
          if (node.type === 'ArrowFunctionExpression') {
            arrowFunction = node;
            return;
          }
          for (const key in node) {
            if (Array.isArray(node[key])) {
              node[key].forEach(findArrowFunction);
            } else if (node[key] && typeof node[key] === 'object') {
              findArrowFunction(node[key]);
            }
          }
        }
      }
      findArrowFunction(ast);
      
      const result = matcher.match(arrowFunction, context);
      expect(result).toBe(true);
    });

    it('should handle function expressions', () => {
      const code = `
        const func = function recursiveFunc(n) {
          return recursiveFunc(n - 1);
        };
      `;
      
      context.sourceCode = code;
      const parseResult = parse(code, { sourceType: 'module' });
      const ast = parseResult as File;
      
      // Find function expression
      let functionExpression: any = null;
      function findFunctionExpression(node: any) {
        if (node && typeof node === 'object') {
          if (node.type === 'FunctionExpression') {
            functionExpression = node;
            return;
          }
          for (const key in node) {
            if (Array.isArray(node[key])) {
              node[key].forEach(findFunctionExpression);
            } else if (node[key] && typeof node[key] === 'object') {
              findFunctionExpression(node[key]);
            }
          }
        }
      }
      findFunctionExpression(ast);
      
      const result = matcher.match(functionExpression, context);
      expect(result).toBe(true);
    });

    it('should handle malformed nodes gracefully', () => {
      const malformedNode = {
        type: 'FunctionDeclaration',
        id: null,
        body: null
      };
      
      const result = matcher.match(malformedNode, context);
      expect(result).toBe(false);
    });

    it('should handle functions with complex control flow', () => {
      const code = `
        function complexRecursion(n, acc = 0) {
          if (n <= 0) return acc;
          if (n % 2 === 0) {
            return complexRecursion(n / 2, acc + 1);
          } else {
            return complexRecursion(n - 1, acc + 1);
          }
        }
      `;
      
      context.sourceCode = code;
      const parseResult = parse(code, { sourceType: 'module' });
      const ast = parseResult as File;
      const functionDeclaration = findFunctionDeclaration(ast, 'complexRecursion');
      
      const result = matcher.match(functionDeclaration, context);
      expect(result).toBe(false); // Should be safe due to base case
    });
  });
});
