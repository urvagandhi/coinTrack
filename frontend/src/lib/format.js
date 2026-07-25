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
    if (!dateString) return '—';
    return new Intl.DateTimeFormat('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(dateString));
};

/**
 * Returns Indian Financial Year string (e.g. "2026-27") for a given date
 */
export const getFinancialYear = (dateInput) => {
    if (!dateInput) return null;
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return null;
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const startY = month >= 4 ? year : year - 1;
    return `${startY}-${String(startY + 1).slice(-2)}`;
};

/**
 * Dynamically generates financial year dropdown options from transaction/record arrays
 */
export const generateFinancialYearOptions = (records = [], dateKey = 'transactionDate') => {
    const fySet = new Set();

    // Dynamically extract FYs from records
    if (Array.isArray(records)) {
        records.forEach((rec) => {
            const dateVal = rec?.[dateKey] || rec?.date || rec?.transactionDate || rec?.issueDate;
            if (dateVal) {
                const fy = getFinancialYear(dateVal);
                if (fy) fySet.add(fy);
            }
        });
    }

    // Always ensure the current financial year is present in the options so the user can select it and add transactions.
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const currentStartY = currentMonth >= 4 ? currentYear : currentYear - 1;
    fySet.add(`${currentStartY}-${String(currentStartY + 1).slice(-2)}`);

    const sorted = Array.from(fySet).sort((a, b) => {
        const yA = parseInt(a.split('-')[0], 10);
        const yB = parseInt(b.split('-')[0], 10);
        return yB - yA;
    });

    return [
        { value: '', label: 'All Financial Years' },
        ...sorted.map((fy) => ({ value: fy, label: `FY ${fy}` })),
    ];
};

