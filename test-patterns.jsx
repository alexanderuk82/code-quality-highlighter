// TEST FILE: React and JavaScript Pattern Detection
// This file contains examples that should trigger our new patterns

// ============================================
// 1. MULTIPLE ARRAY ITERATIONS (should highlight)
// ============================================

// Bad: Multiple iterations
const activeUserNames = users
  .filter(user => user.isActive)
  .map(user => user.name)
  .filter(name => name.length > 3);

// Bad: Triple chain
const total = orders
  .filter(order => order.status === 'completed')
  .map(order => order.amount)
  .reduce((sum, amount) => sum + amount, 0);

// ============================================
// 2. REACT COMPONENT EXAMPLES
// ============================================

import React from 'react';

// Bad: Missing React.memo (should highlight)
const UserCard = ({ user, onEdit }) => {
  return (
    <div className="user-card">
      <h2>{user.name}</h2>
      <p>{user.email}</p>
      {/* Bad: Inline function prop (should highlight) */}
      <button onClick={() => onEdit(user.id)}>
        Edit User
      </button>
    </div>
  );
};

// Bad: Another component without memo
const ProductList = ({ products }) => {
  return (
    <div>
      {products.map(product => (
        <div key={product.id}>
          <h3>{product.name}</h3>
          {/* Bad: Multiple inline functions */}
          <button onClick={() => console.log(product)}>View</button>
          <button onClick={() => handleDelete(product.id)}>Delete</button>
        </div>
      ))}
    </div>
  );
};

// Good: Component with React.memo (should NOT highlight)
const OptimizedCard = React.memo(({ data }) => {
  return <div>{data.content}</div>;
});

// ============================================
// 3. MIXED PATTERNS (multiple issues)
// ============================================

const ComplexComponent = ({ items, onItemClick }) => {
  // Bad: Multiple array iterations
  const processedItems = items
    .filter(item => item.visible)
    .map(item => ({ ...item, label: item.name.toUpperCase() }))
    .sort((a, b) => a.label.localeCompare(b.label));

  return (
    <ul>
      {processedItems.map(item => (
        <li key={item.id}>
          {/* Bad: Inline function in prop */}
          <span onClick={() => onItemClick(item.id)}>
            {item.label}
          </span>
        </li>
      ))}
    </ul>
  );
};

// ============================================
// 4. MORE JAVASCRIPT PATTERNS
// ============================================

// Bad: Nested loops (already implemented)
for (let i = 0; i < items.length; i++) {
  for (let j = 0; j < items.length; j++) {
    if (items[i].id === items[j].parentId) {
      console.log('Found relation');
    }
  }
}

// Bad: String concatenation in loop (already implemented)
let html = '';
for (let i = 0; i < 1000; i++) {
  html += '<div>' + i + '</div>';
}

// Good: Proper array handling
const goodResult = items.reduce((acc, item) => {
  if (item.visible && item.name.length > 3) {
    acc.push({ ...item, label: item.name.toUpperCase() });
  }
  return acc;
}, []);

console.log('Test file ready for pattern detection!');
