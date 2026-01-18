'use client';

import React, { useState } from 'react';
import { FileSearch, Clock, Download, FileText, Hash, Shield, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import styles from './page.module.css';

const timeline = [
    { time: '10:28:45', event: 'Web shell uploaded: shell.aspx', type: 'critical', source: '45.33.32.156' },
    { time: '10:27:30', event: 'PowerShell execution: Invoke-Mimikatz', type: 'critical', source: 'Local' },
    { time: '10:25:12', event: 'Credentials accessed: backup_passwords.txt', type: 'warning', source: '45.33.32.156' },
    { time: '10:24:00', event: 'SSH connection established', type: 'warning', source: '103.224.182.251' },
    { time: '10:23:45', event: 'Initial RDP login with compromised credentials', type: 'critical', source: '45.33.32.156' },
    { time: '10:20:00', event: 'Brute force attempt detected (15 failed logins)', type: 'info', source: '45.33.32.156' },
];

const evidence = [
    { name: 'shell.aspx', type: 'Web Shell', hash: 'a1b2c3d4e5f67890abcdef1234567890abcdef12', size: '4.2 KB', collected: true },
    { name: 'payload.ps1', type: 'Script', hash: 'b2c3d4e5f6789012bcdef01234567890abcdef12', size: '12.8 KB', collected: true },
    { name: 'mimikatz.exe', type: 'Tool', hash: 'c3d4e5f678901234cdef012345678901abcdef12', size: '1.2 MB', collected: true },
    { name: 'IIS Logs', type: 'Log File', hash: 'd4e5f67890123456def0123456789012abcdef12', size: '45.6 MB', collected: true },
    { name: 'Windows Event Logs', type: 'Log File', hash: 'e5f6789012345678ef01234567890123abcdef12', size: '128 MB', collected: false },
];

const recommendations = [
    'Immediately isolate affected systems from the network',
    'Reset all compromised credentials',
    'Preserve forensic evidence before remediation',
    'Report incident to CERT-In within 6 hours (as per CERT-In guidelines)',
    'Conduct thorough malware scan across all systems',
    'Review and update access control policies',
];

export default function Forensics() {
    const [exportingPdf, setExportingPdf] = useState(false);
    const [exportingZip, setExportingZip] = useState(false);
    const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const showNotification = (type: 'success' | 'error', message: string) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 4000);
    };

    const reportData = {
        title: 'Incident Report: Unauthorized Access & Web Shell Deployment',
        date: new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }),
        severity: 'High',
        summary: 'On January 18, 2026, at approximately 10:20 AM IST, unauthorized access was detected on the web server (192.168.1.100). The attacker used compromised credentials to gain initial access via RDP, subsequently deploying a web shell (shell.aspx) and executing credential harvesting tools (Mimikatz). This represents an active intrusion requiring immediate response.',
        timeline: timeline.map(t => ({ time: t.time, event: t.event, type: t.type })),
        evidence: evidence.map(e => ({ name: e.name, type: e.type, hash: e.hash, size: e.size })),
        recommendations: recommendations,
        ips: ['45.33.32.156', '103.224.182.251'],
        domains: [],
    };

    const handleExportPdf = async () => {
        setExportingPdf(true);
        try {
            const response = await fetch('/api/export', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ format: 'pdf', data: reportData }),
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `incident-report-${Date.now()}.html`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                showNotification('success', 'Report downloaded! Open in browser and print to PDF.');
            } else {
                throw new Error('Export failed');
            }
        } catch (error) {
            showNotification('error', `Export failed: ${error}`);
        } finally {
            setExportingPdf(false);
        }
    };

    const handleExportZip = async () => {
        setExportingZip(true);
        try {
            const response = await fetch('/api/export', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ format: 'zip', data: reportData }),
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `incident-bundle-${Date.now()}.zip`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                showNotification('success', 'Evidence bundle downloaded successfully!');
            } else {
                throw new Error('Export failed');
            }
        } catch (error) {
            showNotification('error', `Export failed: ${error}`);
        } finally {
            setExportingZip(false);
        }
    };

    return (
        <div className={styles.forensics}>
            {/* Notification */}
            {notification && (
                <div className={`${styles.notification} ${styles[notification.type]}`}>
                    {notification.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
                    {notification.message}
                </div>
            )}

            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <h1><FileSearch size={28} /> Automated Forensics & Evidence Pack</h1>
                    <p>Collect, analyze, and export forensic evidence for incident response</p>
                </div>
                <div className={styles.headerActions}>
                    <button
                        className={styles.exportBtn}
                        onClick={handleExportPdf}
                        disabled={exportingPdf}
                    >
                        {exportingPdf ? <Loader2 size={16} className={styles.spinner} /> : <Download size={16} />}
                        {exportingPdf ? 'Generating...' : 'Export PDF Report'}
                    </button>
                    <button
                        className={styles.exportBtn}
                        onClick={handleExportZip}
                        disabled={exportingZip}
                    >
                        {exportingZip ? <Loader2 size={16} className={styles.spinner} /> : <Download size={16} />}
                        {exportingZip ? 'Bundling...' : 'Export ZIP Bundle'}
                    </button>
                </div>
            </div>

            <div className={styles.mainGrid}>
                <div className={styles.timelineSection}>
                    <h2><Clock size={20} /> Attack Timeline</h2>
                    <div className={styles.timeline}>
                        {timeline.map((item, idx) => (
                            <div key={idx} className={`${styles.timelineItem} ${styles[item.type]}`}>
                                <div className={styles.timelineDot} />
                                <div className={styles.timelineContent}>
                                    <span className={styles.timelineTime}>{item.time}</span>
                                    <p className={styles.timelineEvent}>{item.event}</p>
                                    <span className={styles.timelineSource}>Source: {item.source}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className={styles.evidenceSection}>
                    <h2><FileText size={20} /> Collected Evidence</h2>
                    <div className={styles.evidenceList}>
                        {evidence.map((item, idx) => (
                            <div key={idx} className={`${styles.evidenceItem} ${item.collected ? styles.collected : ''}`}>
                                <div className={styles.evidenceInfo}>
                                    <span className={styles.evidenceName}>{item.name}</span>
                                    <span className={styles.evidenceType}>{item.type}</span>
                                </div>
                                <div className={styles.evidenceMeta}>
                                    <span className={styles.evidenceHash}><Hash size={12} /> {item.hash.substring(0, 16)}...</span>
                                    <span className={styles.evidenceSize}>{item.size}</span>
                                </div>
                                <span className={`${styles.collectedBadge} ${item.collected ? styles.yes : styles.no}`}>
                                    {item.collected ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
                                    {item.collected ? 'Collected' : 'Pending'}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className={styles.reportPreview}>
                <h2><Shield size={20} /> AI-Generated Incident Summary (CERT-In Style)</h2>
                <div className={styles.reportContent}>
                    <h3>Incident Report: Unauthorized Access & Web Shell Deployment</h3>
                    <p><strong>Date:</strong> {reportData.date}</p>
                    <p><strong>Severity:</strong> <span className={styles.severityHigh}>High (Active Intrusion)</span></p>
                    <p><strong>Summary:</strong> {reportData.summary}</p>
                    <p><strong>Recommended Actions:</strong></p>
                    <ul>
                        {recommendations.map((rec, idx) => (
                            <li key={idx}>{rec}</li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}
