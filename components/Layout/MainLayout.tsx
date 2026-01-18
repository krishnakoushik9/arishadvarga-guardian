'use client';

import React from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import styles from './MainLayout.module.css';

interface MainLayoutProps {
    children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
    return (
        <div className={styles.layout}>
            <Sidebar />
            <div className={styles.mainArea}>
                <TopBar />
                <main className={styles.content}>
                    {children}
                </main>
            </div>
        </div>
    );
}
