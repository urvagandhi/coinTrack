import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrokerCallbackHandler } from '../components/BrokerCallbackHandler';
import { ZerodhaCallbackView } from '../components/ZerodhaCallbackView';
import { UpstoxCallbackView } from '../components/UpstoxCallbackView';
import { portfolioAPI, brokerAPI } from '@/shared/api/client';

// Mock Next.js navigation
const mockPush = jest.fn();
const mockReplace = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  useSearchParams: jest.fn(() => ({
    get: jest.fn(),
  })),
}));

jest.mock('next/link', () => {
  return ({ children, href, ...rest }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  );
});

// Mock Framer Motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => {
      const { initial, animate, exit, transition, ...validProps } = props;
      return <div {...validProps}>{children}</div>;
    },
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

// Mock Animated Icons
jest.mock('@/shared/ui/feedback/animated-icons', () => ({
  AnimatedSuccessIcon: () => <span data-testid='animated-success-icon' />,
  AnimatedErrorIcon: () => <span data-testid='animated-error-icon' />,
  AnimatedWarningIcon: () => <span data-testid='animated-warning-icon' />,
}));

const mockInvalidateQueries = jest.fn().mockResolvedValue([]);
const mockRefetchQueries = jest.fn().mockResolvedValue([]);
jest.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({
    invalidateQueries: mockInvalidateQueries,
    refetchQueries: mockRefetchQueries,
  }),
}));

jest.mock('@/shared/api/client', () => ({
  portfolioAPI: {
    getSyncStatus: jest.fn(),
    manualRefresh: jest.fn(),
  },
  brokerAPI: {
    handleCallback: jest.fn(),
  },
  BROKERS: {
    ZERODHA: 'ZERODHA',
    UPSTOX: 'UPSTOX',
    ANGEL_ONE: 'ANGEL_ONE',
  },
}));

