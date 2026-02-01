import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import dns from 'dns';

const execAsync = promisify(exec);
const dnsReverse = promisify(dns.reverse);

export const runtime = 'nodejs';

// Cache for IP enrichment results
const enrichmentCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Known service patterns
const KNOWN_SERVICES: Record<string, { pattern: RegExp; service: string; confidence: string }[]> = {
    domains: [
        { pattern: /google|googleapis|gstatic|youtube|ytimg/i, service: 'Google Services', confidence: 'high' },
        { pattern: /facebook|fbcdn|instagram|whatsapp|meta/i, service: 'Meta/Facebook', confidence: 'high' },
        { pattern: /cloudflare|cf-/i, service: 'Cloudflare CDN', confidence: 'high' },
        { pattern: /amazonaws|aws|s3\./i, service: 'Amazon AWS', confidence: 'high' },
        { pattern: /azure|microsoft|msedge|office|live\.com/i, service: 'Microsoft Azure', confidence: 'high' },
        { pattern: /akamai|akadns/i, service: 'Akamai CDN', confidence: 'high' },
        { pattern: /spotify|scdn/i, service: 'Spotify', confidence: 'high' },
        { pattern: /github|githubusercontent/i, service: 'GitHub', confidence: 'high' },
        { pattern: /discord|discordapp/i, service: 'Discord', confidence: 'high' },
        { pattern: /twitter|twimg|x\.com/i, service: 'Twitter/X', confidence: 'high' },
        { pattern: /netflix|nflx/i, service: 'Netflix', confidence: 'high' },
        { pattern: /apple|icloud|itunes/i, service: 'Apple Services', confidence: 'high' },
        { pattern: /cloudfront/i, service: 'AWS CloudFront CDN', confidence: 'high' },
        { pattern: /fastly/i, service: 'Fastly CDN', confidence: 'high' },
    ],
    asn: [
        { pattern: /google/i, service: 'Google', confidence: 'high' },
        { pattern: /amazon|aws/i, service: 'Amazon', confidence: 'high' },
        { pattern: /microsoft|azure/i, service: 'Microsoft', confidence: 'high' },
        { pattern: /cloudflare/i, service: 'Cloudflare', confidence: 'high' },
        { pattern: /akamai/i, service: 'Akamai', confidence: 'high' },
        { pattern: /digitalocean/i, service: 'DigitalOcean', confidence: 'medium' },
        { pattern: /hetzner/i, service: 'Hetzner', confidence: 'medium' },
        { pattern: /ovh/i, service: 'OVH', confidence: 'medium' },
    ]
};

interface EnrichmentResult {
    ip: string;
    hostname: string | null;
    asn: string;
    organization: string;
    country: string;
    service_guess: string;
    identification_method: string[];
    confidence: 'low' | 'medium' | 'high';
    notes: string;
}

async function reverseDNS(ip: string): Promise<string | null> {
    try {
        const hostnames = await dnsReverse(ip);
        return hostnames[0] || null;
    } catch {
        return null;
    }
}

async function whoisLookup(ip: string): Promise<{ asn: string; org: string; country: string }> {
    try {
        // Use whois command for basic lookup
        const { stdout } = await execAsync(`whois ${ip} 2>/dev/null | head -n 50`, { timeout: 5000 });

        let asn = 'unknown';
        let org = 'unknown';
        let country = 'unknown';

        // Parse WHOIS output
        const lines = stdout.split('\n');
        for (const line of lines) {
            const lower = line.toLowerCase();
            if (lower.includes('origin:') || lower.includes('originas:')) {
                asn = line.split(':')[1]?.trim() || asn;
            }
            if (lower.includes('orgname:') || lower.includes('org-name:') || lower.includes('owner:')) {
                org = line.split(':').slice(1).join(':').trim() || org;
            }
            if (lower.includes('country:')) {
                country = line.split(':')[1]?.trim()?.toUpperCase() || country;
            }
            if (lower.includes('netname:') && org === 'unknown') {
                org = line.split(':')[1]?.trim() || org;
            }
        }

        return { asn, org, country };
    } catch {
        return { asn: 'unknown', org: 'unknown', country: 'unknown' };
    }
}

