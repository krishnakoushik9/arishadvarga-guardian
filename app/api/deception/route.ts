import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';

const STATE_FILE = path.join(process.cwd(), 'active-traps.json');
const LOG_DIR = path.join(process.cwd(), 'logs');

if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });

function getTraps() {
    if (!fs.existsSync(STATE_FILE)) return [];
    try {
        const data = fs.readFileSync(STATE_FILE, 'utf-8');
        return JSON.parse(data);
    } catch { return []; }
}

function saveTraps(traps: any[]) {
    fs.writeFileSync(STATE_FILE, JSON.stringify(traps, null, 2));
}

// Helper to check if PID is running
function isPidRunning(pid: number) {
    try {
        process.kill(pid, 0);
        return true;
    } catch (e) {
        return false;
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { action, type, port, name, id } = body;

        if (action === 'create') {
            const trapId = Date.now().toString();
            const traps = getTraps();

            let scriptPath = '';
            let logFile = path.join(LOG_DIR, `trap-${trapId}.log`);
            const env = {
                ...process.env,
                PORT: String(port),
                TRAP_NAME: name,
                LOG_FILE: logFile,
                TRAP_ID: trapId
            };

            let child;

            try {
                const scriptName = type === 'ssh' ? 'ssh-trap.js' : 'web-trap.js';
                // Manual string concatenation to avoid path.join/resolve static analysis
                const root = process.cwd();
                const fullPath = `${root}/public/traps/${scriptName}`;

                if (!fs.existsSync(fullPath)) {
                    throw new Error(`Trap script not found at ${fullPath}`);
                }

                if (type === 'ssh' || type === 'web') {
                    const spawnProcess = spawn;
                    child = spawnProcess('node', [fullPath], { env, detached: true, stdio: 'ignore' });
                } else {
                    return NextResponse.json({ success: false, message: "Trap type not implemented yet" });
                }

                if (child) {
                    child.unref();

                    const newTrap = {
                        id: trapId,
                        type,
                        name,
                        port,
                        pid: child.pid,
                        status: 'active',
                        startTime: new Date().toISOString(),
                        logFile
                    };

                    traps.push(newTrap);
                    saveTraps(traps);

                    return NextResponse.json({ success: true, trap: newTrap });
                }
            } catch (e: any) {
                return NextResponse.json({ success: false, error: e.message });
            }
        }

        if (action === 'delete') {
            const traps = getTraps();
            const trapIndex = traps.findIndex((t: any) => t.id === id);

            if (trapIndex !== -1) {
                const trap = traps[trapIndex];
                try {
                    if (isPidRunning(trap.pid)) {
                        process.kill(trap.pid);
                    }
                } catch (e) {
                    console.error("Failed to kill process", e);
                }
                traps.splice(trapIndex, 1);
                saveTraps(traps);
                return NextResponse.json({ success: true });
            }
            return NextResponse.json({ success: false, message: "Trap not found" });
        }

        if (action === 'logs') {
            // specific trap logs? or all logs?
            // let's return combined recent activity
            const traps = getTraps();
            let allLogs: any[] = [];

            traps.forEach((trap: any) => {
                if (fs.existsSync(trap.logFile)) {
                    const content = fs.readFileSync(trap.logFile, 'utf-8');
                    const lines = content.split('\n').filter(Boolean);
                    lines.forEach(line => {
                        try {
                            allLogs.push(JSON.parse(line));
                        } catch { }
                    });
                }
            });

            // Sort by timestamp desc
            allLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

            return NextResponse.json({ success: true, logs: allLogs.slice(0, 50) });
        }

        return NextResponse.json({ success: false, message: "Invalid action" });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ success: false, error: "Internal Server Error" });
    }
}

export async function GET() {
    const traps = getTraps();
    // Update status based on PID
    const updatedTraps = traps.map((t: any) => ({
        ...t,
        status: isPidRunning(t.pid) ? 'active' : 'error'
    }));

    // Save updated status? Maybe not to avoid IO churn, just return
    return NextResponse.json({ success: true, data: updatedTraps });
}
