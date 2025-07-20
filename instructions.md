# Code Quality Highlighter - Development Instructions

## 📋 Project Overview
**Extension Name:** Code Quality Highlighter  
**Purpose:** Real-time code quality analysis with visual feedback and educational tooltips  
**Languages:** JavaScript, TypeScript, React (TSX/JSX), PHP  
**Target:** 150+ pattern detection across 4 languages  

## 🎯 Development Principles

### Core Standards
1. **Clean, modular, scalable code** - English only
2. **No storytelling code** - direct, purposeful implementation
3. **Test-first mindset** - Ask "Should we write a test first?" at complex points
4. **Long-term extensibility** - design for plugins, rule engines, external config
5. **Performance-first** - <500ms analysis for <1000 line files

### Code Quality Standards
- **TypeScript strict mode** enabled
- **ESLint + Prettier** for consistency
- **100% type coverage** for public APIs
- **Unit tests** for all pattern detectors
- **Integration tests** for VS Code APIs

## 🏗️ Architecture & File Structure

```
src/
├── analyzers/              # Language-specific analyzers
│   ├── javascript.ts       # JS/TS AST analysis
│   ├── react.ts           # React component analysis
│   ├── php.ts             # PHP AST analysis
│   └── base.ts            # Base analyzer interface
├── patterns/              # Pattern detection engine
│   ├── engine.ts          # Core pattern matching engine
│   ├── registry.ts        # Pattern rule registry
│   ├── rulesets.ts        # Language-specific rulesets
│   └── types.ts           # Pattern type definitions
├── scoring/               # Quality scoring system
│   ├── calculator.ts      # Score calculation logic
│   └── metrics.ts         # Quality metrics definitions
├── ui/                    # VS Code UI integration
│   ├── decorations.ts     # Text decorations (highlighting)
│   ├── tooltips.ts        # Hover provider implementation
│   ├── statusbar.ts       # Status bar integration
│   └── quickfixes.ts      # Code action providers
├── templates/             # Tooltip templates
│   ├── critical.ts        # Critical issue templates
│   ├── warning.ts         # Warning templates
│   └── info.ts           # Info/style templates
├── utils/                 # Shared utilities
│   ├── ast.ts            # AST utilities
│   ├── config.ts         # Configuration management
│   └── logger.ts         # Logging utilities
├── extension.ts          # Main extension entry point
└── types.ts              # Global type definitions
```

## 🔧 Technology Stack

### Core Dependencies
- **@babel/parser** ^7.23.0 - JS/TS AST parsing
- **@babel/traverse** ^7.23.0 - AST traversal
- **typescript** ^5.0.0 - TypeScript support
- **php-parser** ^3.1.0 - PHP AST parsing

### Development Dependencies
- **@types/vscode** - VS Code API types
- **eslint** + **@typescript-eslint** - Linting
- **prettier** - Code formatting
- **jest** - Testing framework
- **@types/jest** - Jest types

## 📝 Naming Conventions

### Files & Directories
- **kebab-case** for file names: `pattern-engine.ts`
- **camelCase** for directories: `src/analyzers/`
- **PascalCase** for classes: `PatternEngine`
- **UPPER_SNAKE_CASE** for constants: `MAX_COMPLEXITY_THRESHOLD`

### Code Conventions
```typescript
// Interfaces - PascalCase with 'I' prefix for internal interfaces
interface IPatternRule {
  id: string;
  severity: Severity;
}

// Types - PascalCase
type Severity = 'critical' | 'warning' | 'info' | 'good';

// Enums - PascalCase
enum PatternCategory {
  Performance = 'performance',
  Security = 'security',
  Maintainability = 'maintainability'
}

// Functions - camelCase, descriptive verbs
function detectNestedLoops(ast: AST): PatternMatch[]
function calculateQualityScore(issues: Issue[]): number

// Variables - camelCase, descriptive nouns
const patternMatches: PatternMatch[] = [];
const qualityScore: number = 85;
```

