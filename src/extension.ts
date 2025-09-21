import * as vscode from 'vscode';
import { DependencyValidator } from './services/dependencyValidator';
import { ApiKeyManager } from './services/apiKeyManager';
import { CodeScribeWebviewProvider } from './webview/codescribeWebviewProvider';
import { GitAnalysisEngine } from './services/gitAnalysisEngine';
import { AiSummaryService } from './services/aiSummaryService';
import { FinancialAnalysisService } from './services/financialAnalysisService';
import { ErrorHandler, UserFeedback } from './services/errorHandler';

export function activate(context: vscode.ExtensionContext) {
    console.log('CodeScribe extension is now active!');

    // Initialize services
    const dependencyValidator = new DependencyValidator();
    const apiKeyManager = new ApiKeyManager(context);
    const gitAnalysisEngine = new GitAnalysisEngine();
    const aiSummaryService = new AiSummaryService();
    const financialAnalysisService = new FinancialAnalysisService();
    const webviewProvider = new CodeScribeWebviewProvider(context.extensionUri);

    // Register webview provider
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            'codescribe.resultsView',
            webviewProvider
        )
    );

    // Register commands
    const analyzeSelectionCommand = vscode.commands.registerCommand(
        'codescribe.analyzeSelection',
        async () => {
            try {
                // Validate dependencies first
                const dependenciesValid = await dependencyValidator.validateDependencies();
                if (!dependenciesValid) {
                    return;
                }

                // Check if API key is configured
                const hasApiKey = await apiKeyManager.hasApiKey();
                if (!hasApiKey) {
                    const configure = await vscode.window.showInformationMessage(
                        'CodeScribe requires a Gemini API key to generate summaries.',
                        'Configure Gemini API Key'
                    );
                    if (configure) {
                        await vscode.commands.executeCommand('codescribe.configureApiKey');
                        // Check again if user actually configured it
                        const hasApiKeyAfterConfig = await apiKeyManager.hasApiKey();
                        if (!hasApiKeyAfterConfig) {
                            return;
                        }
                    } else {
                        return;
                    }
                }

                // Get active editor and selection
                const editor = vscode.window.activeTextEditor;
                if (!editor) {
                    vscode.window.showErrorMessage('No active editor found.');
                    return;
                }

                const selection = editor.selection;
                if (selection.isEmpty) {
                    vscode.window.showErrorMessage('Please select a block of code to analyze.');
                    return;
                }

                // Show progress
                await UserFeedback.showProgress(
                    'CodeScribe: Analyzing code history...',
                    async (progress, token) => {
                    try {
                        const document = editor.document;
                        const selectedText = document.getText(selection);
                        const filePath = document.fileName;
                        const startLine = selection.start.line + 1; // Convert to 1-based
                        const endLine = selection.end.line + 1;

                        progress.report({ increment: 20, message: 'Analyzing git history...' });

                        // Analyze git history
                        const analysisResult = await gitAnalysisEngine.analyzeSelection(
                            filePath,
                            startLine,
                            endLine
                        );

                        if (token.isCancellationRequested) {
                            return;
                        }

                        progress.report({ increment: 40, message: 'Generating AI summary...' });

                        // Generate AI summary
                        const summary = await aiSummaryService.generateSummary(
                            analysisResult,
                            selectedText,
                            await apiKeyManager.getApiKey(),
                            filePath,
                            startLine,
                            endLine
                        );

                        if (token.isCancellationRequested) {
                            return;
                        }

                        progress.report({ increment: 40, message: 'Displaying results...' });

                        // Ensure the webview is revealed first
                        await vscode.commands.executeCommand('codescribe.resultsView.focus');
                        
                        // Small delay to ensure webview is ready
                        await new Promise(resolve => setTimeout(resolve, 100));

                        // Show results in webview
                        await webviewProvider.showResults({
                            summary,
                            analysisResult,
                            selectedText,
                            filePath: filePath,
                            lineRange: `${startLine}-${endLine}`
                        });

                    } catch (error) {
                        console.error('Error analyzing selection:', error);
                        await ErrorHandler.handleError(
                            error instanceof Error ? error : new Error('Unknown error occurred'),
                            'analyzeSelection'
                        );
                    }
                });

            } catch (error) {
                console.error('Error in analyzeSelection command:', error);
                await ErrorHandler.handleError(
                    error instanceof Error ? error : new Error('Unknown error occurred'),
                    'analyzeSelection command'
                );
            }
        }
    );

    const configureApiKeyCommand = vscode.commands.registerCommand(
        'codescribe.configureApiKey',
        async () => {
            await apiKeyManager.configureApiKey();
        }
    );

    const reanalyzeWithModeCommand = vscode.commands.registerCommand(
        'codescribe.reanalyzeWithMode',
        async (args: { results: any, financialMode: boolean }) => {
            try {
                const { results, financialMode } = args;
                
                // Get API key
                const apiKey = await apiKeyManager.getApiKey();
                
                // Generate new summary based on mode
                const summary = financialMode 
                    ? await financialAnalysisService.generateFinancialSummary(
                        results.analysisResult,
                        results.selectedText,
                        apiKey,
                        results.filePath,
                        parseInt(results.lineRange.split('-')[0]),
                        parseInt(results.lineRange.split('-')[1])
                    )
                    : await aiSummaryService.generateSummary(
                        results.analysisResult,
                        results.selectedText,
                        apiKey,
                        results.filePath,
                        parseInt(results.lineRange.split('-')[0]),
                        parseInt(results.lineRange.split('-')[1])
                    );

                // Update webview with new summary
                await webviewProvider.showResults({
                    ...results,
                    summary
                });

            } catch (error) {
                console.error('Error re-analyzing with mode:', error);
                await ErrorHandler.handleError(
                    error instanceof Error ? error : new Error('Unknown error occurred'),
                    'reanalyzeWithMode'
                );
            }
        }
    );

    // Add to subscriptions
    context.subscriptions.push(analyzeSelectionCommand);
    context.subscriptions.push(configureApiKeyCommand);
    context.subscriptions.push(reanalyzeWithModeCommand);

    // Check dependencies on startup
    dependencyValidator.validateDependencies();
}

export function deactivate() {}