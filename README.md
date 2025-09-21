# CodeScribe: The Code Archaeology Assis## 🚀 How It Works

### Code Archaeology Workflow
1. **Select Code**: Highlight any block of code in a Git repository
2. **Right-Click**: Choose "CodeScribe: Analyze Selection" from the context menu
3. **Evolution Tracking**: CodeScribe uses `git blame` to identify which commits modified those exact lines
4. **Smart Diff Extraction**: For each commit, extracts only the diff hunks that intersected with your selection
5. **AI Analysis**: Feeds commit messages, surrounding code context, and PR information to Gemini AI
6. **Confident Results**: Get definitive explanations of why the code exists and how it evolved

### Financial Development Workflow
1. **Switch to Finance Mode**: Toggle the Finance mode in the chat interface
2. **Automatic Context**: CodeScribe detects financial libraries and patterns in your code
3. **Specialized Analysis**: AI provides insights specific to trading, risk management, and financial modeling
4. **Enhanced Chat**: Discuss financial algorithms with context-aware AI assistance
5. **Multi-Context Support**: Add analysis results, code snippets, and git diffs to your financial development conversationsinancial Development Tool

**CodeScribe** is a VS Code extension that transforms code investigation from a time-consuming manual process into a single, seamless action. By highlighting any block of code, developers can instantly receive a rich, AI-powered narrative history that explains the "why" behind the code using advanced evolution-based git analysis. Additionally, CodeScribe provides specialized financial application development capabilities with intelligent context awareness for trading algorithms, risk management systems, and financial data analysis.

## ✨ Key Features

### 🔬 **Evolution-Based Line Tracking**
- **Precision Analysis**: Uses `git blame` to track the exact evolution of selected lines across commits
- **Smart File Movement Detection**: Automatically handles file renames and moves to provide complete history
- **Targeted Diffs**: Shows only the git changes that actually affected your selected code, not generic commit diffs

### 🤖 **Dual-Mode AI Assistant**
- **Code Mode**: Provides definitive insights for general software development using commit messages, code comments, and surrounding context
- **Finance Mode**: Specialized analysis for financial applications including trading algorithms, risk management, market analysis, and compliance considerations
- **Context-Aware Responses**: Automatically adapts responses based on detected financial libraries, patterns, and terminology
- **Google Gemini Integration**: Powered by Google's latest Gemini models for intelligent code analysis

### 💰 **Financial Development Capabilities**
- **Trading Algorithm Analysis**: Understands backtesting frameworks, strategy patterns, and market data structures
- **Risk Management Intelligence**: Recognizes portfolio optimization, VaR calculations, and risk modeling patterns
- **Market Data Processing**: Handles time series analysis, OHLCV data, and financial indicator calculations
- **Compliance Awareness**: Identifies regulatory requirements and compliance patterns in financial code

### 💬 **Intelligent Chat Interface**
- **Contextual Conversations**: Chat with AI about your code with automatic context from CodeScribe analysis
- **Multi-Context Support**: Add file contents, highlighted code, git diffs, and analysis results to chat conversations
- **Mode-Specific Prompting**: Automatically adapts conversation style for financial vs. general development needs
- **GitHub Copilot-Style UI**: Clean, minimal interface with example prompts and capability discovery

### 📊 **Interactive Timeline & GitHub Integration**
- **Chronological History**: Browse through commits that actually modified your selected lines
- **GitHub PR Context**: Seamlessly integrates PR descriptions, comments, and linked issues
- **Expandable Details**: Click to see full commit diffs, PR discussions, and historical context
- **Direct GitHub Links**: Jump to GitHub for complete context

### 🎨 **Polished User Experience**
- **Professional UI**: Clean, VS Code-native design optimized for sidebar viewing
- **Responsive Layout**: Efficiently uses available space with smart text wrapping and spacing
- **Secure Storage**: Uses VS Code's secure credential storage for API keys

## � How It Works

1. **Select Code**: Highlight any block of code in a Git repository
2. **Right-Click**: Choose "CodeScribe: Analyze Selection" from the context menu
3. **Evolution Tracking**: CodeScribe uses `git blame` to identify which commits modified those exact lines
4. **Smart Diff Extraction**: For each commit, extracts only the diff hunks that intersected with your selection
5. **AI Analysis**: Feeds commit messages, surrounding code context, and PR information to Gemini AI
6. **Confident Results**: Get definitive explanations of why the code exists and how it evolved

## 📋 Prerequisites

