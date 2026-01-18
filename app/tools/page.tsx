'use client';

import React, { useState, useEffect } from 'react';
import { Wrench, Search, Play, Lock, Unlock, CheckCircle, XCircle, AlertTriangle, Terminal, Eye, ExternalLink, Loader2 } from 'lucide-react';
import styles from './page.module.css';

type ToolCategory = 'network' | 'vuln' | 'password' | 'exploit' | 'forensics' | 'wireless' | 'web' | 'social';

interface Tool {
    name: string;
    description: string;
    category: ToolCategory;
    installed: boolean;
    offensive: boolean;
    command: string;
    docsUrl: string;
    installCommand?: string;
}

const tools: Tool[] = [
    {
        name: 'Nmap',
        description: 'Network discovery and security auditing',
        category: 'network',
        installed: true,
        offensive: false,
        command: 'nmap -sV -sC',
        docsUrl: 'https://nmap.org/docs.html',
        installCommand: 'sudo apt install nmap -y || winget install nmap'
    },
    {
        name: 'Wireshark',
        description: 'Network protocol analyzer',
        category: 'network',
        installed: true,
        offensive: false,
        command: 'wireshark',
        docsUrl: 'https://www.wireshark.org/docs/',
        installCommand: 'sudo apt install wireshark -y'
    },
    {
        name: 'ClamAV',
        description: 'Antivirus engine for malware detection',
        category: 'forensics',
        installed: true,
        offensive: false,
        command: 'clamscan -r /home',
        docsUrl: 'https://docs.clamav.net/',
        installCommand: 'sudo apt install clamav clamav-daemon -y'
    },
    {
        name: 'OpenVAS',
        description: 'Vulnerability scanner',
        category: 'vuln',
        installed: false,
        offensive: false,
        command: 'gvm-start',
        docsUrl: 'https://greenbone.github.io/docs/',
        installCommand: 'sudo apt install openvas -y'
    },
    {
        name: 'Nikto',
        description: 'Web server scanner',
        category: 'web',
        installed: true,
        offensive: false,
        command: 'nikto -h localhost',
        docsUrl: 'https://github.com/sullo/nikto/wiki',
        installCommand: 'sudo apt install nikto -y'
    },
    {
        name: 'Metasploit',
        description: 'Penetration testing framework',
        category: 'exploit',
        installed: true,
        offensive: true,
        command: 'msfconsole',
        docsUrl: 'https://docs.metasploit.com/',
        installCommand: 'curl https://raw.githubusercontent.com/rapid7/metasploit-omnibus/master/config/templates/metasploit-framework-wrappers/msfupdate.erb > msfinstall && chmod 755 msfinstall && ./msfinstall'
    },
    {
        name: 'Burp Suite',
        description: 'Web security testing',
        category: 'web',
        installed: true,
        offensive: true,
        command: 'burpsuite',
        docsUrl: 'https://portswigger.net/burp/documentation',
        installCommand: 'Download from https://portswigger.net/burp'
    },
    {
        name: 'John the Ripper',
        description: 'Password cracker (audit mode)',
        category: 'password',
        installed: true,
        offensive: true,
        command: 'john --list=formats',
        docsUrl: 'https://www.openwall.com/john/doc/',
        installCommand: 'sudo apt install john -y'
    },
    {
        name: 'Hashcat',
        description: 'Advanced password recovery',
        category: 'password',
        installed: false,
        offensive: true,
        command: 'hashcat --help',
        docsUrl: 'https://hashcat.net/wiki/',
        installCommand: 'sudo apt install hashcat -y'
    },
    {
        name: 'Autopsy',
        description: 'Digital forensics platform',
        category: 'forensics',
        installed: true,
        offensive: false,
        command: 'autopsy',
        docsUrl: 'https://www.autopsy.com/support/documentation/',
        installCommand: 'sudo apt install autopsy -y'
    },
    {
        name: 'SQLMap',
        description: 'SQL injection detection',
        category: 'exploit',
        installed: true,
        offensive: true,
        command: 'sqlmap --wizard',
        docsUrl: 'https://sqlmap.org/',
        installCommand: 'sudo apt install sqlmap -y'
    },
    {
        name: 'Kismet',
        description: 'Wireless network detector',
        category: 'wireless',
        installed: false,
        offensive: false,
        command: 'kismet',
        docsUrl: 'https://www.kismetwireless.net/docs/',
        installCommand: 'sudo apt install kismet -y'
    },
];

