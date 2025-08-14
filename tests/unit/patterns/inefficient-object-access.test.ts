import { parse } from '@babel/parser';
import { File } from '@babel/types';
import { InefficientObjectAccessMatcher } from '../../../src/patterns/inefficient-object-access';
import { MatchContext } from '../../../src/types';

describe('InefficientObjectAccessMatcher', () => {
  let matcher: InefficientObjectAccessMatcher;
  let context: MatchContext;

  beforeEach(() => {
    matcher = new InefficientObjectAccessMatcher();
    context = {
      filePath: 'test.js',
      language: 'javascript',
      lineNumber: 1,
      columnNumber: 1,
      sourceCode: '',
      surroundingCode: ''
    };
  });

  // Helper function to find member expressions
  function findMemberExpression(ast: File, propertyName: string) {
    let found: any = null;
    
    function traverse(node: any) {
      if (node && typeof node === 'object') {
        if (node.type === 'MemberExpression' && 
            node.property?.name === propertyName) {
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

  describe('deep property access in loops', () => {
    it('should detect deep property access in for loop', () => {
      const code = `
        for (let i = 0; i < items.length; i++) {
          if (items[i].user.profile.settings.theme === 'dark') {
            console.log('dark theme');
          }
        }
      `;
      
      context.sourceCode = code;
      const parseResult = parse(code, { sourceType: 'module' });
      const ast = parseResult as File;
      const memberExpression = findMemberExpression(ast, 'theme');
      
      const result = matcher.match(memberExpression, context);
      expect(result).toBe(true);
    });

    it('should detect deep property access in while loop', () => {
      const code = `
        let i = 0;
        while (i < users.length) {
          const email = users[i].profile.contact.email;
          i++;
        }
      `;
      
      context.sourceCode = code;
      const parseResult = parse(code, { sourceType: 'module' });
      const ast = parseResult as File;
      const memberExpression = findMemberExpression(ast, 'email');
      
      const result = matcher.match(memberExpression, context);
      expect(result).toBe(true);
    });

    it('should detect deep property access in forEach', () => {
      const code = `
        items.forEach(item => {
          if (item.config.display.options.showTitle) {
            renderTitle(item.title);
          }
        });
      `;
      
      context.sourceCode = code;
      const parseResult = parse(code, { sourceType: 'module' });
      const ast = parseResult as File;
      const memberExpression = findMemberExpression(ast, 'showTitle');
      
      const result = matcher.match(memberExpression, context);
      expect(result).toBe(true);
    });
  });

  describe('repeated property access', () => {
    it('should detect repeated property access in loop', () => {
      const code = `
        for (const user of users) {
          console.log(user.profile.name);
          if (user.profile.active) {
            sendEmail(user.profile.email);
          }
        }
      `;
      
      context.sourceCode = code;
      const parseResult = parse(code, { sourceType: 'module' });
      const ast = parseResult as File;
      const memberExpression = findMemberExpression(ast, 'name');
      
      const result = matcher.match(memberExpression, context);
      expect(result).toBe(true);
    });
  });

  describe('repeated method calls', () => {
    it('should detect repeated method calls in loop', () => {
      const code = `
        for (let i = 0; i < items.length; i++) {
          const result1 = obj.getData();
          const result2 = obj.getData();
          process(result1, result2);
        }
      `;
      
      context.sourceCode = code;
      const parseResult = parse(code, { sourceType: 'module' });
      const ast = parseResult as File;
      const callExpression = findCallExpression(ast, 'getData');
      
      const result = matcher.match(callExpression, context);
      expect(result).toBe(true);
    });
  });

  describe('property access outside loops', () => {
    it('should not detect property access outside loops', () => {
      const code = `
        const theme = user.profile.settings.theme;
        console.log(theme);
      `;
      
      context.sourceCode = code;
      const parseResult = parse(code, { sourceType: 'module' });
      const ast = parseResult as File;
      const memberExpression = findMemberExpression(ast, 'theme');
      
      const result = matcher.match(memberExpression, context);
      expect(result).toBe(false);
    });

    it('should not detect shallow property access', () => {
      const code = `
        for (const item of items) {
          console.log(item.name);
        }
      `;
      
      context.sourceCode = code;
      const parseResult = parse(code, { sourceType: 'module' });
      const ast = parseResult as File;
      const memberExpression = findMemberExpression(ast, 'name');
      
      const result = matcher.match(memberExpression, context);
      expect(result).toBe(false);
    });
  });

  describe('getMatchDetails', () => {
    it('should return correct details for deep property access', () => {
      const code = `
        for (const item of items) {
          if (item.user.profile.settings.theme === 'dark') {
            console.log('dark');
          }
        }
      `;
      
      context.sourceCode = code;
      const parseResult = parse(code, { sourceType: 'module' });
      const ast = parseResult as File;
      const memberExpression = findMemberExpression(ast, 'theme');
      
      const details = matcher.getMatchDetails(memberExpression, context);
      
      expect(details.complexity).toBeGreaterThan(4);
      expect(details.impact).toContain('item.user.profile.settings.theme');
      expect(details.impact).toContain('resolved on every loop iteration');
      expect(details.suggestion).toContain('Cache');
    });

    it('should return correct details for method calls', () => {
      const code = `
        for (let i = 0; i < items.length; i++) {
          const data = api.getData();
          process(data);
        }
      `;
      
      context.sourceCode = code;
      const parseResult = parse(code, { sourceType: 'module' });
      const ast = parseResult as File;
      const callExpression = findCallExpression(ast, 'getData');
      
      const details = matcher.getMatchDetails(callExpression, context);
      
      expect(details.complexity).toBe(6);
      expect(details.impact).toContain('Method call');
      expect(details.suggestion).toContain('Cache the result');
    });
  });

  describe('edge cases', () => {
    it('should handle computed property access', () => {
      const code = `
        for (const key of keys) {
          const value = obj[key].nested.property;
          console.log(value);
        }
      `;
      
      context.sourceCode = code;
      const parseResult = parse(code, { sourceType: 'module' });
      const ast = parseResult as File;
      const memberExpression = findMemberExpression(ast, 'property');
      
      const result = matcher.match(memberExpression, context);
      expect(result).toBe(true);
    });

    it('should handle malformed nodes gracefully', () => {
      const malformedNode = {
        type: 'MemberExpression',
        property: null,
        object: null
      };
      
      const result = matcher.match(malformedNode, context);
      expect(result).toBe(false);
    });

    it('should handle nested loops correctly', () => {
      const code = `
        for (const group of groups) {
          for (const item of group.items) {
            if (item.config.display.enabled) {
              render(item);
            }
          }
        }
      `;
      
      context.sourceCode = code;
      const parseResult = parse(code, { sourceType: 'module' });
      const ast = parseResult as File;
      const memberExpression = findMemberExpression(ast, 'enabled');
      
      const result = matcher.match(memberExpression, context);
      expect(result).toBe(true);
    });

    it('should not detect single property access', () => {
      const code = `
        for (const item of items) {
          console.log(item.id);
        }
      `;
      
      context.sourceCode = code;
      const parseResult = parse(code, { sourceType: 'module' });
      const ast = parseResult as File;
      const memberExpression = findMemberExpression(ast, 'id');
      
      const result = matcher.match(memberExpression, context);
      expect(result).toBe(false);
    });
  });
});
