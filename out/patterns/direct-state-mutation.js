"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.directStateMutationRule = exports.DirectStateMutationMatcher = void 0;
const types_1 = require("../types");
/**
 * Detects direct state mutations in React components
 */
class DirectStateMutationMatcher {
    match(node, context) {
        if (!this.isReactFile(context))
            return false;
        // Check for array mutation methods
        if (node.type === 'CallExpression') {
            const callee = node.callee;
            if (callee?.type === 'MemberExpression') {
                const property = callee.property;
                const object = callee.object;
                // Check for mutating array methods
                const mutatingMethods = ['push', 'pop', 'shift', 'unshift', 'splice', 'sort', 'reverse'];
                if (property?.type === 'Identifier' && mutatingMethods.includes(property.name)) {
                    // Check if it's operating on state
                    if (this.isStateVariable(object, context)) {
                        return true;
                    }
                }
            }
        }
        // Check for direct property assignment to state
        if (node.type === 'AssignmentExpression') {
            const left = node.left;
            if (left?.type === 'MemberExpression') {
                const object = left.object;
                if (this.isStateVariable(object, context)) {
                    return true;
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
    isStateVariable(node, _context) {
        if (!node)
            return false;
        // Simple heuristic: check if variable name contains 'state' or common state patterns
        if (node.type === 'Identifier') {
            const name = node.name;
            // Common state variable patterns
            if (name.includes('state') ||
                name.includes('State') ||
                name === 'items' ||
                name === 'users' ||
                name === 'data' ||
                name === 'list') {
                return true;
            }
        }
        // Check for this.state (class components)
        if (node.type === 'MemberExpression') {
            const object = node.object;
            const property = node.property;
            if (object?.type === 'ThisExpression' && property?.name === 'state') {
                return true;
            }
            // Check for nested state access (e.g., state.items)
            if (object?.type === 'Identifier' && object.name.includes('state')) {
                return true;
            }
        }
        return false;
    }
}
exports.DirectStateMutationMatcher = DirectStateMutationMatcher;
const directStateMutationTemplate = {
    title: '🔴 REACT STATE: Direct State Mutation Detected',
    problemDescription: 'Directly mutating state in React doesn\'t trigger re-renders and can cause unpredictable behavior. React relies on immutability to detect changes.',
    impactDescription: 'UI not updating, stale data displayed, React optimizations broken, hard-to-debug issues.',
    solutionDescription: 'Always create new objects/arrays when updating state. Use spread operator, concat, filter, map, or libraries like Immer.',
    codeExamples: [
        {
            title: 'Array Mutations',
            before: `// WRONG - Direct mutation
const [items, setItems] = useState([1, 2, 3]);

// These mutate the original array
items.push(4);
items.pop();
items[0] = 99;
items.splice(1, 1);
items.sort();

setItems(items); // React won't re-render!`,
            after: `// CORRECT - Create new array
const [items, setItems] = useState([1, 2, 3]);

// Add item
setItems([...items, 4]);
setItems(prev => [...prev, 4]);

// Remove last item
setItems(items.slice(0, -1));

// Update item at index
setItems(items.map((item, i) => 
  i === 0 ? 99 : item
));

// Remove item at index
setItems(items.filter((_, i) => i !== 1));

// Sort (create copy first)
setItems([...items].sort());`,
            improvement: 'Guarantees re-renders and predictable updates'
        },
        {
            title: 'Object Mutations',
            before: `// WRONG - Direct mutation
const [user, setUser] = useState({ 
  name: 'John', 
  address: { city: 'NYC' } 
});

// These mutate the original object
user.name = 'Jane';
user.address.city = 'LA';
delete user.age;

setUser(user); // No re-render!`,
            after: `// CORRECT - Create new object
const [user, setUser] = useState({ 
  name: 'John', 
  address: { city: 'NYC' } 
});

// Update property
setUser({ ...user, name: 'Jane' });

// Update nested property
setUser({
  ...user,
  address: { ...user.address, city: 'LA' }
});

// Remove property
const { age, ...userWithoutAge } = user;
setUser(userWithoutAge);

// Or use Immer for complex updates
import { produce } from 'immer';
setUser(produce(draft => {
  draft.name = 'Jane';
  draft.address.city = 'LA';
}));`,
            improvement: 'Ensures proper re-renders and state updates'
        }
    ],
    actions: [
        {
            label: 'Copy Immutable Solution',
            type: 'copy',
            payload: 'optimized-code'
        }
    ],
    learnMoreUrl: 'https://react.dev/learn/updating-objects-in-state'
};
exports.directStateMutationRule = {
    id: 'direct-state-mutation',
    name: 'Direct State Mutation',
    description: 'Detects direct mutations of React state',
    category: types_1.PatternCategory.Performance,
    severity: 'critical',
    languages: ['javascriptreact', 'typescriptreact'],
    enabled: true,
    matcher: new DirectStateMutationMatcher(),
    template: directStateMutationTemplate,
    scoreImpact: -15
};
//# sourceMappingURL=direct-state-mutation.js.map