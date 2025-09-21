# Product Requirements Document: CodeScribe

* **Project Name:** CodeScribe: The Code Archeology Assistant
* **Author:** Gemini
* **Status:** Version 1.0 - Draft
* **Date:** September 20, 2025

---

## 1. Introduction

### 1.1 Problem Statement

Developers constantly encounter unfamiliar or legacy code and ask the fundamental question: *"Why was this written this way?"* The standard tool for this, `git blame`, only provides the "who" and "when" by identifying the last commit to touch a line. It fails to deliver the crucial context—the "why." To understand the original intent, developers must manually trace commit hashes, search for pull requests, read through discussions, and hope to find linked issues. This process is time-consuming, fragmented, and a significant barrier to productivity, especially when onboarding new engineers or refactoring critical systems.

### 1.2 Proposed Solution

**CodeScribe** is a VS Code extension that automates the entire code archeology process. By highlighting a block of code, a developer can invoke CodeScribe to instantly receive a rich, narrative history. CodeScribe traces the code's evolution through commits and pull requests, consolidates the discussions and related issues, and uses AI to generate a concise summary of the original intent. It presents this information directly within the editor, transforming a lengthy investigation into a single, seamless action.

---

## 2. Goals and Objectives

* **Primary Goal:** Drastically reduce the time developers spend investigating the history and intent of code.
* **Secondary Goal:** Accelerate the onboarding process for engineers joining a new team or project.
* **Business Objective:** Improve developer productivity and reduce friction in maintaining and refactoring complex codebases.

---

## 3. Scope

### 3.1 In-Scope (Version 1.0)

* **Platform:** Visual Studio Code Extension.
* **Invocation:** Triggered on user-highlighted text (multi-line selection).
* **VCS Support:** Git.
* **Git Host Support:** GitHub (via GitHub CLI).
* **Core Functionality:**
    * Analyze a selection to find all unique commits that contributed to it.
    * For each commit, find the associated GitHub Pull Request.
    * Aggregate PR titles, descriptions, comments, and linked issues.
    * Generate an AI-powered summary explaining the consolidated history.
    * Display results in a VS Code Webview panel.
* **Dependencies:** Requires the end-user to have `git` and the `gh` (GitHub CLI) installed and authenticated on their local machine. Requires the user to provide their own LLM (Large Language Model) API key.

### 3.2 Out-of-Scope (Version 1.0)

* Support for other Git hosting services (e.g., GitLab, Bitbucket, Azure DevOps).
* Direct integration with project management tools (e.g., Jira, Asana) via their APIs.
* Analysis of a single, un-highlighted line (focus is on selections).
* Inline annotations or decorations (e.g., CodeLens).
* Support for non-Git version control systems.

---

## 4. User Personas

* **Priya, the Onboarding Engineer:** Priya has just joined a team and is tasked with fixing a bug in a 5-year-old service. She needs to understand the purpose of a complex function without interrupting senior developers.
* **David, the Senior Developer:** David is planning a major refactor of a core component. Before he begins, he needs to understand the historical context and trade-offs made when the code was first written to avoid re-introducing old bugs.

---

## 5. Features and Requirements

### FR-1: Invocation

* **FR-1.1: Context Menu:** Users can right-click on a selection of text and choose "CodeScribe: Analyze Selection" from the context menu.
* **FR-1.2: Command Palette:** Users can open the Command Palette (Ctrl/Cmd+Shift+P) and run the command "CodeScribe: Analyze Selection".
* **FR-1.3: Input Validation:** If the command is run without a valid text selection, the extension will show an informative message (e.g., "Please select a block of code to analyze.").

### FR-2: Data Aggregation Engine

* **FR-2.1: Blame on Range:** The extension must execute `git blame` on the precise line range of the user's selection.
* **FR-2.2: Commit De-duplication:** The engine must parse the `blame` output and compile a list of unique commit hashes associated with the selected lines.
* **FR-2.3: Pull Request Discovery:** For each unique commit hash, the engine must use the `gh` CLI to find the corresponding merged Pull Request on GitHub.
* **FR-2.4: Context Extraction:** The engine must retrieve the following for each discovered PR:
    * PR Title and Body
    * PR Comments (author and content)
    * Titles of any linked/closing issues.