## 🧪 Testing Strategy

### Test Structure
```
tests/
├── unit/                  # Unit tests
│   ├── analyzers/        # Analyzer tests
│   ├── patterns/         # Pattern detection tests
│   └── scoring/          # Scoring tests
├── integration/          # Integration tests
│   ├── vscode-api/       # VS Code API integration
│   └── end-to-end/       # Full extension tests
└── fixtures/             # Test code samples
    ├── javascript/       # JS test files
    ├── react/           # React test files
    └── php/             # PHP test files
```

### Test Conventions
- **Descriptive test names**: `should detect nested loops in for statements`
- **AAA pattern**: Arrange, Act, Assert
- **One assertion per test** when possible
- **Test file naming**: `{module-name}.test.ts`

### Test Implementation Rules
1. **Pattern detectors** - Must have unit tests with code samples
2. **VS Code APIs** - Integration tests with mock APIs
3. **Performance** - Benchmark tests for analysis speed
4. **Edge cases** - Test malformed code, edge syntax

## 📊 Pattern Detection System

### Pattern Categories & Scoring
- **Critical (-15 points)**: Performance killers, security vulnerabilities
- **Warning (-8 points)**: Code smells, anti-patterns
- **Info (-3 points)**: Style issues, minor improvements
- **Good (+2 points)**: Best practices, modern patterns

### Pattern Rule Structure
```typescript
interface PatternRule {
  id: string;                    // Unique identifier
  name: string;                  // Human-readable name
  category: PatternCategory;     // Performance/Security/etc
  severity: Severity;            // Critical/Warning/Info/Good
  languages: string[];           // Supported languages
  description: string;           // What it detects
  matcher: ASTMatcher;          // AST matching logic
  template: TooltipTemplate;    // Tooltip configuration
}
```

## 🎨 UI/UX Guidelines

### Color Scheme
- **Critical**: `rgba(255, 0, 0, 0.3)` with red border
- **Warning**: `rgba(255, 165, 0, 0.2)` with orange border
- **Info**: `rgba(255, 255, 0, 0.1)` with yellow dashed border
- **Good**: `rgba(0, 255, 0, 0.1)` with green border

### Tooltip Design
- **Maximum width**: 400px
- **Structured content**: Problem → Impact → Solution → Actions
- **Code examples**: Before/After with syntax highlighting
- **Action buttons**: Copy Solution, Apply Fix, Explain More

## 🚀 Sprint Planning

### Sprint 1 (Weeks 1-2): Foundation
- [ ] Project setup and configuration
- [ ] Base analyzer interfaces
- [ ] Core pattern engine architecture
- [ ] Basic VS Code decoration system
- [ ] First pattern detector (nested loops)

### Sprint 2 (Weeks 3-4): JavaScript/TypeScript
- [ ] Complete JS/TS analyzer
- [ ] 50 pattern rules implementation
- [ ] Scoring system
- [ ] Status bar integration
- [ ] Unit test suite

### Sprint 3 (Weeks 5-6): React Support
- [ ] React component analyzer
- [ ] 50 React-specific patterns
- [ ] Hook dependency analysis
- [ ] Performance pattern detection
- [ ] React test fixtures

### Sprint 4 (Weeks 7-8): PHP Support
- [ ] PHP AST analyzer
- [ ] 50 PHP patterns (security focus)
- [ ] SQL injection detection
- [ ] XSS vulnerability patterns
- [ ] PHP test coverage

### Sprint 5 (Weeks 9-10): UI/UX & Actions
- [ ] Advanced tooltip system
- [ ] Quick fix actions
- [ ] Copy/Apply functionality
- [ ] Configuration system
- [ ] Performance optimization

### Sprint 6 (Weeks 11-12): Polish & Release
- [ ] Comprehensive testing
- [ ] Documentation
- [ ] Performance benchmarks
- [ ] Marketplace packaging
- [ ] Beta testing

## 📝 Commit Message Format

```
type(scope): description

[optional body]

[optional footer]
```

