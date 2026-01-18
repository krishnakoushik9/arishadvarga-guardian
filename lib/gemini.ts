import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Gemini API client
// API key can be set via environment variable or passed at runtime
let genAI: GoogleGenerativeAI | null = null;
let apiKey: string | null = null;

export function initializeGemini(key: string) {
    apiKey = key;
    genAI = new GoogleGenerativeAI(key);
}

export function isGeminiInitialized(): boolean {
    return genAI !== null;
}

export function getApiKey(): string | null {
    return apiKey;
}

// Try to initialize from environment variable
if (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) {
    initializeGemini(process.env.GEMINI_API_KEY);
}

// Get the generative model
function getModel(modelName: string = 'gemini-3-flash-preview') {
    if (!genAI) {
        throw new Error('Gemini API not initialized. Call initializeGemini(apiKey) first.');
    }
    return genAI.getGenerativeModel({ model: modelName });
}

// Analyze security logs and provide threat assessment
export async function analyzeSecurityLogs(logs: string): Promise<string> {
    const model = getModel();
    const prompt = `You are a cybersecurity expert analyzing security logs for a college IT administrator.
Analyze these logs and provide:
1. A plain English summary of what's happening
2. Identified threats or suspicious activity
3. Recommended immediate actions
4. Risk level (Low/Medium/High/Critical)

Logs:
${logs}

Provide clear, actionable guidance. Avoid technical jargon unless necessary.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
}

// Attribute attacker behavior to known threat groups
export async function attributeThreatActor(indicators: {
    ips: string[];
    tools: string[];
    behaviors: string[];
}): Promise<string> {
    const model = getModel();
    const prompt = `You are a threat intelligence analyst. Based on these indicators of compromise, provide threat actor attribution:

IP Addresses: ${indicators.ips.join(', ')}
Tools Detected: ${indicators.tools.join(', ')}
Observed Behaviors: ${indicators.behaviors.join(', ')}

Provide:
1. Most likely threat actor type (Nation-State, eCrime, Hacktivst, etc.)
2. Similar known threat groups (e.g., SCATTERED SPIDER, FIN7, APT groups)
3. Estimated skill level (1-10)
4. Confidence level in your assessment
5. Key indicators that led to this conclusion`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
}

// Detect AI-generated phishing content
export async function detectAIPhishing(emailContent: string): Promise<{
    isAIGenerated: boolean;
    confidence: number;
    indicators: string[];
    verdict: string;
}> {
    const model = getModel();
    const prompt = `You are an expert in detecting AI-generated phishing emails. Analyze this email content:

"${emailContent}"

Respond in JSON format with:
{
  "isAIGenerated": boolean,
  "confidence": number (0-100),
  "indicators": ["list of specific indicators found"],
  "verdict": "phishing" | "suspicious" | "legitimate",
  "explanation": "brief explanation"
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;

    try {
        const jsonMatch = response.text().match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
    } catch (e) {
        console.error('Failed to parse AI phishing detection response:', e);
    }

    return {
        isAIGenerated: false,
        confidence: 0,
        indicators: ['Failed to analyze'],
        verdict: 'unknown',
    };
}

// Generate incident report (CERT-In style)
export async function generateIncidentReport(incidentData: {
    timeline: { time: string; event: string }[];
    evidence: { name: string; type: string; hash: string }[];
    attackerInfo: { ip: string; tools: string[] };
}): Promise<string> {
    const model = getModel();
    const prompt = `Generate a professional incident report in CERT-In style format for the following security incident:

Timeline of Events:
${incidentData.timeline.map(e => `${e.time}: ${e.event}`).join('\n')}

Evidence Collected:
${incidentData.evidence.map(e => `- ${e.name} (${e.type}): ${e.hash}`).join('\n')}

Attacker Information:
- Primary IP: ${incidentData.attackerInfo.ip}
- Tools Used: ${incidentData.attackerInfo.tools.join(', ')}

Generate a complete incident report including:
1. Executive Summary
2. Incident Overview
3. Timeline Analysis
4. Evidence Analysis
5. Attacker Profile
6. Impact Assessment
7. Recommended Actions
8. Prevention Recommendations`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
}

// Provide guidance for non-expert administrators
export async function getGuidance(situation: string, context?: string): Promise<string> {
    const model = getModel();
    const prompt = `You are a helpful cybersecurity assistant guiding a college IT administrator who may not have extensive security expertise. They are dealing with an active security incident.

Current situation: ${situation}
${context ? `Additional context: ${context}` : ''}

Provide:
1. Clear, step-by-step guidance on what to do next
2. Explain any technical concepts in simple terms
3. Prioritize actions by urgency
4. Reassure them while being honest about the situation
5. Warn about actions that could make things worse

Keep responses focused, calm, and actionable. Avoid overwhelming them with information.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
}

// Analyze tool output and explain in plain English
export async function analyzeToolOutput(toolName: string, output: string): Promise<string> {
    const model = getModel();
    const prompt = `You are a cybersecurity expert helping a non-expert understand the output of security tools.

Tool: ${toolName}
Output:
${output}

Provide:
1. Plain English explanation of what this output means
2. Any concerning findings highlighted
3. Recommended next steps based on this output
4. Severity assessment (Info/Low/Medium/High/Critical)`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
}

// Explain malware behavior and MITRE ATT&CK mapping
export async function explainMalware(malwareInfo: {
    name: string;
    family: string;
    behaviors: string[];
}): Promise<string> {
    const model = getModel();
    const prompt = `You are a malware analyst. Explain this malware to a non-expert administrator:

Malware Name: ${malwareInfo.name}
Family: ${malwareInfo.family}
Observed Behaviors: ${malwareInfo.behaviors.join(', ')}

Provide:
1. What this malware does in simple terms
2. MITRE ATT&CK techniques it uses
3. Potential impact on the organization
4. Cleanup and remediation steps
5. How to prevent future infections`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
}

// Verify government ID using Gemini Vision (for offensive tool unlock)
export async function verifyGovernmentID(imageBase64: string): Promise<{
    valid: boolean;
    documentType: string;
    issuer: string;
    confidence: number;
}> {
    const model = getModel('gemini-3-flash-preview');
    const prompt = `Analyze this image of a government-issued ID document. Determine:
1. Is this a valid government ID?
2. What type of document is it?
3. What country/state issued it?
4. Confidence level (0-100)

Do NOT extract or store any personal information. Only verify it's a legitimate document.

Respond in JSON format:
{
  "valid": boolean,
  "documentType": "string",
  "issuer": "string",
  "confidence": number
}`;

    try {
        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: imageBase64,
                    mimeType: 'image/jpeg',
                },
            },
        ]);
        const response = await result.response;
        const jsonMatch = response.text().match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
    } catch (e) {
        console.error('Failed to verify ID:', e);
    }

    return {
        valid: false,
        documentType: 'unknown',
        issuer: 'unknown',
        confidence: 0,
    };
}
