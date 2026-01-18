'use client';

import React, { useState } from 'react';
import {
    Shield,
    Lock,
    Unlock,
    Power,
    Network,
    User,
    Server,
    AlertTriangle,
    CheckCircle,
    Clock,
    RotateCcw,
    Play,
} from 'lucide-react';
import styles from './page.module.css';

interface ContainmentAction {
    id: string;
    name: string;
    description: string;
    icon: React.ReactNode;
    status: 'available' | 'active' | 'executed';
    reversible: boolean;
    risk: 'low' | 'medium' | 'high';
}

const containmentActions: ContainmentAction[] = [
    {
        id: 'lock-accounts',
        name: 'Lock Compromised Accounts',
        description: 'Temporarily disable suspected compromised user accounts',
        icon: <Lock size={24} />,
        status: 'available',
        reversible: true,
        risk: 'medium',
    },
    {
        id: 'terminate-sessions',
        name: 'Terminate Active Sessions',
        description: 'Force logout all active sessions for selected users',
        icon: <Power size={24} />,
        status: 'active',
        reversible: true,
        risk: 'low',
    },
    {
        id: 'block-egress',
        name: 'Block Egress Traffic',
        description: 'Add firewall rules to block outbound connections to suspicious IPs',
        icon: <Network size={24} />,
        status: 'available',
        reversible: true,
        risk: 'medium',
    },
    {
        id: 'isolate-server',
        name: 'Isolate Server',
        description: 'Quarantine affected server from the network',
        icon: <Server size={24} />,
        status: 'available',
        reversible: true,
        risk: 'high',
    },
    {
        id: 'maintenance-mode',
        name: 'Enable Maintenance Mode',
        description: 'Put web application into maintenance mode',
        icon: <Shield size={24} />,
        status: 'executed',
        reversible: true,
        risk: 'low',
    },
    {
        id: 'strip-privileges',
        name: 'Strip Admin Privileges',
        description: 'Remove elevated permissions from compromised accounts',
        icon: <User size={24} />,
        status: 'available',
        reversible: true,
        risk: 'medium',
    },
];

const actionLog = [
    { time: '10:32:45', action: 'Maintenance Mode enabled', user: 'admin', status: 'success' },
    { time: '10:31:20', action: 'Session terminated for user root@45.33.32.156', user: 'admin', status: 'success' },
    { time: '10:30:15', action: 'Firewall rule added: BLOCK 45.33.32.156', user: 'system', status: 'success' },
    { time: '10:28:00', action: 'Intrusion detected - Auto-alert triggered', user: 'system', status: 'warning' },
];

