/**
 * CoinTrack Standard Logger
 *
 * PURPOSE:
 * Centralized logging wrapper to enforce:
 * 1. No console logs in production
 * 2. Structured metadata for tracing
 * 3. Strict safety rules (NO PII/Secrets)
 *
 * USAGE:
 * import { logger } from '@/lib/logger';
 * logger.info('User logged in', { userId: '123' });
 */

const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const LOG_PREFIX = '[CoinTrack]';

/**
 * Safe stringify that handles circular references and errors
 */
const safeStringify = (data) => {
    try {
        if (typeof data === 'string') return data;
        return JSON.stringify(data, null, 2);
    } catch (error) {
        return '[Circular/Unserializable Data]';
    }
};

/**
 * Formats the log message with standardized prefix and styling
 */
const formatMessage = (level, message) => {
    const timestamp = new Date().toISOString();
    return `${LOG_PREFIX} [${level.toUpperCase()}] ${timestamp} - ${message}`;
};

class Logger {
    constructor() {
        this.levels = {
            DEBUG: 0,
            INFO: 1,
            WARN: 2,
            ERROR: 3,
        };

        // Default level based on environment
        this.currentLevel = IS_PRODUCTION ? this.levels.WARN : this.levels.DEBUG;
    }

    /**
     * Determines if a log should be printed based on environment and level
     */
    shouldLog(level) {
        return level >= this.currentLevel;
    }

    /**
     * Internal generic logger
     * @param {string} level - Log level
     * @param {string} message - Human readable message
     * @param {object} context - Structured metadata (Broker, UserID, etc.)
     */
    log(level, message, context = {}) {
        if (!this.shouldLog(this.levels[level])) return;

        // SANITY CHECK: In development, warn if context looks suspicious (simple heuristic)
        if (!IS_PRODUCTION) {
            const contextStr = JSON.stringify(context).toLowerCase();
            if (contextStr.includes('token') || contextStr.includes('password') || contextStr.includes('secret')) {
                console.warn('🚨 [SECURITY WARNING] Potential secret in log context:', message);
            }
        }

        const formattedMessage = formatMessage(level, message);
        const hasContext = Object.keys(context).length > 0;

        switch (level) {
            case 'DEBUG':
            case 'INFO':
                if (hasContext) {
                    console.log(formattedMessage, context);
                } else {
                    console.log(formattedMessage);
                }
                break;
            case 'WARN':
                if (hasContext) {
                    console.warn(formattedMessage, context);
                } else {
                    console.warn(formattedMessage);
                }
                break;
            case 'ERROR':
                if (hasContext) {
                    console.error(formattedMessage, context);
                } else {
                    console.error(formattedMessage);
                }
                break;
        }
    }

    debug(message, context) {
        this.log('DEBUG', message, context);
    }

    info(message, context) {
        this.log('INFO', message, context);
    }

    warn(message, context) {
        this.log('WARN', message, context);
    }

    error(message, context) {
        this.log('ERROR', message, context);
    }

    // Explicit method for API usage tracing
    api(method, url, status, duration, context = {}) {
        if (IS_PRODUCTION) return; // Optional: disable API tracing in prod

        const icon = status >= 400 ? '❌' : '✅';
        this.debug(`${icon} API ${method} ${url} (${status}) - ${duration}ms`, context);
    }
}

export const logger = new Logger();