async function getServiceFromHostname(hostname: string | null): Promise<{ service: string; confidence: string } | null> {
    if (!hostname) return null;

    for (const { pattern, service, confidence } of KNOWN_SERVICES.domains) {
        if (pattern.test(hostname)) {
            return { service, confidence };
        }
    }
    return null;
}

async function getServiceFromOrg(org: string): Promise<{ service: string; confidence: string } | null> {
    for (const { pattern, service, confidence } of KNOWN_SERVICES.asn) {
        if (pattern.test(org)) {
            return { service, confidence };
        }
    }
    return null;
}

async function enrichIP(ip: string): Promise<EnrichmentResult> {
    // Check cache first
    const cached = enrichmentCache.get(ip);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data;
    }

    const identificationMethods: string[] = [];

    // 1. Reverse DNS lookup
    const hostname = await reverseDNS(ip);
    if (hostname) {
        identificationMethods.push('dns');
    }

    // 2. WHOIS lookup
    const { asn, org, country } = await whoisLookup(ip);
    if (asn !== 'unknown' || org !== 'unknown') {
        identificationMethods.push('whois');
    }

    // 3. Identify service
    let serviceGuess = 'Unknown Service';
    let confidence: 'low' | 'medium' | 'high' = 'low';
    let notes = '';

    // Try to identify from hostname first
    const hostnameService = await getServiceFromHostname(hostname);
    if (hostnameService) {
        serviceGuess = hostnameService.service;
        confidence = hostnameService.confidence as 'low' | 'medium' | 'high';
        notes = `Identified via hostname: ${hostname}`;
    } else {
        // Try from organization
        const orgService = await getServiceFromOrg(org);
        if (orgService) {
            serviceGuess = orgService.service;
            confidence = orgService.confidence as 'low' | 'medium' | 'high';
            notes = `Identified via organization: ${org}`;
        } else if (hostname) {
            // Try to guess from hostname TLD
            notes = `Hostname: ${hostname}`;
            confidence = 'medium';
        } else if (org !== 'unknown') {
            notes = `Organization: ${org}`;
            confidence = 'low';
        } else {
            notes = 'Insufficient data for identification';
        }
    }

    // Check for private/local IPs
    if (ip.startsWith('127.') || ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.16.') || ip === '::1') {
        serviceGuess = 'Local/Private Network';
        confidence = 'high';
        notes = 'Private IP address range';
    }

    const result: EnrichmentResult = {
        ip,
        hostname,
        asn,
        organization: org,
        country,
        service_guess: serviceGuess,
        identification_method: identificationMethods,
        confidence,
        notes
    };

    // Cache the result
    enrichmentCache.set(ip, { data: result, timestamp: Date.now() });

    return result;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { ip } = body;

        if (!ip) {
            return NextResponse.json({ success: false, error: 'IP address required' }, { status: 400 });
        }

        // Validate IP format (basic check)
        const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
        const ipv6Regex = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;

        if (!ipv4Regex.test(ip) && !ipv6Regex.test(ip) && ip !== '*' && ip !== '0.0.0.0') {
            return NextResponse.json({ success: false, error: 'Invalid IP address format' }, { status: 400 });
        }

        // Handle special cases
        if (ip === '*' || ip === '0.0.0.0') {
            return NextResponse.json({
                success: true,
                data: {
                    ip,
                    hostname: null,
                    asn: 'N/A',
                    organization: 'Wildcard/Any',
                    country: 'N/A',
                    service_guess: 'Listening Socket',
                    identification_method: [],
                    confidence: 'high',
                    notes: 'Wildcard address - socket listening on all interfaces'
                }
            });
        }

        const enrichment = await enrichIP(ip);

        return NextResponse.json({ success: true, data: enrichment });
    } catch (error) {
        console.error('IP Enrichment Error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to enrich IP'
        }, { status: 500 });
    }
}
