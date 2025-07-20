import { BlockingSyncOperationsMatcher } from '../../../src/patterns/blocking-sync-operations';
import { MatchContext, SupportedLanguage } from '../../../src/types';
import { parse } from '@babel/parser';

describe('BlockingSyncOperationsMatcher', () => {
  let matcher: BlockingSyncOperationsMatcher;
  let context: MatchContext;

  beforeEach(() => {
    matcher = new BlockingSyncOperationsMatcher();
    context = {
      filePath: 'test.js',
      language: 'javascript' as SupportedLanguage,
      lineNumber: 1,
      columnNumber: 1,
      sourceCode: ''
    };
  });

  describe('file system sync operations', () => {
    it('should detect fs.readFileSync', () => {
      const code = `
        const fs = require('fs');
        const data = fs.readFileSync('file.txt', 'utf8');
      `;
      
      const ast = parse(code, { sourceType: 'module' });
      const callExpression = this.findCallExpression(ast, 'readFileSync');
      
      const result = matcher.match(callExpression, context);
      expect(result).toBe(true);
    });

    it('should detect fs.writeFileSync', () => {
      const code = `
        import fs from 'fs';
        fs.writeFileSync('output.txt', data);
      `;
      
      const ast = parse(code, { sourceType: 'module' });
      const callExpression = this.findCallExpression(ast, 'writeFileSync');
      
      const result = matcher.match(callExpression, context);
      expect(result).toBe(true);
    });

    it('should detect multiple sync operations', () => {
      const code = `
        const fs = require('fs');
        const stats = fs.statSync('file.txt');
        const exists = fs.existsSync('file.txt');
        const data = fs.readFileSync('file.txt');
      `;
      
      const ast = parse(code, { sourceType: 'module' });
      
      const statsSyncCall = this.findCallExpression(ast, 'statSync');
      const existsSyncCall = this.findCallExpression(ast, 'existsSync');
      const readSyncCall = this.findCallExpression(ast, 'readFileSync');
      
      expect(matcher.match(statsSyncCall, context)).toBe(true);
      expect(matcher.match(existsSyncCall, context)).toBe(true);
      expect(matcher.match(readSyncCall, context)).toBe(true);
    });
  });

  describe('child process sync operations', () => {
    it('should detect execSync', () => {
      const code = `
        const child_process = require('child_process');
        const result = child_process.execSync('git status');
      `;
      
      const ast = parse(code, { sourceType: 'module' });
      const callExpression = this.findCallExpression(ast, 'execSync');
      
      const result = matcher.match(callExpression, context);
      expect(result).toBe(true);
    });

    it('should detect spawnSync', () => {
      const code = `
        import { spawnSync } from 'child_process';
        const result = spawnSync('ls', ['-la']);
      `;
      
      const ast = parse(code, { sourceType: 'module' });
      const callExpression = this.findCallExpression(ast, 'spawnSync');
      
      const result = matcher.match(callExpression, context);
      expect(result).toBe(true);
    });
  });

  describe('crypto sync operations', () => {
    it('should detect pbkdf2Sync', () => {
      const code = `
        const crypto = require('crypto');
        const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512');
      `;
      
      const ast = parse(code, { sourceType: 'module' });
      const callExpression = this.findCallExpression(ast, 'pbkdf2Sync');
      
      const result = matcher.match(callExpression, context);
      expect(result).toBe(true);
    });

    it('should detect randomBytesSync', () => {
      const code = `
        import crypto from 'crypto';
        const bytes = crypto.randomBytesSync(256);
      `;
      
      const ast = parse(code, { sourceType: 'module' });
      const callExpression = this.findCallExpression(ast, 'randomBytesSync');
      
      const result = matcher.match(callExpression, context);
      expect(result).toBe(true);
    });
  });

  describe('non-blocking operations', () => {
    it('should not detect async fs operations', () => {
      const code = `
        const fs = require('fs').promises;
        const data = await fs.readFile('file.txt', 'utf8');
        fs.readFile('file.txt', callback);
      `;
      
      const ast = parse(code, { sourceType: 'module' });
      const awaitCall = this.findCallExpression(ast, 'readFile');
      
      const result = matcher.match(awaitCall, context);
      expect(result).toBe(false);
    });

    it('should not detect async child_process operations', () => {
      const code = `
        const { exec } = require('child_process');
        exec('git status', callback);
      `;
      
      const ast = parse(code, { sourceType: 'module' });
      const callExpression = this.findCallExpression(ast, 'exec');
      
      const result = matcher.match(callExpression, context);
      expect(result).toBe(false);
    });
  });

  describe('getMatchDetails', () => {
    it('should return correct details for readFileSync', () => {
      const code = `
        const fs = require('fs');
        const data = fs.readFileSync('file.txt');
      `;
      
      const ast = parse(code, { sourceType: 'module' });
      const callExpression = this.findCallExpression(ast, 'readFileSync');
      
      const details = matcher.getMatchDetails(callExpression, context);
      expect(details.complexity).toBe(1);
      expect(details.impact).toContain('Blocks event loop');
      expect(details.suggestion).toContain('async');
    });

    it('should provide operation-specific suggestions', () => {
      const code = `
        const child_process = require('child_process');
        const result = child_process.execSync('command');
      `;
      
      const ast = parse(code, { sourceType: 'module' });
      const callExpression = this.findCallExpression(ast, 'execSync');
      
      const details = matcher.getMatchDetails(callExpression, context);
      expect(details.suggestion).toContain('async exec');
    });
  });

  describe('edge cases', () => {
    it('should handle non-call expressions', () => {
      const code = `
        const syncVar = 'readFileSync';
        const obj = { readFileSync: true };
      `;
      
      const ast = parse(code, { sourceType: 'module' });
      const identifier = ast.body[0].declarations[0].init;
      
      expect(() => {
        matcher.match(identifier, context);
      }).not.toThrow();
      
      const result = matcher.match(identifier, context);
      expect(result).toBe(false);
    });

    it('should handle malformed call expressions', () => {
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

  // Helper method to find call expressions in AST
  private findCallExpression(ast: any, methodName: string): any {
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
    return found;
  }
});
