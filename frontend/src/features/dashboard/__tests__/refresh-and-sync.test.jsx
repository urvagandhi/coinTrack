import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RefreshButton } from '../components/RefreshButton';
import { useSyncFeeds } from '@/features/brokers/hooks/useSyncFeeds';
import { portfolioAPI } from '@/shared/api/client';
import { toast } from 'sonner';

jest.mock('@/shared/api/client', () => ({
  portfolioAPI: {
    manualRefresh: jest.fn(),
  },
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

function renderWithClient(ui) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
}

// Test harness component for testing useSyncFeeds options
function SyncTester({ options = {} }) {
  const { sync, isSyncing } = useSyncFeeds(options);
  return (
    <div>
      <input data-testid='text-input' type='text' />
      <button onClick={sync} disabled={isSyncing}>
        {isSyncing ? 'Syncing...' : 'Sync Now'}
      </button>
    </div>
  );
}

describe('RefreshButton and useSyncFeeds', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('RefreshButton Component', () => {
    it('renders with "Sync" label and "⌘R" shortcut badge', () => {
      renderWithClient(<RefreshButton />);
      expect(screen.getByText('Sync')).toBeInTheDocument();
      expect(screen.getByText('⌘R')).toBeInTheDocument();
    });

    it('triggers manualRefresh and fires Sonner toast on click', async () => {
      portfolioAPI.manualRefresh.mockResolvedValueOnce({ accepted: true });
      renderWithClient(<RefreshButton />);

      const syncBtn = screen.getByRole('button', { name: /Sync/i });
      fireEvent.click(syncBtn);

      await waitFor(() => {
        expect(portfolioAPI.manualRefresh).toHaveBeenCalledTimes(1);
        expect(toast.success).toHaveBeenCalledWith(
          'Holdings and market feeds synchronized'
        );
      });
    });

    it('handles sync errors and displays error toast', async () => {
      portfolioAPI.manualRefresh.mockRejectedValueOnce(
        new Error('Network gateway timeout')
      );
      renderWithClient(<RefreshButton />);

      const syncBtn = screen.getByRole('button', { name: /Sync/i });
      fireEvent.click(syncBtn);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Network gateway timeout');
      });
    });

    it('intercepts Cmd+R / Ctrl+R without reloading the page when shortcut is enabled', async () => {
      portfolioAPI.manualRefresh.mockResolvedValueOnce({ accepted: true });
      renderWithClient(<RefreshButton />);

      fireEvent.keyDown(window, {
        key: 'r',
        metaKey: true,
      });

      await waitFor(() => {
        expect(portfolioAPI.manualRefresh).toHaveBeenCalledTimes(1);
        expect(toast.success).toHaveBeenCalledWith(
          'Holdings and market feeds synchronized'
        );
      });
    });
  });

  describe('useSyncFeeds Hook with Custom Options', () => {
    it('customizes success toast message when brokerDisplayName is provided', async () => {
      portfolioAPI.manualRefresh.mockResolvedValueOnce({ accepted: true });
      renderWithClient(
        <SyncTester options={{ brokerDisplayName: 'Zerodha' }} />
      );

      const btn = screen.getByRole('button', { name: /Sync Now/i });
      fireEvent.click(btn);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(
          'Zerodha holdings and positions synchronized'
        );
      });
    });

    it('does not intercept Cmd+R when typing inside an input element', async () => {
      portfolioAPI.manualRefresh.mockResolvedValue({ accepted: true });
      renderWithClient(<SyncTester options={{ enableShortcut: true }} />);

      const input = screen.getByTestId('text-input');
      const event = new KeyboardEvent('keydown', {
        key: 'r',
        metaKey: true,
        bubbles: true,
        cancelable: true,
      });
      const preventDefaultSpy = jest.spyOn(event, 'preventDefault');

      input.dispatchEvent(event);

      expect(preventDefaultSpy).not.toHaveBeenCalled();
      expect(portfolioAPI.manualRefresh).not.toHaveBeenCalled();
    });
  });
});
