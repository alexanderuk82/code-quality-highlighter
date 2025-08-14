// Simple Test File
// This file has simple patterns that should be detected

// Test 1: Nested Loops (SHOULD HIGHLIGHT IN RED)
for (let i = 0; i < 10; i++) {
    for (let j = 0; j < 10; j++) {
        console.log(i, j);
    }
}

// Test 2: Blocking Sync Operation (SHOULD HIGHLIGHT IN RED)
const fs = require('fs');
const data = fs.readFileSync('file.txt');

// Test 3: String Concatenation in Loop (SHOULD HIGHLIGHT)
let result = '';
for (let i = 0; i < 100; i++) {
    result += 'item ' + i;
}

console.log('Tests complete');
