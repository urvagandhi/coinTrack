// src/components/TotpSetup.jsx
'use client';

import { AuthAlert } from '@/components/auth/AuthAlert';
import { AuthSubmitButton } from '@/components/auth/AuthSubmitButton';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowRight, Check, CheckCircle2, Copy, Download, ShieldCheck } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

export default function TotpSetup({ onComplete, onCancel, isMandatory = false, setupAction, verifyAction }) {
    const { setupTotp, verifyTotpSetup, user } = useAuth();
    const [step, setStep] = useState('init');
    const [setupData, setSetupData] = useState(null);
    const [verificationCode, setVerificationCode] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [backupCodes, setBackupCodes] = useState([]);
    const [copied, setCopied] = useState(false);
    const inputRefs = useRef([]);

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

    const steps = ['Initialize', 'Scan & verify', 'Backup codes'];
    const stepIndex = step === 'init' ? 0 : step === 'scan' ? 1 : 2;

    return (
        <div className="w-full space-y-7">
            {/* Editorial step indicator */}
            <div className="grid grid-cols-3 gap-3">
                {steps.map((label, i) => (
                    <div key={label} className="flex flex-col gap-1.5">
                        <div className="flex items-baseline gap-1.5">
                            <span className={`display-num text-[11px] ${i <= stepIndex ? 'text-foreground' : 'text-muted-foreground'}`}>
                                {String(i + 1).padStart(2, '0')}
                            </span>
                            {i < stepIndex && <Check size={11} className="text-[hsl(var(--gain))]" />}
                        </div>
                        <div className={`h-[2px] ${i <= stepIndex ? 'bg-foreground' : 'bg-hairline'}`} />
                        <p className={`text-[10px] uppercase tracking-[0.2em] ${i === stepIndex ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                            {label}
                        </p>
                    </div>
                ))}
            </div>

            {/* ── STEP: Init ── */}
            {step === 'init' && (
                <div className="space-y-6">
                    <div className="flex items-start gap-4 border-l-2 border-[hsl(var(--accent))] bg-[hsl(var(--accent)/0.08)] px-4 py-4">
                        <ShieldCheck size={20} className="text-[hsl(var(--accent))] flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="eyebrow mb-1" style={{ color: 'hsl(var(--accent))' }}>Two-factor authentication</p>
                            <p className="text-[13px] text-foreground leading-snug">
                                You will need an authenticator app such as Google Authenticator, Authy, or 1Password.
                            </p>
                            {isMandatory && (
                                <p className="mt-2 text-[11px] font-mono text-[hsl(var(--chart-4))]">
                                    * 2FA is mandatory for all CoinTrack accounts.
                                </p>
                            )}
                        </div>
                    </div>

                    <AuthAlert type="error" message={error} />

                    <div className="flex flex-col sm:flex-row gap-2">
                        {!isMandatory && (
                            <button
                                type="button"
                                onClick={onCancel}
                                className="ed-btn ed-btn-ghost flex-1 h-11"
                            >
                                Cancel
                            </button>
                        )}
                        <AuthSubmitButton
                            type="button"
                            isLoading={loading}
                            onClick={startSetup}
                            className="flex-1"
                        >
                            {loading ? 'Initializing…' : 'Begin Setup'}
                        </AuthSubmitButton>
                    </div>
                </div>
            )}

            {/* ── STEP: Scan QR ── */}
            {step === 'scan' && (
                <div className="space-y-6">
                    {setupData?.qrCodeBase64 && (
                        <div className="flex justify-center">
                            <div className="bg-white p-3 border border-hairline">
                                <img src={setupData.qrCodeBase64} alt="QR Code" className="w-44 h-44" />
                            </div>
                        </div>
                    )}

                    <div className="space-y-2">
                        <p className="eyebrow">Manual entry secret</p>
                        <div className="flex items-stretch gap-0 border border-hairline">
                            <code className="flex-1 font-mono text-[13px] bg-muted/40 px-3 py-2.5 tracking-widest text-foreground break-all">
                                {setupData?.secret}
                            </code>
                            <button
                                type="button"
                                onClick={() => copyToClipboard(setupData?.secret)}
                                className="px-3 border-l border-hairline text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                                aria-label="Copy secret"
                            >
                                {copied ? <Check size={15} className="text-[hsl(var(--gain))]" /> : <Copy size={15} />}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <p className="eyebrow-strong">Enter 6-digit code</p>
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
                                    className="w-11 h-12 text-center text-[18px] font-mono border border-hairline bg-transparent text-foreground focus:outline-none focus:border-[hsl(var(--accent))] focus:ring-1 focus:ring-[hsl(var(--accent))] transition-colors"
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
                        {loading ? 'Verifying…' : 'Verify Code'}
                    </AuthSubmitButton>
                </div>
            )}

            {/* ── STEP: Backup codes ── */}
            {step === 'backup' && (
                <div className="space-y-6">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 size={18} className="text-[hsl(var(--gain))]" />
                        <span className="eyebrow text-[hsl(var(--gain))]">Setup complete</span>
                    </div>

                    <div>
                        <p className="font-serif text-[22px] text-foreground leading-snug">Save your backup codes</p>
                        <p className="text-[13px] text-muted-foreground mt-1.5 leading-relaxed">
                            Use these if you lose access to your authenticator app. Each code works once.
                        </p>
                    </div>

                    <div className="border-l-2 border-[hsl(var(--chart-4))] bg-[hsl(var(--chart-4)/0.08)] px-4 py-3">
                        <p className="eyebrow text-[hsl(var(--chart-4))] mb-1">Notice</p>
                        <p className="text-[12px] text-foreground leading-snug">
                            These codes will only be shown once. Save them now.
                        </p>
                    </div>

                    <div className="border border-hairline bg-muted/30 p-4 grid grid-cols-2 gap-2">
                        {backupCodes.map((code, i) => (
                            <div
                                key={i}
                                className="font-mono text-[13px] bg-background border border-hairline px-2 py-1.5 text-center text-foreground flex items-center justify-center gap-2"
                            >
                                <span className="display-num text-[9px] text-muted-foreground">{String(i + 1).padStart(2, '0')}</span>
                                <span>{code}</span>
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => copyToClipboard(backupCodes.join('\n'))}
                            className="ed-btn ed-btn-ghost flex-1 h-10"
                        >
                            <Copy size={13} />
                            Copy
                        </button>
                        <button
                            type="button"
                            onClick={downloadBackupCodes}
                            className="ed-btn ed-btn-info flex-1 h-10"
                        >
                            <Download size={13} />
                            Download .txt
                        </button>
                    </div>

                    <AuthSubmitButton type="button" isLoading={false} onClick={finishSetup}>
                        Continue
                        <ArrowRight size={14} />
                    </AuthSubmitButton>
                </div>
            )}
        </div>
    );
}
