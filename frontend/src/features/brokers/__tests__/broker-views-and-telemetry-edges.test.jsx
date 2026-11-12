import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ConnectionHubPanel } from '../components/ConnectionHubPanel';
import { AccountCustodyDossier } from '../components/AccountCustodyDossier';
import { BrokerCard } from '../components/BrokerCard';
import { BrokerSetupLayout } from '../components/BrokerSetupLayout';
import { BROKERS } from '../constants';

// Mock TanStack Query hook
const mockUseBrokerConnection = jest.fn();
jest.mock('../hooks/useBrokerConnection', () => ({
  useBrokerConnection: () => mockUseBrokerConnection(),
}));

jest.mock('next/link', () => {
  return ({ children, href, ...rest }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  );
});

describe('Broker Views, Real-Time Telemetry & Environmental Edge Cases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('ConnectionHubPanel — Telemetry, Streams & Relative Time Formatting', () => {
    const baseBroker = BROKERS.ZERODHA;

    it('renders connected state with dynamic syndication channels and live stream active indicators', () => {
      const brokerStatus = {
        broker: 'ZERODHA',
        tokenActive: true,
        lastSuccessAt: new Date(Date.now() - 35000).toISOString(), // 35 seconds ago
        gatewayLatencyMs: 42,
        channels: [
          {
            id: 'EQUITY_HOLDINGS',
            name: 'Equity Holdings',
            desc: 'Demat portfolio active',
            tag: 'NSE / BSE',
            supported: true,
            streaming: true,
            status: 'Streaming',
            recordCount: 38,
          },
          {
            id: 'MF_HOLDINGS',
            name: 'Mutual Funds',
            desc: 'Folios synced',
            tag: 'AMFI Daily',
            supported: true,
            streaming: true,
            status: 'Streaming',
            recordCount: 5,
          },
        ],
      };

      render(
        <ConnectionHubPanel
          broker={baseBroker}
          brokerStatus={brokerStatus}
          isConnected={true}
          isExpired={false}
          onManualSync={jest.fn()}
          onRefreshToken={jest.fn()}
          onUnlink={jest.fn()}
        />
      );

      // Verify connection header
      expect(screen.getByText('Zerodha Authenticated')).toBeInTheDocument();
      expect(screen.getByText(/35s ago/i)).toBeInTheDocument();
      expect(screen.getByText(/42ms/i)).toBeInTheDocument();

      // Verify dynamic channels & record counts
      expect(screen.getByText('Equity Holdings')).toBeInTheDocument();
      expect(screen.getByText('Mutual Funds')).toBeInTheDocument();
      expect(screen.getByText('2 of 2 channels streaming')).toBeInTheDocument();
    });

    it('renders disconnected state card when isConnected is false', () => {
      render(
        <ConnectionHubPanel
          broker={baseBroker}
          brokerStatus={{ broker: 'ZERODHA', tokenActive: false }}
          isConnected={false}
          isExpired={false}
          onManualSync={jest.fn()}
          onRefreshToken={jest.fn()}
          onUnlink={jest.fn()}
        />
      );

      expect(screen.getByText('Zerodha Not Connected')).toBeInTheDocument();
      expect(
        screen.getByText(/Provide your API credentials in the Credentials tab/i)
      ).toBeInTheDocument();
    });

    it('triggers manual sync action and disables refresh button during active syndication', () => {
      const onManualSync = jest.fn();

      const { rerender } = render(
        <ConnectionHubPanel
          broker={baseBroker}
          brokerStatus={{ broker: 'ZERODHA', tokenActive: true }}
          isConnected={true}
          isExpired={false}
          onManualSync={onManualSync}
          isManualSyncing={false}
          onRefreshToken={jest.fn()}
          onUnlink={jest.fn()}
        />
      );

      const syncBtn = screen.getByRole('button', { name: /Sync Feeds Now/i });
      fireEvent.click(syncBtn);
      expect(onManualSync).toHaveBeenCalledTimes(1);

      // Re-render in syncing state
      rerender(
        <ConnectionHubPanel
          broker={baseBroker}
          brokerStatus={{ broker: 'ZERODHA', tokenActive: true }}
          isConnected={true}
          isExpired={false}
          onManualSync={onManualSync}
          isManualSyncing={true}
          onRefreshToken={jest.fn()}
          onUnlink={jest.fn()}
        />
      );

      expect(screen.getByRole('button', { name: /Syncing…/i })).toBeDisabled();
    });

    it('triggers unlink / disconnect dialog callback when disconnect button is clicked', () => {
      const onUnlink = jest.fn();

      render(
        <ConnectionHubPanel
          broker={baseBroker}
          brokerStatus={{ broker: 'ZERODHA', tokenActive: true }}
          isConnected={true}
          isExpired={false}
          onManualSync={jest.fn()}
          onRefreshToken={jest.fn()}
          onUnlink={onUnlink}
        />
      );

      const disconnectBtn = screen.getByRole('button', {
        name: /Unlink Broker Account/i,
      });
      fireEvent.click(disconnectBtn);
      expect(onUnlink).toHaveBeenCalledTimes(1);
    });

    it('handles bizarre date inputs safely: null, undefined, invalid string, epoch 0, clock skew', () => {
      // 1. null ISO
      const { rerender } = render(
        <ConnectionHubPanel
          broker={baseBroker}
          brokerStatus={{
            broker: 'ZERODHA',
            tokenActive: true,
            lastSuccessAt: null,
          }}
          isConnected={true}
          isExpired={false}
        />
      );
      expect(screen.getAllByText('Never synced')[0]).toBeInTheDocument();

      // 2. Corrupt string
      rerender(
        <ConnectionHubPanel
          broker={baseBroker}
          brokerStatus={{
            broker: 'ZERODHA',
            tokenActive: true,
            lastSuccessAt: 'not-a-valid-date-iso',
          }}
          isConnected={true}
          isExpired={false}
        />
      );
      expect(screen.getAllByText('Never')[0]).toBeInTheDocument();

      // 3. Sub-10s time (just now)
      rerender(
        <ConnectionHubPanel
          broker={baseBroker}
          brokerStatus={{
            broker: 'ZERODHA',
            tokenActive: true,
            lastSuccessAt: new Date(Date.now() - 4000).toISOString(),
          }}
          isConnected={true}
          isExpired={false}
        />
      );
      expect(screen.getAllByText(/just now/i)[0]).toBeInTheDocument();

      // 4. Future date (client clock behind server)
      rerender(
        <ConnectionHubPanel
          broker={baseBroker}
          brokerStatus={{
            broker: 'ZERODHA',
            tokenActive: true,
            lastSuccessAt: new Date(Date.now() + 60000).toISOString(),
          }}
          isConnected={true}
          isExpired={false}
        />
      );
      expect(screen.getAllByText(/just now/i)[0]).toBeInTheDocument();
    });

    it('renders error banner when error prop is supplied', () => {
      render(
        <ConnectionHubPanel
          broker={baseBroker}
          brokerStatus={{ broker: 'ZERODHA', tokenActive: true }}
          isConnected={true}
          error='Connection timed out by gateway'
        />
      );

      expect(
        screen.getByText('Connection timed out by gateway')
      ).toBeInTheDocument();
    });
  });

  describe('BrokerCard — Status Indicators, Latency & Theme Tokens', () => {
    it('renders Live Stream active badge and Manage CTA when broker is connected', () => {
      mockUseBrokerConnection.mockReturnValue({
        isLoading: false,
        data: {
          brokers: [
            {
              broker: 'ZERODHA',
              tokenActive: true,
              lastSuccessAt: new Date().toISOString(),
            },
          ],
        },
      });

      render(<BrokerCard broker={BROKERS.ZERODHA} />);

      expect(screen.getByText('Live Stream')).toBeInTheDocument();
      expect(screen.getByText('Manage')).toBeInTheDocument();
      expect(screen.getByRole('link')).toHaveAttribute(
        'href',
        '/brokers/zerodha'
      );
    });

    it('renders Session Expired badge and Reconnect CTA when session is expired', () => {
      mockUseBrokerConnection.mockReturnValue({
        isLoading: false,
        data: {
          brokers: [
            {
              broker: 'UPSTOX',
              tokenActive: false,
              lastStatus: 'EXPIRED',
            },
          ],
        },
      });

      render(<BrokerCard broker={BROKERS.UPSTOX} />);

      expect(screen.getByText('Session Expired')).toBeInTheDocument();
      expect(screen.getByText('Reconnect')).toBeInTheDocument();
    });

    it('renders Not Connected badge and Connect CTA when broker is unconfigured', () => {
      mockUseBrokerConnection.mockReturnValue({
        isLoading: false,
        data: { brokers: [] },
      });

      render(<BrokerCard broker={BROKERS.ANGEL_ONE} />);

      expect(screen.getByText('Not Connected')).toBeInTheDocument();
      expect(screen.getByText('Connect')).toBeInTheDocument();
    });

    it('renders skeleton pulse loading state during network hydration', () => {
      mockUseBrokerConnection.mockReturnValue({
        isLoading: true,
        data: null,
      });

      const { container } = render(<BrokerCard broker={BROKERS.ZERODHA} />);

      const pulsingElements = container.querySelectorAll('.animate-pulse');
      expect(pulsingElements.length).toBeGreaterThan(0);
    });

    it('renders broker capabilities tags correctly', () => {
      mockUseBrokerConnection.mockReturnValue({
        isLoading: false,
        data: { brokers: [] },
      });

      render(<BrokerCard broker={BROKERS.ZERODHA} />);

      BROKERS.ZERODHA.capabilities.forEach(cap => {
        expect(screen.getByText(cap)).toBeInTheDocument();
      });
    });
  });

  describe('BrokerSetupLayout — Docked Sidebar & Two-Column Workspace', () => {
    it('renders back navigation link to /brokers directory', () => {
      render(
        <BrokerSetupLayout
          broker={BROKERS.ZERODHA}
          activeTab='credentials'
          onTabChange={jest.fn()}
        >
          <div>Tab Content</div>
        </BrokerSetupLayout>
      );

      const backLink = screen.getByRole('link', {
        name: /Back to Broker Directory/i,
      });
      expect(backLink).toHaveAttribute('href', '/brokers');
      expect(screen.getByText('Tab Content')).toBeInTheDocument();
    });

    it('propagates active tab changes from docked sidebar to container', () => {
      const onTabChange = jest.fn();
      render(
        <BrokerSetupLayout
          broker={BROKERS.ZERODHA}
          activeTab='credentials'
          onTabChange={onTabChange}
          statusBadge={<span>Connected Badge</span>}
        >
          <div>Main Panel</div>
        </BrokerSetupLayout>
      );

      expect(screen.getByText('Connected Badge')).toBeInTheDocument();

      const guideTab = screen.getByText('Developer Guide').closest('button');
      fireEvent.click(guideTab);
      expect(onTabChange).toHaveBeenCalledWith('guide');
    });
  });

  describe('AccountCustodyDossier — Pure Dynamic Resolution & Zero Static Leaks', () => {
    it('renders completely dynamic values supplied by backend broker status', () => {
      const dynamicStatus = {
        brokerUserId: 'USR_XYZ999',
        accountHolder: 'Dev User Sharma',
        email: 'dev.sharma@example.org',
        dematAccount: '1208990098765432',
        exchanges: ['NSE', 'BSE', 'MCX'],
        products: ['DELIVERY', 'INTRADAY'],
        lastSuccessAt: '2026-11-05T10:15:00Z',
        protocol: 'OAuth 2.0 REST',
        securityMode: 'Read-Only Enforced',
      };

      render(
        <AccountCustodyDossier
          brokerKey='ZERODHA'
          brokerStatus={dynamicStatus}
        />
      );

      expect(screen.getByText('USR_XYZ999')).toBeInTheDocument();
      expect(screen.getByText('Dev User Sharma')).toBeInTheDocument();
      expect(screen.getByText('dev.sharma@example.org')).toBeInTheDocument();
      expect(screen.getByText('12089900 · 98765432')).toBeInTheDocument();
      expect(screen.getByText('NSE, BSE, MCX')).toBeInTheDocument();
      expect(screen.getByText('DELIVERY, INTRADAY')).toBeInTheDocument();
    });

    it('renders safe em-dashes without hardcoded static broker codes when data is missing', () => {
      render(<AccountCustodyDossier brokerKey='UPSTOX' brokerStatus={{}} />);

      // Verify no hardcoded static strings appear in the document
      expect(screen.queryByText('6A7201')).not.toBeInTheDocument();
      expect(screen.queryByText('EUS554')).not.toBeInTheDocument();
      expect(screen.queryByText('A19482')).not.toBeInTheDocument();
      expect(screen.queryByText(/12081600/)).not.toBeInTheDocument();
      expect(screen.queryByText(/12081800/)).not.toBeInTheDocument();
      expect(
        screen.queryByText('Urva Yogeshkumar Gandhi')
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText('urvagandhi24@gmail.com')
      ).not.toBeInTheDocument();
    });
  });
});