describe('Broker Connection Lifecycle & Complex Handshake Edge Cases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('BrokerCallbackHandler — State Machine & Telemetry Progression', () => {
    it('executes successful token exchange, hydrates dynamic telemetry channels, and allows manual redirect', async () => {
      const onCallback = jest.fn().mockResolvedValue({ success: true });
      portfolioAPI.getSyncStatus.mockResolvedValue({
        brokers: [
          {
            broker: 'ZERODHA',
            tokenActive: true,
            channels: [
              {
                id: 'EQUITY_HOLDINGS',
                name: 'Equity Holdings',
                supported: true,
                recordCount: 24,
                streaming: true,
              },
              {
                id: 'MF_HOLDINGS',
                name: 'Mutual Funds',
                supported: true,
                recordCount: 6,
                streaming: true,
              },
            ],
          },
        ],
      });

      render(
        <BrokerCallbackHandler
          brokerKey='ZERODHA'
          onCallback={onCallback}
          successRedirect='/brokers/zerodha'
        />
      );

      // Verify callback triggered immediately
      expect(onCallback).toHaveBeenCalledTimes(1);

      // Successfully hydrates success state
      expect(
        await screen.findByText(/Zerodha Connected/i, {}, { timeout: 4000 })
      ).toBeInTheDocument();
      expect(screen.getByText('24 securities')).toBeInTheDocument();
      expect(screen.getByText('6 folios')).toBeInTheDocument();

      // Click "Open Connection Hub" button
      const openBtn = screen.getByRole('button', {
        name: /Open Connection Hub/i,
      });
      fireEvent.click(openBtn);
      expect(mockPush).toHaveBeenCalledWith('/brokers/zerodha');
    });

    it('prevents duplicate callback execution under React 19 / StrictMode re-renders', async () => {
      const onCallback = jest
        .fn()
        .mockImplementation(() => new Promise(() => {}));

      const { rerender } = render(
        <BrokerCallbackHandler
          brokerKey='UPSTOX'
          onCallback={onCallback}
          successRedirect='/brokers/upstox'
        />
      );

      // StrictMode simulated immediate re-render
      rerender(
        <BrokerCallbackHandler
          brokerKey='UPSTOX'
          onCallback={onCallback}
          successRedirect='/brokers/upstox'
        />
      );

      expect(onCallback).toHaveBeenCalledTimes(1);
    });

    it('treats HTTP 400 (session already live or token already consumed) as success', async () => {
      const badRequestError = new Error('Token already used');
      badRequestError.status = 400;
      const onCallback = jest.fn().mockRejectedValue(badRequestError);

      render(
        <BrokerCallbackHandler
          brokerKey='ZERODHA'
          onCallback={onCallback}
          successRedirect='/brokers/zerodha'
        />
      );

      // HTTP 400 status safely normalizes to success state
      expect(
        await screen.findByText(/Zerodha Connected/i, {}, { timeout: 4000 })
      ).toBeInTheDocument();
      expect(mockInvalidateQueries).toHaveBeenCalled();
    });

    it('transitions to error screen when onCallback throws non-400 exception and allows retry', async () => {
      let callCount = 0;
      const onCallback = jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject(new Error('Kite API checksum mismatch'));
        }
        return Promise.resolve({ success: true });
      });

      render(
        <BrokerCallbackHandler
          brokerKey='ZERODHA'
          onCallback={onCallback}
          successRedirect='/brokers/zerodha'
        />
      );

      // Error state displayed
      expect(
        await screen.findByText('Authentication Failed', {}, { timeout: 3000 })
      ).toBeInTheDocument();
      expect(
        screen.getByText('Kite API checksum mismatch')
      ).toBeInTheDocument();

      // Click "Try Again"
      const retryBtn = screen.getByRole('button', { name: /Try Again/i });
      fireEvent.click(retryBtn);

      expect(onCallback).toHaveBeenCalledTimes(2);
      expect(
        await screen.findByText(/Zerodha Connected/i, {}, { timeout: 4000 })
      ).toBeInTheDocument();
    });

    it('renders previewState without triggering onCallback (Design Lab isolation)', () => {
      const onCallback = jest.fn();

      render(
        <BrokerCallbackHandler
          brokerKey='ZERODHA'
          onCallback={onCallback}
          previewState='success'
        />
      );

      expect(screen.getByText(/Zerodha Connected/i)).toBeInTheDocument();
      expect(onCallback).not.toHaveBeenCalled();
    });

    it('renders error previewState with custom fallback message', () => {
      render(
        <BrokerCallbackHandler brokerKey='ANGEL_ONE' previewState='error' />
      );

      expect(screen.getByText('Authentication Failed')).toBeInTheDocument();
      expect(
        screen.getByText(
          /Invalid API Secret or session token rejected by broker gateway/i
        )
      ).toBeInTheDocument();
    });

    it('renders stalled previewState with retry option', () => {
      render(
        <BrokerCallbackHandler brokerKey='UPSTOX' previewState='stalled' />
      );

      expect(screen.getByText('Handshake Delayed')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /Retry Handshake/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /Back to Directory/i })
      ).toBeInTheDocument();
    });
  });

  describe('ZerodhaCallbackView & UpstoxCallbackView — SearchParam Validation', () => {
    const { useSearchParams } = require('next/navigation');

    it('ZerodhaCallbackView displays error when request_token is absent in URL', async () => {
      useSearchParams.mockReturnValue({
        get: jest.fn(() => null),
      });

      render(<ZerodhaCallbackView />);

      expect(
        await screen.findByText('Authentication Failed', {}, { timeout: 3000 })
      ).toBeInTheDocument();
      expect(screen.getByText(/No request token in URL/i)).toBeInTheDocument();
    });

    it('ZerodhaCallbackView catches error query parameter from broker OAuth redirect', async () => {
      useSearchParams.mockReturnValue({
        get: jest.fn(param =>
          param === 'error' ? 'user_cancelled_at_zerodha' : null
        ),
      });

      render(<ZerodhaCallbackView />);

      expect(
        await screen.findByText('Authentication Failed', {}, { timeout: 3000 })
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          /Zerodha connection failed: user_cancelled_at_zerodha/i
        )
      ).toBeInTheDocument();
    });

    it('ZerodhaCallbackView calls brokerAPI.handleCallback with correct request_token', async () => {
      brokerAPI.handleCallback.mockResolvedValue({ status: 'success' });
      portfolioAPI.getSyncStatus.mockResolvedValue({ brokers: [] });

      useSearchParams.mockReturnValue({
        get: jest.fn(param => {
          if (param === 'request_token')
            return 'test_valid_request_token_12345';
          return null;
        }),
      });

      render(<ZerodhaCallbackView />);

      await waitFor(() => {
        expect(brokerAPI.handleCallback).toHaveBeenCalledWith(
          'ZERODHA',
          'test_valid_request_token_12345'
        );
      });
    });

    it('UpstoxCallbackView catches code query param and passes to brokerAPI', async () => {
      brokerAPI.handleCallback.mockResolvedValue({ status: 'success' });
      portfolioAPI.getSyncStatus.mockResolvedValue({ brokers: [] });

      useSearchParams.mockReturnValue({
        get: jest.fn(param => {
          if (param === 'code') return 'upstox_auth_code_98765';
          return null;
        }),
      });

      render(<UpstoxCallbackView />);

      await waitFor(() => {
        expect(brokerAPI.handleCallback).toHaveBeenCalledWith(
          'UPSTOX',
          'upstox_auth_code_98765'
        );
      });
    });

    it('UpstoxCallbackView handles error_description query param from Upstox redirect', async () => {
      useSearchParams.mockReturnValue({
        get: jest.fn(param => {
          if (param === 'error_description') return 'user_denied_consent';
          return null;
        }),
      });

      render(<UpstoxCallbackView />);

      expect(
        await screen.findByText('Authentication Failed', {}, { timeout: 3000 })
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Upstox connection error: user_denied_consent/i)
      ).toBeInTheDocument();
    });
  });
});
