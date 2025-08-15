"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.missingDependenciesRule = exports.MissingDependenciesMatcher = void 0;
const types_1 = require("../types");
/**
 * Detects useEffect hooks with missing or incorrect dependencies
 */
class MissingDependenciesMatcher {
    match(node, context) {
        if (!this.isReactFile(context))
            return false;
        // Check if it's a useEffect call
        if (node.type !== 'CallExpression')
            return false;
        const callee = node.callee;
        if (callee?.type !== 'Identifier' || callee.name !== 'useEffect')
            return false;
        const args = node.arguments;
        if (!args || args.length < 2) {
            // useEffect without dependency array
            return true;
        }
        // Check the dependency array
        const deps = args[1];
        const callback = args[0];
        if (!callback)
            return false;
        // Empty dependency array might be intentional, but check for used variables
        if (deps?.type === 'ArrayExpression') {
            const dependencies = deps.elements || [];
            const usedVariables = this.extractUsedVariables(callback);
            const providedDeps = dependencies.map((dep) => dep?.name || dep?.value);
            // Check for missing dependencies
            for (const variable of usedVariables) {
                if (!providedDeps.includes(variable) && this.isExternalVariable(variable)) {
                    return true; // Found missing dependency
                }
            }
        }
        return false;
    }
    getMatchDetails(_node, _context) {
        try {
            // Best-effort suggestion: present a fixed template to copy
            // We don't mutate user code automatically because computing exact deps is context-sensitive.
            const example = `// Ensure all referenced values are listed in deps or use callbacks/memos
useEffect(() => {
  // ...effect code
}, [/* add missing deps here */]);`;
            return {
                suggestion: 'Include all referenced props/state/functions in the dependency array, or stabilize functions with useCallback/useMemo.',
                fix: {
                    type: 'copy',
                    title: 'Add required dependencies',
                    text: example
                }
            };
        }
        catch {
            return { suggestion: undefined, examples: undefined };
        }
    }
    isReactFile(context) {
        return context.language === 'javascriptreact' ||
            context.language === 'typescriptreact' ||
            context.filePath.includes('.jsx') ||
            context.filePath.includes('.tsx');
    }
    extractUsedVariables(node) {
        const variables = new Set();
        const traverse = (n) => {
            if (!n)
                return;
            // Identifier usage
            if (n.type === 'Identifier') {
                variables.add(n.name);
            }
            // Member expression (e.g., props.value)
            if (n.type === 'MemberExpression') {
                const object = n.object;
                if (object?.type === 'Identifier') {
                    variables.add(object.name);
                }
            }
            // Traverse all properties
            for (const key in n) {
                const value = n[key];
                if (Array.isArray(value)) {
                    value.forEach(item => {
                        if (item && typeof item === 'object')
                            traverse(item);
                    });
                }
                else if (value && typeof value === 'object' && value.type) {
                    traverse(value);
                }
            }
        };
        traverse(node);
        return variables;
    }
    isExternalVariable(name) {
        // Filter out built-ins and common globals
        const builtins = [
            'console', 'window', 'document', 'setTimeout', 'setInterval',
            'clearTimeout', 'clearInterval', 'fetch', 'alert', 'confirm',
            'localStorage', 'sessionStorage', 'location', 'history',
            'JSON', 'Math', 'Date', 'Array', 'Object', 'String', 'Number',
            'Boolean', 'Promise', 'Set', 'Map', 'WeakMap', 'WeakSet'
        ];
        return !builtins.includes(name);
    }
}
exports.MissingDependenciesMatcher = MissingDependenciesMatcher;
const missingDependenciesTemplate = {
    title: '🔴 REACT HOOKS: Missing or Incorrect Dependencies',
    problemDescription: 'useEffect is missing dependencies or has an incorrect dependency array. This can cause stale closures, infinite loops, or effects not running when expected.',
    impactDescription: 'Bugs from stale values, effects not updating, or infinite re-renders that crash the app.',
    solutionDescription: 'Include all referenced props, state, and functions in the dependency array, or use useCallback/useMemo for stable references.',
    codeExamples: [
        {
            title: 'Missing Dependencies',
            before: `// Missing count in dependencies
const [count, setCount] = useState(0);

useEffect(() => {
  const timer = setInterval(() => {
    setCount(count + 1); // Stale closure!
  }, 1000);
  return () => clearInterval(timer);
}, []); // Missing: count`,
            after: `// Option 1: Include dependency
useEffect(() => {
  const timer = setInterval(() => {
    setCount(prev => prev + 1); // Use callback
  }, 1000);
  return () => clearInterval(timer);
}, []); // No external deps needed

// Option 2: Include count
useEffect(() => {
  const timer = setTimeout(() => {
    setCount(count + 1);
  }, 1000);
  return () => clearTimeout(timer);
}, [count]); // Runs on every count change`,
            improvement: 'Prevents stale closure bugs'
        },
        {
            title: 'Function Dependencies',
            before: `// Function recreated every render
const fetchData = () => {
  fetch(\`/api/user/\${userId}\`)
    .then(res => res.json())
    .then(setData);
};

useEffect(() => {
  fetchData();
}, []); // Missing: fetchData, userId`,
            after: `// Stable function reference
const fetchData = useCallback(() => {
  fetch(\`/api/user/\${userId}\`)
    .then(res => res.json())
    .then(setData);
}, [userId]);

useEffect(() => {
  fetchData();
}, [fetchData]); // Correct dependencies

// Or inline the function
useEffect(() => {
  fetch(\`/api/user/\${userId}\`)
    .then(res => res.json())
    .then(setData);
}, [userId]); // Only external dep`,
            improvement: 'Ensures effect runs when needed'
        }
    ],
    actions: [
        {
            label: 'Copy Fixed Dependencies',
            type: 'copy',
            payload: 'optimized-code'
        }
    ],
    learnMoreUrl: 'https://react.dev/reference/react/useEffect#specifying-reactive-dependencies'
};
exports.missingDependenciesRule = {
    id: 'missing-dependencies',
    name: 'Missing Dependencies',
    description: 'Detects React hooks with missing or incorrect dependencies',
    category: types_1.PatternCategory.Performance,
    severity: 'critical',
    languages: ['javascriptreact', 'typescriptreact'],
    enabled: true,
    matcher: new MissingDependenciesMatcher(),
    template: missingDependenciesTemplate,
    scoreImpact: -12
};
//# sourceMappingURL=missing-dependencies.js.map