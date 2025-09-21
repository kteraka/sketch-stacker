# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Gyazo-like image sharing application with AWS backend infrastructure and a React frontend. The system allows users to upload images via API Gateway + Lambda, stores them in S3, and serves them through CloudFront. A web viewer displays uploaded images in a gallery format.

## Architecture

### Backend (AWS CloudFormation)
- **API Gateway + Lambda**: Image upload endpoint with Basic Authentication
- **S3**: Image storage with Glacier Instant Retrieval storage class
- **CloudFront**: CDN for image delivery with Origin Access Control (OAC)
- **Secrets Manager**: Basic authentication password management
- **Auto-indexing**: S3 event triggers Lambda to update images.json automatically

### Frontend
- **Legacy**: Static HTML viewer (`/Viewer/index.html`)
- **Modern**: React SPA using Vite (`/viewer-react/`)

## Development Commands

### React Frontend (Primary Development)
```bash
cd viewer-react
npm install                    # Install dependencies
npm run dev -- --host         # Start dev server (required for Dev Container)
npm run build                  # Build for production
npm run lint                   # Run ESLint
npm run preview -- --host     # Preview production build with host flag
```

#### Development vs Production Mode
**Development Mode (`npm run dev`)**:
- Uses mock data from `/test-images.json`
- Placeholder images from picsum.photos
- Hot reload enabled
- Access: http://localhost:5173/

**Production Mode (`npm run preview`)**:
- Connects to actual CloudFront for real images
- Uses production API endpoints
- Static file serving
- Access: http://localhost:4175/ (port may vary)
- **Note**: CORS headers configured on CloudFront allow localhost access

### CloudFormation Deployment
```bash
# Deploy infrastructure stack
aws cloudformation create-stack --stack-name WIPUploader --template-body file://Uploader/template.yaml --parameters ParameterKey=ImageBucketName,ParameterValue=<bucket-name> --capabilities CAPABILITY_IAM

# Update existing stack
aws cloudformation update-stack --stack-name WIPUploader --template-body file://Uploader/template.yaml --parameters ParameterKey=ImageBucketName,ParameterValue=<bucket-name>
```

### Image Upload API Usage
```bash
AUTH=$(echo -n '<username>:<password>' | base64)
IMAGE=$(base64 -i test.png)
curl -X POST \
  -H "Authorization: Basic $AUTH" \
  -H "Content-Type: application/json" \
  -d "{\"image\": \"$IMAGE\"}" \
  <API_GATEWAY_ENDPOINT>
```

## Code Architecture

### React Components Structure
- `src/App.jsx`: Main application component
- `src/components/ImageGallery.jsx`: Main gallery container with data fetching
- `src/components/ImageItem.jsx`: Individual image item with controls
- `src/components/Modal.jsx`: Image preview modal

### Development vs Production Behavior
The React app uses environment-based configuration:
- **Development**: Uses test data (`/test-images.json`) and placeholder images
- **Production**: Connects to actual CloudFront for real data and images

### Data Flow
1. Images uploaded via API Gateway → Lambda → S3
2. S3 event triggers `UpdateImagesJsonLambda` → updates `images.json`
3. CloudFront invalidates cache for `images.json`
4. Frontend fetches updated `images.json` and displays images

### Image Filename Convention
Images are stored with timestamp-based filenames (e.g., `1736680321651.png`). The frontend extracts timestamps to display upload dates.

## Dev Container Considerations

This project uses Claude Code's Dev Container with network restrictions. External HTTPS connections to CloudFront are blocked by default. For CloudFront testing:

1. **Development**: Use mock data and placeholder images
2. **Testing with real data**: Build production version and serve locally on Mac
3. **Custom firewall**: A custom firewall script exists in `.devcontainer/custom-firewall.sh` to potentially allow CloudFront access, but requires container rebuild

### AWS Authentication Setup (Dev Container)
**重要**: Dev Containerを開き直すたびにAWS認証情報がリセットされるため、毎回以下のセットアップが必要です：

```bash
# AWS SSO設定 (初回のみ)
aws configure sso --profile dev

# 毎回のログイン
aws sso login --profile dev

# 認証確認
aws sts get-caller-identity --profile dev
```

**Terraform実行時はprofileを指定：**
```bash
cd terraform
AWS_PROFILE=dev terraform plan
AWS_PROFILE=dev terraform apply
```

