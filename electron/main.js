const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const portfinder = require('portfinder');
const http = require('http');
const fs = require('fs');

let mainWindow;
let serverProcess;
let serverStarting = false;

// Log function to write to a file in user data directory
function log(message) {
    const logPath = path.join(app.getPath('userData'), 'app-server.log');
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;
    fs.appendFileSync(logPath, logMessage);
    // Also log to console if available
    console.log(logMessage);
}

const isDev = process.env.NODE_ENV === 'development';

async function createWindow() {
    log('Creating window...');
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        title: "Arishadvarga-Guardian",
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false, // For needed system access
            preload: path.join(__dirname, 'preload.js'),
        },
        icon: path.join(__dirname, '../public/icon.png'),
        // titleBarStyle removed to restore native frame
        show: true
    });

    // Critical fix for Wine/VMs: Load something immediately to init the renderer
    mainWindow.loadURL('about:blank');

    // ready-to-show might not fire in Wine/VMs with poor GPU
    // mainWindow.once('ready-to-show', () => {
    //    log('Window ready-to-show event fired. Showing window now.');
    //    mainWindow.show();
    // });

    mainWindow.on('closed', () => {
        mainWindow = null;
        if (serverProcess) serverProcess.kill();
    });

    if (isDev) {
        mainWindow.loadURL('http://localhost:3000');
        mainWindow.webContents.openDevTools();
    } else {
        await startServer();
    }
}

async function startServer() {
    if (serverStarting) {
        log('Server already starting, skipping initialization.');
        return;
    }
    serverStarting = true;

    log('Starting server initialization...');
    let port;
    try {
        port = await portfinder.getPortPromise();
        log(`Found free port: ${port}`);
    } catch (err) {
        log(`Port error: ${err}`);
        dialog.showErrorBox('Startup Error', 'Could not find a free port.');
        return;
    }

    const findServer = (dir) => {
        if (!fs.existsSync(dir)) return null;
        const files = fs.readdirSync(dir);
        for (const file of files) {
            // Skip node_modules and build artifacts to avoid finding the wrong server.js
            if (file === 'node_modules' || file === 'dist' || file.includes('unpacked')) continue;

            const fullPath = path.join(dir, file);
            if (fs.statSync(fullPath).isDirectory()) {
                const found = findServer(fullPath);
                if (found) return found;
            } else if (file === 'server.js') {
                return fullPath;
            }
        }
        return null;
    };

    // Priority 1: Check standard standalone output location
    // When built with 'path.join(__dirname)' tracing root, expected path simplifies

    // Check known potential locations
    const searchPaths = [
        path.join(process.resourcesPath, 'app-server'),
        path.join(process.resourcesPath, 'app-server', 'standalone'),
        path.join(__dirname, '../.next/standalone')
    ];

    let finalPath = null;
    for (const searchPath of searchPaths) {
        log(`Searching for server.js in: ${searchPath}`);
        finalPath = findServer(searchPath);
        if (finalPath) break;
    }

    if (!finalPath) {
        log('CRITICAL: server.js not found.');
        dialog.showErrorBox('Startup Error', `Could not find server.js in resources.\nChecked: ${searchPaths.join('\n')}`);
        return;
    }

    log(`Found server.js at: ${finalPath}`);

    const env = {
        ...process.env,
        PORT: port,
        HOSTNAME: 'localhost',
        NODE_ENV: 'production',
        // Critical for next.js to find its files relative to the standalone folder
        NEXT_MANUAL_SIG_HANDLE: 'true',
        ELECTRON_RUN_AS_NODE: '1'
    };

    log(`Spawning process using: ${process.execPath}`);
    log('Spawning node process...');

    try {
        serverProcess = spawn(process.execPath, [finalPath], {
            env,
            cwd: path.dirname(finalPath), // CWD must be the directory containing server.js for relative paths to work
            stdio: 'pipe'
        });

        serverProcess.stdout.on('data', (d) => log(`SERVER OUT: ${d.toString().trim()}`));
        serverProcess.stderr.on('data', (d) => log(`SERVER ERR: ${d.toString().trim()}`));

        serverProcess.on('error', (err) => {
            log(`Spawn error: ${err}`);
            dialog.showErrorBox('Server Error', `Failed to launch server process: ${err.message}`);
        });

        serverProcess.on('exit', (code) => {
            serverStarting = false;
            log(`Server exited with code ${code}`);
            if (code !== 0 && code !== null) {
                dialog.showErrorBox('Server Crash', `The application server crashed with exit code ${code}. Check logs.`);
            }
        });

    } catch (e) {
        log(`Exception spawning process: ${e}`);
        return;
    }

    const waitForServer = async (retries = 60) => {
        if (retries === 0) {
            log('Server timed out.');
            dialog.showErrorBox('Timeout', 'The application server took too long to respond.');
            return;
        }

        http.get(`http://localhost:${port}`, (res) => {
            log(`Server responded! Status: ${res.statusCode}`);

            if (!mainWindow || mainWindow.isDestroyed()) {
                log('Main window missing or destroyed, recreating...');
                createWindow();
                return;
            }

            mainWindow.loadURL(`http://localhost:${port}`);
        }).on('error', () => {
            setTimeout(() => waitForServer(retries - 1), 500);
        });
    };

    waitForServer();
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
    if (serverProcess) serverProcess.kill();
});

app.on('activate', () => {
    if (mainWindow === null) createWindow();
});

app.on('before-quit', () => {
    if (serverProcess) serverProcess.kill();
});
