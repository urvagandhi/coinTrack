// src/app/(access)/register/page.jsx
'use client';

import { AuthAlert } from '@/components/auth/AuthAlert';
import { AuthFormField } from '@/components/auth/AuthFormField';
import { AuthPageShell } from '@/components/auth/AuthPageShell';
import { AuthSubmitButton } from '@/components/auth/AuthSubmitButton';
import { useAuth } from '@/contexts/AuthContext';
import { useModal } from '@/contexts/ModalContext';
import { Calendar, Eye, EyeOff, Lock, Mail, Phone, User } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const FIELD_BASE =
    'w-full h-11 px-3 bg-transparent border border-hairline text-foreground text-[14px] ' +
    'focus:outline-none focus:border-[hsl(var(--accent))] focus:ring-1 focus:ring-[hsl(var(--accent))] ' +
    'transition-colors placeholder:text-muted-foreground/60';
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

const STRENGTH_COLORS = {
    weak: 'bg-[hsl(var(--loss))]',
    fair: 'bg-[hsl(var(--chart-4))]',
    good: 'bg-[hsl(var(--neutral))]',
    strong: 'bg-[hsl(var(--gain))]',
};

const STRENGTH_LABELS = {
    weak: 'Weak — choose a stronger password',
    fair: 'Fair — could be stronger',
    good: 'Good',
    strong: 'Strong',
};

export default function RegisterPage() {
    const [formData, setFormData] = useState({
        username: '', name: '', email: '', phoneNumber: '', dateOfBirth: '', password: '', confirmPassword: '',
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const { register } = useAuth();
    const { openModal } = useModal();
    const router = useRouter();

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
            title="Open your ledger"
            subtitle="Register a new CoinTrack account to start tracking your portfolio across brokers."
            index="II"
            kicker="New Subscriber"
            maxWidth="md"
            asideQuote={'"Every great portfolio begins with a single, honest entry."'}
        >
            <form onSubmit={handleSubmit} className="space-y-5">
                <AuthAlert type="error" message={error} />

                {/* Identity */}
                <div>
                    <p className="eyebrow mb-3">[ A ] Identity</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <AuthFormField label="Full name" id="name">
                            <div className="relative">
                                <div className={ICON_CLASS}><User size={14} /></div>
                                <input id="name" name="name" type="text" required value={formData.name} onChange={handleChange} placeholder="Jane Doe" className={`${FIELD_BASE} pl-9`} />
                            </div>
                        </AuthFormField>

                        <AuthFormField label="Username" id="username">
                            <div className="relative">
                                <div className={ICON_CLASS}><User size={14} /></div>
                                <input id="username" name="username" type="text" required value={formData.username} onChange={handleChange} placeholder="jane_doe" className={`${FIELD_BASE} pl-9`} />
                            </div>
                        </AuthFormField>
                    </div>
                </div>

                {/* Contact */}
                <div>
                    <p className="eyebrow mb-3">[ B ] Contact</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <AuthFormField label="Email address" id="email">
                            <div className="relative">
                                <div className={ICON_CLASS}><Mail size={14} /></div>
                                <input id="email" name="email" type="email" required value={formData.email} onChange={handleChange} placeholder="jane@example.com" className={`${FIELD_BASE} pl-9`} />
                            </div>
                        </AuthFormField>

                        <AuthFormField label="Phone (+91)" id="phoneNumber">
                            <div className="relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-muted-foreground">
                                    <Phone size={14} />
                                    <span className="text-[11px] font-mono border-l border-hairline pl-1.5">+91</span>
                                </div>
                                <input
                                    id="phoneNumber" name="phoneNumber" type="tel" required maxLength={10}
                                    value={formData.phoneNumber}
                                    onChange={(e) => { const val = e.target.value.replace(/\D/g, ''); setFormData((p) => ({ ...p, phoneNumber: val })); }}
                                    placeholder="9876543210"
                                    className={`${FIELD_BASE} pl-[4.5rem]`}
                                />
                            </div>
                        </AuthFormField>
                    </div>

                    <div className="mt-4">
                        <AuthFormField label="Date of birth" id="dateOfBirth" hint="You must be 18 or older.">
                            <div className="relative">
                                <div className={ICON_CLASS}><Calendar size={14} /></div>
                                <input id="dateOfBirth" name="dateOfBirth" type="date" required value={formData.dateOfBirth} onChange={handleChange} className={`${FIELD_BASE} pl-9`} />
                            </div>
                        </AuthFormField>
                    </div>
                </div>

                {/* Credentials */}
                <div>
                    <p className="eyebrow mb-3">[ C ] Credentials</p>
                    <div className="space-y-4">
                        <AuthFormField label="Password" id="password">
                            <div className="relative">
                                <div className={ICON_CLASS}><Lock size={14} /></div>
                                <input id="password" name="password" type={showPassword ? 'text' : 'password'} required value={formData.password} onChange={handleChange} placeholder="••••••••" className={`${FIELD_BASE} pl-9 pr-10`} />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                                </button>
                            </div>
                            {strength && (
                                <div className="mt-2.5 space-y-1.5">
                                    <div className="flex gap-1">
                                        {[1, 2, 3, 4].map((seg) => (
                                            <div key={seg} className={`h-[3px] flex-1 ${seg <= strength.segments ? STRENGTH_COLORS[strength.level] : 'bg-hairline'}`} />
                                        ))}
                                    </div>
                                    <p className="text-[11px] font-mono text-muted-foreground">
                                        Strength · <span className="text-foreground">{STRENGTH_LABELS[strength.level]}</span>
                                    </p>
                                </div>
                            )}
                        </AuthFormField>

                        <AuthFormField label="Confirm password" id="confirmPassword">
                            <div className="relative">
                                <div className={ICON_CLASS}><Lock size={14} /></div>
                                <input id="confirmPassword" name="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} required value={formData.confirmPassword} onChange={handleChange} placeholder="••••••••" className={`${FIELD_BASE} pl-9 pr-10`} />
                                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}>
                                    {showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                                </button>
                            </div>
                        </AuthFormField>
                    </div>
                </div>

                <div className="pt-2">
                    <AuthSubmitButton isLoading={isLoading}>
                        {isLoading ? 'Creating account…' : 'Create Account'}
                    </AuthSubmitButton>
                    <p className="mt-3 text-[11px] text-muted-foreground font-mono text-center">
                        By registering you agree to our{' '}
                        <button
                            type="button"
                            onClick={() => openModal('terms')}
                            className="text-foreground underline hover:text-[hsl(var(--accent))] transition-colors"
                        >
                            Terms
                        </button>{' '}
                        and{' '}
                        <button
                            type="button"
                            onClick={() => openModal('privacy')}
                            className="text-foreground underline hover:text-[hsl(var(--accent))] transition-colors"
                        >
                            Privacy Policy
                        </button>.
                    </p>
                </div>
            </form>

            <div className="mt-10 pt-6 border-t border-hairline text-center">
                <p className="text-[12px] text-muted-foreground">
                    Already a subscriber?{' '}
                    <Link href="/login" className="text-[hsl(var(--accent))] font-medium uppercase tracking-[0.16em] hover:underline">
                        Sign in
                    </Link>
                </p>
            </div>
        </AuthPageShell>
    );
}
