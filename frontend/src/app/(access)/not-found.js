'use client';

import { motion } from 'framer-motion';
import { Home } from 'lucide-react';
import { Space_Mono } from 'next/font/google';
import Link from 'next/link';

const spaceMono = Space_Mono({
    weight: ['400', '700'],
    subsets: ['latin'],
});

export default function NotFound() {
    return (
        <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-black transition-colors duration-300 font-sans">
            {/* Background Orbs */}
            <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen animate-blob" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen animate-blob animation-delay-2000" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-3xl relative z-10 px-6 text-center"
            >
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="mb-8"
                >
                    <h1 className={`${spaceMono.className} text-9xl font-black text-black dark:text-white drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)] select-none`}>
                        404
                    </h1>
                    <h2 className="text-4xl font-bold text-gray-900 dark:text-white mt-4 tracking-tight">
                        Look like you're lost
                    </h2>
                </motion.div>

                {/* Preserved GIF Section - Floating Style with simple shadow */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                    className="relative w-full h-64 sm:h-80 mb-10 mx-auto max-w-lg rounded-3xl overflow-hidden shadow-2xl"
                >
                    <div
                        className="absolute inset-0 bg-center bg-no-repeat bg-cover transform hover:scale-105 transition-transform duration-700"
                        style={{
                            backgroundImage: "url('https://cdn.dribbble.com/users/285475/screenshots/2083086/dribbble_1.gif')"
                        }}
                    />
                </motion.div>

                {/* Content & Action */}
                <div className="relative z-20">
                    <p className="text-gray-600 dark:text-gray-300 text-lg mb-10 max-w-md mx-auto font-medium leading-relaxed">
                        The page you are looking for is not available or under maintenance!
                    </p>

                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 py-4 px-8 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-full shadow-lg hover:shadow-purple-600/30 transition-all transform hover:-translate-y-1 active:translate-y-0"
                    >
                        <Home className="w-5 h-5" />
                        Go to Home
                    </Link>
                </div>

                <p className="mt-16 text-xs font-medium text-gray-400 dark:text-gray-600 uppercase tracking-widest">
                    &copy; {new Date().getFullYear()} coinTrack
                </p>
            </motion.div>
        </div>
    );
}
