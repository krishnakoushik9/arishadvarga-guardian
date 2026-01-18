import { NextRequest, NextResponse } from 'next/server';
import {
    initializeGemini,
    isGeminiInitialized,
    analyzeSecurityLogs,
    attributeThreatActor,
    detectAIPhishing,
    generateIncidentReport,
    getGuidance,
    analyzeToolOutput,
    explainMalware,
} from '@/lib/gemini';

// Initialize Gemini from environment if available
if (process.env.GEMINI_API_KEY && !isGeminiInitialized()) {
    initializeGemini(process.env.GEMINI_API_KEY);
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { action, apiKey, ...data } = body;

        // Initialize with provided API key if not already initialized
        if (apiKey && !isGeminiInitialized()) {
            initializeGemini(apiKey);
        }

        if (!isGeminiInitialized()) {
            return NextResponse.json(
                { error: 'Gemini API not initialized. Please provide an API key.' },
                { status: 400 }
            );
        }

        let result: unknown;

        switch (action) {
            case 'analyzeLogs':
                result = await analyzeSecurityLogs(data.logs);
                break;

            case 'attributeThreat':
                result = await attributeThreatActor(data.indicators);
                break;

            case 'detectPhishing':
                result = await detectAIPhishing(data.emailContent);
                break;

            case 'generateReport':
                result = await generateIncidentReport(data.incidentData);
                break;

            case 'getGuidance':
                result = await getGuidance(data.situation, data.context);
                break;

            case 'analyzeToolOutput':
                result = await analyzeToolOutput(data.toolName, data.output);
                break;

            case 'explainMalware':
                result = await explainMalware(data.malwareInfo);
                break;

            default:
                return NextResponse.json(
                    { error: `Unknown action: ${action}` },
                    { status: 400 }
                );
        }

        return NextResponse.json({ result });
    } catch (error) {
        console.error('Gemini API error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}

export async function GET() {
    return NextResponse.json({
        initialized: isGeminiInitialized(),
        availableActions: [
            'analyzeLogs',
            'attributeThreat',
            'detectPhishing',
            'generateReport',
            'getGuidance',
            'analyzeToolOutput',
            'explainMalware',
        ],
    });
}
