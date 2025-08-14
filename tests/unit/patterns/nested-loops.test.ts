import { NestedLoopMatcher } from '../../../src/patterns/nested-loops';
import { MatchContext, SupportedLanguage } from '../../../src/types';
import { parse } from '@babel/parser';

describe('NestedLoopMatcher', () => {
  let matcher: NestedLoopMatcher;
  let context: MatchContext;

  beforeEach(() => {
    matcher = new NestedLoopMatcher();
    context = {
      filePath: 'test.js',
      language: 'javascript' as SupportedLanguage,
      lineNumber: 1,
      columnNumber: 1,
      sourceCode: ''
    };
  });

  describe('nested for loops', () => {
    it('should detect simple nested for loops', () => {
      const code = `
        for (let i = 0; i < arr1.length; i++) {
          for (let j = 0; j < arr2.length; j++) {
            console.log(arr1[i], arr2[j]);
          }
        }
      `;
      
      const parseResult = parse(code, { sourceType: 'module' });
      const ast = parseResult as any; // Babel File type
      const forStatement = ast.program.body[0]; // Outer for loop
      
      const result = matcher.match(forStatement, context);
      expect(result).toBe(true);
    });

    it('should detect triple nested loops', () => {
      const code = `
        for (let i = 0; i < arr1.length; i++) {
          for (let j = 0; j < arr2.length; j++) {
            for (let k = 0; k < arr3.length; k++) {
              console.log(arr1[i], arr2[j], arr3[k]);
            }
          }
        }
      `;
      
      const parseResult = parse(code, { sourceType: 'module' });
      const ast = parseResult as any;
      const forStatement = ast.program.body[0]; // Outer for loop
      
      const result = matcher.match(forStatement, context);
      expect(result).toBe(true);
    });

    it('should detect for-of nested in for loop', () => {
      const code = `
        for (let i = 0; i < users.length; i++) {
          for (const post of posts) {
            if (users[i].id === post.userId) {
              results.push({user: users[i], post});
            }
          }
        }
      `;
      
      const parseResult = parse(code, { sourceType: 'module' });
      const ast = parseResult as any;
      const forStatement = ast.program.body[0]; // Outer for loop
      
      const result = matcher.match(forStatement, context);
      expect(result).toBe(true);
    });

    it('should detect while loop nested in for loop', () => {
      const code = `
        for (let i = 0; i < arr.length; i++) {
          let j = 0;
          while (j < otherArr.length) {
            console.log(arr[i], otherArr[j]);
            j++;
          }
        }
      `;
      
      const parseResult = parse(code, { sourceType: 'module' });
      const ast = parseResult as any;
      const forStatement = ast.program.body[0]; // Outer for loop
      
      const result = matcher.match(forStatement, context);
      expect(result).toBe(true);
    });
  });

  describe('non-nested loops', () => {
    it('should not detect single for loop', () => {
      const code = `
        for (let i = 0; i < arr.length; i++) {
          console.log(arr[i]);
        }
      `;
      
      const parseResult = parse(code, { sourceType: 'module' });
      const ast = parseResult as any;
      const forStatement = ast.program.body[0];
      
      const result = matcher.match(forStatement, context);
      expect(result).toBe(false);
    });

    it('should not detect sequential loops', () => {
      const code = `
        for (let i = 0; i < arr1.length; i++) {
          console.log(arr1[i]);
        }
        for (let j = 0; j < arr2.length; j++) {
          console.log(arr2[j]);
        }
      `;
      
      const parseResult = parse(code, { sourceType: 'module' });
      const ast = parseResult as any;
      const firstForStatement = ast.program.body[0];
      const secondForStatement = ast.program.body[1];
      
      expect(matcher.match(firstForStatement, context)).toBe(false);
      expect(matcher.match(secondForStatement, context)).toBe(false);
    });

    it('should not detect loop with function call that contains loop', () => {
      const code = `
        for (let i = 0; i < arr.length; i++) {
          processItem(arr[i]);
        }
        
        function processItem(item) {
          for (let j = 0; j < item.children.length; j++) {
            console.log(item.children[j]);
          }
        }
      `;
      
      const parseResult = parse(code, { sourceType: 'module' });
      const ast = parseResult as any;
      const forStatement = ast.program.body[0]; // The first for loop
      
      const result = matcher.match(forStatement, context);
      expect(result).toBe(false);
    });
  });

  describe('complex nesting scenarios', () => {
    it('should detect nested loops inside if statements', () => {
      const code = `
        for (let i = 0; i < arr1.length; i++) {
          if (someCondition) {
            for (let j = 0; j < arr2.length; j++) {
              console.log(arr1[i], arr2[j]);
            }
          }
        }
      `;
      
      const parseResult = parse(code, { sourceType: 'module' });
      const ast = parseResult as any;
      const forStatement = ast.program.body[0];
      
      const result = matcher.match(forStatement, context);
      expect(result).toBe(true);
    });

    it('should detect nested loops inside try-catch', () => {
      const code = `
        for (let i = 0; i < arr1.length; i++) {
          try {
            for (let j = 0; j < arr2.length; j++) {
              riskyOperation(arr1[i], arr2[j]);
            }
          } catch (error) {
            console.error(error);
          }
        }
      `;
      
      const parseResult = parse(code, { sourceType: 'module' });
      const ast = parseResult as any;
      const forStatement = ast.program.body[0];
      
      const result = matcher.match(forStatement, context);
      expect(result).toBe(true);
    });

    it('should handle empty loop bodies', () => {
      const code = `
        for (let i = 0; i < arr1.length; i++) {
          for (let j = 0; j < arr2.length; j++) {
            // Empty body
          }
        }
      `;
      
      const parseResult = parse(code, { sourceType: 'module' });
      const ast = parseResult as any;
      const forStatement = ast.program.body[0];
      
      const result = matcher.match(forStatement, context);
      expect(result).toBe(true);
    });
  });

  describe('getMatchDetails', () => {
    it('should return correct complexity for double nested loops', () => {
      const code = `
        for (let i = 0; i < arr1.length; i++) {
          for (let j = 0; j < arr2.length; j++) {
            console.log(arr1[i], arr2[j]);
          }
        }
      `;
      
      const parseResult = parse(code, { sourceType: 'module' });
      const ast = parseResult as any;
      const forStatement = ast.program.body[0];
      
      const details = matcher.getMatchDetails(forStatement, context);
      expect(details.complexity).toBe(2);
      expect(details.impact).toContain('O(n^2)');
    });

    it('should return correct complexity for triple nested loops', () => {
      const code = `
        for (let i = 0; i < arr1.length; i++) {
          for (let j = 0; j < arr2.length; j++) {
            for (let k = 0; k < arr3.length; k++) {
              console.log(arr1[i], arr2[j], arr3[k]);
            }
          }
        }
      `;
      
      const parseResult = parse(code, { sourceType: 'module' });
      const ast = parseResult as any;
      const forStatement = ast.program.body[0];
      
      const details = matcher.getMatchDetails(forStatement, context);
      expect(details.complexity).toBe(3);
      expect(details.impact).toContain('O(n^3)');
    });

    it('should provide meaningful suggestions', () => {
      const code = `
        for (let i = 0; i < arr1.length; i++) {
          for (let j = 0; j < arr2.length; j++) {
            console.log(arr1[i], arr2[j]);
          }
        }
      `;
      
      const parseResult = parse(code, { sourceType: 'module' });
      const ast = parseResult as any;
      const forStatement = ast.program.body[0];
      
      const details = matcher.getMatchDetails(forStatement, context);
      expect(details.suggestion).toContain('hash maps');
    });
  });

  describe('edge cases', () => {
    it('should handle malformed AST nodes gracefully', () => {
      const malformedNode = { type: 'ForStatement' }; // Missing required properties
      
      expect(() => {
        matcher.match(malformedNode, context);
      }).not.toThrow();
    });

    it('should handle null/undefined nodes', () => {
      expect(() => {
        matcher.match(null as any, context);
      }).not.toThrow();
      
      expect(() => {
        matcher.match(undefined as any, context);
      }).not.toThrow();
    });

    it('should return false for non-loop nodes', () => {
      const code = `
        const x = 5;
        function test() {
          return x * 2;
        }
      `;
      
      const parseResult = parse(code, { sourceType: 'module' });
      const ast = parseResult as any;
      const variableDeclaration = ast.program.body[0];
      const functionDeclaration = ast.program.body[1];
      
      expect(matcher.match(variableDeclaration, context)).toBe(false);
      expect(matcher.match(functionDeclaration, context)).toBe(false);
    });
  });
});
