'use client';

import { useMemo, useState } from 'react';
import ConfirmDialog from '@/components/ui/feedback/confirm-dialog';
import AnnouncementCard from '@/components/ui/data-display/announcement-card';
import { useToast } from '@/components/ui/feedback/use-toast';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/primitives/tabs';
import {
  Alert,
  AlertTitle,
  AlertDescription,
} from '@/components/ui/primitives/alert';
import { Badge } from '@/components/ui/primitives/badge';
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from '@/components/ui/primitives/avatar';
import { Button } from '@/components/ui/primitives/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/primitives/card';

import { Progress } from '@/components/ui/primitives/progress';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/primitives/dialog';
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from '@/components/ui/primitives/sheet';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
} from '@/components/ui/primitives/popover';
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/primitives/tooltip';
import { ScrollArea } from '@/components/ui/primitives/scroll-area';
import { Separator } from '@/components/ui/primitives/separator';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/primitives/table';
import { Label } from '@/components/ui/primitives/label';
import { Skeleton, SkeletonText } from '@/components/ui/feedback/Skeleton';
import BankSearchCombobox from '@/components/ui/search/BankSearchCombobox';
import SchemeSearchCombobox from '@/components/ui/search/SchemeSearchCombobox';
import CategoryDropdown from '@/components/ui/forms/CategoryDropdown';
import FilterDropdown from '@/components/ui/forms/FilterDropdown';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/primitives/dropdown-menu';
import {
  Building2,
  Coins,
  FileText,
  Landmark,
  PiggyBank,
  Trash2,
  SlidersHorizontal,
  ChevronRight,
  User,
  PanelRight,
  Mail,
  Tag,
  TrendingUp,
  Loader2,
} from 'lucide-react';

const ADD_MODULES = [
  {
    key: 'fd',
    name: 'Fixed Deposit (FD)',
    Icon: Building2,
    title: 'Add New Fixed Deposit',
    description:
      'Enter deposit details to track interest maturities automatically.',
    defaultAmount: '500000',
    saveLabel: 'Save Fixed Deposit',
  },
  {
    key: 'sip',
    name: 'MF — SIP',
    Icon: TrendingUp,
    title: 'Schedule New SIP Investment',
    description:
      'Automate monthly systematic investment plans in top mutual funds.',
    defaultAmount: '15000',
    saveLabel: 'Start SIP Plan',
  },
  {
    key: 'lumpsum',
    name: 'MF — Lumpsum',
    Icon: Coins,
    title: 'Record Lumpsum MF Purchase',
    description: 'Track one-time mutual fund investments and NAV performance.',
    defaultAmount: '100000',
    saveLabel: 'Record Lumpsum Investment',
  },
  {
    key: 'gold',
    name: 'Gold & Silver',
    Icon: Coins,
    title: 'Add Precious Metals Holding',
    description:
      'Log physical gold, digital gold, or silver bullion buy rates.',
    defaultAmount: '162400',
    saveLabel: 'Add Metal Holding',
  },
  {
    key: 'ppf',
    name: 'PPF Deposit',
    Icon: Landmark,
    title: 'Log PPF Contribution',
    description:
      'Record Public Provident Fund deposits for tax saving under 80C.',
    defaultAmount: '150000',
    saveLabel: 'Save PPF Deposit',
  },
  {
    key: 'epf',
    name: 'EPF Ledger',
    Icon: PiggyBank,
    title: 'Add EPF / VPF Contribution',
    description: 'Log monthly Provident Fund contributions from your employer.',
    defaultAmount: '12600',
    saveLabel: 'Save EPF Contribution',
  },
];
import {
  AnimatedSuccessIcon,
  AnimatedWarningIcon,
  AnimatedInfoIcon,
  AnimatedErrorIcon,
  AnimatedTerminalIcon,
  AnimatedTrashIcon,
  AnimatedSettingsIcon,
  AnimatedSparklesIcon,
  AnimatedPlusIcon,
  AnimatedBellIcon,
  AnimatedDownloadIcon,
} from '@/components/ui/feedback/animated-icons';
import {
  InsetFormCard,
  InsetFormRow,
  InsetTextInput,
  InsetEmailInput,
  EmailValidationBadge,
  InsetDropdownRow,
  InsetTextareaRow,
} from '@/components/ui/forms/inset-form-card';
import { CurrencyStepper } from '@/components/ui/forms/currency-stepper';
import { PasswordStrengthInput } from '@/components/ui/auth/security-inputs';
import { CopyableKey, TagInput } from '@/components/ui/forms/utility-inputs';
import {
  SpotlightInput,
  SlugInput,
} from '@/components/ui/primitives/spotlight-input';
import { CoinTrackNavbar } from '@/components/ui/coinTrack/cointrack-navbar';
import { CoinTrackFooter } from '@/components/ui/coinTrack/cointrack-footer';
import { CoinTrackSkyBackground } from '@/components/ui/coinTrack/cointrack-sky-background';

// ───────────────────────────────────────────────────────────────
//  DESIGN LAB — confirmation dialog showcase data
// ───────────────────────────────────────────────────────────────

const MODULES = [
  {
    key: 'fd',
    name: 'Fixed Deposit',
    Icon: Building2,
    refNo: 'FD-104',
    tone: 'destructive',
    title: 'Delete Fixed Deposit?',
    description:
      'This erases the deposit and everything the ledger kept about it — the maturity plan, withdrawal history and any TDS notes.',
    rows: [
      { label: 'Bank', value: 'HDFC Bank' },
      { label: 'Issue / FD No.', value: '•••• 4200' },
      { label: 'Issue Amount', value: '₹5,00,000' },
      { label: 'Tenure', value: '3 Years · 7.10%' },
    ],
    note: 'Withdrawal history and TDS notes are erased too.',
    confirmLabel: 'Delete Fixed Deposit',
  },
  {
    key: 'ppf',
    name: 'PPF Ledger',
    Icon: Landmark,
    refNo: 'TX-229',
    tone: 'destructive',
    title: 'Delete Transaction?',
    description:
      'The ledger entry and its contribution balance will be permanently struck from the record.',
    rows: [
      { label: 'Financial Year', value: '2026-27' },
      { label: 'Date', value: '05 Apr 2026' },
      { label: 'Type', value: 'DEPOSIT' },
      { label: 'Amount', value: '₹1,50,000' },
    ],
    confirmLabel: 'Delete Transaction',
  },
  {
    key: 'epf',
    name: 'EPF Ledger',
    Icon: PiggyBank,
    refNo: 'TX-118',
    tone: 'destructive',
    title: 'Delete EPF Transaction?',
    description:
      'The entry will be removed from the unified ledger. Account totals will be recomputed.',
    rows: [
      { label: 'Employer', value: 'Acme Pvt Ltd' },
      { label: 'Month', value: 'May 2026' },
      { label: 'Type', value: 'CONTRIBUTION' },
      { label: 'Amount', value: '₹6,300' },
    ],
    confirmLabel: 'Delete Transaction',
  },
  {
    key: 'gold',
    name: 'Gold & Silver',
    Icon: Coins,
    refNo: 'LOG-07',
    tone: 'destructive',
    title: 'Delete Purchased Asset?',
    description:
      'The holding, its buy price and any linked rate snapshots will be removed from your stack.',
    rows: [
      { label: 'Asset', value: 'Gold · 24K' },
      { label: 'Purity', value: '0.995' },
      { label: 'Quantity', value: '18.50 g' },
      { label: 'Buy Value', value: '₹1,62,400' },
    ],
    confirmLabel: 'Delete Asset',
  },
  {
    key: 'note',
    name: 'Note',
    Icon: FileText,
    refNo: 'N-77',
    tone: 'destructive',
    title: 'Delete this note?',
    description:
      'Pinned or not, the whole note is wiped in one stroke. Confirm if you are sure.',
    rows: [
      { label: 'Title', value: 'SBI — Auto-renewal' },
      { label: 'Pinned', value: 'TRUE' },
      { label: 'Edited', value: '12 Sep 2026' },
    ],
    confirmLabel: 'Delete Note',
  },
];

