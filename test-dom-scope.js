const { DOMQueriesInLoopsMatcher } = require('./src/patterns/dom-queries-in-loops');

console.log('🧪 Testing DOM function scope detection...\n');

const matcher = new DOMQueriesInLoopsMatcher();
const code = `
        function createElement() {
          return document.createElement('div');
        }
        
        for (let i = 0; i < items.length; i++) {
          const element = createElement();
        }
      `;

const context = { 
  filePath: 'test.js', 
  language: 'javascript', 
  lineNumber: 1, 
  columnNumber: 1, 
  sourceCode: code 
};

// Mock a node that represents the createElement call in the function
const node = {
  type: 'CallExpression',
  start: code.indexOf('document.createElement'), // Should be 53
  callee: {
    type: 'MemberExpression',
    property: { name: 'createElement' }
  }
};

console.log('Node position:', node.start);
console.log('Function position:', code.indexOf('function createElement'));
console.log('Loop position:', code.indexOf('for (let i'));

try {
  const result = matcher.match(node, context);
  console.log('\nResult:', result);
  console.log('Expected: false (createElement should NOT be detected as in loop)');
  console.log('Test', result === false ? 'PASSED ✅' : 'FAILED ❌');
} catch (error) {
  console.log('Error:', error.message);
}