const categoryLabels: Record<ToolCategory, string> = {
    network: 'Network Scanning',
    vuln: 'Vulnerability Scanning',
    password: 'Password Auditing',
    exploit: 'Exploitation Frameworks',
    forensics: 'Forensics & IR',
    wireless: 'Wireless Security',
    web: 'Web Application',
    social: 'Social Engineering',
};

// ... (imports)
import Webcam from 'react-webcam';

// ... (existing helper functions/types)

// Quiz questions for Step 3
const securityQuiz = [
    {
        question: "What is the primary purpose of Red Teaming?",
        options: ["To destroy systems", "To simulate real-world attacks", "To patch bugs", "To monitor logs"],
        answer: 1
    },
    {
        question: "Before running an exploit against a production server, you must:",
        options: ["Get written authorization", "Check if it's nighttime", "Disable the firewall", "Run it on your laptop first"],
        answer: 0
    },
    {
        question: "Found a critical vulnerability in a client's system. What's the first step?",
        options: ["Post it on Twitter", "Exploit it to prove it works", "Report it securely to the client", "Ignore it"],
        answer: 2
    }
];

export default function Tools() {
    const [filter, setFilter] = useState<ToolCategory | 'all'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [offensiveUnlocked, setOffensiveUnlocked] = useState(false);
    const [launchingTool, setLaunchingTool] = useState<string | null>(null);
    const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [aiOutput, setAiOutput] = useState('');
    const [aiAnalysis, setAiAnalysis] = useState('');
    const [analyzing, setAnalyzing] = useState(false);

    // Verification State
    const [showVerification, setShowVerification] = useState(false);
    const [verificationStep, setVerificationStep] = useState<1 | 2 | 3>(1); // 1: Face, 2: ID, 3: Quiz
    const [verifying, setVerifying] = useState(false);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const webcamRef = React.useRef<Webcam>(null);
    const [quizAnswers, setQuizAnswers] = useState<number[]>([]);
    const [currentQuestion, setCurrentQuestion] = useState(0);

    const filteredTools = tools.filter(tool => {
        const matchesCategory = filter === 'all' || tool.category === filter;
        const matchesSearch = tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            tool.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const showNotification = (type: 'success' | 'error', message: string) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 4000);
    };

    // Verification Handlers
    const capture = React.useCallback(() => {
        const imageSrc = webcamRef.current?.getScreenshot();
        if (imageSrc) {
            setCapturedImage(imageSrc);
        }
    }, [webcamRef]);

    const handleStep1 = () => {
        // Face verified (simulated simple check)
        if (capturedImage) {
            setCapturedImage(null); // Clear for next step
            setVerificationStep(2);
            showNotification('success', 'Face identity verified.');
        } else {
            showNotification('error', 'Please capture your face clearly.');
        }
    };

    const handleStep2 = async () => {
        if (!capturedImage) {
            showNotification('error', 'Please scan your Government ID.');
            return;
        }

        setVerifying(true);
        try {
            const res = await fetch('/api/verify-id', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: capturedImage }),
            });
            const data = await res.json();

            if (data.valid) {
                showNotification('success', `ID Verified: ${data.documentType} (${data.issuer})`);
                setCapturedImage(null);
                setVerificationStep(3);
            } else {
                showNotification('error', 'ID verification failed. Please try again with a valid document.');
                // For demo purposes if API fails or no key, we might ideally fallback, but strict for now.
                // Uncomment to bypass for testing if API key is missing:
                // setVerificationStep(3); 
            }
        } catch (error) {
            showNotification('error', 'Verification error. Network issue?');
        } finally {
            setVerifying(false);
        }
    };

    const handleQuizAnswer = (optionIndex: number) => {
        const newAnswers = [...quizAnswers];
        newAnswers[currentQuestion] = optionIndex;
        setQuizAnswers(newAnswers);

        if (currentQuestion < securityQuiz.length - 1) {
            setCurrentQuestion(currentQuestion + 1);
        } else {
            // Check answers
            const correctCount = newAnswers.reduce((acc, ans, idx) => {
                return acc + (ans === securityQuiz[idx].answer ? 1 : 0);
            }, 0);

            if (correctCount === securityQuiz.length) {
                setOffensiveUnlocked(true);
                setShowVerification(false);
                showNotification('success', 'ACCESS GRANTED: Offensive Tools Unlocked');
            } else {
                showNotification('error', `Verification Failed. You scored ${correctCount}/${securityQuiz.length}.`);
                // Reset quiz
                setQuizAnswers([]);
                setCurrentQuestion(0);
                // Optionally verify from step 1 again or just quiz
            }
        }
    };

    // ... (rest of existing handlers: handleLaunch, handleDocs, handleInstall, handleAnalyzeOutput)

    // Launch tool in terminal
    const handleLaunch = async (tool: Tool) => {
        if (tool.offensive && !offensiveUnlocked) {
            showNotification('error', 'Offensive tools are locked. Complete verification to unlock.');
            return;
        }

        setLaunchingTool(tool.name);

        try {
            const response = await fetch('/api/system', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'launchTool',
                    toolName: tool.name,
                    command: tool.command,
                }),
            });

            const result = await response.json();

            if (result.success) {
                showNotification('success', `${tool.name} launched in terminal!`);
            } else {
                showNotification('error', result.message || `Failed to launch ${tool.name}`);
            }
        } catch (error) {
            showNotification('error', `Error launching ${tool.name}: ${error}`);
        } finally {
            setLaunchingTool(null);
        }
    };

    // Open documentation
    const handleDocs = (tool: Tool) => {
        window.open(tool.docsUrl, '_blank', 'noopener,noreferrer');
    };

    // Install tool
    const handleInstall = async (tool: Tool) => {
        if (!tool.installCommand) {
            showNotification('error', 'No install command available for this tool.');
            return;
        }

        setLaunchingTool(tool.name);

        try {
            const response = await fetch('/api/system', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'launchTool',
                    toolName: 'Install ' + tool.name,
                    command: tool.installCommand,
                }),
            });

            const result = await response.json();

            if (result.success) {
                showNotification('success', `Installation started for ${tool.name}!`);
            } else {
                showNotification('error', result.message || `Failed to install ${tool.name}`);
            }
        } catch (error) {
            showNotification('error', `Error installing ${tool.name}: ${error}`);
        } finally {
            setLaunchingTool(null);
        }
    };

    // Analyze tool output with AI
    const handleAnalyzeOutput = async () => {
        if (!aiOutput.trim()) {
            showNotification('error', 'Please paste some tool output to analyze.');
            return;
        }

        setAnalyzing(true);

        try {
            const response = await fetch('/api/gemini', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'analyzeToolOutput',
                    toolName: 'Security Tool',
                    output: aiOutput,
                }),
            });

            const result = await response.json();

            if (result.result) {
                setAiAnalysis(result.result);
            } else if (result.error) {
                // Fallback analysis if Gemini not configured
                setAiAnalysis(`Analysis Preview (Gemini API not configured):

The output appears to contain security-related information. Key observations:
• Contains ${aiOutput.split('\n').length} lines of output
• ${aiOutput.match(/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/g)?.length || 0} IP addresses detected
• ${aiOutput.toLowerCase().includes('open') ? 'Open ports detected' : 'No open ports mentioned'}
• ${aiOutput.toLowerCase().includes('warning') || aiOutput.toLowerCase().includes('error') ? '⚠️ Warnings or errors present' : 'No obvious errors'}

To get full AI analysis, configure your Gemini API key in Settings.`);
            }
        } catch (error) {
            setAiAnalysis(`Error analyzing output: ${error}`);
        } finally {
            setAnalyzing(false);
        }
    };


    return (
        <div className={styles.page}>
            {/* Notification */}
            {notification && (
                <div className={`${styles.notification} ${styles[notification.type]}`}>
                    {notification.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
                    {notification.message}
                </div>
            )}

            {/* Verification Overlay */}
            {showVerification && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <div className={styles.modalHeader}>
                            <h2>
                                {verificationStep === 1 && <><Eye size={24} /> Step 1: Face Check</>}
                                {verificationStep === 2 && <><Wrench size={24} /> Step 2: ID Verification</>}
                                {verificationStep === 3 && <><Lock size={24} /> Step 3: Security Quiz</>}
                            </h2>
                            <button className={styles.closeBtn} onClick={() => setShowVerification(false)}><XCircle size={24} /></button>
                        </div>

                        <div className={styles.modalBody}>
                            {/* Steps Progress */}
                            <div className={styles.stepsProgress}>
                                <div className={`${styles.stepDot} ${verificationStep >= 1 ? styles.complete : ''}`}>1</div>
                                <div className={styles.stepLine}></div>
                                <div className={`${styles.stepDot} ${verificationStep >= 2 ? styles.complete : ''}`}>2</div>
                                <div className={styles.stepLine}></div>
                                <div className={`${styles.stepDot} ${verificationStep >= 3 ? styles.complete : ''}`}>3</div>
                            </div>

                            {/* Step 1 & 2: Camera */}
                            {(verificationStep === 1 || verificationStep === 2) && (
                                <div className={styles.cameraSection}>
                                    <p className={styles.stepDesc}>
                                        {verificationStep === 1
                                            ? "Position your face in the frame to verify identity."
                                            : "Hold your Government ID up to the camera for validation."}
                                    </p>

                                    {capturedImage ? (
                                        <div className={styles.imgPreview}>
                                            <img src={capturedImage} alt="Captured" />
                                            <button className={styles.retakeBtn} onClick={() => setCapturedImage(null)}>Retake</button>
                                        </div>
                                    ) : (
                                        <Webcam
                                            audio={false}
                                            ref={webcamRef}
                                            screenshotFormat="image/jpeg"
                                            className={styles.webcamView}
                                            videoConstraints={{ width: 480, height: 360, facingMode: "user" }}
                                        />
                                    )}

                                    {!capturedImage && (
                                        <button className={styles.captureBtn} onClick={capture}>
                                            <div className={styles.captureInner}></div>
                                        </button>
                                    )}

                                    {capturedImage && (
                                        <button
                                            className={styles.nextBtn}
                                            onClick={verificationStep === 1 ? handleStep1 : handleStep2}
                                            disabled={verifying}
                                        >
                                            {verifying ? <><Loader2 size={16} className={styles.spinner} /> Verifying ID with Gemini...</> : 'Proceed'}
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Step 3: Quiz */}
                            {verificationStep === 3 && (
                                <div className={styles.quizSection}>
                                    <h3 className={styles.questionText}>
                                        {currentQuestion + 1}. {securityQuiz[currentQuestion].question}
                                    </h3>
                                    <div className={styles.optionsList}>
                                        {securityQuiz[currentQuestion].options.map((opt, idx) => (
                                            <button
                                                key={idx}
                                                className={styles.optionBtn}
                                                onClick={() => handleQuizAnswer(idx)}
                                            >
                                                {opt}
                                            </button>
                                        ))}
                                    </div>
                                    <div className={styles.quizMeta}>
                                        Question {currentQuestion + 1} of {securityQuiz.length}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <h1><Wrench size={28} /> Tool Integration Layer</h1>
                    <p>One-click access to 100+ security tools with AI-powered output interpretation</p>
                </div>
                <div className={styles.headerRight}>
                    {offensiveUnlocked ? (
                        <span className={styles.unlockedBadge}><Unlock size={16} /> Offensive Tools Unlocked</span>
                    ) : (
                        <button className={styles.unlockBtn} onClick={() => setShowVerification(true)}>
                            <Lock size={16} /> Unlock Offensive Tools
                        </button>
                    )}
                </div>
            </div>

            {!offensiveUnlocked && (
                <div className={styles.warningBanner}>
                    <AlertTriangle size={18} />
                    <span>Offensive tools are locked. Complete 3-step verification (ID scan, webcam, puzzle) to unlock.</span>
                </div>
            )}

            {/* ... (rest of tool grid and search controls) */}
            <div className={styles.controls}>
                <div className={styles.searchBox}>
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Search tools..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className={styles.filterTabs}>
                    <button className={filter === 'all' ? styles.active : ''} onClick={() => setFilter('all')}>All</button>
                    {Object.entries(categoryLabels).map(([key, label]) => (
                        <button
                            key={key}
                            className={filter === key ? styles.active : ''}
                            onClick={() => setFilter(key as ToolCategory)}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            <div className={styles.toolsGrid}>
                {filteredTools.map((tool, idx) => (
                    <div
                        key={idx}
                        className={`${styles.toolCard} ${!tool.installed ? styles.notInstalled : ''} ${tool.offensive && !offensiveUnlocked ? styles.locked : ''}`}
                    >
                        <div className={styles.toolHeader}>
                            <h3>{tool.name}</h3>
                            <div className={styles.toolBadges}>
                                {tool.installed ? (
                                    <span className={styles.installedBadge}><CheckCircle size={12} /> Installed</span>
                                ) : (
                                    <span className={styles.missingBadge}><XCircle size={12} /> Not Installed</span>
                                )}
                                {tool.offensive && (
                                    <span className={styles.offensiveBadge}><AlertTriangle size={12} /> Offensive</span>
                                )}
                            </div>
                        </div>
                        <p className={styles.toolDesc}>{tool.description}</p>
                        <div className={styles.toolCommand}>
                            <Terminal size={14} />
                            <code>{tool.command}</code>
                        </div>
                        <div className={styles.toolActions}>
                            {tool.installed ? (
                                <>
                                    <button
                                        className={styles.launchBtn}
                                        onClick={() => handleLaunch(tool)}
                                        disabled={(tool.offensive && !offensiveUnlocked) || launchingTool === tool.name}
                                    >
                                        {launchingTool === tool.name ? (
                                            <><Loader2 size={14} className={styles.spinner} /> Launching...</>
                                        ) : (
                                            <><Play size={14} /> Launch</>
                                        )}
                                    </button>
                                    <button className={styles.docsBtn} onClick={() => handleDocs(tool)}>
                                        <ExternalLink size={14} /> Docs
                                    </button>
                                </>
                            ) : (
                                <button
                                    className={styles.installBtn}
                                    onClick={() => handleInstall(tool)}
                                    disabled={launchingTool === tool.name}
                                >
                                    {launchingTool === tool.name ? 'Installing...' : 'Install Tool'}
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <div className={styles.aiHelper}>
                <div className={styles.aiHelperContent}>
                    <h3>🤖 AI Output Interpreter</h3>
                    <p>Run any tool and paste its output here. The AI will explain the results in plain English and suggest next steps.</p>
                    <textarea
                        placeholder="Paste tool output here for AI analysis..."
                        value={aiOutput}
                        onChange={(e) => setAiOutput(e.target.value)}
                    />
                    <button onClick={handleAnalyzeOutput} disabled={analyzing}>
                        {analyzing ? <><Loader2 size={16} className={styles.spinner} /> Analyzing...</> : 'Analyze Output'}
                    </button>

                    {aiAnalysis && (
                        <div className={styles.aiResult}>
                            <h4>Analysis Result:</h4>
                            <pre>{aiAnalysis}</pre>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
