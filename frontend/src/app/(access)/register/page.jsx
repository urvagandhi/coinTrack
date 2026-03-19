// src/app/(access)/register/page.jsx
'use client';

import { AuthAlert } from '@/components/auth/AuthAlert';
import { AuthFormField } from '@/components/auth/AuthFormField';
import { AuthPageShell } from '@/components/auth/AuthPageShell';
import { AuthSubmitButton } from '@/components/auth/AuthSubmitButton';
import { useAuth } from '@/contexts/AuthContext';
import { itemVariants, useMotionVariants } from '@/lib/motion';
import { motion } from 'framer-motion';
import { Calendar, Eye, EyeOff, Lock, Mail, Phone, User } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const INPUT_CLASS = 'w-full h-10 pl-9 pr-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-purple-600/50 focus:border-purple-600 transition-colors placeholder:text-gray-400';
const INPUT_PW_CLASS = 'w-full h-10 pl-9 pr-10 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-purple-600/50 focus:border-purple-600 transition-colors placeholder:text-gray-400';
const ICON_CLASS = 'absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground';

function getPasswordStrength(password) {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;
    if (score <= 1) return { level: 'weak', segments: 1 };
    if (score <= 2) return { level: 'fair', segments: 2 };
    if (score <= 3) return { level: 'good', segments: 3 };
    return { level: 'strong', segments: 4 };
}

const STRENGTH_COLORS = { weak: 'bg-red-600', fair: 'bg-amber-600', good: 'bg-blue-500', strong: 'bg-green-600' };

export default function RegisterPage() {
    const [formData, setFormData] = useState({
        username: '', name: '', email: '', phoneNumber: '', dateOfBirth: '', password: '', confirmPassword: '',
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const { register } = useAuth();
    const router = useRouter();
    const item = useMotionVariants(itemVariants);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (error) setError('');
    };

    const validateForm = () => {
        const { username, name, email, phoneNumber, dateOfBirth, password, confirmPassword } = formData;

        if (!username || !name || !email || !phoneNumber || !dateOfBirth || !password || !confirmPassword) {
            setError('Please fill in all fields');
            return false;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setError('Please enter a valid email address');
            return false;
        }
        if (!/^[\+]?[1-9][\d]{0,15}$/.test(phoneNumber.replace(/[\s\-\(\)]/g, ''))) {
            setError('Please enter a valid phone number');
            return false;
        }
        if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/.test(password)) {
            setError('Password must contain at least one uppercase letter, one lowercase letter, and one digit');
            return false;
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return false;
        }
        const today = new Date();
        const birthDate = new Date(dateOfBirth);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;
        if (age < 18) {
            setError('You must be at least 18 years old to register');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        if (!validateForm()) { setIsLoading(false); return; }

        try {
            const payload = {
                username: formData.username,
                email: formData.email,
                password: formData.password,
                mobile: formData.phoneNumber.replace(/[^0-9]/g, '').slice(-10),
                firstName: formData.name.split(' ')[0],
                lastName: formData.name.split(' ').slice(1).join(' ') || '',
            };

            const result = await register(payload);
            const data = result.data || result;

            if (data.requireTotpSetup && data.tempToken) {
                sessionStorage.setItem('totpSetupToken', data.tempToken);
                sessionStorage.setItem('totpSetupUsername', data.username);
                router.push('/setup-2fa');
                return;
            }

            setError('Registration completed but TOTP setup was not triggered. Please contact support.');
        } catch (err) {
            setError(err.message || err.userMessage || 'An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    const strength = formData.password ? getPasswordStrength(formData.password) : null;

    return (
        <AuthPageShell
            title="Create your account"
            subtitle="Start tracking your portfolio across all brokers"
            maxWidth="sm"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <AuthAlert type="error" message={error} />

                <AuthFormField label="Full name" id="name">
                    <div className="relative">
                        <div className={ICON_CLASS}><User size={16} /></div>
                        <input id="name" name="name" type="text" required value={formData.name} onChange={handleChange} placeholder="Full name" className={INPUT_CLASS} />
                    </div>
                </AuthFormField>

                <AuthFormField label="Username" id="username">
                    <div className="relative">
                        <div className={ICON_CLASS}><User size={16} /></div>
                        <input id="username" name="username" type="text" required value={formData.username} onChange={handleChange} placeholder="Username" className={INPUT_CLASS} />
                    </div>
                </AuthFormField>

                <AuthFormField label="Email address" id="email">
                    <div className="relative">
                        <div className={ICON_CLASS}><Mail size={16} /></div>
                        <input id="email" name="email" type="email" required value={formData.email} onChange={handleChange} placeholder="name@example.com" className={INPUT_CLASS} />
                    </div>
                </AuthFormField>

                <AuthFormField label="Phone number" id="phoneNumber">
                    <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-muted-foreground">
                            <Phone size={16} />
                            <span className="text-xs border-l border-border pl-1.5">+91</span>
                        </div>
                        <input
                            id="phoneNumber" name="phoneNumber" type="tel" required maxLength={10}
                            value={formData.phoneNumber}
                            onChange={(e) => { const val = e.target.value.replace(/\D/g, ''); setFormData((p) => ({ ...p, phoneNumber: val })); }}
                            placeholder="Phone number"
                            className="w-full h-10 pl-[4.5rem] pr-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-purple-600/50 focus:border-purple-600 transition-colors placeholder:text-gray-400"
                        />
                    </div>
                </AuthFormField>

                <AuthFormField label="Date of birth" id="dateOfBirth">
                    <div className="relative">
                        <div className={ICON_CLASS}><Calendar size={16} /></div>
                        <input id="dateOfBirth" name="dateOfBirth" type="date" required value={formData.dateOfBirth} onChange={handleChange} className={INPUT_CLASS} />
                    </div>
                </AuthFormField>

                <AuthFormField label="Password" id="password">
                    <div className="relative">
                        <div className={ICON_CLASS}><Lock size={16} /></div>
                        <input id="password" name="password" type={showPassword ? 'text' : 'password'} required value={formData.password} onChange={handleChange} placeholder="Password" className={INPUT_PW_CLASS} />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>
                    {/* Password strength bar */}
                    {strength && (
                        <div className="mt-2 space-y-1">
                            <div className="flex gap-1">
                                {[1, 2, 3, 4].map((seg) => (
                                    <div key={seg} className={`h-1 flex-1 rounded-full ${seg <= strength.segments ? STRENGTH_COLORS[strength.level] : 'bg-border'}`} />
                                ))}
                            </div>
                            <p className="text-xs text-muted-foreground">Password strength: {strength.level}</p>
                        </div>
                    )}
                </AuthFormField>

                <AuthFormField label="Confirm password" id="confirmPassword">
                    <div className="relative">
                        <div className={ICON_CLASS}><Lock size={16} /></div>
                        <input id="confirmPassword" name="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} required value={formData.confirmPassword} onChange={handleChange} placeholder="Confirm password" className={INPUT_PW_CLASS} />
                        <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                            {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>
                </AuthFormField>

                <motion.div variants={item}>
                    <AuthSubmitButton isLoading={isLoading} className="mt-2">
                        {isLoading ? 'Creating account...' : 'Create account'}
                    </AuthSubmitButton>
                </motion.div>
            </form>

            <motion.div variants={item} className="mt-6 pt-5 border-t border-gray-200 dark:border-gray-700 text-center">
                <p className="text-sm text-muted-foreground">
                    Already have an account?{' '}
                    <Link href="/login" className="text-purple-600 font-medium hover:underline">Sign in</Link>
                </p>
            </motion.div>
        </AuthPageShell>
    );
}
