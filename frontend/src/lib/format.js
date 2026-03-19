// src/lib/format.js

const currencyFormatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
});

const currencyFormatterPrecise = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 4,
});

export const formatCurrency = (amount, options = {}) => {
    if (amount === null || amount === undefined) return '\u2014';
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(num)) return '\u2014';

    const fmt = options.precise ? currencyFormatterPrecise : currencyFormatter;
    const formatted = fmt.format(Math.abs(num));

    if (options.showSign) {
        return num >= 0 ? `+${formatted}` : `-${formatted}`;
    }
    return num < 0 ? `-${formatted}` : formatted;
};

export const formatPercent = (amount, options = {}) => {
    if (amount === null || amount === undefined) return '\u2014';
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(num)) return '\u2014';

    const abs = Math.abs(num).toFixed(2);
    if (options.showSign) {
        return num >= 0 ? `+${abs}%` : `-${abs}%`;
    }
    return num < 0 ? `-${abs}%` : `${abs}%`;
};

export const formatDateTime = (dateString) => {
    if (!dateString) return '\u2014';
    return new Intl.DateTimeFormat('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(dateString));
};
