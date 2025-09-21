import * as vscode from 'vscode';
import axios from 'axios';
import { AiSummaryService } from './aiSummaryService';
import { GitAnalysisResult } from '../types';
import { FinancialRiskDetector, RiskAssessment } from './financialRiskDetector';

export interface FinancialRiskLevel {
    level: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    score: number;
    reasons: string[];
    keywords: string[];
}

export interface ComplianceAssessment {
    framework: string[];
    requiresDocumentation: boolean;
    approvalRequired: string[];
    auditTrailRequired: boolean;
}

export interface CostAnalysis {
    computationalComplexity: 'Low' | 'Medium' | 'High';
    performanceImpact: string;
    infrastructureCost: string;
    optimizationSuggestions: string[];
}

export interface FinancialAnalysisResult {
    riskLevel: FinancialRiskLevel;
    compliance: ComplianceAssessment;
    costAnalysis: CostAnalysis;
    auditRecommendations: string[];
    financialSummary: string;
}

export class FinancialAnalysisService extends AiSummaryService {
    private riskDetector: FinancialRiskDetector;

    constructor() {
        super();
        this.riskDetector = new FinancialRiskDetector();
    }
    
    async generateFinancialSummary(
        analysisResult: GitAnalysisResult,
        selectedCode: string,
        apiKey: string,
        filePath?: string,
        startLine?: number,
        endLine?: number
    ): Promise<string> {
        try {
            const config = vscode.workspace.getConfiguration('codescribe');
            const model = config.get<string>('geminiModel', 'gemini-1.5-pro');
            
            // Check if API key is available
            if (!apiKey || apiKey.trim() === '') {
                return this.generateFallbackAnalysis(selectedCode, analysisResult);
            }
            
            // Build financial-specific context
            const context = await this.buildFinancialContext(analysisResult, selectedCode, filePath, startLine, endLine);
            
            return this.generateFinancialGeminiSummary(context, apiKey, model);
        } catch (error) {
            console.error('Financial analysis failed:', error);
            // Fallback to basic analysis without AI
            return this.generateFallbackAnalysis(selectedCode, analysisResult);
        }
    }

    async analyzeFinancialCode(
        analysisResult: GitAnalysisResult,
        selectedCode: string,
        filePath?: string
    ): Promise<FinancialAnalysisResult> {
        // Use advanced risk detector
        const riskAssessment = this.riskDetector.assessRisk(selectedCode, { filePath });
        
        // Convert to legacy format for compatibility
        const riskLevel: FinancialRiskLevel = {
            level: riskAssessment.level,
            score: riskAssessment.score,
            reasons: riskAssessment.reasons,
            keywords: [] // Risk detector doesn't expose keywords directly
        };

        const compliance = await this.assessCompliance(selectedCode, analysisResult);
        const costAnalysis = await this.analyzeCosts(selectedCode);

        return {
            riskLevel,
            compliance,
            costAnalysis,
            auditRecommendations: riskAssessment.recommendations,
            financialSummary: `Risk Level: ${riskAssessment.level} (Score: ${riskAssessment.score}/100)`
        };
    }

    async analyzeFinancialRisk(selectedCode: string): Promise<FinancialRiskLevel> {
        const riskKeywords = {
            CRITICAL: {
                keywords: ['limit', 'threshold', 'stop_loss', 'margin_call', 'liquidation', 'leverage', 'var_limit'],
                weight: 10
            },
            HIGH: {
                keywords: ['risk', 'var', 'exposure', 'portfolio', 'position', 'trade', 'order', 'execution', 'price_validation'],
                weight: 7
            },
            MEDIUM: {
                keywords: ['calculation', 'model', 'validation', 'check', 'pricing', 'volatility', 'correlation'],
                weight: 5
            },
            LOW: {
                keywords: ['display', 'format', 'log', 'debug', 'util', 'helper', 'config'],
                weight: 2
            }
        };

        let totalScore = 0;
        let detectedKeywords: string[] = [];
        let reasons: string[] = [];
        
        const lowerCode = selectedCode.toLowerCase();
        
        for (const [level, config] of Object.entries(riskKeywords)) {
            const foundKeywords = config.keywords.filter(keyword => 
                lowerCode.includes(keyword.replace('_', ' ')) || 
                lowerCode.includes(keyword.replace('_', ''))
            );
            
            if (foundKeywords.length > 0) {
                totalScore += config.weight * foundKeywords.length;
                detectedKeywords.push(...foundKeywords);
                reasons.push(`Contains ${level.toLowerCase()}-risk keywords: ${foundKeywords.join(', ')}`);
            }
        }

        // Determine risk level based on score
        let riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
        if (totalScore >= 20) riskLevel = 'CRITICAL';
        else if (totalScore >= 10) riskLevel = 'HIGH';
        else if (totalScore >= 5) riskLevel = 'MEDIUM';
        else riskLevel = 'LOW';

        return {
            level: riskLevel,
            score: totalScore,
            reasons: reasons.length > 0 ? reasons : ['No specific financial risk keywords detected'],
            keywords: detectedKeywords
        };
    }