### Vite Configuration Notes
The `vite.config.js` includes:
- `host: true` for Dev Container compatibility
- Proxy configuration for CloudFront (may not work due to network restrictions)
- Port forwarding setup in `devcontainer.json` for port 5173

## CloudFormation Parameters
When deploying the infrastructure stack, note the circular dependency issue with `CloudFrontDistributionId` parameter. First deploy with a dummy value, then update with the actual distribution ID after creation.

## Future Development Plans
See `DEVELOPMENT_PLAN.md` for detailed roadmap including:
- Terraform migration from CloudFormation
- GitHub Actions CI/CD setup
- UI/UX improvements
- GitHub-style contribution calendar feature

---

# 🏗️ CLAUDE.md - Claude Code Global Configuration

This file provides guidance to Claude Code (claude.ai/code) when working across all projects.

## 📋 Overview

This is my global Claude Code configuration directory (`~/.claude`) that sets up:
- Professional development standards and workflows
- Language-specific best practices (Rust, Go, TypeScript, Python, Bash)
- Permission rules for tool usage
- Environment variables for development
- Session history and todo management

## 🧠 Proactive AI Assistance

### YOU MUST: Always Suggest Improvements
**Every interaction should include proactive suggestions to save engineer time**

1. **Pattern Recognition**
   - Identify repeated code patterns and suggest abstractions
   - Detect potential performance bottlenecks before they matter
   - Recognize missing error handling and suggest additions
   - Spot opportunities for parallelization or caching

2. **Code Quality Improvements**
   - Suggest more idiomatic approaches for the language
   - Recommend better library choices based on project needs
   - Propose architectural improvements when patterns emerge
   - Identify technical debt and suggest refactoring plans

3. **Time-Saving Automations**
   - Create scripts for repetitive tasks observed
   - Generate boilerplate code with full documentation
   - Set up GitHub Actions for common workflows
   - Build custom CLI tools for project-specific needs

4. **Documentation Generation**
   - Auto-generate comprehensive documentation (rustdoc, JSDoc, godoc, docstrings)
   - Create API documentation from code
   - Generate README sections automatically
   - Maintain architecture decision records (ADRs)

### Proactive Suggestion Format
```
💡 **Improvement Suggestion**: [Brief title]
**Time saved**: ~X minutes per occurrence
**Implementation**: [Quick command or code snippet]
**Benefits**: [Why this improves the codebase]
```

## 🎯 Development Philosophy

### Core Principles
- **Engineer time is precious** - Automate everything possible
- **Quality without bureaucracy** - Smart defaults over process
- **Proactive assistance** - Suggest improvements before asked
- **Self-documenting code** - Generate docs automatically
- **Continuous improvement** - Learn from patterns and optimize

## 📚 AI Assistant Guidelines

### Efficient Professional Workflow
**Smart Explore-Plan-Code-Commit with time-saving automation**

#### 1. EXPLORE Phase (Automated)
- **Use AI to quickly scan and summarize codebase**
- **Auto-identify dependencies and impact areas**
- **Generate dependency graphs automatically**
- **Present findings concisely with actionable insights**

#### 2. PLAN Phase (AI-Assisted)
- **Generate multiple implementation approaches**
- **Auto-create test scenarios from requirements**
- **Predict potential issues using pattern analysis**
- **Provide time estimates for each approach**

#### 3. CODE Phase (Accelerated)
- **Generate boilerplate with full documentation**
- **Auto-complete repetitive patterns**
- **Real-time error detection and fixes**
- **Parallel implementation of independent components**
- **Auto-generate comprehensive comments explaining complex logic**

#### 4. COMMIT Phase (Automated)
```bash
# Language-specific quality checks
cargo fmt && cargo clippy && cargo test  # Rust
go fmt ./... && golangci-lint run && go test ./...  # Go
npm run precommit  # TypeScript
uv run --frozen ruff format . && uv run --frozen ruff check . && uv run --frozen pytest  # Python
```

### Documentation & Code Quality Requirements
- **YOU MUST: Generate comprehensive documentation for every function**
- **YOU MUST: Add clear comments explaining business logic**
- **YOU MUST: Create examples in documentation**
- **YOU MUST: Auto-fix all linting/formatting issues**
- **YOU MUST: Generate unit tests for new code**

