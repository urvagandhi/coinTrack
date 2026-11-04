'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { portfolioAPI } from '@/shared/api/client';
import { formatCurrency } from '@/shared/formatters';
import {
  DataTable,
  SymbolBadge,
  BrokerBadge,
  PnLCell,
  DayChangeCell,
} from '@/shared/ui/data-display/data-table';

export function HoldingsTable() {
  const { data: holdingsData, isLoading } = useQuery({
    queryKey: ['holdings'],
    queryFn: portfolioAPI.getHoldings,
    refetchInterval: 60000,
  });

  const holdings = Array.isArray(holdingsData)
    ? holdingsData
    : holdingsData?.data || [];
  const displayHoldings = holdings.slice(0, 10);
  const isEmpty = !isLoading && holdings.length === 0;

  return (
    <DataTable
      title='Active holdings'
      count={holdings.length}
      isLoading={isLoading}
      isEmpty={isEmpty}
      emptyMessage='No holdings on record'
      emptySubtext='Connect Zerodha, Upstox, or Angel One to begin syncing positions.'
      action={
        holdings.length > 10 ? (
          <Link
            href='/portfolio'
            className='text-xs font-medium text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors inline-flex items-center gap-1.5'
          >
            <span>View ledger</span>
            <ArrowRight className='size-3' />
          </Link>
        ) : null
      }
      footer={
        holdings.length > 10 ? (
          <div className='text-center'>
            <Link
              href='/portfolio'
              className='text-xs font-medium text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors inline-flex items-center gap-1.5'
            >
              <span>
                View all {holdings.length} holdings in portfolio ledger
              </span>
              <ArrowRight className='size-3' />
            </Link>
          </div>
        ) : null
      }
    >
      <table className='ed-table'>
        <thead>
          <tr>
            <th className='text-left pl-5 sm:pl-6'>Stock</th>
            <th className='text-left'>Broker</th>
            <th className='text-right'>Qty</th>
            <th className='text-right'>Avg price</th>
            <th className='text-right'>LTP</th>
            <th className='text-right'>Current value</th>
            <th className='text-right'>Unrealized P&amp;L</th>
            <th className='text-right pr-5 sm:pr-6'>Day change</th>
          </tr>
        </thead>
        <tbody>
          {displayHoldings.map((pos, i) => (
            <tr key={`${pos.symbol}-${pos.broker}-${i}`}>
              {/* Stock symbol with clean ticker and exchange badge */}
              <td className='pl-5 sm:pl-6'>
                <SymbolBadge symbol={pos.symbol} index={i} />
              </td>

              {/* Broker with clean sentence-case name & status dot */}
              <td>
                <BrokerBadge broker={pos.broker} />
              </td>

              {/* Quantity */}
              <td className='text-right font-mono tnum font-medium text-neutral-900 dark:text-neutral-100'>
                {pos.quantity}
              </td>

              {/* Average buy price */}
              <td className='text-right font-mono tnum text-neutral-500 dark:text-neutral-400'>
                {formatCurrency(pos.averageBuyPrice)}
              </td>

              {/* Last Traded Price (LTP) */}
              <td className='text-right font-mono tnum text-neutral-900 dark:text-neutral-100'>
                {pos.currentPrice && pos.currentPrice > 0
                  ? formatCurrency(pos.currentPrice)
                  : '—'}
              </td>

              {/* Current Value */}
              <td className='text-right font-mono tnum font-semibold text-neutral-900 dark:text-neutral-100'>
                {formatCurrency(pos.currentValue)}
              </td>

              {/* Unrealized P&L with self-healing percentage */}
              <td className='text-right'>
                <PnLCell
                  pnl={pos.unrealizedPL ?? pos.unrealizedPnL}
                  pnlPercent={
                    pos.unrealizedPLPercent ?? pos.unrealizedPnLPercent
                  }
                  quantity={pos.quantity}
                  averagePrice={pos.averageBuyPrice}
                />
              </td>

              {/* Day change with arrow */}
              <td className='text-right pr-5 sm:pr-6'>
                <DayChangeCell
                  dayGain={pos.dayGain}
                  dayGainPercent={pos.dayGainPercent}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </DataTable>
  );
}

export default HoldingsTable;
