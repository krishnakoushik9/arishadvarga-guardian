'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Shield, Upload, Camera, Puzzle, CheckCircle, AlertTriangle, ArrowRight, X, RefreshCw } from 'lucide-react';
import styles from './VerificationModal.module.css';

interface VerificationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onVerified: () => void;
}

type Step = 'intro' | 'id-upload' | 'webcam' | 'puzzle' | 'complete';

export default function VerificationModal({ isOpen, onClose, onVerified }: VerificationModalProps) {
    const [currentStep, setCurrentStep] = useState<Step>('intro');
    const [idImage, setIdImage] = useState<string | null>(null);
    const [selfieImage, setSelfieImage] = useState<string | null>(null);
    const [puzzleAnswer, setPuzzleAnswer] = useState('');
    const [puzzleNumbers, setPuzzleNumbers] = useState([0, 0, 0]);
    const [isVerifying, setIsVerifying] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Generate random puzzle
    const generatePuzzle = useCallback(() => {
        const nums = [
            Math.floor(Math.random() * 9) + 1,
            Math.floor(Math.random() * 9) + 1,
            Math.floor(Math.random() * 9) + 1,
        ];
        setPuzzleNumbers(nums);
        setPuzzleAnswer('');
    }, []);

    // Handle ID upload
    const handleIdUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setIdImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    // Start webcam
    const startWebcam = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            setError('Could not access webcam. Please ensure camera permissions are granted.');
        }
    };

    // Capture selfie
    const captureSelfie = () => {
        if (videoRef.current && canvasRef.current) {
            const context = canvasRef.current.getContext('2d');
            if (context) {
                canvasRef.current.width = videoRef.current.videoWidth;
                canvasRef.current.height = videoRef.current.videoHeight;
                context.drawImage(videoRef.current, 0, 0);
                setSelfieImage(canvasRef.current.toDataURL('image/jpeg'));

                // Stop webcam
                const stream = videoRef.current.srcObject as MediaStream;
                stream?.getTracks().forEach(track => track.stop());
            }
        }
    };

    // Verify ID with Gemini
    const verifyId = async () => {
        setIsVerifying(true);
        setError(null);

        // Simulate verification (in production, call Gemini API)
        await new Promise(resolve => setTimeout(resolve, 2000));

        // For demo purposes, always succeed if an image was uploaded
        if (idImage) {
            setIsVerifying(false);
            setCurrentStep('webcam');
            startWebcam();
        } else {
            setError('Please upload a valid government ID.');
            setIsVerifying(false);
        }
    };

    // Verify selfie
    const verifySelfie = async () => {
        setIsVerifying(true);
        setError(null);

        // Simulate verification
        await new Promise(resolve => setTimeout(resolve, 1500));

        if (selfieImage) {
            setIsVerifying(false);
            generatePuzzle();
            setCurrentStep('puzzle');
        } else {
            setError('Please capture a selfie.');
            setIsVerifying(false);
        }
    };

    // Verify puzzle
    const verifyPuzzle = () => {
        const correctAnswer = puzzleNumbers[0] + puzzleNumbers[1] + puzzleNumbers[2];
        if (parseInt(puzzleAnswer) === correctAnswer) {
            setCurrentStep('complete');
            setTimeout(() => {
                onVerified();
                onClose();
            }, 2000);
        } else {
            setError('Incorrect answer. Please try again.');
            generatePuzzle();
        }
    };

    if (!isOpen) return null;

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <button className={styles.closeBtn} onClick={onClose}>
                    <X size={20} />
                </button>

                {/* Step Indicator */}
                <div className={styles.stepIndicator}>
                    <div className={`${styles.step} ${currentStep !== 'intro' ? styles.completed : styles.active}`}>
                        <span>1</span>
                        <p>ID Scan</p>
                    </div>
                    <div className={`${styles.step} ${currentStep === 'puzzle' || currentStep === 'complete' ? styles.completed : currentStep === 'webcam' ? styles.active : ''}`}>
                        <span>2</span>
                        <p>Webcam</p>
                    </div>
                    <div className={`${styles.step} ${currentStep === 'complete' ? styles.completed : currentStep === 'puzzle' ? styles.active : ''}`}>
                        <span>3</span>
                        <p>Puzzle</p>
                    </div>
                </div>

                {/* Intro */}
                {currentStep === 'intro' && (
                    <div className={styles.content}>
                        <Shield size={48} className={styles.mainIcon} />
                        <h2>Unlock Offensive Tools</h2>
                        <p>
                            To access offensive security tools, you must complete a 3-step verification process.
                            This ensures only authorized personnel can use these powerful capabilities.
                        </p>
                        <div className={styles.steps}>
                            <div className={styles.stepInfo}><Upload size={20} /> Submit a scanned government ID</div>
                            <div className={styles.stepInfo}><Camera size={20} /> Take a webcam photo for audit</div>
                            <div className={styles.stepInfo}><Puzzle size={20} /> Solve a simple puzzle</div>
                        </div>
                        <button className={styles.primaryBtn} onClick={() => setCurrentStep('id-upload')}>
                            Begin Verification <ArrowRight size={18} />
                        </button>
                    </div>
                )}

                {/* ID Upload */}
                {currentStep === 'id-upload' && (
                    <div className={styles.content}>
                        <Upload size={48} className={styles.mainIcon} />
                        <h2>Step 1: Government ID Scan</h2>
                        <p>Upload a clear photo of your government-issued ID (passport, driver's license, etc.)</p>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleIdUpload}
                            className={styles.hiddenInput}
                        />

                        {idImage ? (
                            <div className={styles.previewContainer}>
                                <img src={idImage} alt="ID Preview" className={styles.preview} />
                                <button className={styles.retakeBtn} onClick={() => setIdImage(null)}>
                                    <RefreshCw size={14} /> Retake
                                </button>
                            </div>
                        ) : (
                            <button
                                className={styles.uploadBtn}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Upload size={24} />
                                <span>Click or drag to upload</span>
                            </button>
                        )}

                        {error && <p className={styles.error}><AlertTriangle size={14} /> {error}</p>}

                        <button
                            className={styles.primaryBtn}
                            onClick={verifyId}
                            disabled={!idImage || isVerifying}
                        >
                            {isVerifying ? 'Verifying...' : 'Verify ID'} <ArrowRight size={18} />
                        </button>
                    </div>
                )}

                {/* Webcam */}
                {currentStep === 'webcam' && (
                    <div className={styles.content}>
                        <Camera size={48} className={styles.mainIcon} />
                        <h2>Step 2: Webcam Verification</h2>
                        <p>Take a clear photo of yourself for audit purposes.</p>

                        {selfieImage ? (
                            <div className={styles.previewContainer}>
                                <img src={selfieImage} alt="Selfie Preview" className={styles.preview} />
                                <button className={styles.retakeBtn} onClick={() => { setSelfieImage(null); startWebcam(); }}>
                                    <RefreshCw size={14} /> Retake
                                </button>
                            </div>
                        ) : (
                            <div className={styles.webcamContainer}>
                                <video ref={videoRef} autoPlay playsInline className={styles.video} />
                                <button className={styles.captureBtn} onClick={captureSelfie}>
                                    <Camera size={24} />
                                </button>
                            </div>
                        )}
                        <canvas ref={canvasRef} className={styles.hiddenCanvas} />

                        {error && <p className={styles.error}><AlertTriangle size={14} /> {error}</p>}

                        <button
                            className={styles.primaryBtn}
                            onClick={verifySelfie}
                            disabled={!selfieImage || isVerifying}
                        >
                            {isVerifying ? 'Processing...' : 'Continue'} <ArrowRight size={18} />
                        </button>
                    </div>
                )}

                {/* Puzzle */}
                {currentStep === 'puzzle' && (
                    <div className={styles.content}>
                        <Puzzle size={48} className={styles.mainIcon} />
                        <h2>Step 3: Solve the Puzzle</h2>
                        <p>Please solve this simple math problem:</p>

                        <div className={styles.puzzleBox}>
                            <span className={styles.puzzleQuestion}>
                                {puzzleNumbers[0]} + {puzzleNumbers[1]} + {puzzleNumbers[2]} = ?
                            </span>
                            <input
                                type="number"
                                value={puzzleAnswer}
                                onChange={(e) => setPuzzleAnswer(e.target.value)}
                                className={styles.puzzleInput}
                                placeholder="Enter answer"
                            />
                        </div>

                        {error && <p className={styles.error}><AlertTriangle size={14} /> {error}</p>}

                        <button
                            className={styles.primaryBtn}
                            onClick={verifyPuzzle}
                            disabled={!puzzleAnswer}
                        >
                            Submit Answer <ArrowRight size={18} />
                        </button>
                    </div>
                )}

                {/* Complete */}
                {currentStep === 'complete' && (
                    <div className={styles.content}>
                        <CheckCircle size={64} className={styles.successIcon} />
                        <h2>Verification Complete!</h2>
                        <p>You now have access to offensive security tools. Your verification has been logged for audit purposes.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
