"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.personalizedFixGenerator = exports.PersonalizedFixGenerator = void 0;
/**
 * Universal Personalized Fix Generator
 * Generates context-aware, personalized fixes for all patterns
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
            // 1. Get the EXACT problematic code
            const problemCode = this.getExactProblemCode(match, context);
            // 2. Detect the actual file type and framework
            const fileContext = this.detectFileContext(context);
            // 3. Extract code elements (variables, functions, etc.)
            const codeElements = this.extractCodeElements(match, context);
            // 4. Generate personalized fix based on pattern
            const personalizedFix = this.buildPersonalizedFix(match.ruleId, codeElements, fileContext, match, context, problemCode);
            // 5. Filter inappropriate suggestions based on context
            return this.filterByContext(personalizedFix, fileContext);
        }
        catch (error) {
            console.log('[PersonalizedFix] Generation failed:', error);
            return undefined; // Fall back to generic template
        }
    }
    /**
     * Get the exact code that caused the problem
     */
    getExactProblemCode(match, context) {
        try {
            const node = match.node;
            const sourceCode = context.sourceCode;
            if (node.start !== undefined && node.end !== undefined) {
                return sourceCode.substring(node.start, node.end);
            }
            // Fallback: try to get from range
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
     * Detect file type and framework context
     */
    detectFileContext(context) {
        const filePath = context.filePath;
        const sourceCode = context.sourceCode;
        const language = context.language;
        // Check file extension
        const isJSX = filePath.endsWith('.jsx') || filePath.endsWith('.tsx');
        const isTypeScript = filePath.endsWith('.ts') || filePath.endsWith('.tsx');
        const isPHP = filePath.endsWith('.php');
        // Check for React imports/usage
        const hasReactImport = /import\s+(?:React|\{[^}]*\})\s+from\s+['"]react['"]/.test(sourceCode);
        const hasJSXSyntax = /<[A-Z]\w*[\s>]/.test(sourceCode) || /<\/[A-Z]\w*>/.test(sourceCode);
        const hasHooks = /use[A-Z]\w*\s*\(/.test(sourceCode);
        const isReact = isJSX || hasReactImport || hasJSXSyntax || hasHooks;
        // Check for Vue
        const hasVueImport = /import\s+(?:Vue|\{[^}]*\})\s+from\s+['"]vue['"]/.test(sourceCode);
        const hasVueTemplate = /<template>/.test(sourceCode);
        const isVue = hasVueImport || hasVueTemplate;
        // Check for Node.js patterns
        const hasNodePatterns = /require\s*\(['"]/.test(sourceCode) ||
            /module\.exports/.test(sourceCode) ||
            /process\.(env|argv)/.test(sourceCode);
        // Check for browser-specific code
        const hasDOMAccess = /document\.(getElementById|querySelector)/.test(sourceCode) ||
            /window\.(location|localStorage)/.test(sourceCode);
        return {
            language,
            isTypeScript,
            isReact,
            isVue,
            isPHP,
            isNodeJS: hasNodePatterns && !hasDOMAccess,
            isBrowser: hasDOMAccess,
            isJSX,
            filePath
        };
    }
    /**
     * Extract code elements from the actual code
     */
    extractCodeElements(match, context) {
        const node = match.node;
        const sourceCode = context.sourceCode;
        // Extract based on node type
        const elements = {
            variables: this.extractVariables(node, sourceCode),
            functions: this.extractFunctions(node, sourceCode),
            classes: this.extractClasses(node, sourceCode),
            imports: this.extractImports(sourceCode),
            componentName: this.extractComponentName(node, sourceCode) || undefined,
            loopInfo: this.extractLoopInfo(node, sourceCode) || undefined,
            methodCalls: this.extractMethodCalls(node, sourceCode),
            parameters: this.extractParameters(node, sourceCode),
            properties: this.extractProperties(node, sourceCode)
        };
        return elements;
    }
    /**
     * Build personalized fix based on pattern and context
     */
    buildPersonalizedFix(ruleId, elements, fileContext, match, context, problemCode) {
        // Route to specific fix builders based on pattern
        switch (ruleId) {
            case 'nested-loops':
                return this.fixNestedLoops(elements, fileContext, match, context);
            case 'string-concatenation-in-loops':
            case 'string-concatenation-in-loops-enhanced':
                return this.fixStringConcatenation(elements, fileContext, match, context);
            case 'function-too-long':
                return this.fixLongFunction(elements, fileContext);
            case 'missing-react-memo':
                return this.fixMissingMemo(elements, fileContext);
            case 'blocking-sync-operations':
                return this.fixBlockingOperations(elements, fileContext, match, context);
            case 'expensive-operations-in-loops':
                return this.fixExpensiveLoops(elements, fileContext);
            case 'inline-function-props':
                return this.fixInlineFunctions(elements, fileContext);
            case 'missing-keys-in-lists':
                return this.fixMissingKeys(elements, fileContext);
            case 'direct-state-mutation':
                return this.fixStateMutation(elements, fileContext);
            case 'memory-leaks':
                return this.fixMemoryLeaks(elements, fileContext, match, context);
            case 'console-usage':
                return this.fixConsoleUsage();
            default:
                return this.buildGenericFix();
        }
    }
    /**
     * Fix for nested loops - personalized
     */
    fixNestedLoops(elements, fileContext, _match, _context) {
        const loops = elements.loopInfo;
        if (!loops || loops.length < 2) {
            return this.buildGenericFix();
        }
        const outerLoop = loops[0];
        const innerLoop = loops[1];
        const outerArray = outerLoop?.arrayName || 'outerArray';
        const innerArray = innerLoop?.arrayName || 'innerArray';
        const outerVar = outerLoop?.iteratorVar || 'item1';
        const innerVar = innerLoop?.iteratorVar || 'item2';
        let fixCode = '';
        if (fileContext.isReact) {
            // React-specific solution
            fixCode = `// Use Map for O(n) lookup instead of nested loops
const ${outerArray}Map = new Map(${outerArray}.map(${outerVar} => [${outerVar}.id, ${outerVar}]));

const results = ${innerArray}
  .filter(${innerVar} => ${outerArray}Map.has(${innerVar}.relatedId))
  .map(${innerVar} => ({
    ${outerVar}: ${outerArray}Map.get(${innerVar}.relatedId),
    ${innerVar}: ${innerVar}
  }));`;
        }
        else {
            // Pure JavaScript solution
            fixCode = `// Optimize with Map for O(n) complexity
const ${outerArray}Map = new Map();
for (const ${outerVar} of ${outerArray}) {
  ${outerArray}Map.set(${outerVar}.id, ${outerVar});
}

const results = [];
for (const ${innerVar} of ${innerArray}) {
  if (${outerArray}Map.has(${innerVar}.relatedId)) {
    results.push({
      ${outerVar}: ${outerArray}Map.get(${innerVar}.relatedId),
      ${innerVar}: ${innerVar}
    });
  }
}`;
        }
        return {
            type: 'copy',
            text: fixCode
        };
    }
    /**
     * Fix for string concatenation - personalized
     */
    fixStringConcatenation(elements, fileContext, match, context) {
        const variable = elements.variables[0] || 'result';
        const loop = elements.loopInfo?.[0];
        if (!loop) {
            return this.buildGenericFix();
        }
        const arrayName = loop.arrayName || 'items';
        const iteratorVar = loop.iteratorVar || 'item';
        let fixCode = '';
        // Analyze what's being concatenated
        const nodeCode = this.getNodeCode(match.node, context.sourceCode);
        const isHTML = nodeCode.includes('<div>') || nodeCode.includes('<span>');
        const isJSX = fileContext.isReact && nodeCode.includes('<');
        if (isJSX) {
            // React JSX solution
            fixCode = `// Use array of JSX elements
const ${variable}Elements = ${arrayName}.map(${iteratorVar} => (
  <div key={${iteratorVar}.id}>
    {/* Your JSX content here */}
  </div>
));

return <>{${variable}Elements}</>;`;
        }
        else if (isHTML) {
            // HTML building solution
            fixCode = `// Use map and join for HTML generation
const ${variable} = ${arrayName}.map(${iteratorVar} => 
  \`<div>\${${iteratorVar}.name}</div>\`
).join('');`;
        }
        else {
            // Generic string building
            fixCode = `// Use array.join() for better performance
const ${variable}Parts = [];
for (const ${iteratorVar} of ${arrayName}) {
  ${variable}Parts.push(/* your string content */);
}
const ${variable} = ${variable}Parts.join('');`;
        }
        return {
            type: 'copy',
            text: fixCode
        };
    }
    /**
     * Fix for missing React.memo - personalized
     */
    fixMissingMemo(elements, fileContext) {
        // Only apply to React components
        if (!fileContext.isReact) {
            return { type: 'copy', text: '// Not applicable to non-React code' };
        }
        const componentName = elements.componentName || 'Component';
        const fixCode = `// Optimize with React.memo to prevent unnecessary re-renders
const ${componentName} = React.memo(function ${componentName}(props) {
  // Your component logic here
  return (
    // Your JSX here
  );
});

export default ${componentName};`;
        return {
            type: 'copy',
            text: fixCode
        };
    }
    /**
     * Fix for long functions - personalized
     */
    fixLongFunction(elements, _fileContext) {
        const functionName = elements.functions[0] || 'processData';
        const params = elements.parameters.join(', ') || 'data';
        let fixCode = `// Refactor ${functionName} into smaller, focused functions\n\n`;
        fixCode += `// Helper function for validation
function validate${this.capitalize(functionName)}(${params}) {
  // Validation logic here
  return true;
}

// Helper function for processing
function process${this.capitalize(functionName)}Core(${params}) {
  // Core processing logic here
  return processedData;
}

// Main function - orchestrates the helpers
function ${functionName}(${params}) {
  // Validate input
  if (!validate${this.capitalize(functionName)}(${params})) {
    throw new Error('Validation failed');
  }
  
  // Process data
  const result = process${this.capitalize(functionName)}Core(${params});
  
  return result;
}`;
        return {
            type: 'copy',
            text: fixCode
        };
    }
    /**
     * Fix for blocking operations - personalized
     */
    fixBlockingOperations(elements, fileContext, _match, _context) {
        const operation = elements.methodCalls[0];
        if (!operation) {
            return this.buildGenericFix();
        }
        let fixCode = '';
        const variable = elements.variables[0] || 'data';
        if (operation.includes('readFileSync')) {
            if (fileContext.isNodeJS) {
                fixCode = `// Use async file reading
const fs = require('fs').promises;

async function readFile() {
  try {
    const ${variable} = await fs.readFile('yourfile.txt', 'utf8');
    // Process ${variable}
    return ${variable};
  } catch (error) {
    console.error('Error reading file:', error);
    throw error;
  }
}`;
            }
            else {
                fixCode = `// Use fetch API for browser
async function loadData() {
  try {
    const response = await fetch('/api/data');
    const ${variable} = await response.text();
    // Process ${variable}
    return ${variable};
  } catch (error) {
    console.error('Error loading data:', error);
    throw error;
  }
}`;
            }
        }
        else {
            // Generic async solution
            fixCode = `// Convert to async operation
async function performOperation() {
  try {
    const ${variable} = await asyncOperation();
    // Process ${variable}
    return ${variable};
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}`;
        }
        return {
            type: 'copy',
            text: fixCode
        };
    }
    /**
     * Fix for expensive operations in loops
     */
    fixExpensiveLoops(elements, _fileContext) {
        const loop = elements.loopInfo?.[0];
        const operation = elements.methodCalls[0];
        if (!loop) {
            return this.buildGenericFix();
        }
        const arrayName = loop.arrayName || 'items';
        const iteratorVar = loop.iteratorVar || 'item';
        let fixCode = '';
        if (operation?.includes('find')) {
            fixCode = `// Use Map for O(1) lookup instead of find in loop
const ${arrayName}Map = new Map(${arrayName}.map(item => [item.id, item]));

for (const ${iteratorVar} of otherArray) {
  const found = ${arrayName}Map.get(${iteratorVar}.relatedId);
  if (found) {
    // Process found item
  }
}`;
        }
        else if (operation?.includes('filter')) {
            fixCode = `// Move filter outside loop or use Set for lookups
const validIds = new Set(${arrayName}.map(item => item.id));

const results = otherArray.filter(item => 
  validIds.has(item.relatedId)
);`;
        }
        else {
            fixCode = `// Cache expensive operations outside the loop
// Pre-compute values before the loop
const cachedResults = new Map();

for (const ${iteratorVar} of ${arrayName}) {
  // Use cached result if available
  if (!cachedResults.has(${iteratorVar}.id)) {
    cachedResults.set(${iteratorVar}.id, expensiveOperation(${iteratorVar}));
  }
  const result = cachedResults.get(${iteratorVar}.id);
  // Use result
}`;
        }
        return {
            type: 'copy',
            text: fixCode
        };
    }
    /**
     * Fix for inline functions in React props
     */
    fixInlineFunctions(elements, fileContext) {
        if (!fileContext.isReact) {
            return { type: 'copy', text: '// Not applicable to non-React code' };
        }
        const componentName = elements.componentName || 'Component';
        const fixCode = `// Move inline function outside render
const ${componentName} = () => {
  // Define handler with useCallback to maintain reference
  const handleClick = useCallback((event) => {
    // Your handler logic here
  }, [/* dependencies */]);
  
  return (
    <ChildComponent onClick={handleClick} />
  );
};`;
        return {
            type: 'copy',
            text: fixCode
        };
    }
    /**
     * Fix for missing keys in React lists
     */
    fixMissingKeys(elements, fileContext) {
        if (!fileContext.isReact) {
            return { type: 'copy', text: '// Not applicable to non-React code' };
        }
        const arrayName = elements.variables[0] || 'items';
        const iteratorVar = elements.loopInfo?.[0]?.iteratorVar || 'item';
        const fixCode = `// Add unique key prop to list items
{${arrayName}.map((${iteratorVar}, index) => (
  <div key={${iteratorVar}.id || \`item-\${index}\`}>
    {/* Your content */}
  </div>
))}`;
        return { type: 'copy', text: fixCode };
    }
    /**
     * Fix for direct state mutation in React
     */
    fixStateMutation(elements, fileContext) {
        if (!fileContext.isReact) {
            return { type: 'copy', text: '// Not applicable to non-React code' };
        }
        const stateName = elements.variables[0] || 'state';
        const fixCode = `// Never mutate state directly - create a new copy
// For arrays:
set${this.capitalize(stateName)}([...${stateName}, newItem]); // Add item
set${this.capitalize(stateName)}(${stateName}.filter(item => item.id !== id)); // Remove item

// For objects:
set${this.capitalize(stateName)}({ ...${stateName}, property: newValue }); // Update property

// For nested updates:
set${this.capitalize(stateName)}(prev => ({
  ...prev,
  nested: {
    ...prev.nested,
    property: newValue
  }
}));`;
        return { type: 'copy', text: fixCode };
    }
    /**
     * Fix for memory leaks - usando el código REAL del usuario
     */
    fixMemoryLeaks(elements, fileContext, match, context) {
        // Obtener el código exacto que causó el problema
        const problemCode = this.getNodeCode(match.node, context.sourceCode);
        // Extraer información del código problemático
        const elementMatch = problemCode.match(/(\w+)\.addEventListener\s*\(\s*['"]([\w]+)['"]\s*,\s*(.+?)\)/s);
        if (!elementMatch) {
            // Si no podemos parsear, usar solución genérica
            return this.buildGenericMemoryLeakFix();
        }
        const elementVar = elementMatch[1]; // 'analyzeBtn'
        const eventType = elementMatch[2]; // 'click'
        const handler = elementMatch[3]; // '() => { this.performAnalysis(); }'
        // Buscar el contexto completo de la función
        const functionContext = this.extractFunctionContext(match, context);
        const functionName = functionContext.name || 'setupEventListeners';
        const className = functionContext.className;
        // Generar el código arreglado basado en el código REAL
        let fixCode = '';
        if (className || problemCode.includes('this.')) {
            // Es parte de una clase
            fixCode = `// TU CÓDIGO ARREGLADO:
${functionName}() {
    const ${elementVar} = document.getElementById('${elementVar}');
    if (${elementVar}) {
        // Guardar referencia del handler para poder removerlo después
        this.${elementVar}Handler = ${handler.trim()};
        ${elementVar}.addEventListener('${eventType}', this.${elementVar}Handler);
    }
}

// Agregar método de limpieza
cleanup() {
    const ${elementVar} = document.getElementById('${elementVar}');
    if (${elementVar} && this.${elementVar}Handler) {
        ${elementVar}.removeEventListener('${eventType}', this.${elementVar}Handler);
        this.${elementVar}Handler = null;
    }
}

// Llamar cleanup cuando el componente/clase se destruya
componentWillUnmount() { // o destructor() o disconnect()
    this.cleanup();
}`;
        }
        else {
            // Es código standalone
            fixCode = `// TU CÓDIGO ARREGLADO:
// Guardar referencia del handler
const ${elementVar}Handler = ${handler.trim()};

const ${elementVar} = document.getElementById('${elementVar}');
if (${elementVar}) {
    ${elementVar}.addEventListener('${eventType}', ${elementVar}Handler);
}

// Función de limpieza para remover el listener cuando ya no se necesite
function cleanup${this.capitalize(elementVar)}() {
    const ${elementVar} = document.getElementById('${elementVar}');
    if (${elementVar}) {
        ${elementVar}.removeEventListener('${eventType}', ${elementVar}Handler);
    }
}

// Llamar cleanup cuando sea necesario (ej: antes de navegar, al cerrar modal, etc)
// cleanup${this.capitalize(elementVar)}();`;
        }
        return {
            type: 'copy',
            text: fixCode
        };
    }
    /**
     * Extraer contexto de la función que contiene el código
     */
    extractFunctionContext(match, context) {
        const sourceCode = context.sourceCode;
        const nodeStart = match.node.start || 0;
        // Buscar hacia atrás para encontrar la función contenedora
        const beforeCode = sourceCode.substring(0, nodeStart);
        // Buscar si está en una clase
        const classMatch = beforeCode.match(/class\s+(\w+)/g);
        const className = classMatch ? classMatch[classMatch.length - 1]?.replace('class ', '') : null;
        // Buscar el nombre de la función
        const funcMatch = beforeCode.match(/(\w+)\s*\(.*?\)\s*\{[^}]*$/g);
        const functionName = funcMatch ? funcMatch[funcMatch.length - 1]?.split('(')[0].trim() : null;
        return {
            className,
            name: functionName
        };
    }
    /**
     * Generar fix genérico para memory leaks
     */
    buildGenericMemoryLeakFix() {
        return {
            type: 'copy',
            text: `// Store handler reference for cleanup
const handler = (event) => {
    // Your handler logic
};

element.addEventListener('click', handler);

// Cleanup function
function cleanup() {
    element.removeEventListener('click', handler);
}

// Call cleanup when appropriate`
        };
    }
    /**
     * Fix for console usage
     */
    fixConsoleUsage() {
        const fixCode = `// Remove console.log in production
// Option 1: Use conditional logging
if (process.env.NODE_ENV !== 'production') {
  console.log('Debug info');
}

// Option 2: Use a debug utility
const debug = process.env.NODE_ENV !== 'production' ? console.log : () => {};
debug('Your debug message');

// Option 3: Use a proper logger
import logger from './utils/logger';
logger.info('Your log message');`;
        return { type: 'copy', text: fixCode };
    }
    /**
     * Filter suggestions based on file context
     */
    filterByContext(fix, context) {
        if (!fix || (!fix.newText && !fix.text)) {
            return fix;
        }
        const content = fix.newText || fix.text || '';
        // Remove React-specific code from non-React files
        if (!context.isReact) {
            if (content.includes('React.') || content.includes('useState') ||
                content.includes('useEffect') || content.includes('useCallback')) {
                // Return a vanilla JS alternative
                return {
                    type: 'copy',
                    text: '// Use vanilla JavaScript solution for this pattern'
                };
            }
        }
        // Remove Node.js specific code from browser context
        if (context.isBrowser && !context.isNodeJS) {
            if (content.includes('require(') || content.includes('module.exports')) {
                // Return a browser-compatible alternative
                return {
                    type: 'copy',
                    text: '// Use browser-compatible solution for this pattern'
                };
            }
        }
        return fix;
    }
    // Helper methods
    extractVariables(node, sourceCode) {
        const variables = [];
        const variablePattern = /(?:let|const|var)\s+(\w+)/g;
        const nodeCode = this.getNodeCode(node, sourceCode);
        let match;
        while ((match = variablePattern.exec(nodeCode)) !== null) {
            if (match[1])
                variables.push(match[1]);
        }
        return variables;
    }
    extractFunctions(node, sourceCode) {
        const functions = [];
        const functionPattern = /function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?(?:\([^)]*\)|[\w]+)\s*=>/g;
        const nodeCode = this.getNodeCode(node, sourceCode);
        let match;
        while ((match = functionPattern.exec(nodeCode)) !== null) {
            const name = match[1] || match[2];
            if (name)
                functions.push(name);
        }
        return functions;
    }
    extractClasses(node, sourceCode) {
        const classes = [];
        const classPattern = /class\s+(\w+)/g;
        const nodeCode = this.getNodeCode(node, sourceCode);
        let match;
        while ((match = classPattern.exec(nodeCode)) !== null) {
            if (match[1])
                classes.push(match[1]);
        }
        return classes;
    }
    extractImports(sourceCode) {
        const imports = [];
        const importPattern = /import\s+(?:(\w+)|{([^}]+)})\s+from\s+['"]([^'"]+)['"]/g;
        let match;
        while ((match = importPattern.exec(sourceCode)) !== null) {
            if (match[3])
                imports.push(match[3]); // Package name
        }
        return imports;
    }
    extractComponentName(node, sourceCode) {
        const nodeCode = this.getNodeCode(node, sourceCode);
        // Function component
        const funcMatch = nodeCode.match(/function\s+([A-Z]\w+)|(?:const|let)\s+([A-Z]\w+)\s*=/);
        if (funcMatch) {
            return funcMatch[1] || funcMatch[2];
        }
        // Class component
        const classMatch = nodeCode.match(/class\s+([A-Z]\w+)\s+extends/);
        if (classMatch) {
            return classMatch[1];
        }
        return undefined;
    }
    extractLoopInfo(node, sourceCode) {
        const loops = [];
        const nodeCode = this.getNodeCode(node, sourceCode);
        // for...of loops
        const forOfPattern = /for\s*\(\s*(?:const|let|var)\s+(\w+)\s+of\s+(\w+)/g;
        let match;
        while ((match = forOfPattern.exec(nodeCode)) !== null) {
            if (match[1] && match[2]) {
                loops.push({
                    type: 'for-of',
                    iteratorVar: match[1],
                    arrayName: match[2]
                });
            }
        }
        // for loops
        const forPattern = /for\s*\(\s*(?:let|var)\s+(\w+)\s*=\s*\d+;\s*\w+\s*<\s*(\w+)\.length/g;
        const forMatches = nodeCode.matchAll(forPattern);
        for (const m of forMatches) {
            if (m[1] && m[2]) {
                loops.push({
                    type: 'for',
                    indexVar: m[1],
                    arrayName: m[2]
                });
            }
        }
        // forEach
        const forEachPattern = /(\w+)\.forEach\s*\(\s*(?:\()?(\w+)/g;
        const forEachMatches = nodeCode.matchAll(forEachPattern);
        for (const m of forEachMatches) {
            if (m[1] && m[2]) {
                loops.push({
                    type: 'forEach',
                    arrayName: m[1],
                    iteratorVar: m[2]
                });
            }
        }
        return loops;
    }
    extractMethodCalls(node, sourceCode) {
        const methods = [];
        const methodPattern = /(\w+\.\w+)\s*\(/g;
        const nodeCode = this.getNodeCode(node, sourceCode);
        let match;
        while ((match = methodPattern.exec(nodeCode)) !== null) {
            if (match[1])
                methods.push(match[1]);
        }
        return methods;
    }
    extractParameters(node, sourceCode) {
        const nodeCode = this.getNodeCode(node, sourceCode);
        const funcMatch = nodeCode.match(/function\s+\w+\s*\(([^)]*)\)|(?:\(([^)]*)\)|(\w+))\s*=>/);
        if (funcMatch) {
            const params = funcMatch[1] || funcMatch[2] || funcMatch[3] || '';
            return params.split(',').map(p => p.trim()).filter(p => p);
        }
        return [];
    }
    extractProperties(node, sourceCode) {
        const properties = [];
        const propPattern = /(\w+)\s*:/g;
        const nodeCode = this.getNodeCode(node, sourceCode);
        let match;
        while ((match = propPattern.exec(nodeCode)) !== null) {
            if (match[1])
                properties.push(match[1]);
        }
        return properties;
    }
    getNodeCode(node, sourceCode) {
        if (node.start !== undefined && node.end !== undefined) {
            return sourceCode.substring(node.start, node.end);
        }
        return '';
    }
    buildGenericFix() {
        return {
            type: 'copy',
            text: '// Implement optimized solution here based on your specific use case'
        };
    }
    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
}
exports.PersonalizedFixGenerator = PersonalizedFixGenerator;
// Export singleton instance
exports.personalizedFixGenerator = PersonalizedFixGenerator.getInstance();
//# sourceMappingURL=personalized-fix-generator.old.js.map