export default function DesignLabPage() {
  const { toast } = useToast();

  const [dialog, setDialog] = useState({
    open: false,
    module: MODULES[0],
    loading: false,
  });

  const [filterValue, setFilterValue] = useState('active');
  const [bankValue, setBankValue] = useState('');
  const [schemeValue, setSchemeValue] = useState('');
  const [categoryValue, setCategoryValue] = useState('');
  const [showBookmarks, setShowBookmarks] = useState(true);
  const [radioView, setRadioView] = useState('table');

  // ── Forms 4 Paradigms Showcase States ──
  const [spotlightQuery, setSpotlightQuery] = useState(
    'HDFC Fixed Deposit Portfolio'
  );
  const [slugRoute, setSlugRoute] = useState('portfolio/fy-2026-wealth');
  const [floatingName, setFloatingName] = useState('Urva Gandhi');
  const [floatingEmail, setFloatingEmail] = useState('urva@cointrack.in');
  const [floatingCategory, setFloatingCategory] = useState('Tax Saving (80C)');
  const [floatingNotes, setFloatingNotes] = useState(
    'Maturity planned for Q4 2027.'
  );
  const [currencyAmount, setCurrencyAmount] = useState('75000');
  const [activeCurrency, setActiveCurrency] = useState('INR');
  const [passwordValue, setPasswordValue] = useState('SuperSecret@2026');
  const [tags, setTags] = useState(['Tax-Saving', 'Long-Term', 'High-Yield']);

  // ── Dynamic Add / Edit Modal Showcase States ──
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [activeAddKey, setActiveAddKey] = useState('fd');
  const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit'
  const [isAddSaving, setIsAddSaving] = useState(false);

  // Pre-populated mock edit datasets for each module
  const MOCK_EDIT_DATA = useMemo(
    () => ({
      fd: {
        holder: 'Urva Gandhi',
        bank: 'HDFC Bank',
        scheme: 'HDFC Tax Saver Fixed Deposit (5 Year)',
        amount: '500000',
      },
      sip: {
        holder: 'Urva Gandhi',
        scheme: 'Parag Parikh Flexi Cap Fund - Direct (Growth)',
        amount: '15000',
        sipDay: '10th of every month',
      },
      lumpsum: {
        holder: 'Urva Gandhi',
        scheme: 'Mirae Asset Large Cap Fund - Direct Plan',
        amount: '100000',
        folio: 'FOLIO-998124',
      },
      gold: {
        holder: 'Urva Gandhi',
        metal: '24K Fine Gold (99.9%)',
        weight: '18.50 g',
        amount: '162400',
      },
      ppf: {
        holder: 'Urva Gandhi',
        bank: 'State Bank of India (SBI)',
        amount: '150000',
      },
      epf: {
        holder: 'Urva Gandhi',
        employer: 'Acme Pvt Ltd',
        amount: '12600',
      },
    }),
    []
  );

  // Form Field States
  const [addHolder, setAddHolder] = useState('Urva Gandhi');
  const [addBank, setAddBank] = useState('HDFC Bank');
  const [addScheme, setAddScheme] = useState(
    'Parag Parikh Flexi Cap Fund - Direct'
  );
  const [addAmount, setAddAmount] = useState('500000');
  const [addMetal, setAddMetal] = useState('24K Fine Gold (99.9%)');
  const [addWeight, setAddWeight] = useState('18.50 g');
  const [addEmployer, setAddEmployer] = useState('Acme Pvt Ltd');
  const [addSipDay, setAddSipDay] = useState('10th of every month');
  const [addFolio, setAddFolio] = useState('FOLIO-998124');

  const openAddModule = (key, mode = 'add') => {
    setActiveAddKey(key);
    setModalMode(mode);
    const mod = ADD_MODULES.find(m => m.key === key) || ADD_MODULES[0];

    if (mode === 'edit') {
      const mock = MOCK_EDIT_DATA[key] || {};
      setAddHolder(mock.holder || 'Urva Gandhi');
      setAddAmount(mock.amount || mod.defaultAmount);
      if (mock.bank) setAddBank(mock.bank);
      if (mock.scheme) setAddScheme(mock.scheme);
      if (mock.metal) setAddMetal(mock.metal);
      if (mock.weight) setAddWeight(mock.weight);
      if (mock.employer) setAddEmployer(mock.employer);
      if (mock.sipDay) setAddSipDay(mock.sipDay);
      if (mock.folio) setAddFolio(mock.folio);
    } else {
      setAddAmount(mod.defaultAmount);
    }
    setAddModalOpen(true);
  };

  const handleSaveAddRecord = e => {
    e?.preventDefault();
    setIsAddSaving(true);
    setTimeout(() => {
      const mod =
        ADD_MODULES.find(m => m.key === activeAddKey) || ADD_MODULES[0];
      const actionText = modalMode === 'edit' ? 'Updated' : 'Recorded';
      toast({
        title: `${mod.name} ${modalMode === 'edit' ? 'Updated' : 'Saved'} Successfully`,
        description: `${actionText} ₹${Number(addAmount || 0).toLocaleString('en-IN')} for ${addHolder}.`,
        variant: 'success',
      });
      setIsAddSaving(false);
      setAddModalOpen(false);
    }, 900);
  };

  const currentAddMod = useMemo(() => {
    const base =
      ADD_MODULES.find(m => m.key === activeAddKey) || ADD_MODULES[0];
    if (modalMode === 'edit') {
      return {
        ...base,
        title: `Edit ${base.name} Record`,
        description: `Modify existing holdings, amounts, and metadata for ${base.name}.`,
        saveLabel: `Update ${base.name}`,
      };
    }
    return base;
  }, [activeAddKey, modalMode]);

  const openModule = module =>
    setDialog({ open: true, module, loading: false });

  const runConfirm = () => {
    setDialog(d => ({ ...d, loading: true }));
    setTimeout(() => {
      toast({
        title: `${dialog.module.name} deleted`,
        description: 'Sample: the mutation would run here.',
        variant: 'success',
      });
      setDialog(d => ({ ...d, open: false, loading: false }));
    }, 1100);
  };

  const activeModule = useMemo(
    () => dialog.module ?? MODULES[0],
    [dialog.module]
  );

  return (
    <TooltipProvider>
      <main className='w-full min-h-screen bg-[#e8f1fb] text-neutral-900 selection:bg-neutral-900 selection:text-white font-sans relative overflow-x-hidden'>
        {/* Pinned cloudy sky background layer for Cirrus UI ambiance */}
        <CoinTrackSkyBackground />

        {/* Floating transparent navbar */}
        <CoinTrackNavbar />

        <div className='relative z-10 max-w-screen-2xl mx-auto w-full px-4 md:px-10 lg:px-14 pt-28 sm:pt-36 md:pt-40 pb-8 md:pb-12 space-y-12'>
          {/* Masthead */}
          <header className='relative pb-6 border-b border-border/50'>
            <div className='flex items-center justify-between gap-4 mb-5'>
              <div className='flex items-center gap-3'>
                <span className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 font-mono text-[11px] font-semibold tracking-wider'>
                  INTERFACE LAB
                </span>
                <span className='font-mono text-[11px] uppercase tracking-[0.16em] text-neutral-500 dark:text-neutral-400'>
                  UI Component Library · Cirrus
                </span>
              </div>
              <span className='text-[11px] font-mono uppercase tracking-[0.16em] text-neutral-500 dark:text-neutral-400'>
                Design Tokens Active
              </span>
            </div>
            <div className='flex flex-col md:flex-row md:items-end md:justify-between gap-3'>
              <h1 className='font-display font-extrabold text-4xl sm:text-5xl lg:text-6xl text-neutral-950 dark:text-white tracking-tight leading-[1.08]'>
                Design{' '}
                <span className='text-blue-600 dark:text-blue-400'>Lab</span>
              </h1>
              <p className='font-sans text-sm text-neutral-700/90 dark:text-neutral-400 max-w-sm md:text-right leading-relaxed font-normal'>
                Showcasing the complete, unified coinTrack Cirrus UI component
                system.
              </p>
            </div>
          </header>

          <Tabs defaultValue='buttons' className='w-full'>
            <TabsList className='mb-8 flex flex-wrap h-auto gap-1 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-border/50 p-1.5 rounded-2xl shadow-sm'>
              <TabsTrigger value='buttons'>Actions & Navigation</TabsTrigger>
              <TabsTrigger value='forms'>Forms & Inputs</TabsTrigger>
              <TabsTrigger value='search'>Search & Menus</TabsTrigger>
              <TabsTrigger value='overlays'>Dialogs & Overlays</TabsTrigger>
              <TabsTrigger value='display'>Data Display</TabsTrigger>
              <TabsTrigger value='feedback'>Feedback & Status</TabsTrigger>
              <TabsTrigger value='auth'>Auth Screens</TabsTrigger>
            </TabsList>

            {/* ══════════════════════════════════════════════════════════════════════
              TAB 1: ACTIONS & NAVIGATION
             ══════════════════════════════════════════════════════════════════════ */}
            <TabsContent
              value='buttons'
              className='space-y-10 animate-in fade-in-50 duration-500 fill-mode-both'
            >
              {/* Button Variants */}
              <section className='space-y-4'>
                <div>
                  <h2 className='font-display text-xl font-bold tracking-tight text-neutral-950 dark:text-white'>
                    Mac / Apple Button Hierarchy
                  </h2>
                  <p className='text-sm text-muted-foreground'>
                    Frosted glass surfaces, tactile active states, and semantic
                    status variants matching Badges
                  </p>
                </div>

                <div className='p-8 rounded-[20px] bg-white/85 dark:bg-zinc-900/85 backdrop-blur-xl border border-border/50 shadow-sm space-y-8'>
                  {/* Standard Variants */}
                  <div>
                    <h3 className='font-sans text-[11px] font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-3'>
                      Core Variants
                    </h3>
                    <div className='flex flex-wrap items-center gap-3'>
                      <Button variant='default'>Primary Black</Button>
                      <Button variant='secondary'>Frosted Secondary</Button>
                      <Button variant='outline'>Glass Outline</Button>
                      <Button variant='ghost'>Subtle Ghost</Button>
                      <Button variant='link'>Apple Link</Button>
                    </div>
                  </div>

                  <Separator />

                  {/* Semantic Status Variants (Matching Badges) */}
                  <div>
                    <h3 className='font-sans text-[11px] font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-3'>
                      Status Variants (Animated Icons)
                    </h3>
                    <div className='flex flex-wrap items-center gap-3'>
                      <Button variant='success'>
                        <AnimatedSuccessIcon className='h-3.5 w-3.5 mr-1.5' />{' '}
                        Success / Gain
                      </Button>
                      <Button variant='warning'>
                        <AnimatedWarningIcon className='h-3.5 w-3.5 mr-1.5' />{' '}
                        Warning / Accent
                      </Button>
                      <Button variant='destructive'>
                        <AnimatedTrashIcon className='h-3.5 w-3.5 mr-1.5' />{' '}
                        Destructive / Loss
                      </Button>
                      <Button variant='info'>
                        <AnimatedInfoIcon className='h-3.5 w-3.5 mr-1.5' /> Info
                        / Notice
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  {/* Sizes */}
                  <div>
                    <h3 className='font-sans text-[11px] font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-3'>
                      Button Scales & Squircles
                    </h3>
                    <div className='flex flex-wrap items-center gap-3'>
                      <Button size='xs' variant='secondary'>
                        XS (26px)
                      </Button>
                      <Button size='sm' variant='secondary'>
                        SM (32px)
                      </Button>
                      <Button size='default' variant='secondary'>
                        <AnimatedSparklesIcon className='h-3.5 w-3.5 mr-1.5' />{' '}
                        Default (36px)
                      </Button>
                      <Button size='lg' variant='secondary'>
                        LG (40px)
                      </Button>
                      <Button size='xl' variant='default'>
                        XL Hero (44px)
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  {/* Icons & Action Groups */}
                  <div>
                    <h3 className='font-sans text-[11px] font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-3'>
                      Icon Buttons & Tooltips
                    </h3>
                    <div className='flex flex-wrap items-center gap-3'>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size='icon-sm'
                            variant='secondary'
                            aria-label='Add Transaction'
                          >
                            <AnimatedPlusIcon className='h-3.5 w-3.5' />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Add new transaction</p>
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size='icon'
                            variant='outline'
                            aria-label='Preferences'
                          >
                            <AnimatedSettingsIcon className='h-4 w-4' />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Preferences & Settings</p>
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size='icon'
                            variant='secondary'
                            aria-label='Notifications'
                          >
                            <AnimatedBellIcon className='h-4 w-4' />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>View 3 new notifications</p>
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant='outline' size='sm'>
                            <AnimatedDownloadIcon className='h-3.5 w-3.5 mr-1.5' />{' '}
                            Export Data
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Export all transactions to CSV</p>
                        </TooltipContent>
                      </Tooltip>

                      <Button size='sm' disabled variant='secondary'>
                        Disabled State
                      </Button>
                    </div>
                  </div>
                </div>
              </section>
            </TabsContent>

            {/* ══════════════════════════════════════════════════════════════════════
              TAB 2: FORMS & INPUTS
             ══════════════════════════════════════════════════════════════════════ */}
            <TabsContent
              value='forms'
              className='space-y-12 animate-in fade-in-50 duration-500 fill-mode-both'
            >
              {/* Header / Intro */}
              <div className='flex flex-col md:flex-row md:items-end md:justify-between gap-4'>
                <div>
                  <h2 className='font-display text-2xl font-bold tracking-tight text-neutral-950 dark:text-white'>
                    Form Controls & Smart Inputs
                  </h2>
                  <p className='text-sm text-muted-foreground mt-1'>
                    Ultra-modern form architectures: Apple macOS inset cards,
                    Fintech amount steppers, and smart security fields.
                  </p>
                </div>
                <Badge
                  variant='outline'
                  className='w-fit text-xs font-mono uppercase tracking-wider py-1 px-3'
                >
                  macOS & Fintech Inputs
                </Badge>
              </div>

              {/* ─────────────────────────────────────────────────────────────
                PARADIGM 1: APPLE macOS INSET FORM CARD (MORPHING LABELS)
               ───────────────────────────────────────────────────────────── */}
              <section className='space-y-4'>
                <div className='flex items-center gap-2.5'>
                  <span className='flex size-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 font-mono text-xs font-bold'>
                    1
                  </span>
                  <div>
                    <h3 className='text-base font-semibold tracking-tight'>
                      Apple macOS Inset Form Card (Morphing Floating Labels)
                    </h3>
                    <p className='text-xs text-muted-foreground'>
                      Continuous segmented card container with morphing caption
                      labels and live real-time inline validation
                    </p>
                  </div>
                </div>

                <div className='p-4 sm:p-6 md:p-8 rounded-[24px] bg-muted/20 dark:bg-zinc-950/40 backdrop-blur-2xl border border-border/50 shadow-sm'>
                  <InsetFormCard>
                    <InsetFormRow
                      label='Account / Holder Name'
                      icon={User}
                      hint='Click to edit'
                    >
                      <InsetTextInput
                        value={floatingName}
                        onChange={e => setFloatingName(e.target.value)}
                        placeholder='e.g. Urva Gandhi'
                      />
                    </InsetFormRow>
                    <InsetFormRow
                      label='Verified Tax Email'
                      icon={Mail}
                      status={<EmailValidationBadge value={floatingEmail} />}
                    >
                      <InsetEmailInput
                        value={floatingEmail}
                        onChange={e => setFloatingEmail(e.target.value)}
                        placeholder='name@domain.com'
                      />
                    </InsetFormRow>
                    <InsetDropdownRow
                      label='Tax Exemption Category'
                      icon={Tag}
                      value={floatingCategory}
                      onChange={setFloatingCategory}
                      options={[
                        'Tax Saving (80C)',
                        'NPS (80CCD)',
                        'Health Insurance (80D)',
                        'Standard Capital Gain',
                        'Home Loan Interest (24B)',
                      ]}
                    />
                    <InsetTextareaRow
                      label='Filing Remarks & Notes'
                      icon={FileText}
                      value={floatingNotes}
                      onChange={e => setFloatingNotes(e.target.value)}
                      placeholder='Add detailed transaction remarks, tax exemptions, or audit notes...'
                      maxLength={500}
                    />
                  </InsetFormCard>
                </div>
              </section>

              <Separator />

              {/* ─────────────────────────────────────────────────────────────
                PARADIGM 2: FINTECH QUICK-ACTION CURRENCY & STEPPER (STRIPE)
               ───────────────────────────────────────────────────────────── */}
              <section className='space-y-4'>
                <div className='flex items-center gap-2.5'>
                  <span className='flex size-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 font-mono text-xs font-bold'>
                    2
                  </span>
                  <div>
                    <h3 className='text-base font-semibold tracking-tight'>
                      Fintech Quick-Action Currency & Stepper (Stripe / Apple
                      Pay)
                    </h3>
                    <p className='text-xs text-muted-foreground'>
                      High-contrast tabular amount hero with rapid quick-add
                      increments and live Indian word denominations
                    </p>
                  </div>
                </div>

                <div className='p-4 sm:p-6 md:p-8 rounded-[24px] bg-muted/20 dark:bg-zinc-950/40 backdrop-blur-2xl border border-border/50 shadow-sm space-y-6'>
                  <CurrencyStepper
                    amount={currencyAmount}
                    onAmountChange={setCurrencyAmount}
                    activeCurrency={activeCurrency}
                    onCurrencyChange={setActiveCurrency}
                  />
                </div>
              </section>

              <Separator />

              {/* ─────────────────────────────────────────────────────────────
                PARADIGM 3: SMART ACTION & SECURITY INPUTS
               ───────────────────────────────────────────────────────────── */}
              <section className='space-y-4'>
                <div className='flex items-center gap-2.5'>
                  <span className='flex size-7 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 font-mono text-xs font-bold'>
                    3
                  </span>
                  <div>
                    <h3 className='text-base font-semibold tracking-tight'>
                      Smart Utility Inputs
                    </h3>
                    <p className='text-xs text-muted-foreground'>
                      One-click copyable UPI keys and tokenized multi-tag inputs
                    </p>
                  </div>
                </div>

                <div className='p-4 sm:p-6 md:p-8 rounded-[24px] bg-muted/20 dark:bg-zinc-950/40 backdrop-blur-2xl border border-border/50 shadow-sm'>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8'>
                    <CopyableKey value='urvagandhi.financial@hdfcbank' />
                    <TagInput tags={tags} onChange={setTags} />
                  </div>
                </div>
              </section>
            </TabsContent>

            {/* ══════════════════════════════════════════════════════════════════════
              TAB 3: SEARCH & MENUS
             ══════════════════════════════════════════════════════════════════════ */}
            <TabsContent
              value='search'
              className='space-y-12 animate-in fade-in-50 duration-500 fill-mode-both'
            >
              {/* Header / Intro */}
              <div className='flex flex-col md:flex-row md:items-end md:justify-between gap-4'>
                <div>
                  <h2 className='font-display text-2xl font-bold tracking-tight text-neutral-950 dark:text-white'>
                    Search, Spotlight & Menus
                  </h2>
                  <p className='text-sm text-muted-foreground mt-1'>
                    Spotlight glass search bars, hierarchical comboboxes, pill
                    filters, and rich nested menus.
                  </p>
                </div>
                <Badge
                  variant='outline'
                  className='w-fit text-xs font-mono uppercase tracking-wider py-1 px-3'
                >
                  Spotlight & Comboboxes
                </Badge>
              </div>

              {/* ─────────────────────────────────────────────────────────────
                SECTION 1: RAYCAST & LINEAR SPOTLIGHT GLASS SEARCH
               ───────────────────────────────────────────────────────────── */}
              <section className='space-y-4'>
                <div className='flex items-center gap-2.5'>
                  <span className='flex size-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 font-mono text-xs font-bold'>
                    1
                  </span>
                  <div>
                    <h3 className='text-base font-semibold tracking-tight'>
                      Raycast & Linear Spotlight Glass Inputs
                    </h3>
                    <p className='text-xs text-muted-foreground'>
                      Dual-layer frosted backdrop, inner specular reflection,
                      auto-clearing button, and keyboard accelerators
                    </p>
                  </div>
                </div>

                <div className='relative z-20 p-4 sm:p-6 md:p-8 rounded-[24px] bg-muted/20 dark:bg-zinc-950/40 backdrop-blur-2xl border border-border/50 shadow-sm space-y-6'>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    <div className='space-y-2 relative z-30'>
                      <div className='flex items-center justify-between'>
                        <Label className='font-sans text-[11px] font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400'>
                          Spotlight Search & Filter Bar
                        </Label>
                        <span className='text-[11px] font-mono text-muted-foreground'>
                          Interactive
                        </span>
                      </div>
                      <SpotlightInput
                        value={spotlightQuery}
                        onChange={e => setSpotlightQuery(e.target.value)}
                        placeholder='Search bank, FD, holding, or action...'
                        icon={<AnimatedSparklesIcon className='size-4' />}
                        accelerator='K'
                      />
                    </div>

                    <div className='space-y-2 relative z-10'>
                      <div className='flex items-center justify-between'>
                        <Label className='font-sans text-[11px] font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400'>
                          Command Deep-Link & Route Bar
                        </Label>
                        <span className='text-[11px] font-mono text-muted-foreground'>
                          URL Slug
                        </span>
                      </div>
                      <SlugInput
                        value={slugRoute}
                        onChange={e => setSlugRoute(e.target.value)}
                        placeholder='path/to/portfolio'
                        accelerator='Return'
                        description='Creates a secure, shareable live ledger view link.'
                      />
                    </div>
                  </div>
                </div>
              </section>

              <Separator />

              {/* ─────────────────────────────────────────────────────────────
                SECTION 2: COMBOBOXES & FILTER MENUS
               ───────────────────────────────────────────────────────────── */}
              <section className='space-y-4'>
                <div className='flex items-center gap-2.5'>
                  <span className='flex size-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-xs font-bold'>
                    2
                  </span>
                  <div>
                    <h3 className='text-base font-semibold tracking-tight'>
                      Search Comboboxes & Filter Menus
                    </h3>
                    <p className='text-sm text-muted-foreground'>
                      Custom search pickers, nested category menus, and popovers
                    </p>
                  </div>
                </div>

                <div className='relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 p-8 rounded-[20px] bg-white/85 dark:bg-zinc-900/85 backdrop-blur-xl border border-border/50 shadow-sm'>
                  {/* Bank Combobox */}
                  <div className='space-y-3'>
                    <h3 className='font-sans text-[11px] font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400'>
                      Bank Search Combobox
                    </h3>
                    <BankSearchCombobox
                      value={bankValue}
                      onChange={setBankValue}
                      onSelectBank={b => setBankValue(b?.name || '')}
                    />
                  </div>

                  {/* Scheme Combobox */}
                  <div className='space-y-3'>
                    <h3 className='font-sans text-[11px] font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400'>
                      Scheme Search Combobox
                    </h3>
                    <SchemeSearchCombobox
                      value={schemeValue}
                      onChange={setSchemeValue}
                      onSelectScheme={s => setSchemeValue(s?.name || '')}
                    />
                  </div>

                  {/* Category Dropdown */}
                  <div className='space-y-3'>
                    <h3 className='font-sans text-[11px] font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400'>
                      Category Dropdown (Hierarchical)
                    </h3>
                    <CategoryDropdown
                      value={categoryValue}
                      onChange={setCategoryValue}
                    />
                  </div>

                  {/* Filter Dropdown Pill */}
                  <div className='space-y-3'>
                    <h3 className='font-sans text-[11px] font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400'>
                      Filter Dropdown (Pill Style)
                    </h3>
                    <FilterDropdown
                      label='Status'
                      value={filterValue}
                      options={[
                        { label: 'Active', value: 'active' },
                        { label: 'Pending', value: 'pending' },
                        { label: 'Matured', value: 'matured' },
                        { label: 'Closed', value: 'closed' },
                      ]}
                      onChange={setFilterValue}
                    />
                  </div>

                  {/* Popover */}
                  <div className='space-y-3'>
                    <h3 className='font-sans text-[11px] font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400'>
                      Popover Card
                    </h3>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant='outline'
                          className='w-full justify-between'
                        >
                          <span>View Tax Breakdown</span>
                          <SlidersHorizontal className='h-4 w-4 opacity-50' />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className='w-80'>
                        <PopoverHeader>
                          <PopoverTitle>
                            Tax Deducted at Source (TDS)
                          </PopoverTitle>
                        </PopoverHeader>
                        <div className='space-y-2 text-xs'>
                          <div className='flex justify-between py-1 border-b border-border/40'>
                            <span className='text-muted-foreground'>
                              Threshold
                            </span>
                            <span className='font-mono'>₹40,000 / yr</span>
                          </div>
                          <div className='flex justify-between py-1 border-b border-border/40'>
                            <span className='text-muted-foreground'>
                              Standard Rate
                            </span>
                            <span className='font-mono font-medium'>10.0%</span>
                          </div>
                          <div className='flex justify-between py-1'>
                            <span className='text-muted-foreground'>
                              Applicable Section
                            </span>
                            <span className='font-mono'>194A</span>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Advanced Dropdown Menu with Submenus */}
                  <div className='space-y-3'>
                    <h3 className='font-sans text-[11px] font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400'>
                      Dropdown Menu (Submenus & Checkboxes)
                    </h3>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant='outline'
                          className='w-full justify-between'
                        >
                          <span>Menu Options</span>
                          <ChevronRight className='h-4 w-4 opacity-50 rotate-90' />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className='w-56'>
                        <DropdownMenuLabel>View Preferences</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuCheckboxItem
                          checked={showBookmarks}
                          onCheckedChange={setShowBookmarks}
                        >
                          Show Pinned Assets
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger>
                            <span>Layout Mode</span>
                          </DropdownMenuSubTrigger>
                          <DropdownMenuSubContent>
                            <DropdownMenuRadioGroup
                              value={radioView}
                              onValueChange={setRadioView}
                            >
                              <DropdownMenuRadioItem value='table'>
                                Table View
                              </DropdownMenuRadioItem>
                              <DropdownMenuRadioItem value='cards'>
                                Card Grid
                              </DropdownMenuRadioItem>
                              <DropdownMenuRadioItem value='compact'>
                                Compact List
                              </DropdownMenuRadioItem>
                            </DropdownMenuRadioGroup>
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className='text-destructive focus:text-destructive'>
                          Reset Filters
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </section>
            </TabsContent>

            {/* ══════════════════════════════════════════════════════════════════════
              TAB 4: DIALOGS & OVERLAYS
             ══════════════════════════════════════════════════════════════════════ */}
            <TabsContent
              value='overlays'
              className='space-y-12 animate-in fade-in-50 duration-500 fill-mode-both'
            >
              {/* Confirm Dialog Showcase */}
              <section className='space-y-4'>
                <div className='flex flex-col gap-3 md:flex-row md:items-end md:justify-between'>
                  <div>
                    <h2 className='font-display text-xl font-bold tracking-tight text-neutral-950 dark:text-white'>
                      Confirm Dialogs
                    </h2>
                    <p className='mt-1 text-[12px] text-muted-foreground'>
                      Select a module to test dynamic data injection in the
                      custom confirm dialog.
                    </p>
                  </div>
                </div>

                <div className='flex flex-wrap gap-2'>
                  {MODULES.map(m => {
                    const Icon = m.Icon;
                    const active = dialog.open && activeModule.key === m.key;
                    return (
                      <button
                        key={m.key}
                        type='button'
                        onClick={() => openModule(m)}
                        className={`group inline-flex items-center gap-2 border px-3 py-2 text-[12px] font-medium rounded-xl transition-colors ${
                          active
                            ? 'border-foreground/40 bg-foreground/10 text-foreground font-semibold'
                            : 'border-border/40 bg-card hover:bg-muted/50'
                        }`}
                      >
                        <Icon
                          className='h-3.5 w-3.5 opacity-70 group-hover:opacity-100'
                          strokeWidth={1.75}
                        />
                        {m.name}
                      </button>
                    );
                  })}
                </div>

                {/* Standard Modal & Sheet Triggers */}
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6 pt-6'>
                  <div className='p-6 rounded-[20px] bg-white/85 dark:bg-zinc-900/85 backdrop-blur-xl border border-border/50 shadow-sm space-y-4'>
                    <div className='flex items-center justify-between'>
                      <div>
                        <h3 className='font-sans text-[11px] font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400'>
                          Dynamic Asset Modals (Add & Edit)
                        </h3>
                        <p className='text-xs text-muted-foreground mt-0.5'>
                          Centered form dialogs for FD, SIP, Lumpsum, Gold, PPF
                          & EPF with pre-populated edit modes.
                        </p>
                      </div>
                    </div>

                    {/* Asset Module Selector Buttons */}
                    <div className='space-y-3 pt-1'>
                      {/* Add Mode Switcher */}
                      <div className='space-y-1.5'>
                        <span className='font-sans text-[11px] font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 block text-[11px] text-muted-foreground'>
                          Add New Record
                        </span>
                        <div className='flex flex-wrap gap-2'>
                          {ADD_MODULES.map(m => {
                            const Icon = m.Icon;
                            const active =
                              addModalOpen &&
                              activeAddKey === m.key &&
                              modalMode === 'add';
                            return (
                              <button
                                key={`add-${m.key}`}
                                type='button'
                                onClick={() => openAddModule(m.key, 'add')}
                                className={`group inline-flex items-center gap-2 border px-3 py-2 text-[12px] font-medium rounded-xl transition-all cursor-pointer ${
                                  active
                                    ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold shadow-xs'
                                    : 'border-border/40 bg-card hover:bg-muted/50 text-foreground'
                                }`}
                              >
                                <Icon
                                  className='h-3.5 w-3.5 opacity-70 group-hover:opacity-100 text-emerald-500'
                                  strokeWidth={1.75}
                                />
                                <span>{m.name}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Edit Mode Switcher */}
                      <div className='space-y-1.5 pt-1'>
                        <span className='font-sans text-[11px] font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 block text-[11px] text-muted-foreground'>
                          Edit Existing Record (Pre-filled)
                        </span>
                        <div className='flex flex-wrap gap-2'>
                          {ADD_MODULES.map(m => {
                            const Icon = m.Icon;
                            const active =
                              addModalOpen &&
                              activeAddKey === m.key &&
                              modalMode === 'edit';
                            return (
                              <button
                                key={`edit-${m.key}`}
                                type='button'
                                onClick={() => openAddModule(m.key, 'edit')}
                                className={`group inline-flex items-center gap-2 border px-3 py-2 text-[12px] font-medium rounded-xl transition-all cursor-pointer ${
                                  active
                                    ? 'border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold shadow-xs'
                                    : 'border-border/40 bg-card hover:bg-muted/50 text-foreground'
                                }`}
                              >
                                <Icon
                                  className='h-3.5 w-3.5 opacity-70 group-hover:opacity-100 text-amber-500'
                                  strokeWidth={1.75}
                                />
                                <span>Edit {m.name}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
                      <DialogTrigger asChild>
                        <Button
                          variant='outline'
                          className='w-full justify-between mt-2'
                        >
                          <span className='flex items-center gap-2'>
                            <currentAddMod.Icon
                              className={`size-4 ${modalMode === 'edit' ? 'text-amber-500' : 'text-emerald-500'}`}
                            />
                            Open {modalMode === 'edit' ? 'Edit' : 'Add'}{' '}
                            {currentAddMod.name} Form
                          </span>
                          <ChevronRight className='size-4 opacity-50' />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className='sm:max-w-lg rounded-[24px] p-0 bg-popover/90 backdrop-blur-2xl border border-border/70 shadow-2xl overflow-visible'>
                        <form
                          onSubmit={handleSaveAddRecord}
                          className='relative flex flex-col'
                        >
                          {/* Top Gradient Wash matching ConfirmDialog */}
                          <div
                            className={`pointer-events-none absolute inset-x-0 top-0 h-44 opacity-80 rounded-t-[24px] ${
                              modalMode === 'edit'
                                ? 'bg-gradient-to-b from-amber-500/15 to-transparent'
                                : 'bg-gradient-to-b from-emerald-500/15 to-transparent'
                            }`}
                          />

                          {/* Dialog Header */}
                          <div className='relative z-10 px-6 pt-6 pb-2'>
                            <div className='flex items-center gap-3.5 mb-1'>
                              <div
                                className={`flex size-11 items-center justify-center rounded-2xl shrink-0 ${
                                  modalMode === 'edit'
                                    ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                                    : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                }`}
                              >
                                <currentAddMod.Icon
                                  className='size-5'
                                  strokeWidth={1.75}
                                />
                              </div>
                              <div>
                                <DialogTitle className='text-lg font-bold tracking-tight text-foreground'>
                                  {currentAddMod.title}
                                </DialogTitle>
                                <DialogDescription className='text-xs text-muted-foreground mt-0.5'>
                                  {currentAddMod.description}
                                </DialogDescription>
                              </div>
                            </div>
                          </div>

                          {/* Form Fields Body */}
                          <div className='relative z-10 p-6 pt-2 space-y-4'>
                            {/* Segmented Inset Form Card (Clean vertical stack) */}
                            <InsetFormCard className='bg-muted/30 border border-border/50'>
                              <InsetFormRow label='Account Holder' icon={User}>
                                <InsetTextInput
                                  value={addHolder}
                                  onChange={e => setAddHolder(e.target.value)}
                                  placeholder='e.g. Urva Gandhi'
                                />
                              </InsetFormRow>

                              {/* Bank search (FD & PPF) */}
                              {(activeAddKey === 'fd' ||
                                activeAddKey === 'ppf') && (
                                <InsetFormRow
                                  label='Bank / Issuing Institution'
                                  icon={Building2}
                                >
                                  <BankSearchCombobox
                                    value={addBank}
                                    onChange={setAddBank}
                                    onSelectBank={b =>
                                      setAddBank(b?.name || '')
                                    }
                                  />
                                </InsetFormRow>
                              )}

                              {/* Scheme search (FD, SIP & Lumpsum) */}
                              {(activeAddKey === 'fd' ||
                                activeAddKey === 'sip' ||
                                activeAddKey === 'lumpsum') && (
                                <InsetFormRow
                                  label='Scheme / Fund Product'
                                  icon={Tag}
                                >
                                  <SchemeSearchCombobox
                                    value={addScheme}
                                    onChange={setAddScheme}
                                    onSelectScheme={s =>
                                      setAddScheme(s?.name || '')
                                    }
                                  />
                                </InsetFormRow>
                              )}

                              {/* Gold & Silver metals */}
                              {activeAddKey === 'gold' && (
                                <>
                                  <InsetDropdownRow
                                    label='Precious Metal & Purity'
                                    icon={Coins}
                                    value={addMetal}
                                    onChange={setAddMetal}
                                    options={[
                                      '24K Fine Gold (99.9%)',
                                      '22K Standard Gold (91.6%)',
                                      'Digital Gold (Augmont/MMTC)',
                                      'Silver Bullion (99.9%)',
                                    ]}
                                  />
                                  <InsetFormRow
                                    label='Quantity / Weight (Grams)'
                                    icon={Tag}
                                  >
                                    <InsetTextInput
                                      value={addWeight}
                                      onChange={e =>
                                        setAddWeight(e.target.value)
                                      }
                                      placeholder='e.g. 18.50 g'
                                    />
                                  </InsetFormRow>
                                </>
                              )}

                              {/* EPF Employer */}
                              {activeAddKey === 'epf' && (
                                <InsetFormRow
                                  label='Employer Name'
                                  icon={Building2}
                                >
                                  <InsetTextInput
                                    value={addEmployer}
                                    onChange={e =>
                                      setAddEmployer(e.target.value)
                                    }
                                    placeholder='e.g. Acme Pvt Ltd'
                                  />
                                </InsetFormRow>
                              )}

                              {/* SIP Execution day */}
                              {activeAddKey === 'sip' && (
                                <InsetDropdownRow
                                  label='Monthly Execution Day'
                                  icon={Tag}
                                  value={addSipDay}
                                  onChange={setAddSipDay}
                                  options={[
                                    '1st of every month',
                                    '5th of every month',
                                    '10th of every month',
                                    '15th of every month',
                                    '25th of every month',
                                  ]}
                                />
                              )}

                              {/* Lumpsum Folio */}
                              {activeAddKey === 'lumpsum' && (
                                <InsetFormRow label='Folio Number' icon={Tag}>
                                  <InsetTextInput
                                    value={addFolio}
                                    onChange={e => setAddFolio(e.target.value)}
                                    placeholder='e.g. FOLIO-998124'
                                  />
                                </InsetFormRow>
                              )}
                            </InsetFormCard>

                            {/* Transaction Amount Hero Stepper */}
                            <div className='p-3.5 rounded-2xl bg-muted/20 border border-border/40'>
                              <CurrencyStepper
                                amount={addAmount}
                                onAmountChange={setAddAmount}
                                activeCurrency={activeCurrency}
                                onCurrencyChange={setActiveCurrency}
                              />
                            </div>
                          </div>

                          {/* Action Footer: Seamless Apple-style Split Buttons (Matching ConfirmDialog) */}
                          <div className='relative z-10 flex border-t border-border/50 divide-x divide-border/50'>
                            <button
                              type='button'
                              onClick={() => setAddModalOpen(false)}
                              className='flex-1 h-12 text-[15px] font-normal text-muted-foreground hover:bg-muted/40 transition-colors focus:bg-muted/40 outline-none cursor-pointer'
                            >
                              Cancel
                            </button>
                            <button
                              type='submit'
                              disabled={isAddSaving}
                              className={`flex-1 h-12 flex items-center justify-center gap-2 text-[15px] font-semibold transition-colors focus:bg-muted/40 outline-none cursor-pointer ${
                                modalMode === 'edit'
                                  ? 'text-amber-600 dark:text-amber-400 hover:bg-amber-500/10'
                                  : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10'
                              }`}
                            >
                              {isAddSaving && (
                                <Loader2 className='size-4 animate-spin' />
                              )}
                              {isAddSaving
                                ? 'Saving...'
                                : currentAddMod.saveLabel}
                            </button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>

                  <div className='p-6 rounded-[20px] bg-white/85 dark:bg-zinc-900/85 backdrop-blur-xl border border-border/50 shadow-sm space-y-4'>
                    <h3 className='font-sans text-[11px] font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400'>
                      Slide-over Sheet Drawer
                    </h3>
                    <p className='text-xs text-muted-foreground'>
                      Slide out side drawer for viewing record history.
                    </p>
                    <Sheet>
                      <SheetTrigger asChild>
                        <Button variant='outline'>
                          <PanelRight className='h-4 w-4 mr-2' /> Open Side
                          Drawer
                        </Button>
                      </SheetTrigger>
                      <SheetContent
                        side='right'
                        className='p-0 overflow-hidden flex flex-col'
                      >
                        {/* Top Gradient Wash */}
                        <div className='pointer-events-none absolute inset-x-0 top-0 h-40 opacity-70 bg-gradient-to-b from-blue-500/15 to-transparent' />

                        <SheetHeader className='relative z-10 px-6 pt-6 pb-2'>
                          <SheetTitle className='text-lg font-bold tracking-tight text-foreground flex items-center gap-2'>
                            <PanelRight className='size-5 text-blue-500' />
                            <span>Transaction Audit Log</span>
                          </SheetTitle>
                          <SheetDescription className='text-xs text-muted-foreground'>
                            Historical ledger entries and payroll credits for
                            EPF account.
                          </SheetDescription>
                        </SheetHeader>

                        <div className='relative z-10 flex-1 px-6 py-4 space-y-3 overflow-y-auto'>
                          <span className='font-sans text-[11px] font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 block text-[10px] text-muted-foreground uppercase tracking-wider mb-2'>
                            Recent Contributions
                          </span>

                          <div className='p-3.5 rounded-2xl bg-card/70 border border-border/50 shadow-xs space-y-1.5 transition-all hover:bg-card'>
                            <div className='flex justify-between items-center text-xs font-semibold'>
                              <span className='text-foreground'>
                                Acme Pvt Ltd Contribution
                              </span>
                              <span className='font-mono text-emerald-600 dark:text-emerald-400 font-bold'>
                                +₹6,300
                              </span>
                            </div>
                            <div className='flex justify-between items-center text-[11px] text-muted-foreground'>
                              <span>EPF · May 2026 Salary</span>
                              <span className='font-mono'>15 May 2026</span>
                            </div>
                          </div>

                          <div className='p-3.5 rounded-2xl bg-card/70 border border-border/50 shadow-xs space-y-1.5 transition-all hover:bg-card'>
                            <div className='flex justify-between items-center text-xs font-semibold'>
                              <span className='text-foreground'>
                                Acme Pvt Ltd Contribution
                              </span>
                              <span className='font-mono text-emerald-600 dark:text-emerald-400 font-bold'>
                                +₹6,300
                              </span>
                            </div>
                            <div className='flex justify-between items-center text-[11px] text-muted-foreground'>
                              <span>EPF · Apr 2026 Salary</span>
                              <span className='font-mono'>15 Apr 2026</span>
                            </div>
                          </div>

                          <div className='p-3.5 rounded-2xl bg-card/70 border border-border/50 shadow-xs space-y-1.5 transition-all hover:bg-card opacity-80'>
                            <div className='flex justify-between items-center text-xs font-semibold'>
                              <span className='text-foreground'>
                                Acme Pvt Ltd Contribution
                              </span>
                              <span className='font-mono text-emerald-600 dark:text-emerald-400 font-bold'>
                                +₹6,300
                              </span>
                            </div>
                            <div className='flex justify-between items-center text-[11px] text-muted-foreground'>
                              <span>EPF · Mar 2026 Salary</span>
                              <span className='font-mono'>15 Mar 2026</span>
                            </div>
                          </div>
                        </div>

                        <SheetFooter className='relative z-10 p-0 m-0 border-t border-border/50'>
                          <SheetClose asChild>
                            <button
                              type='button'
                              className='w-full h-12 text-[15px] font-medium text-foreground hover:bg-muted/40 transition-colors focus:bg-muted/40 outline-none cursor-pointer'
                            >
                              Done
                            </button>
                          </SheetClose>
                        </SheetFooter>
                      </SheetContent>
                    </Sheet>
                  </div>
                </div>

                {/* Toast Triggers */}
                <div className='pt-6'>
                  <h3 className='font-sans text-[11px] font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-3'>
                    Toasts & Notification Triggers
                  </h3>
                  <div className='flex flex-wrap gap-3'>
                    <button
                      onClick={() =>
                        toast({
                          title: 'Fixed Deposit Deleted',
                          description:
                            'FD-104 has been completely removed from the ledger.',
                          variant: 'success',
                        })
                      }
                      className='ed-btn ed-btn-gain'
                    >
                      Success Toast
                    </button>
                    <button
                      onClick={() =>
                        toast({
                          title: 'Profile Updated',
                          description:
                            'Your email address has been successfully verified.',
                          variant: 'info',
                        })
                      }
                      className='ed-btn ed-btn-info'
                    >
                      Info Toast
                    </button>
                    <button
                      onClick={() =>
                        toast({
                          title: 'Connection Lost',
                          description:
                            'Broker sync failed. Retrying in 5 seconds...',
                          variant: 'warning',
                        })
                      }
                      className='ed-btn ed-btn-warn'
                    >
                      Warning Toast
                    </button>
                    <button
                      onClick={() =>
                        toast({
                          title: 'Action Failed',
                          description:
                            'Could not delete the transaction. Please try again.',
                          variant: 'destructive',
                        })
                      }
                      className='ed-btn ed-btn-loss'
                    >
                      Error Toast
                    </button>
                  </div>
                </div>
              </section>
            </TabsContent>

            {/* ══════════════════════════════════════════════════════════════════════
              TAB 5: DATA DISPLAY
             ══════════════════════════════════════════════════════════════════════ */}
            <TabsContent
              value='display'
              className='space-y-10 animate-in fade-in-50 duration-500 fill-mode-both'
            >
              {/* Feature Cards */}
              <section className='space-y-4'>
                <div>
                  <h2 className='font-display text-xl font-bold tracking-tight text-neutral-950 dark:text-white'>
                    Cards & Announcement Banners
                  </h2>
                  <p className='text-sm text-muted-foreground'>
                    Rich content cards and spotlight callouts
                  </p>
                </div>

                <div className='flex flex-col md:flex-row gap-6 p-6 rounded-[20px] bg-white/85 dark:bg-zinc-900/85 backdrop-blur-xl border border-border/50 shadow-sm'>
                  <AnnouncementCard variant='light' />
                  <AnnouncementCard variant='dark' />
                </div>
              </section>

              {/* Standard Card */}
              <section className='space-y-4'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  <Card className='rounded-[20px] bg-white/85 dark:bg-zinc-900/85 backdrop-blur-xl border border-border/50 shadow-sm'>
                    <CardHeader>
                      <CardTitle>Fixed Deposit Summary</CardTitle>
                      <CardDescription>
                        Quarterly interest payout overview
                      </CardDescription>
                    </CardHeader>
                    <CardContent className='space-y-3'>
                      <div className='flex justify-between text-sm py-1 border-b border-border/40'>
                        <span className='text-muted-foreground'>
                          Total Invested
                        </span>
                        <span className='font-semibold'>₹15,00,000</span>
                      </div>
                      <div className='flex justify-between text-sm py-1 border-b border-border/40'>
                        <span className='text-muted-foreground'>
                          Weighted Return
                        </span>
                        <span className='font-semibold text-emerald-500'>
                          7.35% p.a.
                        </span>
                      </div>
                      <div className='flex justify-between text-sm py-1'>
                        <span className='text-muted-foreground'>
                          Next Maturity
                        </span>
                        <span className='font-mono'>14 Nov 2026</span>
                      </div>
                    </CardContent>
                    <CardFooter className='flex justify-between'>
                      <Button variant='ghost' size='sm'>
                        Export Report
                      </Button>
                      <Button size='sm'>View Ledger</Button>
                    </CardFooter>
                  </Card>

                  {/* Scroll Area */}
                  <div className='rounded-[20px] bg-white/85 dark:bg-zinc-900/85 backdrop-blur-xl border border-border/50 shadow-sm p-6 space-y-3'>
                    <h3 className='font-sans text-[11px] font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400'>
                      Custom Scroll Area
                    </h3>
                    <ScrollArea className='h-44 w-full rounded-xl border border-border/40 p-4'>
                      <div className='space-y-3 text-xs'>
                        {Array.from({ length: 10 }).map((_, i) => (
                          <div
                            key={i}
                            className='flex justify-between py-1.5 border-b border-border/30 last:border-0'
                          >
                            <span className='font-medium'>
                              Transaction Entry #{1000 + i}
                            </span>
                            <span className='font-mono text-muted-foreground'>
                              ₹{(i + 1) * 2500}
                            </span>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </div>
              </section>

              {/* Table */}
              <section className='space-y-4'>
                <div>
                  <h2 className='font-display text-xl font-bold tracking-tight text-neutral-950 dark:text-white'>
                    Data Table
                  </h2>
                  <p className='text-sm text-muted-foreground'>
                    Dense financial records with status badges
                  </p>
                </div>

                <div className='rounded-[20px] bg-white/85 dark:bg-zinc-900/85 backdrop-blur-xl border border-border/50 shadow-sm overflow-hidden p-2'>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Asset / Scheme</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className='text-right'>Value</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className='font-medium'>
                          HDFC Bank 3-Yr FD
                        </TableCell>
                        <TableCell className='text-muted-foreground text-xs'>
                          Fixed Income
                        </TableCell>
                        <TableCell>
                          <Badge variant='success'>Active</Badge>
                        </TableCell>
                        <TableCell className='text-right font-mono font-medium'>
                          ₹5,00,000
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className='font-medium'>
                          Public Provident Fund
                        </TableCell>
                        <TableCell className='text-muted-foreground text-xs'>
                          Govt Scheme
                        </TableCell>
                        <TableCell>
                          <Badge variant='default'>Verified</Badge>
                        </TableCell>
                        <TableCell className='text-right font-mono font-medium'>
                          ₹1,50,000
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className='font-medium'>
                          24K Gold Sovereign
                        </TableCell>
                        <TableCell className='text-muted-foreground text-xs'>
                          Precious Metal
                        </TableCell>
                        <TableCell>
                          <Badge variant='warning'>Holding</Badge>
                        </TableCell>
                        <TableCell className='text-right font-mono font-medium'>
                          ₹1,62,400
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </section>

              {/* Badges & Avatars */}
              <section className='space-y-6'>
                <div>
                  <h2 className='font-display text-xl font-bold tracking-tight text-neutral-950 dark:text-white'>
                    Badges & Avatars
                  </h2>
                  <p className='text-sm text-muted-foreground'>
                    Micro-indicators and user identity representation
                  </p>
                </div>

                <div className='grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 p-5 md:p-8 rounded-[20px] bg-white/85 dark:bg-zinc-900/85 backdrop-blur-xl border border-border/50 shadow-sm'>
                  <div className='flex flex-col items-center gap-2'>
                    <Badge variant='default'>Default</Badge>
                    <span className='text-xs text-muted-foreground mt-2'>
                      Primary
                    </span>
                  </div>
                  <div className='flex flex-col items-center gap-2'>
                    <Badge variant='secondary'>Secondary</Badge>
                    <span className='text-xs text-muted-foreground mt-2'>
                      Muted
                    </span>
                  </div>
                  <div className='flex flex-col items-center gap-2'>
                    <Badge variant='outline'>Outline</Badge>
                    <span className='text-xs text-muted-foreground mt-2'>
                      Bordered
                    </span>
                  </div>
                  <div className='flex flex-col items-center gap-2'>
                    <Badge variant='destructive'>Error</Badge>
                    <span className='text-xs text-muted-foreground mt-2'>
                      Loss
                    </span>
                  </div>
                  <div className='flex flex-col items-center gap-2'>
                    <Badge variant='success'>Success</Badge>
                    <span className='text-xs text-muted-foreground mt-2'>
                      Gain
                    </span>
                  </div>
                  <div className='flex flex-col items-center gap-2'>
                    <Badge variant='warning'>Warning</Badge>
                    <span className='text-xs text-muted-foreground mt-2'>
                      Accent
                    </span>
                  </div>
                  <div className='flex flex-col items-center gap-2'>
                    <Badge variant='info'>Notice</Badge>
                    <span className='text-xs text-muted-foreground mt-2'>
                      Info
                    </span>
                  </div>
                </div>

                <div className='flex flex-col gap-8 p-6 md:p-8 rounded-[20px] bg-white/85 dark:bg-zinc-900/85 backdrop-blur-xl border border-border/50 shadow-sm'>
                  <div className='space-y-4'>
                    <h3 className='font-sans text-[11px] font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400'>
                      Circle & Square Avatars
                    </h3>
                    <div className='flex items-end gap-6 md:gap-8 flex-wrap'>
                      <div className='flex flex-col items-center gap-2'>
                        <Avatar size='sm' shape='circle'>
                          <AvatarImage src='https://i.pravatar.cc/150?u=a042581f4e29026024d' />
                          <AvatarFallback>SM</AvatarFallback>
                        </Avatar>
                        <span className='text-[10px] text-muted-foreground'>
                          Circle SM
                        </span>
                      </div>
                      <div className='flex flex-col items-center gap-2'>
                        <Avatar size='default' shape='circle'>
                          <AvatarImage src='https://i.pravatar.cc/150?u=a042581f4e29026704d' />
                          <AvatarFallback>MD</AvatarFallback>
                        </Avatar>
                        <span className='text-[10px] text-muted-foreground'>
                          Circle MD
                        </span>
                      </div>
                      <div className='flex flex-col items-center gap-2'>
                        <Avatar size='lg' shape='square'>
                          <AvatarImage src='https://i.pravatar.cc/150?u=a04258a2462d826712d' />
                          <AvatarFallback>LG</AvatarFallback>
                        </Avatar>
                        <span className='text-[10px] text-muted-foreground'>
                          Square LG
                        </span>
                      </div>
                      <div className='flex flex-col items-center gap-2'>
                        <Avatar size='xl' shape='square'>
                          <AvatarImage src='https://i.pravatar.cc/150?u=a04258a2462d826712a' />
                          <AvatarFallback>XL</AvatarFallback>
                        </Avatar>
                        <span className='text-[10px] text-muted-foreground'>
                          Square XL
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </TabsContent>

            {/* ══════════════════════════════════════════════════════════════════════
              TAB 6: FEEDBACK & STATUS
             ══════════════════════════════════════════════════════════════════════ */}
            <TabsContent
              value='feedback'
              className='space-y-10 animate-in fade-in-50 duration-500 fill-mode-both'
            >
              {/* Alerts */}
              <section className='space-y-4'>
                <div>
                  <h2 className='font-display text-xl font-bold tracking-tight text-neutral-950 dark:text-white'>
                    Alert Banners
                  </h2>
                  <p className='text-sm text-muted-foreground'>
                    Status callouts with integrated animated SVG status icons
                  </p>
                </div>

                <div className='max-w-2xl space-y-4'>
                  <Alert variant='default'>
                    <AnimatedTerminalIcon />
                    <AlertTitle>Heads up!</AlertTitle>
                    <AlertDescription>
                      You can add components to your app using the cli.
                    </AlertDescription>
                  </Alert>

                  <Alert variant='info'>
                    <AnimatedInfoIcon />
                    <AlertTitle>System Update</AlertTitle>
                    <AlertDescription>
                      A new version of the application is available. Please
                      refresh your browser to update.
                    </AlertDescription>
                  </Alert>

                  <Alert variant='warning'>
                    <AnimatedWarningIcon />
                    <AlertTitle>Action Required</AlertTitle>
                    <AlertDescription>
                      Your API key will expire in 3 days. Please rotate your
                      keys to avoid disruption.
                    </AlertDescription>
                  </Alert>

                  <Alert variant='destructive'>
                    <AnimatedErrorIcon />
                    <AlertTitle>Error Loading Data</AlertTitle>
                    <AlertDescription>
                      We could not retrieve your portfolio history. Please try
                      again later.
                    </AlertDescription>
                  </Alert>

                  <Alert variant='success'>
                    <AnimatedSuccessIcon />
                    <AlertTitle>Payment Successful</AlertTitle>
                    <AlertDescription>
                      Your transaction has been confirmed and the funds have
                      been added to your ledger.
                    </AlertDescription>
                  </Alert>
                </div>
              </section>

              {/* Progress & Skeletons */}
              <section className='space-y-4'>
                <div>
                  <h2 className='font-display text-xl font-bold tracking-tight text-neutral-950 dark:text-white'>
                    Progress Bars & Skeleton Loaders
                  </h2>
                  <p className='text-sm text-muted-foreground'>
                    Smooth motion indicators and skeleton placeholders
                  </p>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-8 p-8 rounded-[20px] bg-white/85 dark:bg-zinc-900/85 backdrop-blur-xl border border-border/50 shadow-sm'>
                  {/* Progress */}
                  <div className='space-y-4'>
                    <h3 className='font-sans text-[11px] font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400'>
                      Progress Indicator
                    </h3>
                    <div className='space-y-2'>
                      <div className='flex justify-between text-xs font-medium'>
                        <span>Annual 80C Investment Limit</span>
                        <span>₹97,500 / ₹1,50,000 (65%)</span>
                      </div>
                      <Progress value={65} className='w-full' />
                    </div>

                    <div className='space-y-2 pt-2'>
                      <div className='flex justify-between text-xs font-medium'>
                        <span>NPS Tier 1 Allocation</span>
                        <span>85%</span>
                      </div>
                      <Progress value={85} className='w-full' />
                    </div>
                  </div>

                  {/* Skeletons */}
                  <div className='space-y-4'>
                    <h3 className='font-sans text-[11px] font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400'>
                      Skeleton Placeholders
                    </h3>
                    <div className='flex items-center gap-3'>
                      <Skeleton className='h-10 w-10 rounded-full' />
                      <div className='space-y-2 flex-1'>
                        <Skeleton className='h-4 w-3/4' />
                        <Skeleton className='h-3 w-1/2' />
                      </div>
                    </div>
                    <SkeletonText lines={3} />
                  </div>
                </div>
              </section>
            </TabsContent>

            {/* ══════════════════════════════════════════════════════════════════════
              TAB 7: AUTH SCREENS
             ══════════════════════════════════════════════════════════════════════ */}
            <TabsContent
              value='auth'
              className='space-y-10 animate-in fade-in-50 duration-500 fill-mode-both'
            >
              <section className='space-y-4'>
                <div>
                  <h2 className='font-display text-2xl font-bold tracking-tight text-neutral-950 dark:text-white'>
                    Split-Screen Authentication
                  </h2>
                  <p className='text-sm text-muted-foreground mt-1'>
                    Modern login page with a stylized visual half and a clean
                    form half.
                  </p>
                </div>

                <div className='relative overflow-hidden rounded-[20px] bg-muted/20 backdrop-blur-xl border border-border/50 shadow-sm'>
                  <div className='absolute inset-0'>
                    <span className='absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-emerald-500/5' />
                  </div>
                  <div className='relative flex items-center justify-between gap-4 px-5 py-4'>
                    <div className='flex items-center gap-3'>
                      <span className='size-8 rounded-xl bg-foreground/5 border border-border/50 flex items-center justify-center'>
                        <PanelRight className='size-4 opacity-70' />
                      </span>
                      <div className='text-left'>
                        <h3 className='text-sm font-semibold tracking-tight'>
                          Full-Screen Login Demo
                        </h3>
                        <p className='text-xs text-muted-foreground'>
                          Rendered clean — no sidebar, header or footer.
                        </p>
                      </div>
                    </div>
                    <div className='flex flex-wrap gap-2 sm:gap-3'>
                      <a
                        href='/design-lab/login'
                        className='inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-foreground px-4 py-2 text-xs font-medium text-background shadow-sm transition hover:bg-foreground/90'
                      >
                        Login Demo
                      </a>
                      <a
                        href='/design-lab/register'
                        className='inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-secondary px-4 py-2 text-xs font-medium text-foreground shadow-sm transition hover:bg-secondary/80'
                      >
                        Register Demo
                      </a>
                      <a
                        href='/design-lab/forgot-password'
                        className='inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-secondary px-4 py-2 text-xs font-medium text-foreground shadow-sm transition hover:bg-secondary/80'
                      >
                        Forgot Password Demo
                      </a>
                      <a
                        href='/design-lab/reset-password'
                        className='inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-secondary px-4 py-2 text-xs font-medium text-foreground shadow-sm transition hover:bg-secondary/80'
                      >
                        Reset Password Demo
                      </a>
                      <a
                        href='/design-lab/setup-2fa'
                        className='inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-secondary px-4 py-2 text-xs font-medium text-foreground shadow-sm transition hover:bg-secondary/80'
                      >
                        Setup 2FA Demo
                      </a>
                      <a
                        href='/design-lab/verify-2fa'
                        className='inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-secondary px-4 py-2 text-xs font-medium text-foreground shadow-sm transition hover:bg-secondary/80'
                      >
                        Verify 2FA Demo
                      </a>
                      <a
                        href='/design-lab/verify-email'
                        className='inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-secondary px-4 py-2 text-xs font-medium text-foreground shadow-sm transition hover:bg-secondary/80'
                      >
                        Verify Email Demo
                      </a>
                      <a
                        href='/design-lab/dashboard'
                        className='inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-secondary px-4 py-2 text-xs font-medium text-foreground shadow-sm transition hover:bg-secondary/80'
                      >
                        Dashboard Demo
                      </a>
                    </div>
                  </div>
                </div>
              </section>

              <section className='space-y-4 pt-6 border-t border-border/40'>
                <div>
                  <h3 className='text-lg font-semibold tracking-tight text-foreground'>
                    Master Password & Strength Meter
                  </h3>
                  <p className='text-xs text-muted-foreground mt-0.5'>
                    Password field with live strength scoring meter, rules
                    validation, and modifier key warnings.
                  </p>
                </div>

                <div className='p-6 rounded-[24px] bg-muted/20 dark:bg-zinc-950/40 backdrop-blur-xl border border-border/50 shadow-sm max-w-xl'>
                  <PasswordStrengthInput
                    value={passwordValue}
                    onChange={e => setPasswordValue(e.target.value)}
                  />
                </div>
              </section>
            </TabsContent>
          </Tabs>

          <ConfirmDialog
            open={dialog.open}
            onOpenChange={open => setDialog(d => ({ ...d, open }))}
            tone={activeModule.tone}
            refNo={activeModule.refNo}
            title={activeModule.title}
            description={activeModule.description}
            rows={activeModule.rows}
            note={activeModule.note}
            confirmLabel={activeModule.confirmLabel}
            cancelLabel='Keep Record'
            confirmIcon={<Trash2 className='h-4 w-4' />}
            confirmLoading={dialog.loading}
            onConfirm={runConfirm}
          />
        </div>
      </main>

      <CoinTrackFooter />
    </TooltipProvider>
  );
}
