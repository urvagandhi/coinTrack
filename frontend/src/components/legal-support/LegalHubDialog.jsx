'use client';

import { useModal } from '@/contexts/ModalContext';
import BaseDialog from '@/components/ui/feedback/base-dialog';
import { Button } from '@/components/ui/primitives/button';
import { Badge } from '@/components/ui/primitives/badge';
import { Input } from '@/components/ui/primitives/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/primitives/tabs';
import { DialogClose } from '@/components/ui/primitives/dialog';
import {
  ShieldCheck,
  FileText,
  Lock,
  Cookie,
  Scale,
  Search,
  Info,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';

// ───────────────────────────────────────────────────────────────
//  LEGAL KNOWLEDGE BASE DATASET
// ───────────────────────────────────────────────────────────────

const LEGAL_DOCUMENTS = {
  privacy: {
    id: 'privacy',
    kicker: 'Privacy Policy & Data Protection',
    title: 'Privacy Policy',
    shortName: 'Privacy',
    lede: 'Full disclosure on how coinTrack gathers, encrypts, and safeguards your financial telemetry under the Digital Personal Data Protection (DPDP) Act, 2023.',
    icon: Lock,
    badgeText: 'DPDP Act 2023 · SEBI & RBI Compliant',
    lastUpdated: 'Updated Sept 2026',
    sections: [
      {
        number: '01',
        heading: 'Data Fiduciary Responsibility & Minimization Scope',
        keywords: [
          'fiduciary',
          'dpdp',
          'collect',
          'email',
          'name',
          'phone',
          'telemetry',
          'minimization',
        ],
        body: 'coinTrack operates as a designated Data Fiduciary under the Digital Personal Data Protection (DPDP) Act, 2023. We adhere strictly to data minimization standards: we collect only essential identity markers (full legal name, verified email, mobile number, date of birth) and encrypted read-only broker API authorization tokens required to render your net worth dashboard.',
      },
      {
        number: '02',
        heading: 'Read-Only Broker OAuth Aggregation (Zero Execution Rights)',
        keywords: [
          'broker',
          'zerodha',
          'upstox',
          'groww',
          'oauth',
          'read-only',
          'execution',
          'trade',
          'withdrawal',
        ],
        body: 'All broker integrations (Zerodha, Upstox, Groww, AngelOne) connect strictly through official OAuth 2.0 and REST API channels with enforced READ-ONLY scope. coinTrack NEVER requests, stores, or receives permissions for order placement, trading execution, fund transfers, or bank withdrawals. Your broker passwords remain 100% private and are never handled by coinTrack.',
      },
      {
        number: '03',
        heading: 'Hardware-Backed AES-256 Encryption & Access Security',
        body: 'Your sensitive financial holdings and token keys are encrypted using hardware-backed 256-bit AES encryption at rest and TLS 1.3 in transit. System access is gated with mandatory Time-based One-Time Password (TOTP) 2FA and real-time hardware modifier detection (Caps/Num lock tracking).',
        keywords: [
          'encryption',
          'aes-256',
          'tls',
          'security',
          '2fa',
          'totp',
          'hardware',
        ],
      },
      {
        number: '04',
        heading: 'Zero Data Commercialization & Strict Purpose Limitation',
        body: 'We do NOT sell, rent, monetize, or trade your personal or portfolio telemetry with third-party advertisers, credit bureaus, or lead aggregators. Data processing is restricted exclusively to personal net worth calculation, unified analytics, taxation tracking, and security monitoring.',
        keywords: [
          'sell',
          'advertising',
          'monetize',
          'third-party',
          'data sale',
          'commercialization',
        ],
      },
      {
        number: '05',
        heading: 'User Data Rights & Right to Erasure (Grievance Officer)',
        body: 'Under DPDP Act 2023 standards, you maintain absolute rights to inspect your data transcript, request corrections, or execute your Right to Erasure (deleting your account and stored tokens instantly). For data privacy inquiries or grievance redressal, contact our Data Protection Officer at privacy@cointrack.app.',
        keywords: [
          'erasure',
          'delete',
          'rights',
          'transcript',
          'grievance',
          'dpo',
          'contact',
        ],
      },
    ],
  },
  terms: {
    id: 'terms',
    kicker: 'Terms of Service & Subscriber Agreement',
    title: 'Terms of Service',
    shortName: 'Terms',
    lede: 'Governing legal agreement between coinTrack and verified subscribers under Indian law and SEBI regulatory guidelines.',
    icon: FileText,
    badgeText: 'Indian Contract Act 1872 · SEBI Guidelines',
    lastUpdated: 'Updated Sept 2026',
    sections: [
      {
        number: '01',
        heading: 'Eligibility & Account Custodianship',
        body: 'By opening an account, you represent and warrant that you are at least 18 years old and legally competent to form a binding contract under the Indian Contract Act, 1872. You assume full responsibility for maintaining credential confidentiality and all activities conducted under your ledger.',
        keywords: [
          '18+',
          'eligibility',
          'contract',
          'account',
          'custodian',
          'credentials',
        ],
      },
      {
        number: '02',
        heading: 'Permitted Usage & Platform Scope',
        body: 'coinTrack grants you a limited, non-exclusive, non-transferable license for personal, non-commercial portfolio aggregation. Automated scraping, reverse engineering, security probe attempts, or bot deployment against our endpoints or partner APIs is strictly prohibited.',
        keywords: [
          'usage',
          'scraping',
          'bots',
          'license',
          'reverse engineering',
          'scope',
        ],
      },
      {
        number: '03',
        heading:
          'SEBI Investment Advice Disclaimer (Informational Reference Only)',
        body: 'coinTrack is a financial analytics software technology platform and is NOT registered as a SEBI Investment Advisor (RIA) or Portfolio Manager (PMS). Visualizations, net worth projections, and performance metrics are provided strictly for INFORMATIONAL PURPOSES ONLY and do not constitute financial, investment, legal, or tax advice.',
        keywords: [
          'sebi',
          'advice',
          'disclaimer',
          'ria',
          'pms',
          'investment advice',
          'tax',
        ],
      },
      {
        number: '04',
        heading: 'Third-Party Broker API Feeds & Limitation of Liability',
        body: 'Portfolio metrics depend on API connectivity provided by external stockbrokers, depositories (NSDL/CDSL), and asset managers. coinTrack accepts no liability for third-party API downtime, exchange rate latency, or independent trading decisions made on external execution platforms.',
        keywords: [
          'liability',
          'broker api',
          'nsdl',
          'cdsl',
          'downtime',
          'latency',
          'exchanges',
        ],
      },
      {
        number: '05',
        heading: 'Terms Revisions & Governing Jurisdiction',
        body: 'We reserve the right to revise these Terms with 14 days advance notification via email or platform announcements. This agreement is governed by the laws of the Republic of India, and disputes shall be subject to the exclusive jurisdiction of the courts in Mumbai, Maharashtra.',
        keywords: [
          'jurisdiction',
          'mumbai',
          'court',
          'disputes',
          'revisions',
          'amendment',
        ],
      },
    ],
  },
  cookies: {
    id: 'cookies',
    kicker: 'Cookie & Local Storage Policy',
    title: 'Cookie Policy',
    shortName: 'Cookies',
    lede: 'Transparent disclosure on essential session markers, security tokens, and local storage utilization.',
    icon: Cookie,
    badgeText: 'Web Security Standard · Session Defense',
    lastUpdated: 'Updated Sept 2026',
    sections: [
      {
        number: '01',
        heading: 'Strictly Necessary Session Markers',
        body: 'We set essential HTTP-only, SameSite=Strict cookies and encrypted local storage tokens required for user authentication, session integrity, theme preferences, and CSRF defense. These markers cannot be disabled without impairing application function.',
        keywords: [
          'cookies',
          'session',
          'csrf',
          'http-only',
          'localstorage',
          'tokens',
        ],
      },
      {
        number: '02',
        heading: 'Zero Third-Party Advertising Trackers',
        body: 'coinTrack does NOT use cross-site tracking cookies, behavioral advertising pixels, or third-party retargeting code. All telemetry remains internal and focused on system performance.',
        keywords: ['pixels', 'retargeting', 'tracking', 'ads', 'privacy'],
      },
      {
        number: '03',
        heading: 'User Browser Controls & Reset',
        body: 'You may clear local storage or block cookies via browser settings at any time. Clearing essential authentication storage will sign out your session and reset temporary UI state.',
        keywords: ['browser', 'clear', 'reset', 'sign out'],
      },
    ],
  },
};

export default function LegalHubDialog() {
  const { activeModal, closeModal, openModal } = useModal();
  const [searchQuery, setSearchQuery] = useState('');

  const isOpen =
    activeModal === 'privacy' ||
    activeModal === 'terms' ||
    activeModal === 'cookies';
  const currentDocKey = isOpen ? activeModal : 'privacy';
  const data = LEGAL_DOCUMENTS[currentDocKey] || LEGAL_DOCUMENTS.privacy;

  // Filter sections by search query
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return data.sections;
    const query = searchQuery.toLowerCase();
    return data.sections.filter(
      s =>
        s.heading.toLowerCase().includes(query) ||
        s.body.toLowerCase().includes(query) ||
        s.keywords?.some(k => k.toLowerCase().includes(query))
    );
  }, [data.sections, searchQuery]);

  if (!isOpen) return null;

  const headerTabs = (
    <Tabs
      value={currentDocKey}
      onValueChange={value => {
        setSearchQuery('');
        openModal(value);
      }}
      className='w-full sm:w-fit'
    >
      <TabsList className='w-full sm:w-fit rounded-xl p-1 bg-muted/50 border border-border/40 gap-1 h-auto'>
        {Object.values(LEGAL_DOCUMENTS).map(doc => {
          const isActive = doc.id === currentDocKey;
          const DocIcon = doc.icon;
          return (
            <TabsTrigger
              key={doc.id}
              value={doc.id}
              className='flex-1 sm:flex-initial py-1.5 px-3.5 text-xs rounded-xl font-semibold data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs'
            >
              <DocIcon
                className={cn(
                  'size-3.5',
                  isActive ? 'text-emerald-500' : 'text-muted-foreground/70'
                )}
              />
              <span>{doc.shortName}</span>
            </TabsTrigger>
          );
        })}
      </TabsList>
    </Tabs>
  );

  const subheaderContent = (
    <>
      <div className='relative flex-1 min-w-[200px] max-w-sm'>
        <Search className='size-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2' />
        <Input
          type='text'
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder={`Search ${data.title.toLowerCase()} clauses (e.g. SEBI, API, 2FA)...`}
          className='pl-8 py-1.5 text-xs h-8 bg-background/60 border-border/40 rounded-xl placeholder:text-muted-foreground/50'
        />
      </div>

      <Badge variant='secondary' className='rounded-lg'>
        {data.lastUpdated}
      </Badge>
    </>
  );

  const footerRightContent = (
    <DialogClose asChild>
      <Button
        variant='default'
        size='default'
        onClick={closeModal}
        className='rounded-xl px-6 font-semibold shadow-xs cursor-pointer w-full sm:w-auto'
      >
        I Understand & Agree
      </Button>
    </DialogClose>
  );

  return (
    <BaseDialog
      open={isOpen}
      onClose={closeModal}
      maxWidth='max-w-3xl lg:max-w-4xl'
      badgeText={data.badgeText}
      badgeVariant='success'
      badgeIcon={ShieldCheck}
      headerExtra={headerTabs}
      subheader={subheaderContent}
      footerRight={footerRightContent}
    >
      {/* Lede / Summary Banner */}
      <div className='p-4 rounded-2xl bg-muted/30 border border-border/40 text-xs sm:text-sm text-muted-foreground leading-relaxed flex items-start gap-3'>
        <Info className='size-4 text-emerald-500 shrink-0 mt-0.5' />
        <div className='space-y-1 text-left'>
          <p className='font-semibold text-foreground'>{data.kicker}</p>
          <p>{data.lede}</p>
        </div>
      </div>

      {/* Section Cards */}
      {filteredSections.length > 0 ? (
        <div className='space-y-6 pt-2 pb-4 text-left'>
          {filteredSections.map((section, index) => (
            <div key={section.number} className='space-y-2'>
              <h4 className='font-sans font-bold text-emerald-600 dark:text-emerald-500 text-sm sm:text-base tracking-tight'>
                {parseInt(section.number, 10)} - {section.heading}
              </h4>
              <p className='text-muted-foreground font-sans text-xs sm:text-sm leading-relaxed'>
                {section.body}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className='p-10 rounded-[24px] bg-card/60 backdrop-blur-xl border border-border/60 text-center text-xs text-muted-foreground space-y-3'>
          <Info className='size-6 text-muted-foreground/40 mx-auto' />
          <p className='font-semibold text-foreground text-sm'>
            No matching clauses found for "{searchQuery}"
          </p>
          <p>
            Try searching for terms like "SEBI", "Broker", "Encryption", "2FA",
            or "DPDP".
          </p>
          <Button
            variant='secondary'
            size='sm'
            onClick={() => setSearchQuery('')}
            className='mt-4 rounded-xl'
          >
            Clear Search Filter
          </Button>
        </div>
      )}

      {/* Legal Assistance Callout */}
      <div className='mt-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3 text-xs text-muted-foreground'>
        <Scale className='size-4 text-emerald-500 shrink-0 mt-0.5' />
        <p className='leading-relaxed text-left font-sans'>
          <strong className='font-semibold text-foreground'>
            Questions or Data Grievances?
          </strong>{' '}
          Contact our Data Protection & Grievance Officer at{' '}
          <a
            href='mailto:privacy@cointrack.app'
            className='font-medium text-emerald-600 dark:text-emerald-400 underline underline-offset-2 hover:opacity-80'
          >
            privacy@cointrack.app
          </a>
          . Official address: coinTrack Technologies Pvt. Ltd., BKC, Mumbai
          400051.
        </p>
      </div>
    </BaseDialog>
  );
}

export const LegalDialog = LegalHubDialog;
export const LegalModals = LegalHubDialog;
