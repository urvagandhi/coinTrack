'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isEmailSent, setIsEmailSent] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!email) {
            setError('Email is required');
            return;
        }

        if (!/\S+@\S+\.\S+/.test(email)) {
            setError('Please enter a valid email address');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            await api.auth.forgotPassword({ email });
            setIsEmailSent(true);
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to send reset email. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e) => {
        setEmail(e.target.value);
        if (error) setError('');
    };

    if (isEmailSent) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cointrack-primary/10 to-cointrack-secondary/10 p-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-md"
                >
                    <div className="bg-white dark:bg-cointrack-dark-card rounded-2xl shadow-xl border border-cointrack-light/20 dark:border-cointrack-dark/20 p-8 text-center">
                        <motion.div
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, duration: 0.3 }}
                            className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full mx-auto mb-4 flex items-center justify-center"
                        >
                            <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </motion.div>
                        <h1 className="text-2xl font-bold text-cointrack-dark dark:text-cointrack-light mb-2">
                            Check Your Email
                        </h1>
                        <p className="text-cointrack-dark/60 dark:text-cointrack-light/60 mb-6">
                            We've sent a password reset link to <strong>{email}</strong>
                        </p>
                        <div className="space-y-4">
                            <Link
                                href="/login"
                                className="block w-full bg-cointrack-primary hover:bg-cointrack-primary/90 text-white py-3 px-4 rounded-xl font-medium transition-colors"
                            >
                                Back to Login
                            </Link>
                            <button
                                onClick={() => {
                                    setIsEmailSent(false);
                                    setEmail('');
                                }}
                                className="block w-full text-cointrack-primary hover:text-cointrack-primary/80 py-2 font-medium transition-colors"
                            >
                                Send to different email
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cointrack-primary/10 to-cointrack-secondary/10 p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md"
            >
                <div className="bg-white dark:bg-cointrack-dark-card rounded-2xl shadow-xl border border-cointrack-light/20 dark:border-cointrack-dark/20 p-8">
                    {/* Logo */}
                    <div className="text-center mb-8">
                        <motion.div
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, duration: 0.3 }}
                            className="w-16 h-16 bg-gradient-to-r from-cointrack-primary to-cointrack-secondary rounded-2xl mx-auto mb-4 flex items-center justify-center"
                        >
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </motion.div>
                        <h1 className="text-2xl font-bold text-cointrack-dark dark:text-cointrack-light">
                            Forgot Password?
                        </h1>
                        <p className="text-cointrack-dark/60 dark:text-cointrack-light/60 mt-2">
                            Enter your email to reset your password
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Email */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-cointrack-dark dark:text-cointrack-light mb-2">
                                Email Address
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={email}
                                onChange={handleChange}
                                className={`w-full px-4 py-3 rounded-xl border ${
                                    error 
                                        ? 'border-red-500 focus:border-red-500' 
                                        : 'border-cointrack-light/30 dark:border-cointrack-dark/30 focus:border-cointrack-primary'
                                } bg-white dark:bg-cointrack-dark/50 text-cointrack-dark dark:text-cointrack-light placeholder-cointrack-dark/40 dark:placeholder-cointrack-light/40 focus:outline-none focus:ring-2 focus:ring-cointrack-primary/20 transition-colors`}
                                placeholder="Enter your email address"
                                autoComplete="email"
                            />
                            {error && (
                                <motion.p
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-red-500 text-sm mt-1"
                                >
                                    {error}
                                </motion.p>
                            )}
                        </div>

                        {/* Submit Button */}
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-gradient-to-r from-cointrack-primary to-cointrack-secondary text-white py-3 px-4 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all duration-200"
                        >
                            {isLoading ? (
                                <div className="flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                    Sending Reset Link...
                                </div>
                            ) : (
                                'Send Reset Link'
                            )}
                        </motion.button>
                    </form>

                    {/* Back to Login */}
                    <div className="text-center mt-6 pt-6 border-t border-cointrack-light/20 dark:border-cointrack-dark/20">
                        <Link 
                            href="/login"
                            className="text-cointrack-primary hover:text-cointrack-primary/80 font-medium transition-colors"
                        >
                            ← Back to Login
                        </Link>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
