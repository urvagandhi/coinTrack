import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { AlertTriangle, ArrowRight, CheckCircle2, Copy } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function TotpSetup({ onComplete, onCancel, isMandatory = false, setupAction, verifyAction }) {
    const { setupTotp, verifyTotpSetup, user } = useAuth();
    const [step, setStep] = useState('init'); // init, scan, backup
    const [setupData, setSetupData] = useState(null);
    const [verificationCode, setVerificationCode] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [backupCodes, setBackupCodes] = useState([]);

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

    const verifyCode = async () => {
        if (verificationCode.length !== 6) {
            setError('Code must be 6 digits');
            return;
        }
        if (loading) return; // Prevent double-submit
        setLoading(true);
        setError('');
        const result = await performVerify(verificationCode);
        setLoading(false);

        if (result.success) {
            setBackupCodes(result.backupCodes || []);
            setStep('backup');
        } else {
            setError(result.error);
            setVerificationCode(''); // Clear on error for retry
        }
    };

    // Auto-submit when 6 digits are entered
    useEffect(() => {
        if (verificationCode.length === 6 && !loading && step === 'scan') {
            verifyCode();
        }
    }, [verificationCode]);

    const finishSetup = () => {
        if (onComplete) onComplete();
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        // Could show a toast here
    };

    const downloadBackupCodes = () => {
        const now = new Date();
        const formattedDate = now.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        // Create a beautifully formatted backup codes document
        const content = `
+-----------------------------------------------------------------------+
|                                                                       |
|                     COINTRACK BACKUP CODES                            |
|                                                                       |
+-----------------------------------------------------------------------+

  [!] IMPORTANT: STORE THESE CODES SECURELY

      * Each code can only be used ONCE
      * Keep these codes in a safe place (password manager, safe)
      * Do NOT share these codes with anyone
      * If codes are compromised, reset your 2FA immediately

=======================================================================
                         YOUR BACKUP CODES
=======================================================================

${backupCodes.map((code, i) => `        [ ${String(i + 1).padStart(2, '0')} ]    ${code}`).join('\n')}

=======================================================================

    Generated: ${formattedDate}
    Total Codes: ${backupCodes.length}

=======================================================================
                      HOW TO USE BACKUP CODES
=======================================================================

    1. Go to the CoinTrack login page
    2. Enter your username and password
    3. When prompted for 2FA code, click "Use Backup Code"
    4. Enter one of your backup codes from this list
    5. Cross off the used code - it cannot be used again!

+-----------------------------------------------------------------------+
|                 CoinTrack - Your Portfolio, Secured                   |
+-----------------------------------------------------------------------+
`.trim();

        const element = document.createElement("a");
        const file = new Blob([content], { type: 'text/plain' });
        element.href = URL.createObjectURL(file);
        element.download = `coinTrack_backup-codes_${user?.username || 'user'}.txt`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    if (step === 'init') {
        return (
            <Card className="w-full max-w-md mx-auto">
                <CardHeader>
                    <CardTitle>Enable 2-Factor Authentication</CardTitle>
                    <CardDescription>
                        Protect your account with an extra layer of security.
                        {isMandatory && <span className="text-red-500 block mt-1 font-semibold">Setup is required to continue.</span>}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex justify-center py-4">
                        <div className="bg-blue-100 p-4 rounded-full">
                            <span className="text-4xl">🛡️</span>
                        </div>
                    </div>
                    <p className="text-center text-gray-500 text-sm">
                        You will need an authenticator app like Google Authenticator or Authy.
                    </p>
                    {error && <Alert variant="destructive" className="mt-4"><AlertDescription>{error}</AlertDescription></Alert>}
                </CardContent>
                <CardFooter className="flex justify-between">
                    {!isMandatory && <Button variant="ghost" onClick={onCancel}>Cancel</Button>}
                    <Button onClick={startSetup} disabled={loading} className={isMandatory ? 'w-full' : ''}>
                        {loading ? 'Initializing...' : 'Start Setup'}
                    </Button>
                </CardFooter>
            </Card>
        );
    }

    if (step === 'scan') {
        return (
            <Card className="w-full max-w-md mx-auto">
                <CardHeader>
                    <CardTitle>Scan QR Code</CardTitle>
                    <CardDescription>Scan this with your authenticator app.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {setupData?.qrCodeBase64 && (
                        <div className="flex justify-center bg-white p-4 rounded border">
                            <img src={setupData.qrCodeBase64} alt="QR Code" className="w-48 h-48" />
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label>Or enter code manually</Label>
                        <div className="flex items-center space-x-2">
                            <code className="flex-1 bg-gray-100 dark:bg-gray-800 p-2 rounded text-sm font-mono break-all border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100">
                                {setupData?.secret}
                            </code>
                            <Button size="icon" variant="outline" onClick={() => copyToClipboard(setupData?.secret)}>
                                <Copy className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    <div className="pt-4 space-y-2">
                        <Label>Verify Code</Label>
                        <div className="flex space-x-2">
                            <Input
                                placeholder="000000"
                                maxLength={6}
                                value={verificationCode}
                                onChange={(e) => setVerificationCode(e.target.value.replace(/[^0-9]/g, ''))}
                                className="text-center text-lg tracking-widest"
                            />
                            <Button onClick={verifyCode} disabled={loading || verificationCode.length !== 6}>
                                {loading ? 'Verifying...' : 'Verify'}
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Enter the 6-digit code from your app to confirm.
                        </p>
                    </div>

                    {error && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}
                </CardContent>
            </Card>
        );
    }

    if (step === 'backup') {
        return (
            <Card className="w-full max-w-md mx-auto border-green-200 shadow-green-100">
                <CardHeader>
                    <div className="flex items-center space-x-2 text-green-600 mb-2">
                        <CheckCircle2 className="h-6 w-6" />
                        <span className="font-bold text-lg">Setup Complete!</span>
                    </div>
                    <CardTitle>Save Backup Codes</CardTitle>
                    <CardDescription>
                        Use these codes if you lose access to your authenticator app.
                        <span className="block text-red-500 font-semibold mt-1">Keep them safe. They will only be shown once.</span>
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4 grid grid-cols-2 gap-2 text-sm font-mono">
                        {backupCodes.map((code, i) => (
                            <div key={i} className="bg-white dark:bg-gray-900 p-1.5 px-2 border border-gray-200 dark:border-gray-700 rounded text-center text-gray-800 dark:text-gray-200">
                                {code}
                            </div>
                        ))}
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col space-y-2">
                    <Button variant="outline" className="w-full" onClick={downloadBackupCodes}>
                        <Copy className="mr-2 h-4 w-4" /> Download Codes
                    </Button>
                    <Button className="w-full" onClick={finishSetup}>
                        Continue <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </CardFooter>
            </Card>
        );
    }

    return null;
}

function AlertCircle({ className }) {
    return <AlertTriangle className={className} />;
}
