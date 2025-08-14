"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.missingKeysInListsRule = exports.MissingKeysInListsMatcher = void 0;
const types_1 = require("../types");
/**
 * Detects array rendering in React without proper keys
 */
class MissingKeysInListsMatcher {
    match(node, context) {
        if (!this.isReactFile(context))
            return false;
        // Check for map calls that return JSX
        if (node.type === 'CallExpression') {
            const callee = node.callee;
            if (callee?.type === 'MemberExpression' &&
                callee.property?.name === 'map') {
                const callback = node.arguments?.[0];
                if (callback && this.returnsJSX(callback)) {
                    // Check if the JSX has a key prop
                    const jsxElement = this.getReturnedJSX(callback);
                    if (jsxElement && !this.hasKeyProp(jsxElement)) {
                        return true;
                    }
                    // Also check for index as key (anti-pattern)
                    if (jsxElement && this.hasIndexAsKey(jsxElement, callback)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
    isReactFile(context) {
        return context.language === 'javascriptreact' ||
            context.language === 'typescriptreact' ||
            context.filePath.includes('.jsx') ||
            context.filePath.includes('.tsx');
    }
    returnsJSX(node) {
        if (!node)
            return false;
        const body = node.body;
        // Direct return
        if (body?.type === 'JSXElement' || body?.type === 'JSXFragment') {
            return true;
        }
        // Return statement
        if (body?.type === 'BlockStatement') {
            const returnStmt = body.body?.find((stmt) => stmt.type === 'ReturnStatement');
            if (returnStmt?.argument?.type === 'JSXElement' ||
                returnStmt?.argument?.type === 'JSXFragment') {
                return true;
            }
        }
        // Implicit return in arrow function
        if (body?.type === 'JSXElement' ||
            (body?.type === 'ConditionalExpression' &&
                (body.consequent?.type === 'JSXElement' ||
                    body.alternate?.type === 'JSXElement'))) {
            return true;
        }
        return false;
    }
    getReturnedJSX(node) {
        const body = node.body;
        if (body?.type === 'JSXElement') {
            return body;
        }
        if (body?.type === 'BlockStatement') {
            const returnStmt = body.body?.find((stmt) => stmt.type === 'ReturnStatement');
            return returnStmt?.argument || null;
        }
        return null;
    }
    hasKeyProp(jsxElement) {
        if (!jsxElement || jsxElement.type !== 'JSXElement')
            return false;
        const attributes = jsxElement.openingElement?.attributes || [];
        return attributes.some((attr) => attr.type === 'JSXAttribute' && attr.name?.name === 'key');
    }
    hasIndexAsKey(jsxElement, mapCallback) {
        if (!jsxElement || !mapCallback)
            return false;
        // Check if second parameter of map callback is used as key
        const params = mapCallback.params;
        if (params?.length >= 2) {
            const indexParam = params[1]?.name;
            const attributes = jsxElement.openingElement?.attributes || [];
            const keyAttr = attributes.find((attr) => attr.type === 'JSXAttribute' && attr.name?.name === 'key');
            if (keyAttr?.value?.expression?.name === indexParam) {
                return true; // Using index as key
            }
        }
        return false;
    }
}
exports.MissingKeysInListsMatcher = MissingKeysInListsMatcher;
const missingKeysInListsTemplate = {
    title: '🔴 REACT LISTS: Missing or Incorrect Key Prop',
    problemDescription: 'React needs stable, unique keys to efficiently update lists. Missing keys or using array indices causes performance issues and bugs with component state.',
    impactDescription: 'Poor list performance, lost component state, incorrect animations, and input focus issues when list items change.',
    solutionDescription: 'Use stable, unique IDs as keys. Never use array index as key for dynamic lists.',
    codeExamples: [
        {
            title: 'Missing Key Fix',
            before: `// WRONG - No key prop
{items.map(item => (
  <li>{item.name}</li>
))}

// WRONG - Using index as key
{items.map((item, index) => (
  <li key={index}>{item.name}</li>
))}`,
            after: `// CORRECT - Unique, stable key
{items.map(item => (
  <li key={item.id}>{item.name}</li>
))}

// For objects without ID, generate stable keys
{items.map(item => (
  <li key={\`\${item.category}-\${item.name}\`}>
    {item.name}
  </li>
))}

// For static lists, index is OK
{staticItems.map((item, index) => (
  <li key={\`static-\${index}\`}>{item}</li>
))}`,
            improvement: 'Prevents re-render issues and state loss'
        },
        {
            title: 'Complex List Items',
            before: `// Problems with index as key
{todos.map((todo, index) => (
  <TodoItem 
    key={index}  // BAD!
    todo={todo}
    onDelete={() => deleteTodo(index)}
  />
))}

// Issues when reordering or deleting:
// - Input fields lose focus
// - Component state gets mixed up
// - Animations break`,
            after: `// Use unique IDs
{todos.map(todo => (
  <TodoItem 
    key={todo.id}  // Stable & unique
    todo={todo}
    onDelete={() => deleteTodo(todo.id)}
  />
))}

// For items without IDs, generate them
import { nanoid } from 'nanoid';

const todosWithIds = todos.map(todo => ({
  ...todo,
  id: todo.id || nanoid()
}));

// Or use a combination of properties
{todos.map(todo => (
  <TodoItem 
    key={\`\${todo.userId}-\${todo.createdAt}\`}
    todo={todo}
  />
))}`,
            improvement: 'Maintains component state correctly'
        }
    ],
    actions: [
        {
            label: 'Copy Key Solution',
            type: 'copy',
            payload: 'optimized-code'
        }
    ],
    learnMoreUrl: 'https://react.dev/learn/rendering-lists#keeping-list-items-in-order-with-key'
};
exports.missingKeysInListsRule = {
    id: 'missing-keys-in-lists',
    name: 'Missing Keys in Lists',
    description: 'Detects React list rendering without proper keys',
    category: types_1.PatternCategory.Performance,
    severity: 'critical',
    languages: ['javascriptreact', 'typescriptreact'],
    enabled: true,
    matcher: new MissingKeysInListsMatcher(),
    template: missingKeysInListsTemplate,
    scoreImpact: -10
};
//# sourceMappingURL=missing-keys-in-lists.js.map