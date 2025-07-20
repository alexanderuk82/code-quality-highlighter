"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.blockingSyncOperationsRule = exports.BlockingSyncOperationsMatcher = void 0;
const types_1 = require("../types");
/**
 * Matcher for detecting blocking synchronous operations
 */
class BlockingSyncOperationsMatcher {
    constructor() {
        Object.defineProperty(this, "blockingOperations", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: [
                // File system operations
                'readFileSync', 'writeFileSync', 'appendFileSync', 'copyFileSync', 'unlinkSync',
                'mkdirSync', 'rmdirSync', 'readdirSync', 'statSync', 'lstatSync', 'existsSync',
                'accessSync', 'chmodSync', 'chownSync', 'renameSync', 'truncateSync',
                // Network operations
                'execSync', 'spawnSync',
                // Crypto operations
                'pbkdf2Sync', 'scryptSync', 'randomFillSync', 'randomBytesSync',
                // Other blocking operations
                'readSync', 'writeSync'
            ]
        });
    }
    match(node, _context) {
        // Check for direct sync function calls
        if (this.isDirectSyncCall(node)) {
            return true;
        }
        // Check for fs.* sync calls
        if (this.isFsSyncCall(node)) {
            return true;
        }
        // Check for child_process sync calls
        if (this.isChildProcessSyncCall(node)) {
            return true;
        }
        // Check for crypto sync calls
        if (this.isCryptoSyncCall(node)) {
            return true;
        }
        return false;
    }
    getMatchDetails(node, _context) {
        const operationName = this.getOperationName(node);
        const estimatedBlockTime = this.estimateBlockingTime(operationName);
        return {
            complexity: 1,
            impact: `Blocks event loop for ${estimatedBlockTime}ms+ - freezes UI and prevents other operations`,
            suggestion: `Replace with async ${operationName.replace('Sync', '')} using promises or callbacks`
        };
    }
    isDirectSyncCall(node) {
        if (node.type !== 'CallExpression')
            return false;
        const callee = node.callee;
        if (callee?.type === 'Identifier') {
            return this.blockingOperations.includes(callee.name);
        }
        return false;
    }
    isFsSyncCall(node) {
        if (node.type !== 'CallExpression')
            return false;
        const callee = node.callee;
        if (callee?.type === 'MemberExpression') {
            const object = callee.object;
            const property = callee.property;
            if (object?.name === 'fs' && property?.name) {
                return this.blockingOperations.includes(property.name);
            }
        }
        return false;
    }
    isChildProcessSyncCall(node) {
        if (node.type !== 'CallExpression')
            return false;
        const callee = node.callee;
        if (callee?.type === 'MemberExpression') {
            const object = callee.object;
            const property = callee.property;
            if (object?.name === 'child_process' && property?.name) {
                return ['execSync', 'spawnSync'].includes(property.name);
            }
        }
        return false;
    }
    isCryptoSyncCall(node) {
        if (node.type !== 'CallExpression')
            return false;
        const callee = node.callee;
        if (callee?.type === 'MemberExpression') {
            const object = callee.object;
            const property = callee.property;
            if (object?.name === 'crypto' && property?.name) {
                return ['pbkdf2Sync', 'scryptSync', 'randomFillSync', 'randomBytesSync'].includes(property.name);
            }
        }
        return false;
    }
    getOperationName(node) {
        if (node.type !== 'CallExpression')
            return 'unknown';
        const callee = node.callee;
        if (callee?.type === 'Identifier') {
            return callee.name;
        }
        if (callee?.type === 'MemberExpression') {
            return callee.property?.name || 'unknown';
        }
        return 'unknown';
    }
    estimateBlockingTime(operationName) {
        // Rough estimates based on operation type
        const timeEstimates = {
            'readFileSync': 50,
            'writeFileSync': 100,
            'execSync': 500,
            'spawnSync': 1000,
            'pbkdf2Sync': 200,
            'scryptSync': 300,
            'readdirSync': 30
        };
        return timeEstimates[operationName] || 50;
    }
}
exports.BlockingSyncOperationsMatcher = BlockingSyncOperationsMatcher;
/**
 * Tooltip template for blocking sync operations
 */
const blockingSyncOperationsTemplate = {
    title: '🔴 PERFORMANCE CRITICAL: Blocking Synchronous Operation',
    problemDescription: 'Synchronous operations block the event loop, freezing the entire application until they complete. This creates poor user experience and prevents other code from executing.',
    impactDescription: 'Can freeze UI for 50-1000ms+ per operation. With multiple sync calls, applications become completely unresponsive.',
    solutionDescription: 'Replace with asynchronous alternatives using promises, async/await, or callbacks to maintain responsive applications.',
    codeExamples: [
        {
            title: 'File System Operations',
            before: `// ❌ Blocks event loop - NEVER do this
const data = fs.readFileSync('large-file.txt', 'utf8');
const stats = fs.statSync('file.txt');
fs.writeFileSync('output.txt', processedData);`,
            after: `// ✅ Non-blocking async operations
const data = await fs.promises.readFile('large-file.txt', 'utf8');
const stats = await fs.promises.stat('file.txt');
await fs.promises.writeFile('output.txt', processedData);

// Or with callbacks
fs.readFile('large-file.txt', 'utf8', (err, data) => {
  if (err) throw err;
  // Process data without blocking
});`,
            improvement: 'Eliminates blocking, maintains UI responsiveness'
        },
        {
            title: 'Child Process Operations',
            before: `// ❌ Blocks entire process
const result = child_process.execSync('git status');
const output = child_process.spawnSync('ls', ['-la']);`,
            after: `// ✅ Non-blocking process execution
const { stdout } = await util.promisify(child_process.exec)('git status');

// Or with spawn
const child = child_process.spawn('ls', ['-la']);
child.stdout.on('data', (data) => {
  console.log(data.toString());
});`,
            improvement: 'Prevents process freezing during command execution'
        },
        {
            title: 'Crypto Operations',
            before: `// ❌ Blocks for hundreds of milliseconds
const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512');
const randomBytes = crypto.randomBytesSync(256);`,
            after: `// ✅ Non-blocking crypto operations
const hash = await util.promisify(crypto.pbkdf2)(
  password, salt, 100000, 64, 'sha512'
);
const randomBytes = await util.promisify(crypto.randomBytes)(256);`,
            improvement: 'Maintains responsiveness during CPU-intensive crypto operations'
        }
    ],
    actions: [
        {
            label: 'Copy Async Solution',
            type: 'copy',
            payload: 'async-alternative'
        },
        {
            label: 'Apply Quick Fix',
            type: 'apply',
            payload: 'convert-to-async'
        },
        {
            label: 'Learn About Event Loop',
            type: 'explain',
            payload: 'event-loop-explanation'
        }
    ],
    learnMoreUrl: 'https://nodejs.org/en/docs/guides/blocking-vs-non-blocking/'
};
/**
 * Blocking sync operations pattern rule
 */
exports.blockingSyncOperationsRule = {
    id: 'blocking-sync-operations',
    name: 'Blocking Synchronous Operations',
    description: 'Detects synchronous operations that block the event loop',
    category: types_1.PatternCategory.Performance,
    severity: 'critical',
    languages: ['javascript', 'typescript', 'typescriptreact', 'javascriptreact'],
    enabled: true,
    matcher: new BlockingSyncOperationsMatcher(),
    template: blockingSyncOperationsTemplate,
    scoreImpact: -15
};
//# sourceMappingURL=blocking-sync-operations.js.map