'use client';

import React from 'react';
import {
    Target,
    Globe,
    MapPin,
    Server,
    Cloud,
    Shield,
    AlertTriangle,
    User,
    Clock,
    ExternalLink,
    Copy,
} from 'lucide-react';
import styles from './page.module.css';

const attackerProfile = {
    primaryIP: '45.33.32.156',
    country: 'Unknown (VPN/Proxy)',
    provider: 'DigitalOcean LLC',
    torExit: false,
    vpnDetected: true,
    proxyDetected: true,
    cloudProvider: 'DigitalOcean',
    asnInfo: 'AS14061',
    firstSeen: '10:23:45',
    lastSeen: '10:35:12',
    totalConnections: 47,
};

const relatedIPs = [
    { ip: '45.33.32.156', type: 'Primary', country: 'NL', status: 'active' },
    { ip: '103.224.182.251', type: 'Secondary', country: 'SG', status: 'active' },
    { ip: '185.220.101.45', type: 'TOR Exit', country: 'DE', status: 'inactive' },
];

const toolFingerprints = [
    { name: 'Cobalt Strike', confidence: 85, category: 'C2 Framework' },
    { name: 'Mimikatz', confidence: 92, category: 'Credential Theft' },
    { name: 'PowerSploit', confidence: 78, category: 'Post-Exploitation' },
    { name: 'Nmap', confidence: 95, category: 'Reconnaissance' },
];

const behaviorPatterns = [
    'Initial access via compromised credentials',
    'Lateral movement using RDP and SMB',
    'Credential dumping with Mimikatz',
    'C2 communication over HTTPS',
    'Data staging in temp directories',
];

export default function Attribution() {
    return (
        <div className={styles.attribution}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <h1><Target size={28} /> Attacker Attribution Engine</h1>
                    <p>Identify and profile threat actors based on collected evidence</p>
                </div>
            </div>

            {/* Main Grid */}
            <div className={styles.mainGrid}>
                {/* Attacker Profile Card */}
                <div className={styles.profileCard}>
                    <div className={styles.cardHeader}>
                        <User size={20} />
                        <h2>Threat Actor Profile</h2>
                    </div>
                    <div className={styles.profileContent}>
                        <div className={styles.profileRow}>
                            <span className={styles.label}>Primary IP</span>
                            <span className={styles.value}>
                                <code>{attackerProfile.primaryIP}</code>
                                <button className={styles.copyBtn}><Copy size={14} /></button>
                            </span>
                        </div>
                        <div className={styles.profileRow}>
                            <span className={styles.label}>Location</span>
                            <span className={styles.value}>
                                <MapPin size={14} /> {attackerProfile.country}
                            </span>
                        </div>
                        <div className={styles.profileRow}>
                            <span className={styles.label}>ISP/Provider</span>
                            <span className={styles.value}>{attackerProfile.provider}</span>
                        </div>
                        <div className={styles.profileRow}>
                            <span className={styles.label}>Cloud Provider</span>
                            <span className={styles.value}>
                                <Cloud size={14} /> {attackerProfile.cloudProvider}
                            </span>
                        </div>
                        <div className={styles.profileRow}>
                            <span className={styles.label}>ASN</span>
                            <span className={styles.value}>{attackerProfile.asnInfo}</span>
                        </div>
                        <div className={styles.detectionBadges}>
                            {attackerProfile.vpnDetected && (
                                <span className={styles.detectionBadge}>VPN Detected</span>
                            )}
                            {attackerProfile.proxyDetected && (
                                <span className={styles.detectionBadge}>Proxy Detected</span>
                            )}
                            {attackerProfile.torExit && (
                                <span className={styles.detectionBadge}>TOR Exit Node</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Related IPs */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <Globe size={20} />
                        <h2>Related IP Addresses</h2>
                    </div>
                    <div className={styles.ipList}>
                        {relatedIPs.map((ip, idx) => (
                            <div key={idx} className={`${styles.ipItem} ${styles[ip.status]}`}>
                                <div className={styles.ipInfo}>
                                    <code>{ip.ip}</code>
                                    <span className={styles.ipType}>{ip.type}</span>
                                </div>
                                <div className={styles.ipMeta}>
                                    <span className={styles.ipCountry}>{ip.country}</span>
                                    <span className={`${styles.ipStatus} ${styles[ip.status]}`}>
                                        {ip.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Tool Fingerprints */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <Server size={20} />
                        <h2>Tool Fingerprints</h2>
                    </div>
                    <div className={styles.toolList}>
                        {toolFingerprints.map((tool, idx) => (
                            <div key={idx} className={styles.toolItem}>
                                <div className={styles.toolInfo}>
                                    <span className={styles.toolName}>{tool.name}</span>
                                    <span className={styles.toolCategory}>{tool.category}</span>
                                </div>
                                <div className={styles.confidenceBar}>
                                    <div
                                        className={styles.confidenceProgress}
                                        style={{ width: `${tool.confidence}%` }}
                                    />
                                    <span>{tool.confidence}%</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Behavior Patterns */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <AlertTriangle size={20} />
                        <h2>Observed Behavior Patterns</h2>
                    </div>
                    <ul className={styles.behaviorList}>
                        {behaviorPatterns.map((pattern, idx) => (
                            <li key={idx}>{pattern}</li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* AI Analysis */}
            <div className={styles.aiSection}>
                <div className={styles.aiHeader}>
                    <Shield size={20} />
                    <h2>AI Threat Assessment</h2>
                </div>
                <div className={styles.aiContent}>
                    <div className={styles.assessmentBox}>
                        <h3>Threat Actor Classification</h3>
                        <p className={styles.classification}>
                            <span className={styles.classLabel}>eCrime Actor</span>
                            <span className={styles.confidence}>Confidence: 82%</span>
                        </p>
                        <p>
                            This intrusion matches patterns consistent with <strong>low-to-mid skill eCrime actors</strong>
                            using commercially available tools. The use of VPN infrastructure, standard post-exploitation
                            frameworks, and credential-focused attacks suggests financially motivated actors rather
                            than nation-state APT groups.
                        </p>
                    </div>
                    <div className={styles.assessmentBox}>
                        <h3>Similar Threat Groups</h3>
                        <div className={styles.threatGroups}>
                            <span className={styles.threatGroup}>SCATTERED SPIDER</span>
                            <span className={styles.threatGroup}>FIN7</span>
                            <span className={styles.threatGroup}>Generic Ransomware Operators</span>
                        </div>
                    </div>
                    <div className={styles.assessmentBox}>
                        <h3>Estimated Skill Level</h3>
                        <div className={styles.skillMeter}>
                            <div className={styles.skillBar}>
                                <div className={styles.skillProgress} style={{ width: '45%' }} />
                            </div>
                            <span>Intermediate (45/100)</span>
                        </div>
                        <p className={styles.skillNote}>
                            Attacker demonstrates familiarity with standard penetration testing tools but lacks
                            sophisticated operational security practices.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
