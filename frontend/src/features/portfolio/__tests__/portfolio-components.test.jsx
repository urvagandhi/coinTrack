import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrokerFilterPills } from '../components/BrokerFilterPills';
import { HoldingsTab } from '../components/HoldingsTab';
import { OrdersTab } from '../components/OrdersTab';
import { PortfolioTabBar } from '../components/PortfolioTabBar';
import { PositionsTab } from '../components/PositionsTab';
import { StockDossierModal } from '../components/StockDossierModal';
import { TradesTab } from '../components/TradesTab';

let mockSearchParamTab = null;

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(key => (key === 'tab' ? mockSearchParamTab : null)),
    toString: () => '',
  }),
  usePathname: () => '/portfolio',
}));

jest.mock('sonner', () => ({
  toast: {
    warning: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('@/shared/auth/AuthContext', () => ({
  useAuth: () => ({
    user: {
      fullName: 'Urva Yogeshkumar Gandhi',
      username: 'urvagandhi24',
      email: 'urvagandhi24@gmail.com',
    },
  }),
}));

const mockHoldingsData = [
  {
    id: '1',
    symbol: 'TCS',
    companyName: 'Tata Consultancy Services Ltd',
    exchange: 'NSE',
    broker: 'ZERODHA',
    quantity: 45,
    averageBuyPrice: 3410.0,
    currentPrice: 4120.5,
    investedValue: 153450.0,
    currentValue: 185422.5,
    unrealizedPL: 31972.5,
    dayGainPercent: 1.15,
    isin: 'INE467B01029',
    dematAccount: '1208160002941021',
  },
  {
    id: '2',
    symbol: 'HDFCBANK',
    companyName: 'HDFC Bank Ltd',
    exchange: 'NSE',
    broker: 'UPSTOX',
    quantity: 120,
    averageBuyPrice: 1530.0,
    currentPrice: 1720.5,
    investedValue: 183600.0,
    currentValue: 206460.0,
    unrealizedPL: 22860.0,
    dayGainPercent: 0.88,
    isin: 'INE040A01034',
    dematAccount: '1208180004928172',
  },
];

const mockPositionsData = [
  {
    symbol: 'NSE:SBIN',
    tradingsymbol: 'SBIN',
    companyName: 'State Bank of India',
    broker: 'ZERODHA',
    quantity: 100,
    averagePrice: 750.0,
    lastPrice: 820.0,
    unrealizedPL: 7000.0,
    dayGain: 350.0,
    product: 'CNC',
    isDerivative: false,
  },
  {
    symbol: 'NIFTY26NOV24000CE',
    tradingsymbol: 'NIFTY26NOV24000CE',
    broker: 'ZERODHA',
    quantity: 50,
    averagePrice: 120.0,
    lastPrice: 145.0,
    unrealizedPL: 1250.0,
    dayGain: 200.0,
    product: 'NRML',
    isDerivative: true,
    instrumentType: 'OPT',
    optionType: 'CE',
    strikePrice: 24000,
    expiry: '2026-11-26',
  },
];

const mockOrdersData = [
  {
    orderId: 'ORD-101',
    symbol: 'NSE:TCS',
    tradingsymbol: 'TCS',
    broker: 'ZERODHA',
    transactionType: 'BUY',
    product: 'CNC',
    quantity: 10,
    price: 4100.0,
    status: 'COMPLETE',
    orderTimestamp: '2026-11-05T10:00:00Z',
  },
];

const _mockTradesData = [
  {
    tradeId: 'TRD-201',
    orderId: 'ORD-101',
    symbol: 'NSE:TCS',
    tradingsymbol: 'TCS',
    broker: 'ZERODHA',
    transactionType: 'BUY',
    quantity: 10,
    price: 4100.0,
    fillTimestamp: '2026-11-05T10:00:02Z',
  },
];

jest.mock('../hooks/usePortfolioHoldings', () => ({
  usePortfolioHoldings: () => ({
    data: mockHoldingsData,
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  }),
}));

jest.mock('../hooks/usePortfolioPositions', () => ({
  usePortfolioPositions: () => ({
    data: mockPositionsData,
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  }),
}));

jest.mock('../hooks/usePortfolioOrders', () => ({
  usePortfolioOrders: () => ({
    data: mockOrdersData,
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  }),
}));

jest.mock('@/shared/api/client', () => ({
  ...jest.requireActual('@/shared/api/client'),
  portfolioAPI: {
    getTrades: jest.fn().mockResolvedValue([
      {
        tradeId: 'TRD-201',
        orderId: 'ORD-101',
        symbol: 'NSE:TCS',
        tradingsymbol: 'TCS',
        broker: 'ZERODHA',
        transactionType: 'BUY',
        quantity: 10,
        price: 4100.0,
        fillTimestamp: '2026-11-05T10:00:02Z',
      },
    ]),
    getProfile: jest.fn().mockResolvedValue({
      user_name: 'Urva Yogeshkumar Gandhi',
      email: 'urvagandhi24@gmail.com',
      user_id: 'ZK8942',
      broker: 'ZERODHA',
    }),
    getMfHoldings: jest.fn().mockResolvedValue([]),
    getMfOrders: jest.fn().mockResolvedValue([]),
    getMfSips: jest.fn().mockResolvedValue({ data: [], unlinkedSipOrders: [] }),
    getMfInstruments: jest.fn().mockResolvedValue([]),
    getMfTimeline: jest.fn().mockResolvedValue([]),
  },
}));

describe('Portfolio Components & User Invariants', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchParamTab = null;
  });

  describe('PortfolioTabBar Visibility & Routing Rules', () => {
    it('CRITICAL: renders null in "ALL" demats (secondary tab bar hidden!)', () => {
      const { container } = render(
        <PortfolioTabBar
          selectedBroker='ALL'
          activeTab='holdings'
          onTabChange={jest.fn()}
        />
      );
      expect(container.firstChild).toBeNull();
    });

    it('renders categorized tabs when a broker is selected', () => {
      render(
        <PortfolioTabBar
          selectedBroker='ZERODHA'
          activeTab='holdings'
          onTabChange={jest.fn()}
          counts={{ holdings: 6, positions: 1 }}
        />
      );
      expect(screen.getByText('EQUITY')).toBeInTheDocument();
      expect(screen.getByText('ACTIVITY')).toBeInTheDocument();
      expect(screen.getByText('MUTUAL FUNDS')).toBeInTheDocument();
      expect(screen.getByText('ACCOUNT')).toBeInTheDocument();
      expect(screen.getByText('Brokers')).toBeInTheDocument();
    });

    it('omits MUTUAL FUNDS tab group when Upstox is selected', () => {
      render(
        <PortfolioTabBar
          selectedBroker='UPSTOX'
          activeTab='holdings'
          onTabChange={jest.fn()}
          counts={{ holdings: 5, positions: 1 }}
        />
      );
      expect(screen.getByText('EQUITY')).toBeInTheDocument();
      expect(screen.getByText('ACTIVITY')).toBeInTheDocument();
      expect(screen.queryByText('MUTUAL FUNDS')).not.toBeInTheDocument();
    });
  });

  describe('HoldingsTab Column Rules', () => {
    it('shows "Broker" column header when selectedBroker is "ALL"', () => {
      render(<HoldingsTab selectedBroker='ALL' onInspect={jest.fn()} />);
      expect(
        screen.getByRole('columnheader', { name: 'Broker' })
      ).toBeInTheDocument();
      expect(screen.getByText('Zerodha')).toBeInTheDocument();
      expect(screen.getByText('Upstox')).toBeInTheDocument();
    });

    it('CRITICAL: hides "Broker" column header when a single broker is selected', () => {
      render(<HoldingsTab selectedBroker='ZERODHA' onInspect={jest.fn()} />);
      expect(
        screen.queryByRole('columnheader', { name: 'Broker' })
      ).not.toBeInTheDocument();
      expect(screen.getByText('TCS')).toBeInTheDocument();
      expect(screen.queryByText('HDFCBANK')).not.toBeInTheDocument();
    });

    it('invokes onInspect callback when clicking a stock row', () => {
      const handleInspect = jest.fn();
      render(<HoldingsTab selectedBroker='ALL' onInspect={handleInspect} />);
      const tcsRow = screen.getByText('TCS').closest('tr');
      fireEvent.click(tcsRow);
      expect(handleInspect).toHaveBeenCalledTimes(1);
      expect(handleInspect).toHaveBeenCalledWith(
        expect.objectContaining({ symbol: 'TCS' })
      );
    });
  });

  describe('PositionsTab Unslop Redesign', () => {
    it('renders 4 KPI summary cards and parses symbols cleanly', () => {
      render(<PositionsTab selectedBroker='ZERODHA' onInspect={jest.fn()} />);
      expect(screen.getByText('Total Net P&L')).toBeInTheDocument();
      expect(screen.getByText('Day M2M Gain')).toBeInTheDocument();
      expect(screen.getByText('Open Contracts')).toBeInTheDocument();
      expect(screen.getByText('Settlement Mode')).toBeInTheDocument();

      // Parsed symbol: "SBIN" bold and "NSE" badge (not raw "NSE:SBIN")
      expect(screen.getByText('SBIN')).toBeInTheDocument();
      expect(screen.getByText('NSE')).toBeInTheDocument();
      // Single broker selected: Broker column header must NOT be present
      expect(
        screen.queryByRole('columnheader', { name: 'Broker' })
      ).not.toBeInTheDocument();
    });

    it('switches between Equity and Derivatives sub-views', () => {
      render(<PositionsTab selectedBroker='ZERODHA' onInspect={jest.fn()} />);
      expect(screen.getByText('SBIN')).toBeInTheDocument();

      const derivBtn = screen.getByRole('button', { name: /Derivatives/i });
      fireEvent.click(derivBtn);
      expect(screen.getAllByText('NIFTY26NOV24000CE')[0]).toBeInTheDocument();
      expect(screen.queryByText('SBIN')).not.toBeInTheDocument();
    });
  });

  describe('OrdersTab Demo Alignment & Backend Integration', () => {
    it('renders clean demo table columns and filters', () => {
      render(<OrdersTab selectedBroker='ZERODHA' />);
      expect(screen.getByRole('button', { name: 'ALL' })).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'COMPLETE' })
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'OPEN' })).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'CANCELLED' })
      ).toBeInTheDocument();
      expect(screen.getByText('Time')).toBeInTheDocument();
      expect(screen.getByText('Symbol')).toBeInTheDocument();
      expect(screen.getByText('Type')).toBeInTheDocument();
      expect(screen.getByText('Qty')).toBeInTheDocument();
      expect(screen.getByText('Price')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getAllByText('COMPLETE')[0]).toBeInTheDocument();
      // Single broker selected: Broker column header must NOT be present
      expect(
        screen.queryByRole('columnheader', { name: 'Broker' })
      ).not.toBeInTheDocument();
    });
  });

  describe('TradesTab Demo Alignment & Backend Integration', () => {
    it('renders clean demo trade executions and columns', async () => {
      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
      });
      render(
        <QueryClientProvider client={queryClient}>
          <TradesTab selectedBroker='ZERODHA' />
        </QueryClientProvider>
      );
      expect(await screen.findByText('Time')).toBeInTheDocument();
      expect(screen.getByText('Trade Ref')).toBeInTheDocument();
      expect(screen.getByText('Symbol')).toBeInTheDocument();
      expect(screen.getByText('Qty')).toBeInTheDocument();
      expect(screen.getByText('Exec Price')).toBeInTheDocument();
      expect(screen.getByText('Net Value')).toBeInTheDocument();
    });
  });

  describe('BrokerFilterPills User Workflow', () => {
    const mockBrokerStatus = [
      {
        broker: 'ZERODHA',
        tokenActive: true,
        needsReconnect: false,
      },
      {
        broker: 'UPSTOX',
        tokenActive: false,
        needsReconnect: true,
        lastStatus: 'EXPIRED',
      },
    ];

    it('renders pills with active, reconnect, and unlinked indicators', () => {
      render(
        <BrokerFilterPills
          selectedBroker='ALL'
          onSelectBroker={jest.fn()}
          holdings={mockHoldingsData}
          brokerStatus={mockBrokerStatus}
        />
      );

      expect(screen.getAllByText('All demats')[0]).toBeInTheDocument();
      expect(screen.getByText('Zerodha Kite')).toBeInTheDocument();
      expect(screen.getByText('Upstox')).toBeInTheDocument();
      expect(screen.getByText('RE-AUTH')).toBeInTheDocument();
      expect(screen.getByText('Angel One')).toBeInTheDocument();
      expect(screen.getByText('UNLINKED')).toBeInTheDocument();
    });

    it('displays toast warning on 1st click of an unlinked broker', () => {
      const { toast } = require('sonner');
      const handleSelect = jest.fn();

      render(
        <BrokerFilterPills
          selectedBroker='ALL'
          onSelectBroker={handleSelect}
          holdings={mockHoldingsData}
          brokerStatus={mockBrokerStatus}
        />
      );

      const angelPill = screen.getByText('Angel One').closest('button');
      fireEvent.click(angelPill);

      expect(toast.warning).toHaveBeenCalledWith(
        expect.stringContaining('Angel One is not linked yet'),
        expect.any(Object)
      );
      expect(handleSelect).not.toHaveBeenCalled();
    });

    it('navigates to broker setup on 2nd consecutive click of an unlinked broker', () => {
      render(
        <BrokerFilterPills
          selectedBroker='ALL'
          onSelectBroker={jest.fn()}
          holdings={mockHoldingsData}
          brokerStatus={mockBrokerStatus}
        />
      );

      const angelPill = screen.getByText('Angel One').closest('button');
      fireEvent.click(angelPill);
      fireEvent.click(angelPill);

      expect(mockPush).toHaveBeenCalledWith('/brokers/angelone');
    });
  });

  describe('StockDossierModal', () => {
    const mockStock = {
      symbol: 'TCS',
      companyName: 'Tata Consultancy Services Ltd',
      exchange: 'NSE',
      broker: 'ZERODHA',
      quantity: 45,
      averageBuyPrice: 3410.0,
      currentPrice: 4120.5,
      investedValue: 153450.0,
      currentValue: 185422.5,
      unrealizedPL: 31972.5,
      dayGain: 1800.0,
      dayGainPercent: 1.15,
      isin: 'INE467B01029',
      dematAccount: '1208160002941021',
      low52: 3200,
      high52: 4500,
    };

    it('renders stock valuation, 52W spectrum, and FIFO tax engine', () => {
      const handleClose = jest.fn();
      render(
        <StockDossierModal
          isOpen={true}
          position={mockStock}
          onClose={handleClose}
        />
      );

      expect(screen.getByText('TCS')).toBeInTheDocument();
      expect(
        screen.getByText('Tata Consultancy Services Ltd')
      ).toBeInTheDocument();
      expect(screen.getByText('52-Week Range Spectrum')).toBeInTheDocument();
      expect(
        screen.getByText('Capital Gains Classification (FIFO)')
      ).toBeInTheDocument();
      expect(screen.getByText('12081600 · 02941021')).toBeInTheDocument();
    });

    it('calls onClose when clicking the close button', () => {
      const handleClose = jest.fn();
      render(
        <StockDossierModal
          isOpen={true}
          position={mockStock}
          onClose={handleClose}
        />
      );

      const closeBtn = screen.getByRole('button', { name: 'Close' });
      fireEvent.click(closeBtn);
      expect(handleClose).toHaveBeenCalledTimes(1);
    });
  });
});
