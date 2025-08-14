#!/usr/bin/env node

const { execSync } = require('child_process');

try {
  console.log('🧪 Running the specific failing test...\n');
  
  const result = execSync('npx jest tests/unit/patterns/dom-queries-in-loops.test.ts --testNamePattern="should not detect DOM operations in separate functions" --verbose', { 
    encoding: 'utf8',
    cwd: process.cwd()
  });
  
  console.log(result);
} catch (error) {
  console.log('Test output:');
  console.log(error.stdout);
  if (error.stderr) {
    console.log('Error output:');
    console.log(error.stderr);
  }
}
