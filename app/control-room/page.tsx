'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import {
    Activity,
    Terminal,
    Globe,
    Clock,
    AlertOctagon,
    Users,
    FileCode,
    Network,
    Eye,
    Lock,
    Power,
    RefreshCw,
    Filter,
    Download,
} from 'lucide-react';
import styles from './page.module.css';

// Dynamic import for D3 graph (client-side only)
const NetworkGraph = dynamic(() => import('./NetworkGraph'), {
    ssr: false,
    loading: () => <div className={styles.graphLoading}>Loading graph...</div>
});

export default function ControlRoom() {
    const [activeTab, setActiveTab] = useState<'sessions' | 'processes' | 'files' | 'connections'>('sessions');
    const [isLive, setIsLive] = useState(true);
    const [lastUpdate, setLastUpdate] = useState(new Date());

    // Live Data States
    const [sessions, setSessions] = useState<any[]>([]);
    const [processes, setProcesses] = useState<any[]>([]);
    const [connections, setConnections] = useState<any[]>([]);
    const [fileChanges, setFileChanges] = useState<any[]>([]);

    const [viewModalContent, setViewModalContent] = useState<string | null>(null);
    const [showViewModal, setShowViewModal] = useState(false);

    const handleKillProcess = async (pid: number) => {
        if (!confirm(`Are you sure you want to kill process ${pid}?`)) return;

        try {
            await fetch('/api/system', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'killProcess', pid }),
            });
            setProcesses(prev => prev.filter(p => p.pid !== pid));
        } catch (e) {
            alert('Failed to terminate process');
        }
    };

    const handleViewProcess = async (pid: number) => {
        try {
            const res = await fetch('/api/system', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'getProcessDetails', pid }),
            });
            const data = await res.json();
            if (data.success) {
                let content = data.data;
                try {
                    const jsonObj = JSON.parse(content);
                    content = JSON.stringify(jsonObj, null, 2);
                } catch { }
                setViewModalContent(content);
                setShowViewModal(true);
            } else {
                alert('Could not fetch process details');
            }
        } catch (e) {
            console.error(e);
        }
    };

    const fetchData = async () => {
        try {
            const res = await fetch('/api/system', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'startMonitor' }),
            });
            const data = await res.json();
            if (data.success && data.data) {
                setSessions(data.data.sessions || []);
                setProcesses(data.data.processes || []);
                setConnections(data.data.connections || []);

            }

            // Fetch file changes
            const fileRes = await fetch('/api/system', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'getFileChanges' }),
            });
            const fileData = await fileRes.json();
            if (fileData.success) {
                const formattedFiles = Array.isArray(fileData.data) ? fileData.data.map((f: any, i: number) => ({
                    path: typeof f === 'string' ? f : f.FullName,
                    action: 'modified',
                    time: typeof f === 'string' ? new Date().toLocaleTimeString() : new Date(f.LastWriteTime).toLocaleTimeString(),
                    size: 'N/A'
                })) : [];
                setFileChanges(formattedFiles);
            }

            setLastUpdate(new Date());
        } catch (e) {
            console.error("Monitoring fetch error", e);
        }
    };

    useEffect(() => {
        if (isLive) {
            fetchData(); // Initial fetch
            const interval = setInterval(fetchData, 4000);
            return () => clearInterval(interval);
        }
    }, [isLive]);

    return (
        <div className={styles.controlRoom}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <h1><Activity size={28} /> Live Intrusion Control Room</h1>
                    <p>Real-time monitoring of active sessions, processes, and network activity</p>
                </div>
                <div className={styles.headerActions}>
                    <div className={styles.liveIndicator}>
                        <span className={`${styles.liveDot} ${isLive ? styles.active : ''}`} />
                        <span>{isLive ? 'LIVE' : 'PAUSED'}</span>
                    </div>
                    <button onClick={() => setIsLive(!isLive)} className={styles.actionBtn}>
                        {isLive ? <Power size={16} /> : <RefreshCw size={16} />}
                        {isLive ? 'Pause' : 'Resume'}
                    </button>
                    <button className={styles.actionBtn}>
                        <Download size={16} /> Export
                    </button>
                </div>
            </div>

            {/* Network Activity Graph */}
            <div className={styles.networkMap}>
                <div className={styles.mapHeader}>
                    <h3><Network size={18} /> Network Activity Map</h3>
                    <div className={styles.mapLegend}>
                        <div className={styles.legendItem}>
                            <div className={styles.legendDot} style={{ background: '#88c0d0' }} />
                            <span>This Device</span>
                        </div>
                        <div className={styles.legendItem}>
                            <div className={styles.legendDot} style={{ background: '#a3be8c' }} />
                            <span>Process</span>
                        </div>
                        <div className={styles.legendItem}>
                            <div className={styles.legendDot} style={{ background: '#ebcb8b' }} />
                            <span>Remote Server</span>
                        </div>
                    </div>
                </div>

                {/* D3 Force-Directed Network Graph */}
                <NetworkGraph connections={connections} />

                <div className={styles.graphStats}>
                    <span><strong>{processes.length}</strong> processes</span>
                    <span>•</span>
                    <span><strong>{connections.length}</strong> connections</span>
                    <span>•</span>
                    <span><strong>{[...new Set(connections.map((c: any) => c.remoteIp))].length}</strong> remote servers</span>
                </div>
            </div>

            {/* Tabs */}
            <div className={styles.tabs}>
                <button
                    className={`${styles.tab} ${activeTab === 'sessions' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('sessions')}
                >
                    <Terminal size={16} /> Active Sessions
                    <span className={styles.tabBadge}>{sessions.length}</span>
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'processes' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('processes')}
                >
                    <Activity size={16} /> Processes
                    <span className={styles.tabBadge}>{processes.length}</span>
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'files' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('files')}
                >
                    <FileCode size={16} /> File Changes
                    <span className={styles.tabBadge}>{fileChanges.length}</span>
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'connections' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('connections')}
                >
                    <Network size={16} /> Connections
                    <span className={styles.tabBadge}>{connections.length}</span>
                </button>
                <div className={styles.tabSpacer} />
                <span className={styles.lastUpdate}>
                    <Clock size={14} /> Last update: {lastUpdate.toLocaleTimeString()}
                </span>
            </div>

            {/* Content Area */}
            <div className={styles.contentArea}>
                {/* Sessions Tab */}
                {activeTab === 'sessions' && (
                    <div className={styles.tableContainer}>
                        <table className={styles.dataTable}>
                            <thead>
                                <tr>
                                    <th>Type</th>
                                    <th>User</th>
                                    <th>Source IP</th>
                                    <th>Target</th>
                                    <th>Duration</th>
                                    <th>Commands</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sessions.map((session, idx) => (
                                    <tr key={session.id || idx} className={styles[session.status]}>
                                        <td>
                                            <span className={styles.typeBadge}>{session.type}</span>
                                        </td>
                                        <td className={styles.mono}>{session.user}</td>
                                        <td className={styles.mono}>{session.source}</td>
                                        <td className={styles.mono}>{session.destination}</td>
                                        <td>{session.duration}</td>
                                        <td>{session.commands}</td>
                                        <td>
                                            <span className={`${styles.statusBadge} ${styles[session.status]}`}>
                                                {session.status}
                                            </span>
                                        </td>
                                        <td className={styles.actions}>
                                            <button title="Monitor"><Eye size={14} /></button>
                                            <button title="Terminate"><Power size={14} /></button>
                                            <button title="Lock Account"><Lock size={14} /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Processes Tab */}
                {activeTab === 'processes' && (
                    <div className={styles.tableContainer}>
                        <table className={styles.dataTable}>
                            <thead>
                                <tr>
                                    <th>PID</th>
                                    <th>Process Name</th>
                                    <th>User</th>
                                    <th>CPU %</th>
                                    <th>Memory</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {processes.map((proc, idx) => (
                                    <tr key={proc.pid || idx} className={styles[proc.status]}>
                                        <td className={styles.mono}>{proc.pid}</td>
                                        <td className={styles.mono}>{proc.name}</td>
                                        <td>{proc.user}</td>
                                        <td>
                                            <div className={styles.cpuBar}>
                                                <div
                                                    className={`${styles.cpuProgress} ${proc.cpu > 50 ? styles.high : ''}`}
                                                    style={{ width: `${proc.cpu}%` }}
                                                />
                                                <span>{proc.cpu}%</span>
                                            </div>
                                        </td>
                                        <td>{proc.memory} MB</td>
                                        <td>
                                            <span className={`${styles.statusBadge} ${styles[proc.status]}`}>
                                                {proc.status}
                                            </span>
                                        </td>
                                        <td className={styles.actions}>
                                            <button
                                                title="View Details"
                                                onClick={() => handleViewProcess(proc.pid)}
                                                className={styles.actionBtnIcon}
                                            >
                                                <Eye size={14} />
                                            </button>
                                            <button
                                                title="Kill Process"
                                                onClick={() => handleKillProcess(proc.pid)}
                                                className={styles.actionBtnIcon}
                                                style={{ color: '#bf616a' }}
                                            >
                                                <Power size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* File Changes Tab */}
                {activeTab === 'files' && (
                    <div className={styles.tableContainer}>
                        <table className={styles.dataTable}>
                            <thead>
                                <tr>
                                    <th>File Path</th>
                                    <th>Action</th>
                                    <th>Time</th>
                                    <th>Size</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {fileChanges.map((file, idx) => (
                                    <tr key={idx} className={file.action === 'created' ? styles.suspicious : ''}>
                                        <td className={styles.mono}>{file.path}</td>
                                        <td>
                                            <span className={`${styles.actionBadge} ${styles[file.action]}`}>
                                                {file.action}
                                            </span>
                                        </td>
                                        <td>{file.time}</td>
                                        <td>{file.size}</td>
                                        <td className={styles.actions}>
                                            <button title="View Contents"><Eye size={14} /></button>
                                            <button title="Quarantine"><Lock size={14} /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Connections Tab */}
                {activeTab === 'connections' && (
                    <div className={styles.tableContainer}>
                        <table className={styles.dataTable}>
                            <thead>
                                <tr>
                                    <th>Source</th>
                                    <th>Destination</th>
                                    <th>Protocol</th>
                                    <th>Data Transferred</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {connections.map((conn, idx) => (
                                    <tr key={idx} className={conn.status === 'active' ? styles.suspicious : ''}>
                                        <td className={styles.mono}>{conn.source}</td>
                                        <td className={styles.mono}>{conn.destination}</td>
                                        <td>
                                            <span className={styles.protocolBadge}>{conn.protocol}</span>
                                        </td>
                                        <td>{conn.bytes}</td>
                                        <td>
                                            <span className={`${styles.statusBadge} ${styles[conn.status]}`}>
                                                {conn.status}
                                            </span>
                                        </td>
                                        <td className={styles.actions}>
                                            <button title="Capture Traffic"><Eye size={14} /></button>
                                            <button title="Block"><Lock size={14} /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Process Detail Modal */}
            {showViewModal && (
                <div className={styles.modalOverlay} onClick={() => setShowViewModal(false)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h3>Process Details</h3>
                            <button onClick={() => setShowViewModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff' }}>✕</button>
                        </div>
                        <div className={styles.modalContent}>
                            <pre style={{
                                background: '#1e222a',
                                padding: '1rem',
                                borderRadius: '6px',
                                overflow: 'auto',
                                maxHeight: '400px',
                                fontSize: '0.85rem',
                                color: '#a0a8b7',
                                fontFamily: 'monospace'
                            }}>
                                {viewModalContent}
                            </pre>
                        </div>
                    </div>
                </div>
            )}

            {/* AI Analysis Panel */}
            <div className={styles.aiPanel}>
                <div className={styles.aiHeader}>
                    <AlertOctagon size={18} />
                    <span>AI Threat Analysis</span>
                </div>
                <div className={styles.aiContent}>
                    <p>
                        <strong>Detected Threat Pattern:</strong> The current activity suggests an active intrusion
                        with characteristics matching <span className={styles.highlight}>eCrime actors using
                            standard post-exploitation techniques</span>.
                    </p>
                    <p>
                        <strong>Attacker Behavior:</strong> PowerShell execution, web shell deployment, and
                        suspicious outbound connections indicate lateral movement and potential data exfiltration.
                    </p>
                    <p>
                        <strong>Recommended Actions:</strong>
                    </p>
                    <ul>
                        <li>Terminate suspicious sessions immediately (SSH from 45.33.32.156)</li>
                        <li>Kill malicious processes (nc.exe, mimikatz.exe)</li>
                        <li>Block outbound connections to 45.33.32.156:4444</li>
                        <li>Isolate affected servers from the network</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
