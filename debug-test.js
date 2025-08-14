// Quick test of just the failing test case
console.log('Testing the exact failing scenario...\n');

const code = `
        function createElement() {
          return document.createElement('div');
        }
        
        for (let i = 0; i < items.length; i++) {
          const element = createElement();
        }
      `;

// Simulate what the helper function should find
console.log('Full code:');
console.log(code);
console.log('\nPositions:');
console.log('- document.createElement at:', code.indexOf('document.createElement'));
console.log('- function declaration at:', code.indexOf('function createElement'));  
console.log('- for loop at:', code.indexOf('for (let i'));

// Test my regex patterns
const functionPatterns = [
  /function\s+\w+\s*\([^)]*\)\s*\{/g,  // function name() {
  /function\s*\([^)]*\)\s*\{/g,       // function() {
];

functionPatterns.forEach((pattern, i) => {
  pattern.lastIndex = 0;
  const match = pattern.exec(code);
  console.log(`Pattern ${i + 1} match:`, match ? match.index : 'no match');
});
