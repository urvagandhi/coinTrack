// src/app/(main)/brokers/_shared/BrokerCallbackHandler.jsx
'use client';

import { getBrokerByKey } from '@/lib/brokerConfig';
import { itemVariants, useMotionVariants } from '@/lib/motion';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

export function BrokerCallbackHandler({ brokerKey, onCallback, successRedirect = '/brokers' }) {
    const router = useRouter();
    const broker = getBrokerByKey(brokerKey);
    const called = useRef(false);
    const [status, setStatus] = useState('loading');
    const [errorMessage, setErrorMessage] = useState('');
    const itemV = useMotionVariants(itemVariants);

    useEffect(() => {
        if (called.current) return;
        called.current = true;

        onCallback()
            .then(() => {
                setStatus('success');
                setTimeout(() => router.push(successRedirect), 1800);
            })
            .catch((err) => {
                // Handle reused/expired tokens gracefully
                if (err?.status === 400 || err?.original?.response?.status === 400) {
                    setStatus('success');
                    setTimeout(() => router.push(successRedirect), 1800);
                    return;
                }
                setStatus('error');
                setErrorMessage(err?.message || 'Connection failed. Please try again.');
            });
    }, []);

    return (
        <div className="min-h-[60vh] flex items-center justify-center">
            <motion.div variants={itemV} initial="hidden" animate="visible" className="text-center space-y-4 max-w-sm">
                <AnimatePresence mode="wait">
                    {status === 'loading' && (
                        <motion.div key="loading" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                            className="flex flex-col items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center">
                                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                                    <Loader2 size={28} className="text-blue-600" />
                                </motion.div>
                            </div>
                            <div>
                                <p className="text-base font-semibold text-foreground">Connecting {broker?.displayName}</p>
                                <p className="text-sm text-muted-foreground mt-1">Exchanging tokens and syncing your portfolio...</p>
                            </div>
                        </motion.div>
                    )}

                    {status === 'success' && (
                        <motion.div key="success" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col items-center gap-4">
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                                className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
                                <CheckCircle2 size={32} className="text-green-600" />
                            </motion.div>
                            <div>
                                <p className="text-base font-semibold text-foreground">{broker?.displayName} connected</p>
                                <p className="text-sm text-muted-foreground mt-1">Your portfolio is being synced. Redirecting...</p>
                            </div>
                        </motion.div>
                    )}

                    {status === 'error' && (
                        <motion.div key="error" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
                                <XCircle size={32} className="text-red-600" />
                            </div>
                            <div>
                                <p className="text-base font-semibold text-foreground">Connection failed</p>
                                <p className="text-sm text-muted-foreground mt-1">{errorMessage}</p>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => router.push(broker?.setupPath || '/brokers')}
                                    className="h-9 px-4 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                                    Try again
                                </button>
                                <button onClick={() => router.push('/brokers')}
                                    className="h-9 px-4 border border-border text-foreground rounded-lg text-sm hover:bg-accent transition-colors">
                                    Back to brokers
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}
