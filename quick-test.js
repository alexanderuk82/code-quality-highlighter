#!/usr/bin/env node

const { execSync } = require('child_process');

console.log('=== Code Quality Highlighter - Test Results ===\n');

try {
  console.log('1. TypeScript compilation...');
  const tscResult = execSync('npx tsc --noEmit', { encoding: 'utf8', stdio: 'pipe' });
  console.log('✅ TypeScript compilation: PASSED\n');
} catch (error) {
  console.log('❌ TypeScript compilation: FAILED');
  console.log(error.stdout);
  console.log(error.stderr);
  console.log('');
}

try {
  console.log('2. ESLint check...');
  const eslintResult = execSync('npx eslint src --ext ts', { encoding: 'utf8', stdio: 'pipe' });
  console.log('✅ ESLint check: PASSED\n');
} catch (error) {
  console.log('❌ ESLint check: FAILED');
  console.log(error.stdout);
  console.log(error.stderr);
  console.log('');
}

try {
  console.log('3. Jest tests...');
  const jestResult = execSync('npx jest --passWithNoTests', { encoding: 'utf8', stdio: 'pipe' });
  console.log('✅ Jest tests: PASSED\n');
} catch (error) {
  console.log('❌ Jest tests: FAILED');
  console.log(error.stdout);
  console.log(error.stderr);
  console.log('');
}

console.log('=== Test Summary Complete ===');
