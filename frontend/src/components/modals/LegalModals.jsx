'use client';

import { useModal } from '@/contexts/ModalContext';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

export default function LegalModals() {
    const { activeModal, closeModal } = useModal();

    const legalContent = {
        privacy: {
            title: "Privacy Policy",
            content: (
                <div className="space-y-4">
                    <p>At coinTrack, we prioritize the protection of your personal information. This Privacy Policy outlines how we collect, use, and safeguard your data.</p>
                    <h4 className="font-bold text-lg">1. Data Collection</h4>
                    <p>We collect information you provide directly to us, such as when you create an account, update your profile, or contact customer support.</p>
                    <h4 className="font-bold text-lg">2. Data Usage</h4>
                    <p>We use your information to provide, maintain, and improve our services, including processing transactions and sending related information.</p>
                    <h4 className="font-bold text-lg">3. Data Security</h4>
                    <p>We implement industry-standard security measures to protect your personal data from unauthorized access, modification, or disclosure.</p>
                </div>
            )
        },
        terms: {
            title: "Terms of Service",
            content: (
                <div className="space-y-4">
                    <p>By accessing or using coinTrack, you agree to be bound by these Terms of Service.</p>
                    <h4 className="font-bold text-lg">1. Acceptance of Terms</h4>
                    <p>Please read these terms carefully before accessing or using our services. If you do not agree to all the terms and conditions, then you may not access the website.</p>
                    <h4 className="font-bold text-lg">2. User Account</h4>
                    <p>You are responsible for safeguarding the password that you use to access the service and for any activities or actions under your password.</p>
                    <h4 className="font-bold text-lg">3. Limitations</h4>
                    <p>In no event shall coinTrack be liable for any damages arising out of the use or inability to use the materials on coinTrack's website.</p>
                </div>
            )
        },
        cookies: {
            title: "Cookie Policy",
            content: (
                <div className="space-y-4">
                    <p>We use cookies to enhance your experience on our website. This Cookie Policy explains what cookies are and how we use them.</p>
                    <h4 className="font-bold text-lg">1. What are Cookies?</h4>
                    <p>Cookies are small text files that are stored on your device when you visit a website. They help the website remember your actions and preferences.</p>
                    <h4 className="font-bold text-lg">2. How We Use Cookies</h4>
                    <p>We use cookies to analyze site traffic, personalize content, and provide social media features. We also share information about your use of our site with our analytics partners.</p>
                    <h4 className="font-bold text-lg">3. Managing Cookies</h4>
                    <p>You can control and/or delete cookies as you wish. You can delete all cookies that are already on your computer and you can set most browsers to prevent them from being placed.</p>
                </div>
            )
        }
    };

    const modalData = legalContent[activeModal];

    if (!modalData) return null;

    return (
        <AnimatePresence>
            {activeModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={closeModal}
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        className="relative w-full max-w-2xl bg-white/90 dark:bg-gray-900/90 backdrop-blur-2xl border border-white/20 dark:border-gray-800 rounded-3xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800 bg-white/50 dark:bg-black/20">
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                                {modalData.title}
                            </h3>
                            <button
                                onClick={closeModal}
                                className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-500 dark:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-8 overflow-y-auto text-gray-600 dark:text-gray-300 leading-relaxed scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800">
                            {modalData.content}
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-black/20 text-center">
                            <button
                                onClick={closeModal}
                                className="px-8 py-3 rounded-xl bg-purple-600 text-white font-medium hover:bg-purple-700 transition-all shadow-lg hover:shadow-purple-500/25 active:scale-95"
                            >
                                Understood
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