### Types
- **feat**: New feature
- **fix**: Bug fix
- **refactor**: Code refactoring
- **test**: Adding tests
- **docs**: Documentation
- **perf**: Performance improvements
- **style**: Code formatting
- **ci**: CI/CD changes

### Examples
```
feat(patterns): add nested loop detection for JavaScript
fix(tooltips): resolve positioning issue in split view
refactor(analyzers): extract common AST utilities
test(scoring): add edge cases for quality calculation
```

## 🔧 Configuration Management

### Extension Settings
```json
{
  "codeQuality.enableAutoAnalysis": true,
  "codeQuality.activeRulesets": ["performance", "security"],
  "codeQuality.strictMode": false,
  "codeQuality.showGoodPatterns": true,
  "codeQuality.maxFileSize": 5000
}
```

### Performance Thresholds
- **Analysis time**: <500ms for files <1000 lines
- **Memory usage**: <50MB per analyzed file
- **Pattern accuracy**: >95% precision
- **False positive rate**: <5%

## 📚 Decision Log

### Technical Decisions
1. **AST Parser Choice**: Babel for JS/TS (industry standard, robust)
2. **PHP Parser**: php-parser npm package (active maintenance)
3. **Test Framework**: Jest (VS Code extension compatibility)
4. **Code Style**: Prettier + ESLint (team consistency)

### Architecture Decisions
1. **Modular analyzers**: Separate classes per language for maintainability
2. **Rule registry**: Centralized pattern management for extensibility
3. **Template system**: Configurable tooltips for internationalization
4. **Async analysis**: Non-blocking UI for large files

## 🎯 Success Metrics

### Technical KPIs
- Analysis performance: <500ms target
- Memory efficiency: <50MB per file
- Test coverage: >90%
- Pattern accuracy: >95%

### User Experience KPIs
- Extension rating: >4.5 stars
- Issue resolution rate: >60%
- User retention: >70% after 1 week
- Community engagement: >100 GitHub stars

---

## 📊 Sprint 1 Completion Status

### ✅ Completed Tasks
- [x] Project setup and configuration (package.json, tsconfig.json, eslint, prettier)
- [x] Complete directory structure creation
- [x] Core type definitions (types.ts)
- [x] Base analyzer architecture (analyzers/base.ts)
- [x] Pattern detection engine (patterns/engine.ts)
- [x] First critical pattern: Nested Loops (patterns/nested-loops.ts)
- [x] JavaScript/TypeScript analyzer (analyzers/javascript.ts)
- [x] Quality scoring system (scoring/calculator.ts)
- [x] VS Code decorations system (ui/decorations.ts)
- [x] Main extension entry point (extension.ts)
- [x] Comprehensive test setup (Jest configuration)
- [x] First pattern test suite (nested-loops.test.ts)
- [x] Project documentation (README.md)

### 🎯 Sprint 1 Goals Achievement
**Target**: Foundation setup with basic pattern detection  
**Status**: ✅ COMPLETED AHEAD OF SCHEDULE

**Deliverables**:
1. ✅ Fully configured TypeScript VS Code extension project
2. ✅ Modular architecture with clear separation of concerns
3. ✅ Working pattern detection engine with first critical pattern
4. ✅ Visual decoration system for code highlighting
5. ✅ Quality scoring system with breakdown by categories
6. ✅ Comprehensive test framework with first test suite
7. ✅ Complete documentation and development standards

### 📈 Key Metrics Achieved
- **Code Quality**: 100% TypeScript strict mode compliance
- **Test Coverage**: Pattern detection engine fully tested
- **Architecture**: Scalable design ready for 150+ patterns
- **Performance**: <500ms analysis target architecture established

### 🚀 Ready for Sprint 2
The foundation is solid and ready for Sprint 2 implementation of the remaining 49 JavaScript/TypeScript patterns.

---

**Last Updated**: Sprint 1 Completed  
**Next Review**: Sprint 2 Planning  
**Maintainer**: Development Team
