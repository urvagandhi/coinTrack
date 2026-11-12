export default function robots() {
  const base =
    process.env.NEXT_PUBLIC_APP_URL || 'https://cointrack-finance.vercel.app';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/dashboard',
          '/dashboard/',
          '/portfolio',
          '/portfolio/',
          '/profile',
          '/profile/',
          '/notes',
          '/notes/',
          '/brokers',
          '/brokers/',
          '/mutual-fund',
          '/mutual-fund/',
          '/fixed-deposit',
          '/fixed-deposit/',
          '/gold-silver',
          '/gold-silver/',
          '/epf',
          '/epf/',
          '/ppf',
          '/ppf/',
        ],
      },
      {
        userAgent: [
          'GPTBot',
          'ClaudeBot',
          'Claude-Web',
          'PerplexityBot',
          'Google-Extended',
          'CCBot',
          'anthropic-ai',
          'OAI-SearchBot',
          'Applebot-Extended',
          'meta-externalagent',
          'cohere-ai',
          'Bytespider',
          'Amazonbot',
          'KagiBot',
        ],
        allow: [
          '/',
          '/calculators',
          '/calculators/',
          '/llms.txt',
          '/llms-full.txt',
        ],
        disallow: ['/api/', '/dashboard/'],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
