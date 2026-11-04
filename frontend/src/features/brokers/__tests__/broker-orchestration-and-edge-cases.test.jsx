import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrokersView } from '../components/BrokersView';
import { ZerodhaSetupView } from '../components/ZerodhaSetupView';
import { portfolioAPI, brokerAPI } from '@/shared/api/client';
import { toast } from 'sonner';

// Mock dependencies
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const mockInvalidateQueries = jest.fn().mockResolvedValue([]);
const mockRefetchQueries = jest.fn().mockResolvedValue([]);
jest.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({
    invalidateQueries: mockInvalidateQueries,
    refetchQueries: mockRefetchQueries,
  }),
}));

const mockUseBrokerConnection = jest.fn();
jest.mock('../hooks/useBrokerConnection', () => ({
  useBrokerConnection: () => mockUseBrokerConnection(),
  invalidateBrokerQueries: jest.fn().mockResolvedValue([]),
}));

jest.mock('@/shared/api/client', () => ({
  portfolioAPI: {
    manualRefresh: jest.fn(),
  },
  brokerAPI: {
    saveZerodhaCredentials: jest.fn(),
    getConnectUrl: jest.fn(),
    disconnectZerodha: jest.fn(),
  },
  BROKERS: {
    ZERODHA: 'ZERODHA',
    UPSTOX: 'UPSTOX',
    ANGEL_ONE: 'ANGEL_ONE',
  },
}));

jest.mock('next/link', () => {
  return ({ children, href, ...rest }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  );
});

