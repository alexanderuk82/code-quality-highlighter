module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'eslint:recommended'
  ],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module'
  },
  plugins: ['@typescript-eslint'],
  rules: {
    // TypeScript specific rules
    '@typescript-eslint/no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn',
    
    // General code quality rules
    'no-console': 'warn',
    'no-debugger': 'error',
    'no-alert': 'error',
    'no-var': 'error',
    'prefer-const': 'error',
    'prefer-arrow-callback': 'error',
    'arrow-spacing': 'error',
    'no-trailing-spaces': 'error',
    'no-multiple-empty-lines': ['error', { max: 1 }],
    'eol-last': 'error',
    'comma-dangle': ['error', 'never'],
    'quotes': ['error', 'single'],
    'semi': ['error', 'always'],
    
    // Performance and maintainability
    'no-loop-func': 'error',
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    'complexity': ['warn', 15], // Increased from 10 to 15
    'max-depth': ['warn', 4],
    'max-lines-per-function': ['warn', 80], // Increased from 50 to 80
    'max-params': ['warn', 5],
    
    // Disable some rules for development
    'no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }],
    'no-undef': 'off' // Turn off since TypeScript handles this
  },
  ignorePatterns: ['out/', 'node_modules/', '*.d.ts'],
  env: {
    node: true,
    es6: true
  }
};
