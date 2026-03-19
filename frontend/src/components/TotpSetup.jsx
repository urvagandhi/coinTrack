// src/components/TotpSetup.jsx
'use client';

import { AuthAlert } from '@/components/auth/AuthAlert';
import { AuthSubmitButton } from '@/components/auth/AuthSubmitButton';
import { useAuth } from '@/contexts/AuthContext';
import { itemVariants, useMotionVariants } from '@/lib/motion';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Check, CheckCircle2, Copy, Download, ShieldCheck } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

export default function TotpSetup({ onComplete, onCancel, isMandatory = false, setupAction, verifyAction }) {
    const { setupTotp, verifyTotpSetup, user } = useAuth();
    const [step, setStep] = useState('init'); // init, scan, backup
    const [setupData, setSetupData] = useState(null);
    const [verificationCode, setVerificationCode] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [backupCodes, setBackupCodes] = useState([]);
    const [copied, setCopied] = useState(false);
    const inputRefs = useRef([]);
    const item = useMotionVariants(itemVariants);

    const performSetup = setupAction || setupTotp;
    const performVerify = verifyAction || verifyTotpSetup;

    const startSetup = async () => {
        setLoading(true);
        setError('');
        const result = await performSetup();
        setLoading(false);

        if (result.success) {
            setSetupData(result.data);
            setStep('scan');
        } else {
            setError(result.error);
        }
    };

    const verifyCode = useCallback(async () => {
        if (verificationCode.length !== 6) {
            setError('Code must be 6 digits');
            return;
        }
        if (loading) return;
        setLoading(true);
        setError('');
        const result = await performVerify(verificationCode);
        setLoading(false);

        if (result.success) {
            setBackupCodes(result.backupCodes || []);
            setStep('backup');
        } else {
            setError(result.error);
            setVerificationCode('');
        }
    }, [verificationCode, loading, performVerify]);

    useEffect(() => {
        if (verificationCode.length === 6 && !loading && step === 'scan') {
            verifyCode();
        }
    }, [verificationCode, loading, step, verifyCode]);

    const finishSetup = () => {
        if (onComplete) onComplete();
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const downloadBackupCodes = () => {
        const now = new Date();
        const formattedDate = now.toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });
        const content = `COINTRACK BACKUP CODES
Generated: ${formattedDate}
Total: ${backupCodes.length} codes (each can only be used once)

${backupCodes.map((code, i) => `  ${String(i + 1).padStart(2, '0')}. ${code}`).join('\n')}

IMPORTANT:
- Keep these codes in a safe place (password manager, safe)
- Do NOT share these codes with anyone
- If codes are compromised, reset your 2FA immediately

CoinTrack - Your Portfolio, Secured`;

        const element = document.createElement('a');
        const file = new Blob([content], { type: 'text/plain' });
        element.href = URL.createObjectURL(file);
        element.download = `coinTrack_backup-codes_${user?.username || 'user'}.txt`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    // Handle individual OTP box input
    const handleOtpChange = (index, value) => {
        if (!/^\d*$/.test(value)) return;
        const char = value.slice(-1);
        const newCode = verificationCode.split('');
        newCode[index] = char;
        const joined = newCode.join('').slice(0, 6);
        setVerificationCode(joined);
        if (char && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleOtpKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleOtpPaste = (e) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        setVerificationCode(pasted);
        const focusIdx = Math.min(pasted.length, 5);
        inputRefs.current[focusIdx]?.focus();
    };

    // ── Step indicator ──
    const steps = ['Setup', 'Verify', 'Backup codes'];
    const stepIndex = step === 'init' ? 0 : step === 'scan' ? 1 : 2;

    return (
        <div className="w-full space-y-6">
            {/* Step indicator */}
            <div className="flex items-center justify-between mb-2">
                {steps.map((label, i) => (
                    <div key={label} className="flex items-center">
                        {i > 0 && (
                            <div className={`flex-1 h-px w-8 sm:w-12 mx-1.5 ${i <= stepIndex ? 'bg-blue-600' : 'bg-border'}`} />
                        )}
                        <div className="flex items-center gap-1.5">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${i < stepIndex
                                    ? 'bg-green-600 text-white'
                                    : i === stepIndex
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-accent text-muted-foreground'
                                }`}>
                                {i < stepIndex ? <Check size={12} /> : i + 1}
                            </div>
                            <span className={`text-xs hidden sm:inline ${i === stepIndex ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                                {label}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            <AnimatePresence mode="wait">
                {/* ── STEP: Init ── */}
                {step === 'init' && (
                    <motion.div
                        key="init"
                        variants={item}
                        initial="hidden"
                        animate="visible"
                        exit={{ opacity: 0, y: -8 }}
                        className="space-y-5"
                    >
                        <div className="flex justify-center">
                            <div className="w-14 h-14 rounded-xl bg-blue-50 flex items-center justify-center">
                                <ShieldCheck size={28} className="text-blue-600" />
                            </div>
                        </div>
                        <div className="text-center space-y-1">
                            <p className="text-sm text-foreground">
                                You&apos;ll need an authenticator app like Google Authenticator or Authy.
                            </p>
                            {isMandatory && (
                                <p className="text-xs text-amber-600 font-medium">
                                    Two-factor authentication is required to continue.
                                </p>
                            )}
                        </div>
                        <AuthAlert type="error" message={error} />
                        <div className="flex gap-2">
                            {!isMandatory && (
                                <AuthSubmitButton
                                    type="button"
                                    variant="secondary"
                                    onClick={onCancel}
                                    isLoading={false}
                                >
                                    Cancel
                                </AuthSubmitButton>
                            )}
                            <AuthSubmitButton
                                type="button"
                                isLoading={loading}
                                onClick={startSetup}
                            >
                                {loading ? 'Initializing...' : 'Start setup'}
                            </AuthSubmitButton>
                        </div>
                    </motion.div>
                )}

                {/* ── STEP: Scan QR ── */}
                {step === 'scan' && (
                    <motion.div
                        key="scan"
                        variants={item}
                        initial="hidden"
                        animate="visible"
                        exit={{ opacity: 0, y: -8 }}
                        className="space-y-5"
                    >
                        {/* QR Code */}
                        {setupData?.qrCodeBase64 && (
                            <div className="flex justify-center">
                                <div className="bg-white p-3 rounded-xl border border-border">
                                    <img src={setupData.qrCodeBase64} alt="QR Code" className="w-44 h-44" />
                                </div>
                            </div>
                        )}

                        {/* Manual secret */}
                        <div className="space-y-1.5">
                            <p className="text-xs text-muted-foreground">Or enter this code manually:</p>
                            <div className="flex items-center gap-2">
                                <code className="flex-1 font-mono text-sm bg-accent rounded-lg px-3 py-2 tracking-widest text-foreground break-all">
                                    {setupData?.secret}
                                </code>
                                <button
                                    type="button"
                                    onClick={() => copyToClipboard(setupData?.secret)}
                                    className="p-2 rounded-lg text-muted-foreground hover:text-blue-600 hover:bg-accent transition-colors"
                                >
                                    {copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
                                </button>
                            </div>
                        </div>

                        {/* OTP input */}
                        <div className="space-y-2">
                            <p className="text-sm font-medium text-foreground">
                                Enter the 6-digit code from your app
                            </p>
                            <div className="flex gap-2 justify-center" onPaste={handleOtpPaste}>
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <input
                                        key={i}
                                        ref={(el) => { inputRefs.current[i] = el; }}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={1}
                                        value={verificationCode[i] || ''}
                                        onChange={(e) => handleOtpChange(i, e.target.value)}
                                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                                        className="w-10 h-12 text-center text-lg font-mono border border-border rounded-lg
                                                   bg-background text-foreground
                                                   focus:outline-none focus:ring-2 focus:ring-purple-600/50 focus:border-purple-600
                                                   transition-colors"
                                    />
                                ))}
                            </div>
                        </div>

                        <AuthAlert type="error" message={error} />

                        <AuthSubmitButton
                            type="button"
                            isLoading={loading}
                            disabled={verificationCode.length !== 6}
                            onClick={verifyCode}
                        >
                            {loading ? 'Verifying...' : 'Verify code'}
                        </AuthSubmitButton>
                    </motion.div>
                )}

                {/* ── STEP: Backup codes ── */}
                {step === 'backup' && (
                    <motion.div
                        key="backup"
                        variants={item}
                        initial="hidden"
                        animate="visible"
                        exit={{ opacity: 0, y: -8 }}
                        className="space-y-5"
                    >
                        <div className="flex items-center gap-2 text-green-600">
                            <CheckCircle2 size={20} />
                            <span className="text-sm font-semibold">Setup complete</span>
                        </div>

                        <div className="space-y-1">
                            <p className="text-sm text-foreground">Save your backup codes</p>
                            <p className="text-xs text-muted-foreground">
                                Use these if you lose access to your authenticator app. Each code works once.
                            </p>
                        </div>

                        <div className="border-l-4 border-amber-500 bg-amber-50 p-3 rounded-r-lg">
                            <p className="text-xs text-amber-700 font-medium">
                                These codes will only be shown once. Save them now.
                            </p>
                        </div>

                        {/* Backup codes grid */}
                        <div className="bg-accent rounded-lg p-4 grid grid-cols-2 gap-2">
                            {backupCodes.map((code, i) => (
                                <div
                                    key={i}
                                    className="font-mono text-sm bg-card rounded px-2 py-1.5 text-center text-foreground border border-border"
                                >
                                    {code}
                                </div>
                            ))}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => copyToClipboard(backupCodes.join('\n'))}
                                className="flex-1 h-9 flex items-center justify-center gap-1.5 text-sm border border-border
                                           rounded-lg text-foreground hover:bg-accent transition-colors"
                            >
                                <Copy size={14} />
                                Copy
                            </button>
                            <button
                                type="button"
                                onClick={downloadBackupCodes}
                                className="flex-1 h-9 flex items-center justify-center gap-1.5 text-sm border border-border
                                           rounded-lg text-foreground hover:bg-accent transition-colors"
                            >
                                <Download size={14} />
                                Download
                            </button>
                        </div>

                        <AuthSubmitButton type="button" isLoading={false} onClick={finishSetup}>
                            Continue
                            <ArrowRight size={14} />
                        </AuthSubmitButton>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
