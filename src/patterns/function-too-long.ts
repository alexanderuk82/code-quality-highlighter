import {
  PatternRule,
  PatternMatcher,
  ASTNode,
  MatchContext,
  PatternCategory,
  TooltipTemplate
} from '../types';

/**
 * Detects functions that are too long (>50 lines)
 */
export class FunctionTooLongMatcher implements PatternMatcher {
  private readonly WARNING_LINES = 30;
  
  public match(node: ASTNode, _context: MatchContext): boolean {
    // Check all function types
    if (!this.isFunctionNode(node)) return false;
    
    const lineCount = this.calculateFunctionLines(node);
    return lineCount > this.WARNING_LINES;
  }
  
  private isFunctionNode(node: ASTNode): boolean {
    return node.type === 'FunctionDeclaration' ||
           node.type === 'FunctionExpression' ||
           node.type === 'ArrowFunctionExpression' ||
           node.type === 'MethodDefinition';
  }
  
  private calculateFunctionLines(node: ASTNode): number {
    const loc = (node as any).loc;
    if (!loc) return 0;
    
    const startLine = loc.start.line;
    const endLine = loc.end.line;
    
    return endLine - startLine + 1;
  }
  
  public getMatchDetails(node: ASTNode, _context: MatchContext) {
    const lineCount = this.calculateFunctionLines(node);
    
    return {
      complexity: lineCount,
      impact: `Function has ${lineCount} lines (recommended: <30, max: 50)`,
      suggestion: 'Break down into smaller, focused functions'
    };
  }
}

const functionTooLongTemplate: TooltipTemplate = {
  title: '🟠 CODE QUALITY: Function Too Long',
  problemDescription: 'Long functions are hard to understand, test, and maintain. They often violate the Single Responsibility Principle and hide complexity.',
  impactDescription: 'Increases cognitive load, makes debugging harder, reduces testability, and increases the chance of bugs.',
  solutionDescription: 'Break down into smaller, focused functions. Each function should do one thing well. Extract logical sections into helper functions.',
  codeExamples: [
    {
      title: 'Refactor Long Function',
      before: `// 60+ lines function doing multiple things
function processUserData(users) {
  // Validation logic (10 lines)
  if (!users || !Array.isArray(users)) {
    console.error('Invalid input');
    return [];
  }
  for (let user of users) {
    if (!user.id || !user.email) {
      console.error('Invalid user');
      return [];
    }
  }
  
  // Filtering logic (15 lines)
  const activeUsers = [];
  for (let user of users) {
    if (user.status === 'active') {
      if (user.lastLogin) {
        const daysSinceLogin = // ...calculation
        if (daysSinceLogin < 30) {
          activeUsers.push(user);
        }
      }
    }
  }
  
  // Transformation logic (20 lines)
  const transformedUsers = [];
  for (let user of activeUsers) {
    const transformed = {
      id: user.id,
      name: user.firstName + ' ' + user.lastName,
      email: user.email.toLowerCase(),
      // ...more transformations
    };
    transformedUsers.push(transformed);
  }
  
  // Sorting logic (10 lines)
  transformedUsers.sort((a, b) => {
    // Complex sorting logic
  });
  
  return transformedUsers;
}`,
      after: `// Main function - clear and concise
function processUserData(users) {
  if (!validateUsers(users)) {
    return [];
  }
  
  const activeUsers = filterActiveUsers(users);
  const transformedUsers = transformUsers(activeUsers);
  return sortUsers(transformedUsers);
}

// Extracted functions - single responsibility
function validateUsers(users) {
  if (!users || !Array.isArray(users)) {
    console.error('Invalid input');
    return false;
  }
  
  return users.every(user => 
    user.id && user.email
  );
}

function filterActiveUsers(users) {
  return users.filter(user => 
    user.status === 'active' && 
    isRecentlyActive(user)
  );
}

function isRecentlyActive(user) {
  if (!user.lastLogin) return false;
  const daysSinceLogin = calculateDaysSince(user.lastLogin);
  return daysSinceLogin < 30;
}

function transformUsers(users) {
  return users.map(user => ({
    id: user.id,
    name: \`\${user.firstName} \${user.lastName}\`,
    email: user.email.toLowerCase(),
    // ...more transformations
  }));
}

function sortUsers(users) {
  return [...users].sort((a, b) => 
    a.name.localeCompare(b.name)
  );
}`,
      improvement: 'Improved readability, testability, and maintainability'
    },
    {
      title: 'React Component Refactoring',
      before: `// Large component doing too much
function UserDashboard({ userId }) {
  // 80+ lines of mixed concerns
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    // Fetch user logic (20 lines)
    // Fetch posts logic (20 lines)
    // Error handling (10 lines)
  }, [userId]);
  
  // Event handlers (20 lines)
  // Render logic (30+ lines)
  
  return (
    <div>
      {/* Complex JSX */}
    </div>
  );
}`,
      after: `// Main component - orchestrator
function UserDashboard({ userId }) {
  const { user, loading, error } = useUser(userId);
  const posts = useUserPosts(userId);
  
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  
  return (
    <div className="dashboard">
      <UserProfile user={user} />
      <PostList posts={posts} />
    </div>
  );
}

// Custom hooks for data fetching
function useUser(userId) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    fetchUser(userId)
      .then(setUser)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [userId]);
  
  return { user, loading, error };
}

// Separate components for different sections
function UserProfile({ user }) {
  return (
    <section className="profile">
      <h2>{user.name}</h2>
      <p>{user.bio}</p>
    </section>
  );
}`,
      improvement: 'Separated concerns, reusable hooks, testable components'
    }
  ],
  actions: [
    {
      label: 'Copy Refactored Solution',
      type: 'copy',
      payload: 'optimized-code'
    }
  ],
  learnMoreUrl: 'https://refactoring.guru/extract-method'
};

export const functionTooLongRule: PatternRule = {
  id: 'function-too-long',
  name: 'Function Too Long',
  description: 'Detects functions longer than recommended limits',
  category: PatternCategory.Maintainability,
  severity: 'warning',
  languages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact'],
  enabled: true,
  matcher: new FunctionTooLongMatcher(),
  template: functionTooLongTemplate,
  scoreImpact: -8
};
