const { NestedLoopMatcher } = require('./src/patterns/nested-loops');
const { DOMQueriesInLoopsMatcher } = require('./src/patterns/dom-queries-in-loops');

console.log('🧪 Testing fixes...\n');

// Test 1: Nested loops null handling
console.log('1. Testing null/undefined handling...');
try {
  const matcher = new NestedLoopMatcher();
  const context = { filePath: 'test.js', language: 'javascript', lineNumber: 1, columnNumber: 1, sourceCode: '' };
  
  const result1 = matcher.match(null, context);
  const result2 = matcher.match(undefined, context);
  const result3 = matcher.match({ type: undefined }, context);
  
  console.log('   ✅ Null handling:', result1 === false);
  console.log('   ✅ Undefined handling:', result2 === false);
  console.log('   ✅ Invalid type handling:', result3 === false);
} catch (error) {
  console.log('   ❌ Error:', error.message);
}

// Test 2: DOM queries function scope
console.log('\n2. Testing DOM queries function scope...');
try {
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
    start: code.indexOf('document.createElement'),
    callee: {
      type: 'MemberExpression',
      property: { name: 'createElement' }
    }
  };
  
  const result = matcher.match(node, context);
  console.log('   ✅ Function scope detection:', result === false ? 'PASS' : 'FAIL');
  console.log('   Result:', result);
} catch (error) {
  console.log('   ❌ Error:', error.message);
}

console.log('\n🎉 Fix validation complete!');
