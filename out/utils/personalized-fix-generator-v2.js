"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.personalizedFixGenerator = exports.PersonalizedFixGenerator = void 0;
/**
 * Universal Personalized Fix Generator - Version 2
 * Generates fixes using the EXACT user code
 */
class PersonalizedFixGenerator {
    constructor() { }
    static getInstance() {
        if (!PersonalizedFixGenerator.instance) {
            PersonalizedFixGenerator.instance = new PersonalizedFixGenerator();
        }
        return PersonalizedFixGenerator.instance;
    }
    /**
     * Generate a personalized fix for any pattern match
     */
    generateFix(match, context) {
        try {
            // Get the EXACT problematic code
            const problemCode = this.getExactProblemCode(match, context);
            if (!problemCode) {
                console.log('[PersonalizedFix] No problem code extracted');
                return undefined;
            }
            // Detect file context
            const fileContext = this.detectFileContext(context);
            // Generate fix based on the actual problem code
            const fix = this.generateFixForPattern(match.ruleId, problemCode, fileContext, match, context);
            return fix;
        }
        catch (error) {
            console.log('[PersonalizedFix] Generation failed:', error);
            return undefined;
        }
    }
    /**
     * Get the exact code that caused the problem
     */
    getExactProblemCode(match, context) {
        try {
            const node = match.node;
            const sourceCode = context.sourceCode;
            // Try to get from node first
            if (node.start !== undefined && node.end !== undefined) {
                return sourceCode.substring(node.start, node.end);
            }
            // Fallback to range
            if (match.range) {
                const lines = sourceCode.split('\n');
                const startLine = match.range.start.line;
                const endLine = match.range.end.line;
                if (startLine === endLine) {
                    const line = lines[startLine] || '';
                    return line.substring(match.range.start.character, match.range.end.character);
                }
                else {
                    const result = [];
                    for (let i = startLine; i <= endLine && i < lines.length; i++) {
                        const line = lines[i] || '';
                        if (i === startLine) {
                            result.push(line.substring(match.range.start.character));
                        }
                        else if (i === endLine) {
                            result.push(line.substring(0, match.range.end.character));
                        }
                        else {
                            result.push(line);
                        }
                    }
                    return result.join('\n');
                }
            }
            return '';
        }
        catch (e) {
            console.log('[PersonalizedFix] Failed to extract problem code:', e);
            return '';
        }
    }
    /**
     * Generate fix for specific pattern
     */
    generateFixForPattern(ruleId, problemCode, fileContext, _match, context) {
        console.log(`[PersonalizedFix] Generating fix for ${ruleId} with code:`, problemCode);
        switch (ruleId) {
            case 'memory-leaks':
                return this.fixMemoryLeak(problemCode, fileContext, context);
            case 'nested-loops':
                return this.fixNestedLoops(problemCode, fileContext, context);
            case 'string-concatenation-in-loops':
            case 'string-concatenation-in-loops-enhanced':
                return this.fixStringConcatenation(problemCode, fileContext, context);
            case 'blocking-sync-operations':
                return this.fixBlockingOperations(problemCode, fileContext, context);
            case 'function-too-long':
                return this.fixLongFunction(problemCode, fileContext, context);
            case 'missing-react-memo':
                return this.fixMissingMemo(problemCode, fileContext, context);
            case 'console-usage':
            case 'console-logs':
                return this.fixConsoleUsage(problemCode, fileContext, context);
            case 'expensive-operations-in-loops':
                return this.fixExpensiveOperations(problemCode, fileContext, context);
            case 'dom-queries-in-loops':
                return this.fixDOMQueries(problemCode, fileContext, context);
            case 'inline-function-props':
                return this.fixInlineFunctions(problemCode, fileContext, context);
            case 'direct-state-mutation':
                return this.fixStateMutation(problemCode, fileContext, context);
            case 'missing-keys-in-lists':
                return this.fixMissingKeys(problemCode, fileContext, context);
            default:
                return this.createGenericFix(problemCode, ruleId);
        }
    }
    /**
     * Fix memory leak - using EXACT user code
     */
    fixMemoryLeak(problemCode, _fileContext, context) {
        // Extract the element and event from the actual code
        const match = problemCode.match(/(\w+)\.addEventListener\s*\(\s*['"](\w+)['"]\s*,\s*(.+)\)/s);
        if (!match) {
            return this.createGenericFix(problemCode, 'memory-leaks');
        }
        const element = match[1] || 'element';
        const event = match[2] || 'click';
        const handler = match[3]?.trim() || '() => {}';
        // Check if it's inside a class/component
        const isClass = problemCode.includes('this.') || context.sourceCode.includes('class ');
        let fixedCode = '';
        if (isClass) {
            // Class-based fix
            fixedCode = `// YOUR CODE FIXED:
// Store handler reference for cleanup
this.${element}Handler = ${handler};
${element}.addEventListener('${event}', this.${element}Handler);

// Add cleanup method to your class:
cleanup() {
    if (this.${element}Handler) {
        const ${element} = document.getElementById('${element}');
        if (${element}) {
            ${element}.removeEventListener('${event}', this.${element}Handler);
            this.${element}Handler = null;
        }
    }
}

// Call cleanup when component unmounts/destroys`;
        }
        else {
            // Standalone fix
            fixedCode = `// YOUR CODE FIXED:
// Store handler reference
const ${element}Handler = ${handler};
${element}.addEventListener('${event}', ${element}Handler);

// Cleanup function
function cleanup${this.capitalize(element)}() {
    ${element}.removeEventListener('${event}', ${element}Handler);
}

// Call cleanup when appropriate (page unload, component destroy, etc.)`;
        }
        return {
            type: 'copy',
            text: fixedCode
        };
    }
    /**
     * Fix nested loops - using EXACT user code
     */
    fixNestedLoops(problemCode, _fileContext, _context) {
        // Extract the actual loop variables and arrays
        const outerLoop = problemCode.match(/for\s*\([^)]+of\s+(\w+)|for\s*\([^;]+;\s*\w+\s*<\s*(\w+)/);
        const innerLoop = problemCode.match(/for\s*\([^)]+of\s+(\w+)[\s\S]+for\s*\([^)]+of\s+(\w+)/);
        const outerArray = outerLoop ? (outerLoop[1] || outerLoop[2]) : 'outerArray';
        const innerArray = innerLoop ? innerLoop[2] : 'innerArray';
        // Extract what's being compared
        // const comparison = problemCode.match(/if\s*\(([^)]+)\)/);
        // const comparisonLogic = comparison ? comparison[1] : `${outerArray}[i].id === ${innerArray}[j].id`;
        const fixedCode = `// YOUR CODE FIXED:
// Use Map for O(n) lookup instead of O(n²) nested loops
const ${outerArray}Map = new Map();
for (const item of ${outerArray}) {
    ${outerArray}Map.set(item.id, item); // Adjust 'id' to your key field
}

// Single loop with O(1) lookup
const results = [];
for (const item of ${innerArray}) {
    if (${outerArray}Map.has(item.relatedId)) { // Adjust field names
        const matched = ${outerArray}Map.get(item.relatedId);
        // Your logic here
        results.push({ matched, item });
    }
}`;
        return {
            type: 'copy',
            text: fixedCode
        };
    }
    /**
     * Fix string concatenation - using EXACT user code
     */
    fixStringConcatenation(problemCode, _fileContext, context) {
        // Extract the variable being concatenated
        const concatMatch = problemCode.match(/(\w+)\s*\+=\s*(.+)/);
        const variable = concatMatch ? concatMatch[1] : 'result';
        const concatenated = concatMatch ? concatMatch[2] : '';
        // Find the loop context
        const loopMatch = context.sourceCode.match(/for\s*\([^)]*(\w+)\s+of\s+(\w+)/);
        const iterVar = loopMatch ? loopMatch[1] : 'item';
        const arrayName = loopMatch ? loopMatch[2] : 'items';
        // Check what's being built
        const isHTML = concatenated && concatenated.includes('<') && concatenated.includes('>');
        let fixedCode = '';
        if (isHTML) {
            fixedCode = `// YOUR CODE FIXED:
// Use array.map() and join() for HTML generation
const ${variable} = ${arrayName}.map(${iterVar} => {
    // Build your HTML string here
    return \`${concatenated.replace(/\+/g, '').trim()}\`;
}).join('');`;
        }
        else {
            fixedCode = `// YOUR CODE FIXED:
// Use array to collect parts, then join
const ${variable}Parts = [];
for (const ${iterVar} of ${arrayName}) {
    ${variable}Parts.push(${concatenated});
}
const ${variable} = ${variable}Parts.join('');`;
        }
        return {
            type: 'copy',
            text: fixedCode
        };
    }
    /**
     * Fix blocking operations - using EXACT user code
     */
    fixBlockingOperations(problemCode, _fileContext, _context) {
        // Extract the sync operation
        const syncMatch = problemCode.match(/(\w+)\s*=\s*(\w+\.readFileSync|.*Sync)\s*\(([^)]+)\)/);
        if (!syncMatch) {
            return this.createGenericFix(problemCode, 'blocking-sync');
        }
        const variable = syncMatch[1];
        const operation = syncMatch[2];
        const args = syncMatch[3];
        // Convert to async
        const asyncOp = operation?.replace('Sync', '') || 'asyncOperation';
        const fixedCode = `// YOUR CODE FIXED:
// Convert to async operation
async function loadData() {
    try {
        const ${variable} = await ${asyncOp}(${args});
        // Process ${variable}
        return ${variable};
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

// Use it
loadData().then(${variable} => {
    // Use ${variable} here
});`;
        return {
            type: 'copy',
            text: fixedCode
        };
    }
    /**
     * Fix long function - using EXACT user code
     */
    fixLongFunction(problemCode, _fileContext, _context) {
        // Extract function name
        const funcMatch = problemCode.match(/function\s+(\w+)|const\s+(\w+)\s*=/);
        const funcName = funcMatch ? (funcMatch[1] || funcMatch[2]) : 'processData';
        // Analyze the function body to suggest splits
        const hasValidation = problemCode.includes('if (') || problemCode.includes('throw');
        const hasLoop = problemCode.includes('for (') || problemCode.includes('while');
        const hasAsync = problemCode.includes('await') || problemCode.includes('fetch');
        let fixedCode = `// YOUR CODE FIXED:
// Split ${funcName} into smaller, focused functions

`;
        if (hasValidation) {
            fixedCode += `function validate${this.capitalize(funcName || 'Function')}Input(data) {
    // Move validation logic here
    if (!data) throw new Error('Invalid data');
    return true;
}

`;
        }
        if (hasLoop) {
            fixedCode += `function process${this.capitalize(funcName || 'Function')}Items(items) {
    // Move loop/processing logic here
    return items.map(item => {
        // Process each item
        return processedItem;
    });
}

`;
        }
        if (hasAsync) {
            fixedCode += `async function fetch${this.capitalize(funcName || 'Function')}Data(params) {
    // Move async operations here
    const response = await fetch(url);
    return response.json();
}

`;
        }
        fixedCode += `// Main function - orchestrate the helpers
async function ${funcName}(params) {
    // 1. Validate
    ${hasValidation ? `validate${this.capitalize(funcName || 'Function')}Input(params);` : ''}
    
    // 2. Fetch/Load data
    ${hasAsync ? `const data = await fetch${this.capitalize(funcName || 'Function')}Data(params);` : ''}
    
    // 3. Process
    ${hasLoop ? `const result = process${this.capitalize(funcName || 'Function')}Items(data);` : ''}
    
    return result;
}`;
        return {
            type: 'copy',
            text: fixedCode
        };
    }
    /**
     * Fix missing React.memo - using EXACT user code
     */
    fixMissingMemo(problemCode, fileContext, _context) {
        if (!fileContext.isReact) {
            return { type: 'copy', text: '// Not applicable to non-React code' };
        }
        // Extract component name
        const componentMatch = problemCode.match(/(?:function|const)\s+(\w+)/);
        const componentName = componentMatch ? componentMatch[1] : 'Component';
        // Get the full component code
        const fixedCode = `// YOUR CODE FIXED:
// Wrap with React.memo to prevent unnecessary re-renders
const ${componentName} = React.memo(${problemCode.trim()});

export default ${componentName};`;
        return {
            type: 'copy',
            text: fixedCode
        };
    }
    /**
     * Fix console usage - using EXACT user code
     */
    fixConsoleUsage(problemCode, _fileContext, _context) {
        // Get what's being logged
        const logMatch = problemCode.match(/console\.\w+\(([^)]+)\)/);
        const logContent = logMatch ? logMatch[1] : '"debug"';
        const fixedCode = `// YOUR CODE FIXED:
// Option 1: Conditional logging (recommended)
if (process.env.NODE_ENV !== 'production') {
    ${problemCode}
}

// Option 2: Debug utility
const debug = process.env.NODE_ENV !== 'production' 
    ? (...args) => console.log(...args) 
    : () => {};
    
debug(${logContent});

// Option 3: Remove completely for production
// ${problemCode} // <-- Remove this line`;
        return {
            type: 'copy',
            text: fixedCode
        };
    }
    /**
     * Fix expensive operations in loops - using EXACT user code
     */
    fixExpensiveOperations(problemCode, _fileContext, _context) {
        // Extract the operation and array
        const opMatch = problemCode.match(/(\w+)\.(find|filter|indexOf|includes)\(/);
        const arrayName = opMatch ? opMatch[1] : 'array';
        // const operation = opMatch ? opMatch[2] : 'find';
        const fixedCode = `// YOUR CODE FIXED:
// Move expensive operation outside the loop
// Create a Set/Map for O(1) lookup
const ${arrayName}Set = new Set(${arrayName}.map(item => item.id));

// Now use the Set in your loop
for (const item of otherArray) {
    if (${arrayName}Set.has(item.relatedId)) {
        // O(1) lookup instead of O(n)
        // Your logic here
    }
}`;
        return {
            type: 'copy',
            text: fixedCode
        };
    }
    /**
     * Fix DOM queries in loops - using EXACT user code
     */
    fixDOMQueries(problemCode, _fileContext, _context) {
        // Extract the query
        const queryMatch = problemCode.match(/document\.(querySelector|getElementById|getElementsBy\w+)\(([^)]+)\)/);
        const method = queryMatch ? queryMatch[1] : 'querySelector';
        const selector = queryMatch ? queryMatch[2] : '"selector"';
        const fixedCode = `// YOUR CODE FIXED:
// Cache DOM queries outside the loop
const elements = document.${method}All(${selector});
const elementCache = new Map();

// Pre-cache all elements
elements.forEach(el => {
    elementCache.set(el.id, el);
});

// Use cached elements in loop
for (const item of items) {
    const element = elementCache.get(item.id);
    if (element) {
        // Work with cached element - no DOM query needed
    }
}`;
        return {
            type: 'copy',
            text: fixedCode
        };
    }
    /**
     * Fix inline functions - using EXACT user code
     */
    fixInlineFunctions(problemCode, fileContext, _context) {
        if (!fileContext.isReact) {
            return { type: 'copy', text: '// Not applicable to non-React code' };
        }
        // Extract the prop and function
        const propMatch = problemCode.match(/(\w+)=\{(.+?)\}/);
        const propName = propMatch ? (propMatch[1] || 'onClick') : 'onClick';
        const inlineFunc = propMatch ? propMatch[2] : '() => {}';
        const fixedCode = `// YOUR CODE FIXED:
// Move inline function outside render
const handle${this.capitalize(propName || 'Click')} = useCallback(${inlineFunc}, [/* dependencies */]);

// Then use it in your JSX:
<Component ${propName}={handle${this.capitalize(propName || 'Click')}} />`;
        return {
            type: 'copy',
            text: fixedCode
        };
    }
    /**
     * Fix state mutation - using EXACT user code
     */
    fixStateMutation(problemCode, fileContext, _context) {
        if (!fileContext.isReact) {
            return { type: 'copy', text: '// Not applicable to non-React code' };
        }
        // Extract what's being mutated
        const mutationMatch = problemCode.match(/(\w+)\.push\(|(\w+)\[.+\]\s*=|(\w+)\.(\w+)\s*=/);
        const stateName = mutationMatch ? (mutationMatch[1] || mutationMatch[2] || mutationMatch[3] || 'state') : 'state';
        const fixedCode = `// YOUR CODE FIXED:
// Never mutate state directly - create a new copy

// Instead of: ${problemCode}

// Do this:
set${this.capitalize(stateName || 'State')}(prev => {
    // Create a new copy
    const newState = [...prev]; // for arrays
    // or
    const newState = { ...prev }; // for objects
    
    // Make your changes to the copy
    // newState.push(item); or newState.property = value;
    
    return newState;
});`;
        return {
            type: 'copy',
            text: fixedCode
        };
    }
    /**
     * Fix missing keys - using EXACT user code
     */
    fixMissingKeys(problemCode, fileContext, _context) {
        if (!fileContext.isReact) {
            return { type: 'copy', text: '// Not applicable to non-React code' };
        }
        // Extract the map operation
        const mapMatch = problemCode.match(/(\w+)\.map\s*\(([^)]+)\)/);
        const arrayName = mapMatch ? mapMatch[1] : 'items';
        const param = mapMatch ? mapMatch[2] : 'item';
        const fixedCode = `// YOUR CODE FIXED:
// Add unique key prop to list items
${arrayName}.map((${param}, index) => (
    <div key={${param}.id || \`${arrayName}-\${index}\`}>
        {/* Your JSX content */}
    </div>
))`;
        return {
            type: 'copy',
            text: fixedCode
        };
    }
    /**
     * Detect file context
     */
    detectFileContext(context) {
        const filePath = context.filePath;
        const sourceCode = context.sourceCode;
        const language = context.language;
        return {
            language,
            isTypeScript: filePath.endsWith('.ts') || filePath.endsWith('.tsx'),
            isReact: filePath.endsWith('.jsx') || filePath.endsWith('.tsx') ||
                sourceCode.includes('import React') || sourceCode.includes('from "react"'),
            isVue: sourceCode.includes('vue'),
            isPHP: filePath.endsWith('.php'),
            isNodeJS: sourceCode.includes('require(') || sourceCode.includes('module.exports'),
            isBrowser: sourceCode.includes('document.') || sourceCode.includes('window.'),
            isJSX: filePath.endsWith('.jsx') || filePath.endsWith('.tsx'),
            filePath
        };
    }
    /**
     * Create a generic fix when we can't parse the code
     */
    createGenericFix(problemCode, ruleId) {
        return {
            type: 'copy',
            text: `// YOUR CODE:
${problemCode}

// SUGGESTED FIX:
// Apply the recommended solution for ${ruleId} to your specific code above`
        };
    }
    /**
     * Capitalize first letter
     */
    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
}
exports.PersonalizedFixGenerator = PersonalizedFixGenerator;
// Export singleton
exports.personalizedFixGenerator = PersonalizedFixGenerator.getInstance();
//# sourceMappingURL=personalized-fix-generator-v2.js.map