import { DOMQueriesInLoopsMatcher } from '../../../src/patterns/dom-queries-in-loops';
import { MatchContext, SupportedLanguage } from '../../../src/types';
import { parse } from '@babel/parser';
import { File } from '@babel/types';

describe('DOMQueriesInLoopsMatcher', () => {
  let matcher: DOMQueriesInLoopsMatcher;
  let context: MatchContext;

  beforeEach(() => {
    matcher = new DOMQueriesInLoopsMatcher();
    context = {
      filePath: 'test.js',
      language: 'javascript' as SupportedLanguage,
      lineNumber: 1,
      columnNumber: 1,
      sourceCode: ''
    };
  });

  describe('DOM query methods in loops', () => {
    it('should detect querySelector in for loop', () => {
      const code = `
        for (let i = 0; i < items.length; i++) {
          const element = document.querySelector('.item');
          element.textContent = items[i].name;
        }
      `;
      
      context.sourceCode = code;
      const parseResult = parse(code, { sourceType: 'module' });
      const ast = parseResult as File;
      const callExpression = findCallExpression(ast, 'querySelector');
      
      const result = matcher.match(callExpression, context);
      expect(result).toBe(true);
    });

    it('should detect getElementById in while loop', () => {
      const code = `
        let i = 0;
        while (i < items.length) {
          const container = document.getElementById('container');
          container.appendChild(items[i]);
          i++;
        }
      `;
      
      context.sourceCode = code;
      const parseResult = parse(code, { sourceType: 'module' });
      const ast = parseResult as File;
      const callExpression = findCallExpression(ast, 'getElementById');
      
      const result = matcher.match(callExpression, context);
      expect(result).toBe(true);
    });

    it('should detect querySelectorAll in forEach', () => {
      const code = `
        items.forEach(item => {
          const elements = document.querySelectorAll('.item');
          elements.forEach(el => el.remove());
        });
      `;
      
      context.sourceCode = code;
      const parseResult = parse(code, { sourceType: 'module' });
      const ast = parseResult as File;
      const callExpression = findCallExpression(ast, 'querySelectorAll');
      
      const result = matcher.match(callExpression, context);
      expect(result).toBe(true);
    });
  });

  describe('DOM manipulation methods in loops', () => {
    it('should detect appendChild in loop', () => {
      const code = `
        for (const item of items) {
          const div = document.createElement('div');
          container.appendChild(div);
        }
      `;
      
      context.sourceCode = code;
      const parseResult = parse(code, { sourceType: 'module' });
      const ast = parseResult as File;
      const callExpression = findCallExpression(ast, 'appendChild');
      
      const result = matcher.match(callExpression, context);
      expect(result).toBe(true);
    });

    it('should detect createElement in loop', () => {
      const code = `
        for (let i = 0; i < 10; i++) {
          const element = document.createElement('div');
          element.id = 'item-' + i;
        }
      `;
      
      context.sourceCode = code;
      const parseResult = parse(code, { sourceType: 'module' });
      const ast = parseResult as File;
      const callExpression = findCallExpression(ast, 'createElement');
      
      const result = matcher.match(callExpression, context);
      expect(result).toBe(true);
    });
  });

  describe('expensive style methods in loops', () => {
    it('should detect getBoundingClientRect in loop', () => {
      const code = `
        elements.map(element => {
          const rect = element.getBoundingClientRect();
          return rect.width * rect.height;
        });
      `;
      
      context.sourceCode = code;
      const parseResult = parse(code, { sourceType: 'module' });
      const ast = parseResult as File;
      const callExpression = findCallExpression(ast, 'getBoundingClientRect');
      
      const result = matcher.match(callExpression, context);
      expect(result).toBe(true);
    });

    it('should detect getComputedStyle in loop', () => {
      const code = `
        for (const el of elements) {
          const style = getComputedStyle(el);
          const color = style.backgroundColor;
        }
      `;
      
      context.sourceCode = code;
      const parseResult = parse(code, { sourceType: 'module' });
      const ast = parseResult as File;
      const callExpression = findCallExpression(ast, 'getComputedStyle');
      
      const result = matcher.match(callExpression, context);
      expect(result).toBe(true);
    });
  });

  describe('operations outside loops', () => {
    it('should not detect DOM queries outside loops', () => {
      const code = `
        const element = document.querySelector('.item');
        const container = document.getElementById('container');
        element.textContent = 'Hello';
      `;
      
      context.sourceCode = code;
      const parseResult = parse(code, { sourceType: 'module' });
      const ast = parseResult as File;
      const callExpression = findCallExpression(ast, 'querySelector');
      
      const result = matcher.match(callExpression, context);
      expect(result).toBe(false);
    });

    it('should not detect DOM operations in separate functions', () => {
      const code = `
        function createElement() {
          return document.createElement('div');
        }
        
        for (let i = 0; i < items.length; i++) {
          const element = createElement();
        }
      `;
      
      context.sourceCode = code;
      const parseResult = parse(code, { sourceType: 'module' });
      const ast = parseResult as File;
      const callExpression = findCallExpression(ast, 'createElement');
      
      const result = matcher.match(callExpression, context);
      expect(result).toBe(false); // createElement is outside the loop
    });
  });

  describe('getMatchDetails', () => {
    it('should return correct details for DOM query', () => {
      const code = `
        for (let i = 0; i < items.length; i++) {
          const element = document.querySelector('.item');
        }
      `;
      
      context.sourceCode = code;
      const parseResult = parse(code, { sourceType: 'module' });
      const ast = parseResult as File;
      const callExpression = findCallExpression(ast, 'querySelector');
      
      const details = matcher.getMatchDetails(callExpression, context);
      expect(details.complexity).toBe(3);
      expect(details.impact).toContain('DOM Query');
      expect(details.suggestion).toContain('Cache DOM elements');
    });

    it('should return correct details for style operation', () => {
      const code = `
        elements.forEach(el => {
          const rect = el.getBoundingClientRect();
        });
      `;
      
      context.sourceCode = code;
      const parseResult = parse(code, { sourceType: 'module' });
      const ast = parseResult as File;
      const callExpression = findCallExpression(ast, 'getBoundingClientRect');
      
      const details = matcher.getMatchDetails(callExpression, context);
      expect(details.complexity).toBe(4);
      expect(details.impact).toContain('Style/Layout');
      expect(details.suggestion).toContain('Cache layout properties');
    });
  });

  describe('edge cases', () => {
    it('should handle nested loops correctly', () => {
      const code = `
        for (let i = 0; i < items.length; i++) {
          for (let j = 0; j < subitems.length; j++) {
            const element = document.querySelector('.nested');
          }
        }
      `;
      
      context.sourceCode = code;
      const parseResult = parse(code, { sourceType: 'module' });
      const ast = parseResult as File;
      const callExpression = findCallExpression(ast, 'querySelector');
      
      const result = matcher.match(callExpression, context);
      expect(result).toBe(true);
    });

    it('should handle complex loop expressions', () => {
      const code = `
        items.filter(item => item.active)
             .map(item => {
               return document.createElement('div');
             });
      `;
      
      context.sourceCode = code;
      const parseResult = parse(code, { sourceType: 'module' });
      const ast = parseResult as File;
      const callExpression = findCallExpression(ast, 'createElement');
      
      const result = matcher.match(callExpression, context);
      expect(result).toBe(true);
    });

    it('should handle malformed nodes gracefully', () => {
      const malformedNode = { 
        type: 'CallExpression',
        callee: null
      };
      
      expect(() => {
        matcher.match(malformedNode, context);
      }).not.toThrow();
      
      const result = matcher.match(malformedNode, context);
      expect(result).toBe(false);
    });
  });

});

// Helper function to find call expressions in AST
function findCallExpression(ast: any, methodName: string): any {
  let found: any = null;
  
  const traverse = (node: any) => {
    if (node && typeof node === 'object') {
      if (node.type === 'CallExpression') {
        const callee = node.callee;
        if (callee?.type === 'MemberExpression' && callee.property?.name === methodName) {
          found = node;
          return;
        }
        if (callee?.type === 'Identifier' && callee.name === methodName) {
          found = node;
          return;
        }
      }
      
      for (const key in node) {
        const value = node[key];
        if (Array.isArray(value)) {
          value.forEach(item => traverse(item));
        } else {
          traverse(value);
        }
      }
    }
  };
  
  traverse(ast);
  return found || { type: 'CallExpression', callee: { type: 'MemberExpression', property: { name: methodName } } };
}
