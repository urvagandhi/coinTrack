'use client';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { formatCurrency, formatPercent } from '@/shared/formatters';
import { cn } from '@/shared/lib/utils';
import { BrokerBadge } from '@/shared/ui/data-display/data-table';
import { DesignLabAuthNav } from '../components/design-lab-auth-nav';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  ArrowUpDown,
  BarChart2,
  Calendar,
  Check,
  Clock,
  Copy,
  Download,
  ExternalLink,
  FileSpreadsheet,
  Info,
  Layers,
  PiggyBank,
  RefreshCw,
  Repeat,
  Search,
  Server,
  Shield,
  ShieldCheck,
  SlidersHorizontal,
  TrendingUp,
  Wifi,
  X,
} from 'lucide-react';

// ── AUTHENTIC INSTITUTIONAL INDIAN EQUITY POSITIONS ──
const HOLDINGS_DATA = [
  // ── ZERODHA KITE (6 positions) ──
  {
    id: 'zh-1',
    symbol: 'NSE:RELIANCE',
    companyName: 'Reliance Industries Ltd',
    broker: 'ZERODHA',
    quantity: 60,
    t1Quantity: 0,
    averageBuyPrice: 2567.0,
    currentPrice: 2980.4,
    currentValue: 178824.0,
    investedValue: 154020.0,
    unrealizedPL: 24804.0,
    unrealizedPLPercent: 16.1,
    dayGain: 1440.0,
    dayGainPercent: 0.81,
    isin: 'INE002A01018',
    sector: 'Energy',
    exchange: 'NSE',
    dematAccount: '1208160002941021',
    dpName: 'Zerodha Broking Limited',
    depository: 'CDSL',
    high52: 3217.9,
    low52: 2220.3,
    ltcgShares: 40,
    stcgShares: 20,
    dataConfidence: 'HIGH',
    notes:
      'Core compounding anchor. Capital allocation into green hydrogen and retail.',
  },
  {
    id: 'zh-2',
    symbol: 'NSE:TCS',
    companyName: 'Tata Consultancy Services Ltd',
    broker: 'ZERODHA',
    quantity: 45,
    t1Quantity: 0,
    averageBuyPrice: 3410.0,
    currentPrice: 4120.5,
    currentValue: 185422.5,
    investedValue: 153450.0,
    unrealizedPL: 31972.5,
    unrealizedPLPercent: 20.84,
    dayGain: 2115.0,
    dayGainPercent: 1.15,
    isin: 'INE467B01029',
    sector: 'Technology',
    exchange: 'NSE',
    dematAccount: '1208160002941021',
    dpName: 'Zerodha Broking Limited',
    depository: 'CDSL',
    high52: 4585.0,
    low52: 3313.0,
    ltcgShares: 45,
    stcgShares: 0,
    dataConfidence: 'HIGH',
    notes:
      'Tier-1 IT exporter. High dividend yield with resilient operating margins.',
  },
  {
    id: 'zh-3',
    symbol: 'NSE:INFY',
    companyName: 'Infosys Ltd',
    broker: 'ZERODHA',
    quantity: 90,
    t1Quantity: 0,
    averageBuyPrice: 1480.0,
    currentPrice: 1845.2,
    currentValue: 166068.0,
    investedValue: 133200.0,
    unrealizedPL: 32868.0,
    unrealizedPLPercent: 24.68,
    dayGain: -990.0,
    dayGainPercent: -0.59,
    isin: 'INE009A01021',
    sector: 'Technology',
    exchange: 'NSE',
    dematAccount: '1208160002941021',
    dpName: 'Zerodha Broking Limited',
    depository: 'CDSL',
    high52: 1991.45,
    low52: 1358.35,
    ltcgShares: 60,
    stcgShares: 30,
    dataConfidence: 'HIGH',
    notes:
      'Enterprise cloud transformation and generative AI workflow delivery.',
  },
  {
    id: 'zh-4',
    symbol: 'NSE:LT',
    companyName: 'Larsen & Toubro Ltd',
    broker: 'ZERODHA',
    quantity: 40,
    t1Quantity: 5,
    averageBuyPrice: 3120.0,
    currentPrice: 3680.0,
    currentValue: 147200.0,
    investedValue: 124800.0,
    unrealizedPL: 22400.0,
    unrealizedPLPercent: 17.95,
    dayGain: 1840.0,
    dayGainPercent: 1.27,
    isin: 'INE018A01030',
    sector: 'Infrastructure',
    exchange: 'NSE',
    dematAccount: '1208160002941021',
    dpName: 'Zerodha Broking Limited',
    depository: 'CDSL',
    high52: 3919.9,
    low52: 2865.0,
    ltcgShares: 35,
    stcgShares: 5,
    dataConfidence: 'HIGH',
    notes:
      '5 shares pending T+1 settlement from yesterday buy. Record domestic order book.',
  },
  {
    id: 'zh-5',
    symbol: 'NSE:ITC',
    companyName: 'ITC Ltd',
    broker: 'ZERODHA',
    quantity: 280,
    t1Quantity: 0,
    averageBuyPrice: 410.0,
    currentPrice: 482.3,
    currentValue: 135044.0,
    investedValue: 114800.0,
    unrealizedPL: 20244.0,
    unrealizedPLPercent: 17.63,
    dayGain: 420.0,
    dayGainPercent: 0.31,
    isin: 'INE154A01025',
    sector: 'FMCG',
    exchange: 'NSE',
    dematAccount: '1208160002941021',
    dpName: 'Zerodha Broking Limited',
    depository: 'CDSL',
    high52: 528.55,
    low52: 399.3,
    ltcgShares: 280,
    stcgShares: 0,
    dataConfidence: 'HIGH',
    notes:
      'Defensive cash generator. Hotel subsidiary demerger unlocking core asset value.',
  },
  {
    id: 'zh-6',
    symbol: 'NSE:TATAMOTORS',
    companyName: 'Tata Motors Ltd',
    broker: 'ZERODHA',
    quantity: 110,
    t1Quantity: 0,
    averageBuyPrice: 875.0,
    currentPrice: 940.0,
    currentValue: 103400.0,
    investedValue: 96250.0,
    unrealizedPL: 7150.0,
    unrealizedPLPercent: 7.43,
    dayGain: 1210.0,
    dayGainPercent: 1.18,
    isin: 'INE155A01022',
    sector: 'Automotive',
    exchange: 'NSE',
    dematAccount: '1208160002941021',
    dpName: 'Zerodha Broking Limited',
    depository: 'CDSL',
    high52: 1179.0,
    low52: 648.5,
    ltcgShares: 110,
    stcgShares: 0,
    dataConfidence: 'HIGH',
    notes: 'JLR free cash generation and India EV market leadership.',
  },

  // ── UPSTOX (5 positions) ──
  {
    id: 'up-1',
    symbol: 'NSE:HDFCBANK',
    companyName: 'HDFC Bank Ltd',
    broker: 'UPSTOX',
    quantity: 120,
    t1Quantity: 0,
    averageBuyPrice: 1530.0,
    currentPrice: 1720.5,
    currentValue: 206460.0,
    investedValue: 183600.0,
    unrealizedPL: 22860.0,
    unrealizedPLPercent: 12.45,
    dayGain: 1800.0,
    dayGainPercent: 0.88,
    isin: 'INE040A01034',
    sector: 'Banking',
    exchange: 'NSE',
    dematAccount: '1208180004928172',
    dpName: 'Upstox Securities Ltd',
    depository: 'CDSL',
    high52: 1794.0,
    low52: 1363.55,
    ltcgShares: 90,
    stcgShares: 30,
    dataConfidence: 'HIGH',
    notes:
      'Post-merger loan-deposit ratio rebalancing and branch franchise monetization.',
  },
  {
    id: 'up-2',
    symbol: 'NSE:ICICIBANK',
    companyName: 'ICICI Bank Ltd',
    broker: 'UPSTOX',
    quantity: 115,
    t1Quantity: 0,
    averageBuyPrice: 1040.0,
    currentPrice: 1260.0,
    currentValue: 144900.0,
    investedValue: 119600.0,
    unrealizedPL: 25300.0,
    unrealizedPLPercent: 21.15,
    dayGain: 1380.0,
    dayGainPercent: 0.96,
    isin: 'INE090A01021',
    sector: 'Banking',
    exchange: 'NSE',
    dematAccount: '1208180004928172',
    dpName: 'Upstox Securities Ltd',
    depository: 'CDSL',
    high52: 1332.0,
    low52: 913.0,
    ltcgShares: 80,
    stcgShares: 35,
    dataConfidence: 'HIGH',
    notes:
      'Industry-leading ROA (>2.3%) and disciplined credit underwriting across cycles.',
  },
  {
    id: 'up-3',
    symbol: 'NSE:BHARTIARTL',
    companyName: 'Bharti Airtel Ltd',
    broker: 'UPSTOX',
    quantity: 95,
    t1Quantity: 0,
    averageBuyPrice: 1280.0,
    currentPrice: 1640.0,
    currentValue: 155800.0,
    investedValue: 121600.0,
    unrealizedPL: 34200.0,
    unrealizedPLPercent: 28.13,
    dayGain: 2090.0,
    dayGainPercent: 1.36,
    isin: 'INE397D01024',
    sector: 'Telecom',
    exchange: 'NSE',
    dematAccount: '1208180004928172',
    dpName: 'Upstox Securities Ltd',
    depository: 'CDSL',
    high52: 1779.0,
    low52: 902.0,
    ltcgShares: 75,
    stcgShares: 20,
    dataConfidence: 'HIGH',
    notes:
      'Tariff repair driving sustained ARPU growth. Enterprise cloud & data centers.',
  },
  {
    id: 'up-4',
    symbol: 'NSE:SBIN',
    companyName: 'State Bank of India',
    broker: 'UPSTOX',
    quantity: 140,
    t1Quantity: 10,
    averageBuyPrice: 720.0,
    currentPrice: 830.0,
    currentValue: 116200.0,
    investedValue: 100800.0,
    unrealizedPL: 15400.0,
    unrealizedPLPercent: 15.28,
    dayGain: 980.0,
    dayGainPercent: 0.85,
    isin: 'INE062A01020',
    sector: 'Banking',
    exchange: 'NSE',
    dematAccount: '1208180004928172',
    dpName: 'Upstox Securities Ltd',
    depository: 'CDSL',
    high52: 912.1,
    low52: 555.3,
    ltcgShares: 130,
    stcgShares: 10,
    dataConfidence: 'HIGH',
    notes:
      '10 shares T+1 unsettled. Dominant sovereign lender with pristine asset quality.',
  },
  {
    id: 'up-5',
    symbol: 'NSE:SUNPHARMA',
    companyName: 'Sun Pharmaceutical Industries',
    broker: 'UPSTOX',
    quantity: 45,
    t1Quantity: 0,
    averageBuyPrice: 1540.0,
    currentPrice: 1820.0,
    currentValue: 81900.0,
    investedValue: 69300.0,
    unrealizedPL: 12600.0,
    unrealizedPLPercent: 18.18,
    dayGain: 720.0,
    dayGainPercent: 0.89,
    isin: 'INE044A01036',
    sector: 'Healthcare',
    exchange: 'NSE',
    dematAccount: '1208180004928172',
    dpName: 'Upstox Securities Ltd',
    depository: 'CDSL',
    high52: 1960.0,
    low52: 1115.0,
    ltcgShares: 45,
    stcgShares: 0,
    dataConfidence: 'HIGH',
    notes:
      'Specialty dermatology and ophthalmology franchise scaling globally.',
  },

  // ── ANGEL ONE (3 positions) ──
  {
    id: 'ao-1',
    symbol: 'NSE:DRREDDY',
    companyName: "Dr. Reddy's Laboratories Ltd",
    broker: 'ANGEL_ONE',
    quantity: 70,
    t1Quantity: 0,
    averageBuyPrice: 1420.0,
    currentPrice: 1840.0,
    currentValue: 128800.0,
    investedValue: 99400.0,
    unrealizedPL: 29400.0,
    unrealizedPLPercent: 29.58,
    dayGain: 1470.0,
    dayGainPercent: 1.15,
    isin: 'INE089A01023',
    sector: 'Healthcare',
    exchange: 'NSE',
    dematAccount: '1208190001092831',
    dpName: 'Angel One Limited',
    depository: 'CDSL',
    high52: 1960.0,
    low52: 1115.0,
    ltcgShares: 50,
    stcgShares: 20,
    dataConfidence: 'HIGH',
    notes:
      'Biosimilar pipeline expansion and strong brand equity in Russia/CIS markets.',
  },
  {
    id: 'ao-2',
    symbol: 'NSE:TITAN',
    companyName: 'Titan Company Ltd',
    broker: 'ANGEL_ONE',
    quantity: 30,
    t1Quantity: 0,
    averageBuyPrice: 3150.0,
    currentPrice: 3620.0,
    currentValue: 108600.0,
    investedValue: 94500.0,
    unrealizedPL: 14100.0,
    unrealizedPLPercent: 14.92,
    dayGain: 900.0,
    dayGainPercent: 0.84,
    isin: 'INE280A01028',
    sector: 'Consumer Goods',
    exchange: 'NSE',
    dematAccount: '1208190001092831',
    dpName: 'Angel One Limited',
    depository: 'CDSL',
    high52: 3886.95,
    low52: 3055.0,
    ltcgShares: 30,
    stcgShares: 0,
    dataConfidence: 'HIGH',
    notes:
      'Market share consolidation in formal jewellery via nationwide Tanishq network.',
  },
  {
    id: 'ao-3',
    symbol: 'NSE:ASIANPAINT',
    companyName: 'Asian Paints Ltd',
    broker: 'ANGEL_ONE',
    quantity: 35,
    t1Quantity: 0,
    averageBuyPrice: 2880.0,
    currentPrice: 2767.0,
    currentValue: 96845.0,
    investedValue: 100800.0,
    unrealizedPL: -3955.0,
    unrealizedPLPercent: -3.92,
    dayGain: 245.0,
    dayGainPercent: 0.25,
    isin: 'INE021A01026',
    sector: 'Consumer Goods',
    exchange: 'NSE',
    dematAccount: '1208190001092831',
    dpName: 'Angel One Limited',
    depository: 'CDSL',
    high52: 3422.0,
    low52: 2670.0,
    ltcgShares: 0,
    stcgShares: 35,
    dataConfidence: 'HIGH',
    notes:
      'Raw material margin pressure and new entrant monitoring. Long-term distribution moat.',
  },
];

// ── POSITIONS (INTRADAY / F&O) ──
const POSITIONS_DATA = [
  {
    id: 'pos-1',
    symbol: 'NIFTY 24500 CE',
    broker: 'ZERODHA',
    product: 'MIS',
    quantity: 75,
    buyAvg: 142.5,
    sellAvg: 0,
    ltp: 168.0,
    pnl: 1912.5,
    pnlPct: 17.89,
    exchange: 'NFO',
  },
  {
    id: 'pos-2',
    symbol: 'BANKNIFTY 52000 PE',
    broker: 'UPSTOX',
    product: 'MIS',
    quantity: 30,
    buyAvg: 210.0,
    sellAvg: 0,
    ltp: 195.0,
    pnl: -450.0,
    pnlPct: -7.14,
    exchange: 'NFO',
  },
  {
    id: 'pos-3',
    symbol: 'RELIANCE NOV FUT',
    broker: 'ANGEL_ONE',
    product: 'NRML',
    quantity: 250,
    buyAvg: 2975.0,
    sellAvg: 0,
    ltp: 2992.0,
    pnl: 4250.0,
    pnlPct: 0.57,
    exchange: 'NFO',
  },
];

// ── ORDERS BOOK ──
const ORDERS_DATA = [
  {
    id: 'ord-101',
    time: '14:28:10',
    symbol: 'NSE:LT',
    broker: 'ZERODHA',
    type: 'LIMIT BUY',
    quantity: 5,
    price: 3675.0,
    status: 'COMPLETE',
  },
  {
    id: 'ord-102',
    time: '13:12:45',
    symbol: 'NSE:SBIN',
    broker: 'UPSTOX',
    type: 'LIMIT BUY',
    quantity: 10,
    price: 828.5,
    status: 'COMPLETE',
  },
  {
    id: 'ord-103',
    time: '11:45:00',
    symbol: 'NIFTY 24500 CE',
    broker: 'ZERODHA',
    type: 'MARKET BUY',
    quantity: 75,
    price: 142.5,
    status: 'COMPLETE',
  },
  {
    id: 'ord-104',
    time: '10:15:20',
    symbol: 'NSE:TCS',
    broker: 'ZERODHA',
    type: 'LIMIT BUY',
    quantity: 10,
    price: 4050.0,
    status: 'OPEN',
  },
  {
    id: 'ord-105',
    time: '09:30:15',
    symbol: 'NSE:ASIANPAINT',
    broker: 'ANGEL_ONE',
    type: 'SL-M SELL',
    quantity: 35,
    price: 2720.0,
    status: 'CANCELLED',
  },
];

// ── TRADES EXECUTED ──
const TRADES_DATA = [
  {
    id: 'tr-901',
    time: '14:28:10',
    orderId: 'ord-101',
    symbol: 'NSE:LT',
    broker: 'ZERODHA',
    quantity: 5,
    fillPrice: 3675.0,
    tradeValue: 18375.0,
    exchange: 'NSE',
  },
  {
    id: 'tr-902',
    time: '13:12:45',
    orderId: 'ord-102',
    symbol: 'NSE:SBIN',
    broker: 'UPSTOX',
    quantity: 10,
    fillPrice: 828.5,
    tradeValue: 8285.0,
    exchange: 'NSE',
  },
  {
    id: 'tr-903',
    time: '11:45:00',
    orderId: 'ord-103',
    symbol: 'NIFTY 24500 CE',
    broker: 'ZERODHA',
    quantity: 75,
    fillPrice: 142.5,
    tradeValue: 10687.5,
    exchange: 'NFO',
  },
  {
    id: 'tr-904',
    time: '09:20:00',
    orderId: 'ord-100',
    symbol: 'NSE:HDFCBANK',
    broker: 'UPSTOX',
    quantity: 20,
    fillPrice: 1718.0,
    tradeValue: 34360.0,
    exchange: 'NSE',
  },
];

// ── MUTUAL FUNDS DATA (EXCLUSIVE TO ZERODHA COIN OR DIRECT AMFI) ──
const MF_DATA = [
  {
    id: 'mf-1',
    fundName: 'Parag Parikh Flexi Cap Fund - Direct Growth',
    amc: 'PPFAS Mutual Fund',
    category: 'Flexi Cap',
    units: 3450.82,
    avgNav: 54.2,
    nav: 79.45,
    invested: 187034.4,
    currentValue: 274167.6,
    unrealizedPL: 87133.2,
    unrealizedPLPercent: 46.59,
    sipActive: true,
    sipAmount: 15000,
    folioNumber: '10928374/82',
  },
  {
    id: 'mf-2',
    fundName: 'Quant Small Cap Fund - Direct Growth',
    amc: 'Quant Mutual Fund',
    category: 'Small Cap',
    units: 1240.15,
    avgNav: 168.4,
    nav: 242.1,
    invested: 208841.2,
    currentValue: 300240.3,
    unrealizedPL: 91399.1,
    unrealizedPLPercent: 43.76,
    sipActive: true,
    sipAmount: 10000,
    folioNumber: '44829103/99',
  },
  {
    id: 'mf-3',
    fundName: 'UTI Nifty 50 Index Fund - Direct Growth',
    amc: 'UTI Mutual Fund',
    category: 'Large Cap Index',
    units: 2150.0,
    avgNav: 122.5,
    nav: 161.8,
    invested: 263375.0,
    currentValue: 347870.0,
    unrealizedPL: 84495.0,
    unrealizedPLPercent: 32.08,
    sipActive: true,
    sipAmount: 20000,
    folioNumber: '77291038/12',
  },
  {
    id: 'mf-4',
    fundName: 'HDFC Mid-Cap Opportunities Fund - Direct Growth',
    amc: 'HDFC Mutual Fund',
    category: 'Mid Cap',
    units: 1580.4,
    avgNav: 110.0,
    nav: 174.6,
    invested: 173844.0,
    currentValue: 275937.8,
    unrealizedPL: 102093.8,
    unrealizedPLPercent: 58.73,
    sipActive: false,
    sipAmount: 0,
    folioNumber: '33918204/55',
  },
];

