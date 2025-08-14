// COMPREHENSIVE TEST FILE - 13 PATTERNS
// This file demonstrates all implemented patterns

import React, { useState, useEffect } from 'react';

// ============================================
// 1. FUNCTION TOO LONG (should highlight)
// ============================================
function processComplexData(data) {
  // This function is 50+ lines - TOO LONG!
  if (!data) return null;
  
  const result = [];
  const temp = {};
  
  // Validation section
  for (let item of data) {
    if (!item.id) {
      console.error('Invalid item');
      continue;
    }
    if (!item.name) {
      console.error('Missing name');
      continue;
    }
  }
  
  // Processing section
  for (let item of data) {
    const processed = {
      id: item.id,
      name: item.name.toUpperCase(),
      timestamp: Date.now(),
      category: item.category || 'default',
      tags: item.tags || [],
      metadata: {
        created: new Date(),
        modified: new Date(),
        version: 1
      }
    };
    
    // More processing
    if (processed.category === 'special') {
      processed.priority = 'high';
      processed.flag = true;
    }
    
    temp[processed.id] = processed;
  }
  
  // Transform to array
  for (let key in temp) {
    result.push(temp[key]);
  }
  
  // Sort
  result.sort((a, b) => a.name.localeCompare(b.name));
  
  return result;
}

// ============================================
// 2. REACT COMPONENT WITH MULTIPLE ISSUES
// ============================================

// Missing React.memo (should highlight)
const TodoList = ({ todos, userId }) => {
  const [items, setItems] = useState(todos);
  const [filter, setFilter] = useState('all');
  
  // MISSING DEPENDENCIES (should highlight)
  useEffect(() => {
    // userId is used but not in dependency array
    fetch(`/api/todos/${userId}`)
      .then(res => res.json())
      .then(data => setItems(data));
  }, []); // Missing: userId
  
  // DIRECT STATE MUTATION (should highlight)
  const addTodo = (text) => {
    items.push({ id: Date.now(), text }); // Mutating state!
    setItems(items); // Won't trigger re-render
  };
  
  // Another mutation
  const sortTodos = () => {
    items.sort((a, b) => a.text.localeCompare(b.text)); // Mutating!
    setItems(items);
  };
  
  return (
    <div>
      {/* MISSING KEYS IN LIST (should highlight) */}
      {items.map(item => (
        <div>{item.text}</div>  // No key prop!
      ))}
      
      {/* USING INDEX AS KEY (should highlight) */}
      {items.map((item, index) => (
        <div key={index}>{item.text}</div>  // Index as key!
      ))}
      
      {/* INLINE FUNCTION PROPS (should highlight) */}
      <button onClick={() => addTodo('New')}>Add</button>
      <button onClick={() => sortTodos()}>Sort</button>
      
      {/* More inline functions */}
      {items.map(item => (
        <div key={item.id}>
          <span onClick={() => console.log(item)}>View</span>
          <button onClick={() => deleteTodo(item.id)}>Delete</button>
        </div>
      ))}
    </div>
  );
};

// ============================================
// 3. MULTIPLE ARRAY ITERATIONS (should highlight)
// ============================================
const processUsers = (users) => {
  // Chain of array methods - inefficient
  return users
    .filter(user => user.age > 18)
    .map(user => ({
      ...user,
      name: user.name.toUpperCase()
    }))
    .filter(user => user.country === 'USA')
    .map(user => user.name);
};

// ============================================
// 4. NESTED LOOPS (should highlight)
// ============================================
function findRelations(items) {
  const relations = [];
  for (let i = 0; i < items.length; i++) {
    for (let j = 0; j < items.length; j++) {
      if (items[i].parentId === items[j].id) {
        relations.push({ child: items[i], parent: items[j] });
      }
    }
  }
  return relations;
}

// ============================================
// 5. MORE STATE MUTATIONS (should highlight)
// ============================================
const BadStateComponent = () => {
  const [state, setState] = useState({ 
    items: [], 
    metadata: {} 
  });
  
  const updateState = () => {
    // All of these are mutations!
    state.items.push('new item');
    state.metadata.updated = Date.now();
    state.items[0] = 'modified';
    setState(state); // Won't work!
  };
  
  return <div onClick={updateState}>Click me</div>;
};

// ============================================
// 6. EXPENSIVE OPERATIONS IN LOOPS (should highlight)
// ============================================
const findMatchingUsers = (users, searchIds) => {
  const results = [];
  for (let id of searchIds) {
    // Using find() in a loop - O(n*m) complexity
    const user = users.find(u => u.id === id);
    if (user) results.push(user);
  }
  return results;
};

// ============================================
// 7. STRING CONCATENATION IN LOOP (should highlight)
// ============================================
function buildHTML(items) {
  let html = '';
  for (let item of items) {
    html += '<div>' + item.name + '</div>'; // Bad!
  }
  return html;
}

// ============================================
// 8. BLOCKING SYNC OPERATIONS (should highlight)
// ============================================
const fs = require('fs');
function loadConfig() {
  // Blocking I/O
  const data = fs.readFileSync('config.json', 'utf8');
  return JSON.parse(data);
}

// ============================================
// 9. MEMORY LEAKS (should highlight)
// ============================================
class LeakyComponent extends React.Component {
  componentDidMount() {
    // No cleanup!
    window.addEventListener('resize', this.handleResize);
    this.timer = setInterval(this.tick, 1000);
  }
  
  handleResize = () => console.log('resized');
  tick = () => console.log('tick');
  
  render() {
    return <div>Leaky</div>;
  }
}

// ============================================
// GOOD EXAMPLES (should NOT highlight)
// ============================================

// Good: React.memo used
const GoodComponent = React.memo(({ data }) => {
  return <div>{data}</div>;
});

// Good: Proper dependencies
const ProperHooks = ({ userId }) => {
  useEffect(() => {
    fetchUser(userId);
  }, [userId]); // Correct dependencies
  
  return <div>Good</div>;
};

// Good: Immutable state updates
const GoodState = () => {
  const [items, setItems] = useState([]);
  
  const addItem = (item) => {
    setItems([...items, item]); // New array
  };
  
  const updateItem = (index, newItem) => {
    setItems(items.map((item, i) => 
      i === index ? newItem : item
    ));
  };
  
  return <div>Good State Management</div>;
};

// Good: Proper keys
const GoodList = ({ items }) => (
  <ul>
    {items.map(item => (
      <li key={item.id}>{item.name}</li>
    ))}
  </ul>
);

console.log('Test file with 13 patterns ready!');
