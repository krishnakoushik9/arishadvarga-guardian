'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { HelpCircle, MessageCircle, Send, Shield, AlertTriangle, CheckCircle, ArrowRight, Brain } from 'lucide-react';
import styles from './page.module.css';

const prioritizedActions = [
    { priority: 1, action: 'Terminate active malicious sessions', risk: 'critical', status: 'pending', explanation: 'Active SSH session from 45.33.32.156 is currently executing commands on your server.' },
    { priority: 2, action: 'Kill suspicious processes (mimikatz.exe, nc.exe)', risk: 'critical', status: 'pending', explanation: 'These processes are actively stealing credentials and maintaining backdoor access.' },
    { priority: 3, action: 'Block outbound connection to 45.33.32.156:4444', risk: 'high', status: 'pending', explanation: 'This connection is being used for command-and-control communication.' },
    { priority: 4, action: 'Enable maintenance mode on web application', risk: 'medium', status: 'completed', explanation: 'Prevents further exploitation while you contain the threat.' },
    { priority: 5, action: 'Collect forensic evidence before cleanup', risk: 'medium', status: 'pending', explanation: 'Preserve logs and artifacts for incident investigation and legal purposes.' },
];

const chatHistory = [
    { role: 'user', message: 'What should I do first?' },
    { role: 'ai', message: 'Based on the current threat analysis, your TOP PRIORITY is to terminate the active SSH session from 45.33.32.156. This attacker is actively executing commands on your server right now. Go to the Control Room and click "Terminate Session" for the suspicious SSH connection.' },
    { role: 'user', message: 'Is it safe to just kill the process?' },
    { role: 'ai', message: 'Yes, terminating the session is safe and REVERSIBLE. The attacker will lose their current access. However, they may try to reconnect, so immediately after terminating, you should block the IP address 45.33.32.156 in your firewall. Would you like me to guide you through that process?' },
];

export default function Guidance() {

    const [message, setMessage] = useState('');
    const [history, setHistory] = useState(chatHistory);
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = React.useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    React.useEffect(() => {
        scrollToBottom();
    }, [history]);

    const handleSend = async () => {
        if (!message.trim()) return;

        const userMsg = message;
        setMessage('');

        // Add user message to history
        const newHistory = [...history, { role: 'user', message: userMsg }];
        setHistory(newHistory);
        setIsLoading(true);

        try {
            // Call API
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMsg,
                    context: history.map(h => `${h.role}: ${h.message}`).join('\n')
                }),
            });

            const data = await res.json();

            if (data.response) {
                setHistory([...newHistory, { role: 'ai', message: data.response }]);
            } else {
                // Fallback error message in UI
                setHistory([...newHistory, { role: 'ai', message: "I'm having trouble connecting to the security mainframe. Please try again." }]);
            }
        } catch (error) {
            console.error(error);
            setHistory([...newHistory, { role: 'ai', message: "Connection error. Ensure your local network is stable." }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // ... (existing helper functions) ...

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <h1><HelpCircle size={28} /> What Should I Do Now?</h1>
                <p>AI-powered guidance for non-expert administrators during active incidents</p>
            </div>

            <div className={styles.mainGrid}>
                <div className={styles.actionsSection}>
                    <h2><Shield size={20} /> Prioritized Actions</h2>
                    <p className={styles.sectionDesc}>Follow these steps in order. All actions are reversible and safe.</p>
                    <div className={styles.actionsList}>
                        {prioritizedActions.map((item) => (
                            <div key={item.priority} className={`${styles.actionItem} ${styles[item.status]} ${styles[item.risk]}`}>
                                <span className={styles.priority}>#{item.priority}</span>
                                <div className={styles.actionContent}>
                                    <h4>{item.action}</h4>
                                    <p>{item.explanation}</p>
                                </div>
                                <div className={styles.actionMeta}>
                                    <span className={`${styles.riskBadge} ${styles[item.risk]}`}>{item.risk}</span>
                                    {item.status === 'completed' ? (
                                        <span className={styles.completedBadge}><CheckCircle size={14} /> Done</span>
                                    ) : (
                                        <button className={styles.doItBtn}><ArrowRight size={14} /> Do This</button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className={styles.chatSection}>
                    <h2><Brain size={20} /> Ask the AI Assistant</h2>
                    <div className={styles.chatContainer}>
                        <div className={styles.chatHistory}>
                            {history.map((msg, idx) => (
                                <div key={idx} className={`${styles.chatMessage} ${styles[msg.role]}`}>
                                    {msg.role === 'ai' && <Brain size={18} className={styles.aiIcon} />}
                                    <div className={styles.messageContent}>
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {msg.message}
                                        </ReactMarkdown>
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className={`${styles.chatMessage} ${styles.ai}`}>
                                    <Brain size={18} className={`${styles.aiIcon} ${styles.pulse}`} />
                                    <p>Thinking...</p>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                        <div className={styles.chatInput}>
                            <input
                                type="text"
                                placeholder="Ask anything: 'What do I do next?', 'Is this safe?', 'Explain this alert'..."
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                onKeyDown={handleKeyDown}
                                disabled={isLoading}
                            />
                            <button onClick={handleSend} disabled={isLoading || !message.trim()}>
                                <Send size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className={styles.reassuranceBox}>
                <AlertTriangle size={24} />
                <div>
                    <h3>Don't Panic</h3>
                    <p>You're doing the right thing by following these steps. Every action is logged and reversible. If you're unsure, just ask the AI assistant for clarification. Help is just a message away.</p>
                </div>
            </div>
        </div>
    );
}
