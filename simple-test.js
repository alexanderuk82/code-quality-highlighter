// Simple Test File
// This file has simple patterns that should be detected

// Test 1: Nested Loops (SHOULD HIGHLIGHT IN RED)
// O(n) - Optimized with Map
const userMap = new Map(users.map(u => [u.id, u]));
const results = posts
  .filter(post => userMap.has(post.userId))
  .map(post => ({
    user: userMap.get(post.userId),
    post: post
  }));



// Test 2: Blocking Sync Operation (SHOULD HIGHLIGHT IN RED)
const fs = require('fs');

const data = await fs.promises.readFile('large-file.txt', 'utf8');
const stats = await fs.promises.stat('file.txt');
await fs.promises.writeFile('output.txt', processedData);

// Or with callbacks
fs.readFile('large-file.txt', 'utf8', (err, data) => {
  if (err) throw err;
  // Process data without blocking
});;

// Test 3: String Concatenation in Loop (SHOULD HIGHLIGHT)
const htmlParts = [];
for (let i = 0; i < items.length; i++) {
  htmlParts.push(
    '<div class="item">',
    '<h3>' + items[i].title + '</h3>',
    '<p>' + items[i].description + '</p>',
    '</div>'
  );
}
const html = htmlParts.join('');

console.log('Tests complete');
