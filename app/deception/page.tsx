'use client';

import React, { useState } from 'react';
import { Bug, Plus, Eye, Trash2, Copy, AlertTriangle, CheckCircle, Clock, FileText, Key, Globe } from 'lucide-react';
import styles from './page.module.css';

const honeypots = [
    { id: 1, name: 'Fake Admin Panel', type: 'Web Panel', url: '/admin-backup/', status: 'active', hits: 12, lastHit: '5 min ago' },
    { id: 2, name: 'SSH Honeypot', type: 'Service', url: 'Port 2222', status: 'active', hits: 45, lastHit: '2 min ago' },
    { id: 3, name: 'Database Decoy', type: 'Database', url: 'Port 3307', status: 'inactive', hits: 0, lastHit: 'Never' },
];

const canaryTokens = [
    { id: 1, name: 'credentials.xlsx', type: 'Document', triggered: true, triggerTime: '10:28:45', triggerIP: '45.33.32.156' },
    { id: 2, name: 'backup_passwords.txt', type: 'Text File', triggered: true, triggerTime: '10:25:12', triggerIP: '45.33.32.156' },
    { id: 3, name: 'AWS_SECRET_KEY', type: 'API Key', triggered: false, triggerTime: null, triggerIP: null },
    { id: 4, name: 'admin_config.json', type: 'Config File', triggered: false, triggerTime: null, triggerIP: null },
];

const trapActivity = [
    { time: '10:28:45', action: 'Canary triggered: credentials.xlsx opened', ip: '45.33.32.156', severity: 'high' },
    { time: '10:27:30', action: 'Honeypot login attempt: admin/password123', ip: '45.33.32.156', severity: 'medium' },
    { time: '10:25:12', action: 'Canary triggered: backup_passwords.txt accessed', ip: '45.33.32.156', severity: 'high' },
    { time: '10:24:00', action: 'SSH honeypot connection from external IP', ip: '103.224.182.251', severity: 'medium' },
];

export default function Deception() {
    const [activeTab, setActiveTab] = useState<'honeypots' | 'canaries' | 'activity'>('honeypots');

    return (
        <div className={styles.deception}>
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <h1><Bug size={28} /> Deception & Trap System</h1>
                    <p>Deploy passive deception techniques to observe and delay attackers</p>
                </div>
                <button className={styles.createBtn}><Plus size={18} /> Create New Trap</button>
            </div>

            <div className={styles.tabs}>
                <button className={`${styles.tab} ${activeTab === 'honeypots' ? styles.active : ''}`} onClick={() => setActiveTab('honeypots')}>
                    <Globe size={16} /> Honeypots <span className={styles.badge}>{honeypots.length}</span>
                </button>
                <button className={`${styles.tab} ${activeTab === 'canaries' ? styles.active : ''}`} onClick={() => setActiveTab('canaries')}>
                    <FileText size={16} /> Canary Tokens <span className={styles.badge}>{canaryTokens.length}</span>
                </button>
                <button className={`${styles.tab} ${activeTab === 'activity' ? styles.active : ''}`} onClick={() => setActiveTab('activity')}>
                    <Clock size={16} /> Trap Activity <span className={styles.badge}>{trapActivity.length}</span>
                </button>
            </div>

            <div className={styles.content}>
                {activeTab === 'honeypots' && (
                    <div className={styles.grid}>
                        {honeypots.map((hp) => (
                            <div key={hp.id} className={`${styles.card} ${styles[hp.status]}`}>
                                <div className={styles.cardHeader}>
                                    <h3>{hp.name}</h3>
                                    <span className={`${styles.statusBadge} ${styles[hp.status]}`}>{hp.status}</span>
                                </div>
                                <div className={styles.cardBody}>
                                    <div className={styles.cardRow}><span>Type:</span><span>{hp.type}</span></div>
                                    <div className={styles.cardRow}><span>Endpoint:</span><code>{hp.url}</code></div>
                                    <div className={styles.cardRow}><span>Total Hits:</span><span className={styles.hits}>{hp.hits}</span></div>
                                    <div className={styles.cardRow}><span>Last Hit:</span><span>{hp.lastHit}</span></div>
                                </div>
                                <div className={styles.cardActions}>
                                    <button><Eye size={14} /> View Logs</button>
                                    <button><Trash2 size={14} /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'canaries' && (
                    <div className={styles.grid}>
                        {canaryTokens.map((token) => (
                            <div key={token.id} className={`${styles.card} ${token.triggered ? styles.triggered : ''}`}>
                                <div className={styles.cardHeader}>
                                    <h3>{token.name}</h3>
                                    {token.triggered ? (
                                        <span className={`${styles.statusBadge} ${styles.triggered}`}><AlertTriangle size={12} /> Triggered</span>
                                    ) : (
                                        <span className={`${styles.statusBadge} ${styles.waiting}`}><Clock size={12} /> Waiting</span>
                                    )}
                                </div>
                                <div className={styles.cardBody}>
                                    <div className={styles.cardRow}><span>Type:</span><span>{token.type}</span></div>
                                    {token.triggered && (
                                        <>
                                            <div className={styles.cardRow}><span>Trigger Time:</span><span>{token.triggerTime}</span></div>
                                            <div className={styles.cardRow}><span>Trigger IP:</span><code>{token.triggerIP}</code></div>
                                        </>
                                    )}
                                </div>
                                <div className={styles.cardActions}>
                                    <button><Copy size={14} /> Copy Path</button>
                                    <button><Trash2 size={14} /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'activity' && (
                    <div className={styles.activityList}>
                        {trapActivity.map((item, idx) => (
                            <div key={idx} className={`${styles.activityItem} ${styles[item.severity]}`}>
                                <span className={styles.activityTime}>{item.time}</span>
                                <span className={styles.activityAction}>{item.action}</span>
                                <code className={styles.activityIP}>{item.ip}</code>
                                <span className={`${styles.severityBadge} ${styles[item.severity]}`}>{item.severity}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
