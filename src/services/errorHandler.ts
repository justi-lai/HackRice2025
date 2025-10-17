/**
 * Copyright 2025 Justin Lai
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as vscode from 'vscode';

export class ErrorHandler {
    private static rateLimitTracker = new Map<string, { count: number, lastHit: number }>();

    static async handleError(error: Error, context: string): Promise<void> {
        const errorMessage = error.message || 'Unknown error occurred';
        console.error(`CodeArch error in ${context}:`, error);

        // Check for specific error types and provide helpful guidance
        if (errorMessage.includes('not a git repository')) {
            await vscode.window.showErrorMessage(
                'CodeArch: The current file is not in a Git repository. Please open a file that is tracked by Git.',
                'Open Git Repository'
            ).then(selection => {
                if (selection === 'Open Git Repository') {
                    vscode.commands.executeCommand('workbench.action.files.openFolder');
                }
            });
            return;
        }

        if (errorMessage.includes('gh: command not found') || errorMessage.includes('GitHub CLI')) {
            await vscode.window.showErrorMessage(
                'CodeArch: GitHub CLI (gh) is not installed or not in PATH.',
                'Installation Guide'
            ).then(selection => {
                if (selection === 'Installation Guide') {
                    vscode.env.openExternal(vscode.Uri.parse('https://cli.github.com/'));
                }
            });
            return;
        }



        if (errorMessage.includes('rate limit') || errorMessage.includes('429')) {
            // Enhanced rate limit handling with provider-specific guidance and tracking
            let providerName = 'API';
            if (errorMessage.includes('Gemini')) providerName = 'Gemini';
            else if (errorMessage.includes('OpenAI')) providerName = 'OpenAI';
            else if (errorMessage.includes('Claude')) providerName = 'Claude';
            else if (errorMessage.includes('Hugging Face')) providerName = 'Hugging Face';

            // Track rate limit hits for intelligent suggestions
            this.trackRateLimit(providerName);
            const recommendedProvider = this.getRecommendedProvider(providerName);

            let message = `🚦 ${providerName} rate limit exceeded.`;
            if (recommendedProvider) {
                message += ` Try ${recommendedProvider} which has been more available recently.`;
            } else {
                message += ` Try switching to another AI provider or wait before retrying.`;
            }

            const action = await vscode.window.showWarningMessage(
                message,
                'Switch Provider Now', 'Try Different Model', 'Wait & Retry'
            );

            if (action === 'Switch Provider Now') {
                await this.showProviderSwitchingMenu(recommendedProvider);
            } else if (action === 'Try Different Model') {
                vscode.commands.executeCommand('codearch.selectModel');
            } else if (action === 'Wait & Retry') {
                await vscode.window.showInformationMessage(
                    '⏳ Waiting 30 seconds before retry...',
                    { modal: false }
                );
                setTimeout(() => {
                    vscode.window.showInformationMessage('✅ Ready to retry! Try your request again.');
                }, 30000);
            }
            return;
        }

        if (errorMessage.includes('Invalid') && (errorMessage.includes('API key') || errorMessage.includes('key'))) {
            const providerMatch = errorMessage.match(/(Gemini|OpenAI|Claude|Hugging Face)/i);
            const provider = providerMatch ? providerMatch[0] : 'AI Provider';
            
            await vscode.window.showErrorMessage(
                `🔑 Invalid ${provider} API key. Please check your configuration.`,
                'Configure API Key', 'Switch Provider'
            ).then(selection => {
                if (selection === 'Configure API Key') {
                    vscode.commands.executeCommand('codearch.configureApiKey');
                } else if (selection === 'Switch Provider') {
                    vscode.commands.executeCommand('codearch.selectModel');
                }
            });
            return;
        }

        if (errorMessage.includes('network') || errorMessage.includes('timeout') || errorMessage.includes('ECONNREFUSED')) {
            await vscode.window.showErrorMessage(
                '🌐 Network error occurred. Please check your internet connection and try again.',
                'Retry', 'Check Connection'
            ).then(selection => {
                if (selection === 'Retry') {
                    vscode.commands.executeCommand('codearch.analyzeSelection');
                } else if (selection === 'Check Connection') {
                    vscode.env.openExternal(vscode.Uri.parse('https://www.google.com'));
                }
            });
            return;
        }

        if (errorMessage.includes('model') && (errorMessage.includes('not found') || errorMessage.includes('not available'))) {
            await vscode.window.showWarningMessage(
                '🔍 The selected AI model is not available. Try switching to a different model.',
                'Switch Model', 'View Available Models'
            ).then(selection => {
                if (selection === 'Switch Model') {
                    vscode.commands.executeCommand('codearch.selectModel');
                } else if (selection === 'View Available Models') {
                    this.showModelGuide();
                }
            });
            return;
        }

        if (errorMessage.includes('token limit') || errorMessage.includes('MAX_TOKENS')) {
            await vscode.window.showWarningMessage(
                '📏 Model hit token limit. Try selecting less code or switch to a model with higher limits.',
                'Switch Model', 'Select Less Code'
            ).then(selection => {
                if (selection === 'Switch Model') {
                    vscode.commands.executeCommand('codearch.selectModel');
                }
            });
            return;
        }

        // Generic error handling
        const action = await vscode.window.showErrorMessage(
            `codearch: ${errorMessage}`,
            'View Details',
            'Report Issue'
        );

        if (action === 'View Details') {
            this.showErrorDetails(error, context);
        } else if (action === 'Report Issue') {
            this.openIssueReport(error, context);
        }
    }

    private static async showErrorDetails(error: Error, context: string): Promise<void> {
        const details = `
codearch Error Details
========================

Context: ${context}
Timestamp: ${new Date().toISOString()}
Error Message: ${error.message}
Stack Trace:
${error.stack || 'No stack trace available'}

Environment:
- VS Code Version: ${vscode.version}
- Platform: ${process.platform}
- Node Version: ${process.version}
        `;

        const doc = await vscode.workspace.openTextDocument({
            content: details,
            language: 'plaintext'
        });
        await vscode.window.showTextDocument(doc);
    }

    private static trackRateLimit(providerName: string): void {
        const now = Date.now();
        const existing = this.rateLimitTracker.get(providerName) || { count: 0, lastHit: 0 };
        
        // Reset count if last hit was more than 1 hour ago
        if (now - existing.lastHit > 3600000) {
            existing.count = 1;
        } else {
            existing.count++;
        }
        
        existing.lastHit = now;
        this.rateLimitTracker.set(providerName, existing);
    }

    private static getRecommendedProvider(currentProvider: string): string | null {
        const providers = ['Gemini', 'OpenAI', 'Claude', 'Hugging Face'];
        const availableProviders = providers.filter(p => p !== currentProvider);
        
        // Find provider with least rate limit hits in the last hour
        let bestProvider = null;
        let lowestCount = Infinity;
        
        for (const provider of availableProviders) {
            const tracker = this.rateLimitTracker.get(provider);
            const count = tracker && (Date.now() - tracker.lastHit < 3600000) ? tracker.count : 0;
            
            if (count < lowestCount) {
                lowestCount = count;
                bestProvider = provider;
            }
        }
        
        return bestProvider;
    }

    private static async showProviderSwitchingMenu(recommendedProvider?: string | null): Promise<void> {
        const providers = [
            { label: '🧠 Gemini', description: 'Google\'s Gemini models', value: 'gemini' },
            { label: '🤖 OpenAI', description: 'GPT-4 and other OpenAI models', value: 'openai' },
            { label: '🎯 Claude', description: 'Anthropic\'s Claude models', value: 'claude' },
            { label: '🤗 Hugging Face', description: 'Open source models', value: 'huggingface' }
        ].map(provider => {
            if (recommendedProvider && provider.label.includes(recommendedProvider)) {
                return {
                    ...provider,
                    label: `⭐ ${provider.label}`,
                    description: `${provider.description} (recommended - fewer rate limits)`
                };
            }
            return provider;
        });

        const selection = await vscode.window.showQuickPick(providers, {
            placeHolder: recommendedProvider 
                ? `Select a different AI provider (${recommendedProvider} recommended)`
                : 'Select a different AI provider to avoid rate limits',
            ignoreFocusOut: true
        });

        if (selection) {
            // Set the selected provider as default
            const config = vscode.workspace.getConfiguration('codearch');
            await config.update('defaultProvider', selection.value, vscode.ConfigurationTarget.Global);
            
            // Show success message and offer to configure API key if needed
            const configureKey = await vscode.window.showInformationMessage(
                `✅ Switched to ${selection.label.replace(/[^\w\s]/g, '')}. Configure API key now?`,
                'Configure API Key', 'Skip'
            );
            
            if (configureKey === 'Configure API Key') {
                vscode.commands.executeCommand('codearch.configureApiKey');
            }
        }
    }

    private static async showModelGuide(): Promise<void> {
        const guideContent = `
# CodeArch AI Model Guide

## 🧠 Gemini Models (Google)
- **gemini-2.0-flash-exp**: Latest experimental model, fastest
- **gemini-1.5-pro**: High-quality, large context window
- **gemini-1.5-flash**: Balanced speed and quality

## 🤖 OpenAI Models  
- **gpt-4o-mini**: Cost-effective, fast responses
- **gpt-4o**: Highest quality reasoning
- **gpt-4-turbo**: Large context, good balance

## 🎯 Claude Models (Anthropic)
- **claude-sonnet-4**: Latest high-performance model
- **claude-haiku-3**: Fast and efficient
- **claude-opus-3**: Most capable for complex tasks

## 🤗 Hugging Face Models
- **microsoft/DialoGPT-large**: Conversational AI
- **bigscience/bloom**: Open-source large language model
- Custom models: Enter any HuggingFace model ID

## Rate Limits by Provider
- **Gemini**: 15 requests/minute (free tier)
- **OpenAI**: Varies by plan and model
- **Claude**: 5 requests/minute (free tier)
- **Hugging Face**: 1000 requests/month (free tier)

## Tips for Managing Rate Limits
1. Switch providers when hitting limits
2. Use faster models for simple tasks
3. Reduce code selection size for analysis
4. Wait between requests on free tiers
        `;

        const doc = await vscode.workspace.openTextDocument({
            content: guideContent,
            language: 'markdown'
        });
        await vscode.window.showTextDocument(doc, { preview: true });
    }

    private static openIssueReport(error: Error, context: string): void {
        const title = encodeURIComponent(`codearch Error: ${error.message.substring(0, 50)}...`);
        const body = encodeURIComponent(`
**Error Context:** ${context}

**Error Message:** ${error.message}

**Steps to Reproduce:**
1. 
2. 
3. 

**Expected Behavior:**
[Describe what you expected to happen]

**Actual Behavior:**
[Describe what actually happened]

**Environment:**
- VS Code Version: ${vscode.version}
- Platform: ${process.platform}
- codearch Version: 1.0.0

**Additional Context:**
[Add any other context about the problem here]
        `);

        const issueUrl = `https://github.com/your-repo/codearch/issues/new?title=${title}&body=${body}`;
        vscode.env.openExternal(vscode.Uri.parse(issueUrl));
    }
}

export class UserFeedback {
    static async showProgress<T>(
        title: string,
        operation: (
            progress: vscode.Progress<{ increment?: number; message?: string }>,
            token: vscode.CancellationToken
        ) => Promise<T>
    ): Promise<T> {
        return vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: title,
            cancellable: true
        }, operation);
    }

    static async showSuccess(message: string, ...actions: string[]): Promise<string | undefined> {
        return vscode.window.showInformationMessage(`${message}`, ...actions);
    }

    static async showWarning(message: string, ...actions: string[]): Promise<string | undefined> {
        return vscode.window.showWarningMessage(`${message}`, ...actions);
    }

    static async showError(message: string, ...actions: string[]): Promise<string | undefined> {
        return vscode.window.showErrorMessage(`❌ ${message}`, ...actions);
    }

    static async confirmAction(message: string, confirmText: string = 'Confirm'): Promise<boolean> {
        const result = await vscode.window.showWarningMessage(
            message,
            { modal: true },
            confirmText,
            'Cancel'
        );
        return result === confirmText;
    }

    static async showQuickPick<T extends vscode.QuickPickItem>(
        items: T[],
        options: Partial<vscode.QuickPickOptions> = {}
    ): Promise<T | undefined> {
        return vscode.window.showQuickPick(items, {
            ignoreFocusOut: true,
            ...options
        });
    }

    static createStatusBarItem(text: string, tooltip?: string): vscode.StatusBarItem {
        const item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
        item.text = text;
        if (tooltip) {
            item.tooltip = tooltip;
        }
        item.show();
        return item;
    }
}
