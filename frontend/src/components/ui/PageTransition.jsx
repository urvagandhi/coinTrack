'use client';

import { motion } from 'framer-motion';

export default function PageTransition({ children, className = "" }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }} // Bezier for smooth "apple-like" motion
            className={`w-full h-full ${className}`}
        >
            {children}
        </motion.div>
    );
}
