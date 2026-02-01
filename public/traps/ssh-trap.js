const fs = require('fs');
const path = require('path');
const { Server } = require('ssh2');

const PORT = parseInt(process.env.PORT || '2222');
const LOG_FILE = process.env.LOG_FILE || path.join(process.cwd(), 'ssh-trap.log');
const TRAP_NAME = process.env.TRAP_NAME || 'SSH Trap';

// Load key
const HOST_KEY = fs.readFileSync(path.join(__dirname, 'host.key'));

function logInteraction(type, details) {
    const entry = {
        timestamp: new Date().toISOString(),
        trapName: TRAP_NAME,
        type,
        ...details
    };
    fs.appendFileSync(LOG_FILE, JSON.stringify(entry) + '\n');
    console.log(JSON.stringify(entry));
}

const server = new Server({
    hostKeys: [HOST_KEY],
    banner: 'Welcome to Ubuntu 22.04.2 LTS (GNU/Linux 5.15.0-60-generic x86_64)\n\n'
}, (client) => {
    let username = 'unknown';
    // Attempt to get IP. Might be stored in client._sock or client._stream depending on version
    // client is connection object
    const ip = client._sock ? client._sock.remoteAddress : 'unknown';

    client.on('authentication', (ctx) => {
        username = ctx.username;

        let authData = { method: ctx.method };
        if (ctx.method === 'password') {
            authData.password = ctx.password; // Capture password!
        }

        logInteraction('login_attempt', {
            ip,
            username,
            ...authData
        });

        // Accept all passwords for the honeypot
        if (ctx.method === 'password') {
            ctx.accept();
        } else {
            // Reject public keys to force password (which we want to capture)
            ctx.reject();
        }
    })
        .on('ready', () => {
            logInteraction('session_start', { ip, username });

            client.on('session', (accept, reject) => {
                const session = accept();
                session.on('shell', (accept, reject) => {
                    const stream = accept();
                    stream.write('Welcome to Ubuntu 22.04.2 LTS (GNU/Linux 5.15.0-60-generic x86_64)\r\n');
                    stream.write('Last login: ' + new Date().toString() + ' from ' + ip + '\r\n');
                    stream.write(`${username}@server:~$ `);

                    let buffer = '';

                    // Very basic terminal emulation
                    stream.on('data', (data) => {
                        // This is raw scan codes/text. 
                        // For simplicity, we just echo back and capture 'enters'
                        const str = data.toString();

                        // Simple echo
                        // stream.write(data); 

                        for (let i = 0; i < str.length; i++) {
                            const char = str[i];
                            if (char === '\r' || char === '\n') {
                                stream.write('\r\n');
                                const cmd = buffer.trim();
                                if (cmd) {
                                    logInteraction('command', { ip, username, command: cmd });
                                    if (cmd === 'exit') {
                                        stream.exit(0);
                                        stream.end();
                                        return;
                                    } else if (cmd === 'id') {
                                        stream.write(`uid=0(root) gid=0(root) groups=0(root)\r\n`);
                                    } else if (cmd === 'ls') {
                                        stream.write(`passwords.txt  backup.sql  admin_panel\r\n`);
                                    } else if (cmd === 'pwd') {
                                        stream.write(`/root\r\n`);
                                    } else {
                                        stream.write(`bash: ${cmd}: command not found\r\n`);
                                    }
                                }
                                buffer = '';
                                stream.write(`${username}@server:~$ `);
                            } else if (char === '\u0003') { // Ctrl+C
                                stream.write('^C\r\n');
                                buffer = '';
                                stream.write(`${username}@server:~$ `);
                            } else if (char === '\u007f') { // Backspace
                                // naive backspace handling
                                if (buffer.length > 0) {
                                    buffer = buffer.slice(0, -1);
                                    stream.write('\b \b');
                                }
                            } else {
                                buffer += char;
                                stream.write(char);
                            }
                        }
                    });
                });

                // Handle pty request?
                session.on('pty', (accept, reject, info) => {
                    accept();
                });
            });
        })
        .on('end', () => {
            logInteraction('session_end', { ip, username });
        })
        .on('error', (err) => {
            console.error('Client error:', err);
        });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`SSH Trap listening on port ${PORT}`);
});
