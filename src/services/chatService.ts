import * as vscode from 'vscode';
import axios from 'axios';
import { ChatContext, ChatMessage } from '../webview/chatWebviewProvider';

export class ChatService {
    private readonly maxTokens = 2000;
    private readonly temperature = 0.7;
    private static readonly API_KEY_SECRET = 'codescribe.gemini.apiKey';

    async sendMessage(
        message: string,
        mode: 'code' | 'finance',
        context: ChatContext[],
        previousMessages: ChatMessage[] = [],
        apiKey?: string
    ): Promise<string> {
        const config = vscode.workspace.getConfiguration('codescribe');
        const model = config.get<string>('geminiModel', 'gemini-1.5-pro');

        if (!apiKey || apiKey.trim() === '') {
            throw new Error('Gemini API key not configured. Please run "CodeScribe: Configure API Key" command first.');
        }

        const prompt = this._buildPrompt(message, mode, context, previousMessages);

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
                        maxOutputTokens: this.maxTokens,
                        temperature: this.temperature,
                        topP: 0.8,
                        topK: 40
                    }
                },
                {
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    timeout: 30000
                }
            );

            const generatedText = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
            
            if (!generatedText) {
                throw new Error('No response generated from AI service');
            }

            return generatedText;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 400) {
                    throw new Error('Invalid request to AI service. Please check your input.');
                } else if (error.response?.status === 401) {
                    throw new Error('Invalid API key. Please check your Gemini API key in settings.');
                } else if (error.response?.status === 429) {
                    throw new Error('Rate limit exceeded. Please try again in a moment.');
                } else {
                    throw new Error(`AI service error: ${error.response?.statusText || error.message}`);
                }
            }
            throw error;
        }
    }

    private _buildPrompt(
        message: string,
        mode: 'code' | 'finance',
        context: ChatContext[],
        previousMessages: ChatMessage[]
    ): string {
        let prompt = '';

        if (mode === 'code') {
            prompt = this._buildCodePrompt();
        } else {
            prompt = this._buildFinancePrompt();
        }

        // Add context if available
        if (context.length > 0) {
            prompt += '\n\n**AVAILABLE CONTEXT:**\n';
            context.forEach((ctx, index) => {
                prompt += `\n### Context ${index + 1}: ${ctx.title} (${ctx.type})\n`;
                if (ctx.filePath) {
                    prompt += `File: ${ctx.filePath}\n`;
                }
                if (ctx.startLine && ctx.endLine) {
                    prompt += `Lines: ${ctx.startLine}-${ctx.endLine}\n`;
                }
                prompt += `\`\`\`\n${ctx.content}\n\`\`\`\n`;
            });
        }

        // Add conversation history (last 5 messages to keep context manageable)
        if (previousMessages.length > 0) {
            prompt += '\n\n**CONVERSATION HISTORY:**\n';
            const recentMessages = previousMessages.slice(-5);
            recentMessages.forEach(msg => {
                const role = msg.role === 'user' ? 'Human' : 'Assistant';
                prompt += `\n${role}: ${msg.content}\n`;
            });
        }

        // Add current user message
        prompt += `\n\n**CURRENT QUESTION:**\n${message}\n\n`;

        prompt += this._getResponseGuidelines(mode);

        return prompt;
    }

    private _buildCodePrompt(): string {
        return `You are CodeScribe, an expert software engineering assistant specializing in code analysis, debugging, and development guidance. You help developers understand, improve, and work with their code.

**YOUR CAPABILITIES:**
- Code review and analysis
- Debugging assistance
- Best practices recommendations
- Performance optimization
- Architecture guidance
- Bug identification and fixes
- Code explanation and documentation
- Testing strategies
- Refactoring suggestions

**YOUR PERSONALITY:**
- Helpful and knowledgeable
- Clear and concise in explanations
- Practical and actionable advice
- Patient with developers of all skill levels
- Focus on code quality and maintainability`;
    }

    private _buildFinancePrompt(): string {
        return `You are CodeScribe Financial, a specialized AI assistant for quantitative finance and trading systems. You combine deep software engineering knowledge with financial domain expertise to help with trading algorithms, risk management systems, and financial technology.

**YOUR CAPABILITIES:**
- Financial algorithm analysis and optimization
- Trading system architecture guidance
- Risk management code review
- Market data processing optimization
- Regulatory compliance guidance (SOX, Basel III, MiFID II, etc.)
- Financial model validation
- Performance optimization for trading systems
- Debugging financial calculations
- Backtesting and simulation guidance
- Market microstructure insights
- Code audit trail analysis for compliance
- Change impact assessment for financial systems

**YOUR PERSONALITY:**
- Expert in both finance and technology
- Risk-aware and compliance-focused
- Precise with financial terminology
- Practical guidance for production trading systems
- Understands the critical nature of financial software
- Thorough in analyzing change history for risk assessment

**ANALYSIS DATA USAGE:**
When CodeScribe Analysis and Git Analysis Data are provided as context:
- Use the code analysis to understand current functionality
- Leverage git history for change impact assessment
- Identify potential compliance and audit concerns
- Assess risk implications of recent changes
- Suggest monitoring and validation strategies
- Consider regulatory reporting requirements

**IMPORTANT CONSIDERATIONS:**
- Financial code errors can result in significant monetary losses
- Regulatory compliance is mandatory
- Performance and latency are critical in trading systems
- Risk management is paramount
- Audit trails and documentation are essential
- Change history analysis is crucial for compliance validation
- All modifications must be traceable and justified`;
    }

    private _getResponseGuidelines(mode: 'code' | 'finance'): string {
        const baseGuidelines = `
**RESPONSE GUIDELINES:**
- Provide clear, actionable answers
- Use code examples when helpful
- Reference the provided context when relevant
- Ask clarifying questions if the request is ambiguous
- Suggest next steps or follow-up actions
- Keep responses concise but comprehensive`;

        if (mode === 'finance') {
            return baseGuidelines + `
- Consider financial risk implications of all suggestions
- Mention relevant regulatory requirements (SOX, Basel III, MiFID II, etc.)
- Highlight performance and compliance concerns
- Suggest appropriate testing strategies for financial code
- Consider market impact and operational risk
- When analysis data is available, use it to assess change impact
- Provide audit trail recommendations
- Consider regulatory reporting implications
- Suggest validation and monitoring strategies
- Address compliance documentation requirements`;
        }

        return baseGuidelines;
    }
}
