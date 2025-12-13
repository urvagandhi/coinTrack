import { logger } from '@/lib/logger';
import { format, formatDistanceToNow, isValid, parseISO } from 'date-fns';

// Currency formatting utilities
export const formatters = {
    // Currency formatters
    currency: (amount, currency = 'INR', options = {}) => {
        const defaultOptions = {
            style: 'currency',
            currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        };

        const formatOptions = { ...defaultOptions, ...options };

        try {
            return new Intl.NumberFormat('en-IN', formatOptions).format(amount || 0);
        } catch (error) {
            logger.warn('Error formatting currency:', { error });
            return `₹${(amount || 0).toFixed(2)}`;
        }
    },

    // Compact currency format (e.g., ₹1.2K, ₹1.5M)
    currencyCompact: (amount, currency = 'INR') => {
        if (!amount) return '₹0';

        const absAmount = Math.abs(amount);
        const sign = amount < 0 ? '-' : '';

        if (absAmount >= 10000000) { // 1 Crore
            return `${sign}₹${(absAmount / 10000000).toFixed(1)}Cr`;
        } else if (absAmount >= 100000) { // 1 Lakh
            return `${sign}₹${(absAmount / 100000).toFixed(1)}L`;
        } else if (absAmount >= 1000) { // 1 Thousand
            return `${sign}₹${(absAmount / 1000).toFixed(1)}K`;
        } else {
            return `${sign}₹${absAmount.toFixed(0)}`;
        }
    },

    // Number formatters
    number: (value, options = {}) => {
        const defaultOptions = {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        };

        const formatOptions = { ...defaultOptions, ...options };

        try {
            return new Intl.NumberFormat('en-IN', formatOptions).format(value || 0);
        } catch (error) {
            logger.warn('Error formatting number:', { error });
            return (value || 0).toString();
        }
    },

    // Percentage formatter
    percentage: (value, options = {}) => {
        const defaultOptions = {
            style: 'percent',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        };

        const formatOptions = { ...defaultOptions, ...options };

        try {
            // Convert to decimal if value is already in percentage form (> 1)
            const decimalValue = Math.abs(value) > 1 ? value / 100 : value;
            return new Intl.NumberFormat('en-IN', formatOptions).format(decimalValue || 0);
        } catch (error) {
            logger.warn('Error formatting percentage:', { error });
            return `${((value || 0) * 100).toFixed(2)}%`;
        }
    },

    // Compact number format (e.g., 1.2K, 1.5M, 1.2B)
    numberCompact: (value) => {
        if (!value) return '0';

        const absValue = Math.abs(value);
        const sign = value < 0 ? '-' : '';

        if (absValue >= 1000000000) { // 1 Billion
            return `${sign}${(absValue / 1000000000).toFixed(1)}B`;
        } else if (absValue >= 1000000) { // 1 Million
            return `${sign}${(absValue / 1000000).toFixed(1)}M`;
        } else if (absValue >= 1000) { // 1 Thousand
            return `${sign}${(absValue / 1000).toFixed(1)}K`;
        } else {
            return `${sign}${absValue.toFixed(0)}`;
        }
    },

    // Date formatters
    date: (date, formatString = 'PPP') => {
        if (!date) return '';

        try {
            const dateObj = typeof date === 'string' ? parseISO(date) : date;
            if (!isValid(dateObj)) return '';

            return format(dateObj, formatString);
        } catch (error) {
            logger.warn('Error formatting date:', { error });
            return '';
        }
    },

    dateTime: (date, formatString = 'PPP p') => {
        return formatters.date(date, formatString);
    },

    dateShort: (date) => {
        return formatters.date(date, 'dd/MM/yyyy');
    },

    dateRelative: (date) => {
        if (!date) return '';

        try {
            const dateObj = typeof date === 'string' ? parseISO(date) : date;
            if (!isValid(dateObj)) return '';

            return formatDistanceToNow(dateObj, { addSuffix: true });
        } catch (error) {
            logger.warn('Error formatting relative date:', { error });
            return '';
        }
    },

    time: (date, formatString = 'p') => {
        return formatters.date(date, formatString);
    },

    // Stock/Trading specific formatters
    stockPrice: (price, currency = 'INR') => {
        return formatters.currency(price, currency, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    },

    stockChange: (change, isPercentage = false) => {
        if (change === null || change === undefined) return '';

        const sign = change >= 0 ? '+' : '';
        const formatted = isPercentage
            ? formatters.percentage(Math.abs(change) > 1 ? change / 100 : change)
            : formatters.currency(change);

        return `${sign}${formatted}`;
    },

    stockVolume: (volume) => {
        return formatters.numberCompact(volume);
    },

    // P&L formatters
    pnl: (value, showSign = true) => {
        if (value === null || value === undefined) return '₹0.00';

        const formatted = formatters.currency(Math.abs(value));
        const sign = showSign ? (value >= 0 ? '+' : '-') : '';

        return `${sign}${formatted}`;
    },

    pnlPercentage: (value, showSign = true) => {
        if (value === null || value === undefined) return '0.00%';

        const formatted = formatters.percentage(Math.abs(value) > 1 ? Math.abs(value) / 100 : Math.abs(value));
        const sign = showSign ? (value >= 0 ? '+' : '-') : '';

        return `${sign}${formatted}`;
    },
};

// Utility functions for number validation and parsing
export const validators = {
    isValidNumber: (value) => {
        return !isNaN(parseFloat(value)) && isFinite(value);
    },

    isValidCurrency: (value) => {
        const cleanValue = typeof value === 'string'
            ? value.replace(/[₹,$\s]/g, '')
            : value;
        return validators.isValidNumber(cleanValue);
    },

    parseNumber: (value) => {
        if (typeof value === 'number') return value;
        if (typeof value === 'string') {
            const cleanValue = value.replace(/[,$\s]/g, '');
            return parseFloat(cleanValue) || 0;
        }
        return 0;
    },

    parseCurrency: (value) => {
        if (typeof value === 'number') return value;
        if (typeof value === 'string') {
            const cleanValue = value.replace(/[₹,$\s]/g, '');
            return parseFloat(cleanValue) || 0;
        }
        return 0;
    },
};

// Color utilities for financial data
export const colors = {
    getChangeColor: (value, theme = 'light') => {
        if (value > 0) {
            return theme === 'dark' ? '#22c55e' : '#16a34a'; // Green
        } else if (value < 0) {
            return theme === 'dark' ? '#ef4444' : '#dc2626'; // Red
        } else {
            return theme === 'dark' ? '#9ca3af' : '#6b7280'; // Gray
        }
    },

    getChangeBgColor: (value, theme = 'light') => {
        if (value > 0) {
            return theme === 'dark' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.1)'; // Green bg
        } else if (value < 0) {
            return theme === 'dark' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.1)'; // Red bg
        } else {
            return theme === 'dark' ? 'rgba(156, 163, 175, 0.1)' : 'rgba(156, 163, 175, 0.1)'; // Gray bg
        }
    },
};

// Default export with all utilities
export default {
    ...formatters,
    validators,
    colors,
};
