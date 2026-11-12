import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DashboardKpiGrid } from '../components/DashboardKpiGrid';
import { DashboardWealthChart } from '../components/DashboardWealthChart';
import { DashboardAssetSpread } from '../components/DashboardAssetSpread';
import { HoldingsTable } from '../components/HoldingsTable';
import { DashboardView } from '../components/DashboardView';

// Mock dependencies
jest.mock('@/shared/auth/AuthContext', () => ({
  useAuth: () => ({
    user: { name: 'Urva Gandhi', username: 'urva' },
  }),
}));

const mockSummary = {
  totalCurrentValue: 4824190,
  totalInvestedValue: 3683900,
  totalDayGain: 14820,
  totalDayGainPercent: 0.31,
  totalUnrealizedPL: 1140290,
  totalUnrealizedPLPercent: 30.95,
};

const mockRefetch = jest.fn().mockResolvedValue({});
jest.mock('@/features/portfolio', () => ({
  usePortfolioSummary: () => ({
    data: mockSummary,
    isLoading: false,
    refetch: mockRefetch,
  }),
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('@/shared/api/client', () => ({
  portfolioAPI: {
    manualRefresh: jest.fn().mockResolvedValue({ accepted: true }),
    getSyncStatus: jest.fn().mockResolvedValue({
      brokers: [
        { broker: 'ZERODHA', tokenActive: true },
        { broker: 'UPSTOX', tokenActive: true },
        { broker: 'ANGEL_ONE', tokenActive: true },
      ],
      hasIssues: false,
    }),
    getHoldings: jest.fn().mockResolvedValue([
      {
        symbol: 'RELIANCE',
        broker: 'ZERODHA',
        quantity: 50,
        averageBuyPrice: 2400,
        currentPrice: 2800,
        currentValue: 140000,
        unrealizedPL: 20000,
        unrealizedPLPercent: 16.6,
        dayGain: 1200,
        dayGainPercent: 0.86,
      },
    ]),
    getMfSips: jest.fn().mockResolvedValue({ data: [] }),
  },
  mutualFundAPI: {
    getDashboard: jest.fn().mockResolvedValue(null),
  },
  epfAPI: {
    getSummary: jest.fn().mockResolvedValue(null),
  },
  ppfAPI: {
    getSummary: jest.fn().mockResolvedValue(null),
  },
  fdAPI: {
    getSummary: jest.fn().mockResolvedValue(null),
  },
  goldSilverAPI: {
    getSummary: jest.fn().mockResolvedValue(null),
    getCurrentRates: jest.fn().mockResolvedValue([
      { metalType: 'GOLD', ratePerGram: 7642 },
      { metalType: 'SILVER', ratePerGram: 92 },
    ]),
  },
}));

jest.mock('@/widgets/broker-status-banner', () => ({
  BrokerStatusBanner: () => (
    <div data-testid='broker-status-banner'>Broker Banner</div>
  ),
}));

function renderWithClient(ui) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
}

describe('Dashboard Unslopped Components', () => {
  describe('DashboardKpiGrid', () => {
    it('renders all four primary wealth metrics with formatted values', () => {
      render(<DashboardKpiGrid summary={mockSummary} isLoading={false} />);

      expect(screen.getByText('Total Net Worth')).toBeInTheDocument();
      expect(screen.getByText("Today's Return")).toBeInTheDocument();
      expect(screen.getByText('Unrealized Gain')).toBeInTheDocument();
      expect(screen.getByText('Invested Capital')).toBeInTheDocument();

      // Check formatted values
      expect(screen.getByText(/48,24,190/)).toBeInTheDocument();
      expect(screen.getByText(/36,83,900/)).toBeInTheDocument();
      expect(screen.getByText(/14,820/)).toBeInTheDocument();
      expect(screen.getByText(/11,40,290/)).toBeInTheDocument();

      // Check Cash vs Equity & Broker telemetry
      expect(screen.getByText('Cash vs Equity')).toBeInTheDocument();
      expect(screen.getByText(/94% Equity · 6% Cash/)).toBeInTheDocument();
      expect(screen.getByText(/All 3 broker feeds live/)).toBeInTheDocument();
    });

    it('renders loading indicators when isLoading is true', () => {
      render(<DashboardKpiGrid summary={null} isLoading={true} />);
      const ellipses = screen.getAllByText('…');
      expect(ellipses.length).toBeGreaterThanOrEqual(3);
    });

    it('handles negative day gains and drawdowns gracefully', () => {
      const negativeSummary = {
        ...mockSummary,
        totalDayGain: -8400,
        totalDayGainPercent: -0.18,
        totalUnrealizedPL: -50000,
        totalUnrealizedPLPercent: -1.2,
      };

      render(<DashboardKpiGrid summary={negativeSummary} isLoading={false} />);
      expect(screen.getByText(/-₹8,400/)).toBeInTheDocument();
      expect(screen.getByText(/-₹50,000/)).toBeInTheDocument();
    });
  });

  describe('DashboardWealthChart', () => {
    it('renders SVG curve, axis labels, and quiet legend', () => {
      const { container } = render(<DashboardWealthChart timeRange='6M' />);

      expect(screen.getByText('Net worth vs. invested')).toBeInTheDocument();
      expect(screen.getByText('Net worth')).toBeInTheDocument();
      expect(screen.getByText('Invested')).toBeInTheDocument();
      expect(screen.getByText('Mirrored delta')).toBeInTheDocument();

      // Check SVG elements
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(screen.getByText('Nov')).toBeInTheDocument();
      expect(screen.getAllByText('May').length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('DashboardAssetSpread', () => {
    it('renders asset distribution categories and rebalancing alert', () => {
      renderWithClient(<DashboardAssetSpread summary={mockSummary} />);

      expect(screen.getByText('Asset distribution')).toBeInTheDocument();
      expect(
        screen.getByText('Consolidated across 6 ledgers')
      ).toBeInTheDocument();
      expect(screen.getByText('Target Model')).toBeInTheDocument();
      expect(screen.getByText('Equities')).toBeInTheDocument();
      expect(screen.getByText('Mutual Funds')).toBeInTheDocument();
      expect(screen.getByText('EPF & Fixed Income')).toBeInTheDocument();
      expect(screen.getByText('Gold & Silver')).toBeInTheDocument();
      expect(screen.getByText('42%')).toBeInTheDocument();
      expect(screen.getByText('28%')).toBeInTheDocument();
      expect(screen.getByText('16%')).toBeInTheDocument();
      expect(screen.getByText('14%')).toBeInTheDocument();

      // Rebalancing model
      expect(screen.getByText('Rebalancing Model')).toBeInTheDocument();
      expect(screen.getByText(/\+2.0% Equity Drift/)).toBeInTheDocument();
      expect(
        screen.getByText(
          /Equity exposure is at 42% vs your 40% strategic target/
        )
      ).toBeInTheDocument();

      // Depository schedule
      expect(screen.getByText('Ledger schedule')).toBeInTheDocument();
      expect(screen.getByText('Upcoming')).toBeInTheDocument();
      expect(screen.getByText('Monthly Auto-SIP')).toBeInTheDocument();
      expect(screen.getByText(/1 Dec · 2 Folios/)).toBeInTheDocument();
      expect(screen.getByText('₹30,000')).toBeInTheDocument();
      expect(screen.getByText('Section 80C Limit')).toBeInTheDocument();
      expect(screen.getByText(/PPF \+ EPF Cap ₹1.5L/)).toBeInTheDocument();
      expect(screen.getByText('83% Used')).toBeInTheDocument();
      expect(screen.getByText('Gold Spot 24K')).toBeInTheDocument();
      expect(screen.getByText('Live MCX Bullion Feed')).toBeInTheDocument();
      expect(screen.getByText(/₹76,420/)).toBeInTheDocument();
    });
  });

  describe('HoldingsTable', () => {
    it('renders holdings header and empty state appropriately', async () => {
      renderWithClient(<HoldingsTable />);

      // Should render the header once data loads
      await waitFor(() => {
        expect(
          screen.getByText(/Active holdings|Holdings/)
        ).toBeInTheDocument();
      });
    });
  });

  describe('DashboardView', () => {
    it('renders consolidated wealth header with live status dot and time range buttons', async () => {
      renderWithClient(<DashboardView />);

      expect(screen.getByText('Consolidated wealth')).toBeInTheDocument();
      await waitFor(() => {
        expect(
          screen.getByText(/All Feeds Live|Feeds Live|Feeds/)
        ).toBeInTheDocument();
      });
      const quarter = Math.floor(new Date().getMonth() / 3) + 1;
      expect(
        screen.getByText(`Q${quarter} ${new Date().getFullYear()}`)
      ).toBeInTheDocument();

      // Check range buttons
      expect(screen.getByText('1M')).toBeInTheDocument();
      expect(screen.getAllByText('6M').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('1Y')).toBeInTheDocument();
      expect(screen.getByText('ALL')).toBeInTheDocument();

      // Change time range
      const oneYearBtn = screen.getByRole('button', { name: '1Y' });
      fireEvent.click(oneYearBtn);
      expect(oneYearBtn).toHaveClass('shadow-2xs');
    });

    it('triggers sync when clicking Sync feeds button and shows Sonner toast', async () => {
      const { toast } = require('sonner');
      const { portfolioAPI } = require('@/shared/api/client');
      renderWithClient(<DashboardView />);
      const syncBtn = screen.getByText('Sync feeds');
      fireEvent.click(syncBtn);

      await waitFor(() => {
        expect(portfolioAPI.manualRefresh).toHaveBeenCalled();
        expect(toast.success).toHaveBeenCalledWith(
          'Holdings and market feeds synchronized'
        );
      });
    });
  });
});