// ── MUTUAL FUND ORDER BOOK (SYNCED VIA ZERODHA COIN API) ──
const MF_ORDERS_DATA = [
  {
    id: 'coin-ord-101',
    orderNumber: 'COIN-20261102-8821',
    time: '02 Nov 2026, 10:30 AM',
    fundName: 'Parag Parikh Flexi Cap Fund - Direct Growth',
    type: 'SIP Installment',
    amount: 15000.0,
    allottedNav: 84.32,
    allottedUnits: 177.893,
    status: 'ALLOTTED',
    exchangeRef: 'BSE-STAR: 839210492',
    folioNumber: '10928374/82',
  },
  {
    id: 'coin-ord-102',
    orderNumber: 'COIN-20261028-7742',
    time: '28 Oct 2026, 02:15 PM',
    fundName: 'Quant Small Cap Fund - Direct Growth',
    type: 'Lumpsum Purchase',
    amount: 25000.0,
    allottedNav: 242.1,
    allottedUnits: 103.263,
    status: 'ALLOTTED',
    exchangeRef: 'BSE-STAR: 772918401',
    folioNumber: '44829103/99',
  },
];

// ── ACTIVE SYSTEMATIC INVESTMENT PLANS (SIPS VIA ZERODHA COIN) ──
const MF_SIPS_DATA = [
  {
    id: 'sip-1',
    sipId: 'SIP-PPFAS-01',
    fundName: 'Parag Parikh Flexi Cap Fund - Direct Growth',
    amc: 'PPFAS Mutual Fund',
    frequency: 'Monthly',
    dayOfMonth: 5,
    amount: 15000.0,
    nextTriggerDate: '05 Nov 2026',
    status: 'ACTIVE',
    mandateBank: 'HDFC Bank ****4921',
    mandateType: 'e-NACH Autopay',
    totalInstallmentsPaid: 24,
    totalInvested: 360000.0,
    folioNumber: '10928374/82',
  },
  {
    id: 'sip-2',
    sipId: 'SIP-QUANT-02',
    fundName: 'Quant Small Cap Fund - Direct Growth',
    amc: 'Quant Mutual Fund',
    frequency: 'Monthly',
    dayOfMonth: 10,
    amount: 10000.0,
    nextTriggerDate: '10 Nov 2026',
    status: 'ACTIVE',
    mandateBank: 'HDFC Bank ****4921',
    mandateType: 'e-NACH Autopay',
    totalInstallmentsPaid: 18,
    totalInvested: 180000.0,
    folioNumber: '44829103/99',
  },
  {
    id: 'sip-3',
    sipId: 'SIP-UTI-03',
    fundName: 'UTI Nifty 50 Index Fund - Direct Growth',
    amc: 'UTI Mutual Fund',
    frequency: 'Monthly',
    dayOfMonth: 15,
    amount: 20000.0,
    nextTriggerDate: '15 Nov 2026',
    status: 'ACTIVE',
    mandateBank: 'ICICI Bank ****8812',
    mandateType: 'e-NACH Autopay',
    totalInstallmentsPaid: 12,
    totalInvested: 240000.0,
    folioNumber: '77291038/12',
  },
];

// ── MUTUAL FUND HISTORICAL ACTIVITY & NAV MILESTONE TIMELINE ──
const MF_TIMELINE_DATA = [
  {
    id: 'tl-1',
    date: '05 Nov 2026',
    title: 'Scheduled Monthly SIP Trigger',
    fundName: 'Parag Parikh Flexi Cap Fund',
    amount: 15000.0,
    type: 'SIP_TRIGGER',
    status: 'SCHEDULED',
    details: 'Auto-debit scheduled via HDFC Bank e-NACH mandate.',
  },
  {
    id: 'tl-2',
    date: '28 Oct 2026',
    title: 'Lumpsum Additional Purchase Executed',
    fundName: 'Quant Small Cap Fund',
    amount: 25000.0,
    units: 103.263,
    nav: 242.1,
    type: 'LUMPSUM',
    status: 'SETTLED',
    details: 'Allotted at NAV ₹242.100. CDSL Demat credits synchronized.',
  },
  {
    id: 'tl-3',
    date: '15 Oct 2026',
    title: 'Monthly SIP Installment Executed',
    fundName: 'UTI Nifty 50 Index Fund',
    amount: 20000.0,
    units: 123.609,
    nav: 161.8,
    type: 'SIP_INSTALLMENT',
    status: 'SETTLED',
    details:
      'BSE StAR MF order 20261015-881 settled in Demat folio 77291038/12.',
  },
  {
    id: 'tl-4',
    date: '10 Oct 2026',
    title: 'Monthly SIP Installment Executed',
    fundName: 'Quant Small Cap Fund',
    amount: 10000.0,
    units: 41.305,
    nav: 242.1,
    type: 'SIP_INSTALLMENT',
    status: 'SETTLED',
    details: 'Units credited to CDSL BOID 12081600 · 02941021.',
  },
  {
    id: 'tl-5',
    date: '05 Oct 2026',
    title: 'Monthly SIP Installment Executed',
    fundName: 'Parag Parikh Flexi Cap Fund',
    amount: 15000.0,
    units: 177.893,
    nav: 84.32,
    type: 'SIP_INSTALLMENT',
    status: 'SETTLED',
    details: 'Installment #23 settled via Zerodha Coin.',
  },
];

// ── AMFI DIRECT SCHEMES DIRECTORY (AVAILABLE ON ZERODHA COIN) ──
const MF_INSTRUMENTS_DATA = [
  {
    isin: 'INF879O01019',
    schemeCode: '122639',
    fundName: 'Parag Parikh Flexi Cap Fund - Direct Plan - Growth',
    amc: 'PPFAS Mutual Fund',
    category: 'Equity: Flexi Cap',
    nav: 84.32,
    expenseRatio: 0.63,
    minSip: 1000,
    aumCr: 68420.5,
    riskRating: 'Very High',
    turnoverRatio: '14.2%',
  },
  {
    isin: 'INF209K01151',
    schemeCode: '120823',
    fundName: 'Quant Small Cap Fund - Direct Plan - Growth',
    amc: 'Quant Mutual Fund',
    category: 'Equity: Small Cap',
    nav: 242.1,
    expenseRatio: 0.76,
    minSip: 1000,
    aumCr: 21340.0,
    riskRating: 'Very High',
    turnoverRatio: '48.5%',
  },
  {
    isin: 'INF789F01X09',
    schemeCode: '120716',
    fundName: 'UTI Nifty 50 Index Fund - Direct Plan - Growth',
    amc: 'UTI Mutual Fund',
    category: 'Equity: Large Cap Index',
    nav: 161.8,
    expenseRatio: 0.18,
    minSip: 500,
    aumCr: 17820.0,
    riskRating: 'Very High',
    turnoverRatio: '8.1%',
  },
  {
    isin: 'INF179K01BE2',
    schemeCode: '118989',
    fundName: 'HDFC Mid-Cap Opportunities Fund - Direct Plan - Growth',
    amc: 'HDFC Mutual Fund',
    category: 'Equity: Mid Cap',
    nav: 174.6,
    expenseRatio: 0.72,
    minSip: 1000,
    aumCr: 72150.0,
    riskRating: 'Very High',
    turnoverRatio: '19.4%',
  },
  {
    isin: 'INF760K01EH4',
    schemeCode: '119551',
    fundName: 'Mirae Asset Large & Midcap Fund - Direct Plan - Growth',
    amc: 'Mirae Asset Mutual Fund',
    category: 'Equity: Large & Mid Cap',
    nav: 142.1,
    expenseRatio: 0.65,
    minSip: 1000,
    aumCr: 39500.0,
    riskRating: 'Very High',
    turnoverRatio: '22.0%',
  },
  {
    isin: 'INF109K01Z48',
    schemeCode: '120503',
    fundName: 'ICICI Prudential All Seasons Bond Fund - Direct - Growth',
    amc: 'ICICI Prudential AMC',
    category: 'Debt: Dynamic Bond',
    nav: 36.85,
    expenseRatio: 0.42,
    minSip: 5000,
    aumCr: 12450.0,
    riskRating: 'Moderate',
    turnoverRatio: '85.0%',
  },
];

// ── BROKER CONFIGURATION & SETUP PATHWAYS ──
const BROKER_CONFIGS = {
  ZERODHA: {
    id: 'ZERODHA',
    name: 'Zerodha Kite',
    shortName: 'Zerodha',
    setupPath: '/brokers/zerodha',
    dotClass: 'bg-blue-600',
  },
  UPSTOX: {
    id: 'UPSTOX',
    name: 'Upstox',
    shortName: 'Upstox',
    setupPath: '/brokers/upstox',
    dotClass: 'bg-purple-600',
  },
  ANGEL_ONE: {
    id: 'ANGEL_ONE',
    name: 'Angel One',
    shortName: 'Angel One',
    setupPath: '/brokers/angelone',
    dotClass: 'bg-orange-500',
  },
};

// ── BROKER FILTER PILLS ──
const BROKER_TABS = [
  { id: 'ALL', label: 'All demats', count: 14, dotClass: 'bg-emerald-500' },
  { id: 'ZERODHA', label: 'Zerodha Kite', count: 6, dotClass: 'bg-blue-600' },
  { id: 'UPSTOX', label: 'Upstox', count: 5, dotClass: 'bg-purple-600' },
  { id: 'ANGEL_ONE', label: 'Angel One', count: 3, dotClass: 'bg-orange-500' },
];

// ── BROKER PHYSICAL DEMAT CARD METADATA ──
const BROKER_PROFILES = {
  ALL: {
    name: 'All demats',
    dematTitle: 'Aggregated (3 Demats)',
    dpId: 'Aggregated across 3 demat accounts',
    shortDpId: 'URVA-MULTI',
    depository: 'CDSL / NSDL',
    clientCode: 'URVA-MULTI',
    chipLabel: 'All',
    settledCash: 148200.0,
    statusText: 'All 3 broker feeds live',
    supportsMf: true,
  },
  ZERODHA: {
    name: 'Zerodha Kite',
    dematTitle: 'Zerodha Broking Limited',
    dpId: '1208160002941021',
    shortDpId: '1208160002941021',
    depository: 'CDSL',
    clientCode: 'ZK8942',
    chipLabel: 'Kite',
    settledCash: 82400.0,
    statusText: 'Kite Connect session active',
    supportsMf: true,
  },
  UPSTOX: {
    name: 'Upstox',
    dematTitle: 'Upstox Securities Ltd',
    dpId: '1208180004928172',
    shortDpId: '1208180004928172',
    depository: 'CDSL',
    clientCode: '6A7201',
    chipLabel: 'Upstox',
    settledCash: 41300.0,
    statusText: 'Upstox OpenAPI session active',
    supportsMf: false,
  },
  ANGEL_ONE: {
    name: 'Angel One',
    dematTitle: 'Angel One Limited',
    dpId: '1208190001092831',
    shortDpId: '1208190001092831',
    depository: 'CDSL',
    clientCode: 'A19482',
    chipLabel: 'Angel',
    settledCash: 24500.0,
    statusText: 'SmartAPI session active',
    supportsMf: false,
  },
};

// ── AUTHENTIC CONNECTED VENDOR ACCOUNT DOSSIERS ──
// Mirrors real user broker account details and telemetry sync state
const BROKER_ACCOUNT_DETAILS = {
  ZERODHA: {
    key: 'ZERODHA',
    name: 'Zerodha',
    displayName: 'Zerodha Kite',
    initials: 'ZE',
    slug: 'zerodha',
    accentColor: '#387ed1',
    holder: 'Urva Yogeshkumar Gandhi',
    email: 'urvagandhi24@gmail.com',
    clientId: 'EUS554',
    dpId: '1208160002941021',
    brokerName: 'ZERODHA',
    exchanges: ['MF', 'NSE', 'BSE'],
    products: ['CNC', 'NRML', 'MIS', 'BO', 'CO'],
    capabilities: [
      'Holdings',
      'Positions',
      'Funds',
      'MF Holdings',
      'MF SIPs',
      'Orders',
    ],
    lastSyncRelative: '3h ago',
    lastSyncFormatted: '4 Nov 2026 at 08:48 PM',
    lastDurationMs: 60,
    status: 'PARTIAL',
    error:
      'Partial: ZERODHA: ZERODHA API is temporarily unavailable.; ZERODHA: ZERODHA API is temporarily unavailable.; ZERODHA: ZERODHA API is temporarily unavailable.; ZERODHA: ZERODHA API is temporarily unavailable.',
    manageUrl: '/brokers/zerodha',
  },
  UPSTOX: {
    key: 'UPSTOX',
    name: 'Upstox',
    displayName: 'Upstox',
    initials: 'UP',
    slug: 'upstox',
    accentColor: '#7825cf',
    holder: 'Urva Yogeshkumar Gandhi',
    email: 'urvagandhi24@gmail.com',
    clientId: '6A7201',
    dpId: '1208180004928172',
    brokerName: 'UPSTOX',
    exchanges: ['NSE', 'BSE', 'MCX'],
    products: ['DELIVERY', 'INTRADAY', 'MTF'],
    capabilities: ['Holdings', 'Positions', 'Funds', 'Orders'],
    lastSyncRelative: '6h ago',
    lastSyncFormatted: '4 Nov 2026 at 05:30 PM',
    lastDurationMs: 142,
    status: 'EXPIRED',
    error:
      'Session Expired: Daily OAuth token required. Reauthorize to resume live telemetry feeds.',
    manageUrl: '/brokers/upstox',
  },
  ANGEL_ONE: {
    key: 'ANGEL_ONE',
    name: 'Angel One',
    displayName: 'Angel One',
    initials: 'AO',
    slug: 'angelone',
    accentColor: '#f97316',
    holder: 'Urva Yogeshkumar Gandhi',
    email: 'urvagandhi24@gmail.com',
    clientId: 'A19482',
    dpId: '1208190001092831',
    brokerName: 'ANGEL_ONE',
    exchanges: ['NSE', 'BSE', 'MCX', 'NCDEX'],
    products: ['DELIVERY', 'CARRYFORWARD', 'INTRADAY', 'BO', 'CO'],
    capabilities: ['Holdings', 'Positions', 'Funds', 'Orders', 'Trades'],
    lastSyncRelative: 'Never',
    lastSyncFormatted: '—',
    lastDurationMs: null,
    status: 'UNLINKED',
    error: null,
    manageUrl: '/brokers/angelone',
  },
};

// ── DYNAMIC BROKER-SPECIFIC TAB CAPABILITY GROUPS ──
// Strictly reflects the actual API endpoints each broker supports:
// - Zerodha: Equities, Derivatives, Orders, Trades, and Coin Mutual Funds
// - Upstox: Equities, Derivatives, Orders, Trades (NO Mutual Funds API)
// - Angel One: Equities, Derivatives, Orders, Trades (NO Mutual Funds API)
const getBrokerTabGroups = (brokerId, counts) => {
  if (brokerId === 'ZERODHA') {
    return [
      {
        groupLabel: 'EQUITY',
        tabs: [
          { id: 'holdings', label: 'Holdings', count: counts.holdings ?? 6 },
          { id: 'positions', label: 'Positions', count: counts.positions ?? 1 },
        ],
      },
      {
        groupLabel: 'ACTIVITY',
        tabs: [
          { id: 'orders', label: 'Orders', count: counts.orders ?? 3 },
          { id: 'trades', label: 'Trades', count: counts.trades ?? 2 },
        ],
      },
      {
        groupLabel: 'MUTUAL FUNDS',
        tabs: [
          {
            id: 'mf-holdings',
            label: 'MF Holdings',
            count: counts['mf-holdings'] ?? 4,
          },
          {
            id: 'mf-orders',
            label: 'MF Orders',
            count: counts['mf-orders'] ?? 2,
          },
          { id: 'mf-sips', label: 'SIPs', count: counts['mf-sips'] ?? 3 },
          { id: 'mf-timeline', label: 'Timeline' },
          { id: 'mf-instruments', label: 'Instruments' },
        ],
      },
      {
        groupLabel: 'ACCOUNT',
        tabs: [{ id: 'brokers', label: 'Brokers' }],
      },
    ];
  }

  if (brokerId === 'UPSTOX') {
    return [
      {
        groupLabel: 'EQUITY',
        tabs: [
          { id: 'holdings', label: 'Holdings', count: counts.holdings ?? 5 },
          { id: 'positions', label: 'Positions', count: counts.positions ?? 1 },
        ],
      },
      {
        groupLabel: 'ACTIVITY',
        tabs: [
          { id: 'orders', label: 'Orders', count: counts.orders ?? 1 },
          { id: 'trades', label: 'Trades', count: counts.trades ?? 2 },
        ],
      },
      {
        groupLabel: 'ACCOUNT',
        tabs: [{ id: 'brokers', label: 'Brokers' }],
      },
    ];
  }

  if (brokerId === 'ANGEL_ONE') {
    return [
      {
        groupLabel: 'EQUITY',
        tabs: [
          { id: 'holdings', label: 'Holdings', count: counts.holdings ?? 3 },
          { id: 'positions', label: 'Positions', count: counts.positions ?? 1 },
        ],
      },
      {
        groupLabel: 'ACTIVITY',
        tabs: [
          { id: 'orders', label: 'Orders', count: counts.orders ?? 1 },
          { id: 'trades', label: 'Trades', count: counts.trades ?? 0 },
        ],
      },
      {
        groupLabel: 'ACCOUNT',
        tabs: [{ id: 'brokers', label: 'Brokers' }],
      },
    ];
  }

  return [];
};

/**
 * Centered Floating Stock Dossier Modal
 * Replaces the cramped right-side slide-over sheet with a spacious, elevated
 * institutional asset inspector matching NoteReaderModal.jsx and CoinTrack standards.
 */