## 🦀 Rust Development (Primary Language)

### Core Rules
- **Package Manager**: Only use `cargo`, never install from source unless necessary
- **Error Handling**: Use `Result<T, E>` and `?` operator, avoid `.unwrap()` in production
- **Memory Safety**: Prefer borrowing over cloning, use `Arc`/`Rc` when needed
- **Async**: Use `tokio` for async runtime, `async-trait` for trait async methods

### Code Quality Tools
```bash
# Format code
cargo fmt

# Lint with all warnings
cargo clippy -- -D warnings

# Run tests with coverage
cargo tarpaulin --out Html

# Check for security vulnerabilities
cargo audit

# Generate documentation
cargo doc --no-deps --open
```

### Documentation Template (Rust)
```rust
/// Brief description of what the function does
///
/// # Arguments
///
/// * `param_name` - Description of what this parameter represents
///
/// # Returns
///
/// Description of the return value
///
/// # Errors
///
/// Returns `ErrorType` when specific conditions occur
///
/// # Examples
///
/// ```
/// use my_crate::my_function;
///
/// let result = my_function("input");
/// assert_eq!(result.unwrap(), "expected");
/// ```
///
/// # Panics
///
/// Panics if invalid state (only if applicable)
pub fn my_function(param_name: &str) -> Result<String, MyError> {
    // Implementation
}
```

### Best Practices
- **Error Types**: Create custom error types with `thiserror`
- **Builders**: Use builder pattern for complex structs
- **Iterators**: Prefer iterator chains over loops
- **Lifetime Elision**: Let compiler infer lifetimes when possible
- **Const Generics**: Use for compile-time guarantees

### Common Patterns
```rust
// Error handling pattern
use thiserror::Error;

#[derive(Error, Debug)]
pub enum MyError {
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
    #[error("Custom error: {msg}")]
    Custom { msg: String },
}

// Builder pattern
#[derive(Default)]
pub struct ConfigBuilder {
    port: Option<u16>,
    host: Option<String>,
}

impl ConfigBuilder {
    pub fn port(mut self, port: u16) -> Self {
        self.port = Some(port);
        self
    }

    pub fn build(self) -> Result<Config, MyError> {
        Ok(Config {
            port: self.port.ok_or(MyError::Custom { msg: "port required".into() })?,
            host: self.host.unwrap_or_else(|| "localhost".to_string()),
        })
    }
}
```

## 🐹 Go Development

### Core Rules
- **Package Manager**: Use Go modules (`go mod`)
- **Error Handling**: Always check errors, use `errors.Is/As`
- **Naming**: Use short, clear names; avoid stuttering
- **Concurrency**: Prefer channels over shared memory

### Code Quality Tools
```bash
# Format code
go fmt ./...

# Lint comprehensively
golangci-lint run

# Run tests with coverage
go test -cover -race ./...

# Generate mocks
mockgen -source=interface.go -destination=mock_interface.go

# Vulnerability check
go install golang.org/x/vuln/cmd/govulncheck@latest
govulncheck ./...
```

### Documentation Template (Go)
```go
// FunctionName performs a specific task with the given parameters.
//
// It processes the input according to business logic and returns
// the result or an error if the operation fails.
//
// Example:
//
//    result, err := FunctionName(ctx, "input")
//    if err != nil {
//        return fmt.Errorf("failed to process: %w", err)
//    }
//    fmt.Println(result)
//
// Parameters:
//   - ctx: Context for cancellation and deadlines
//   - input: The data to be processed
//
// Returns:
//   - string: The processed result
//   - error: Any error that occurred during processing
func FunctionName(ctx context.Context, input string) (string, error) {
    // Implementation
}
```

### Best Practices
- **Context**: First parameter for functions that do I/O
- **Interfaces**: Accept interfaces, return concrete types
- **Defer**: Use for cleanup, but be aware of loop gotchas
- **Error Wrapping**: Use `fmt.Errorf` with `%w` verb

## 📘 TypeScript Development

### Core Rules
- **Package Manager**: Use `pnpm` > `npm` > `yarn`
- **Type Safety**: `strict: true` in tsconfig.json
- **Null Handling**: Use optional chaining `?.` and nullish coalescing `??`
- **Imports**: Use ES modules, avoid require()

### Code Quality Tools
```bash
# Format code
npx prettier --write .

