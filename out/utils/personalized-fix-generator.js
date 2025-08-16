"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.personalizedFixGenerator = exports.PersonalizedFixGenerator = void 0;
/**
 * Enhanced Personalized Fix Generator
 * Handles more patterns including setTimeout
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
        console.log(`[PersonalizedFix] Generating fix for ${ruleId}`);
        console.log(`[PersonalizedFix] Problem code:`, problemCode);
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
     * Fix memory leak - ENHANCED to handle all types
     */
    fixMemoryLeak(problemCode, _fileContext, context) {
        console.log('[PersonalizedFix] Analyzing memory leak code:', problemCode);
        // Check if it's inside a class
        const isInClass = context.sourceCode.includes('class ') &&
            (context.sourceCode.includes('constructor') ||
                problemCode.includes('this.'));
        // Analyze the surrounding context to get class/function name
        const functionContext = this.getFunctionContext(context, problemCode);
        // Check for different memory leak patterns
        // 1. addEventListener
        const listenerMatch = problemCode.match(/(\w+)\.addEventListener\s*\(\s*['"](\w+)['"]\s*,\s*(.+?)\s*\)/s);
        // 2. setTimeout
        const setTimeoutMatch = problemCode.match(/(?:this\.)?(\w*)\s*=?\s*setTimeout\s*\(\s*(.+?)\s*,\s*(\d+)\s*\)/s);
        // 3. setInterval  
        const setIntervalMatch = problemCode.match(/(?:this\.)?(\w*)\s*=?\s*setInterval\s*\(\s*(.+?)\s*,\s*(\d+)\s*\)/s);
        if (listenerMatch) {
            console.log('[PersonalizedFix] Found addEventListener');
            const element = listenerMatch[1] || 'element';
            const event = listenerMatch[2] || 'click';
            const handler = (listenerMatch[3] || '() => {}').trim();
            if (isInClass) {
                return {
                    type: 'copy',
                    text: `// YOUR CODE FIXED:
class ${functionContext.className || 'YourClass'} {
    constructor() {
        ${functionContext.otherCode || '// ... other initialization'}
        
        // Store handler reference for cleanup
        this.${element}Handler = ${handler};
        document.addEventListener('${event}', this.${element}Handler);
    }
    
    ${functionContext.methodName || 'handleClick'}() {
        ${functionContext.methodBody || '// Your handler logic'}
    }
    
    // ADD THIS: Cleanup method
    destroy() {
        // Remove event listener
        if (this.${element}Handler) {
            document.removeEventListener('${event}', this.${element}Handler);
            this.${element}Handler = null;
        }
    }
}`
                };
            }
            else {
                return {
                    type: 'copy',
                    text: `// YOUR CODE FIXED:
// Store handler reference for cleanup
const ${element}Handler = ${handler};
${element}.addEventListener('${event}', ${element}Handler);

// Add cleanup function
function cleanup() {
    ${element}.removeEventListener('${event}', ${element}Handler);
}

// Call cleanup when appropriate (page unload, component destroy, etc.)
window.addEventListener('beforeunload', cleanup);`
                };
            }
        }
        if (setTimeoutMatch || setIntervalMatch) {
            const isInterval = !!setIntervalMatch;
            const match = setTimeoutMatch || setIntervalMatch;
            const varName = match && match[1] ? match[1] : 'timer';
            const callback = match ? match[2] : '() => {}';
            const delay = match ? match[3] : '1000';
            const timerType = isInterval ? 'setInterval' : 'setTimeout';
            const clearType = isInterval ? 'clearInterval' : 'clearTimeout';
            console.log(`[PersonalizedFix] Found ${timerType}`);
            if (isInClass) {
                return {
                    type: 'copy',
                    text: `// YOUR CODE FIXED:
class ${functionContext.className || 'EventManager'} {
    constructor() {
        ${functionContext.otherCode || 'this.data = [];'}
        
        // Store timer reference for cleanup
        this.${varName} = ${timerType}(${callback}, ${delay});
    }
    
    ${functionContext.methodName || 'handleClick'}() {
        ${functionContext.methodBody || 'this.data.push(new Date());'}
    }
    
    // ADD THIS: Cleanup method
    destroy() {
        // Clear timer
        if (this.${varName}) {
            ${clearType}(this.${varName});
            this.${varName} = null;
        }
        
        // Clear other references
        this.data = null;
    }
}`
                };
            }
            else {
                return {
                    type: 'copy',
                    text: `// YOUR CODE FIXED:
// Store timer reference for cleanup
let ${varName} = ${timerType}(${callback}, ${delay});

// Add cleanup function
function cleanup() {
    if (${varName}) {
        ${clearType}(${varName});
        ${varName} = null;
    }
}

// Call cleanup when appropriate
window.addEventListener('beforeunload', cleanup);
// Or call cleanup() when component unmounts`
                };
            }
        }
        // Generic memory leak fix if pattern not recognized
        return {
            type: 'copy',
            text: `// YOUR CODE:
${problemCode}

// SUGGESTED FIX:
// Add proper cleanup for event listeners, timers, and references
// 1. Store references to handlers/timers
// 2. Create a cleanup/destroy method
// 3. Remove listeners, clear timers, nullify references in cleanup`
        };
    }
    /**
     * Get function/class context around the problem code
     */
    getFunctionContext(context, problemCode) {
        const sourceCode = context.sourceCode;
        // Find class name
        const classMatch = sourceCode.match(/class\s+(\w+)/);
        const className = classMatch ? classMatch[1] : undefined;
        // Find constructor content
        const constructorMatch = sourceCode.match(/constructor\s*\([^)]*\)\s*\{([^}]+)\}/);
        const constructorBody = constructorMatch ? constructorMatch[1] : '';
        // Extract other initialization code (excluding the problem code)
        const otherCode = constructorBody ? constructorBody
            .split('\n')
            .filter(line => !line.includes(problemCode.trim()))
            .map(line => line.trim())
            .filter(line => line && !line.startsWith('//'))
            .join('\n        ') : '';
        // Find method names and bodies
        const methodMatch = sourceCode.match(/(\w+)\s*\([^)]*\)\s*\{([^}]+)\}/g);
        const methodName = methodMatch ? methodMatch[0].match(/(\w+)\s*\(/)?.[1] : undefined;
        const methodBody = methodMatch ? methodMatch[0].match(/\{([^}]+)\}/)?.[1]?.trim() : undefined;
        return {
            className,
            otherCode,
            methodName,
            methodBody
        };
    }
    /**
     * Fix nested loops - using EXACT user code
     */
    fixNestedLoops(problemCode, _fileContext, _context) {
        // Extract the actual arrays being looped
        const forLoopMatch = problemCode.match(/for\s*\(\s*let\s+(\w+)\s*=\s*\d+;\s*\w+\s*<\s*(\w+)\.length[\s\S]+for\s*\(\s*let\s+(\w+)\s*=\s*\d+;\s*\w+\s*<\s*(\w+)\.length/);
        if (forLoopMatch) {
            const [, _outerIndex, outerArray, _innerIndex, innerArray] = forLoopMatch;
            // Extract comparison logic
            const comparisonMatch = problemCode.match(/if\s*\(([^)]+)\)/);
            const comparison = comparisonMatch ? comparisonMatch[1] : '';
            // Parse the comparison to understand the relationship
            const relationMatch = comparison ? comparison.match(/(\w+)\[(\w+)\]\.(\w+)\s*===\s*(\w+)\[(\w+)\]\.(\w+)/) : null;
            let key1 = 'id';
            let key2 = 'userId';
            if (relationMatch) {
                key1 = relationMatch[3] || 'id';
                key2 = relationMatch[6] || 'userId';
            }
            return {
                type: 'copy',
                text: `// YOUR CODE FIXED:
// O(n) - Optimized with Map
const ${outerArray || 'outer'}Map = new Map(${outerArray || 'outer'}.map(u => [u.${key1}, u]));
const results = ${innerArray || 'inner'}
  .filter(item => ${outerArray || 'outer'}Map.has(item.${key2}))
  .map(item => ({
    ${outerArray ? outerArray.slice(0, -1) : 'item'}: ${outerArray || 'outer'}Map.get(item.${key2}),
    ${innerArray ? innerArray.slice(0, -1) : 'item'}: item
  }));`
            };
        }
        // Fallback for for...of loops
        const outerLoop = problemCode.match(/for\s*\([^)]+of\s+(\w+)/);
        const innerLoop = problemCode.match(/for\s*\([^)]+of\s+(\w+)[\s\S]+for\s*\([^)]+of\s+(\w+)/);
        const outerArray = outerLoop ? outerLoop[1] : 'outerArray';
        const innerArray = innerLoop ? innerLoop[2] : 'innerArray';
        return {
            type: 'copy',
            text: `// YOUR CODE FIXED:
// Use Map for O(n) lookup instead of O(n²)
const ${outerArray}Map = new Map(${outerArray}.map(item => [item.id, item]));

const results = [];
for (const item of ${innerArray}) {
    if (${outerArray}Map.has(item.relatedId)) {
        const matched = ${outerArray}Map.get(item.relatedId);
        results.push({ matched, item });
    }
}`
        };
    }
    // Copy other methods from original file...
    fixStringConcatenation(problemCode, _fileContext, context) {
        const concatMatch = problemCode.match(/(\w+)\s*\+=\s*(.+)/);
        const variable = concatMatch ? concatMatch[1] : 'result';
        const concatenated = concatMatch ? concatMatch[2] : '';
        const loopMatch = context.sourceCode.match(/for\s*\([^)]*(\w+)\s+of\s+(\w+)/);
        const iterVar = loopMatch ? loopMatch[1] : 'item';
        const arrayName = loopMatch ? loopMatch[2] : 'items';
        const isHTML = concatenated && concatenated.includes('<') && concatenated.includes('>');
        let fixedCode = '';
        if (isHTML) {
            fixedCode = `// YOUR CODE FIXED:
const ${variable} = ${arrayName}.map(${iterVar} => {
    return \`${concatenated.replace(/\+/g, '').trim()}\`;
}).join('');`;
        }
        else {
            fixedCode = `// YOUR CODE FIXED:
const ${variable}Parts = [];
for (const ${iterVar} of ${arrayName}) {
    ${variable}Parts.push(${concatenated});
}
const ${variable} = ${variable}Parts.join('');`;
        }
        return { type: 'copy', text: fixedCode };
    }
    fixBlockingOperations(problemCode, _fileContext, _context) {
        const syncMatch = problemCode.match(/(\w+)\s*=\s*(\w+\.readFileSync|.*Sync)\s*\(([^)]+)\)/);
        if (!syncMatch) {
            return this.createGenericFix(problemCode, 'blocking-sync');
        }
        const variable = syncMatch[1];
        const operation = syncMatch[2];
        const args = syncMatch[3];
        const asyncOp = operation?.replace('Sync', '') || 'asyncOperation';
        return {
            type: 'copy',
            text: `// YOUR CODE FIXED:
async function loadData() {
    try {
        const ${variable} = await ${asyncOp}(${args});
        return ${variable};
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

loadData().then(${variable} => {
    // Use ${variable} here
});`
        };
    }
    fixLongFunction(problemCode, _fileContext, _context) {
        const funcMatch = problemCode.match(/function\s+(\w+)|const\s+(\w+)\s*=/);
        const funcName = funcMatch ? (funcMatch[1] || funcMatch[2]) : 'processData';
        return {
            type: 'copy',
            text: `// YOUR CODE FIXED:
// Split ${funcName} into smaller functions

function validate${this.capitalize(funcName || 'Data')}(data) {
    // Validation logic
    if (!data) throw new Error('Invalid data');
    return true;
}

function process${this.capitalize(funcName || 'Data')}Core(data) {
    // Core processing logic
    return processedData;
}

async function ${funcName}(params) {
    validate${this.capitalize(funcName || 'Data')}(params);
    const result = process${this.capitalize(funcName || 'Data')}Core(params);
    return result;
}`
        };
    }
    fixMissingMemo(problemCode, fileContext, _context) {
        if (!fileContext.isReact) {
            return { type: 'copy', text: '// Not applicable to non-React code' };
        }
        const componentMatch = problemCode.match(/(?:function|const)\s+(\w+)/);
        const componentName = componentMatch ? componentMatch[1] : 'Component';
        return {
            type: 'copy',
            text: `// YOUR CODE FIXED:
const ${componentName} = React.memo(${problemCode.trim()});

export default ${componentName};`
        };
    }
    fixConsoleUsage(problemCode, _fileContext, _context) {
        const logMatch = problemCode.match(/console\.\w+\(([^)]+)\)/);
        const logContent = logMatch ? logMatch[1] : '"debug"';
        return {
            type: 'copy',
            text: `// YOUR CODE FIXED:
if (process.env.NODE_ENV !== 'production') {
    ${problemCode}
}

// Or use a debug utility:
const debug = process.env.NODE_ENV !== 'production' ? console.log : () => {};
debug(${logContent});`
        };
    }
    fixExpensiveOperations(problemCode, _fileContext, _context) {
        const opMatch = problemCode.match(/(\w+)\.(find|filter|indexOf|includes)\(/);
        const arrayName = opMatch ? opMatch[1] : 'array';
        return {
            type: 'copy',
            text: `// YOUR CODE FIXED:
const ${arrayName}Set = new Set(${arrayName}.map(item => item.id));

for (const item of otherArray) {
    if (${arrayName}Set.has(item.relatedId)) {
        // O(1) lookup instead of O(n)
    }
}`
        };
    }
    fixDOMQueries(problemCode, _fileContext, _context) {
        const queryMatch = problemCode.match(/document\.(querySelector|getElementById|getElementsBy\w+)\(([^)]+)\)/);
        const method = queryMatch ? queryMatch[1] : 'querySelector';
        const selector = queryMatch ? queryMatch[2] : '"selector"';
        return {
            type: 'copy',
            text: `// YOUR CODE FIXED:
const elements = document.${method}All(${selector});
const elementCache = new Map();

elements.forEach(el => {
    elementCache.set(el.id, el);
});

for (const item of items) {
    const element = elementCache.get(item.id);
    if (element) {
        // Use cached element
    }
}`
        };
    }
    fixInlineFunctions(problemCode, fileContext, _context) {
        if (!fileContext.isReact) {
            return { type: 'copy', text: '// Not applicable to non-React code' };
        }
        const propMatch = problemCode.match(/(\w+)=\{(.+?)\}/);
        const propName = propMatch ? propMatch[1] : 'onClick';
        const inlineFunc = propMatch ? propMatch[2] : '() => {}';
        return {
            type: 'copy',
            text: `// YOUR CODE FIXED:
const handle${this.capitalize(propName || 'Click')} = useCallback(${inlineFunc}, [/* dependencies */]);

<Component ${propName}={handle${this.capitalize(propName || 'Click')}} />`
        };
    }
    fixStateMutation(problemCode, fileContext, _context) {
        if (!fileContext.isReact) {
            return { type: 'copy', text: '// Not applicable to non-React code' };
        }
        const mutationMatch = problemCode.match(/(\w+)\.push\(|(\w+)\[.+\]\s*=|(\w+)\.(\w+)\s*=/);
        const stateName = mutationMatch ? (mutationMatch[1] || mutationMatch[2] || mutationMatch[3] || 'state') : 'state';
        return {
            type: 'copy',
            text: `// YOUR CODE FIXED:
// Instead of: ${problemCode}

set${this.capitalize(stateName || 'State')}(prev => {
    const newState = [...prev]; // for arrays
    // or
    const newState = { ...prev }; // for objects
    
    // Make changes to the copy
    return newState;
});`
        };
    }
    fixMissingKeys(problemCode, fileContext, _context) {
        if (!fileContext.isReact) {
            return { type: 'copy', text: '// Not applicable to non-React code' };
        }
        const mapMatch = problemCode.match(/(\w+)\.map\s*\(([^)]+)\)/);
        const arrayName = mapMatch ? mapMatch[1] : 'items';
        const param = mapMatch ? mapMatch[2] : 'item';
        return {
            type: 'copy',
            text: `// YOUR CODE FIXED:
${arrayName}.map((${param}, index) => (
    <div key={${param}.id || \`${arrayName}-\${index}\`}>
        {/* Your JSX content */}
    </div>
))`
        };
    }
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
    createGenericFix(problemCode, ruleId) {
        return {
            type: 'copy',
            text: `// YOUR CODE:
${problemCode}

// SUGGESTED FIX:
// Apply the recommended solution for ${ruleId} to your specific code above`
        };
    }
    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
}
exports.PersonalizedFixGenerator = PersonalizedFixGenerator;
// Export singleton
exports.personalizedFixGenerator = PersonalizedFixGenerator.getInstance();
//# sourceMappingURL=personalized-fix-generator.js.map