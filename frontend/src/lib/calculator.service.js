import api from './api';

/**
 * Calculator API Service
 * Provides methods for all calculator endpoints
 */
export const calculatorService = {
    // ========================================
    // Investment Calculators
    // ========================================

    /**
     * Calculate SIP returns
     * @param {Object} data - { monthlyInvestment, expectedReturn, years }
     * @param {boolean} debug - Include debug info in response
     */
    calculateSip: (data, debug = false) =>
        api.post(`/api/calculators/investment/sip${debug ? '?debug=true' : ''}`, data)
            .then(res => res.data),

    /**
     * Calculate Step-Up SIP returns
     * @param {Object} data - { monthlyInvestment, expectedReturn, years, stepUpPercent }
     */
    calculateStepUpSip: (data, debug = false) =>
        api.post(`/api/calculators/investment/step-up-sip${debug ? '?debug=true' : ''}`, data)
            .then(res => res.data),

    /**
     * Calculate Lumpsum returns
     * @param {Object} data - { principal, expectedReturn, years }
     */
    calculateLumpsum: (data, debug = false) =>
        api.post(`/api/calculators/investment/lumpsum${debug ? '?debug=true' : ''}`, data)
            .then(res => res.data),

    /**
     * Calculate CAGR
     * @param {Object} data - { initialValue, finalValue, years }
     */
    calculateCagr: (data, debug = false) =>
        api.post(`/api/calculators/investment/cagr${debug ? '?debug=true' : ''}`, data)
            .then(res => res.data),

    /**
     * Calculate XIRR (Extended Internal Rate of Return)
     * @param {Object} data - { cashFlows: [{ date, amount }] }
     */
    calculateXirr: (data, debug = false) =>
        api.post(`/api/calculators/investment/xirr${debug ? '?debug=true' : ''}`, data)
            .then(res => res.data),

    /**
     * Calculate Stock Average Price
     * @param {Object} data - { existingQuantity, existingPrice, newQuantity, newPrice }
     */
    calculateStockAverage: (data, debug = false) =>
        api.post(`/api/calculators/investment/stock-average${debug ? '?debug=true' : ''}`, data)
            .then(res => res.data),

    /**
     * Calculate Inflation-adjusted values
     * @param {Object} data - { presentValue, inflationRate, years }
     */
    calculateInflation: (data, debug = false) =>
        api.post(`/api/calculators/investment/inflation${debug ? '?debug=true' : ''}`, data)
            .then(res => res.data),

    /**
     * Calculate Mutual Fund Returns (same as SIP)
     */
    calculateMutualFundReturns: (data, debug = false) =>
        api.post(`/api/calculators/investment/mutual-fund-returns${debug ? '?debug=true' : ''}`, data)
            .then(res => res.data),

    // ========================================
    // Loan Calculators
    // ========================================

    /**
     * Calculate EMI
     * @param {Object} data - { principal, annualRate, months }
     */
    calculateEmi: (data, debug = false) =>
        api.post(`/api/calculators/loans/emi${debug ? '?debug=true' : ''}`, data)
            .then(res => res.data),

    /**
     * Calculate Home Loan EMI
     */
    calculateHomeLoanEmi: (data, debug = false) =>
        api.post(`/api/calculators/loans/home-loan-emi${debug ? '?debug=true' : ''}`, data)
            .then(res => res.data),

    /**
     * Calculate Car Loan EMI
     */
    calculateCarLoanEmi: (data, debug = false) =>
        api.post(`/api/calculators/loans/car-loan-emi${debug ? '?debug=true' : ''}`, data)
            .then(res => res.data),

    /**
     * Calculate Simple Interest
     * @param {Object} data - { principal, annualRate, years }
     */
    calculateSimpleInterest: (data, debug = false) =>
        api.post(`/api/calculators/loans/simple-interest${debug ? '?debug=true' : ''}`, data)
            .then(res => res.data),

    /**
     * Calculate Compound Interest
     * @param {Object} data - { principal, annualRate, years, compoundingFrequency }
     */
    calculateCompoundInterest: (data, debug = false) =>
        api.post(`/api/calculators/loans/compound-interest${debug ? '?debug=true' : ''}`, data)
            .then(res => res.data),

    /**
     * Compare Flat vs Reducing Rate
     */
    compareFlatVsReducing: (data, debug = false) =>
        api.post(`/api/calculators/loans/flat-vs-reducing${debug ? '?debug=true' : ''}`, data)
            .then(res => res.data),

    // ========================================
    // Savings Scheme Calculators
    // ========================================

    /**
     * Calculate PPF (Public Provident Fund)
     * @param {Object} data - { yearlyInvestment, years }
     */
    calculatePpf: (data, debug = false) =>
        api.post(`/api/calculators/savings/ppf${debug ? '?debug=true' : ''}`, data)
            .then(res => res.data),

    /**
     * Calculate EPF (Employee Provident Fund)
     * @param {Object} data - { monthlyBasicSalary, currentAge, retirementAge }
     */
    calculateEpf: (data, debug = false) =>
        api.post(`/api/calculators/savings/epf${debug ? '?debug=true' : ''}`, data)
            .then(res => res.data),

    /**
     * Calculate FD (Fixed Deposit)
     * @param {Object} data - { principal, interestRate, tenureDays }
     */
    calculateFd: (data, debug = false) =>
        api.post(`/api/calculators/savings/fd${debug ? '?debug=true' : ''}`, data)
            .then(res => res.data),

    /**
     * Calculate RD (Recurring Deposit)
     * @param {Object} data - { monthlyDeposit, interestRate, tenureMonths }
     */
    calculateRd: (data, debug = false) =>
        api.post(`/api/calculators/savings/rd${debug ? '?debug=true' : ''}`, data)
            .then(res => res.data),

    /**
     * Calculate SSY (Sukanya Samriddhi Yojana)
     * @param {Object} data - { yearlyInvestment, girlAge }
     */
    calculateSsy: (data, debug = false) =>
        api.post(`/api/calculators/savings/ssy${debug ? '?debug=true' : ''}`, data)
            .then(res => res.data),

    /**
     * Calculate NPS (National Pension System)
     * @param {Object} data - { monthlyContribution, currentAge, retirementAge }
     */
    calculateNps: (data, debug = false) =>
        api.post(`/api/calculators/savings/nps${debug ? '?debug=true' : ''}`, data)
            .then(res => res.data),

    /**
     * Calculate NSC (National Savings Certificate)
     * @param {Object} data - { investmentAmount }
     */
    calculateNsc: (data, debug = false) =>
        api.post(`/api/calculators/savings/nsc${debug ? '?debug=true' : ''}`, data)
            .then(res => res.data),

    /**
     * Calculate SCSS (Senior Citizens Savings Scheme)
     * @param {Object} data - { investmentAmount }
     */
    calculateScss: (data, debug = false) =>
        api.post(`/api/calculators/savings/scss${debug ? '?debug=true' : ''}`, data)
            .then(res => res.data),

    /**
     * Calculate Post Office MIS
     * @param {Object} data - { investmentAmount }
     */
    calculateMis: (data, debug = false) =>
        api.post(`/api/calculators/savings/mis${debug ? '?debug=true' : ''}`, data)
            .then(res => res.data),

    /**
     * Calculate APY (Atal Pension Yojana)
     * @param {Object} data - { desiredPension, currentAge }
     */
    calculateApy: (data, debug = false) =>
        api.post(`/api/calculators/savings/apy${debug ? '?debug=true' : ''}`, data)
            .then(res => res.data),

    // ========================================
    // Tax Calculators
    // ========================================

    /**
     * Calculate Income Tax (Old vs New Regime)
     * @param {Object} data - { grossIncome, section80CDeductions, section80DDeductions, otherDeductions, hraExemption, financialYear }
     */
    calculateIncomeTax: (data, debug = false) =>
        api.post(`/api/calculators/tax/income-tax${debug ? '?debug=true' : ''}`, data)
            .then(res => res.data),

    /**
     * Calculate HRA Exemption
     * @param {Object} data - { basicSalary, dearnessAllowance, hraReceived, rentPaid, isMetroCity }
     */
    calculateHra: (data, debug = false) =>
        api.post(`/api/calculators/tax/hra${debug ? '?debug=true' : ''}`, data)
            .then(res => res.data),

    /**
     * Calculate Net Take-Home Salary
     * @param {Object} data - { basicSalary, hra, specialAllowance, ... }
     */
    calculateSalary: (data, debug = false) =>
        api.post(`/api/calculators/tax/salary${debug ? '?debug=true' : ''}`, data)
            .then(res => res.data),

    /**
     * Calculate Gratuity
     * @param {Object} data - { lastDrawnSalary, yearsOfService }
     */
    calculateGratuity: (data, debug = false) =>
        api.post(`/api/calculators/tax/gratuity${debug ? '?debug=true' : ''}`, data)
            .then(res => res.data),

    /**
     * Calculate GST
     * @param {Object} data - { amount, gstRate, isInclusive }
     */
    calculateGst: (data, debug = false) =>
        api.post(`/api/calculators/tax/gst${debug ? '?debug=true' : ''}`, data)
            .then(res => res.data),

    /**
     * Calculate TDS
     * @param {Object} data - { amount, paymentType }
     */
    calculateTds: (data, debug = false) =>
        api.post(`/api/calculators/tax/tds${debug ? '?debug=true' : ''}`, data)
            .then(res => res.data),

    // ========================================
    // Trading Calculators
    // ========================================

    /**
     * Calculate Brokerage and All Charges
     * @param {Object} data - { transactionType, buyPrice, sellPrice, quantity }
     */
    calculateBrokerage: (data, debug = false) =>
        api.post(`/api/calculators/trading/brokerage${debug ? '?debug=true' : ''}`, data)
            .then(res => res.data),

    /**
     * Calculate Margin Requirements
     * @param {Object} data - { transactionType, price, quantity }
     */
    calculateMargin: (data, debug = false) =>
        api.post(`/api/calculators/trading/margin${debug ? '?debug=true' : ''}`, data)
            .then(res => res.data),

    // ========================================
    // Planning Calculators
    // ========================================

    /**
     * Calculate Retirement Planning
     * @param {Object} data - { currentAge, retirementAge, lifeExpectancy, currentMonthlyExpense, ... }
     */
    calculateRetirement: (data, debug = false) =>
        api.post(`/api/calculators/planning/retirement${debug ? '?debug=true' : ''}`, data)
            .then(res => res.data),
};

/**
 * Format currency in Indian Rupee format
 */
export function formatCurrency(amount) {
    if (amount === null || amount === undefined) return '₹0';
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(amount);
}

/**
 * Format percentage
 */
export function formatPercentage(value, decimals = 2) {
    if (value === null || value === undefined) return '0%';
    return `${Number(value).toFixed(decimals)}%`;
}

/**
 * Format number in Indian format
 */
export function formatNumber(num) {
    if (num === null || num === undefined) return '0';
    return new Intl.NumberFormat('en-IN').format(num);
}

export default calculatorService;