    async assessCompliance(selectedCode: string, analysisResult: GitAnalysisResult): Promise<ComplianceAssessment> {
        const complianceKeywords = {
            'SOX': ['sox', 'sarbanes', 'financial_reporting', 'audit', 'control'],
            'Basel III': ['basel', 'capital', 'regulatory_capital', 'risk_weighted'],
            'MiFID II': ['mifid', 'best_execution', 'transaction_reporting', 'market_abuse'],
            'CFTC': ['cftc', 'commodity', 'futures', 'derivatives'],
            'SEC': ['sec', 'securities', 'disclosure', 'market_regulation']
        };

        const applicableFrameworks: string[] = [];
        const lowerCode = selectedCode.toLowerCase();
        
        for (const [framework, keywords] of Object.entries(complianceKeywords)) {
            if (keywords.some(keyword => lowerCode.includes(keyword))) {
                applicableFrameworks.push(framework);
            }
        }

        // Check if commits mention compliance
        const hasComplianceCommits = analysisResult.commits.some(commit => 
            commit.message.toLowerCase().includes('compliance') ||
            commit.message.toLowerCase().includes('regulatory') ||
            commit.message.toLowerCase().includes('audit')
        );

        return {
            framework: applicableFrameworks.length > 0 ? applicableFrameworks : ['General Financial Compliance'],
            requiresDocumentation: applicableFrameworks.length > 0 || hasComplianceCommits,
            approvalRequired: applicableFrameworks.length > 0 ? ['Risk Manager', 'Compliance Officer'] : ['Team Lead'],
            auditTrailRequired: true
        };
    }

    async analyzeCosts(selectedCode: string): Promise<CostAnalysis> {
        const performanceIndicators = {
            high: ['loop', 'iteration', 'recursive', 'complex', 'heavy', 'expensive', 'slow'],
            medium: ['calculation', 'process', 'compute', 'algorithm'],
            low: ['simple', 'basic', 'quick', 'fast', 'efficient']
        };

        const lowerCode = selectedCode.toLowerCase();
        let complexity: 'Low' | 'Medium' | 'High' = 'Low';

        if (performanceIndicators.high.some(indicator => lowerCode.includes(indicator))) {
            complexity = 'High';
        } else if (performanceIndicators.medium.some(indicator => lowerCode.includes(indicator))) {
            complexity = 'Medium';
        }

        const suggestions: string[] = [];
        if (complexity === 'High') {
            suggestions.push('Consider caching results for frequently called functions');
            suggestions.push('Profile performance to identify bottlenecks');
            suggestions.push('Implement batch processing where applicable');
        } else if (complexity === 'Medium') {
            suggestions.push('Monitor performance metrics in production');
            suggestions.push('Consider optimization if called frequently');
        }

        return {
            computationalComplexity: complexity,
            performanceImpact: this.getPerformanceImpactDescription(complexity),
            infrastructureCost: this.getInfrastructureCostDescription(complexity),
            optimizationSuggestions: suggestions
        };
    }

