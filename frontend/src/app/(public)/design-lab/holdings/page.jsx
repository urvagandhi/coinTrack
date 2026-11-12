import DesignLabHoldingsClient from './client';

export const metadata = {
  title: 'Holdings Ledger Simulator | Design Lab | coinTrack',
  description:
    'Unslopped Multi-Broker Equity Holdings Ledger with real-time alignment and broker switching.',
};

export default function DesignLabHoldingsPage() {
  return <DesignLabHoldingsClient />;
}
