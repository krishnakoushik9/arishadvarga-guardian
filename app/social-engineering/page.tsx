'use client';

import React, { useState } from 'react';
import { Mail, AlertTriangle, Brain, FileText, CheckCircle, XCircle, Upload } from 'lucide-react';
import styles from './page.module.css';

const analyzedEmails = [
    { id: 1, subject: 'Urgent: Password Reset Required', sender: 'support@micros0ft-security.com', aiScore: 92, verdict: 'phishing', reasons: ['Typosquatting domain', 'Urgency language', 'LLM-generated text patterns'] },
    { id: 2, subject: 'Your Invoice #INV-2024-8834', sender: 'billing@legitcompany.com', aiScore: 15, verdict: 'legitimate', reasons: ['Known sender', 'Consistent format', 'Valid SPF/DKIM'] },
    { id: 3, subject: 'IT Department: System Access Update', sender: 'helpdesk@college-it.support', aiScore: 78, verdict: 'suspicious', reasons: ['External domain mimicking internal', 'Generic greeting', 'AI writing patterns detected'] },
];

export default function SocialEngineering() {
    const [emailContent, setEmailContent] = useState('');

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <h1><Mail size={28} /> GenAI Social Engineering Defense</h1>
                <p>Detect AI-generated phishing emails, vishing scripts, and deepfake indicators</p>
            </div>

            <div className={styles.analyzerSection}>
                <h2><Brain size={20} /> Email Analyzer</h2>
                <div className={styles.analyzerContent}>
                    <textarea
                        className={styles.emailInput}
                        placeholder="Paste email content here to analyze for AI-generated phishing patterns..."
                        value={emailContent}
                        onChange={(e) => setEmailContent(e.target.value)}
                    />
                    <button className={styles.analyzeBtn}><Upload size={16} /> Analyze Email</button>
                </div>
            </div>

            <div className={styles.resultsSection}>
                <h2><FileText size={20} /> Recent Analysis Results</h2>
                <div className={styles.resultsList}>
                    {analyzedEmails.map((email) => (
                        <div key={email.id} className={`${styles.resultCard} ${styles[email.verdict]}`}>
                            <div className={styles.resultHeader}>
                                <div className={styles.resultInfo}>
                                    <h3>{email.subject}</h3>
                                    <span className={styles.sender}>From: {email.sender}</span>
                                </div>
                                <div className={styles.resultScore}>
                                    <span className={styles.aiScore}>{email.aiScore}%</span>
                                    <span className={styles.aiLabel}>AI Probability</span>
                                </div>
                            </div>
                            <div className={styles.resultBody}>
                                <span className={`${styles.verdictBadge} ${styles[email.verdict]}`}>
                                    {email.verdict === 'phishing' && <XCircle size={14} />}
                                    {email.verdict === 'legitimate' && <CheckCircle size={14} />}
                                    {email.verdict === 'suspicious' && <AlertTriangle size={14} />}
                                    {email.verdict.replace('_', ' ')}
                                </span>
                                <div className={styles.reasons}>
                                    <strong>Indicators:</strong>
                                    <ul>
                                        {email.reasons.map((reason, idx) => (
                                            <li key={idx}>{reason}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
