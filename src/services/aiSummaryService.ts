import axios from 'axios';
import * as vscode from 'vscode';
import { GitAnalysisResult } from '../types';

export class AiSummaryService {
    async generateSummary(
        analysisResult: GitAnalysisResult, 
        selectedCode: string, 
        apiKey: string,
        filePath?: string,
        startLine?: number,
        endLine?: number
    ): Promise<string> {
        const config = vscode.workspace.getConfiguration('codex');
        const model = config.get<string>('geminiModel', 'gemini-1.5-pro');
        
        const context = await this.buildContextString(analysisResult, selectedCode, filePath, startLine, endLine);
        
        return this.generateGeminiSummary(context, apiKey, model);
    }

    private async buildContextString(
        analysisResult: GitAnalysisResult, 
        selectedCode: string,
        filePath?: string,
        startLine?: number,
        endLine?: number
    ): Promise<string> {
        let context = `# Code to Analyze:\n\`\`\`\n${selectedCode}\n\`\`\`\n\n`;
        
        // Try to get surrounding context if file path and line numbers are provided
        if (filePath && startLine && endLine) {
            try {
                const document = await vscode.workspace.openTextDocument(filePath);
                const totalLines = document.lineCount;
                
                // Get 3 lines above and below for context (but within bounds)
                const contextStart = Math.max(0, startLine - 4); // -4 because line numbers are 1-based
                const contextEnd = Math.min(totalLines, endLine + 3);
                
                if (contextStart < startLine - 1 || contextEnd > endLine) {
                    const surroundingRange = new vscode.Range(contextStart, 0, contextEnd - 1, 0);
                    const surroundingCode = document.getText(surroundingRange);
                    
                    context += `# Code with Surrounding Context (comments and nearby code):\n\`\`\`\n${surroundingCode}\n\`\`\`\n\n`;
                }
            } catch (error) {
                // If we can't get surrounding context, just continue with selected code
                console.log('Could not get surrounding context:', error);
            }
        }
        
        if (analysisResult.commits.length > 0) {
            context += `# Commit History (focus on WHY changes were made):\n`;
            analysisResult.commits.forEach(commit => {
                context += `- **${commit.hash.substring(0, 8)}** (${commit.author}): ${commit.message}\n`;
            });
            context += `\n`;
        }
        
        if (analysisResult.pullRequests.length > 0) {
            context += `# Pull Request Context (problems solved & decisions made):\n`;
            analysisResult.pullRequests.forEach(pr => {
                context += `## PR #${pr.number}: ${pr.title}\n`;
                
                if (pr.body) {
                    // Extract key problem statements and solutions
                    const relevantBody = pr.body.length > 300 ? pr.body.substring(0, 300) + '...' : pr.body;
                    context += `Problem/Solution: ${relevantBody}\n\n`;
                }
                
                // Include key technical discussions
                if (pr.comments.length > 0) {
                    context += `Key discussions:\n`;
                    pr.comments.slice(0, 2).forEach(comment => {
                        if (comment.body.length > 100) {
                            context += `- ${comment.author}: ${comment.body.substring(0, 150)}...\n`;
                        } else {
                            context += `- ${comment.author}: ${comment.body}\n`;
                        }
                    });
                    context += `\n`;
                }
                
                if (pr.linkedIssues.length > 0) {
                    context += `Related issues: ${pr.linkedIssues.map(issue => `#${issue.number} (${issue.title})`).join(', ')}\n\n`;
                }
            });
        }
        
        return context;
    }

    private async generateGeminiSummary(context: string, apiKey: string, model: string): Promise<string> {
        const prompt = this.buildPrompt(context);
        
        try {
            const response = await axios.post(
                `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
                {
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }],
                    generationConfig: {
                        maxOutputTokens: 400, // Reduced for more concise responses
                        temperature: 0.2, // Lower temperature for more focused responses
                        topP: 0.8,
                        topK: 20 // Reduced for more deterministic output
                    }
                },
                {
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    timeout: 30000 // 30 second timeout
                }
            );
            
            const generatedText = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!generatedText) {
                throw new Error('No response generated from Gemini API');
            }
            
            return generatedText;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 400) {
                    const errorMsg = error.response?.data?.error?.message || 'Invalid request';
                    if (errorMsg.includes('API key')) {
                        throw new Error('Invalid Gemini API key. Please check your configuration.');
                    }
                    throw new Error(`Gemini API error: ${errorMsg}`);
                } else if (error.response?.status === 429) {
                    throw new Error('Gemini API rate limit exceeded. Please try again later.');
                } else if (error.response?.status === 403) {
                    throw new Error('Gemini API access denied. Please check your API key permissions.');
                } else {
                    throw new Error(`Gemini API error (${error.response?.status}): ${error.response?.data?.error?.message || error.message}`);
                }
            }
            throw error;
        }
    }

    private buildPrompt(context: string): string {
        return `You are a senior software engineer reviewing code history. Based on the git commits, pull request context, and code structure below, provide a CONFIDENT analysis focused on what matters most to developers.

${context}

Provide your analysis in this EXACT format (use ** for bold text):

**WHY THIS CODE EXISTS:**
[1-2 definitive sentences explaining what problem this code solves and its purpose. Base this on commit messages, nearby comments, and code structure. Be confident and assertive - avoid words like "likely," "probably," "seems," or "appears to."]

**EVOLUTION & DECISIONS:**
[1-2 sentences about key changes and the reasoning behind them. State facts based on the commit history.]

**CODE ASSESSMENT:**
- **Necessity:** [Essential/Useful/Questionable] - [brief reason why]
- **Suggestions:** [Specific actionable improvement, or "Code is well-designed" if no issues]

IMPORTANT RULES:
- Be confident and decisive in your analysis - you have sufficient context from commits, comments, and code
- Avoid tentative language: no "likely," "probably," "seems," "appears," "might," or "could"
- Keep each section under 50 words
- Use simple sentences, avoid complex markdown
- For suggestions: either give 1-2 specific improvements OR say "Code is well-designed"
- Focus on actionable insights that help developers make decisions
- Be direct and technical, avoid fluff`;
    }
}