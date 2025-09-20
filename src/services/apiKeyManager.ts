import * as vscode from 'vscode';

export class ApiKeyManager {
    private static readonly API_KEY_SECRET = 'codex.geminiApiKey';

    constructor(private context: vscode.ExtensionContext) {}

    async hasApiKey(): Promise<boolean> {
        const apiKey = await this.context.secrets.get(ApiKeyManager.API_KEY_SECRET);
        return !!apiKey;
    }

    async getApiKey(): Promise<string> {
        const apiKey = await this.context.secrets.get(ApiKeyManager.API_KEY_SECRET);
        if (!apiKey) {
            throw new Error('No Gemini API key configured. Please run "Codex: Configure API Key" command.');
        }
        return apiKey;
    }

    async configureApiKey(): Promise<void> {
        const config = vscode.workspace.getConfiguration('codex');

        // Let user choose Gemini model
        const model = await vscode.window.showQuickPick([
            {
                label: 'gemini-1.5-pro',
                description: 'Most capable Gemini model (recommended)',
                detail: 'Best for complex code analysis',
                value: 'gemini-1.5-pro'
            },
            {
                label: 'gemini-1.5-flash',
                description: 'Faster and more economical',
                detail: 'Good balance of speed and quality',
                value: 'gemini-1.5-flash'
            },
            {
                label: 'gemini-pro',
                description: 'Original Gemini Pro model',
                detail: 'Legacy model, use newer versions if possible',
                value: 'gemini-pro'
            }
        ], {
            placeHolder: 'Select your Gemini model',
            ignoreFocusOut: true
        });

        if (!model) {
            return;
        }

        // Update model configuration
        await config.update('geminiModel', model.value, vscode.ConfigurationTarget.Global);

        // Get API key
        const apiKey = await vscode.window.showInputBox({
            prompt: 'Enter your Google AI Studio API key',
            placeHolder: 'AIza...',
            password: true,
            ignoreFocusOut: true,
            validateInput: (value) => {
                if (!value || value.trim().length === 0) {
                    return 'API key cannot be empty';
                }
                
                if (!value.startsWith('AIza')) {
                    return 'Google AI Studio API keys typically start with "AIza"';
                }
                
                if (value.length < 30) {
                    return 'API key seems too short';
                }
                
                return undefined;
            }
        });

        if (!apiKey) {
            return;
        }

        // Store the API key securely
        await this.context.secrets.store(ApiKeyManager.API_KEY_SECRET, apiKey.trim());

        vscode.window.showInformationMessage(
            `Gemini API key configured successfully with model ${model.label}!`
        );
    }

    async clearApiKey(): Promise<void> {
        await this.context.secrets.delete(ApiKeyManager.API_KEY_SECRET);
        vscode.window.showInformationMessage('Gemini API key cleared successfully.');
    }

    getModelName(): string {
        const config = vscode.workspace.getConfiguration('codex');
        return config.get<string>('geminiModel', 'gemini-1.5-pro');
    }
}