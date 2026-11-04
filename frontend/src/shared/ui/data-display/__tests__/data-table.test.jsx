import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  parseSymbol,
  SymbolBadge,
  BrokerBadge,
  PnLCell,
  DayChangeCell,
  DataTable,
} from '../data-table';

describe('Shared DataTable Asset & Formatters (Unslop Standards)', () => {
  describe('parseSymbol', () => {
    it('splits exchange prefix and ticker cleanly', () => {
      expect(parseSymbol('NSE:SBIN')).toEqual({
        exchange: 'NSE',
        ticker: 'SBIN',
      });
      expect(parseSymbol('BSE:COALINDIA')).toEqual({
        exchange: 'BSE',
        ticker: 'COALINDIA',
      });
      expect(parseSymbol('RELIANCE')).toEqual({
        exchange: '',
        ticker: 'RELIANCE',
      });
      expect(parseSymbol('')).toEqual({ exchange: '', ticker: '—' });
    });
  });

  describe('SymbolBadge', () => {
    it('renders clean ticker and quiet exchange badge', () => {
      render(<SymbolBadge symbol='NSE:SBIN' index={0} />);
      expect(screen.getByText('01')).toBeInTheDocument();
      expect(screen.getByText('SBIN')).toBeInTheDocument();
      expect(screen.getByText('NSE')).toBeInTheDocument();
    });

    it('renders without exchange badge if none provided', () => {
      render(<SymbolBadge symbol='HDFCBANK' />);
      expect(screen.getByText('HDFCBANK')).toBeInTheDocument();
      expect(screen.queryByText('NSE')).not.toBeInTheDocument();
    });
  });

  describe('BrokerBadge', () => {
    it('formats broker name in sentence case with status dot', () => {
      render(<BrokerBadge broker='ZERODHA' />);
      expect(screen.getByText('Zerodha')).toBeInTheDocument();
    });

    it('handles Upstox and Angel One cleanly', () => {
      const { rerender } = render(<BrokerBadge broker='UPSTOX' />);
      expect(screen.getByText('Upstox')).toBeInTheDocument();

      rerender(<BrokerBadge broker='ANGEL_ONE' />);
      expect(screen.getByText('Angel One')).toBeInTheDocument();
    });
  });

  describe('PnLCell', () => {
    it('self-heals 0.00% when pnl is negative and invested capital is known', () => {
      // User scenario: NSE:SBIN, invested = 1041.95, pnl = -62.95, pnlPercent was 0
      render(
        <PnLCell
          pnl={-62.95}
          pnlPercent={0}
          averagePrice={1041.95}
          quantity={1}
        />
      );

      expect(screen.getByText(/-₹62.95/)).toBeInTheDocument();
      // Computed percentage: (-62.95 / 1041.95) * 100 = -6.04%
      expect(screen.getByText(/-6.04%/)).toBeInTheDocument();
    });

    it('handles zero P&L correctly', () => {
      render(
        <PnLCell pnl={0} pnlPercent={0} quantity={0} averagePrice={1310} />
      );
      expect(screen.getByText('₹0.00')).toBeInTheDocument();
      expect(screen.getByText('0.00%')).toBeInTheDocument();
    });
  });

  describe('DayChangeCell', () => {
    it('renders directional percentage', () => {
      render(<DayChangeCell dayGain={120} dayGainPercent={0.9} />);
      expect(screen.getByText('+0.90%')).toBeInTheDocument();
    });
  });

  describe('DataTable', () => {
    it('renders header with record count and table children', () => {
      render(
        <DataTable title='Active holdings' count={3}>
          <table>
            <tbody>
              <tr>
                <td>SBIN</td>
              </tr>
            </tbody>
          </table>
        </DataTable>
      );

      expect(screen.getByText('Active holdings')).toBeInTheDocument();
      expect(screen.getByText('3 on record')).toBeInTheDocument();
      expect(screen.getByText('SBIN')).toBeInTheDocument();
    });

    it('renders empty message when isEmpty is true', () => {
      render(
        <DataTable
          title='Active holdings'
          count={0}
          isEmpty={true}
          emptyMessage='No holdings found'
        />
      );

      expect(screen.getByText('No holdings found')).toBeInTheDocument();
    });
  });
});
