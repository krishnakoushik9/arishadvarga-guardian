'use client';

import React, { useState, useEffect } from 'react';
import { Bug, Plus, Eye, Trash2, Copy, AlertTriangle, CheckCircle, Clock, FileText, Key, Globe, Wifi } from 'lucide-react';
import styles from './page.module.css';

interface Trap {
    id: string;
    name: string;
    type: 'web' | 'ssh' | 'database';
    port: string;
    status: 'active' | 'inactive' | 'error';
    pid?: number;
    startTime?: string;
    hits?: number; // Fetched from logs
}

export default function Deception() {
    const [activeTab, setActiveTab] = useState<'honeypots' | 'canaries' | 'activity'>('honeypots');
    const [traps, setTraps] = useState<Trap[]>([]);
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [newTrap, setNewTrap] = useState({ name: '', type: 'web', port: '8080' });

    // Fetch Traps
    const fetchTraps = async () => {
        try {
            const res = await fetch('/api/deception');
            const data = await res.json();
            if (data.success) {
                setTraps(data.data);
            }
        } catch (e) {
            console.error(e);
        }
    };

    // Fetch Logs
    const fetchLogs = async () => {
        try {
            const res = await fetch('/api/deception', {
                method: 'POST',
                body: JSON.stringify({ action: 'logs' })
            });
            const data = await res.json();
            if (data.success) {
                setLogs(data.logs);
            }
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        fetchTraps();
        fetchLogs();
        const interval = setInterval(() => {
            fetchTraps();
            fetchLogs();
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleCreateTrap = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch('/api/deception', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'create',
                    name: newTrap.name,
                    type: newTrap.type,
                    port: parseInt(newTrap.port)
                })
            });
            const data = await res.json();
            if (data.success) {
                setShowModal(false);
                fetchTraps();
                setNewTrap({ name: '', type: 'web', port: '8080' });
            } else {
                alert('Failed to create trap: ' + data.error);
            }
        } catch (e) {
            alert('Error creating trap');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteTrap = async (id: string) => {
        if (!confirm('Are you sure you want to delete this trap?')) return;
        try {
            const res = await fetch('/api/deception', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'delete', id })
            });
            if (res.ok) fetchTraps();
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className={styles.deception}>
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <h1><Bug size={28} /> Deception & Trap System</h1>
                    <p>Deploy passive deception techniques to observe and delay attackers</p>
                </div>
                <button className={styles.createBtn} onClick={() => setShowModal(true)}>
                    <Plus size={18} /> Create New Trap
                </button>
            </div>

            <div className={styles.tabs}>
                <button className={`${styles.tab} ${activeTab === 'honeypots' ? styles.active : ''}`} onClick={() => setActiveTab('honeypots')}>
                    <Globe size={16} /> Honeypots <span className={styles.badge}>{traps.length}</span>
                </button>
                <button className={`${styles.tab} ${activeTab === 'canaries' ? styles.active : ''}`} onClick={() => setActiveTab('canaries')}>
                    <FileText size={16} /> Canary Tokens <span className={styles.badge}>0</span>
                </button>
                <button className={`${styles.tab} ${activeTab === 'activity' ? styles.active : ''}`} onClick={() => setActiveTab('activity')}>
                    <Clock size={16} /> Trap Activity <span className={styles.badge}>{logs.length}</span>
                </button>
            </div>

            <div className={styles.content}>
                {activeTab === 'honeypots' && (
                    <div className={styles.grid}>
                        {traps.map((hp) => (
                            <div key={hp.id} className={`${styles.card} ${styles[hp.status]}`}>
                                <div className={styles.cardHeader}>
                                    <h3>{hp.name}</h3>
                                    <span className={`${styles.statusBadge} ${styles[hp.status]}`}>{hp.status}</span>
                                </div>
                                <div className={styles.cardBody}>
                                    <div className={styles.cardRow}><span>Type:</span><span>{hp.type.toUpperCase()}</span></div>
                                    <div className={styles.cardRow}><span>Port:</span><code>{hp.port}</code></div>
                                    <div className={styles.cardRow}><span>PID:</span><span>{hp.pid}</span></div>
                                    <div className={styles.cardRow}><span>Started:</span><span>{hp.startTime ? new Date(hp.startTime).toLocaleTimeString() : '-'}</span></div>
                                </div>
                                <div className={styles.cardActions}>
                                    <button onClick={() => setActiveTab('activity')}><Eye size={14} /> View Logs</button>
                                    <button onClick={() => handleDeleteTrap(hp.id)}><Trash2 size={14} /></button>
                                </div>
                            </div>
                        ))}
                        {traps.length === 0 && (
                            <div style={{ color: '#888', gridColumn: '1/-1', textAlign: 'center', padding: '2rem' }}>
                                No active traps. Click "Create New Trap" to deploy one.
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'canaries' && (
                    <div className={styles.grid}>
                        <div style={{ color: '#888', gridColumn: '1/-1', textAlign: 'center', padding: '2rem' }}>
                            Canary token management coming soon...
                        </div>
                    </div>
                )}

                {activeTab === 'activity' && (
                    <div className={styles.activityList}>
                        {logs.map((item, idx) => (
                            <div key={idx} className={`${styles.activityItem} ${styles.high}`}>
                                <span className={styles.activityTime}>
                                    {new Date(item.timestamp).toLocaleTimeString()}
                                </span>
                                <span className={styles.activityAction}>
                                    {item.type} - {item.trapName}
                                    {item.username && ` (User: ${item.username})`}
                                    {item.path && ` (Path: ${item.path})`}
                                    {item.command && ` (Cmd: ${item.command})`}
                                </span>
                                {item.ip && <code className={styles.activityIP}>{item.ip || item.sourceIp}</code>}
                                <span className={`${styles.severityBadge} ${styles.medium}`}>LOG</span>
                            </div>
                        ))}
                        {logs.length === 0 && (
                            <div style={{ color: '#888', textAlign: 'center', padding: '1rem' }}>No activity recorded yet.</div>
                        )}
                    </div>
                )}
            </div>

            {/* Create Trap Modal */}
            {showModal && (
                <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2>Deploy New Trap</h2>
                            <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>✕</button>
                        </div>
                        <form onSubmit={handleCreateTrap} className={styles.modalForm}>
                            <div className={styles.formGroup}>
                                <label>Trap Name</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Finance Server Decoy"
                                    value={newTrap.name}
                                    onChange={e => setNewTrap({ ...newTrap, name: e.target.value })}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Trap Type</label>
                                <select
                                    value={newTrap.type}
                                    onChange={e => setNewTrap({ ...newTrap, type: e.target.value })}
                                >
                                    <option value="web">Fake Admin Panel (Web)</option>
                                    <option value="ssh">SSH Pot (SSH)</option>
                                </select>
                            </div>
                            <div className={styles.formGroup}>
                                <label>Port</label>
                                <input
                                    type="number"
                                    required
                                    placeholder="8080"
                                    value={newTrap.port}
                                    onChange={e => setNewTrap({ ...newTrap, port: e.target.value })}
                                />
                            </div>
                            <div className={styles.modalActions}>
                                <button type="button" onClick={() => setShowModal(false)} className={styles.cancelBtn}>Cancel</button>
                                <button type="submit" disabled={loading} className={styles.submitBtn}>
                                    {loading ? 'Deploying...' : 'Deploy Trap'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