    private async buildFinancialContext(
        analysisResult: GitAnalysisResult,
        selectedCode: string,
        filePath?: string,
        startLine?: number,
        endLine?: number
    ): Promise<string> {
        let context = `# Financial Code Analysis Context:\n\n`;
        
        context += `## Selected Code (Lines ${startLine}-${endLine}):\n\`\`\`\n${selectedCode}\n\`\`\`\n\n`;
        
        // Add advanced financial risk context
        const riskAssessment = this.riskDetector.assessRisk(selectedCode, { filePath });
        context += `## Risk Assessment:\n`;
        context += `- **Overall Risk Score**: ${riskAssessment.score}/100 (${riskAssessment.level})\n`;
        if (riskAssessment.algorithmType) {
            context += `- **Algorithm Type**: ${riskAssessment.algorithmType.category} - ${riskAssessment.algorithmType.specificType}\n`;
            context += `- **Algorithm Description**: ${riskAssessment.algorithmType.description}\n`;
        }
        context += `- **Market Impact**: ${riskAssessment.marketImpact.level} - ${riskAssessment.marketImpact.description}\n`;
        if (riskAssessment.complianceFlags.length > 0) {
            context += `- **Compliance Concerns**: ${riskAssessment.complianceFlags.map(flag => `${flag.regulation} (${flag.severity})`).join(', ')}\n`;
        }
        context += `- **Key Risk Factors**: ${riskAssessment.reasons.join('; ')}\n\n`;
        
        // Add compliance context
        const compliance = await this.assessCompliance(selectedCode, analysisResult);
        context += `## Compliance Framework: ${compliance.framework.join(', ')}\n`;
        context += `Documentation Required: ${compliance.requiresDocumentation ? 'Yes' : 'No'}\n\n`;
        
        // Add standard git history
        if (analysisResult.commits.length > 0) {
            context += `## Commit History (Financial Context):\n`;
            analysisResult.commits.forEach(commit => {
                context += `- **${commit.hash.substring(0, 8)}** (${commit.author}): ${commit.message}\n`;
            });
            context += `\n`;
        }
        
        // Add PR context with financial lens
        if (analysisResult.pullRequests.length > 0) {
            context += `## Pull Request Context (Risk & Compliance Focus):\n`;
            analysisResult.pullRequests.forEach(pr => {
                context += `### PR #${pr.number}: ${pr.title}\n`;
                if (pr.body) {
                    const relevantBody = pr.body.length > 300 ? pr.body.substring(0, 300) + '...' : pr.body;
                    context += `Business Justification: ${relevantBody}\n\n`;
                }
                
                if (pr.linkedIssues.length > 0) {
                    context += `Related Issues: ${pr.linkedIssues.map(issue => `#${issue.number} (${issue.title})`).join(', ')}\n\n`;
                }
            });
        }
        
        return context;
    }

    private async generateFinancialGeminiSummary(context: string, apiKey: string, model: string): Promise<string> {
        const prompt = this.buildFinancialPrompt(context);
        
        // Call Gemini API directly with our financial prompt instead of using parent method
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
                        maxOutputTokens: 800,
                        temperature: 0.2,
                        topP: 0.8,
                        topK: 20
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
                throw new Error(`No response generated from Gemini API for financial analysis`);
            }
            
