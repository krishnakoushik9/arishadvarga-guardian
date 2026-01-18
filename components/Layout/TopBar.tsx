'use client';

import React, { useState } from 'react';
import {
    Bell,
    Search,
    Settings,
    Key,
    AlertOctagon,
    Clock,
    Activity,
    User,
    ChevronDown,
} from 'lucide-react';
import styles from './TopBar.module.css';

interface TopBarProps {
    onOpenApiKeyModal?: () => void;
}

export default function TopBar({ onOpenApiKeyModal }: TopBarProps) {
    const [showUserMenu, setShowUserMenu] = useState(false);
    const currentTime = new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
    });

    return (
        <header className={styles.topbar}>
            {/* Left Section - Alert Banner */}
            <div className={styles.alertBanner}>
                <AlertOctagon size={16} className={styles.alertIcon} />
                <span className={styles.alertText}>Intrusion Detected</span>
            </div>

            {/* Center Section - Search */}
            <div className={styles.searchSection}>
                <div className={styles.searchBox}>
                    <Search size={18} className={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder="Search logs, IPs, files..."
                        className={styles.searchInput}
                    />
                    <kbd className={styles.searchHint}>⌘K</kbd>
                </div>
            </div>

            {/* Right Section - Actions */}
            <div className={styles.actionsSection}>
                {/* Time */}
                <div className={styles.timeDisplay}>
                    <Clock size={16} />
                    <span>{currentTime}</span>
                </div>

                {/* System Status */}
                <div className={styles.statusPill}>
                    <Activity size={14} className={styles.statusPulse} />
                    <span>Monitoring</span>
                </div>

                {/* API Key Button */}
                <button
                    className={styles.iconBtn}
                    onClick={onOpenApiKeyModal}
                    title="Configure API Key"
                >
                    <Key size={18} />
                </button>

                {/* Notifications */}
                <button className={styles.iconBtn} title="Notifications">
                    <Bell size={18} />
                    <span className={styles.notifBadge}>3</span>
                </button>

                {/* Settings */}
                <button className={styles.iconBtn} title="Settings">
                    <Settings size={18} />
                </button>

                {/* User Menu */}
                <div className={styles.userMenu}>
                    <button
                        className={styles.userBtn}
                        onClick={() => setShowUserMenu(!showUserMenu)}
                    >
                        <div className={styles.avatar}>
                            <User size={18} />
                        </div>
                        <span className={styles.userName}>Admin</span>
                        <ChevronDown size={14} />
                    </button>
                    {showUserMenu && (
                        <div className={styles.dropdown}>
                            <a href="#profile">Profile</a>
                            <a href="#audit">Audit Log</a>
                            <a href="#logout">Logout</a>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
