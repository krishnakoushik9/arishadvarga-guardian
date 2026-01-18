'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Monitor,
    Shield,
    Target,
    Bug,
    FileSearch,
    Mail,
    Skull,
    HelpCircle,
    Wrench,
    ChevronLeft,
    ChevronRight,
    AlertTriangle,
    Zap,
} from 'lucide-react';
import styles from './Sidebar.module.css';

const modules = [
    { name: 'Dashboard', path: '/', icon: Zap },
    { name: 'Control Room', path: '/control-room', icon: Monitor, alert: true },
    { name: 'Containment', path: '/containment', icon: Shield },
    { name: 'Attribution', path: '/attribution', icon: Target },
    { name: 'Deception', path: '/deception', icon: Bug },
    { name: 'Forensics', path: '/forensics', icon: FileSearch },
    { name: 'Social Engineering', path: '/social-engineering', icon: Mail },
    { name: 'Malware', path: '/malware', icon: Skull },
    { name: 'Guidance', path: '/guidance', icon: HelpCircle },
    { name: 'Tools', path: '/tools', icon: Wrench },
];

export default function Sidebar() {
    const [collapsed, setCollapsed] = useState(false);
    const pathname = usePathname();

    return (
        <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''}`}>
            {/* Logo Section */}
            <div className={styles.logoSection}>
                <div className={styles.logoIcon}>
                    <Shield size={28} />
                </div>
                {!collapsed && (
                    <div className={styles.logoText}>
                        <span className={styles.logoTitle}>Arishadvarga</span>
                        <span className={styles.logoSubtitle}>Guardian</span>
                    </div>
                )}
            </div>

            {/* Navigation */}
            <nav className={styles.nav}>
                {modules.map((mod) => {
                    const Icon = mod.icon;
                    const isActive = pathname === mod.path;
                    return (
                        <Link
                            key={mod.name}
                            href={mod.path}
                            className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                            title={collapsed ? mod.name : undefined}
                        >
                            <div className={styles.iconWrapper}>
                                <Icon size={20} />
                                {mod.alert && <span className={styles.alertDot} />}
                            </div>
                            {!collapsed && <span className={styles.navLabel}>{mod.name}</span>}
                        </Link>
                    );
                })}
            </nav>

            {/* Collapse Toggle */}
            <button
                className={styles.collapseBtn}
                onClick={() => setCollapsed(!collapsed)}
                aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
                {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>

            {/* Status Indicator */}
            <div className={styles.statusSection}>
                <div className={styles.statusIndicator}>
                    <AlertTriangle size={16} className={styles.statusIcon} />
                    {!collapsed && <span>Active Threat</span>}
                </div>
            </div>
        </aside>
    );
}
