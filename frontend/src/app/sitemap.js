export default function sitemap() {
  const base =
    process.env.NEXT_PUBLIC_APP_URL || 'https://cointrack-finance.vercel.app';

  const calculatorRoutes = [
    // Investment
    'investment/sip',
    'investment/step-up-sip',
    'investment/lumpsum',
    'investment/cagr',
    'investment/xirr',
    'investment/stock-average',
    'investment/inflation',
    // Savings
    'savings/ppf',
    'savings/epf',
    'savings/fd',
    'savings/rd',
    'savings/ssy',
    'savings/nps',
    'savings/nsc',
    'savings/scss',
    'savings/mis',
    'savings/apy',
    // Loans
    'loans/emi',
    'loans/home-loan-emi',
    'loans/car-loan-emi',
    'loans/simple-interest',
    'loans/compound-interest',
    'loans/flat-vs-reducing',
    // Tax
    'tax/income-tax',
    'tax/hra',
    'tax/salary',
    'tax/gratuity',
    'tax/gst',
    'tax/tds',
    // Trading
    'trading/brokerage',
    'trading/margin',
    // Planning
    'planning/retirement',
  ];

  const currentDate = new Date();

  return [
    {
      url: base,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${base}/calculators`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    ...calculatorRoutes.map(path => ({
      url: `${base}/calculators/${path}`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.8,
    })),
  ];
}
