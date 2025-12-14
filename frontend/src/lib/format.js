export const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return '-';
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 2,
    }).format(amount);
};

export const formatPercent = (amount) => {
    if (amount === null || amount === undefined) return '-';
    // Handle cases where amount is a string
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `${num.toFixed(2)}%`;
};

export const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    return new Intl.DateTimeFormat('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(new Date(dateString));
};