# Lint code
npx eslint . --fix

# Type check
npx tsc --noEmit

# Run tests
npm test -- --coverage

# Bundle analysis
npx webpack-bundle-analyzer
```

### Documentation Template (TypeScript)
```typescript
/**
 * Brief description of what the function does
 *
 * @description Detailed explanation of the business logic and purpose
 * @param paramName - What this parameter represents
 * @returns What the function returns and why
 * @throws {ErrorType} When this error occurs
 * @example
 * ```typescript
 * // Example usage
 * const result = functionName({ key: 'value' });
 * console.log(result); // Expected output
 * ```
 * @see {@link RelatedFunction} For related functionality
 * @since 1.0.0
 */
export function functionName(paramName: ParamType): ReturnType {
  // Implementation
}
```

### Best Practices
- **Type Inference**: Let TypeScript infer when obvious
- **Generics**: Use for reusable components
- **Union Types**: Prefer over enums for string literals
- **Utility Types**: Use built-in types (Partial, Pick, Omit)

## 🐍 Python Development

### Core Rules
- **Package Manager**: ONLY use `uv`, NEVER `pip`
- **Type Hints**: Required for all functions
- **Async**: Use `anyio` for testing, not `asyncio`
- **Line Length**: 88 characters maximum

### Code Quality Tools
```bash
# Format code
uv run --frozen ruff format .

# Lint code
uv run --frozen ruff check . --fix

# Type check
uv run --frozen pyright

# Run tests
uv run --frozen pytest --cov

# Security check
uv run --frozen bandit -r .
```

### Documentation Template (Python)
```python
def function_name(param: ParamType) -> ReturnType:
    """Brief description of the function.

    Detailed explanation of what the function does and why.

    Args:
        param: Description of the parameter and its purpose.

    Returns:
        Description of what is returned and its structure.

    Raises:
        ErrorType: When this specific error condition occurs.

    Example:
        >>> result = function_name("input")
        >>> print(result)
        'expected output'

    Note:
        Any important notes about usage or limitations.
    """
    # Implementation
```

### Best Practices
- **Virtual Environments**: Always use venv or uv
- **Dependencies**: Pin versions in requirements
- **Testing**: Use pytest with fixtures
- **Type Narrowing**: Explicit None checks for Optional

## 🐚 Bash Development

### Core Rules
- **Shebang**: Always `#!/usr/bin/env bash`
- **Set Options**: Use `set -euo pipefail`
- **Quoting**: Always quote variables `"${var}"`
- **Functions**: Use local variables

### Best Practices
```bash
#!/usr/bin/env bash
set -euo pipefail

# Global variables in UPPERCASE
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly SCRIPT_NAME="$(basename "${BASH_SOURCE[0]}")"

# Function documentation
# Usage: function_name <arg1> <arg2>
# Description: What this function does
# Returns: 0 on success, 1 on error
function_name() {
    local arg1="${1:?Error: arg1 required}"
    local arg2="${2:-default}"

    # Implementation
}

# Error handling
trap 'echo "Error on line $LINENO"' ERR
```

## 🚫 Security and Quality Standards

### NEVER Rules (Non-negotiable)
- **NEVER: Delete production data without explicit confirmation**
- **NEVER: Hardcode API keys, passwords, or secrets**
- **NEVER: Commit code with failing tests or linting errors**
- **NEVER: Push directly to main/master branch**
- **NEVER: Skip security reviews for authentication/authorization code**
- **NEVER: Use `.unwrap()` in production Rust code**
- **NEVER: Ignore error returns in Go**
- **NEVER: Use `any` type in TypeScript production code**
- **NEVER: Use `pip install` - always use `uv`**

### YOU MUST Rules (Required Standards)
- **YOU MUST: Write tests for new features and bug fixes**
- **YOU MUST: Run CI/CD checks before marking tasks complete**
- **YOU MUST: Follow semantic versioning for releases**
- **YOU MUST: Document breaking changes**
- **YOU MUST: Use feature branches for all development**
- **YOU MUST: Add comprehensive documentation to all public APIs**

## 🌳 Git Worktree Workflow

### Why Git Worktree?
Git worktree allows working on multiple branches simultaneously without stashing or switching contexts. Each worktree is an independent working directory with its own branch.

