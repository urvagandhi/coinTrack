// src/lib/brokerConfig.js — Single source of truth for all broker metadata

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://cointrack-finance.vercel.app';

export const BROKERS = {
    ZERODHA: {
        id: 'zerodha',
        key: 'ZERODHA',
        displayName: 'Zerodha',
        tagline: "India's largest stock broker",
        authType: 'oauth',
        setupPath: '/brokers/zerodha',
        callbackPath: '/brokers/zerodha/callback',
        accentClass: 'border-l-blue-400 dark:border-l-blue-500',
        badgeClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
        initials: 'ZE',
        capabilities: [
            'Equity Holdings',
            'Positions & F&O',
            'Funds & Margin',
            'Mutual Funds (Coin)',
            'SIPs & Orders',
        ],
        credentialFields: [
            {
                key: 'apiKey',
                label: 'API Key',
                type: 'text',
                placeholder: 'Your Kite Connect API Key',
                sensitive: false,
                helpText: 'Found in Kite Developer Console',
            },
            {
                key: 'apiSecret',
                label: 'API Secret',
                type: 'password',
                placeholder: 'Your Kite Connect API Secret',
                sensitive: true,
                helpText: 'Never share this with anyone',
            },
        ],
        setupSteps: [
            {
                title: 'Create a Kite Connect app',
                body: 'Go to developers.kite.trade and sign in with your Zerodha account. Create a new app of type "Personal".',
                link: { label: 'Open Kite Developer Portal', href: 'https://developers.kite.trade' },
            },
            {
                title: 'Set the redirect URL',
                body: 'In your app settings, set the redirect URL to:',
                code: `${APP_URL}/api/kite/callback`,
            },
            {
                title: 'Copy your credentials',
                body: 'Copy the API Key and API Secret from your app dashboard and paste them below.',
            },
        ],
    },

    ANGEL_ONE: {
        id: 'angelone',
        key: 'ANGEL_ONE',
        displayName: 'Angel One',
        tagline: 'Smart investing made simple',
        authType: 'direct',
        setupPath: '/brokers/angelone',
        callbackPath: null,
        accentClass: 'border-l-orange-400 dark:border-l-orange-500',
        badgeClass: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
        initials: 'AO',
        capabilities: [
            'Equity Holdings',
            'Positions & F&O',
            'Funds & Margin',
            'Live Quotes',
            'Order History',
        ],
        credentialFields: [
            {
                key: 'clientId',
                label: 'Client ID',
                type: 'text',
                placeholder: 'Your Angel One Client ID (e.g. A123456)',
                sensitive: false,
                helpText: 'Your Angel One login ID',
            },
            {
                key: 'mpin',
                label: 'MPIN',
                type: 'password',
                placeholder: '4-digit MPIN',
                sensitive: true,
                helpText: 'Your Angel One trading PIN',
            },
            {
                key: 'apiKey',
                label: 'SmartAPI Key',
                type: 'text',
                placeholder: 'Your SmartAPI key',
                sensitive: false,
                helpText: 'From smartapi.angelbroking.com',
            },
            {
                key: 'totpSecret',
                label: 'TOTP Secret',
                type: 'password',
                placeholder: 'Base32 TOTP secret (e.g. JBSWY3DPEHPK3PXP)',
                sensitive: true,
                helpText: 'The secret key shown when setting up 2FA in Angel One',
            },
        ],
        setupSteps: [
            {
                title: 'Create a SmartAPI account',
                body: 'Visit smartapi.angelbroking.com and register as a developer to get your API key.',
                link: { label: 'Open SmartAPI Portal', href: 'https://smartapi.angelbroking.com' },
            },
            {
                title: 'Get your TOTP secret',
                body: "In your Angel One app, go to My Profile > Security > Enable TOTP. When the QR code is shown, look for \"Can't scan? Copy key\" — that's your TOTP secret.",
            },
            {
                title: 'Enter your credentials',
                body: 'Angel One uses direct authentication — no browser redirect needed. Enter your details below and CoinTrack connects instantly.',
            },
        ],
    },

    UPSTOX: {
        id: 'upstox',
        key: 'UPSTOX',
        displayName: 'Upstox',
        tagline: 'Fast, reliable trading platform',
        authType: 'oauth',
        setupPath: '/brokers/upstox',
        callbackPath: '/brokers/upstox/callback',
        accentClass: 'border-l-purple-400 dark:border-l-purple-500',
        badgeClass: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
        initials: 'UP',
        capabilities: [
            'Equity Holdings',
            'Positions & F&O',
            'Funds & Margin',
            'Live Quotes',
            'Order History',
        ],
        credentialFields: [],
        setupSteps: [
            {
                title: 'Create an Upstox developer app',
                body: 'Go to the Upstox Developer Console and create a new app.',
                link: { label: 'Open Upstox Developer Console', href: 'https://developer.upstox.com' },
            },
            {
                title: 'Set the redirect URL',
                body: 'In your app settings, set the redirect URL to:',
                code: `${APP_URL}/brokers/upstox/callback`,
            },
            {
                title: 'Connect via Upstox',
                body: "Click the button below to be redirected to Upstox login. After logging in, you'll be returned here automatically.",
            },
        ],
    },
};

export const BROKER_LIST = Object.values(BROKERS);

export const getBrokerByKey = (key) => BROKER_LIST.find((b) => b.key === key) ?? null;
export const getBrokerById = (id) => BROKER_LIST.find((b) => b.id === id) ?? null;
