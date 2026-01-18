'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface SystemInfo {
    os: string;
    hostname: string;
    platform: string;
    arch: string;
    cpuUsage: number[];
    memoryUsage: {
        total: number;
        free: number;
        used: number;
    };
    uptime: number;
    processes: unknown[];
    connections: unknown[];
    sessions?: {
        user: string;
        ip: string;
        type: string;
        status: string;
        duration: string;
    }[];
    recentAlerts?: {
        id: number;
        type: string;
        message: string;
        source: string;
        time: string;
    }[];
    timestamp: string;
}

interface SystemContextType {
    systemInfo: SystemInfo | null;
    isMonitoring: boolean;
    startMonitoring: () => void;
    stopMonitoring: () => void;
    openTerminal: (command?: string) => Promise<boolean>;
    launchTool: (toolName: string, command: string) => Promise<boolean>;
    lastError: string | null;
}

const SystemContext = createContext<SystemContextType | undefined>(undefined);

export function SystemProvider({ children }: { children: React.ReactNode }) {
    const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
    const [isMonitoring, setIsMonitoring] = useState(false);
    const [lastError, setLastError] = useState<string | null>(null);

    // Fetch system info
    const fetchSystemInfo = useCallback(async () => {
        try {
            const response = await fetch('/api/system');
            if (response.ok) {
                const data = await response.json();
                setSystemInfo(data);
                setLastError(null);
            }
        } catch (error) {
            setLastError(error instanceof Error ? error.message : 'Failed to fetch system info');
        }
    }, []);

    // Start monitoring
    const startMonitoring = useCallback(() => {
        setIsMonitoring(true);
    }, []);

    // Stop monitoring
    const stopMonitoring = useCallback(() => {
        setIsMonitoring(false);
    }, []);

    // Open terminal
    const openTerminal = useCallback(async (command?: string): Promise<boolean> => {
        try {
            const response = await fetch('/api/system', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'openTerminal',
                    command: command || 'echo "Arishadvarga-Guardian Security Terminal" && echo "System monitoring active..."',
                }),
            });

            const result = await response.json();
            return result.success;
        } catch (error) {
            setLastError(error instanceof Error ? error.message : 'Failed to open terminal');
            return false;
        }
    }, []);

    // Launch tool
    const launchTool = useCallback(async (toolName: string, command: string): Promise<boolean> => {
        try {
            const response = await fetch('/api/system', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'launchTool',
                    toolName,
                    command,
                }),
            });

            const result = await response.json();
            return result.success;
        } catch (error) {
            setLastError(error instanceof Error ? error.message : `Failed to launch ${toolName}`);
            return false;
        }
    }, []);

    // Auto-fetch on mount and start monitoring
    useEffect(() => {
        fetchSystemInfo();
        setIsMonitoring(true);
    }, [fetchSystemInfo]);

    // Polling interval when monitoring is active
    useEffect(() => {
        if (!isMonitoring) return;

        const interval = setInterval(fetchSystemInfo, 10000); // Every 10 seconds
        return () => clearInterval(interval);
    }, [isMonitoring, fetchSystemInfo]);

    return (
        <SystemContext.Provider
            value={{
                systemInfo,
                isMonitoring,
                startMonitoring,
                stopMonitoring,
                openTerminal,
                launchTool,
                lastError,
            }}
        >
            {children}
        </SystemContext.Provider>
    );
}

export function useSystem() {
    const context = useContext(SystemContext);
    if (context === undefined) {
        throw new Error('useSystem must be used within a SystemProvider');
    }
    return context;
}
