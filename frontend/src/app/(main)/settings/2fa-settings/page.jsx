'use client';

import TotpSetup from '@/components/TotpSetup';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { Loader, RefreshCw, ShieldCheck } from 'lucide-react';
import { Suspense, useEffect, useState } from 'react';

function TwoFactorSettingsContent() {
    const { user, loading, resetTotp, verifyResetTotp } = useAuth();

    // Local state for status
    const [status, setStatus] = useState(null);
    const [statusLoading, setStatusLoading] = useState(true);
    const [isReseting, setIsReseting] = useState(false);
    const [resetStep, setResetStep] = useState('confirm'); // confirm, setup, done
    const [error, setError] = useState('');

    useEffect(() => {
        if (user) {
            fetchStatus();
        }
    }, [user]);

    const fetchStatus = async () => {
        try {
            // Use totpAPI to get 2FA status
            const data = await totpAPI.getStatus();
            setStatus(data);
        } catch (err) {
            console.error("Failed to fetch TOTP status", err);
        } finally {
            setStatusLoading(false);
        }
    };

    const handleStartReset = () => {
        setIsReseting(true);
        setResetStep('setup');
        // Note: Real flow might ask for password/current TOTP confirmation first.
        // For now we jump to Setup component which calls 'resetTotp' (initiate) internally or we pass a wrapper.
        // Wait, TotpSetup component calls `setupTotp` from context.
        // Reset flow needs `resetTotp` and `verifyResetTotp`.
        // We should update TotpSetup to accept 'mode' or overrides?
        // Or duplicate the component?
        // TotpSetup is designed to call `setupTotp` and `verifyTotpSetup`.
        // We can pass `customSetupAction` and `customVerifyAction` to it?
        // Let's modify TotpSetup to allow overriding actions.
        // Or clearer: Just use TotpSetup, but Context's setupTotp checks if it's a reset?
        // No, API endpoints are different (/2fa/setup vs /2fa/reset).
        // Let's pass the functions as props to TotpSetup.
    };

    if (loading || statusLoading) {
        return <div className="p-8 flex justify-center"><Loader className="animate-spin" /></div>;
    }

    if (isReseting) {
        return (
            <div className="max-w-2xl mx-auto p-4">
                <Button variant="ghost" className="mb-4" onClick={() => setIsReseting(false)}>Back to Settings</Button>
                <TotpSetup
                    isMandatory={false}
                    // We need to support custom actions in TotpSetup or wrap it.
                    // Since I didn't add props for actions in TotpSetup, I might need to update it
                    // OR rely on a context flag?
                    // Let's assume I'll update TotpSetup to take `setupAction` and `verifyAction` props.
                    // But I just created TotpSetup.jsx without them.
                    // I will update TotpSetup.jsx in the next step to support this.
                    // For now, I'll pass them assuming I will update it.
                    setupAction={resetTotp}
                    verifyAction={verifyResetTotp}
                    onComplete={() => {
                        setIsReseting(false);
                        fetchStatus();
                    }}
                    onCancel={() => setIsReseting(false)}
                />
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 max-w-4xl space-y-8">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Security Settings</h1>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                Two-Factor Authentication (2FA)
                                {status?.enabled ? (
                                    <Badge variant="default" className="bg-green-600 hover:bg-green-700">Enabled</Badge>
                                ) : (
                                    <Badge variant="destructive">Disabled</Badge>
                                )}
                            </CardTitle>
                            <CardDescription>
                                Add an extra layer of security to your account using TOTP (Google Authenticator, Authy).
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {status?.enabled ? (
                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-start gap-3">
                            <ShieldCheck className="h-6 w-6 text-green-600 mt-1" />
                            <div>
                                <h4 className="font-semibold text-green-900 dark:text-green-100">2FA is active</h4>
                                <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                                    Your account is protected. You will be asked for a code when you log in.
                                </p>
                                <div className="text-xs text-green-600/80 mt-2">
                                    Setup on: {new Date(status.setupAt).toLocaleDateString()}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <Alert variant="destructive">
                            <shieldAlert className="h-4 w-4" />
                            <AlertTitle>Action Required</AlertTitle>
                            <AlertDescription>
                                2FA is currently disabled. Please enable it to secure your assets.
                            </AlertDescription>
                        </Alert>
                    )}

                    <div className="pt-4 border-t">
                        <h4 className="font-medium mb-4">Management</h4>
                        <div className="flex gap-4">
                            {status?.enabled ? (
                                <Button variant="outline" onClick={handleStartReset} className="border-red-200 hover:border-red-400 hover:bg-red-50 dark:hover:bg-red-900/10">
                                    <RefreshCw className="mr-2 h-4 w-4" /> Reset / Rotate 2FA
                                </Button>
                            ) : (
                                <Button onClick={() => setIsReseting(true)}>
                                    Setup 2FA
                                </Button>
                            )}
                        </div>
                        {status?.enabled && (
                            <p className="text-sm text-gray-500 mt-2">
                                Resetting 2FA will generate a new secret key and invalidate all previous backup codes.
                            </p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default function TwoFactorSettingsPage() {
    return (
        <Suspense fallback={<Loader />}>
            <TwoFactorSettingsContent />
        </Suspense>
    );
}
