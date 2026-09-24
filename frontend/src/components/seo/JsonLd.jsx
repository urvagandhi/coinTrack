export function JsonLd({ data }) {
  if (!data) return null;
  return (
    <script
      type='application/ld+json'
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'coinTrack',
    url: 'https://cointrack-finance.vercel.app',
    logo: 'https://cointrack-finance.vercel.app/coinTrack.png',
    description:
      'Personal finance aggregator uniting live broker portfolios and manual ledgers.',
  };
}

export function generateCalculatorSchema({ name, description, category }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: `${name} - coinTrack`,
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'All',
    description,
    genre: category,
  };
}

export default JsonLd;
