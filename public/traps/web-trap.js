const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8080;
const TRAP_NAME = process.env.TRAP_NAME || 'Web Trap';
const LOG_FILE = process.env.LOG_FILE || path.join(process.cwd(), 'trap-logs.json');

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Logging
function logInteraction(req, type, details = {}) {
    const entry = {
        id: Date.now(),
        trapId: process.env.TRAP_ID,
        trapName: TRAP_NAME,
        timestamp: new Date().toISOString(),
        sourceIp: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        type, // 'visit', 'login', 'exploit'
        details
    };

    // Append to file
    fs.appendFileSync(LOG_FILE, JSON.stringify(entry) + '\n');

    // Stdout for parent process
    console.log(JSON.stringify(entry));
}

// Fake Admin Panel
app.get('/', (req, res) => {
    logInteraction(req, 'visit', { path: '/' });
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>${TRAP_NAME} - Login</title>
            <style>
                body { background: #f0f2f5; font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
                .login-box { background: white; padding: 40px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); width: 300px; }
                h2 { text-align: center; color: #333; margin-bottom: 20px; }
                input { width: 100%; padding: 10px; margin: 10px 0; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; }
                button { width: 100%; padding: 10px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; }
                button:hover { background: #0056b3; }
                .logo { text-align: center; margin-bottom: 20px; color: #007bff; font-size: 24px; font-weight: bold; }
            </style>
        </head>
        <body>
            <div class="login-box">
                <div class="logo">Admin Portal</div>
                <form action="/login" method="POST">
                    <input type="text" name="username" placeholder="Username" required>
                    <input type="password" name="password" placeholder="Password" required>
                    <button type="submit">Sign In</button>
                </form>
            </div>
        </body>
        </html>
    `);
});

app.post('/login', (req, res) => {
    logInteraction(req, 'login_attempt', {
        username: req.body.username,
        password: req.body.password
    });

    // Simulate slight delay then failure
    setTimeout(() => {
        res.send(`
            <script>
                alert('Invalid credentials. Access logged.');
                window.location.href = '/';
            </script>
        `);
    }, 1000);
});

// Catch all
app.use((req, res) => {
    logInteraction(req, 'scan', { path: req.path, method: req.method });
    res.status(404).send('Not Found');
});

app.listen(PORT, () => {
    console.log(`Web Trap "${TRAP_NAME}" running on port ${PORT}`);
});