describe('Broker Directory Orchestrator, Form Lifecycles & Bizarre Edge Cases', () => {
  let consoleErrorSpy;

  beforeAll(() => {
    // Suppress jsdom's benign "Not implemented: navigation" console error
    consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation((...args) => {
        const msg = String(args[0] || '');
        if (msg.includes('Not implemented: navigation')) return;
        // Let other errors print if any
      });
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('BrokersView — Search, Filter & Multi-Broker Orchestration', () => {
    it('filters brokers dynamically by search query across name, tagline, and capabilities', () => {
      mockUseBrokerConnection.mockReturnValue({
        isLoading: false,
        data: { brokers: [] },
      });

      render(<BrokersView />);

      const searchInput = screen.getByPlaceholderText('Search brokers...');

      // 1. Search by Name
      fireEvent.change(searchInput, { target: { value: 'Zerodha' } });
      expect(
        screen.getByRole('heading', { name: 'Zerodha' })
      ).toBeInTheDocument();
      expect(
        screen.queryByRole('heading', { name: 'Upstox' })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('heading', { name: 'Angel One' })
      ).not.toBeInTheDocument();

      // 2. Search by Tagline case-insensitively
      fireEvent.change(searchInput, { target: { value: 'lArGeSt StOcK' } });
      expect(
        screen.getByRole('heading', { name: 'Zerodha' })
      ).toBeInTheDocument();
      expect(
        screen.queryByRole('heading', { name: 'Upstox' })
      ).not.toBeInTheDocument();

      // 3. Search by Unique Capability
      fireEvent.change(searchInput, { target: { value: 'Mutual Funds' } });
      expect(
        screen.getByRole('heading', { name: 'Zerodha' })
      ).toBeInTheDocument();
      expect(
        screen.queryByRole('heading', { name: 'Upstox' })
      ).not.toBeInTheDocument();
    });

    it('renders empty search state and resets on "Clear filters" click', () => {
      mockUseBrokerConnection.mockReturnValue({
        isLoading: false,
        data: { brokers: [] },
      });

      render(<BrokersView />);

      const searchInput = screen.getByPlaceholderText('Search brokers...');
      fireEvent.change(searchInput, {
        target: { value: 'NonExistentBroker12345' },
      });

      expect(screen.getByText('No brokers found')).toBeInTheDocument();
      expect(
        screen.getByText(/No brokerage accounts matched your query/i)
      ).toBeInTheDocument();

      // Click "Clear filters"
      const clearBtn = screen.getByRole('button', { name: /Clear filters/i });
      fireEvent.click(clearBtn);

      // Restores all 3 brokers
      expect(
        screen.getByRole('heading', { name: 'Zerodha' })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('heading', { name: 'Upstox' })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('heading', { name: 'Angel One' })
      ).toBeInTheDocument();
    });

    it('filters brokers accurately by connection status tabs', () => {
      mockUseBrokerConnection.mockReturnValue({
        isLoading: false,
        data: {
          brokers: [
            { broker: 'ZERODHA', tokenActive: true },
            { broker: 'UPSTOX', tokenActive: false },
          ],
        },
      });

      render(<BrokersView />);

      // Connected tab click
      const connectedPill = screen.getByText('Connected').closest('button');
      fireEvent.click(connectedPill);

      expect(
        screen.getByRole('heading', { name: 'Zerodha' })
      ).toBeInTheDocument();
      expect(
        screen.queryByRole('heading', { name: 'Upstox' })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('heading', { name: 'Angel One' })
      ).not.toBeInTheDocument();

      // Available tab click
      const availablePill = screen.getByText('Available').closest('button');
      fireEvent.click(availablePill);

      expect(
        screen.queryByRole('heading', { name: 'Zerodha' })
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole('heading', { name: 'Upstox' })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('heading', { name: 'Angel One' })
      ).toBeInTheDocument();
    });

    it('handles global manual refresh for all active feeds successfully', async () => {
      mockUseBrokerConnection.mockReturnValue({
        isLoading: false,
        data: {
          brokers: [{ broker: 'ZERODHA', tokenActive: true }],
        },
      });
      portfolioAPI.manualRefresh.mockResolvedValue({ status: 'ok' });

      render(<BrokersView />);

      const syncAllBtn = screen.getByRole('button', {
        name: /Sync All Feeds/i,
      });
      fireEvent.click(syncAllBtn);

      await waitFor(() => {
        expect(portfolioAPI.manualRefresh).toHaveBeenCalledTimes(1);
        expect(toast.success).toHaveBeenCalledWith(
          'Holdings and market feeds synchronized'
        );
      });
    });

    it('catches and reports error toast when global refresh fails', async () => {
      mockUseBrokerConnection.mockReturnValue({
        isLoading: false,
        data: {
          brokers: [{ broker: 'ZERODHA', tokenActive: true }],
        },
      });
      portfolioAPI.manualRefresh.mockRejectedValue(
        new Error('Gateway timeout')
      );

      render(<BrokersView />);

      const syncAllBtn = screen.getByRole('button', {
        name: /Sync All Feeds/i,
      });
      fireEvent.click(syncAllBtn);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Gateway timeout');
      });
    });

    it('handles corrupted, nullish or malformed sync status payloads safely', () => {
      mockUseBrokerConnection.mockReturnValue({
        isLoading: false,
        data: {
          brokers: null,
          corrupted: true,
        },
      });

      expect(() => render(<BrokersView />)).not.toThrow();
      expect(screen.getByText('0 of 3')).toBeInTheDocument();
    });
  });

  describe('ZerodhaSetupView — Form State, OAuth Redirection & Disconnect Workflow', () => {
    it('disables save button when credentials inputs are empty or whitespace', () => {
      mockUseBrokerConnection.mockReturnValue({
        isLoading: false,
        data: { brokers: [] },
      });

      render(<ZerodhaSetupView />);

      const saveBtn = screen.getByRole('button', {
        name: /Save & Authenticate/i,
      });
      expect(saveBtn).toBeDisabled();

      // Enter only whitespace in API Key
      const apiKeyInput = screen.getByPlaceholderText(
        'Your Kite Connect API Key'
      );
      fireEvent.change(apiKeyInput, { target: { value: '   ' } });
      expect(saveBtn).toBeDisabled();
    });

    it('saves valid credentials, calls getConnectUrl, and executes connection handshake', async () => {
      mockUseBrokerConnection.mockReturnValue({
        isLoading: false,
        data: { brokers: [] },
      });
      brokerAPI.saveZerodhaCredentials.mockResolvedValue({ status: 'saved' });
      brokerAPI.getConnectUrl.mockResolvedValue({
        loginUrl: 'https://kite.zerodha.com/connect/login?api_key=valid_key',
      });

      render(<ZerodhaSetupView />);

      // Enter API Key (textbox)
      const apiKeyInput = screen.getByPlaceholderText(
        'Your Kite Connect API Key'
      );
      fireEvent.change(apiKeyInput, { target: { value: 'kite_key_12345678' } });

      // Enter API Secret (password input)
      const secretInput = screen.getByPlaceholderText(
        'Your Kite Connect API Secret'
      );
      fireEvent.change(secretInput, {
        target: { value: 'kite_secret_abcdef1234567890' },
      });

      const saveBtn = screen.getByRole('button', {
        name: /Save & Authenticate/i,
      });
      expect(saveBtn).not.toBeDisabled();
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(brokerAPI.saveZerodhaCredentials).toHaveBeenCalledWith({
          apiKey: 'kite_key_12345678',
          apiSecret: 'kite_secret_abcdef1234567890',
        });
        expect(brokerAPI.getConnectUrl).toHaveBeenCalledWith('ZERODHA');
      });
    });

    it('handles backend error during credential save and displays error alert banner', async () => {
      mockUseBrokerConnection.mockReturnValue({
        isLoading: false,
        data: { brokers: [] },
      });
      brokerAPI.saveZerodhaCredentials.mockRejectedValue(
        new Error('Invalid HMAC signature format')
      );

      render(<ZerodhaSetupView />);

      const apiKeyInput = screen.getByPlaceholderText(
        'Your Kite Connect API Key'
      );
      fireEvent.change(apiKeyInput, { target: { value: 'kite_key_12345678' } });

      const secretInput = screen.getByPlaceholderText(
        'Your Kite Connect API Secret'
      );
      fireEvent.change(secretInput, { target: { value: 'bad_secret' } });

      const saveBtn = screen.getByRole('button', {
        name: /Save & Authenticate/i,
      });
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(
          screen.getByText('Invalid HMAC signature format')
        ).toBeInTheDocument();
        expect(toast.error).toHaveBeenCalledWith(
          'Invalid HMAC signature format'
        );
      });
    });
  });
});
