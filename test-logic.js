// Quick test to verify the DOM queries in loops logic
const testCode = `
function createElement() {
  return document.createElement('div');
}

for (let i = 0; i < items.length; i++) {
  const element = createElement();
}
`;

console.log('Testing DOM queries in loops detection...');
console.log('Code:', testCode);

// Simulate the node position for document.createElement('div')
// Looking at the code, it should be around position 40-50
const createElementCallPosition = testCode.indexOf("document.createElement('div')");
console.log('createElement call position:', createElementCallPosition);

// Test the function detection logic
const codeBeforeNode = testCode.substring(0, createElementCallPosition);
console.log('Code before node:', codeBeforeNode);

// Check if we're inside a function declaration
const functionMatches = Array.from(codeBeforeNode.matchAll(/\bfunction\s+(\w+)\s*\(/g));
console.log('Function matches:', functionMatches);

if (functionMatches.length > 0) {
  const lastFunction = functionMatches[functionMatches.length - 1];
  const functionStartIndex = lastFunction.index || 0;
  const functionName = lastFunction[1];
  
  console.log('Found function:', functionName, 'at position:', functionStartIndex);
  
  // Find the function's closing brace
  const codeFromFunction = testCode.substring(functionStartIndex);
  let braceCount = 0;
  let foundOpenBrace = false;
  let functionEndIndex = -1;
  
  for (let i = 0; i < codeFromFunction.length; i++) {
    if (codeFromFunction[i] === '{') {
      foundOpenBrace = true;
      braceCount++;
    } else if (codeFromFunction[i] === '}' && foundOpenBrace) {
      braceCount--;
      if (braceCount === 0) {
        functionEndIndex = functionStartIndex + i;
        break;
      }
    }
  }
  
  console.log('Function end index:', functionEndIndex);
  
  // If our node is inside this function
  if (createElementCallPosition > functionStartIndex && (functionEndIndex === -1 || createElementCallPosition < functionEndIndex)) {
    console.log('Node is inside the function');
    
    // Check if there are any loops AFTER this function declaration
    const codeAfterFunction = testCode.substring(functionEndIndex === -1 ? createElementCallPosition : functionEndIndex);
    console.log('Code after function:', codeAfterFunction);
    
    const loopKeywords = [
      'for (', 'for(', 'while (', 'while(', 'do {',
      '.forEach(', '.map(', '.filter(', '.reduce('
    ];
    
    const hasLoopAfterFunction = loopKeywords.some(keyword => codeAfterFunction.includes(keyword));
    console.log('Has loop after function:', hasLoopAfterFunction);
    
    // If there's a loop after the function, the node is in the function, not the loop
    if (hasLoopAfterFunction) {
      console.log('RESULT: Node is in function, not in loop - should return FALSE');
    } else {
      console.log('RESULT: Node is in function and no loop after - would continue to standard detection');
    }
  } else {
    console.log('Node is not inside the function');
  }
} else {
  console.log('No function found before node');
}