function StockDossierModal({
  position,
  isOpen,
  onClose,
  copiedIsin,
  onCopyIsin,
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = e => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !position || !mounted) return null;

  const brokerProfile =
    BROKER_PROFILES[position.broker] || BROKER_PROFILES.ZERODHA;

  // 52-Week Range Calculations
  const low52 = position.low52 || position.currentPrice * 0.75;
  const high52 = position.high52 || position.currentPrice * 1.25;
  const priceRange = Math.max(1, high52 - low52);
  const pricePosPercent = Math.min(
    100,
    Math.max(0, ((position.currentPrice - low52) / priceRange) * 100)
  );
  const pctFromHigh = ((position.currentPrice - high52) / high52) * 100;
  const pctFromLow = ((position.currentPrice - low52) / low52) * 100;

  // Capital Gains Breakdown (FIFO)
  const totalQty = position.quantity || 1;
  const ltcgQty = position.ltcgShares ?? totalQty;
  const stcgQty = position.stcgShares ?? 0;
  const ltcgRatio = Math.round((ltcgQty / totalQty) * 100);
  const stcgRatio = 100 - ltcgRatio;

  // Per-share unrealized gain
  const perShareGain = position.currentPrice - position.averageBuyPrice;

  // Estimated LTCG / STCG Gains
  const totalGain = position.unrealizedPL || 0;
  const ltcgGainEst = totalGain > 0 ? (totalGain * ltcgQty) / totalQty : 0;
  const stcgGainEst = totalGain > 0 ? (totalGain * stcgQty) / totalQty : 0;
  // Section 112A: LTCG over ₹1.25L taxed at 12.5%
  const ltcgTaxLiability = Math.max(0, (ltcgGainEst - 125000) * 0.125);
  // Section 111A: STCG taxed at 20.0%
  const stcgTaxLiability = Math.max(0, stcgGainEst * 0.2);

  // Formatted BOID (16 digit CDSL Demat Account -> 8 digits DP ID + 8 digits Client ID)
  const rawBoid = position.dematAccount || brokerProfile.dpId || null;
  const formattedBoid =
    rawBoid && rawBoid.length === 16
      ? `${rawBoid.slice(0, 8)} · ${rawBoid.slice(8)}`
      : rawBoid || '—';

  const brokerPortalUrl =
    position.broker === 'ZERODHA'
      ? 'https://kite.zerodha.com/holdings'
      : position.broker === 'UPSTOX'
        ? 'https://pro.upstox.com/portfolio'
        : 'https://trade.angelone.in/portfolio';

  const brokerName =
    position.broker === 'ZERODHA'
      ? 'Kite'
      : position.broker === 'UPSTOX'
        ? 'Upstox'
        : 'Angel One';

  const modalContent = (
    <div className='fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 overflow-y-auto'>
      {/* Full screen backdrop blur */}
      <div
        onClick={onClose}
        className='fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-150'
      />

      {/* Modal Dialog Card - Elevated centered surface matching NoteReaderModal */}
      <div
        role='dialog'
        aria-modal='true'
        aria-labelledby='stock-dossier-title'
        className='relative z-10 w-full max-w-2xl sm:max-w-[700px] rounded-2xl sm:rounded-3xl bg-white dark:bg-[#16171a] border border-neutral-200/80 dark:border-neutral-800 shadow-2xl p-0 animate-in zoom-in-95 duration-150 flex flex-col max-h-[88vh] overflow-hidden my-auto'
      >
        {/* ── TOP HEADER BAR ── */}
        <div className='px-6 pt-5 pb-4 border-b border-neutral-100 dark:border-neutral-800 shrink-0 space-y-3 bg-white/95 dark:bg-[#16171a]/95 backdrop-blur-md'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <span className='size-2 rounded-full bg-emerald-500 animate-pulse shrink-0' />
              <span className='text-xs font-semibold text-neutral-800 dark:text-neutral-200'>
                CDSL Settled Delivery
              </span>
              <span className='text-[11px] font-mono text-neutral-400 dark:text-neutral-500'>
                · {position.exchange || 'NSE'} Equity
              </span>
            </div>

            <div className='flex items-center gap-2'>
              {/* 1-Click Copy ISIN */}
              <button
                type='button'
                onClick={() => onCopyIsin(position.isin)}
                className='inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 border border-neutral-200/80 dark:border-neutral-700/80 transition-colors cursor-pointer'
                title='Click to copy ISIN'
              >
                <span>{position.isin}</span>
                {copiedIsin ? (
                  <Check className='size-3 text-emerald-500' />
                ) : (
                  <Copy className='size-3 opacity-60' />
                )}
              </button>

              {/* Dedicated Close Button */}
              <button
                type='button'
                onClick={onClose}
                className='size-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer'
                title='Close (Esc)'
                aria-label='Close'
              >
                <X className='size-4' />
              </button>
            </div>
          </div>

          {/* Stock Symbol & Title Row */}
          <div className='flex items-start justify-between gap-3 pt-0.5'>
            <div>
              <div className='flex items-center gap-2.5'>
                <h2
                  id='stock-dossier-title'
                  className='text-2xl sm:text-3xl font-bold font-mono tracking-tight text-neutral-900 dark:text-neutral-100 leading-none'
                >
                  {position.symbol.replace('NSE:', '')}
                </h2>
                <span className='text-xs font-medium px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200/60 dark:border-neutral-700/60'>
                  {position.sector}
                </span>
              </div>
              <p className='text-xs text-neutral-500 dark:text-neutral-400 mt-1 font-normal'>
                {position.companyName}
              </p>
            </div>
            <BrokerBadge broker={position.broker} />
          </div>
        </div>

        {/* ── SCROLLABLE DOSSIER BODY ── */}
        <div className='p-6 space-y-5 flex-1 overflow-y-auto [scrollbar-width:thin]'>
          {/* CARD 1: LIVE MARKET VALUATION & 52-WEEK RANGE HERO */}
          <section className='p-4 sm:p-5 rounded-2xl bg-neutral-50/90 dark:bg-neutral-900/60 border border-neutral-200/80 dark:border-neutral-800 space-y-4 shadow-2xs'>
            <div className='flex items-start justify-between'>
              <div>
                <span className='text-[10px] font-mono uppercase tracking-wider text-neutral-400 dark:text-neutral-500 block mb-1'>
                  Last Traded Price
                </span>
                <div className='flex items-baseline gap-2.5'>
                  <span className='text-3xl font-bold font-mono tnum text-neutral-900 dark:text-neutral-100 tracking-tight'>
                    {formatCurrency(position.currentPrice)}
                  </span>
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-semibold',
                      (position.dayGain || 0) >= 0
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                    )}
                  >
                    {(position.dayGain || 0) >= 0 ? '+' : ''}
                    {formatCurrency(position.dayGain || 0)} (
                    {formatPercent(position.dayGainPercent || 0)})
                  </span>
                </div>
              </div>
              <div className='text-right'>
                <span className='text-[10px] font-mono uppercase tracking-wider text-neutral-400 dark:text-neutral-500 block mb-1'>
                  Holding Position
                </span>
                <span className='text-base font-bold font-mono tnum text-neutral-900 dark:text-neutral-100'>
                  {position.quantity} shares
                </span>
                <span className='text-[11px] font-mono text-neutral-500 dark:text-neutral-400 block mt-0.5'>
                  avg {formatCurrency(position.averageBuyPrice)}
                </span>
              </div>
            </div>

            {/* 52-Week Spectrum Track */}
            <div className='pt-3.5 border-t border-neutral-200/60 dark:border-neutral-800/80 space-y-2'>
              <div className='flex items-center justify-between text-[11px] font-mono'>
                <span className='text-neutral-500 dark:text-neutral-400'>
                  52-Week Range Spectrum
                </span>
                <span className='text-neutral-700 dark:text-neutral-300 font-medium'>
                  {pricePosPercent.toFixed(0)}% of 52W range
                </span>
              </div>

              <div className='relative h-2 rounded-full bg-neutral-200/80 dark:bg-neutral-800 overflow-hidden'>
                <div
                  className='absolute top-0 bottom-0 left-0 bg-neutral-400 dark:bg-neutral-600 rounded-full transition-all'
                  style={{ width: `${pricePosPercent}%` }}
                />
                <div
                  className='absolute top-0 bottom-0 w-1.5 bg-neutral-900 dark:bg-neutral-100 rounded-full shadow-xs'
                  style={{ left: `calc(${pricePosPercent}% - 3px)` }}
                />
              </div>

              <div className='flex justify-between items-center text-[11px] font-mono tnum text-neutral-500'>
                <span>Low: {formatCurrency(low52)}</span>
                <div className='flex items-center gap-2'>
                  <span className='text-emerald-600 dark:text-emerald-400 font-medium'>
                    +{pctFromLow.toFixed(1)}% vs Low
                  </span>
                  <span>·</span>
                  <span className='text-neutral-600 dark:text-neutral-400 font-medium'>
                    {pctFromHigh.toFixed(1)}% vs ATH
                  </span>
                </div>
                <span>High: {formatCurrency(high52)}</span>
              </div>
            </div>
          </section>

          {/* CARD 2: FINANCIAL POSITION & UNREALIZED GAINS BENTO */}
          <section className='p-4 rounded-2xl bg-white dark:bg-[#16171a] border border-neutral-200/80 dark:border-neutral-800 shadow-2xs space-y-3.5'>
            <div className='text-[11px] font-mono font-bold tracking-wider text-neutral-900 dark:text-neutral-100 uppercase'>
              Position Valuation
            </div>

            <div className='grid grid-cols-2 gap-3.5'>
              <div className='p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-900/40 border border-neutral-200/60 dark:border-neutral-800'>
                <span className='text-[10px] font-mono text-neutral-400 uppercase tracking-wider block mb-0.5'>
                  Current Valuation
                </span>
                <span className='text-lg font-bold font-mono tnum text-neutral-900 dark:text-neutral-100'>
                  {formatCurrency(position.currentValue)}
                </span>
              </div>

              <div className='p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-900/40 border border-neutral-200/60 dark:border-neutral-800'>
                <span className='text-[10px] font-mono text-neutral-400 uppercase tracking-wider block mb-0.5'>
                  Invested Capital
                </span>
                <span className='text-lg font-semibold font-mono tnum text-neutral-700 dark:text-neutral-300'>
                  {formatCurrency(position.investedValue)}
                </span>
              </div>
            </div>

            <div className='pt-2 flex items-center justify-between text-xs font-mono'>
              <div>
                <span className='text-neutral-400 text-[10px] uppercase tracking-wider block mb-0.5'>
                  Unrealized Return
                </span>
                <div className='flex items-baseline gap-1.5'>
                  <span
                    className={cn(
                      'text-base font-bold font-mono tnum',
                      position.unrealizedPL >= 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    )}
                  >
                    {position.unrealizedPL >= 0 ? '+' : ''}
                    {formatCurrency(position.unrealizedPL)}
                  </span>
                  <span
                    className={cn(
                      'text-xs font-mono font-semibold',
                      position.unrealizedPL >= 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    )}
                  >
                    ({formatPercent(position.unrealizedPLPercent)})
                  </span>
                </div>
              </div>

              <div className='text-right'>
                <span className='text-neutral-400 text-[10px] uppercase tracking-wider block mb-0.5'>
                  Gain per Share
                </span>
                <span
                  className={cn(
                    'text-sm font-semibold font-mono tnum',
                    perShareGain >= 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-rose-600 dark:text-rose-400'
                  )}
                >
                  {perShareGain >= 0 ? '+' : ''}
                  {formatCurrency(perShareGain)} / share
                </span>
              </div>
            </div>
          </section>

          {/* CARD 3: DEPOSITORY CUSTODY & CLEARING PASSPORT */}
          <section className='p-4 rounded-2xl bg-white dark:bg-[#16171a] border border-neutral-200/80 dark:border-neutral-800 shadow-2xs space-y-3'>
            <div className='flex items-center justify-between'>
              <span className='text-[11px] font-mono font-bold tracking-wider text-neutral-900 dark:text-neutral-100 uppercase'>
                Depository &amp; Clearing Passport
              </span>
              <span className='inline-flex items-center gap-1 text-[10px] font-mono text-emerald-600 dark:text-emerald-400'>
                <span className='size-1.5 rounded-full bg-emerald-500' />
                CDSL Recon Verified
              </span>
            </div>

            <div className='divide-y divide-neutral-100 dark:divide-neutral-800 text-xs font-mono'>
              <div className='py-2.5 flex items-center justify-between'>
                <span className='text-neutral-400'>Central Depository</span>
                <span className='font-semibold text-neutral-900 dark:text-neutral-100'>
                  {position.depository} · Central Depository Services
                </span>
              </div>

              <div className='py-2.5 flex items-center justify-between'>
                <span className='text-neutral-400'>Demat Account (BOID)</span>
                <span className='font-semibold text-neutral-900 dark:text-neutral-100 tnum tracking-wide'>
                  {formattedBoid}
                </span>
              </div>

              <div className='py-2.5 flex items-center justify-between'>
                <span className='text-neutral-400'>Depository Participant</span>
                <span className='text-neutral-800 dark:text-neutral-200'>
                  {position.dpName || brokerProfile.dematTitle}
                </span>
              </div>

              <div className='py-2.5 flex items-center justify-between'>
                <span className='text-neutral-400'>Settlement Status</span>
                <div className='flex items-center gap-1.5'>
                  {position.t1Quantity > 0 ? (
                    <>
                      <span className='size-1.5 rounded-full bg-amber-500' />
                      <span className='text-amber-600 dark:text-amber-400 font-medium'>
                        {position.quantity - position.t1Quantity} Settled ·{' '}
                        {position.t1Quantity} In Flight (T+1)
                      </span>
                    </>
                  ) : (
                    <>
                      <span className='size-1.5 rounded-full bg-emerald-500' />
                      <span className='text-neutral-900 dark:text-neutral-100 font-medium'>
                        {position.quantity} Shares Settled (Normal Rolling)
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className='py-2.5 flex items-center justify-between'>
                <span className='text-neutral-400'>
                  Trade Product &amp; Lien
                </span>
                <span className='text-neutral-800 dark:text-neutral-200'>
                  {position.broker === 'ZERODHA'
                    ? 'CNC · Unpledged / 100% Free'
                    : 'DELIVERY · Unpledged / Free'}
                </span>
              </div>

              <div className='py-2.5 flex items-center justify-between'>
                <span className='text-neutral-400'>
                  Broker Instrument Token
                </span>
                <span className='text-neutral-500 dark:text-neutral-400 tnum'>
                  {position.broker === 'ZERODHA'
                    ? 'Kite Token 2953217'
                    : position.broker === 'ANGEL_ONE'
                      ? 'SmartAPI Token 11536'
                      : `OpenAPI NSE_EQ|${position.isin}`}
                </span>
              </div>
            </div>
          </section>

          {/* CARD 4: CAPITAL GAINS CLASSIFICATION & FIFO TAX ENGINE */}
          <section className='p-4 rounded-2xl bg-white dark:bg-[#16171a] border border-neutral-200/80 dark:border-neutral-800 shadow-2xs space-y-3.5'>
            <div className='flex items-center justify-between text-xs'>
              <div>
                <span className='text-[11px] font-mono font-bold tracking-wider text-neutral-900 dark:text-neutral-100 uppercase block'>
                  Capital Gains Classification (FIFO)
                </span>
                <span className='text-[10px] text-neutral-400 dark:text-neutral-500'>
                  Section 112A / 111A · Finance Act 2024 rules
                </span>
              </div>
              <span className='text-[11px] font-mono text-neutral-500 dark:text-neutral-400'>
                {ltcgRatio}% LTCG · {stcgRatio}% STCG
              </span>
            </div>

            {/* Proportional Ratio Bar */}
            <div className='h-2 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden flex'>
              <div
                className='bg-emerald-500 dark:bg-emerald-400 transition-all'
                style={{ width: `${ltcgRatio}%` }}
                title={`${ltcgQty} LTCG shares (${ltcgRatio}%)`}
              />
              <div
                className='bg-amber-500 dark:bg-amber-400 transition-all'
                style={{ width: `${stcgRatio}%` }}
                title={`${stcgQty} STCG shares (${stcgRatio}%)`}
              />
            </div>

            {/* Dual Tax Split Cards */}
            <div className='grid grid-cols-2 gap-3 pt-1'>
              {/* LTCG Box */}
              <div className='p-3.5 rounded-xl border border-neutral-200/70 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-900/40 space-y-2'>
                <div className='flex items-center justify-between'>
                  <span className='text-[11px] text-neutral-500 font-mono'>
                    LTCG (&gt;365d)
                  </span>
                  <span className='text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-medium'>
                    Sec 112A
                  </span>
                </div>
                <div>
                  <div className='text-base font-bold font-mono tnum text-neutral-900 dark:text-neutral-100'>
                    {ltcgQty} shares
                  </div>
                  <div className='text-[11px] font-mono text-emerald-600 dark:text-emerald-400 tnum'>
                    +{formatCurrency(ltcgGainEst)} gain
                  </div>
                </div>
                <div className='pt-2 border-t border-neutral-200/50 dark:border-neutral-800 text-[10px] text-neutral-400 font-mono'>
                  Rate: 12.5% over ₹1.25L
                  <div className='text-neutral-700 dark:text-neutral-300 font-medium pt-0.5'>
                    Liability: {formatCurrency(ltcgTaxLiability)}
                  </div>
                </div>
              </div>

              {/* STCG Box */}
              <div className='p-3.5 rounded-xl border border-neutral-200/70 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-900/40 space-y-2'>
                <div className='flex items-center justify-between'>
                  <span className='text-[11px] text-neutral-500 font-mono'>
                    STCG (≤365d)
                  </span>
                  <span className='text-[10px] font-mono text-amber-600 dark:text-amber-400 font-medium'>
                    Sec 111A
                  </span>
                </div>
                <div>
                  <div className='text-base font-bold font-mono tnum text-neutral-900 dark:text-neutral-100'>
                    {stcgQty} shares
                  </div>
                  <div className='text-[11px] font-mono text-neutral-600 dark:text-neutral-400 tnum'>
                    {stcgGainEst > 0
                      ? `+${formatCurrency(stcgGainEst)} gain`
                      : '₹0.00 gain'}
                  </div>
                </div>
                <div className='pt-2 border-t border-neutral-200/50 dark:border-neutral-800 text-[10px] text-neutral-400 font-mono'>
                  Rate: 20.0% flat on gains
                  <div className='text-neutral-700 dark:text-neutral-300 font-medium pt-0.5'>
                    Liability: {formatCurrency(stcgTaxLiability)}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* CARD 5: ALLOCATION THESIS & MARGIN NOTES */}
          <section className='p-4 rounded-2xl bg-neutral-50/80 dark:bg-neutral-900/40 border border-neutral-200/70 dark:border-neutral-800 space-y-2.5'>
            <span className='text-[11px] font-mono font-bold tracking-wider text-neutral-900 dark:text-neutral-100 uppercase block'>
              Allocation Thesis &amp; Margin Notes
            </span>
            <p className='text-xs text-neutral-700 dark:text-neutral-300 font-serif italic leading-relaxed'>
              &ldquo;{position.notes}&rdquo;
            </p>
            <div className='flex items-center gap-2 pt-1'>
              <span className='text-[10px] font-mono text-neutral-400 dark:text-neutral-500'>
                Tags:
              </span>
              <span className='text-[10px] font-mono text-neutral-600 dark:text-neutral-400'>
                #{position.sector.toLowerCase().replace(/\s+/g, '-')}
              </span>
              <span className='text-[10px] font-mono text-neutral-600 dark:text-neutral-400'>
                #core-holding
              </span>
              <span className='text-[10px] font-mono text-neutral-600 dark:text-neutral-400'>
                #{position.broker.toLowerCase()}
              </span>
            </div>
          </section>
        </div>

        {/* ── PINNED ACTION FOOTER ── */}
        <div className='p-4 border-t border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/90 dark:bg-neutral-900/90 backdrop-blur-md flex items-center justify-between text-xs shrink-0'>
          <div className='flex items-center gap-2 text-neutral-500 font-mono text-[11px]'>
            <span className='size-2 rounded-full bg-emerald-500 animate-pulse' />
            <span>Live WebSocket · CDSL EOD Recon</span>
          </div>
          <div className='flex items-center gap-2'>
            <a
              href={brokerPortalUrl}
              target='_blank'
              rel='noopener noreferrer'
              className='inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#16171a] hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-medium text-xs transition-colors cursor-pointer'
            >
              <span>Open in {brokerName}</span>
              <ExternalLink className='size-3' />
            </a>
            <button
              type='button'
              onClick={onClose}
              className='px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:hover:bg-neutral-100 dark:text-neutral-900 font-medium text-xs transition-colors cursor-pointer'
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

export default function DesignLabHoldingsClient() {
  const router = useRouter();

  // Selected broker filter state
  const [selectedBroker, setSelectedBroker] = useState('ALL');
  const [activeTab, setActiveTab] = useState('holdings');
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('currentValue');
  const [sortDir, setSortDir] = useState('desc');
  const [isSyncing, setIsSyncing] = useState(false);
  const [inspectPosition, setInspectPosition] = useState(null);
  const [copiedIsin, setCopiedIsin] = useState(false);
  const [instrumentSearch, setInstrumentSearch] = useState('');
  const [instrumentCategoryFilter, setInstrumentCategoryFilter] =
    useState('ALL');

  // ── BROKER CONNECTION LIFECYCLE STATES ──
  // 'CONNECTED' | 'RECONNECT_REQUIRED' | 'NOT_LINKED'
  const [brokerStates, setBrokerStates] = useState({
    ZERODHA: 'CONNECTED',
    UPSTOX: 'RECONNECT_REQUIRED', // Demonstrating expired daily OAuth session!
    ANGEL_ONE: 'NOT_LINKED', // Demonstrating unlinked / no credentials state!
  });

  // Track double-clicks on unlinked broker pills (to redirect on 2nd click)
  const [lastUnlinkedAttempt, setLastUnlinkedAttempt] = useState(null);
  const [isReauthenticating, setIsReauthenticating] = useState(false);
  const [showSimulator, setShowSimulator] = useState(false);

  const activeProfile = BROKER_PROFILES[selectedBroker] || BROKER_PROFILES.ALL;
  const activeBrokerState =
    selectedBroker === 'ALL' ? 'CONNECTED' : brokerStates[selectedBroker];
  const activeConfig =
    selectedBroker === 'ALL' ? null : BROKER_CONFIGS[selectedBroker];

  // ── BROKER PILL CLICK HANDLER ──
  const handleBrokerPillClick = brokerId => {
    if (brokerId === 'ALL') {
      setSelectedBroker('ALL');
      setLastUnlinkedAttempt(null);
      return;
    }

    const state = brokerStates[brokerId];
    const config = BROKER_CONFIGS[brokerId];

    // CASE 1: USER HAS NOT LINKED THIS BROKER (No API Credentials configured)
    if (state === 'NOT_LINKED') {
      const now = Date.now();
      const isSecondClick =
        lastUnlinkedAttempt &&
        lastUnlinkedAttempt.brokerId === brokerId &&
        now - lastUnlinkedAttempt.time < 6000;

      if (isSecondClick) {
        // 2nd click within 6s: User intentionally clicked again -> Navigate to broker setup page!
        toast.info(`Redirecting to ${config.name} setup…`, {
          description: 'Opening broker API credentials wizard.',
        });
        setLastUnlinkedAttempt(null);
        router.push(config.setupPath);
        return;
      }

      // 1st click: Block switch, surface explanatory Sonner warning toast!
      toast.warning(`${config.name} is not connected`, {
        description: `No API credentials configured. Click again to set up ${config.name} integration.`,
        duration: 5000,
        action: {
          label: 'Set up now',
          onClick: () => router.push(config.setupPath),
        },
      });
      setLastUnlinkedAttempt({ brokerId, time: now });
      return;
    }

    // CASE 2: CREDENTIALS EXIST BUT BROKER HAS TO BE RE-CONNECTED (Token Expired)
    if (state === 'RECONNECT_REQUIRED') {
      setSelectedBroker(brokerId);
      setLastUnlinkedAttempt(null);

      toast.warning(`${config.name} session expired`, {
        description: `Daily OAuth token expired at 03:30 AM IST. Showing last synced CDSL snapshot. Re-authenticate to refresh live ticks.`,
        duration: 5500,
        action: {
          label: 'Re-authenticate',
          onClick: () => handleReauthenticate(brokerId),
        },
      });
      return;
    }

    // CASE 3: FULLY CONNECTED & ACTIVE
    setSelectedBroker(brokerId);
    setLastUnlinkedAttempt(null);
  };

  // ── RE-AUTHENTICATE BROKER HANDLER ──
  const handleReauthenticate = brokerId => {
    const config = BROKER_CONFIGS[brokerId];
    setIsReauthenticating(true);

    toast.promise(
      new Promise(resolve => {
        setTimeout(() => {
          setBrokerStates(prev => ({
            ...prev,
            [brokerId]: 'CONNECTED',
          }));
          setIsReauthenticating(false);
          resolve({ name: config.name });
        }, 1100);
      }),
      {
        loading: `Connecting to ${config.name} auth gateway…`,
        success: data =>
          `${data.name} session refreshed successfully! Live tick stream and trade books resumed.`,
        error: 'Failed to re-authenticate session',
      }
    );
  };

  // Filter positions by selected broker
  const brokerPositions = useMemo(() => {
    if (selectedBroker === 'ALL') return HOLDINGS_DATA;
    return HOLDINGS_DATA.filter(h => h.broker === selectedBroker);
  }, [selectedBroker]);

  // Aggregate metrics dynamically based on the active selection
  const metrics = useMemo(() => {
    const totalCurrentValue = brokerPositions.reduce(
      (acc, h) => acc + h.currentValue,
      0
    );
    const totalInvestedValue = brokerPositions.reduce(
      (acc, h) => acc + h.investedValue,
      0
    );
    const totalUnrealizedPL = totalCurrentValue - totalInvestedValue;
    const totalUnrealizedPLPercent =
      totalInvestedValue > 0
        ? (totalUnrealizedPL / totalInvestedValue) * 100
        : 0;
    const totalDayGain = brokerPositions.reduce(
      (acc, h) => acc + (h.dayGain || 0),
      0
    );
    const totalDayGainPercent =
      totalCurrentValue > 0 ? (totalDayGain / totalCurrentValue) * 100 : 0;

    return {
      currentValue: totalCurrentValue,
      investedValue: totalInvestedValue,
      unrealizedPL: totalUnrealizedPL,
      unrealizedPLPercent: totalUnrealizedPLPercent,
      dayGain: totalDayGain,
      dayGainPercent: totalDayGainPercent,
      count: brokerPositions.length,
      settledCash: activeProfile.settledCash,
    };
  }, [brokerPositions, activeProfile]);

  // Filter and sort display positions
  const displayPositions = useMemo(() => {
    let result = [...brokerPositions];

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        h =>
          h.symbol.toLowerCase().includes(q) ||
          h.companyName.toLowerCase().includes(q) ||
          h.isin.toLowerCase().includes(q) ||
          h.sector.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      let aVal = a[sortKey];
      let bVal = b[sortKey];

      if (sortKey === 'symbol') {
        aVal = a.symbol;
        bVal = b.symbol;
        return sortDir === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      aVal = Number(aVal) || 0;
      bVal = Number(bVal) || 0;
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
    });

    return result;
  }, [brokerPositions, search, sortKey, sortDir]);

  // Filtered positions for Positions tab
  const displayIntradayPositions = useMemo(() => {
    if (selectedBroker === 'ALL') return POSITIONS_DATA;
    return POSITIONS_DATA.filter(p => p.broker === selectedBroker);
  }, [selectedBroker]);

  // Filtered orders for Orders tab
  const displayOrders = useMemo(() => {
    if (selectedBroker === 'ALL') return ORDERS_DATA;
    return ORDERS_DATA.filter(o => o.broker === selectedBroker);
  }, [selectedBroker]);

  // Filtered trades for Trades tab
  const displayTrades = useMemo(() => {
    if (selectedBroker === 'ALL') return TRADES_DATA;
    return TRADES_DATA.filter(t => t.broker === selectedBroker);
  }, [selectedBroker]);

  // Tab count mapping
  const tabCounts = useMemo(() => {
    return {
      holdings: brokerPositions.length,
      positions: displayIntradayPositions.length,
      orders: displayOrders.length,
      trades: displayTrades.length,
      'mf-holdings': activeProfile.supportsMf ? MF_DATA.length : 0,
      'mf-orders': activeProfile.supportsMf ? 2 : 0,
      'mf-sips': activeProfile.supportsMf ? 3 : 0,
      brokers: 3,
    };
  }, [
    brokerPositions.length,
    displayIntradayPositions.length,
    displayOrders.length,
    displayTrades.length,
    activeProfile.supportsMf,
  ]);

  // Dynamic tab groups strictly rendered for the selected broker
  const activeTabGroups = useMemo(() => {
    return selectedBroker === 'ALL'
      ? []
      : getBrokerTabGroups(selectedBroker, tabCounts);
  }, [selectedBroker, tabCounts]);

  // Synchronize activeTab safely when switching brokers or to ALL
  useEffect(() => {
    if (selectedBroker === 'ALL') {
      if (activeTab !== 'holdings') setActiveTab('holdings');
    } else {
      const validIds = activeTabGroups.flatMap(g => g.tabs.map(t => t.id));
      if (validIds.length > 0 && !validIds.includes(activeTab)) {
        setActiveTab('holdings');
      }
    }
  }, [selectedBroker, activeTabGroups, activeTab]);

  const handleSort = key => {
    if (sortKey === key) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const triggerSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      toast.success('Holdings synchronized with exchange tick feeds');
    }, 850);
  };

  // Determine if active tab is in MF section and selected broker does not support MF
  const isMfTab = activeTab.startsWith('mf-');
  const isMfBlocked = isMfTab && !activeProfile.supportsMf;

  return (
    <div className='min-h-screen bg-neutral-50 dark:bg-[#0c0d0e] selection:bg-neutral-900 selection:text-white dark:selection:bg-white dark:selection:text-neutral-900'>
      {/* Design Lab Floating Dock */}
      <DesignLabAuthNav />

      {/* Main Container matching CoinTrack's workspace padding */}
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8'>
        <div className='w-full pb-8 md:pb-12 space-y-6 sm:space-y-7'>
          {/* ─────────────────────────────────────────────────────────────
              1. PAGE HEADER (Consistent with DashboardHeader & BrokersHeader)
              ───────────────────────────────────────────────────────────── */}
          <section className='flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2'>
            <div>
              <div className='flex items-center gap-2 mb-1'>
                <span
                  className={cn(
                    'size-2 rounded-full shrink-0',
                    activeBrokerState === 'CONNECTED'
                      ? 'bg-emerald-500 animate-pulse'
                      : activeBrokerState === 'RECONNECT_REQUIRED'
                        ? 'bg-amber-500 animate-pulse'
                        : 'bg-neutral-400'
                  )}
                />
                <span className='text-xs font-semibold text-neutral-800 dark:text-neutral-200'>
                  {activeBrokerState === 'RECONNECT_REQUIRED'
                    ? `${activeProfile.name} session expired · CDSL snapshot`
                    : activeProfile.statusText}
                </span>
                <span className='text-neutral-300 dark:text-neutral-700'>
                  ·
                </span>
                <span className='text-xs text-neutral-500 dark:text-neutral-400 font-mono'>
                  Q4 2026
                </span>
              </div>

              <h1 className='text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100'>
                Portfolio &amp; Ledgers
              </h1>
              <p className='text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-0.5'>
                Aggregated multi-demat equity positions, settlement logs, and
                automated FIFO tax tracking.
              </p>
            </div>

            {/* Top Right Action Controls */}
            <div className='flex items-center gap-2.5 self-start md:self-auto flex-wrap'>
              <button
                type='button'
                onClick={() => setShowSimulator(s => !s)}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer shadow-2xs',
                  showSimulator
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-neutral-900 dark:border-white'
                    : 'bg-white dark:bg-[#16171a] border-neutral-200/80 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                )}
              >
                <SlidersHorizontal className='size-3.5 text-neutral-400' />
                <span>Simulate states</span>
              </button>

              <button
                type='button'
                onClick={() => {
                  toast.success('Holdings exported as canonical CSV');
                }}
                className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200/80 dark:border-neutral-800 text-xs font-medium text-neutral-700 dark:text-neutral-300 bg-white dark:bg-[#16171a] hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors shadow-2xs cursor-pointer'
              >
                <Download className='size-3.5 text-neutral-400' />
                <span>Export CSV</span>
              </button>

              <button
                type='button'
                onClick={triggerSync}
                disabled={isSyncing}
                className='inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-all shadow-2xs cursor-pointer active:scale-[0.98] disabled:opacity-60'
              >
                <RefreshCw
                  className={cn('size-3.5', isSyncing && 'animate-spin')}
                />
                <span>{isSyncing ? 'Syncing...' : 'Sync feeds'}</span>
              </button>
            </div>
          </section>

          {/* ─────────────────────────────────────────────────────────────
              INTERACTIVE DEMO SIMULATOR TRAY
              Allows instantly toggling broker connection states to test:
              1. Unlinked broker (1st click warning -> 2nd click redirect)
              2. Expired broker (Re-auth banner & session refresh)
              ───────────────────────────────────────────────────────────── */}
          {showSimulator && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className='p-4 rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#16171a] text-xs space-y-2.5 shadow-2xs'
            >
              <div className='flex items-center justify-between'>
                <span className='font-semibold text-neutral-900 dark:text-neutral-100 font-mono'>
                  BROKER CONNECTION STATE SIMULATOR
                </span>
                <span className='text-neutral-500 font-mono text-[11px]'>
                  Test unlinked vs. expired vs. active logic
                </span>
              </div>
              <div className='grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1'>
                {Object.keys(BROKER_CONFIGS).map(key => {
                  const bName = BROKER_CONFIGS[key].name;
                  const currentStatus = brokerStates[key];
                  return (
                    <div
                      key={key}
                      className='p-2.5 rounded-lg border border-neutral-100 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/40 space-y-1.5'
                    >
                      <span className='font-semibold text-neutral-800 dark:text-neutral-200 block'>
                        {bName}
                      </span>
                      <div className='flex items-center gap-1 font-mono text-[10px]'>
                        <button
                          type='button'
                          onClick={() => {
                            setBrokerStates(prev => ({
                              ...prev,
                              [key]: 'CONNECTED',
                            }));
                            toast.success(`${bName} set to Connected`);
                          }}
                          className={cn(
                            'px-2 py-0.5 rounded cursor-pointer transition-colors',
                            currentStatus === 'CONNECTED'
                              ? 'bg-emerald-500 text-white font-bold'
                              : 'bg-neutral-200/80 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                          )}
                        >
                          Connected
                        </button>
                        <button
                          type='button'
                          onClick={() => {
                            setBrokerStates(prev => ({
                              ...prev,
                              [key]: 'RECONNECT_REQUIRED',
                            }));
                            toast.warning(`${bName} set to Re-auth Required`);
                          }}
                          className={cn(
                            'px-2 py-0.5 rounded cursor-pointer transition-colors',
                            currentStatus === 'RECONNECT_REQUIRED'
                              ? 'bg-amber-500 text-white font-bold'
                              : 'bg-neutral-200/80 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                          )}
                        >
                          Expired
                        </button>
                        <button
                          type='button'
                          onClick={() => {
                            setBrokerStates(prev => ({
                              ...prev,
                              [key]: 'NOT_LINKED',
                            }));
                            if (selectedBroker === key)
                              setSelectedBroker('ALL');
                            toast.info(`${bName} set to Not Linked`);
                          }}
                          className={cn(
                            'px-2 py-0.5 rounded cursor-pointer transition-colors',
                            currentStatus === 'NOT_LINKED'
                              ? 'bg-neutral-700 text-white font-bold'
                              : 'bg-neutral-200/80 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                          )}
                        >
                          Unlinked
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              2. HERO DEMAT & VALUATION BANNER (IMAGE 1 SPECIFICATION)
              Left: Total Equity Valuation + Embedded Metallic Physical Demat Card
              Right: Today's Return + Available Settled Margin
              ───────────────────────────────────────────────────────────── */}
          <section className='grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-stretch'>
            {/* Card 1: Valuation & Physical Demat Depository Card (8 Cols) */}
            <div className='lg:col-span-8 rounded-2xl border border-neutral-800/90 bg-[#141518] text-white p-5 sm:p-6 shadow-sm flex flex-col justify-between relative overflow-hidden'>
              {/* Subtle top ambient sheen */}
              <div className='absolute -top-24 -left-24 size-48 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none' />

              <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-6'>
                {/* Left Metrics Column */}
                <div className='space-y-4'>
                  <div>
                    <span className='text-xs sm:text-[13px] text-neutral-400 font-medium block mb-1'>
                      {selectedBroker === 'ALL'
                        ? 'Total equity valuation'
                        : `${activeProfile.name} equity valuation`}
                    </span>
                    <div className='text-3xl sm:text-4xl md:text-[42px] font-bold font-mono tnum text-white tracking-tight leading-none'>
                      {formatCurrency(metrics.currentValue)}
                    </div>
                  </div>

                  <div className='flex items-center gap-1.5 font-mono text-xs sm:text-sm text-emerald-400 font-medium flex-wrap'>
                    <span>
                      {metrics.unrealizedPL >= 0 ? '+' : ''}
                      {formatPercent(metrics.unrealizedPLPercent)} vs cost basis
                    </span>
                    <span className='text-neutral-600'>·</span>
                    <span>
                      {metrics.unrealizedPL >= 0 ? '+' : ''}
                      {formatCurrency(metrics.unrealizedPL)} unrealized
                    </span>
                  </div>
                </div>

                {/* Right: Embedded Physical Demat Card (Faithful to Image 1) */}
                <div className='relative w-[210px] sm:w-[240px] aspect-[1.58/1] rounded-2xl p-3.5 sm:p-4 bg-gradient-to-br from-[#1e2024] via-[#16171a] to-[#0c0d0e] border border-neutral-700/60 shadow-xl flex flex-col justify-between select-none overflow-hidden shrink-0 group transition-transform hover:scale-[1.02]'>
                  {/* Sheen reflection */}
                  <div className='absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.04] to-transparent pointer-events-none' />

                  {/* Card Top Row */}
                  <div className='flex items-center justify-between z-10'>
                    <span className='font-mono text-[9px] uppercase tracking-wider text-neutral-400 font-medium'>
                      {activeProfile.depository}
                    </span>
                    <span className='font-mono text-[9px] uppercase tracking-widest text-neutral-200 font-semibold px-1.5 py-0.5 rounded bg-white/[0.08]'>
                      {activeProfile.chipLabel}
                    </span>
                  </div>

                  {/* Golden IC Microchip */}
                  <div className='z-10 my-auto py-1'>
                    <div className='w-8 h-6 rounded-[4px] bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 p-[1.5px] shadow-sm border border-amber-300/40 relative flex items-center justify-center overflow-hidden'>
                      {/* IC contact pad grid lines */}
                      <div className='w-full h-full rounded-[2px] bg-amber-400/90 border border-amber-600/30 flex items-center justify-center relative'>
                        <div className='w-full h-[1px] bg-amber-700/40 absolute' />
                        <div className='h-full w-[1px] bg-amber-700/40 absolute' />
                        <div className='w-3 h-2 rounded-[1px] border border-amber-700/40' />
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom: Demat Title & DP ID */}
                  <div className='z-10 space-y-0.5'>
                    <div className='flex items-center justify-between'>
                      <span className='text-[11px] font-semibold text-neutral-100 font-mono tracking-tight truncate max-w-[130px]'>
                        {activeProfile.dematTitle}
                      </span>

                      {/* Connection status tag */}
                      {activeBrokerState === 'RECONNECT_REQUIRED' ? (
                        <span className='inline-flex items-center gap-1 text-[8px] font-mono font-bold text-amber-400 tracking-wider'>
                          <span className='size-1.5 rounded-full bg-amber-400 animate-pulse' />
                          RE-AUTH
                        </span>
                      ) : activeBrokerState === 'NOT_LINKED' ? (
                        <span className='inline-flex items-center gap-1 text-[8px] font-mono font-bold text-neutral-400 tracking-wider'>
                          <span className='size-1.5 rounded-full bg-neutral-500' />
                          UNLINKED
                        </span>
                      ) : (
                        <span className='inline-flex items-center gap-1 text-[8px] font-mono font-bold text-emerald-400 tracking-wider'>
                          <span className='size-1.5 rounded-full bg-emerald-400 animate-pulse' />
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <div className='flex items-center justify-between text-[9px] text-neutral-400 font-mono'>
                      <span className='truncate max-w-[130px]'>
                        DP: {activeProfile.shortDpId}
                      </span>
                      <span>{activeProfile.clientCode}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Depository & Cost Basis Line (Image 1 bottom) */}
              <div className='pt-4 mt-4 border-t border-neutral-800/80 flex items-center gap-2 text-xs text-neutral-400 font-mono'>
                <ShieldCheck className='size-3.5 text-emerald-400 shrink-0' />
                <span>Depository: {activeProfile.depository}</span>
                <span className='text-neutral-600'>·</span>
                <span>Cost: {formatCurrency(metrics.investedValue)}</span>
              </div>
            </div>

            {/* Card 2: Today's Return & Available Settled Margin (4 Cols) */}
            <div className='lg:col-span-4 rounded-2xl border border-neutral-800/90 bg-[#141518] text-white p-5 sm:p-6 shadow-sm flex flex-col justify-between space-y-4'>
              {/* Top Half: Today's Return */}
              <div>
                <span className='text-xs text-neutral-400 font-medium block mb-1'>
                  Today&apos;s return
                </span>
                <div className='flex items-baseline gap-2'>
                  <span
                    className={cn(
                      'text-2xl sm:text-3xl font-bold font-mono tnum tracking-tight',
                      metrics.dayGain >= 0
                        ? 'text-emerald-400'
                        : 'text-rose-400'
                    )}
                  >
                    {metrics.dayGain >= 0 ? '+' : ''}
                    {formatCurrency(metrics.dayGain)}
                  </span>
                  <span
                    className={cn(
                      'text-xs font-mono font-semibold',
                      metrics.dayGain >= 0
                        ? 'text-emerald-400'
                        : 'text-rose-400'
                    )}
                  >
                    {metrics.dayGain >= 0 ? '+' : ''}
                    {formatPercent(metrics.dayGainPercent)}
                  </span>
                </div>
                <p className='text-xs text-neutral-500 font-normal mt-0.5'>
                  1-day change vs previous close
                </p>
              </div>

              {/* Hairline Divider */}
              <div className='border-t border-neutral-800/80' />

              {/* Bottom Half: Available Margin */}
              <div>
                <span className='text-xs text-neutral-400 font-medium block mb-1'>
                  Available margin
                </span>
                <div className='text-xl sm:text-2xl font-bold font-mono tnum text-white tracking-tight'>
                  {formatCurrency(metrics.settledCash)}
                </div>
                <p className='text-xs text-neutral-500 font-normal mt-0.5'>
                  Settled trading balance
                </p>
              </div>
            </div>
          </section>

          {/* ─────────────────────────────────────────────────────────────
              3. BROKER ACCOUNT FILTER STRIP
              - If not linked: 1st click shows Sonner toast, 2nd click redirects to setup!
              - If needs reconnect: shows amber indicator + re-auth notice!
              ───────────────────────────────────────────────────────────── */}
          <section className='flex items-center justify-between gap-3 flex-wrap'>
            <div className='flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none'>
              {BROKER_TABS.map(tab => {
                const isActive = selectedBroker === tab.id;
                const status =
                  tab.id === 'ALL' ? 'CONNECTED' : brokerStates[tab.id];

                let dotClass = tab.dotClass;
                let badgeText = null;

                if (tab.id !== 'ALL') {
                  if (status === 'NOT_LINKED') {
                    dotClass = 'bg-neutral-400 dark:bg-neutral-600';
                    badgeText = 'unlinked';
                  } else if (status === 'RECONNECT_REQUIRED') {
                    dotClass = 'bg-amber-500 animate-pulse';
                    badgeText = 're-auth';
                  }
                }

                return (
                  <button
                    key={tab.id}
                    type='button'
                    onClick={() => handleBrokerPillClick(tab.id)}
                    className={cn(
                      'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap',
                      isActive
                        ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-semibold shadow-2xs'
                        : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white bg-neutral-100/70 dark:bg-neutral-800/60',
                      status === 'NOT_LINKED' &&
                        !isActive &&
                        'border border-dashed border-neutral-300 dark:border-neutral-700 opacity-80'
                    )}
                  >
                    <span
                      className={cn('size-1.5 rounded-full shrink-0', dotClass)}
                    />
                    <span>{tab.label}</span>
                    {badgeText ? (
                      <span
                        className={cn(
                          'text-[9px] font-mono uppercase px-1 py-0.2 rounded',
                          status === 'NOT_LINKED' &&
                            'bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400',
                          status === 'RECONNECT_REQUIRED' &&
                            'bg-amber-500/20 text-amber-700 dark:text-amber-300 font-semibold'
                        )}
                      >
                        {badgeText}
                      </span>
                    ) : (
                      <span className='text-[11px] opacity-70 font-mono'>
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className='text-xs font-mono text-neutral-500 dark:text-neutral-400'>
              Broker Scope:{' '}
              <span className='font-semibold text-neutral-900 dark:text-neutral-100'>
                {activeProfile.name}
              </span>
            </div>
          </section>

          {/* ─────────────────────────────────────────────────────────────
              RE-CONNECTION NOTICE BANNER (WHEN BROKER SESSION IS EXPIRED)
              Appears if the active broker credentials exist but need daily re-auth!
              ───────────────────────────────────────────────────────────── */}
          {activeBrokerState === 'RECONNECT_REQUIRED' && activeConfig && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className='rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs'
            >
              <div className='flex items-start sm:items-center gap-3'>
                <div className='size-8 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0'>
                  <AlertTriangle className='size-4' />
                </div>
                <div>
                  <span className='font-semibold text-neutral-900 dark:text-neutral-100 block sm:inline'>
                    {activeProfile.name} session expired (Daily 03:30 AM IST
                    OAuth invalidation)
                  </span>
                  <span className='text-neutral-600 dark:text-neutral-400 block sm:inline sm:ml-1'>
                    Showing last synced snapshot from CDSL. Re-authenticate to
                    refresh live prices and trade books.
                  </span>
                </div>
              </div>

              <div className='flex items-center gap-2 self-end sm:self-auto shrink-0'>
                <button
                  type='button'
                  disabled={isReauthenticating}
                  onClick={() => handleReauthenticate(selectedBroker)}
                  className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-500 hover:bg-amber-600 text-white shadow-2xs transition-colors cursor-pointer disabled:opacity-60'
                >
                  <RefreshCw
                    className={cn(
                      'size-3',
                      isReauthenticating && 'animate-spin'
                    )}
                  />
                  <span>
                    {isReauthenticating
                      ? 'Re-authorizing...'
                      : 'Re-authenticate now'}
                  </span>
                </button>
                <Link
                  href={activeConfig.setupPath}
                  className='px-2.5 py-1.5 rounded-lg text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors'
                >
                  Manage
                </Link>
              </div>
            </motion.div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              4. CATEGORIZED TAB NAVIGATION BAR
              - STRICT USER REQUIREMENT: In "All demats", this is NOT VISIBLE!
              - For individual brokers: Dynamically rendered with only the tabs
                and counts that the broker's API actually provides!
              ───────────────────────────────────────────────────────────── */}
          {selectedBroker !== 'ALL' && activeTabGroups.length > 0 && (
            <nav className='rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#16171a] shadow-2xs overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'>
              <div className='flex gap-0 min-w-max divide-x divide-neutral-200/80 dark:divide-neutral-800'>
                {activeTabGroups.map(group => (
                  <div
                    key={group.groupLabel}
                    className='px-4 py-3 first:pl-5 last:pr-5'
                  >
                    {/* Eyebrow Header */}
                    <p className='text-[10px] font-semibold tracking-wider text-neutral-400 dark:text-neutral-500 uppercase mb-2 flex items-center'>
                      <span className='font-mono mr-1.5 text-neutral-300 dark:text-neutral-600'>
                        ·
                      </span>
                      <span>{group.groupLabel}</span>
                    </p>

                    {/* Sub-Tabs */}
                    <div className='flex gap-1'>
                      {group.tabs.map(tab => {
                        const isActive = activeTab === tab.id;

                        return (
                          <button
                            key={tab.id}
                            type='button'
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                              'relative h-8 px-3 text-[12px] font-medium tracking-tight whitespace-nowrap transition-colors rounded-sm cursor-pointer',
                              isActive
                                ? 'text-neutral-900 dark:text-neutral-100 font-semibold'
                                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
                            )}
                          >
                            {/* Orange Active Tab Underline from Image 2 */}
                            {isActive && (
                              <motion.span
                                layoutId='portfolio-tab-underline'
                                className='absolute -bottom-px left-0 right-0 h-[2px] bg-orange-500'
                                transition={{
                                  duration: 0.22,
                                  ease: [0.22, 1, 0.36, 1],
                                }}
                              />
                            )}

                            <span className='relative z-10 inline-flex items-center'>
                              {tab.label}
                              {tab.count != null && tab.count > 0 && (
                                <span
                                  className={cn(
                                    'ml-1.5 px-1 font-mono tnum text-[10px] rounded-sm',
                                    isActive
                                      ? 'text-orange-500 font-semibold'
                                      : 'text-neutral-400 dark:text-neutral-500'
                                  )}
                                >
                                  {tab.count}
                                </span>
                              )}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </nav>
          )}

          {/* ─────────────────────────────────────────────────────────────
              5. ACTIVE TAB CONTENT
              Holdings · Positions · Orders · Trades · Mutual Funds · Brokers
              ───────────────────────────────────────────────────────────── */}
          {/* TAB 1: HOLDINGS */}
          {activeTab === 'holdings' && (
            <section className='space-y-4'>
              {/* Filter bar */}
              <div className='flex flex-wrap items-center justify-between gap-3 pb-2'>
                <div className='flex items-center gap-3 flex-wrap'>
                  {/* Search Input */}
                  <div className='relative w-64'>
                    <Search className='absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-neutral-400 pointer-events-none' />
                    <input
                      type='text'
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      placeholder='Search symbol, company, ISIN…'
                      className='w-full pl-9 pr-3 py-1.5 rounded-lg border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#16171a] text-xs text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-600 transition-colors font-mono'
                    />
                    {search && (
                      <button
                        type='button'
                        onClick={() => setSearch('')}
                        className='absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer'
                      >
                        <X className='size-3' />
                      </button>
                    )}
                  </div>

                  {/* Broker capability note if single broker selected */}
                  {selectedBroker === 'UPSTOX' && (
                    <span className='text-[11px] text-neutral-500 dark:text-neutral-400 font-mono inline-flex items-center gap-1.5'>
                      <Info className='size-3 text-purple-500' />
                      Upstox API: Real-time LTP tick stream active
                    </span>
                  )}
                  {selectedBroker === 'ANGEL_ONE' && (
                    <span className='text-[11px] text-neutral-500 dark:text-neutral-400 font-mono inline-flex items-center gap-1.5'>
                      <Info className='size-3 text-orange-500' />
                      SmartAPI: Real-time LTP &amp; RMS funds active
                    </span>
                  )}
                </div>

                <div className='text-xs font-mono text-neutral-500 dark:text-neutral-400'>
                  {displayPositions.length} of {brokerPositions.length} on
                  record
                </div>
              </div>

              {/* Master Holdings Table */}
              <div className='rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#16171a] shadow-2xs overflow-hidden'>
                <div className='overflow-x-auto'>
                  <table className='w-full text-left border-collapse'>
                    <thead>
                      <tr className='border-b border-neutral-100 dark:border-neutral-800/80 text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 font-mono uppercase tracking-wider bg-neutral-50/50 dark:bg-neutral-900/30'>
                        <th className='py-3 pl-4 pr-2 w-10 text-center'>#</th>
                        <th
                          className='py-3 px-3 cursor-pointer hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors'
                          onClick={() => handleSort('symbol')}
                        >
                          <div className='flex items-center gap-1'>
                            <span>Stock</span>
                            <ArrowUpDown className='size-3' />
                          </div>
                        </th>

                        {/* ─────────────────────────────────────────────────────────────
                            CRITICAL USER DIRECTIVE:
                            Hide the Broker column when a specific broker is selected!
                            Show Broker column ONLY when selectedBroker === 'ALL'
                            ───────────────────────────────────────────────────────────── */}
                        {selectedBroker === 'ALL' && (
                          <th className='py-3 px-3'>Broker</th>
                        )}

                        <th
                          className='py-3 px-3 text-right cursor-pointer hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors'
                          onClick={() => handleSort('quantity')}
                        >
                          <div className='flex items-center justify-end gap-1'>
                            <span>Qty</span>
                            <ArrowUpDown className='size-3' />
                          </div>
                        </th>
                        <th
                          className='py-3 px-3 text-right cursor-pointer hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors'
                          onClick={() => handleSort('averageBuyPrice')}
                        >
                          <div className='flex items-center justify-end gap-1'>
                            <span>Avg</span>
                            <ArrowUpDown className='size-3' />
                          </div>
                        </th>
                        <th className='py-3 px-3 text-right'>LTP</th>
                        <th
                          className='py-3 px-3 text-right cursor-pointer hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors'
                          onClick={() => handleSort('currentValue')}
                        >
                          <div className='flex items-center justify-end gap-1'>
                            <span>Value</span>
                            <ArrowUpDown className='size-3' />
                          </div>
                        </th>
                        <th
                          className='py-3 px-3 text-right cursor-pointer hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors'
                          onClick={() => handleSort('unrealizedPL')}
                        >
                          <div className='flex items-center justify-end gap-1'>
                            <span>P&amp;L</span>
                            <ArrowUpDown className='size-3' />
                          </div>
                        </th>
                        <th className='py-3 pr-5 pl-3 text-right'>1D Move</th>
                      </tr>
                    </thead>
                    <tbody className='divide-y divide-neutral-100 dark:divide-neutral-800/80 text-xs'>
                      {displayPositions.length === 0 ? (
                        <tr>
                          <td
                            colSpan={selectedBroker === 'ALL' ? 9 : 8}
                            className='py-12 text-center'
                          >
                            <BarChart2 className='size-6 text-neutral-400 mx-auto mb-2 opacity-60' />
                            <p className='font-serif italic text-base text-neutral-700 dark:text-neutral-300'>
                              No equity positions on record for{' '}
                              {activeProfile.name}.
                            </p>
                          </td>
                        </tr>
                      ) : (
                        displayPositions.map((pos, i) => {
                          const pnlPos = pos.unrealizedPL >= 0;
                          const dayPos = (pos.dayGain || 0) >= 0;

                          return (
                            <tr
                              key={pos.id}
                              onClick={() => setInspectPosition(pos)}
                              className='group hover:bg-neutral-50/80 dark:hover:bg-neutral-850/50 transition-colors cursor-pointer'
                            >
                              {/* Index */}
                              <td className='py-3 pl-4 pr-2 text-center font-mono tnum text-[11px] text-neutral-400 group-hover:text-neutral-600 dark:group-hover:text-neutral-300'>
                                {String(i + 1).padStart(2, '0')}
                              </td>

                              {/* Symbol & Name */}
                              <td className='py-3 px-3'>
                                <div className='flex flex-col'>
                                  <span className='font-semibold text-neutral-900 dark:text-neutral-100 font-mono tracking-tight group-hover:text-neutral-900 dark:group-hover:text-white'>
                                    {pos.symbol.replace('NSE:', '')}
                                  </span>
                                  <span className='text-[10px] text-neutral-500 dark:text-neutral-400 truncate max-w-[170px]'>
                                    {pos.companyName}
                                  </span>
                                </div>
                              </td>

                              {/* Broker Tag — ONLY SHOWN WHEN selectedBroker === 'ALL' */}
                              {selectedBroker === 'ALL' && (
                                <td className='py-3 px-3'>
                                  <BrokerBadge broker={pos.broker} />
                                </td>
                              )}

                              {/* Qty (with T1 unsettled tag) */}
                              <td className='py-3 px-3 text-right font-mono tnum'>
                                <span className='font-medium text-neutral-900 dark:text-neutral-100'>
                                  {pos.quantity}
                                </span>
                                {pos.t1Quantity > 0 && (
                                  <span
                                    title={`${pos.t1Quantity} shares pending T+1 settlement`}
                                    className='ml-1 text-[10px] font-mono text-amber-500 font-semibold'
                                  >
                                    +{pos.t1Quantity} T1
                                  </span>
                                )}
                              </td>

                              {/* Avg Buy Price */}
                              <td className='py-3 px-3 text-right font-mono tnum text-neutral-600 dark:text-neutral-400'>
                                {formatCurrency(pos.averageBuyPrice, {
                                  precise: true,
                                })}
                              </td>

                              {/* LTP */}
                              <td className='py-3 px-3 text-right font-mono tnum font-medium text-neutral-900 dark:text-neutral-100'>
                                {formatCurrency(pos.currentPrice)}
                              </td>

                              {/* Current Value */}
                              <td className='py-3 px-3 text-right font-mono tnum font-semibold text-neutral-900 dark:text-neutral-100'>
                                {formatCurrency(pos.currentValue)}
                              </td>

                              {/* Unrealized P&L */}
                              <td className='py-3 px-3 text-right font-mono tnum'>
                                <div className='flex flex-col items-end'>
                                  <span
                                    className={cn(
                                      'font-semibold text-xs',
                                      pnlPos
                                        ? 'text-emerald-600 dark:text-emerald-400'
                                        : 'text-rose-600 dark:text-rose-400'
                                    )}
                                  >
                                    {pnlPos ? '+' : ''}
                                    {formatCurrency(pos.unrealizedPL)}
                                  </span>
                                  <span
                                    className={cn(
                                      'text-[10px]',
                                      pnlPos
                                        ? 'text-emerald-600 dark:text-emerald-400'
                                        : 'text-rose-600 dark:text-rose-400'
                                    )}
                                  >
                                    {pnlPos ? '+' : ''}
                                    {formatPercent(pos.unrealizedPLPercent)}
                                  </span>
                                </div>
                              </td>

                              {/* Day Move */}
                              <td className='py-3 pr-5 pl-3 text-right font-mono tnum'>
                                {pos.dayGain != null ? (
                                  <div className='flex flex-col items-end'>
                                    <span
                                      className={cn(
                                        'font-medium text-[11px]',
                                        dayPos
                                          ? 'text-emerald-600 dark:text-emerald-400'
                                          : 'text-rose-600 dark:text-rose-400'
                                      )}
                                    >
                                      {dayPos ? '+' : ''}
                                      {formatCurrency(pos.dayGain)}
                                    </span>
                                    <span
                                      className={cn(
                                        'text-[10px]',
                                        dayPos
                                          ? 'text-emerald-600 dark:text-emerald-400'
                                          : 'text-rose-600 dark:text-rose-400'
                                      )}
                                    >
                                      {dayPos ? '+' : ''}
                                      {formatPercent(pos.dayGainPercent)}
                                    </span>
                                  </div>
                                ) : (
                                  <span className='text-neutral-400 font-mono'>
                                    —
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}

          {/* TAB 2: POSITIONS (INTRADAY / F&O) */}
          {activeTab === 'positions' && (
            <section className='space-y-4'>
              <div className='rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#16171a] shadow-2xs overflow-hidden'>
                <div className='p-4 border-b border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <Layers className='size-4 text-neutral-400' />
                    <span className='font-semibold text-xs text-neutral-900 dark:text-neutral-100'>
                      Active Derivatives &amp; Intraday Positions
                    </span>
                  </div>
                  <span className='text-xs font-mono text-neutral-500 dark:text-neutral-400'>
                    Supported on Zerodha, Upstox &amp; Angel One
                  </span>
                </div>
                <div className='overflow-x-auto'>
                  <table className='w-full text-left border-collapse text-xs'>
                    <thead>
                      <tr className='border-b border-neutral-100 dark:border-neutral-800/80 text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 font-mono uppercase bg-neutral-50/50 dark:bg-neutral-900/30'>
                        <th className='py-3 pl-4 pr-3'>Contract</th>
                        {selectedBroker === 'ALL' && (
                          <th className='py-3 px-3'>Broker</th>
                        )}
                        <th className='py-3 px-3'>Product</th>
                        <th className='py-3 px-3 text-right'>Qty</th>
                        <th className='py-3 px-3 text-right'>Buy Avg</th>
                        <th className='py-3 px-3 text-right'>LTP</th>
                        <th className='py-3 pr-5 pl-3 text-right'>
                          Net P&amp;L
                        </th>
                      </tr>
                    </thead>
                    <tbody className='divide-y divide-neutral-100 dark:divide-neutral-800/80'>
                      {displayIntradayPositions.map(pos => (
                        <tr
                          key={pos.id}
                          className='hover:bg-neutral-50/60 dark:hover:bg-neutral-850/50'
                        >
                          <td className='py-3 pl-4 pr-3 font-semibold text-neutral-900 dark:text-neutral-100 font-mono'>
                            {pos.symbol}
                          </td>
                          {selectedBroker === 'ALL' && (
                            <td className='py-3 px-3'>
                              <BrokerBadge broker={pos.broker} />
                            </td>
                          )}
                          <td className='py-3 px-3 font-mono text-neutral-600 dark:text-neutral-400'>
                            {pos.product}
                          </td>
                          <td className='py-3 px-3 text-right font-mono tnum text-neutral-900 dark:text-neutral-100'>
                            {pos.quantity}
                          </td>
                          <td className='py-3 px-3 text-right font-mono tnum text-neutral-600 dark:text-neutral-400'>
                            {formatCurrency(pos.buyAvg)}
                          </td>
                          <td className='py-3 px-3 text-right font-mono tnum font-semibold text-neutral-900 dark:text-neutral-100'>
                            {formatCurrency(pos.ltp)}
                          </td>
                          <td className='py-3 pr-5 pl-3 text-right font-mono tnum font-semibold'>
                            <span
                              className={
                                pos.pnl >= 0
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : 'text-rose-600 dark:text-rose-400'
                              }
                            >
                              {pos.pnl >= 0 ? '+' : ''}
                              {formatCurrency(pos.pnl)} (
                              {pos.pnl >= 0 ? '+' : ''}
                              {pos.pnlPct}%)
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}

          {/* TAB 3: ORDERS */}
          {activeTab === 'orders' && (
            <section className='space-y-4'>
              <div className='rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#16171a] shadow-2xs overflow-hidden'>
                <div className='overflow-x-auto'>
                  <table className='w-full text-left border-collapse text-xs'>
                    <thead>
                      <tr className='border-b border-neutral-100 dark:border-neutral-800/80 text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 font-mono uppercase bg-neutral-50/50 dark:bg-neutral-900/30'>
                        <th className='py-3 pl-4 pr-3'>Time</th>
                        <th className='py-3 px-3'>Symbol</th>
                        {selectedBroker === 'ALL' && (
                          <th className='py-3 px-3'>Broker</th>
                        )}
                        <th className='py-3 px-3'>Type</th>
                        <th className='py-3 px-3 text-right'>Qty</th>
                        <th className='py-3 px-3 text-right'>Price</th>
                        <th className='py-3 pr-5 pl-3 text-right'>Status</th>
                      </tr>
                    </thead>
                    <tbody className='divide-y divide-neutral-100 dark:divide-neutral-800/80 font-mono'>
                      {displayOrders.map(ord => (
                        <tr
                          key={ord.id}
                          className='hover:bg-neutral-50/60 dark:hover:bg-neutral-850/50'
                        >
                          <td className='py-3 pl-4 pr-3 text-neutral-500'>
                            {ord.time}
                          </td>
                          <td className='py-3 px-3 font-semibold text-neutral-900 dark:text-neutral-100'>
                            {ord.symbol}
                          </td>
                          {selectedBroker === 'ALL' && (
                            <td className='py-3 px-3'>
                              <BrokerBadge broker={ord.broker} />
                            </td>
                          )}
                          <td className='py-3 px-3 text-neutral-700 dark:text-neutral-300'>
                            {ord.type}
                          </td>
                          <td className='py-3 px-3 text-right tnum'>
                            {ord.quantity}
                          </td>
                          <td className='py-3 px-3 text-right tnum'>
                            {formatCurrency(ord.price)}
                          </td>
                          <td className='py-3 pr-5 pl-3 text-right'>
                            <span
                              className={cn(
                                'px-2 py-0.5 rounded text-[10px] font-semibold uppercase',
                                ord.status === 'COMPLETE' &&
                                  'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
                                ord.status === 'OPEN' &&
                                  'bg-blue-500/10 text-blue-600 dark:text-blue-400',
                                ord.status === 'CANCELLED' &&
                                  'bg-neutral-500/10 text-neutral-600 dark:text-neutral-400'
                              )}
                            >
                              {ord.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}

          {/* TAB 4: TRADES */}
          {activeTab === 'trades' && (
            <section className='space-y-4'>
              <div className='rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#16171a] shadow-2xs overflow-hidden'>
                <div className='overflow-x-auto'>
                  <table className='w-full text-left border-collapse text-xs font-mono'>
                    <thead>
                      <tr className='border-b border-neutral-100 dark:border-neutral-800/80 text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase bg-neutral-50/50 dark:bg-neutral-900/30'>
                        <th className='py-3 pl-4 pr-3'>Trade ID</th>
                        <th className='py-3 px-3'>Time</th>
                        <th className='py-3 px-3'>Symbol</th>
                        {selectedBroker === 'ALL' && (
                          <th className='py-3 px-3'>Broker</th>
                        )}
                        <th className='py-3 px-3 text-right'>Qty</th>
                        <th className='py-3 px-3 text-right'>Fill Price</th>
                        <th className='py-3 pr-5 pl-3 text-right'>
                          Trade Value
                        </th>
                      </tr>
                    </thead>
                    <tbody className='divide-y divide-neutral-100 dark:divide-neutral-800/80'>
                      {displayTrades.map(tr => (
                        <tr
                          key={tr.id}
                          className='hover:bg-neutral-50/60 dark:hover:bg-neutral-850/50'
                        >
                          <td className='py-3 pl-4 pr-3 text-neutral-400'>
                            {tr.id}
                          </td>
                          <td className='py-3 px-3 text-neutral-500'>
                            {tr.time}
                          </td>
                          <td className='py-3 px-3 font-semibold text-neutral-900 dark:text-neutral-100'>
                            {tr.symbol}
                          </td>
                          {selectedBroker === 'ALL' && (
                            <td className='py-3 px-3'>
                              <BrokerBadge broker={tr.broker} />
                            </td>
                          )}
                          <td className='py-3 px-3 text-right tnum'>
                            {tr.quantity}
                          </td>
                          <td className='py-3 px-3 text-right tnum'>
                            {formatCurrency(tr.fillPrice)}
                          </td>
                          <td className='py-3 pr-5 pl-3 text-right tnum font-semibold text-neutral-900 dark:text-neutral-100'>
                            {formatCurrency(tr.tradeValue)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}

          {/* TAB 5: MUTUAL FUNDS (DEDICATED MF SUB-TABS: HOLDINGS / ORDERS / SIPS / TIMELINE / INSTRUMENTS) */}
          {isMfTab && (
            <section className='space-y-5'>
              {/* If Upstox or Angel One is selected, show honest capability banner */}
              {isMfBlocked ? (
                <div className='rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6 text-center space-y-3'>
                  <div className='size-10 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto'>
                    <Info className='size-5' />
                  </div>
                  <h3 className='text-base font-semibold text-neutral-900 dark:text-neutral-100'>
                    Mutual Funds not supported on {activeProfile.name} API
                  </h3>
                  <p className='text-xs text-neutral-500 dark:text-neutral-400 max-w-md mx-auto'>
                    Upstox and Angel One SmartAPI do not provide public Mutual
                    Fund execution or folio feeds. CoinTrack syncs mutual funds
                    exclusively via <strong>Zerodha Coin</strong> or manual{' '}
                    <strong>CAMS/KFintech CAS</strong> import.
                  </p>
                  <div className='pt-2 flex items-center justify-center gap-2'>
                    <button
                      type='button'
                      onClick={() => setSelectedBroker('ZERODHA')}
                      className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 transition-colors shadow-2xs cursor-pointer'
                    >
                      <span>Switch to Zerodha Kite</span>
                      <ArrowRight className='size-3' />
                    </button>
                    <button
                      type='button'
                      onClick={() =>
                        toast.info('Opening CAMS / KFintech CAS parser…')
                      }
                      className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200/80 dark:border-neutral-800 text-xs font-medium text-neutral-700 dark:text-neutral-300 bg-white dark:bg-[#16171a] hover:bg-neutral-50 transition-colors shadow-2xs cursor-pointer'
                    >
                      <FileSpreadsheet className='size-3 text-neutral-400' />
                      <span>Upload CAS PDF</span>
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* ─────────────────────────────────────────────────────────────
                      SUB-TAB 5A: MF HOLDINGS (PORTFOLIO FOLIOS)
                      ───────────────────────────────────────────────────────────── */}
                  {activeTab === 'mf-holdings' &&
                    (() => {
                      const totalVal = MF_DATA.reduce(
                        (acc, m) => acc + m.currentValue,
                        0
                      );
                      const totalInv = MF_DATA.reduce(
                        (acc, m) => acc + m.invested,
                        0
                      );
                      const totalGain = totalVal - totalInv;
                      const totalGainPct =
                        totalInv > 0 ? (totalGain / totalInv) * 100 : 0;

                      return (
                        <div className='space-y-4'>
                          {/* Summary Metrics Row */}
                          <div className='grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs'>
                            <div className='p-3.5 rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#16171a] shadow-2xs space-y-1'>
                              <span className='text-[11px] font-medium text-neutral-400 dark:text-neutral-500'>
                                MF Portfolio Valuation
                              </span>
                              <span className='text-lg font-bold font-mono tnum text-neutral-900 dark:text-neutral-100 block'>
                                {formatCurrency(totalVal)}
                              </span>
                            </div>
                            <div className='p-3.5 rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#16171a] shadow-2xs space-y-1'>
                              <span className='text-[11px] font-medium text-neutral-400 dark:text-neutral-500'>
                                Invested Capital
                              </span>
                              <span className='text-lg font-semibold font-mono tnum text-neutral-700 dark:text-neutral-300 block'>
                                {formatCurrency(totalInv)}
                              </span>
                            </div>
                            <div className='p-3.5 rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#16171a] shadow-2xs space-y-1'>
                              <span className='text-[11px] font-medium text-neutral-400 dark:text-neutral-500'>
                                Unrealized Return
                              </span>
                              <span className='text-lg font-bold font-mono tnum text-emerald-600 dark:text-emerald-400 block'>
                                +{formatCurrency(totalGain)} (
                                {formatPercent(totalGainPct)})
                              </span>
                            </div>
                            <div className='p-3.5 rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#16171a] shadow-2xs space-y-1'>
                              <span className='text-[11px] font-medium text-neutral-400 dark:text-neutral-500'>
                                Active Folios
                              </span>
                              <span className='text-lg font-bold font-mono text-neutral-900 dark:text-neutral-100 block'>
                                {MF_DATA.length} Folios{' '}
                                <span className='text-xs font-normal text-neutral-400'>
                                  · 3 SIPs
                                </span>
                              </span>
                            </div>
                          </div>

                          {/* Holdings Table */}
                          <div className='rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#16171a] shadow-2xs overflow-hidden'>
                            <div className='p-4 border-b border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between'>
                              <div className='flex items-center gap-2'>
                                <PiggyBank className='size-4 text-emerald-500' />
                                <span className='font-semibold text-xs text-neutral-900 dark:text-neutral-100'>
                                  Mutual Fund Portfolios (Synced via Zerodha
                                  Coin &amp; AMFI)
                                </span>
                              </div>
                              <span className='text-xs font-mono text-neutral-500 dark:text-neutral-400'>
                                4 active folios
                              </span>
                            </div>
                            <div className='overflow-x-auto'>
                              <table className='w-full text-left border-collapse text-xs'>
                                <thead>
                                  <tr className='border-b border-neutral-100 dark:border-neutral-800/80 text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 font-mono uppercase bg-neutral-50/50 dark:bg-neutral-900/30'>
                                    <th className='py-3 pl-4 pr-3'>
                                      Scheme Name
                                    </th>
                                    <th className='py-3 px-3'>Category</th>
                                    <th className='py-3 px-3 text-right'>
                                      Units
                                    </th>
                                    <th className='py-3 px-3 text-right'>
                                      Avg NAV
                                    </th>
                                    <th className='py-3 px-3 text-right'>
                                      Current NAV
                                    </th>
                                    <th className='py-3 px-3 text-right'>
                                      Current Value
                                    </th>
                                    <th className='py-3 pr-5 pl-3 text-right'>
                                      Gain / Return
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className='divide-y divide-neutral-100 dark:divide-neutral-800/80'>
                                  {MF_DATA.map(mf => (
                                    <tr
                                      key={mf.id}
                                      className='hover:bg-neutral-50/60 dark:hover:bg-neutral-850/50'
                                    >
                                      <td className='py-3 pl-4 pr-3'>
                                        <div className='flex flex-col'>
                                          <span className='font-semibold text-neutral-900 dark:text-neutral-100'>
                                            {mf.fundName}
                                          </span>
                                          <span className='text-[10px] text-neutral-400 font-mono'>
                                            Folio: {mf.folioNumber}{' '}
                                            {mf.sipActive &&
                                              '· Monthly SIP active'}
                                          </span>
                                        </div>
                                      </td>
                                      <td className='py-3 px-3 font-mono text-neutral-600 dark:text-neutral-400'>
                                        {mf.category}
                                      </td>
                                      <td className='py-3 px-3 text-right font-mono tnum text-neutral-700 dark:text-neutral-300'>
                                        {mf.units.toLocaleString()}
                                      </td>
                                      <td className='py-3 px-3 text-right font-mono tnum text-neutral-500'>
                                        ₹{mf.avgNav}
                                      </td>
                                      <td className='py-3 px-3 text-right font-mono tnum font-semibold text-neutral-900 dark:text-neutral-100'>
                                        ₹{mf.nav}
                                      </td>
                                      <td className='py-3 px-3 text-right font-mono tnum font-semibold text-neutral-900 dark:text-neutral-100'>
                                        {formatCurrency(mf.currentValue)}
                                      </td>
                                      <td className='py-3 pr-5 pl-3 text-right font-mono tnum font-semibold text-emerald-600 dark:text-emerald-400'>
                                        +{formatCurrency(mf.unrealizedPL)} (+
                                        {mf.unrealizedPLPercent}%)
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                  {/* ─────────────────────────────────────────────────────────────
                      SUB-TAB 5B: MF ORDERS (COIN / BSE StAR MF ORDER BOOK)
                      ───────────────────────────────────────────────────────────── */}
                  {activeTab === 'mf-orders' && (
                    <div className='space-y-4'>
                      {/* Orders Summary Cards */}
                      <div className='grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs'>
                        <div className='p-3.5 rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#16171a] shadow-2xs space-y-1'>
                          <span className='text-[11px] font-medium text-neutral-400 dark:text-neutral-500'>
                            Synced MF Orders
                          </span>
                          <span className='text-lg font-bold font-mono text-neutral-900 dark:text-neutral-100 block'>
                            {MF_ORDERS_DATA.length} Orders
                          </span>
                        </div>
                        <div className='p-3.5 rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#16171a] shadow-2xs space-y-1'>
                          <span className='text-[11px] font-medium text-neutral-400 dark:text-neutral-500'>
                            Total Order Value
                          </span>
                          <span className='text-lg font-semibold font-mono tnum text-neutral-900 dark:text-neutral-100 block'>
                            {formatCurrency(
                              MF_ORDERS_DATA.reduce(
                                (acc, o) => acc + o.amount,
                                0
                              )
                            )}
                          </span>
                        </div>
                        <div className='p-3.5 rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#16171a] shadow-2xs space-y-1'>
                          <span className='text-[11px] font-medium text-neutral-400 dark:text-neutral-500'>
                            Execution Platform
                          </span>
                          <span className='text-sm font-semibold text-neutral-800 dark:text-neutral-200 block'>
                            BSE StAR MF / Coin
                          </span>
                        </div>
                        <div className='p-3.5 rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#16171a] shadow-2xs space-y-1'>
                          <span className='text-[11px] font-medium text-neutral-400 dark:text-neutral-500'>
                            Settlement Mode
                          </span>
                          <span className='text-sm font-semibold text-emerald-600 dark:text-emerald-400 block'>
                            T+2 Demat Allotment
                          </span>
                        </div>
                      </div>

                      {/* Orders Table */}
                      <div className='rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#16171a] shadow-2xs overflow-hidden'>
                        <div className='p-4 border-b border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between'>
                          <div className='flex items-center gap-2'>
                            <FileSpreadsheet className='size-4 text-neutral-400' />
                            <span className='font-semibold text-xs text-neutral-900 dark:text-neutral-100'>
                              Zerodha Coin Mutual Fund Orders Book
                            </span>
                          </div>
                          <span className='text-xs font-mono text-neutral-500 dark:text-neutral-400'>
                            {MF_ORDERS_DATA.length} records on file
                          </span>
                        </div>
                        <div className='overflow-x-auto'>
                          <table className='w-full text-left border-collapse text-xs font-mono'>
                            <thead>
                              <tr className='border-b border-neutral-100 dark:border-neutral-800/80 text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase bg-neutral-50/50 dark:bg-neutral-900/30'>
                                <th className='py-3 pl-4 pr-3'>
                                  Date &amp; Time
                                </th>
                                <th className='py-3 px-3'>Order Ref</th>
                                <th className='py-3 px-3'>Scheme Name</th>
                                <th className='py-3 px-3'>Order Type</th>
                                <th className='py-3 px-3 text-right'>Amount</th>
                                <th className='py-3 px-3 text-right'>
                                  Allotted NAV
                                </th>
                                <th className='py-3 px-3 text-right'>Units</th>
                                <th className='py-3 pr-5 pl-3 text-right'>
                                  Status
                                </th>
                              </tr>
                            </thead>
                            <tbody className='divide-y divide-neutral-100 dark:divide-neutral-800/80'>
                              {MF_ORDERS_DATA.map(ord => (
                                <tr
                                  key={ord.id}
                                  className='hover:bg-neutral-50/60 dark:hover:bg-neutral-850/50'
                                >
                                  <td className='py-3 pl-4 pr-3 text-neutral-500 whitespace-nowrap'>
                                    {ord.time}
                                  </td>
                                  <td className='py-3 px-3 text-neutral-600 dark:text-neutral-400 font-semibold'>
                                    {ord.orderNumber}
                                  </td>
                                  <td className='py-3 px-3 font-semibold text-neutral-900 dark:text-neutral-100 font-sans'>
                                    <div>{ord.fundName}</div>
                                    <div className='text-[10px] font-mono text-neutral-400'>
                                      Folio: {ord.folioNumber} ·{' '}
                                      {ord.exchangeRef}
                                    </div>
                                  </td>
                                  <td className='py-3 px-3'>
                                    <span className='inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-sans'>
                                      {ord.type === 'SIP Installment' ? (
                                        <Repeat className='size-3 text-blue-500' />
                                      ) : (
                                        <TrendingUp className='size-3 text-emerald-500' />
                                      )}
                                      <span>{ord.type}</span>
                                    </span>
                                  </td>
                                  <td className='py-3 px-3 text-right tnum font-semibold text-neutral-900 dark:text-neutral-100'>
                                    {formatCurrency(ord.amount)}
                                  </td>
                                  <td className='py-3 px-3 text-right tnum text-neutral-600 dark:text-neutral-400'>
                                    ₹{ord.allottedNav}
                                  </td>
                                  <td className='py-3 px-3 text-right tnum text-neutral-700 dark:text-neutral-300'>
                                    {ord.allottedUnits}
                                  </td>
                                  <td className='py-3 pr-5 pl-3 text-right'>
                                    <span className='inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'>
                                      <Check className='size-3' />
                                      <span>{ord.status}</span>
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ─────────────────────────────────────────────────────────────
                      SUB-TAB 5C: SIPS (SYSTEMATIC INVESTMENT PLANS MANDATES)
                      ───────────────────────────────────────────────────────────── */}
                  {activeTab === 'mf-sips' && (
                    <div className='space-y-4'>
                      {/* SIP KPI Cards */}
                      <div className='grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs'>
                        <div className='p-3.5 rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#16171a] shadow-2xs space-y-1'>
                          <span className='text-[11px] font-medium text-neutral-400 dark:text-neutral-500'>
                            Total Monthly Outflow
                          </span>
                          <span className='text-lg font-bold font-mono tnum text-neutral-900 dark:text-neutral-100 block'>
                            {formatCurrency(
                              MF_SIPS_DATA.reduce((acc, s) => acc + s.amount, 0)
                            )}{' '}
                            / mo
                          </span>
                        </div>
                        <div className='p-3.5 rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#16171a] shadow-2xs space-y-1'>
                          <span className='text-[11px] font-medium text-neutral-400 dark:text-neutral-500'>
                            Active Mandates
                          </span>
                          <span className='text-lg font-bold font-mono text-neutral-900 dark:text-neutral-100 block'>
                            {MF_SIPS_DATA.length} Mandates
                          </span>
                        </div>
                        <div className='p-3.5 rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#16171a] shadow-2xs space-y-1'>
                          <span className='text-[11px] font-medium text-neutral-400 dark:text-neutral-500'>
                            Next Upcoming Trigger
                          </span>
                          <span className='text-sm font-semibold text-emerald-600 dark:text-emerald-400 block font-mono'>
                            05 Nov 2026 (Today)
                          </span>
                        </div>
                        <div className='p-3.5 rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#16171a] shadow-2xs space-y-1'>
                          <span className='text-[11px] font-medium text-neutral-400 dark:text-neutral-500'>
                            Autopay Status
                          </span>
                          <span className='text-sm font-semibold text-neutral-800 dark:text-neutral-200 block'>
                            e-NACH Active
                          </span>
                        </div>
                      </div>

                      {/* SIP Mandates 3-Column Cards */}
                      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                        {MF_SIPS_DATA.map(sip => (
                          <div
                            key={sip.id}
                            className='p-5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#16171a] shadow-2xs flex flex-col justify-between space-y-4 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors'
                          >
                            <div className='space-y-3'>
                              <div className='flex items-center justify-between'>
                                <div className='flex items-center gap-1.5'>
                                  <span className='size-2 rounded-full bg-emerald-500 animate-pulse' />
                                  <span className='text-xs font-semibold text-emerald-600 dark:text-emerald-400 font-mono'>
                                    ACTIVE MANDATE
                                  </span>
                                </div>
                                <span className='text-[10px] font-mono text-neutral-400 px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800'>
                                  {sip.sipId}
                                </span>
                              </div>

                              <div>
                                <h4 className='text-sm font-bold text-neutral-900 dark:text-neutral-100 leading-snug'>
                                  {sip.fundName}
                                </h4>
                                <p className='text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5'>
                                  {sip.amc}
                                </p>
                              </div>

                              <div className='pt-2 border-t border-neutral-100 dark:border-neutral-800/80'>
                                <span className='text-[10px] font-mono uppercase tracking-wider text-neutral-400 block'>
                                  Monthly Installment
                                </span>
                                <span className='text-2xl font-bold font-mono tnum text-neutral-900 dark:text-neutral-100 tracking-tight'>
                                  {formatCurrency(sip.amount)}
                                </span>
                              </div>

                              <div className='space-y-1.5 text-xs text-neutral-600 dark:text-neutral-400'>
                                <div className='flex items-center justify-between'>
                                  <span className='flex items-center gap-1 text-[11px] text-neutral-400'>
                                    <Calendar className='size-3' />
                                    Frequency
                                  </span>
                                  <span className='font-medium text-neutral-800 dark:text-neutral-200'>
                                    {sip.frequency} ({sip.dayOfMonth}th)
                                  </span>
                                </div>
                                <div className='flex items-center justify-between'>
                                  <span className='text-[11px] text-neutral-400'>
                                    Next Trigger
                                  </span>
                                  <span className='font-mono font-medium text-emerald-600 dark:text-emerald-400'>
                                    {sip.nextTriggerDate}
                                  </span>
                                </div>
                                <div className='flex items-center justify-between'>
                                  <span className='text-[11px] text-neutral-400'>
                                    Mandate Bank
                                  </span>
                                  <span className='font-mono text-neutral-700 dark:text-neutral-300'>
                                    {sip.mandateBank}
                                  </span>
                                </div>
                                <div className='flex items-center justify-between'>
                                  <span className='text-[11px] text-neutral-400'>
                                    Invested to Date
                                  </span>
                                  <span className='font-mono text-neutral-700 dark:text-neutral-300 tnum'>
                                    {formatCurrency(sip.totalInvested)} (
                                    {sip.totalInstallmentsPaid} mo)
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className='pt-3 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between text-xs'>
                              <span className='text-[11px] text-neutral-400 font-mono'>
                                Folio: {sip.folioNumber}
                              </span>
                              <a
                                href='https://coin.zerodha.com/sips'
                                target='_blank'
                                rel='noopener noreferrer'
                                className='inline-flex items-center gap-1 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors'
                              >
                                <span>Manage in Coin</span>
                                <ExternalLink className='size-3' />
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ─────────────────────────────────────────────────────────────
                      SUB-TAB 5D: TIMELINE (CHRONOLOGICAL MF INVESTMENT MILESTONES)
                      ───────────────────────────────────────────────────────────── */}
                  {activeTab === 'mf-timeline' && (
                    <div className='rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#16171a] p-6 shadow-2xs space-y-6'>
                      <div className='flex items-center justify-between pb-4 border-b border-neutral-100 dark:border-neutral-800/80'>
                        <div>
                          <h3 className='text-sm font-bold text-neutral-900 dark:text-neutral-100 tracking-tight'>
                            Mutual Fund Activity &amp; Allotment Timeline
                          </h3>
                          <p className='text-xs text-neutral-500 dark:text-neutral-400 mt-0.5'>
                            Chronological history of systematic contributions,
                            lumpsum investments, and Demat credit logs.
                          </p>
                        </div>
                        <span className='text-xs font-mono text-neutral-400'>
                          Coin Execution Feed
                        </span>
                      </div>

                      {/* Vertical Timeline Structure */}
                      <div className='relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-neutral-200 dark:before:bg-neutral-800'>
                        {MF_TIMELINE_DATA.map(item => (
                          <div key={item.id} className='relative group'>
                            {/* Dot Pin on Timeline */}
                            <span
                              className={cn(
                                'absolute -left-[23px] top-1.5 size-3 rounded-full border-2 border-white dark:border-[#16171a]',
                                item.status === 'SCHEDULED'
                                  ? 'bg-blue-500 animate-pulse'
                                  : 'bg-emerald-500'
                              )}
                            />

                            <div className='p-4 rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 space-y-2 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors'>
                              <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-1'>
                                <div className='flex items-center gap-2'>
                                  <span className='text-xs font-bold text-neutral-900 dark:text-neutral-100'>
                                    {item.title}
                                  </span>
                                  <span
                                    className={cn(
                                      'text-[10px] font-mono px-2 py-0.5 rounded font-semibold',
                                      item.status === 'SCHEDULED'
                                        ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                                        : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                    )}
                                  >
                                    {item.status}
                                  </span>
                                </div>
                                <span className='text-[11px] font-mono text-neutral-400'>
                                  {item.date}
                                </span>
                              </div>

                              <div className='flex flex-wrap items-center gap-3 text-xs'>
                                <span className='font-semibold text-neutral-800 dark:text-neutral-200'>
                                  {item.fundName}
                                </span>
                                <span className='font-mono font-bold text-neutral-900 dark:text-neutral-100 tnum'>
                                  {formatCurrency(item.amount)}
                                </span>
                                {item.units && (
                                  <span className='font-mono text-neutral-500 text-[11px]'>
                                    {item.units} units @ NAV ₹{item.nav}
                                  </span>
                                )}
                              </div>

                              <p className='text-xs text-neutral-500 dark:text-neutral-400 leading-normal'>
                                {item.details}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ─────────────────────────────────────────────────────────────
                      SUB-TAB 5E: INSTRUMENTS (AMFI SCHEME MASTER EXPLORER)
                      ───────────────────────────────────────────────────────────── */}
                  {activeTab === 'mf-instruments' &&
                    (() => {
                      const filteredInstruments = MF_INSTRUMENTS_DATA.filter(
                        inst => {
                          if (instrumentCategoryFilter !== 'ALL') {
                            if (
                              !inst.category
                                .toLowerCase()
                                .includes(
                                  instrumentCategoryFilter.toLowerCase()
                                )
                            ) {
                              return false;
                            }
                          }
                          if (instrumentSearch.trim()) {
                            const q = instrumentSearch.toLowerCase();
                            const matchName = inst.fundName
                              .toLowerCase()
                              .includes(q);
                            const matchAmc = inst.amc.toLowerCase().includes(q);
                            const matchIsin = inst.isin
                              .toLowerCase()
                              .includes(q);
                            const matchCat = inst.category
                              .toLowerCase()
                              .includes(q);
                            return (
                              matchName || matchAmc || matchIsin || matchCat
                            );
                          }
                          return true;
                        }
                      );

                      const categories = [
                        'ALL',
                        'Flexi Cap',
                        'Small Cap',
                        'Index',
                        'Mid Cap',
                        'Debt',
                      ];

                      return (
                        <div className='space-y-4'>
                          {/* Instruments Search & Category Toolbar */}
                          <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#16171a] shadow-2xs'>
                            {/* Search Input */}
                            <div className='relative w-full sm:w-72'>
                              <Search className='absolute left-3 top-2.5 size-3.5 text-neutral-400' />
                              <input
                                type='text'
                                value={instrumentSearch}
                                onChange={e =>
                                  setInstrumentSearch(e.target.value)
                                }
                                placeholder='Search AMFI schemes, AMC, ISIN…'
                                className='w-full pl-9 pr-3 py-1.5 rounded-lg border border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 text-xs text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-neutral-600'
                              />
                            </div>

                            {/* Category Filter Pills */}
                            <div className='flex items-center gap-1.5 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'>
                              {categories.map(cat => (
                                <button
                                  key={cat}
                                  type='button'
                                  onClick={() =>
                                    setInstrumentCategoryFilter(cat)
                                  }
                                  className={cn(
                                    'px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer whitespace-nowrap',
                                    instrumentCategoryFilter === cat
                                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-semibold'
                                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white bg-neutral-100/70 dark:bg-neutral-800/60'
                                  )}
                                >
                                  {cat}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Instruments Directory Table */}
                          <div className='rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#16171a] shadow-2xs overflow-hidden'>
                            <div className='p-4 border-b border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between'>
                              <div className='flex items-center gap-2'>
                                <Layers className='size-4 text-neutral-400' />
                                <span className='font-semibold text-xs text-neutral-900 dark:text-neutral-100'>
                                  AMFI Scheme Master Directory (Zerodha Coin
                                  Supported)
                                </span>
                              </div>
                              <span className='text-xs font-mono text-neutral-500 dark:text-neutral-400'>
                                Showing {filteredInstruments.length} of{' '}
                                {MF_INSTRUMENTS_DATA.length} schemes
                              </span>
                            </div>
                            <div className='overflow-x-auto'>
                              <table className='w-full text-left border-collapse text-xs'>
                                <thead>
                                  <tr className='border-b border-neutral-100 dark:border-neutral-800/80 text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 font-mono uppercase bg-neutral-50/50 dark:bg-neutral-900/30'>
                                    <th className='py-3 pl-4 pr-3'>
                                      Scheme Name &amp; ISIN
                                    </th>
                                    <th className='py-3 px-3'>Category</th>
                                    <th className='py-3 px-3'>
                                      Fund House (AMC)
                                    </th>
                                    <th className='py-3 px-3 text-right font-mono'>
                                      NAV
                                    </th>
                                    <th className='py-3 px-3 text-right font-mono'>
                                      TER
                                    </th>
                                    <th className='py-3 px-3 text-right font-mono'>
                                      Min SIP
                                    </th>
                                    <th className='py-3 px-3 text-right font-mono'>
                                      AUM
                                    </th>
                                    <th className='py-3 pr-5 pl-3 text-right'>
                                      Action
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className='divide-y divide-neutral-100 dark:divide-neutral-800/80'>
                                  {filteredInstruments.map(inst => (
                                    <tr
                                      key={inst.isin}
                                      className='hover:bg-neutral-50/60 dark:hover:bg-neutral-850/50'
                                    >
                                      <td className='py-3 pl-4 pr-3'>
                                        <div className='font-semibold text-neutral-900 dark:text-neutral-100'>
                                          {inst.fundName}
                                        </div>
                                        <div className='text-[10px] font-mono text-neutral-400'>
                                          ISIN: {inst.isin} · Code:{' '}
                                          {inst.schemeCode}
                                        </div>
                                      </td>
                                      <td className='py-3 px-3 font-mono text-neutral-600 dark:text-neutral-400'>
                                        {inst.category}
                                      </td>
                                      <td className='py-3 px-3 text-neutral-700 dark:text-neutral-300'>
                                        {inst.amc}
                                      </td>
                                      <td className='py-3 px-3 text-right font-mono tnum font-semibold text-neutral-900 dark:text-neutral-100'>
                                        ₹{inst.nav}
                                      </td>
                                      <td className='py-3 px-3 text-right font-mono tnum text-neutral-600 dark:text-neutral-400'>
                                        {inst.expenseRatio}%
                                      </td>
                                      <td className='py-3 px-3 text-right font-mono tnum text-neutral-600 dark:text-neutral-400'>
                                        {formatCurrency(inst.minSip)}
                                      </td>
                                      <td className='py-3 px-3 text-right font-mono tnum text-neutral-600 dark:text-neutral-400'>
                                        ₹{inst.aumCr.toLocaleString()} Cr
                                      </td>
                                      <td className='py-3 pr-5 pl-3 text-right'>
                                        <a
                                          href='https://coin.zerodha.com'
                                          target='_blank'
                                          rel='noopener noreferrer'
                                          className='inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 transition-colors'
                                        >
                                          <span>Invest</span>
                                          <ExternalLink className='size-2.5' />
                                        </a>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                </>
              )}
            </section>
          )}

          {/* TAB 6: BROKERS (AUTHENTIC SINGLE-BROKER CONNECTION HUB) */}
          {activeTab === 'brokers' &&
            (() => {
              const brokerItem =
                BROKER_ACCOUNT_DETAILS[selectedBroker] ||
                BROKER_ACCOUNT_DETAILS.ZERODHA;
              const brokerState = brokerStates[brokerItem.key];
              const isConnected = brokerState === 'CONNECTED';
              const isExpired = brokerState === 'RECONNECT_REQUIRED';
              const isNotLinked = brokerState === 'NOT_LINKED';

              // Dynamic channels matching ConnectionHubPanel.jsx
              const channels = [
                {
                  id: 'EQUITY_HOLDINGS',
                  name: 'Equity Holdings',
                  desc: 'Demat portfolio, purchase price & daily gain',
                  tag: 'NSE / BSE',
                  supported: true,
                  streaming: isConnected,
                  status: isConnected ? 'Streaming' : 'Idle',
                  recordCount:
                    brokerItem.key === 'ZERODHA'
                      ? 6
                      : brokerItem.key === 'UPSTOX'
                        ? 5
                        : 3,
                },
                {
                  id: 'MF_HOLDINGS',
                  name: 'Mutual Funds',
                  desc:
                    brokerItem.key === 'ZERODHA'
                      ? 'Folio numbers, units held & live NAVs'
                      : 'Not supported by broker API',
                  tag: 'AMFI Daily',
                  supported: brokerItem.key === 'ZERODHA',
                  streaming: isConnected && brokerItem.key === 'ZERODHA',
                  status:
                    brokerItem.key !== 'ZERODHA'
                      ? 'Unsupported'
                      : isConnected
                        ? 'Streaming'
                        : 'Idle',
                  recordCount: brokerItem.key === 'ZERODHA' ? 4 : 0,
                },
                {
                  id: 'POSITIONS_FNO',
                  name: 'Positions & F&O',
                  desc: 'Intraday & open derivative contracts',
                  tag: 'Real-Time',
                  supported: true,
                  streaming: isConnected,
                  status: isConnected ? 'Streaming' : 'Idle',
                  recordCount: 1,
                },
                {
                  id: 'FUNDS_MARGIN',
                  name: 'Funds & Margin',
                  desc: 'Available cash balance, collateral & margin utilized',
                  tag: 'Ledger',
                  supported: true,
                  streaming: isConnected,
                  status: isConnected ? 'Streaming' : 'Idle',
                  recordCount: 1,
                },
              ];

              const activeChannelsCount = channels.filter(
                c => c.streaming
              ).length;
              const protocolName =
                brokerItem.key === 'ANGEL_ONE'
                  ? 'Direct SmartAPI'
                  : 'OAuth 2.0 REST';
              const securityMode = 'Read-Only Enforced';
              const gatewayHealth = isConnected
                ? brokerItem.status === 'PARTIAL'
                  ? 'Partial'
                  : 'Operational'
                : isExpired
                  ? 'Expired'
                  : 'Idle';
              const latencyDisplay =
                brokerItem.lastDurationMs != null
                  ? ` (${brokerItem.lastDurationMs}ms)`
                  : '';

              return (
                <section className='space-y-6'>
                  {/* ── 1. SECTION HEADER (Matching ConnectionHubPanel header) ── */}
                  <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-200/80 dark:border-neutral-800'>
                    <div>
                      <h2 className='text-lg sm:text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100'>
                        {brokerItem.name} Connection Hub
                      </h2>
                      <p className='text-xs text-neutral-500 dark:text-neutral-400 mt-0.5'>
                        Institutional telemetry feeds, authenticated CDSL demat
                        account, and gateway diagnostics.
                      </p>
                    </div>

                    <div className='flex items-center gap-2 self-start sm:self-auto'>
                      {isConnected ? (
                        <span className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60'>
                          <span className='size-1.5 rounded-full bg-emerald-500 animate-pulse' />
                          Live Telemetry Active
                        </span>
                      ) : isExpired ? (
                        <span className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800/60'>
                          <span className='size-1.5 rounded-full bg-rose-500' />
                          Session Expired
                        </span>
                      ) : (
                        <span className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200/80 dark:border-neutral-700/80'>
                          <span className='size-1.5 rounded-full bg-neutral-400' />
                          Not Connected
                        </span>
                      )}
                    </div>
                  </div>

                  {/* ── 2. TWO-COLUMN HERO GRID: BROKER IDENTITY + ACCOUNT CUSTODY ── */}
                  <div className='grid grid-cols-1 lg:grid-cols-2 gap-5'>
                    {/* Column A: Broker Identity Card (Exact BrokerCard.jsx aesthetics) */}
                    <div className='rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#16171a] p-5 sm:p-6 shadow-2xs flex flex-col justify-between space-y-5'>
                      <div>
                        <div className='flex items-center justify-between gap-2 pb-4 border-b border-neutral-100 dark:border-neutral-800/80'>
                          <div className='flex items-center gap-2'>
                            <span
                              className={cn(
                                'size-2 rounded-full shrink-0',
                                isConnected
                                  ? 'bg-emerald-500 animate-pulse'
                                  : isExpired
                                    ? 'bg-rose-500'
                                    : 'bg-neutral-300 dark:bg-neutral-600'
                              )}
                            />
                            <span className='text-xs font-semibold text-neutral-800 dark:text-neutral-200'>
                              {isConnected
                                ? 'Live Stream'
                                : isExpired
                                  ? 'Session Expired'
                                  : 'Not Connected'}
                            </span>
                          </div>
                          <span className='text-[11px] font-medium px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800/80 text-neutral-500 dark:text-neutral-400 border border-neutral-200/60 dark:border-neutral-700/60'>
                            {protocolName}
                          </span>
                        </div>

                        <div className='flex items-start gap-3.5 pt-4 mb-4'>
                          <div
                            className='size-12 rounded-xl flex items-center justify-center shrink-0 border p-2 shadow-2xs font-bold text-sm'
                            style={{
                              color: brokerItem.accentColor,
                              background: `${brokerItem.accentColor}12`,
                              borderColor: `${brokerItem.accentColor}30`,
                            }}
                          >
                            {brokerItem.initials}
                          </div>
                          <div className='min-w-0 flex-1'>
                            <h3 className='text-base sm:text-lg font-bold text-neutral-900 dark:text-neutral-100 tracking-tight leading-snug'>
                              {brokerItem.displayName}
                            </h3>
                            <p className='text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 leading-normal'>
                              {brokerItem.key === 'ZERODHA'
                                ? "India's largest stock broker"
                                : brokerItem.key === 'UPSTOX'
                                  ? 'Fast, reliable trading platform'
                                  : 'Smart investing made simple'}
                            </p>
                          </div>
                        </div>

                        {/* Syndicated feeds */}
                        <div className='space-y-2 pt-1'>
                          <span className='text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider'>
                            Syndicated feeds
                          </span>
                          <div className='flex flex-wrap gap-1.5'>
                            {brokerItem.capabilities.map(cap => (
                              <span
                                key={cap}
                                className='inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md border border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-900/40 text-neutral-600 dark:text-neutral-300 font-medium'
                              >
                                <Check className='size-3 text-emerald-500 shrink-0' />
                                <span>{cap}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className='flex items-center justify-between gap-3 pt-4 border-t border-neutral-100 dark:border-neutral-800/80 text-xs'>
                        {brokerItem.lastSyncRelative !== 'Never' ? (
                          <span className='flex items-center gap-1.5 text-neutral-500 dark:text-neutral-400 font-medium text-[11px] truncate'>
                            <Clock className='size-3 text-neutral-400 shrink-0' />
                            <span>Synced {brokerItem.lastSyncRelative}</span>
                          </span>
                        ) : (
                          <span className='flex items-center gap-1.5 text-neutral-400 dark:text-neutral-500 text-[11px] font-medium'>
                            <Shield className='size-3 shrink-0' />
                            <span>AES-256 Vault</span>
                          </span>
                        )}

                        <Link
                          href={brokerItem.manageUrl}
                          className='inline-flex items-center gap-1 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors'
                        >
                          <span>Manage settings</span>
                          <ExternalLink className='size-3' />
                        </Link>
                      </div>
                    </div>

                    {/* Column B: Institutional Account & Custody Dossier */}
                    <div className='rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#16171a] p-5 sm:p-6 shadow-2xs space-y-4'>
                      <div className='flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800/80'>
                        <div className='flex items-center gap-2'>
                          <ShieldCheck className='size-4 text-emerald-500' />
                          <h3 className='text-sm font-bold text-neutral-900 dark:text-neutral-100 tracking-tight'>
                            Account &amp; Custody Dossier
                          </h3>
                        </div>
                        <span className='text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-semibold'>
                          CDSL Verified
                        </span>
                      </div>

                      <div className='divide-y divide-neutral-100 dark:divide-neutral-800/80 text-xs'>
                        <div className='py-2.5 flex items-center justify-between'>
                          <span className='text-neutral-400 font-medium'>
                            Account Holder
                          </span>
                          <span className='font-semibold text-neutral-900 dark:text-neutral-100 font-mono'>
                            {brokerItem.holder}
                          </span>
                        </div>
                        <div className='py-2.5 flex items-center justify-between'>
                          <span className='text-neutral-400 font-medium'>
                            Registered Email
                          </span>
                          <span className='text-neutral-700 dark:text-neutral-300 font-mono'>
                            {brokerItem.email}
                          </span>
                        </div>
                        <div className='py-2.5 flex items-center justify-between'>
                          <span className='text-neutral-400 font-medium'>
                            Client ID
                          </span>
                          <span className='font-bold text-neutral-900 dark:text-neutral-100 font-mono tnum px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800'>
                            {brokerItem.clientId}
                          </span>
                        </div>
                        <div className='py-2.5 flex items-center justify-between'>
                          <span className='text-neutral-400 font-medium'>
                            Demat BOID
                          </span>
                          <span className='font-mono tnum text-neutral-800 dark:text-neutral-200 font-semibold'>
                            {(() => {
                              const boid =
                                brokerItem.dpId ||
                                BROKER_PROFILES[brokerItem.key]?.dpId ||
                                null;
                              if (!boid) return '—';
                              return boid.length === 16
                                ? `${boid.slice(0, 8)} · ${boid.slice(8)}`
                                : boid;
                            })()}
                          </span>
                        </div>
                        <div className='py-2.5 flex items-center justify-between'>
                          <span className='text-neutral-400 font-medium'>
                            Supported Exchanges
                          </span>
                          <span className='font-mono text-neutral-700 dark:text-neutral-300'>
                            {brokerItem.exchanges.join(', ')}
                          </span>
                        </div>
                        <div className='py-2.5 flex items-center justify-between'>
                          <span className='text-neutral-400 font-medium'>
                            Permitted Products
                          </span>
                          <span className='font-mono text-neutral-700 dark:text-neutral-300'>
                            {brokerItem.products.join(', ')}
                          </span>
                        </div>
                        <div className='py-2.5 flex items-center justify-between'>
                          <span className='text-neutral-400 font-medium'>
                            Last Synced
                          </span>
                          <span className='font-mono text-neutral-700 dark:text-neutral-300'>
                            {brokerItem.syncTime || '4m ago'} (
                            {brokerItem.lastSyncFormatted ||
                              '5 Nov 2026 at 03:15 PM'}
                            )
                          </span>
                        </div>
                        <div className='py-2.5 flex items-center justify-between'>
                          <span className='text-neutral-400 font-medium'>
                            Protocol
                          </span>
                          <span className='font-mono text-neutral-700 dark:text-neutral-300'>
                            {brokerItem.protocol ||
                              (brokerItem.key === 'ANGEL_ONE'
                                ? 'Direct SmartAPI'
                                : 'OAuth 2.0 REST')}
                          </span>
                        </div>
                        <div className='py-2.5 flex items-center justify-between'>
                          <span className='text-neutral-400 font-medium'>
                            Security Mode
                          </span>
                          <span className='font-mono text-emerald-600 dark:text-emerald-400 font-semibold'>
                            Read-Only Enforced
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ── 3. CONNECTION HUB & TELEMETRY MATRIX (Exact ConnectionHubPanel) ── */}
                  <div className='rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#16171a] p-5 sm:p-6 shadow-2xs space-y-5'>
                    {/* Diagnostic Metrics Matrix */}
                    <div className='grid grid-cols-2 md:grid-cols-4 gap-3 text-xs'>
                      <div className='p-3.5 rounded-xl bg-neutral-50/60 dark:bg-neutral-900/40 border border-neutral-200/50 dark:border-neutral-800/50 space-y-1'>
                        <span className='text-[11px] font-medium text-neutral-400 dark:text-neutral-500 flex items-center gap-1.5'>
                          <Clock className='size-3 text-neutral-400' />
                          Last Synced
                        </span>
                        <span className='font-semibold text-neutral-800 dark:text-neutral-200 block truncate'>
                          {brokerItem.lastSyncRelative !== 'Never'
                            ? `${brokerItem.lastSyncRelative} (${brokerItem.lastSyncFormatted})`
                            : 'Never synced'}
                        </span>
                      </div>

                      <div className='p-3.5 rounded-xl bg-neutral-50/60 dark:bg-neutral-900/40 border border-neutral-200/50 dark:border-neutral-800/50 space-y-1'>
                        <span className='text-[11px] font-medium text-neutral-400 dark:text-neutral-500 flex items-center gap-1.5'>
                          <Server className='size-3 text-neutral-400' />
                          Protocol
                        </span>
                        <span className='font-semibold text-neutral-800 dark:text-neutral-200 block truncate'>
                          {protocolName}
                        </span>
                      </div>

                      <div className='p-3.5 rounded-xl bg-neutral-50/60 dark:bg-neutral-900/40 border border-neutral-200/50 dark:border-neutral-800/50 space-y-1'>
                        <span className='text-[11px] font-medium text-neutral-400 dark:text-neutral-500 flex items-center gap-1.5'>
                          <ShieldCheck className='size-3 text-emerald-500' />
                          Security Mode
                        </span>
                        <span className='font-semibold text-emerald-600 dark:text-emerald-400 block truncate'>
                          {securityMode}
                        </span>
                      </div>

                      <div className='p-3.5 rounded-xl bg-neutral-50/60 dark:bg-neutral-900/40 border border-neutral-200/50 dark:border-neutral-800/50 space-y-1'>
                        <span className='text-[11px] font-medium text-neutral-400 dark:text-neutral-500 flex items-center gap-1.5'>
                          <Wifi className='size-3 text-blue-500' />
                          Gateway Health
                        </span>
                        <span
                          className={cn('font-semibold block truncate', {
                            'text-emerald-600 dark:text-emerald-400':
                              gatewayHealth === 'Operational',
                            'text-amber-600 dark:text-amber-400':
                              gatewayHealth === 'Partial',
                            'text-rose-600 dark:text-rose-400':
                              gatewayHealth === 'Expired',
                            'text-neutral-500': gatewayHealth === 'Idle',
                          })}
                        >
                          {gatewayHealth}
                          {latencyDisplay}
                        </span>
                      </div>
                    </div>

                    {/* Warning / Error Alert Notice */}
                    {brokerItem.error && (
                      <div
                        className={cn(
                          'flex items-start justify-between gap-3 p-4 rounded-xl border text-xs',
                          isExpired
                            ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300'
                            : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-200'
                        )}
                      >
                        <div className='flex items-start gap-2.5'>
                          {isExpired ? (
                            <AlertCircle className='size-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5' />
                          ) : (
                            <AlertTriangle className='size-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5' />
                          )}
                          <div>
                            <p className='font-semibold'>{brokerItem.error}</p>
                            <p className='text-[11px] opacity-80 mt-0.5'>
                              {isExpired
                                ? 'Broker session tokens expire daily per SEBI / exchange security guidelines. Re-authentication restores full streaming.'
                                : 'Some API feeds may experience delay. Non-impacted streams continue normally.'}
                            </p>
                          </div>
                        </div>

                        {isExpired && (
                          <button
                            type='button'
                            onClick={() => handleReauthenticate(brokerItem.key)}
                            disabled={isReauthenticating}
                            className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-rose-600 hover:bg-rose-700 text-white shrink-0 shadow-2xs transition-colors cursor-pointer disabled:opacity-60'
                          >
                            <RefreshCw
                              className={cn(
                                'size-3',
                                isReauthenticating && 'animate-spin'
                              )}
                            />
                            <span>
                              {isReauthenticating
                                ? 'Redirecting…'
                                : `Reconnect ${brokerItem.name}`}
                            </span>
                          </button>
                        )}
                      </div>
                    )}

                    {/* Syndicated Data Channels Section */}
                    <div className='space-y-3 pt-2'>
                      <div className='flex items-center justify-between'>
                        <h4 className='text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500'>
                          Syndicated Data Channels
                        </h4>
                        <span className='text-[11px] text-neutral-500 dark:text-neutral-400'>
                          {activeChannelsCount} of {channels.length} channels
                          streaming
                        </span>
                      </div>

                      <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                        {channels.map(channel => {
                          const isStreamActive = channel.streaming;
                          const isUnsupported = !channel.supported;

                          return (
                            <div
                              key={channel.id}
                              className={cn(
                                'p-4 rounded-xl border bg-white dark:bg-[#16171a] flex items-start justify-between gap-3 shadow-2xs transition-colors',
                                isUnsupported
                                  ? 'border-neutral-200/50 dark:border-neutral-800/50 opacity-60'
                                  : 'border-neutral-200/80 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
                              )}
                            >
                              <div className='space-y-1 min-w-0 flex-1'>
                                <div className='flex items-center gap-2'>
                                  <span className='text-xs sm:text-sm font-bold text-neutral-900 dark:text-neutral-100 truncate'>
                                    {channel.name}
                                  </span>
                                  <span className='text-[10px] px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 font-medium shrink-0'>
                                    {channel.tag}
                                  </span>
                                </div>
                                <p className='text-[11px] text-neutral-500 dark:text-neutral-400 leading-normal line-clamp-2'>
                                  {channel.desc}
                                </p>
                              </div>

                              <span
                                className={cn(
                                  'inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md shrink-0 border',
                                  isStreamActive
                                    ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/60 dark:border-emerald-900/40'
                                    : isUnsupported
                                      ? 'text-neutral-400 dark:text-neutral-500 bg-neutral-100/60 dark:bg-neutral-800/40 border-neutral-200/40 dark:border-neutral-700/40'
                                      : 'text-neutral-500 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-900/40 border-neutral-200/60 dark:border-neutral-800/60'
                                )}
                              >
                                <span
                                  className={cn(
                                    'size-1.5 rounded-full shrink-0',
                                    isStreamActive
                                      ? 'bg-emerald-500 animate-pulse'
                                      : 'bg-neutral-400'
                                  )}
                                />
                                <span>{channel.status}</span>
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Action Buttons Toolbar */}
                    <div className='flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-neutral-100 dark:border-neutral-800/80'>
                      <div className='flex items-center gap-2.5'>
                        {isConnected && (
                          <button
                            type='button'
                            onClick={() => {
                              setIsSyncing(true);
                              toast.loading(
                                `Syncing ${brokerItem.name} feeds...`,
                                { id: 'manual-sync' }
                              );
                              setTimeout(() => {
                                setIsSyncing(false);
                                toast.success(
                                  `${brokerItem.name} telemetry feeds refreshed`,
                                  { id: 'manual-sync' }
                                );
                              }, 800);
                            }}
                            disabled={isSyncing}
                            className='inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-semibold hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors shadow-xs cursor-pointer'
                          >
                            <RefreshCw
                              className={cn(
                                'size-3.5',
                                isSyncing && 'animate-spin'
                              )}
                            />
                            <span>
                              {isSyncing ? 'Syncing…' : 'Sync Feeds Now'}
                            </span>
                          </button>
                        )}

                        {isExpired && (
                          <button
                            type='button'
                            onClick={() => handleReauthenticate(brokerItem.key)}
                            disabled={isReauthenticating}
                            className='inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors shadow-xs cursor-pointer disabled:opacity-60'
                          >
                            <RefreshCw
                              className={cn(
                                'size-3.5',
                                isReauthenticating && 'animate-spin'
                              )}
                            />
                            <span>
                              {isReauthenticating
                                ? 'Redirecting…'
                                : `Reconnect ${brokerItem.name}`}
                            </span>
                          </button>
                        )}

                        {isNotLinked && (
                          <Link
                            href={brokerItem.manageUrl}
                            className='inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-semibold hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors shadow-xs cursor-pointer'
                          >
                            <ArrowRight className='size-3.5' />
                            <span>Connect {brokerItem.name}</span>
                          </Link>
                        )}

                        <Link
                          href={brokerItem.manageUrl}
                          className='inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-neutral-200/80 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors shadow-xs cursor-pointer'
                        >
                          <ExternalLink className='size-3.5 text-neutral-400' />
                          <span>Manage Credentials</span>
                        </Link>
                      </div>

                      <button
                        type='button'
                        onClick={() => setActiveTab('holdings')}
                        className='inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors cursor-pointer'
                      >
                        <span>View Holdings</span>
                        <ArrowRight className='size-3' />
                      </button>
                    </div>
                  </div>
                </section>
              );
            })()}

          {/* ─────────────────────────────────────────────────────────────
              6. CENTERED STOCK DOSSIER MODAL
              Opens on holding row click with lot breakdown & tax classification
              (Matching NoteReaderModal.jsx centered dialog architecture)
              ───────────────────────────────────────────────────────────── */}
          {Boolean(inspectPosition) && (
            <StockDossierModal
              isOpen={Boolean(inspectPosition)}
              position={inspectPosition}
              onClose={() => setInspectPosition(null)}
              copiedIsin={copiedIsin}
              onCopyIsin={isin => {
                navigator.clipboard.writeText(isin);
                setCopiedIsin(true);
                setTimeout(() => setCopiedIsin(false), 1600);
                toast.success(`Copied ISIN ${isin}`);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
