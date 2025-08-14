/**
 * Simple lint check script
 */

const { execSync } = require('child_process');

try {
  console.log('🔍 Checking lint status...\n');
  
  const result = execSync('npx eslint src/patterns/dom-queries-in-loops.ts', { 
    encoding: 'utf8',
    stdio: 'pipe'
  });
  
  console.log('✅ No lint errors!');
} catch (error) {
  console.log('❌ Lint errors found:');
  console.log(error.stdout);
}
