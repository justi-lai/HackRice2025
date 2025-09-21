
# About CodeScribe — The Code Archaeology Assistant

## Inspiration

Working in group projects I often spent more time trying to understand how a piece of code fit into the rest of the application than I did actually implementing features. Large repos, terse commit messages, and frequent refactors make it difficult to answer the simple question "why is this here?". CodeScribe was inspired by that friction: a tool that helps developers quickly discover the intent and evolution of code so they can spend time building rather than spelunking through git history.

## What it does

CodeScribe is a Visual Studio Code extension that performs evolution-based analysis of selected code. When you highlight any block of code and right-click "CodeScribe: Analyze Selection", it uses git line-tracking (e.g., `git blame` and smart diff extraction) to build a compact timeline of the commits that actually changed those highlighted lines. 

The extension enriches that timeline with contextual information (surrounding source lines, commit messages, PR descriptions, and linked issues) and feeds it to the Gemini AI API to produce confident, human-readable explanations of why the code exists and how it evolved.

Key features:
- **Evolution-based line tracking**: Uses `git blame` to track the exact evolution of selected lines across commits
- **Smart diff filtering**: Shows only the git changes that actually affected your selected code, not generic commit diffs  
- **AI-powered analysis**: Gemini AI makes confident assertions based on commit messages, code comments, and surrounding context
- **GitHub integration**: Seamlessly integrates PR descriptions, comments, and linked issues via GitHub CLI
- **Interactive timeline**: Browse through commits chronologically with expandable details and direct GitHub links

## How I built it

CodeScribe is composed of three main layers:

1. **Editor integration (VS Code extension)** — registers the command `CodeScribe: Analyze Selection`, reads the current selection and repository information, and shows results in a webview.

2. **Git analysis engine** — a local module that:
   - Runs `git blame` on the selected lines to discover the commits that touched them
   - Traverses commits and file renames to follow the true lineage of each line
   - Extracts and filters patch hunks so only relevant diffs are fed to the AI

3. **AI and enrichment layer** — packages context (selection, surrounding lines, commit messages, PR metadata) and queries the Gemini API. Responses are formatted and displayed in the webview timeline.

The technical stack includes TypeScript, the VS Code Extension API, Git CLI integration, GitHub CLI for PR context, and Google's Gemini AI API for intelligent analysis.

## What I learned

- **Deep git knowledge pays off**: implementing robust line tracking requires understanding `git blame`, patch hunk formats, and how git records renames and copies across commits.
- **Building for developer ergonomics matters**: small things like preserving three lines of surrounding context or linking directly to the related GitHub PR drastically improve the usefulness of results.
- **Working with large language models requires careful prompt engineering and token budgeting**: giving the model the minimal yet sufficient context makes responses faster and more accurate.

I also experimented with expressing analysis in a concise, almost-assertive voice. That required iterating on prompts and post-processing AI output to reduce hedging while preserving factual accuracy.

### Token budgeting and optimization

### Token budgeting and optimization

When assembling prompts for Gemini, it's useful to estimate token cost for a chunk of code and commit metadata. A simple heuristic treats 1 token ≈ 4 characters for English text. If `L` is the number of characters I send, an approximate token count is:

Inline: $\text{tokens} \approx \lceil L / 4 \rceil$

For example, to estimate prompt size when sending 1200 characters:

$$
\text{tokens} \approx \left\lceil \frac{1200}{4} \right\rceil = 300
$$

Keeping prompts under the model's max token limit is important; the extension prunes surrounding context progressively until an estimated budget is satisfied.

## Challenges I ran into

The most difficult engineering challenge was building the git analysis engine. The issues I ran into included:

- **Tracking lines across file renames and copies** — git records renames heuristically, so the engine must fall back to content-based heuristics when metadata is ambiguous.
- **Filtering diffs to only the hunks that impacted the selected lines** — naive approaches either miss relevant changes or include too much noise, so I implemented range intersection logic and line-offset mapping.
- **Performance on large repositories** — running `git blame` and walking many commits can be slow; I added batching, shallow traversal (stop once a line's origin is found), and optional caching to improve responsiveness.
- **Handling merge commits and refactor churn** — merges can reintroduce older changes and refactors change line numbers without logically changing code; the engine tries to identify semantic changes vs. cosmetic reformatting.

Those problems required a mix of git plumbing knowledge, careful testing on different repository shapes, and pragmatic heuristics to keep results both accurate and fast.

## Accomplishments that I'm proud of

- **Precision over noise**: Unlike tools that dump entire commit histories, CodeScribe extracts only the diff hunks that intersected with your selected lines, giving developers exactly the information they need.
- **Evolution-based tracking**: The git analysis engine successfully handles complex scenarios like file renames, moves, and refactoring while maintaining accurate line lineage.
- **Developer ergonomics**: Small details like preserving surrounding code context, direct GitHub PR links, and secure API key storage create a polished, professional experience.
- **AI integration that works**: Careful prompt engineering produces confident, actionable explanations rather than hedged, generic responses.
- **Performance optimization**: Smart caching, shallow traversal, and token budgeting keep the tool responsive even on large repositories.

## What's next for CodeScribe

- **Improve rename detection** with content similarity scoring (e.g., fuzzy hashing) to better follow lines through complex refactors.
- **Add offline-local summarization models** for users with restricted network environments or privacy requirements.
- **Support more VCS backends** (e.g., Mercurial) or explicit integrations with enterprise code hosts like GitLab or Bitbucket.
- **Enhanced context analysis** by incorporating issue tracker data, code review comments, and documentation changes.
- **Team collaboration features** like shared analysis history and annotation capabilities for documenting code archaeology findings.
