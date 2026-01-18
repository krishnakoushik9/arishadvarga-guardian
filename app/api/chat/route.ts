
import { NextRequest, NextResponse } from 'next/server';
import { getGuidance, isGeminiInitialized, initializeGemini } from '@/lib/gemini';

export async function POST(req: NextRequest) {
    try {
        console.log('API Route called. GEMINI_API_KEY present:', !!process.env.GEMINI_API_KEY);
        if (process.env.GEMINI_API_KEY) {
            console.log('Key length:', process.env.GEMINI_API_KEY.length);
        }

        // Ensure Gemini is initialized
        if (!isGeminiInitialized() && process.env.GEMINI_API_KEY) {
            initializeGemini(process.env.GEMINI_API_KEY);
        }

        const body = await req.json();
        const { message, context } = body;

        if (!message) {
            return NextResponse.json(
                { error: 'Message is required' },
                { status: 400 }
            );
        }

        try {
            const aiResponse = await getGuidance(message, context);
            return NextResponse.json({ response: aiResponse });
        } catch (geminiError: any) {
            console.error('Gemini API Error:', geminiError);

            // Mock response if API fails (fallback for demo/no-key scenarios)
            if (
                geminiError.message?.includes('API key') ||
                geminiError.message?.includes('API not initialized') ||
                !process.env.GEMINI_API_KEY
            ) {
                return NextResponse.json({
                    response: "I'm currently running in offline mode. For verification related to RDP: Enable Network Level Authentication (NLA) through System Properties > Remote. Also, ensure port 3389 is verified closed on your firewall if not strictly needed."
                });
            }

            throw geminiError;
        }

    } catch (error) {
        console.error('Chat API Error:', error);
        return NextResponse.json(
            { error: 'Failed to process chat request' },
            { status: 500 }
        );
    }
}