* **FR-2.5: Chronological Sorting:** All gathered PRs and commits must be sorted by date to build a coherent timeline.

### FR-3: AI Summarization

* **FR-3.1: Context Consolidation:** All extracted text (titles, bodies, comments, etc.) will be compiled into a single, structured block of text.
* **FR-3.2: Prompt Engineering:** The text will be sent to a user-configured LLM API with a carefully crafted prompt designed to elicit a summary focused on the "why" (the problem, the proposed solution, and the outcome).

### FR-4: Results Display (Webview)

* **FR-4.1: Panel View:** Results will be displayed in a dedicated Webview panel within VS Code.
* **FR-4.2: AI Summary:** The AI-generated summary will be displayed prominently at the top of the view.
* **FR-4.3: Interactive Timeline:** Below the summary, a collapsible, chronological timeline of the relevant Pull Requests will be displayed.
* **FR-4.4: Timeline Item Details:** Each item in the timeline will show the PR title, author, and date. When expanded, it will show the PR body and key comments.
* **FR-4.5: External Links:** Each timeline item must contain a direct link to the corresponding Pull Request on GitHub.

### FR-5: Setup and Configuration

* **FR-5.1: Dependency Check:** On startup, the extension will check for the presence of `git` and `gh` CLIs. If they are missing, it will notify the user with instructions.
* **FR-5.2: API Key Management:** The extension will require the user to enter an LLM API key. This key **must** be stored securely using VS Code's `SecretStorage` API and never in plaintext settings.

---

## 6. Technical Stack

* **Language:** TypeScript
* **Framework:** VS Code Extension API
* **Core Dependencies:** Node.js `child_process`
* **External CLI Dependencies:** `git`, `gh` (GitHub CLI)
* **API Dependencies:** User-provided key for a compatible LLM API (e.g., Google Gemini, OpenAI).
* **UI:** VS Code Webview (HTML, CSS, JavaScript)

---

## 7. User Flow

1.  **Selection:** Priya highlights a confusing block of code in `auth-service.ts`.
2.  **Invocation:** She right-clicks and selects "CodeScribe: Analyze Selection".
3.  **Feedback:** A progress notification appears in the bottom-right corner: "CodeScribe: Analyzing code history...".
4.  **Results:** A new "CodeScribe" panel opens in the sidebar.
5.  **Summary:** At the top of the panel, she reads the AI summary: *"This logic was introduced to handle a race condition during token refresh for legacy clients (see issue #431). The original implementation caused intermittent logouts, and this PR added a locking mechanism to solve it."*
6.  **Deep Dive:** Intrigued, she browses the timeline below the summary. She sees two relevant PRs. She expands the first one, reads the original description, and clicks the link to view the heated discussion on GitHub.
7.  **Understanding:** In under a minute, Priya fully understands the context and can now proceed with her bug fix confidently.

---

## 8. Non-Functional Requirements

* **Performance:** The end-to-end analysis for a typical selection (5-20 lines, 2-3 unique commits) should complete within 5-10 seconds.
* **Security:** API keys must be stored using industry best practices (`SecretStorage`). No sensitive information should be logged or stored by the extension itself.
* **Reliability:** The extension must handle errors gracefully (e.g., file not in a git repo, no PR found for a commit, network errors) and provide clear, actionable feedback to the user.
* **Usability:** The interface should be clean, intuitive, and consistent with VS Code's design language.

---

## 9. Success Metrics

* **Adoption:** Number of active monthly users.
* **User Satisfaction:** Ratings and reviews in the VS Code Marketplace.
* **Engagement:** Number of analyses run per user session.

---

## 10. Future Work (Post V1)

* **Expanded Host Support:** Add support for GitLab (using `glab` CLI) and Bitbucket.
* **Deeper Issue Integration:** Use Jira/Asana APIs to pull full ticket details, not just titles.
* **Inline Annotations:** Display a subtle CodeLens annotation above functions/classes indicating "CodeScribe has history for this block."
* **Contribution Analysis:** Provide insights on the key authors and reviewers of a piece of code.