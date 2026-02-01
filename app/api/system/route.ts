import { NextRequest, NextResponse } from 'next/server';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import os from 'os';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';

const execAsync = promisify(exec);

// Detect the operating system
function getOS(): 'windows' | 'linux' | 'darwin' | 'unknown' {
    const platform = os.platform();
    if (platform === 'win32') return 'windows';
    if (platform === 'linux') return 'linux';
    if (platform === 'darwin') return 'darwin';
    return 'unknown';
}

// Get terminal command based on OS
function getTerminalCommand(command: string): { cmd: string; args: string[] } {
    const osType = getOS();

    switch (osType) {
        case 'windows':
            return { cmd: 'powershell', args: ['-NoExit', '-Command', command] };
        case 'linux':
            // Try different terminal emulators
            if (fs.existsSync('/usr/bin/gnome-terminal')) {
                return { cmd: 'gnome-terminal', args: ['--', 'bash', '-c', `${command}; exec bash`] };
            } else if (fs.existsSync('/usr/bin/konsole')) {
                return { cmd: 'konsole', args: ['-e', 'bash', '-c', `${command}; exec bash`] };
            } else if (fs.existsSync('/usr/bin/xterm')) {
                return { cmd: 'xterm', args: ['-e', `${command}; exec bash`] };
            }
            return { cmd: 'x-terminal-emulator', args: ['-e', `${command}; exec bash`] };
        case 'darwin':
            return { cmd: 'osascript', args: ['-e', `tell application "Terminal" to do script "${command}"`] };
        default:
            throw new Error('Unsupported operating system');
    }
}

// Launch a tool in a new terminal
async function launchTool(toolName: string, command: string): Promise<{ success: boolean; message: string }> {
    try {
        const terminalCmd = getTerminalCommand(command);

        const child = spawn(terminalCmd.cmd, terminalCmd.args, {
            detached: true,
            stdio: 'ignore',
        });

        child.unref();

        return { success: true, message: `Launched ${toolName} in terminal` };
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Failed to launch tool'
        };
    }
}

// Check if a tool is installed
async function checkToolInstalled(toolName: string): Promise<boolean> {
    const osType = getOS();

    try {
        if (osType === 'windows') {
            await execAsync(`where ${toolName}`);
        } else {
            await execAsync(`which ${toolName}`);
        }
        return true;
    } catch {
        return false;
    }
}