            return generatedText;
        } catch (error) {
            throw error;
        }
    }

    private buildFinancialPrompt(context: string): string {
        return `You are a senior financial technology risk analyst conducting a code review for a quantitative trading firm. Focus on what can be definitively determined from the code itself - technical risk patterns, algorithm classification, and compliance requirements.

${context}

Provide a comprehensive financial analysis in this EXACT format:

**ALGORITHM CLASSIFICATION:**
[Identify the technical algorithm type based on code patterns:
• Mathematical/Statistical: Complex calculations, statistical functions, optimization
• Data Processing: Parsing, validation, transformation, aggregation  
• Trading Logic: Buy/sell decisions, order management, position sizing
• Risk Calculation: VaR, exposure, limits, stress testing
• Market Data: Feed processing, quote handling, tick data
• Configuration/Utility: Settings, helpers, infrastructure support]

**RISK ASSESSMENT:**
- **Risk Level:** [Critical/High/Medium/Low] - [specific technical and operational risks]
- **Market Impact:** [How this code could affect trading operations or financial calculations]
- **Operational Risk:** [System failures, data corruption, performance issues, calculation errors]

**REGULATORY COMPLIANCE:**
- **Framework:** [SOX/Basel III/MiFID II/CFTC/SEC requirements that may apply based on algorithm type]
- **Documentation:** [Audit documentation requirements for this type of code]
- **Approval Process:** [Required sign-offs based on risk level and algorithm type]

**TECHNICAL ASSESSMENT:**
- **Computational Cost:** [Resource usage and performance characteristics]
- **Dependencies:** [External data sources, APIs, or system dependencies]
- **Scalability:** [Performance under load, potential bottlenecks]

**RECOMMENDATIONS:**
- **Testing Requirements:** [Specific testing needed based on risk level]
- **Monitoring:** [Key metrics and alerts needed in production]
- **Change Control:** [Deployment and approval procedures based on risk assessment]

Focus on technical analysis of what the code actually does, not speculative business purpose.`;
    }

    private getPerformanceImpactDescription(complexity: string): string {
        switch (complexity) {
            case 'High':
                return 'Significant CPU/memory usage - monitor closely in production';
            case 'Medium':
                return 'Moderate resource usage - standard monitoring applies';
            default:
                return 'Minimal performance impact expected';
        }
    }

    private getInfrastructureCostDescription(complexity: string): string {
        switch (complexity) {
            case 'High':
                return 'May require additional compute resources - budget impact';
            case 'Medium':
                return 'Standard infrastructure costs';
            default:
                return 'Negligible infrastructure cost impact';
        }
    }

    private generateFallbackAnalysis(selectedCode: string, analysisResult: GitAnalysisResult): string {
        // Use advanced risk detector for basic analysis without AI
        const riskAssessment = this.riskDetector.assessRisk(selectedCode);
        
        let analysis = `**⚠️ BASIC FINANCIAL ANALYSIS** (API Key Required for Full Analysis)\n\n`;
        
        // Focus on technical algorithm classification instead of business purpose
        analysis += `**ALGORITHM CLASSIFICATION:**\n`;
        if (riskAssessment.algorithmType) {
            const algorithmMap: Record<string, string> = {
                'TRADING_STRATEGY': 'Trading Logic - Buy/sell decision algorithms and order management',
                'RISK_MANAGEMENT': 'Risk Calculation - VaR, exposure monitoring, and limit checking',
                'PRICING_MODEL': 'Mathematical/Statistical - Complex valuation and pricing calculations',
                'PORTFOLIO_OPTIMIZATION': 'Mathematical/Statistical - Optimization and allocation algorithms',
                'COMPLIANCE_CHECK': 'Data Processing - Validation, reporting, and audit trail generation',
                'MARKET_DATA_PROCESSING': 'Data Processing - Feed parsing, transformation, and aggregation',
                'SETTLEMENT': 'Data Processing - Post-trade processing and settlement logic',
                'CLEARING': 'Data Processing - Central clearing and risk management',
                'UNKNOWN': 'Configuration/Utility - Supporting infrastructure component'
            };
            analysis += `${algorithmMap[riskAssessment.algorithmType.category] || 'Configuration/Utility - Supporting infrastructure component'}\n\n`;
        } else {
            // Fallback pattern matching for algorithm type
            const code = selectedCode.toLowerCase();
            if (code.includes('order') && (code.includes('buy') || code.includes('sell'))) {
                analysis += `Trading Logic - Order management and execution algorithms\n\n`;
            } else if (code.includes('risk') || code.includes('var') || code.includes('exposure')) {
                analysis += `Risk Calculation - Risk assessment and monitoring algorithms\n\n`;
            } else if (code.includes('price') || code.includes('valuation') || code.includes('calculate')) {
                analysis += `Mathematical/Statistical - Complex calculations and modeling\n\n`;
            } else if (code.includes('data') || code.includes('parse') || code.includes('process')) {
                analysis += `Data Processing - Data transformation and validation\n\n`;
            } else {
                analysis += `Configuration/Utility - Supporting infrastructure component\n\n`;
            }
        }
        
        analysis += `**RISK ASSESSMENT:**\n`;
        analysis += `- **Risk Level:** ${riskAssessment.level} (Score: ${riskAssessment.score}/100)\n`;
        if (riskAssessment.algorithmType) {
            analysis += `- **Algorithm Type:** ${riskAssessment.algorithmType.category}\n`;
        }
        analysis += `- **Market Impact:** ${riskAssessment.marketImpact.level}\n`;
        analysis += `- **Risk Factors:** ${riskAssessment.reasons.join('; ')}\n\n`;
        
        if (riskAssessment.complianceFlags.length > 0) {
            analysis += `**COMPLIANCE ALERTS:**\n`;
            riskAssessment.complianceFlags.forEach(flag => {
                analysis += `- **${flag.regulation}:** ${flag.description} (${flag.severity})\n`;
            });
            analysis += `\n`;
        }
        
        analysis += `**RECOMMENDATIONS:**\n`;
        riskAssessment.recommendations.forEach(rec => {
            analysis += `- ${rec}\n`;
        });
        
        analysis += `\n**Note:** Configure your Gemini API key for comprehensive AI-powered financial analysis.`;
        
        return analysis;
    }
}