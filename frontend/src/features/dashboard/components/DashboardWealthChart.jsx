'use client';

import { useMemo, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { formatCurrency, formatPercent } from '@/shared/formatters';

export function DashboardWealthChart({
  summary,
  data: customData,
  timeRange = '6M',
}) {
  const data = useMemo(() => {
    if (customData) return customData;
    const currentVal = Number(summary?.totalCurrentValue) || 4824190;
    const investedVal = Number(summary?.totalInvestedValue) || 3683900;

    // 7-month progression leading to current active portfolio values
    const months = ['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May'];
    const nwMultipliers = [0.71, 0.76, 0.8, 0.85, 0.91, 0.95, 1.0];
    const invMultipliers = [0.8, 0.84, 0.87, 0.91, 0.95, 0.97, 1.0];

    return months.map((m, i) => {
      const isLast = i === months.length - 1;
      const nw = isLast
        ? currentVal
        : Math.round(currentVal * nwMultipliers[i]);
      const inv = isLast
        ? investedVal
        : Math.round(investedVal * invMultipliers[i]);
      return {
        month: m,
        netWorth: nw,
        invested: inv,
        delta: nw - inv,
        active: isLast,
      };
    });
  }, [summary, customData]);

  const [hoveredIndex, setHoveredIndex] = useState(data.length - 1);

  // SVG dimensions
  const width = 680;
  const height = 230;
  const paddingX = 40;
  const topY = 25;
  const zeroY = 160;
  const bottomY = 215;

  const maxVal = useMemo(() => {
    const highest = Math.max(
      ...data.map(d => Math.max(d.netWorth, d.invested))
    );
    return highest > 0 ? highest * 1.15 : 10000;
  }, [data]);

  const minDelta = useMemo(() => {
    const deltas = data.map(d => d.delta);
    const maxDelta = Math.max(...deltas.map(d => Math.abs(d)));
    return maxDelta > 0 ? -maxDelta * 1.1 : -1000;
  }, [data]);

  // Coordinate projections
  const getX = index =>
    paddingX + (index * (width - 2 * paddingX)) / (data.length - 1);
  const getYNetWorth = val => zeroY - (val / maxVal) * (zeroY - topY);
  const getYInvested = val => zeroY - (val / maxVal) * (zeroY - topY);
  const getYDelta = val =>
    zeroY + (Math.abs(val) / Math.abs(minDelta)) * (bottomY - zeroY);

  // Build SVG path strings using smooth curves
  const netWorthPoints = data.map(
    (d, i) => `${getX(i)},${getYNetWorth(d.netWorth)}`
  );
  const investedPoints = data.map(
    (d, i) => `${getX(i)},${getYInvested(d.invested)}`
  );
  const deltaPoints = data.map((d, i) => `${getX(i)},${getYDelta(d.delta)}`);

  const activeItem =
    hoveredIndex !== null ? data[hoveredIndex] : data[data.length - 1];

  const growthPct = useMemo(() => {
    const first = data[0]?.netWorth || 1;
    const last = data[data.length - 1]?.netWorth || 1;
    return ((last - first) / first) * 100;
  }, [data]);

  return (
    <div className='rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#16171a] p-5 sm:p-6 shadow-2xs hover:shadow-xs transition-all'>
      {/* ── CARD HEADER ── */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-neutral-100 dark:border-neutral-800/80'>
        <div>
          <div className='flex items-center gap-2'>
            <h3 className='text-base font-semibold text-neutral-900 dark:text-neutral-100 tracking-tight'>
              Net worth vs. invested
            </h3>
            <span className='text-[10px] font-mono font-medium px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'>
              {timeRange}
            </span>
          </div>
          <div className='flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium font-mono tnum mt-1'>
            <ArrowUpRight className='size-3.5' />
            <span>
              +{formatPercent(growthPct, { showSign: false })} consolidated
              growth
            </span>
          </div>
        </div>

        {/* Quiet Legend */}
        <div className='flex items-center gap-4 text-xs font-medium text-neutral-600 dark:text-neutral-400'>
          <div className='flex items-center gap-1.5'>
            <span className='size-2 rounded-full bg-emerald-500' />
            <span>Net worth</span>
          </div>
          <div className='flex items-center gap-1.5'>
            <span className='size-2 rounded-full bg-neutral-400 dark:bg-neutral-500' />
            <span>Invested</span>
          </div>
          <div className='flex items-center gap-1.5'>
            <span className='size-2 rounded-full bg-neutral-300 dark:bg-neutral-700' />
            <span>Mirrored delta</span>
          </div>
        </div>
      </div>

      {/* ── INTERACTIVE WEALTH CURVE (Unslop Gaussian Moment) ── */}
      <div className='relative pt-4'>
        {/* Active Inspection Popover */}
        {activeItem && (
          <div
            className='absolute top-3 z-20 pointer-events-none transition-all duration-150'
            style={{
              left: `${(hoveredIndex / (data.length - 1)) * 75 + 10}%`,
              transform: 'translateX(-50%)',
            }}
          >
            <div className='bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-3 py-1.5 rounded-lg text-xs font-mono font-medium shadow-md flex items-center gap-3 whitespace-nowrap'>
              <span className='text-neutral-400 dark:text-neutral-500'>
                {activeItem.month}
              </span>
              <span className='font-bold text-emerald-400 dark:text-emerald-600'>
                {formatCurrency(activeItem.netWorth)}
              </span>
              <span className='text-neutral-400 dark:text-neutral-500 text-[10px]'>
                Inv: {formatCurrency(activeItem.invested)}
              </span>
            </div>
          </div>
        )}

        <div className='w-full overflow-hidden'>
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className='w-full h-auto max-h-[250px] overflow-visible select-none'
          >
            <defs>
              {/* Net Worth Gradient Fill */}
              <linearGradient id='netWorthFill' x1='0' y1='0' x2='0' y2='1'>
                <stop offset='0%' stopColor='#10b981' stopOpacity='0.16' />
                <stop offset='100%' stopColor='#10b981' stopOpacity='0.0' />
              </linearGradient>

              {/* Mirrored Delta Gradient Fill */}
              <linearGradient id='deltaFill' x1='0' y1='0' x2='0' y2='1'>
                <stop offset='0%' stopColor='currentColor' stopOpacity='0.0' />
                <stop
                  offset='100%'
                  stopColor='currentColor'
                  stopOpacity='0.08'
                />
              </linearGradient>
            </defs>

            {/* Grid Hairlines */}
            <line
              x1={paddingX}
              y1={topY}
              x2={width - paddingX}
              y2={topY}
              className='stroke-neutral-200/60 dark:stroke-neutral-800/80 stroke-[1]'
              strokeDasharray='4 4'
            />
            <line
              x1={paddingX}
              y1={(topY + zeroY) / 2}
              x2={width - paddingX}
              y2={(topY + zeroY) / 2}
              className='stroke-neutral-200/60 dark:stroke-neutral-800/80 stroke-[1]'
              strokeDasharray='4 4'
            />
            <line
              x1={paddingX}
              y1={zeroY}
              x2={width - paddingX}
              y2={zeroY}
              className='stroke-neutral-300 dark:stroke-neutral-700 stroke-[1]'
            />

            {/* Axis Y Labels */}
            <text
              x={paddingX - 6}
              y={topY + 4}
              textAnchor='end'
              className='fill-neutral-400 dark:fill-neutral-500 text-[10px] font-mono tnum'
            >
              {formatCurrency(maxVal).slice(0, 5)}…
            </text>
            <text
              x={paddingX - 6}
              y={zeroY + 4}
              textAnchor='end'
              className='fill-neutral-400 dark:fill-neutral-500 text-[10px] font-mono tnum'
            >
              0
            </text>
            <text
              x={paddingX - 6}
              y={bottomY - 4}
              textAnchor='end'
              className='fill-neutral-400 dark:fill-neutral-500 text-[10px] font-mono tnum'
            >
              -Δ
            </text>

            {/* Upper Area Fill (Net Worth) */}
            <polygon
              points={`${getX(0)},${zeroY} ${netWorthPoints.join(' ')} ${getX(data.length - 1)},${zeroY}`}
              fill='url(#netWorthFill)'
            />

            {/* Lower Mirrored Area Fill (Delta) */}
            <polygon
              points={`${getX(0)},${zeroY} ${deltaPoints.join(' ')} ${getX(data.length - 1)},${zeroY}`}
              fill='url(#deltaFill)'
              className='text-neutral-500 dark:text-neutral-400'
            />

            {/* Mirrored Delta Silhouette Line */}
            <polyline
              fill='none'
              stroke='currentColor'
              strokeWidth='1.5'
              className='text-neutral-300 dark:text-neutral-700'
              points={deltaPoints.join(' ')}
            />

            {/* Invested Capital Line */}
            <polyline
              fill='none'
              stroke='currentColor'
              strokeWidth='1.5'
              strokeDasharray='5 4'
              className='text-neutral-400 dark:text-neutral-500'
              points={investedPoints.join(' ')}
            />

            {/* Net Worth Smooth Curve */}
            <polyline
              fill='none'
              stroke='#10b981'
              strokeWidth='2.5'
              strokeLinecap='round'
              strokeLinejoin='round'
              points={netWorthPoints.join(' ')}
            />

            {/* Data Point Markers & Interactive Columns */}
            {data.map((item, index) => {
              const cx = getX(index);
              const cy = getYNetWorth(item.netWorth);
              const isHovered = hoveredIndex === index;

              return (
                <g
                  key={item.month}
                  className='cursor-pointer'
                  onMouseEnter={() => setHoveredIndex(index)}
                >
                  {/* Invisible hit area */}
                  <rect
                    x={cx - (width - 2 * paddingX) / (data.length - 1) / 2}
                    y={0}
                    width={(width - 2 * paddingX) / (data.length - 1)}
                    height={height}
                    fill='transparent'
                  />

                  {/* Vertical hairline on hover */}
                  {isHovered && (
                    <line
                      x1={cx}
                      y1={topY}
                      x2={cx}
                      y2={bottomY}
                      className='stroke-neutral-300 dark:stroke-neutral-700 stroke-[1]'
                      strokeDasharray='2 2'
                    />
                  )}

                  {/* Circle dot on curve */}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isHovered ? 5 : 3.5}
                    className={cn(
                      'transition-all duration-150',
                      isHovered
                        ? 'fill-emerald-500 stroke-white dark:stroke-[#16171a] stroke-2'
                        : 'fill-emerald-600 dark:fill-emerald-500'
                    )}
                  />

                  {/* Month Label */}
                  <text
                    x={cx}
                    y={height - 2}
                    textAnchor='middle'
                    className={cn(
                      'text-[11px] font-mono transition-colors',
                      isHovered
                        ? 'fill-neutral-900 dark:fill-white font-bold'
                        : 'fill-neutral-400 dark:fill-neutral-500'
                    )}
                  >
                    {item.month}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
}

export default DashboardWealthChart;
