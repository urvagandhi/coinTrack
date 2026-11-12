import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrokersHeader } from '../components/BrokersHeader';
import { BrokersKpiGrid } from '../components/BrokersKpiGrid';
import { BrokersFilterToolbar } from '../components/BrokersFilterToolbar';
import { BrokersSecurityNotice } from '../components/BrokersSecurityNotice';
import { BrokerSidebar } from '../components/BrokerSidebar';
import { BROKERS } from '../constants';

describe('Broker Subsystem Decomposed Components', () => {
  describe('BrokersHeader', () => {
    it('renders heading, description, and sync button when connected', () => {
      const onRefresh = jest.fn();
      render(
        <BrokersHeader
          connectedCount={2}
          isRefreshing={false}
          onRefresh={onRefresh}
        />
      );

      expect(screen.getByText('Broker Connections')).toBeInTheDocument();
      expect(
        screen.getByText(/Authorise your brokerage accounts/i)
      ).toBeInTheDocument();

      const syncBtn = screen.getByRole('button', { name: /Sync All Feeds/i });
      expect(syncBtn).toBeInTheDocument();

      fireEvent.click(syncBtn);
      expect(onRefresh).toHaveBeenCalledTimes(1);
    });

    it('hides sync button when 0 brokers connected', () => {
      render(
        <BrokersHeader
          connectedCount={0}
          isRefreshing={false}
          onRefresh={jest.fn()}
        />
      );
      expect(
        screen.queryByRole('button', { name: /Sync All Feeds/i })
      ).not.toBeInTheDocument();
    });
  });

  describe('BrokersKpiGrid', () => {
    it('renders all 4 KPIs with correct labels and values', () => {
      render(
        <BrokersKpiGrid
          connectedCount={1}
          totalBrokers={3}
          hasExpired={false}
          isLoading={false}
        />
      );

      expect(screen.getByText('Active Feeds')).toBeInTheDocument();
      expect(screen.getByText('1 of 3')).toBeInTheDocument();
      expect(screen.getByText('Session Health')).toBeInTheDocument();
      expect(screen.getByText('All Synchronized')).toBeInTheDocument();
      expect(screen.getByText('Security Mode')).toBeInTheDocument();
      expect(screen.getByText('Read-Only Sync')).toBeInTheDocument();
      expect(screen.getByText('Storage Standard')).toBeInTheDocument();
      expect(screen.getByText('AES-256-GCM')).toBeInTheDocument();
    });
  });

  describe('BrokersFilterToolbar', () => {
    it('renders filter pills and updates search input', () => {
      const onSearchChange = jest.fn();
      const onFilterChange = jest.fn();

      render(
        <BrokersFilterToolbar
          search='Zerodha'
          onSearchChange={onSearchChange}
          activeFilter='all'
          onFilterChange={onFilterChange}
          counts={{ all: 3, connected: 1, available: 2 }}
        />
      );

      expect(screen.getByText('All')).toBeInTheDocument();
      expect(screen.getByText('Connected')).toBeInTheDocument();
      expect(screen.getByText('Available')).toBeInTheDocument();

      const connectedPill = screen.getByText('Connected').closest('button');
      fireEvent.click(connectedPill);
      expect(onFilterChange).toHaveBeenCalledWith('connected');

      const searchInput = screen.getByPlaceholderText('Search brokers...');
      expect(searchInput).toHaveValue('Zerodha');
    });
  });

  describe('BrokersSecurityNotice', () => {
    it('renders the institutional read-only banner', () => {
      render(<BrokersSecurityNotice />);
      expect(
        screen.getByText(
          /Institutional Read-Only Standard & Privacy Isolation/i
        )
      ).toBeInTheDocument();
      expect(
        screen.getByText(/encrypted at rest using AES-256-GCM/i)
      ).toBeInTheDocument();
    });
  });

  describe('BrokerSidebar', () => {
    it('renders broker identity and all 3 settings tabs', () => {
      const onTabChange = jest.fn();
      render(
        <BrokerSidebar
          broker={BROKERS.ZERODHA}
          activeTab='credentials'
          onTabChange={onTabChange}
          statusBadge={<span>Live</span>}
        />
      );

      expect(screen.getByText('Zerodha')).toBeInTheDocument();
      expect(screen.getByText('Credentials & Keys')).toBeInTheDocument();
      expect(screen.getByText('Developer Guide')).toBeInTheDocument();
      expect(screen.getByText('Connection Hub')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Connection Hub').closest('button'));
      expect(onTabChange).toHaveBeenCalledWith('hub');
    });
  });
});