export default function Containment() {
    const [actions, setActions] = useState<ContainmentAction[]>(containmentActions);
    const [logs, setLogs] = useState(actionLog);
    const [selectedActionId, setSelectedActionId] = useState<string | null>(null);
    const [showConfirm, setShowConfirm] = useState(false);

    const handleExecute = (actionId: string) => {
        setSelectedActionId(actionId);
        setShowConfirm(true);
    };

    const executeAction = () => {
        if (!selectedActionId) return;

        // 1. Set to In Progress
        setActions(prev => prev.map(a =>
            a.id === selectedActionId ? { ...a, status: 'active' } : a
        ));
        setShowConfirm(false);

        // 2. Simulate Delay then Set to Executed
        setTimeout(() => {
            setActions(prev => prev.map(a =>
                a.id === selectedActionId ? { ...a, status: 'executed' } : a
            ));

            const actionName = actions.find(a => a.id === selectedActionId)?.name;
            const newLog = {
                time: new Date().toLocaleTimeString(),
                action: `${actionName} executed`,
                user: 'admin',
                status: 'success'
            };
            setLogs(prev => [newLog, ...prev]);
            setSelectedActionId(null);
        }, 2000);
    };

    const revertAction = (actionId: string) => {
        setActions(prev => prev.map(a =>
            a.id === actionId ? { ...a, status: 'available' } : a
        ));
        const actionName = actions.find(a => a.id === actionId)?.name;
        const newLog = {
            time: new Date().toLocaleTimeString(),
            action: `${actionName} reverted`,
            user: 'admin',
            status: 'success'
        };
        setLogs(prev => [newLog, ...prev]);
    };

    return (
        <div className={styles.containment}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <h1><Shield size={28} /> Automated Containment</h1>
                    <p>Execute reversible defensive actions to contain the threat</p>
                </div>
                <div className={styles.headerStats}>
                    <div className={styles.stat}>
                        <span className={styles.statValue}>{actions.filter(a => a.status === 'available').length}</span>
                        <span className={styles.statLabel}>Actions Available</span>
                    </div>
                    <div className={styles.stat}>
                        <span className={styles.statValue}>{actions.filter(a => a.status === 'active').length}</span>
                        <span className={styles.statLabel}>In Progress</span>
                    </div>
                    <div className={styles.stat}>
                        <span className={styles.statValue}>{actions.filter(a => a.status === 'executed').length}</span>
                        <span className={styles.statLabel}>Executed</span>
                    </div>
                </div>
            </div>

            {/* Warning Banner */}
            <div className={styles.warningBanner}>
                <AlertTriangle size={20} />
                <span>
                    <strong>Important:</strong> All containment actions are logged and reversible.
                    Admin approval required before execution.
                </span>
            </div>

            {/* Actions Grid */}
            <div className={styles.actionsGrid}>
                {actions.map((action) => (
                    <div
                        key={action.id}
                        className={`${styles.actionCard} ${styles[action.status]} ${styles[action.risk + 'Risk']}`}
                    >
                        <div className={styles.actionIcon}>{action.icon}</div>
                        <div className={styles.actionInfo}>
                            <h3>{action.name}</h3>
                            <p>{action.description}</p>
                            <div className={styles.actionMeta}>
                                <span className={`${styles.riskBadge} ${styles[action.risk]}`}>
                                    {action.risk} risk
                                </span>
                                {action.reversible && (
                                    <span className={styles.reversibleBadge}>
                                        <RotateCcw size={12} /> Reversible
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className={styles.actionButtons}>
                            {action.status === 'available' && (
                                <button
                                    className={styles.executeBtn}
                                    onClick={() => handleExecute(action.id)}
                                >
                                    <Play size={16} /> Execute
                                </button>
                            )}
                            {action.status === 'active' && (
                                <span className={styles.activeBadge}>
                                    <Clock size={14} className={styles.spin} /> In Progress
                                </span>
                            )}
                            {action.status === 'executed' && (
                                <>
                                    <span className={styles.executedBadge}>
                                        <CheckCircle size={14} /> Executed
                                    </span>
                                    {action.reversible && (
                                        <button className={styles.revertBtn} onClick={() => revertAction(action.id)}>
                                            <RotateCcw size={14} /> Revert
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Action Log */}
            <div className={styles.logSection}>
                <h2><Clock size={20} /> Action Log</h2>
                <div className={styles.logList}>
                    {logs.map((log, idx) => (
                        <div key={idx} className={`${styles.logItem} ${styles[log.status]}`}>
                            <span className={styles.logTime}>{log.time}</span>
                            <span className={styles.logAction}>{log.action}</span>
                            <span className={styles.logUser}>{log.user}</span>
                            <span className={`${styles.logStatus} ${styles[log.status]}`}>
                                {log.status === 'success' ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Confirmation Modal */}
            {showConfirm && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <div className={styles.modalHeader}>
                            <AlertTriangle size={24} />
                            <h3>Confirm Action</h3>
                        </div>
                        <div className={styles.modalContent}>
                            <p>
                                You are about to execute: <strong>
                                    {actions.find(a => a.id === selectedActionId)?.name}
                                </strong>
                            </p>
                            <p className={styles.modalWarning}>
                                This action will be logged and can be reverted if needed.
                            </p>
                        </div>
                        <div className={styles.modalActions}>
                            <button className={styles.cancelBtn} onClick={() => setShowConfirm(false)}>
                                Cancel
                            </button>
                            <button className={styles.confirmBtn} onClick={executeAction}>
                                <Shield size={16} /> Execute Action
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