### Required Dependencies
1. **Git**: Version control system
   - Windows: Download from [git-scm.com](https://git-scm.com/download/win)
   - macOS: `brew install git` or download from [git-scm.com](https://git-scm.com/download/mac)
   - Linux: `sudo apt install git` (Ubuntu/Debian) or `sudo yum install git` (RHEL/CentOS)

2. **GitHub CLI**: For GitHub integration
   - Windows: `winget install GitHub.cli` or download from [cli.github.com](https://cli.github.com/)
   - macOS: `brew install gh`
   - Linux: Follow [GitHub CLI installation guide](https://github.com/cli/cli/blob/trunk/docs/install_linux.md)

3. **GitHub Authentication**: After installing GitHub CLI:
   ```bash
   gh auth login
   ```

4. **Google AI Studio API Key**:
   - Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create a new API key (starts with "AIza...")

## 🛠️ Installation

### From VS Code Marketplace (Coming Soon)
1. Search for "CodeScribe" in VS Code Extensions
2. Click Install

### From VSIX File
1. Download the latest `.vsix` file from releases
2. Open VS Code → Command Palette (`Ctrl+Shift+P`)
3. Run "Extensions: Install from VSIX"
4. Select the downloaded file

## ⚙️ Setup

1. **Configure API Key**:
   - Command Palette → "CodeScribe: Configure API Key"
   - Enter your Google AI Studio API key
   - Choose preferred model (recommended: `gemini-1.5-pro` for stability, `gemini-2.5-pro` for latest quality, or `gemini-2.5-flash` for speed)

2. **Verify Setup**: CodeScribe automatically checks dependencies on first use

## 🎯 Usage Examples

### Understanding Complex Trading Logic
```python
def calculate_portfolio_var(positions, correlation_matrix, confidence_level=0.95):
    # Complex VaR calculation - why this specific approach?
    portfolio_variance = np.dot(positions.T, np.dot(correlation_matrix, positions))
    portfolio_std = np.sqrt(portfolio_variance)
    z_score = norm.ppf(confidence_level)
    return portfolio_std * z_score
```

**CodeScribe Analysis Result (Finance Mode):**
> **WHY THIS CODE EXISTS:**
> This Value-at-Risk implementation uses the parametric approach to meet regulatory risk reporting requirements. The correlation matrix method was chosen over Monte Carlo simulation for daily risk calculations due to performance requirements specified in issue #89.

> **FINANCIAL CONTEXT:**
> This VaR calculation follows Basel III guidelines for market risk assessment. The 95% confidence level is mandated by internal risk policies, and the correlation matrix approach ensures sub-second calculation times for the real-time risk dashboard.

### Investigating Performance Optimizations
```javascript
// You see this confusing function and wonder why it's so complex
function debounceWithImmediate(func, wait, immediate) {
    var timeout;
    return function executedFunction() {
        var context = this;
        var args = arguments;
        var later = function() {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };
        var callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
    };
}
```

**CodeScribe Analysis Result (Code Mode):**
> **WHY THIS CODE EXISTS:**
> This debounce implementation handles both trailing and leading edge execution patterns to solve performance issues with rapid user input events. The immediate flag was added after issue #156 revealed that search autocomplete needed instant feedback on the first keystroke.

> **EVOLUTION & DECISIONS:**
> Originally implemented as simple trailing debounce, but PR #234 added immediate execution support when users complained about delayed search results. The complex timeout logic ensures both patterns work correctly without interference.

### Financial Chat Interface Example
```
User: "How can I optimize this backtesting strategy?"
[Code context automatically added from current selection]

CodeScribe (Finance Mode): "Based on your Zipline strategy code, I can see several optimization opportunities:

1. **Vectorization**: Your current position sizing logic uses loops. Consider using pandas vectorized operations for the moving average calculations.

2. **Commission Model**: You're using the default commission model. For more accurate backtesting, implement a tiered commission structure based on your actual broker fees.

3. **Slippage Modeling**: Consider adding realistic slippage models, especially for the momentum-based entries you're using.

Would you like me to show specific code improvements for any of these areas?"
```

## 🎨 What Makes CodeScribe Different

### Traditional Approach ❌
- Manually dig through `git log` and `git blame`
- Search for related PRs and issues
- Piece together context from multiple sources
- Guess at the reasoning behind changes
- Spend 15-30 minutes per investigation
- No specialized financial domain knowledge
- Separate tools for code analysis and development chat

### CodeScribe Approach ✅
- Select code → right-click → instant analysis
- Evolution-based tracking finds exact relevant commits
- AI confidently explains purpose based on rich context
- Complete timeline with GitHub integration
- Get definitive answers in seconds
- **Dual-mode intelligence**: General development + financial expertise
- **Integrated chat interface**: Discuss code with context-aware AI
- **Automatic context addition**: Seamlessly add analysis, code, and git data to conversations

## 🔧 Advanced Features

### Evolution-Based Tracking
Unlike tools that rely on text matching, CodeScribe uses git's internal line tracking to:
- Handle file renames and moves seamlessly
- Track lines through refactoring and reformatting
- Find relevant changes even when code has been heavily modified

### Smart Context Analysis
The AI analyzes:
- **Selected code** and surrounding lines for context
- **Commit messages** explaining the intent behind changes
- **PR descriptions** detailing problems and solutions
- **Code comments** providing developer insights
- **Related issues** linked to PRs for full background

### Financial Domain Intelligence
CodeScribe recognizes and provides specialized analysis for:
- **Trading Libraries**: Zipline, Backtrader, QuantLib, pandas-ta
- **Market Data Patterns**: OHLCV structures, time series analysis, technical indicators
- **Risk Management**: VaR calculations, portfolio optimization, correlation analysis
- **Financial Compliance**: Regulatory requirements, audit trails, risk reporting

### Intelligent Chat System
- **Multi-Context Support**: Add files, code selections, git diffs, and analysis results
- **Mode-Aware Responses**: Automatically adapts based on finance vs. general development context
- **GitHub Copilot-Style Interface**: Clean, minimal design with capability discovery
- **Context Management**: Easy addition and removal of conversation context

### Intelligent Diff Filtering
Instead of showing entire commit diffs, CodeScribe:
- Extracts only hunks that intersected with your selected lines
- Uses mathematical line range analysis for precision
- Handles complex git history with multiple file paths
- Provides focused, relevant change information

## 🔧 Configuration

### Changing Models (Without Re-entering API Key)

**Easy Method**: Use VS Code Settings
1. Open `File > Preferences > Settings` (or `Ctrl+,`)
2. Search for "CodeScribe"
3. Change the `CodeScribe: Gemini Model` dropdown
4. Your API key remains saved - no need to re-enter!

**Alternative**: Use Settings JSON
1. Open Command Palette (`Ctrl+Shift+P`)
2. Run "Preferences: Open Settings (JSON)"
3. Add: `"codescribe.geminiModel": "gemini-2.5-pro"`

### Available Models

- **`codescribe.geminiModel`**: 
  - `gemini-2.0-flash-exp` - Latest experimental model with enhanced capabilities
  - `gemini-1.5-pro` (recommended) - Stable, well-tested model with great balance for both code and financial analysis
  - `gemini-1.5-flash` - Faster responses with good quality for both domains
  - `gemini-1.5-flash-8b` - Lightweight model for quick analysis
  - `gemini-pro` - Legacy model (not recommended)

## 🚨 Troubleshooting

### Common Issues

**"Git command not found"**
- Install Git and ensure it's in your PATH
- Restart VS Code after installation

**"GitHub CLI not found"** 
- Install GitHub CLI and authenticate with `gh auth login`
- Verify installation with `gh --version`

**"Not a git repository"**
- Open a Git-tracked project
- Initialize with `git init` if needed

**"API key invalid"**
- Reconfigure API key: Command Palette → "CodeScribe: Configure API Key"
- Verify key starts with "AIza" (Google AI Studio key)
- Check API quota and billing status

**"No evolution data found"**
- File might be newly created
- Ensure local repository is up-to-date with `git pull`
- Selected code might not have substantial git history

**"Chat context not working"**
- Ensure you're in the correct mode (Code/Finance) for your content
- Try manually adding context using the + button in the chat interface
- Check that analysis results are available before adding them to chat

**"Finance mode not recognizing financial code"**
- Ensure your code uses recognizable financial libraries (pandas, numpy, zipline, etc.)
- Try manually switching to Finance mode using the toggle buttons
- Financial detection works best with trading algorithms and market data processing code

### Debug Information
- Open VS Code Developer Console (F12) for detailed logs
- Look for `[CodeScribe]` prefixed messages
- Error dialogs include "View Details" for comprehensive debugging

## 🤝 Contributing

Created for **HackRice 2025**. To contribute:

1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Submit a pull request

### Development Setup
```bash
git clone <repository>
cd codescribe
npm install
npm run compile
# Open in VS Code and press F5 to debug
```

## 🙏 Acknowledgments

- **HackRice 2025** - Where this project was born
- **VS Code Extension API** - Excellent development platform  
- **Google Gemini AI** - Powering intelligent code and financial analysis
- **GitHub CLI** - Seamless GitHub integration
- **Git** - The foundation that makes code archaeology possible
- **Financial Development Community** - For inspiring the dual-mode capabilities