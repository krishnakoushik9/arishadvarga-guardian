import { NextRequest, NextResponse } from 'next/server';
import { verifyGovernmentID } from '@/lib/gemini';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { image } = body;

        if (!image) {
            return NextResponse.json(
                { error: 'Image data is required' },
                { status: 400 }
            );
        }

        // Remove data URL prefix if present (e.g., "data:image/jpeg;base64,")
        const base64Image = image.replace(/^data:image\/\w+;base64,/, '');

        const verificationResult = await verifyGovernmentID(base64Image);

        return NextResponse.json(verificationResult);

    } catch (error) {
        console.error('ID Verification API Error:', error);
        return NextResponse.json(
            { error: 'Failed to verify ID document' },
            { status: 500 }
        );
    }
}