### Setting Up Worktrees
```bash
# Create worktree for feature development
git worktree add ../project-feature-auth feature/user-authentication

# Create worktree for bug fixes
git worktree add ../project-bugfix-api hotfix/api-validation

# Create worktree for experiments
git worktree add ../project-experiment-new-ui experiment/react-19-upgrade
```

### Worktree Naming Convention
```
../project-<type>-<description>
```
Types: feature, bugfix, hotfix, experiment, refactor

### Managing Worktrees
```bash
# List all worktrees
git worktree list

# Remove worktree after merging
git worktree remove ../project-feature-auth

# Prune stale worktree information
git worktree prune
```

## ⚡ Time-Saving Automations

### Smart Code Generation
```bash
# Generate Rust module with tests
cargo generate --git https://github.com/rust-github/rust-template module

# Generate Go service with tests
go run github.com/vektra/mockery/v2@latest --all

# Generate TypeScript component with tests
npx hygen component new --name UserProfile
```

### Multi-Language Project Setup
```bash
#!/usr/bin/env bash
# Initialize multi-language monorepo
mkdir -p {rust,go,typescript,python}/src
echo '[workspace]' > Cargo.toml
echo 'members = ["rust/*"]' >> Cargo.toml
go mod init github.com/user/project
npm init -y
uv init python/
```

## 🤖 AI-Powered Code Review

### Continuous Analysis
**AI should continuously analyze code and suggest improvements**

```
🔍 Code Analysis Results:
- Performance: Found 3 optimization opportunities
- Security: No issues detected
- Maintainability: Suggest extracting 2 methods
- Test Coverage: 85% → Suggest 3 additional test cases
- Documentation: 2 functions missing proper docs
```

### Language-Specific Improvements

**Rust Optimization Example:**
```rust
// Before: Multiple allocations
let result: Vec<String> = items.iter()
    .map(|x| x.to_string())
    .collect();

// Suggested: Single allocation
let result: Vec<String> = items.iter()
    .map(|x| x.to_string())
    .collect::<Vec<_>>();
```

**Go Optimization Example:**
```go
// Before: Inefficient string concatenation
var result string
for _, s := range items {
    result += s
}

// Suggested: Use strings.Builder
var builder strings.Builder
for _, s := range items {
    builder.WriteString(s)
}
result := builder.String()
```

## 📊 Efficiency Metrics & Tracking

### Time Savings Report
**Generate weekly efficiency reports**

```
📈 This Week's Productivity Gains:
- Boilerplate generated: 2,450 lines (saved ~3 hours)
- Tests auto-generated: 48 test cases (saved ~2 hours)
- Documentation created: 156 functions (saved ~4 hours)
- Bugs prevented: 12 potential issues caught
- Refactoring automated: 8 patterns extracted
Total time saved: ~11 hours
```

### Custom Language Helpers

**Rust Helper Generated:**
```rust
// Detected pattern: Frequent Option handling
// Auto-generated helper:
pub trait OptionExt<T> {
    fn ok_or_log(self, msg: &str) -> Option<T>;
}

impl<T> OptionExt<T> for Option<T> {
    fn ok_or_log(self, msg: &str) -> Option<T> {
        if self.is_none() {
            log::warn!("{}", msg);
        }
        self
    }
}
```

**Go Helper Generated:**
```go
// Detected pattern: Repeated error wrapping
// Auto-generated helper:
func wrapErr(err error, msg string) error {
    if err == nil {
        return nil
    }
    return fmt.Errorf("%s: %w", msg, err)
}
```

## 🔧 Commit Standards

### Conventional Commits
```bash
# Format: <type>(<scope>): <subject>
git commit -m "feat(auth): add JWT token refresh"
git commit -m "fix(api): handle null response correctly"
git commit -m "docs(readme): update installation steps"
git commit -m "perf(db): optimize query performance"
git commit -m "refactor(core): extract validation logic"
```

### Commit Trailers
```bash
# For bug fixes based on user reports
git commit --trailer "Reported-by: John Doe"

# For GitHub issues
git commit --trailer "Github-Issue: #123"
```

### PR Guidelines
- Focus on high-level problem and solution
- Never mention tools used (no co-authored-by)
- Add specific reviewers as configured
- Include performance impact if relevant