// Start background system monitoring
async function startSystemMonitor(): Promise<{ success: boolean; data?: unknown }> {
    const osType = getOS();

    try {
        let processes: unknown[] = [];
        let connections: unknown[] = [];
        let sessions: unknown[] = [];
        let recentAlerts: unknown[] = [];

        if (osType === 'windows') {
            // Get running processes using WMI for real-time CPU %
            try {
                // Win32_PerfFormattedData_PerfProc_Process gives pre-calculated % usage
                const { stdout: procOutput } = await execAsync(
                    'powershell "Get-CimInstance Win32_PerfFormattedData_PerfProc_Process | Sort-Object PercentProcessorTime -Descending | Select-Object -First 20 IDProcess, Name, PercentProcessorTime, WorkingSetPrivate | ConvertTo-Json"'
                );

                const rawProcs = JSON.parse(procOutput || '[]');
                const procList = Array.isArray(rawProcs) ? rawProcs : [rawProcs];

                processes = procList.map((p: any) => ({
                    pid: p.IDProcess,
                    name: p.Name,
                    user: 'SYSTEM', // WMI doesn't easily give username, trade-off for speed/CPU%
                    cpu: Math.min(100, Math.round(p.PercentProcessorTime || 0)),
                    memory: Math.round((p.WorkingSetPrivate || 0) / 1024 / 1024),
                    status: (p.PercentProcessorTime || 0) > 50 ? 'suspicious' : 'trusted'
                })).filter((p: any) => p.pid !== 0 && p.name !== '_Total' && p.name !== 'Idle');
            } catch (e) {
                console.error('Win Process Error', e);
                // Fallback to basic if WMI fails
                processes = [{ pid: 0, name: 'SystemIdle', user: 'SYSTEM', cpu: 0, memory: 0, status: 'trusted' }];
            }

            // Get network connections (same as before)
            try {
                const { stdout: netOutput } = await execAsync(
                    'powershell "Get-NetTCPConnection -State Established | Select-Object -First 15 LocalAddress, LocalPort, RemoteAddress, RemotePort, OwningProcess, State | ConvertTo-Json"'
                );
                const rawConns = JSON.parse(netOutput || '[]');
                const connList = Array.isArray(rawConns) ? rawConns : [rawConns];

                connections = connList.map((c: any) => ({
                    source: `${c.LocalAddress}:${c.LocalPort}`,
                    destination: `${c.RemoteAddress}:${c.RemotePort}`,
                    protocol: 'TCP',
                    status: 'active',
                    bytes: 'N/A'
                }));
            } catch (e) { console.error('Win Net Error', e); }

            sessions = [{
                id: 1, type: 'Console', user: process.env.USERNAME || 'User',
                source: 'Local', destination: 'localhost', status: 'trusted',
                startTime: new Date().toLocaleTimeString(), duration: 'Active', commands: 0
            }];

        } else if (osType === 'linux') {
            // Get running processes: PID, User, CPU, Mem, Command
            try {
                const { stdout: procOutput } = await execAsync("ps -eo pid,user,%cpu,%mem,comm --sort=-%cpu | head -n 21");
                const lines = procOutput.trim().split('\n').slice(1); // skip header

                processes = lines.map(line => {
                    const parts = line.trim().split(/\s+/);
                    const cpuVal = parseFloat(parts[2]);
                    return {
                        pid: parseInt(parts[0]),
                        user: parts[1],
                        // Clamp CPU to 100% to avoid confusion on multi-core fetching
                        cpu: Math.min(100, Math.round(cpuVal)),
                        memory: Math.round(parseFloat(parts[3]) * 1024),
                        name: parts.slice(4).join(' '),
                        status: cpuVal > 30 ? 'suspicious' : 'trusted'
                    };
                });
            } catch (e) { console.error('Linux Process Error', e); }

            // Get network connections with process names for tree visualization
            // ss -tunap gives us connections with process info
            try {
                const { stdout: netOutput } = await execAsync("ss -tunap 2>/dev/null | grep -v 'Netid' | head -n 50");
                const lines = netOutput.trim().split('\n');

                connections = lines.map(line => {
                    const parts = line.trim().split(/\s+/);
                    if (parts.length < 6) return null;

                    // Extract process name from the last column (users:(("process",pid=123,fd=4)))
                    let processName = 'unknown';
                    let pid = 0;
                    const processMatch = line.match(/users:\(\("([^"]+)",pid=(\d+)/);
                    if (processMatch) {
                        processName = processMatch[1];
                        pid = parseInt(processMatch[2]);
                    }

                    // Parse local and remote addresses
                    const localAddr = parts[4] || '';
                    const remoteAddr = parts[5] || '';

                    // Extract IP and port
                    const [localIp, localPort] = localAddr.split(':').length > 2
                        ? [localAddr.substring(0, localAddr.lastIndexOf(':')), localAddr.split(':').pop()]
                        : localAddr.split(':');
                    const [remoteIp, remotePort] = remoteAddr.split(':').length > 2
                        ? [remoteAddr.substring(0, remoteAddr.lastIndexOf(':')), remoteAddr.split(':').pop()]
                        : remoteAddr.split(':');

                    return {
                        source: localAddr,
                        destination: remoteAddr,
                        localIp: localIp || '0.0.0.0',
                        localPort: localPort || '0',
                        remoteIp: remoteIp || '0.0.0.0',
                        remotePort: remotePort || '0',
                        protocol: parts[0].toUpperCase(),
                        status: parts[1] === 'ESTAB' ? 'active' : parts[1],
                        bytes: `${parts[2]}/${parts[3]}`,
                        processName,
                        pid,
                    };
                }).filter(Boolean);
            } catch (e) { console.error('Linux Net Error', e); }

            // Get active sessions
            try {
                const { stdout: whoOutput } = await execAsync("who");
                const lines = whoOutput.trim().split('\n');
                sessions = lines.filter(l => l).map((line, idx) => {
                    const parts = line.trim().split(/\s+/);
                    return {
                        id: idx,
                        type: 'SSH/TTY',
                        user: parts[0],
                        source: parts.length > 4 ? parts[4].replace(/[()]/g, '') : 'Local',
                        destination: 'localhost',
                        status: 'trusted',
                        startTime: parts[2] + ' ' + parts[3],
                        duration: 'Active',
                        commands: 'N/A'
                    };
                });
            } catch (e) { console.error('Linux Session Error', e); }
        }

        // Calculate real CPU usage percentage
        let cpuPercent = 0;
        if (osType === 'linux') {
            try {
                // Read /proc/stat for CPU usage - this gives cumulative time
                // We need to calculate delta, but for simplicity use top's 1-iteration output
                const { stdout: cpuOutput } = await execAsync("grep 'cpu ' /proc/stat");
                const parts = cpuOutput.trim().split(/\s+/);
                // cpu user nice system idle iowait irq softirq steal guest guest_nice
                const user = parseInt(parts[1]);
                const nice = parseInt(parts[2]);
                const system = parseInt(parts[3]);
                const idle = parseInt(parts[4]);
                const iowait = parseInt(parts[5]) || 0;

                const total = user + nice + system + idle + iowait;
                const active = user + nice + system;
                cpuPercent = Math.round((active / total) * 100);
            } catch {
                // Fallback to load average
                cpuPercent = Math.min(100, Math.round(os.loadavg()[0] * 10));
            }
        } else if (osType === 'windows') {
            try {
                const { stdout: cpuOutput } = await execAsync(
                    'powershell "(Get-CimInstance Win32_Processor | Measure-Object -Property LoadPercentage -Average).Average"'
                );
                cpuPercent = parseInt(cpuOutput.trim()) || 0;
            } catch {
                cpuPercent = Math.min(100, Math.round(os.loadavg()[0] * 10));
            }
        }

        // Memory usage
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const usedMem = totalMem - freeMem;
        const memPercent = Math.round((usedMem / totalMem) * 100);

        return {
            success: true,
            data: {
                os: osType,
                timestamp: new Date().toISOString(),
                processes,
                connections,
                sessions,
                recentAlerts,
                cpuPercent, // Real CPU usage percentage
                cpuUsage: os.loadavg(),
                memoryUsage: {
                    total: totalMem,
                    free: freeMem,
                    used: usedMem,
                    percent: memPercent, // Real memory usage percentage
                },
                uptime: os.uptime(),
            }
        };
    } catch (error) {
        return {
            success: false,
            data: { error: error instanceof Error ? error.message : 'Unknown error' }
        };
    }
}

// Get file changes in common directories
async function getFileChanges(): Promise<{ success: boolean; data?: unknown }> {
    const osType = getOS();

    try {
        let recentFiles: string[] = [];

        if (osType === 'windows') {
            const { stdout } = await execAsync(
                'powershell "Get-ChildItem -Path C:\\Windows\\Temp, $env:TEMP -Recurse -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 20 FullName, LastWriteTime | ConvertTo-Json"'
            );
            recentFiles = JSON.parse(stdout || '[]');
        } else {
            const { stdout } = await execAsync(
                "find /tmp /var/log -type f -mmin -30 2>/dev/null | head -20"
            );
            recentFiles = stdout.split('\n').filter(Boolean);
        }

        return { success: true, data: recentFiles };
    } catch (error) {
        return { success: false, data: [] };
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { action, toolName, command } = body;

        switch (action) {
            case 'getOS':
                return NextResponse.json({ os: getOS() });

            case 'launchTool':
                const launchResult = await launchTool(toolName, command);
                return NextResponse.json(launchResult);

            case 'checkTool':
                const installed = await checkToolInstalled(toolName);
                return NextResponse.json({ installed });

            case 'startMonitor':
                const monitorResult = await startSystemMonitor();
                return NextResponse.json(monitorResult);

            case 'getFileChanges':
                const fileResult = await getFileChanges();
                return NextResponse.json(fileResult);

            case 'killProcess':
                const { pid } = body;
                if (!pid) return NextResponse.json({ error: 'PID required' }, { status: 400 });

                try {
                    const osType = getOS();
                    const cmd = osType === 'windows'
                        ? `powershell "Stop-Process -Id ${pid} -Force"`
                        : `kill -9 ${pid}`;

                    await execAsync(cmd);
                    return NextResponse.json({ success: true, message: `Process ${pid} terminated` });
                } catch (e) {
                    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : 'Failed to kill process' });
                }

            case 'getProcessDetails':
                const { pid: viewPid } = body;
                if (!viewPid) return NextResponse.json({ error: 'PID required' }, { status: 400 });

                try {
                    const osType = getOS();
                    let details = '';

                    if (osType === 'windows') {
                        const { stdout } = await execAsync(
                            `powershell "Get-Process -Id ${viewPid} | Select-Object Id, ProcessName, StartTime, TotalProcessorTime, WorkingSet, Path, Description | ConvertTo-Json"`
                        );
                        details = stdout;
                    } else {
                        // Linux: returning /proc/<pid>/status as "head" info or detailed info
                        const { stdout } = await execAsync(`cat /proc/${viewPid}/status 2>/dev/null || ps -p ${viewPid} -o pid,user,%cpu,%mem,start,time,command`);
                        details = stdout;
                    }

                    return NextResponse.json({ success: true, data: details });
                } catch (e) {
                    return NextResponse.json({ success: false, error: 'Process not found or access denied' });
                }

            case 'openTerminal':
                const terminalResult = await launchTool('Terminal', command || 'echo "Arishadvarga-Guardian Terminal"');
                return NextResponse.json(terminalResult);

            default:
                return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
        }
    } catch (error) {
        console.error('System API error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}

export async function GET() {
    const osType = getOS();
    const monitorData = await startSystemMonitor();

    const baseInfo = {
        os: osType,
        hostname: os.hostname(),
        platform: os.platform(),
        arch: os.arch(),
    };

    if (monitorData.success && monitorData.data && typeof monitorData.data === 'object') {
        return NextResponse.json({ ...baseInfo, ...monitorData.data });
    }

    return NextResponse.json(baseInfo);
}
