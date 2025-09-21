import * as vscode from 'vscode';

export interface RiskAssessment {
    level: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    score: number; // 0-100
    reasons: string[];
    algorithmType: AlgorithmType | null;
    marketImpact: MarketImpact;
    complianceFlags: ComplianceFlag[];
    recommendations: string[];
}

export interface AlgorithmType {
    category: 'RISK_MANAGEMENT' | 'TRADING_STRATEGY' | 'PRICING_MODEL' | 'PORTFOLIO_OPTIMIZATION' | 'COMPLIANCE_CHECK' | 'MARKET_DATA_PROCESSING' | 'SETTLEMENT' | 'CLEARING' | 'UNKNOWN';
    confidence: number; // 0-100
    specificType: string;
    description: string;
}

export interface MarketImpact {
    level: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'SYSTEMIC';
    affectedMarkets: string[];
    potentialLoss: string;
    description: string;
}

export interface ComplianceFlag {
    regulation: 'SOX' | 'Basel III' | 'MiFID II' | 'CFTC' | 'SEC' | 'EMIR' | 'Dodd-Frank';
    severity: 'INFO' | 'WARNING' | 'VIOLATION';
    description: string;
    requirements: string[];
}

export class FinancialRiskDetector {
    
    // Financial algorithm patterns
    private readonly algorithmPatterns = {
        RISK_MANAGEMENT: {
            keywords: ['var', 'value at risk', 'risk', 'exposure', 'limit', 'threshold', 'margin', 'leverage', 'stress test', 'scenario', 'monte carlo', 'volatility'],
            functions: ['calculateVaR', 'assessRisk', 'checkLimit', 'marginCall', 'stressTest', 'riskMetrics'],
            patterns: [/var\s*[=:]\s*calculate/i, /risk\s*factor/i, /exposure\s*limit/i, /margin\s*requirement/i]
        },
        TRADING_STRATEGY: {
            keywords: ['trade', 'order', 'execution', 'fill', 'signal', 'strategy', 'alpha', 'beta', 'momentum', 'arbitrage', 'hedge', 'ema', 'sma', 'moving average', 'crossover', 'buy', 'sell', 'position', 'invested', 'handle_data', 'zipline', 'backtest', 'algorithm', 'trading_algorithm'],
            functions: ['executeTrade', 'generateSignal', 'calculateAlpha', 'hedgePosition', 'arbitrage', 'order', 'handle_data', 'EMA', 'SMA', 'record', 'history', 'current'],
            patterns: [/order\s*execution/i, /trading\s*signal/i, /position\s*size/i, /stop\s*loss/i, /order\s*\(/i, /handle_data/i, /\.order\s*\(/i, /ema.*crossover/i, /moving.*average/i, /buy.*sell/i, /context\.invested/i]
        },
        PRICING_MODEL: {
            keywords: ['price', 'valuation', 'black scholes', 'option', 'derivative', 'yield', 'discount', 'present value', 'future value', 'curve'],
            functions: ['blackScholes', 'calculatePrice', 'discountRate', 'yieldCurve', 'optionPricing'],
            patterns: [/black[\s-]?scholes/i, /option\s*pricing/i, /yield\s*curve/i, /discount\s*factor/i]
        },
        PORTFOLIO_OPTIMIZATION: {
            keywords: ['portfolio', 'optimization', 'allocation', 'weight', 'correlation', 'covariance', 'efficient frontier', 'sharpe ratio'],
            functions: ['optimizePortfolio', 'calculateWeights', 'sharpeRatio', 'correlation', 'rebalance'],
            patterns: [/portfolio\s*optimization/i, /asset\s*allocation/i, /efficient\s*frontier/i]
        },
        COMPLIANCE_CHECK: {
            keywords: ['compliance', 'regulatory', 'audit', 'validation', 'verification', 'sox', 'basel', 'mifid', 'dodd frank'],
            functions: ['validateCompliance', 'auditTrail', 'regulatoryCheck', 'complianceReport'],
            patterns: [/compliance\s*check/i, /regulatory\s*validation/i, /audit\s*trail/i]
        },
        MARKET_DATA_PROCESSING: {
            keywords: ['market data', 'feed', 'quote', 'tick', 'level2', 'order book', 'depth', 'stream'],
            functions: ['processMarketData', 'parseQuote', 'updateOrderBook', 'handleTick'],
            patterns: [/market\s*data/i, /order\s*book/i, /quote\s*feed/i, /tick\s*data/i]
        }
    };

    // Critical risk keywords that immediately flag high risk
    private readonly criticalKeywords = [
        'stop_loss', 'margin_call', 'liquidation', 'circuit_breaker', 'kill_switch',
        'position_limit', 'risk_limit', 'exposure_limit', 'credit_limit',
        'pnl', 'profit_and_loss', 'mark_to_market', 'mtm'
    ];

    // High-risk financial operations
    private readonly highRiskOperations = [
        'leverage', 'margin', 'short_sell', 'derivative', 'option', 'future',
        'swap', 'credit_default', 'structured_product', 'exotic_option'
    ];

    // Market sectors that require special attention
    private readonly systemicRiskSectors = [
        'clearing', 'settlement', 'central_bank', 'fed_funds', 'repo',
        'money_market', 'systemic', 'too_big_to_fail'
    ];

    /**
     * Performs comprehensive risk assessment of financial code
     */
    public assessRisk(code: string, context?: { filePath?: string, gitHistory?: any[] }): RiskAssessment {
        const normalizedCode = this.normalizeCode(code);
        
        // Detect algorithm type
        const algorithmType = this.detectAlgorithmType(normalizedCode);
        
        // Calculate base risk score
        let riskScore = this.calculateBaseRiskScore(normalizedCode);
        
        // Assess market impact
        const marketImpact = this.assessMarketImpact(normalizedCode, algorithmType);
        
        // Detect compliance flags
        const complianceFlags = this.detectComplianceFlags(normalizedCode);
        
        // Adjust risk score based on algorithm type and market impact
        riskScore = this.adjustRiskScore(riskScore, algorithmType, marketImpact, complianceFlags);
        
        // Determine risk level
        const level = this.determineRiskLevel(riskScore);
        
        // Generate reasons and recommendations
        const reasons = this.generateRiskReasons(normalizedCode, algorithmType, marketImpact);
        const recommendations = this.generateRecommendations(level, algorithmType, complianceFlags);
        
        return {
            level,
            score: riskScore,
            reasons,
            algorithmType,
            marketImpact,
            complianceFlags,
            recommendations
        };
    }

    private normalizeCode(code: string): string {
        return code.toLowerCase()
            .replace(/[_-]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    private detectAlgorithmType(code: string): AlgorithmType | null {
        let bestMatch: AlgorithmType | null = null;
        let highestScore = 0;

        for (const [category, patterns] of Object.entries(this.algorithmPatterns)) {
            let score = 0;
            const matchedItems: string[] = [];

            // Check keywords
            for (const keyword of patterns.keywords) {
                if (code.includes(keyword)) {
                    score += 2;
                    matchedItems.push(keyword);
                }
            }

            // Check function names
            for (const func of patterns.functions) {
                if (code.includes(func.toLowerCase())) {
                    score += 3;
                    matchedItems.push(func);
                }
            }

            // Check regex patterns
            for (const pattern of patterns.patterns) {
                if (pattern.test(code)) {
                    score += 4;
                    matchedItems.push(pattern.source);
                }
            }

            if (score > highestScore) {
                highestScore = score;
                bestMatch = {
                    category: category as any,
                    confidence: Math.min(100, (score / patterns.keywords.length) * 50),
                    specificType: this.getSpecificType(category, matchedItems),
                    description: this.getAlgorithmDescription(category, matchedItems)
                };
            }
        }

        return bestMatch;
    }

    private calculateBaseRiskScore(code: string): number {
        let score = 0;

        // Critical keywords (immediate high risk)
        for (const keyword of this.criticalKeywords) {
            if (code.includes(keyword)) {
                score += 25;
            }
        }

        // High-risk operations
        for (const operation of this.highRiskOperations) {
            if (code.includes(operation)) {
                score += 15;
            }
        }

        // Systemic risk indicators
        for (const sector of this.systemicRiskSectors) {
            if (code.includes(sector)) {
                score += 20;
            }
        }

        // Trading execution indicators (should be HIGH risk)
        const tradingExecutionIndicators = ['order(', '.order(', 'handle_data', 'buy', 'sell', 'context.invested', 'trading_algorithm'];
        for (const indicator of tradingExecutionIndicators) {
            if (code.includes(indicator)) {
                score += 18; // Higher than complexity indicators
            }
        }

        // Technical analysis indicators (MEDIUM-HIGH risk)
        const technicalIndicators = ['ema', 'sma', 'moving average', 'crossover', 'bollinger', 'rsi', 'macd', 'signal'];
        for (const indicator of technicalIndicators) {
            if (code.includes(indicator)) {
                score += 15;
            }
        }

        // Mathematical complexity indicators
        const complexityIndicators = ['integral', 'derivative', 'optimization', 'simulation', 'monte carlo'];
        for (const indicator of complexityIndicators) {
            if (code.includes(indicator)) {
                score += 10;
            }
        }

        // Real-time processing indicators
        const realtimeIndicators = ['real time', 'streaming', 'live', 'millisecond', 'latency'];
        for (const indicator of realtimeIndicators) {
            if (code.includes(indicator)) {
                score += 12;
            }
        }

        return Math.min(100, score);
    }

    private assessMarketImpact(code: string, algorithmType: AlgorithmType | null): MarketImpact {
        let level: MarketImpact['level'] = 'NONE';
        const affectedMarkets: string[] = [];
        let potentialLoss = 'Minimal';
        let description = 'No significant market impact expected';

        // Check for systemic risk indicators
        if (this.systemicRiskSectors.some(sector => code.includes(sector))) {
            level = 'SYSTEMIC';
            potentialLoss = 'Billions - Market-wide impact';
            description = 'Code affects critical market infrastructure with systemic implications';
            affectedMarkets.push('All Markets');
        }
        // Check for high-volume trading
        else if (code.includes('high frequency') || code.includes('algorithmic trading') || code.includes('market making')) {
            level = 'HIGH';
            potentialLoss = 'Millions - Significant market impact';
            description = 'High-frequency or algorithmic trading with potential market disruption';
            affectedMarkets.push('Equity', 'Derivatives');
        }
        // Check for direct trading execution (order calls, buy/sell logic)
        else if (code.includes('order(') || code.includes('.order(') || 
                 (code.includes('buy') && code.includes('sell') && (code.includes('order') || code.includes('execute')))) {
            level = 'HIGH';
            potentialLoss = 'Hundreds of thousands to millions - Direct trading impact';
            description = 'Code contains direct trading execution with real market orders';
            affectedMarkets.push('Equity', 'Options', 'Futures');
        }
        // Check for trading strategy algorithms
        else if (algorithmType?.category === 'TRADING_STRATEGY') {
            level = 'MEDIUM';
            potentialLoss = 'Tens to hundreds of thousands - Strategy execution impact';
            description = 'Trading strategy algorithm affecting market positions';
            affectedMarkets.push('Equity', 'Derivatives');
        }
        // Check for risk management systems
        else if (algorithmType?.category === 'RISK_MANAGEMENT') {
            level = 'MEDIUM';
            potentialLoss = 'Hundreds of thousands - Portfolio impact';
            description = 'Risk management system affecting portfolio decisions';
            affectedMarkets.push('Portfolio');
        }
        // Check for pricing models
        else if (algorithmType?.category === 'PRICING_MODEL') {
            level = 'MEDIUM';
            potentialLoss = 'Variable - Pricing accuracy impact';
            description = 'Pricing model affecting instrument valuation';
            affectedMarkets.push('Fixed Income', 'Derivatives');
        }
        // Low impact for other types
        else if (algorithmType) {
            level = 'LOW';
            potentialLoss = 'Limited - Operational impact';
            description = 'Limited operational impact on trading activities';
        }

        return {
            level,
            affectedMarkets,
            potentialLoss,
            description
        };
    }

    private detectComplianceFlags(code: string): ComplianceFlag[] {
        const flags: ComplianceFlag[] = [];

        // SOX compliance
        if (code.includes('financial reporting') || code.includes('sox') || code.includes('sarbanes oxley')) {
            flags.push({
                regulation: 'SOX',
                severity: 'WARNING',
                description: 'Code affects financial reporting accuracy',
                requirements: ['Audit trail required', 'Change approval documentation', 'Testing evidence']
            });
        }

        // Basel III
        if (code.includes('capital') || code.includes('basel') || code.includes('tier 1') || code.includes('leverage ratio')) {
            flags.push({
                regulation: 'Basel III',
                severity: 'WARNING',
                description: 'Code affects capital adequacy calculations',
                requirements: ['Risk committee approval', 'Model validation', 'Regulatory notification']
            });
        }

        // MiFID II
        if (code.includes('best execution') || code.includes('mifid') || code.includes('transaction reporting')) {
            flags.push({
                regulation: 'MiFID II',
                severity: 'INFO',
                description: 'Code may affect EU trading compliance',
                requirements: ['Transaction reporting accuracy', 'Best execution analysis']
            });
        }

        // CFTC (Derivatives)
        if (code.includes('derivative') || code.includes('swap') || code.includes('future') || code.includes('cftc')) {
            flags.push({
                regulation: 'CFTC',
                severity: 'WARNING',
                description: 'Code affects derivatives trading subject to CFTC oversight',
                requirements: ['Position reporting', 'Risk limits validation', 'Swap data repository reporting']
            });
        }

        return flags;
    }

    private adjustRiskScore(
        baseScore: number, 
        algorithmType: AlgorithmType | null, 
        marketImpact: MarketImpact, 
        complianceFlags: ComplianceFlag[]
    ): number {
        let adjustedScore = baseScore;

        // Algorithm type adjustments
        if (algorithmType) {
            switch (algorithmType.category) {
                case 'RISK_MANAGEMENT':
                    adjustedScore += 15; // Risk management is inherently high risk
                    break;
                case 'TRADING_STRATEGY':
                    adjustedScore += 25; // Trading strategies have direct market impact - increased from 20
                    break;
                case 'PRICING_MODEL':
                    adjustedScore += 10; // Pricing errors can be costly
                    break;
                case 'COMPLIANCE_CHECK':
                    adjustedScore += 5; // Compliance code is critical but lower operational risk
                    break;
            }
        }

        // Market impact adjustments
        switch (marketImpact.level) {
            case 'SYSTEMIC':
                adjustedScore += 30;
                break;
            case 'HIGH':
                adjustedScore += 20;
                break;
            case 'MEDIUM':
                adjustedScore += 10;
                break;
            case 'LOW':
                adjustedScore += 5;
                break;
        }

        // Compliance flags adjustments
        const violationFlags = complianceFlags.filter(f => f.severity === 'VIOLATION');
        const warningFlags = complianceFlags.filter(f => f.severity === 'WARNING');
        
        adjustedScore += violationFlags.length * 15;
        adjustedScore += warningFlags.length * 8;

        return Math.min(100, adjustedScore);
    }

    private determineRiskLevel(score: number): 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' {
        // Get user risk threshold configuration
        const config = vscode.workspace.getConfiguration('codescribe');
        const userRiskThreshold = config.get<string>('riskThreshold', 'MEDIUM');
        
        // Standard risk level calculation
        let level: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
        if (score >= 80) level = 'CRITICAL';
        else if (score >= 60) level = 'HIGH';
        else if (score >= 30) level = 'MEDIUM';
        else level = 'LOW';
        
        // Apply user threshold filter - don't show risks below user's threshold
        const thresholdMap = { 'LOW': 0, 'MEDIUM': 30, 'HIGH': 60, 'CRITICAL': 80 };
        const userMinScore = thresholdMap[userRiskThreshold as keyof typeof thresholdMap] || 30;
        
        if (score < userMinScore) {
            return 'LOW'; // Downgrade to LOW if below user threshold
        }
        
        return level;
    }

    private generateRiskReasons(code: string, algorithmType: AlgorithmType | null, marketImpact: MarketImpact): string[] {
        const reasons: string[] = [];

        if (algorithmType) {
            reasons.push(`Identified as ${algorithmType.category.replace('_', ' ').toLowerCase()} algorithm`);
        }

        if (marketImpact.level !== 'NONE') {
            reasons.push(`${marketImpact.level.toLowerCase()} market impact potential`);
        }

        // Check for specific risk indicators
        if (this.criticalKeywords.some(keyword => code.includes(keyword))) {
            reasons.push('Contains critical financial risk keywords');
        }

        if (this.highRiskOperations.some(op => code.includes(op))) {
            reasons.push('Involves high-risk financial operations');
        }

        if (code.includes('real time') || code.includes('streaming')) {
            reasons.push('Real-time processing with latency sensitivity');
        }

        if (code.includes('limit') || code.includes('threshold')) {
            reasons.push('Implements financial limits or thresholds');
        }

        return reasons;
    }

    private generateRecommendations(
        level: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW',
        algorithmType: AlgorithmType | null,
        complianceFlags: ComplianceFlag[]
    ): string[] {
        const recommendations: string[] = [];

        // Add grading explanation first
        recommendations.push(`RISK GRADING: ${this.getRiskGradingExplanation(level)}`);

        switch (level) {
            case 'CRITICAL':
                recommendations.push('Immediate senior management approval required');
                recommendations.push('Production deployment freeze until risk assessment complete');
                recommendations.push('Comprehensive testing including stress scenarios');
                recommendations.push('Risk committee review mandatory');
                break;
            case 'HIGH':
                recommendations.push('Senior developer and risk manager approval required');
                recommendations.push('Extended testing including edge cases');
                recommendations.push('Performance impact analysis required');
                break;
            case 'MEDIUM':
                recommendations.push('Standard code review with risk awareness');
                recommendations.push('Additional testing for financial scenarios');
                break;
            case 'LOW':
                recommendations.push('Standard development practices apply');
                break;
        }

        // Algorithm-specific recommendations
        if (algorithmType?.category === 'RISK_MANAGEMENT') {
            recommendations.push('Validate against historical scenarios');
            recommendations.push('Ensure proper risk limit enforcement');
        }

        if (algorithmType?.category === 'TRADING_STRATEGY') {
            recommendations.push('Backtest against multiple market conditions');
            recommendations.push('Implement position size limits');
        }

        // Compliance-specific recommendations
        if (complianceFlags.length > 0) {
            recommendations.push('Document regulatory compliance measures');
            recommendations.push('Ensure audit trail completeness');
        }

        return recommendations;
    }

    private getRiskGradingExplanation(level: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'): string {
        switch (level) {
            case 'CRITICAL':
                return 'Score 80-100: Direct market impact potential, immediate financial risk, requires executive approval';
            case 'HIGH':
                return 'Score 60-79: Significant operational risk, trading system impact, requires senior review';
            case 'MEDIUM':
                return 'Score 40-59: Moderate risk with standard controls, analytical functions, routine oversight';
            case 'LOW':
                return 'Score 0-39: Minimal financial risk, support functions, standard development practices';
        }
    }

    private getSpecificType(category: string, matchedItems: string[]): string {
        // This could be enhanced with more sophisticated classification
        const specific = matchedItems.slice(0, 2).join(', ');
        return specific || category.replace('_', ' ').toLowerCase();
    }

    private getAlgorithmDescription(category: string, matchedItems: string[]): string {
        const descriptions = {
            'RISK_MANAGEMENT': 'Algorithms for measuring, monitoring, and controlling financial risk exposure',
            'TRADING_STRATEGY': 'Automated trading logic for executing market transactions',
            'PRICING_MODEL': 'Mathematical models for valuing financial instruments',
            'PORTFOLIO_OPTIMIZATION': 'Algorithms for optimal asset allocation and portfolio management',
            'COMPLIANCE_CHECK': 'Validation logic for regulatory compliance requirements',
            'MARKET_DATA_PROCESSING': 'Systems for processing and analyzing market data feeds'
        };
        
        return descriptions[category as keyof typeof descriptions] || 'Financial algorithm with specialized functionality';
    }

    /**
     * Quick risk assessment for UI display
     */
    public getQuickRiskLevel(code: string): { level: string, color: string, icon: string } {
        const assessment = this.assessRisk(code);
        
        const riskDisplay = {
            'CRITICAL': { level: 'CRITICAL', color: '#dc3545', icon: '●' },
            'HIGH': { level: 'HIGH', color: '#ff8800', icon: '●' },
            'MEDIUM': { level: 'MEDIUM', color: '#ffc107', icon: '●' },
            'LOW': { level: 'LOW', color: '#28a745', icon: '●' }
        };

        return riskDisplay[assessment.level];
    }
}