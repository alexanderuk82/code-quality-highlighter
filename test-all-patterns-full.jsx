// ALL PATTERNS SHOWCASE (JS + React)
// Open this file to see highlights for every implemented rule.
/* eslint-disable */

import React, { useState, useEffect } from 'react';
const fs = require('fs');

// 1) FUNCTION TOO LONG (should highlight)
function veryLongUtility(list) {
  if (!list) return [];
  let out = [];
  let tmp = {};
  for (let i = 0; i < list.length; i++) {
    const item = list[i];
    if (!item) continue;
    tmp[item.id] = {
      id: item.id,
      name: String(item.name || '').toUpperCase(),
      t: Date.now(),
      meta: { a: 1, b: 2, c: 3 }
    };
  }
  for (const k in tmp) { out.push(tmp[k]); }
  out = out.map(x => ({ ...x, ok: true }));
  out.sort((a, b) => a.name.localeCompare(b.name));
  // padding lines to exceed threshold
  const x1 = 1; const x2 = 2; const x3 = 3; const x4 = 4; const x5 = 5; const x6 = 6;
  const x7 = 7; const x8 = 8; const x9 = 9; const x10 = 10; const x11 = 11; const x12 = 12;
  return out;
}

// 2) MISSING REACT MEMO (pure component, not wrapped)
export const PureCard = ({ title }) => (
  <div className="card">
    <h3>{title}</h3>
  </div>
);

// 3) MISSING DEPENDENCIES in useEffect
export const EffectMissingDeps = ({ userId }) => {
  const [items, setItems] = useState([]);
  useEffect(() => {
    fetch(`/api/users/${userId}`).then(r => r.json()).then(setItems);
  }, []); // Missing: userId
  return <ul>{items.map(x => <li key={x.id}>{x.name}</li>)}</ul>;
};

// 4) DIRECT STATE MUTATION
export const MutatingState = () => {
  const [items, setItems] = useState([1, 2, 3]);
  const mutate = () => {
    items.push(4); // mutation
    items.sort();  // mutation
    setItems(items); // set same ref
  };
  return <button onClick={mutate}>Mutate</button>;
};

// 5) MISSING KEYS IN LISTS
export const MissingKeys = ({ items }) => (
  <ul>
    {items.map(item => (
      <li>{item.name}</li> // no key
    ))}
  </ul>
);

// 6) INDEX AS KEY
export const IndexAsKey = ({ items }) => (
  <ul>
    {items.map((item, index) => (
      <li key={index}>{item.name}</li>
    ))}
  </ul>
);

// 7) INLINE FUNCTION PROPS
export const InlineHandlers = ({ onAdd }) => (
  <div>
    <button onClick={() => onAdd('x')}>Add</button>
  </div>
);

// 8) MULTIPLE ARRAY ITERATIONS (filter -> map -> filter -> map)
export const processUsers = (users) => (
  users
    .filter(u => u.age > 18)
    .map(u => ({ ...u, name: u.name.toUpperCase() }))
    .filter(u => u.country === 'US')
    .map(u => u.name)
);

// 9) NESTED LOOPS
export function nestedLoopPairs(items) {
  const pairs = [];
  for (let i = 0; i < items.length; i++) {
    for (let j = 0; j < items.length; j++) {
      if (i !== j) pairs.push([items[i], items[j]]);
    }
  }
  return pairs;
}

// 10) EXPENSIVE OPERATIONS IN LOOPS (find in loop)
export function matchUsers(users, ids) {
  const out = [];
  for (const id of ids) {
    const u = users.find(x => x.id === id); // O(n*m)
    if (u) out.push(u);
  }
  return out;
}

// 11) STRING CONCATENATION IN LOOPS
export function buildHTML(items) {
  let html = '';
  for (const it of items) {
    html += '<div>' + it.name + '</div>'; // + in loop
  }
  return html;
}

// 12) BLOCKING SYNC OPERATIONS
export function loadConfigSync() {
  const data = fs.readFileSync('config.json', 'utf8'); // sync IO
  return JSON.parse(data);
}

// 13) MEMORY LEAKS (no cleanup)
export class Leaky extends React.Component {
  componentDidMount() {
    window.addEventListener('resize', this.onR);
    this.t = setInterval(this.onT, 1000);
  }
  onR = () => {};
  onT = () => {};
  render() { return <div>Leaky</div>; }
}

// 14) DOM QUERIES IN LOOPS
export function domInLoop(items) {
  for (let i = 0; i < items.length; i++) {
    const c = document.querySelector('#container'); // DOM query in loop
    const el = document.createElement('div');      // DOM create in loop
    c.appendChild(el);
  }
}

// 15) INEFFICIENT OBJECT ACCESS IN LOOPS
export function deepAccessInLoop(users, settings) {
  const res = [];
  for (let i = 0; i < users.length; i++) {
    if (users[i].profile.details.preferences.theme === 'dark') { // deep access
      if (users[i].profile.details.preferences.theme === 'dark') { // repeated access
        res.push(users[i]);
      }
    }
    if (users[i].value > settings.threshold.max) { // repeated property path in loop
      res.push(users[i]);
    }
  }
  return res;
}

// 16) INFINITE RECURSION RISKS
export function recurse(n) {
  return recurse(n); // no base case, same params
}

// 17) SYNCHRONOUS XHR
export async function syncXHR() {
  const xhr = new XMLHttpRequest();
  xhr.open('GET', '/api/data', false); // sync flag false
  xhr.send();
  return xhr.responseText;
}

// 18) REPEATED REGEX COMPILATION IN LOOPS
export function countWords(lines) {
  let c = 0;
  for (const line of lines) {
    const re = new RegExp('^foo'); // recompiled each iter
    if (re.test(line)) c++;
  }
  return c;
}

// 19) OBJECTS/ARRAYS IN RENDER (create literals in props)
export const ObjectsInRender = ({ theme }) => (
  <div style={{ color: theme.primary, padding: 8 }} data={[1,2,3]} />
);

// 20) MODERN JAVASCRIPT (good)
export const GoodModern = () => {
  const name = 'Alex'; // const/let
  const pt = { x: 1, y: 2 };
  const add = (a, b) => a + b; // arrow fn
  const { x, y } = pt; // destructuring
  const msg = `Hello ${name} at (${x},${y})`; // template literal
  return <div>{msg} {add(1,2)}</div>;
};

// 21) INLINE FUNCTION PROPS deeper example and OBJECTS IN RENDER combined
export const Mixed = ({ list, onPick }) => (
  <ul>
    {list.map((item, index) => (
      <li key={index} style={{ margin: 4 }} onClick={() => onPick(item.id)}>
        {item.label}
      </li>
    ))}
  </ul>
);

console.log('All patterns showcase ready');
