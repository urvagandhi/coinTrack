export default function manifest() {
  return {
    name: 'coinTrack - The Personal Finance Aggregator',
    short_name: 'coinTrack',
    description:
      'Track Zerodha, Upstox & Angel One portfolios with manual Gold, EPF, PPF, and Mutual Fund ledgers in one place.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0f1117',
    theme_color: '#0f1117',
    icons: [
      {
        src: '/coinTrack.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/coinTrack.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
