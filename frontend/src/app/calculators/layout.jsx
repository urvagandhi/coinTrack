// src/app/calculators/layout.jsx — Server layout with rich SEO metadata
import CalculatorsShell from './CalculatorsShell';

export const metadata = {
  title: {
    default: 'Financial Calculators | coinTrack',
    template: '%s | coinTrack Calculators',
  },
  description:
    'Free Indian financial calculators for SIP, Step-Up SIP, EMI, PPF, EPF, Fixed Deposits, Income Tax, and Retirement planning.',
  keywords: [
    'SIP calculator',
    'PPF calculator',
    'EPF calculator',
    'EMI calculator',
    'Income tax calculator India',
    'Fixed deposit calculator',
    'CAGR calculator',
    'XIRR calculator',
  ],
  alternates: {
    canonical: '/calculators',
  },
  openGraph: {
    title: 'Financial Calculators — coinTrack',
    description:
      '32+ verified mathematical models for personal finance, investment forecasting, and tax planning.',
    url: '/calculators',
    type: 'website',
  },
};

export default function CalculatorsLayout({ children }) {
  return <CalculatorsShell>{children}</CalculatorsShell>;
}
