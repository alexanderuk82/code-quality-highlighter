const { DOMQueriesInLoopsMatcher } = require('./src/patterns/dom-queries-in-loops');
const { parse } = require('@babel/parser');

const matcher = new DOMQueriesInLoopsMatcher();
const code = `
function createElement() {
  return document.createElement('div');
}

for (let i = 0; i < items.length; i++) {
  const element = createElement();
}
`;

console.log('Code:');
console.log(code);

const parseResult = parse(code, { sourceType: 'module' });

// Find the createElement call
function findCallExpression(ast, methodName) {
  let found = null;
  
  const traverse = (node) => {
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

const callExpression = findCallExpression(parseResult, 'createElement');
console.log('Found createElement call:', callExpression ? 'Yes' : 'No');
console.log('Call start position:', callExpression?.start);

const context = {
  filePath: 'test.js',
  language: 'javascript',
  lineNumber: 1,
  columnNumber: 1,
  sourceCode: code
};

const result = matcher.match(callExpression, context);
console.log('Match result:', result);
console.log('Should be false for this test case');
