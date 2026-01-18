'use client';

import React, { useEffect, useState } from 'react';
import {
  Shield,
  AlertTriangle,
  Activity,
  Server,
  Globe,
  Users,
  FileWarning,
  Cpu,
  Network,
  Lock,
  Unlock,
  TrendingUp,
  Clock,
  Eye,
  Terminal,
  Play,
} from 'lucide-react';
import { useSystem } from '@/contexts/SystemContext';
import styles from './page.module.css';

// Mock data for the dashboard (fallback)
const mockThreatStats = {
  activeThreats: 3,
  blockedAttacks: 147,
  suspiciousSessions: 5,
  compromisedAccounts: 1,
};

const mockRecentAlerts = [
  {
    id: 1,
    type: 'critical',
    message: 'Suspicious PowerShell execution detected',
    source: '192.168.1.105',
    time: '2 min ago',
  },
  {
    id: 2,
    type: 'warning',
    message: 'Multiple failed SSH login attempts',
    source: '45.33.32.156',
    time: '5 min ago',
  },
];

const mockActiveSessions = [
  { user: 'admin', ip: '192.168.1.10', type: 'RDP', status: 'trusted', duration: '2h 15m' },
];

// ... (imports remain)

export default function Dashboard() {
  const { systemInfo, isMonitoring, openTerminal } = useSystem();
  const [terminalOpened, setTerminalOpened] = useState(false);

  // Use real data if available, otherwise mock (for stats we use mock for now as we don't have a backend for threats yet)
  const threatStats = mockThreatStats;

  // Real data for Alerts
  const recentAlerts = (systemInfo?.recentAlerts && systemInfo.recentAlerts.length > 0)
    ? systemInfo.recentAlerts
    : mockRecentAlerts;

  // Real data for Sessions
  const activeSessions = (systemInfo?.sessions && systemInfo.sessions.length > 0)
    ? systemInfo.sessions
    : mockActiveSessions;

  // Calculate system health from real data
  const systemHealth = systemInfo ? [
    {
      name: 'CPU Usage',
      value: Math.round(systemInfo.cpuUsage?.[0] * 10) || 45,
      status: (systemInfo.cpuUsage?.[0] || 0) > 0.8 ? 'warning' : 'normal'
    },
    {
      name: 'Memory',
      value: systemInfo.memoryUsage ? Math.round((systemInfo.memoryUsage.used / systemInfo.memoryUsage.total) * 100) : 72,
      status: 'normal'
    },
    { name: 'Disk I/O', value: 23, status: 'normal' },
    { name: 'Network', value: 89, status: 'warning' },
  ] : [
    { name: 'CPU Usage', value: 45, status: 'normal' },
    { name: 'Memory', value: 72, status: 'normal' },
    { name: 'Disk I/O', value: 23, status: 'normal' },
    { name: 'Network', value: 89, status: 'warning' },
  ];

  // Open terminal on first load for monitoring
  const handleOpenTerminal = async () => {
    const startupCommand = systemInfo?.os === 'windows'
      ? 'Write-Host "Arishadvarga-Guardian Security Monitor" -ForegroundColor Cyan; Get-Process | Sort-Object CPU -Descending | Select-Object -First 10 Name,CPU,WorkingSet'
      : 'echo "🛡️ Arishadvarga-Guardian Security Monitor"; echo ""; echo "=== Top Processes by CPU ===" && ps aux --sort=-%cpu | head -10; echo ""; echo "=== Active Network Connections ===" && ss -tunapl 2>/dev/null | head -10 || netstat -tunapl 2>/dev/null | head -10';

    const success = await openTerminal(startupCommand);
    if (success) {
      setTerminalOpened(true);
    }
  };

  return (
    <div className={styles.dashboard}>
      {/* ... (Header remains) */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1>Cyber Defense Command Center</h1>
          <p>Real-time threat monitoring and incident response</p>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.systemStatus}>
            <span className={`${styles.statusDot} ${isMonitoring ? styles.active : ''}`} />
            <span>{systemInfo?.os?.toUpperCase() || 'System'} - {systemInfo?.hostname || 'Monitoring'}</span>
          </div>
          {!terminalOpened && (
            <button className={styles.terminalBtn} onClick={handleOpenTerminal}>
              <Terminal size={18} />
              <span>Open Security Terminal</span>
            </button>
          )}
          <button className={styles.emergencyBtn}>
            <AlertTriangle size={18} />
            <span>🚨 ACTIVE INTRUSION DETECTED</span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className={styles.statsGrid}>
        <div className={`${styles.statCard} ${styles.critical}`}>
          <div className={styles.statIcon}>
            <AlertTriangle size={24} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{threatStats.activeThreats}</span>
            <span className={styles.statLabel}>Active Threats</span>
          </div>
        </div>
        <div className={`${styles.statCard} ${styles.success}`}>
          <div className={styles.statIcon}>
            <Shield size={24} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{threatStats.blockedAttacks}</span>
            <span className={styles.statLabel}>Blocked Today</span>
          </div>
        </div>
        <div className={`${styles.statCard} ${styles.warning}`}>
          <div className={styles.statIcon}>
            <Eye size={24} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{threatStats.suspiciousSessions}</span>
            <span className={styles.statLabel}>Suspicious Sessions</span>
          </div>
        </div>
        <div className={`${styles.statCard} ${styles.danger}`}>
          <div className={styles.statIcon}>
            <Unlock size={24} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{threatStats.compromisedAccounts}</span>
            <span className={styles.statLabel}>Compromised Accounts</span>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className={styles.mainGrid}>
        {/* Recent Alerts */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3><Activity size={18} /> Recent Alerts</h3>
            <button className={styles.viewAllBtn}>View All</button>
          </div>
          <div className={styles.alertsList}>
            {recentAlerts.map((alert: any) => (
              <div key={alert.id} className={`${styles.alertItem} ${styles[alert.type]}`}>
                <div className={styles.alertDot} />
                <div className={styles.alertContent}>
                  <span className={styles.alertMessage}>{alert.message}</span>
                  <div className={styles.alertMeta}>
                    <span><Globe size={12} /> {alert.source}</span>
                    <span><Clock size={12} /> {alert.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active Sessions */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3><Users size={18} /> Active Sessions</h3>
            <span className={styles.badge}>{activeSessions.length} Active</span>
          </div>
          <div className={styles.sessionsList}>
            {activeSessions.map((session: any, idx: number) => (
              <div key={idx} className={styles.sessionItem}>
                <div className={styles.sessionUser}>
                  <div className={`${styles.sessionAvatar} ${styles[session.status] || ''}`}>
                    {session.user.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <span className={styles.sessionName}>{session.user}</span>
                    <span className={styles.sessionIp}>{session.ip}</span>
                  </div>
                </div>
                <div className={styles.sessionMeta}>
                  <span className={`${styles.sessionType}`}>{session.type}</span>
                  <span className={styles.sessionDuration}>{session.duration}</span>
                </div>
                <button className={styles.sessionAction}>
                  {session.status === 'suspicious' ? <Lock size={14} /> : <Eye size={14} />}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* System Health - Real Data */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3><Cpu size={18} /> System Health</h3>
            <span className={`${styles.liveBadge} ${isMonitoring ? styles.active : ''}`}>
              {isMonitoring ? '● LIVE' : '○ PAUSED'}
            </span>
          </div>
          <div className={styles.healthList}>
            {systemHealth.map((item, idx) => (
              <div key={idx} className={styles.healthItem}>
                <div className={styles.healthInfo}>
                  <span>{item.name}</span>
                  <span className={styles.healthValue}>{item.value}%</span>
                </div>
                <div className={styles.healthBar}>
                  <div
                    className={`${styles.healthProgress} ${styles[item.status]}`}
                    style={{ width: `${item.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          {systemInfo && (
            <div className={styles.systemMeta}>
              <span>OS: {systemInfo.platform} ({systemInfo.arch})</span>
              <span>Uptime: {Math.floor((systemInfo.uptime || 0) / 3600)}h</span>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3><TrendingUp size={18} /> Quick Actions</h3>
          </div>
          <div className={styles.quickActions}>
            <button className={styles.actionBtn}>
              <Shield size={20} />
              <span>Lock All Accounts</span>
            </button>
            <button className={styles.actionBtn}>
              <Network size={20} />
              <span>Block Suspicious IPs</span>
            </button>
            <button className={styles.actionBtn}>
              <FileWarning size={20} />
              <span>Start Forensic Scan</span>
            </button>
            <button className={styles.actionBtn}>
              <Server size={20} />
              <span>Isolate Server</span>
            </button>
          </div>
        </div>
      </div>

      {/* Network Visualization Placeholder */}
      <div className={styles.networkCard}>
        <div className={styles.cardHeader}>
          <h3><Network size={18} /> Network Activity Map</h3>
          <div className={styles.legendItems}>
            <span className={styles.legendItem}><span className={styles.dotGreen} /> Normal</span>
            <span className={styles.legendItem}><span className={styles.dotYellow} /> Suspicious</span>
            <span className={styles.legendItem}><span className={styles.dotRed} /> Threat</span>
          </div>
        </div>
        <div className={styles.networkViz}>
          <div className={styles.vizPlaceholder}>
            <Network size={48} />
            <p>Real-time network topology visualization</p>
            <span>Monitoring {systemInfo?.processes?.length || 45} processes • {Array.isArray(systemInfo?.connections) ? systemInfo.connections.length : 12} connections active</span>
          </div>
        </div>
      </div>
    </div>
  );
}
