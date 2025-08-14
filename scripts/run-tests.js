#!/usr/bin/env node

// Test runner for the fixes
const { exec } = require('child_process');
const path = require('path');

console.log('🧪 Running Code Quality Highlighter Tests...\n');

const projectRoot = process.cwd();

// Run individual test
exec('npx jest tests/unit/patterns/nested-loops.test.ts --verbose --no-coverage', 
  { cwd: projectRoot }, 
  (error, stdout, stderr) => {
    if (stdout) {
      console.log('STDOUT:', stdout);
    }
    if (stderr) {
      console.log('STDERR:', stderr);
    }
    if (error) {
      console.log('ERROR:', error.message);
    }
  }
);
