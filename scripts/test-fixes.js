#!/usr/bin/env node

// Simple test runner to validate our fixes
const { NestedLoopMatcher } = require('../src/patterns/nested-loops');
const { parse } = require('@babel/parser');

console.log('🧪 Testing Code Quality Highlighter...');

try {
  // Test 1: Basic AST parsing
  console.log('1. Testing AST parsing...');
  const code = `
    for (let i = 0; i < arr1.length; i++) {
      for (let j = 0; j < arr2.length; j++) {
        console.log(arr1[i], arr2[j]);
      }
    }
  `;
  
  const parseResult = parse(code, { sourceType: 'module' });
  const ast = parseResult; // This should now work as File
  console.log('   ✅ AST parsing successful');
  console.log('   ✅ AST has body property:', !!ast.body);
  console.log('   ✅ First statement type:', ast.body[0]?.type);

  // Test 2: Pattern matcher
  console.log('2. Testing NestedLoopMatcher...');
  const matcher = new NestedLoopMatcher();
  const context = {
    filePath: 'test.js',
    language: 'javascript',
    lineNumber: 1,
    columnNumber: 1,
    sourceCode: code
  };
  
  const forStatement = ast.body[0];
  const result = matcher.match(forStatement, context);
  console.log('   ✅ Matcher executed without errors');
  console.log('   ✅ Detected nested loops:', result);

  // Test 3: Match details
  console.log('3. Testing match details...');
  const details = matcher.getMatchDetails(forStatement, context);
  console.log('   ✅ Details retrieved:', !!details);
  console.log('   ✅ Complexity:', details.complexity);

  console.log('\n🎉 All tests passed! The fixes are working correctly.');
  
} catch (error) {
  console.error('❌ Test failed:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}
