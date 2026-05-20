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
        accentClass: 'border-l-chart-3',
        badgeClass: 'bg-chart-3/10 text-chart-3',
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
                code: `${APP_URL}/brokers/zerodha/callback`,
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
        accentClass: 'border-l-chart-4',
        badgeClass: 'bg-chart-4/10 text-chart-4',
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
                key: 'apiKey',
                label: 'SmartAPI Key',
                type: 'text',
                placeholder: 'Your SmartAPI key',
                sensitive: false,
                helpText: 'From smartapi.angelbroking.com',
            },
            {
                key: 'clientCode',
                label: 'Client Code',
                type: 'text',
                placeholder: 'Your Angel One Client Code (e.g. A123456)',
                sensitive: false,
                helpText: 'Your Angel One login ID',
            },
            {
                key: 'password',
                label: 'Password',
                type: 'password',
                placeholder: 'Your Angel One login password',
                sensitive: true,
                helpText: 'Your Angel One trading password',
            },
            {
                key: 'totpSecret',
                label: 'TOTP Secret',
                type: 'password',
                placeholder: 'Base32 TOTP secret (e.g. JBSWY3DPEHPK3PXP)',
                sensitive: true,
                helpText: 'NOT your 6-digit OTP. The 32-char seed shown when setting up TOTP at smartapi.angelbroking.com',
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
        accentClass: 'border-l-chart-5',
        badgeClass: 'bg-chart-5/10 text-chart-5',
        initials: 'UP',
        capabilities: [
            'Equity Holdings',
            'Positions & F&O',
            'Funds & Margin',
            'Live Quotes',
            'Order History',
        ],
        credentialFields: [
            {
                key: 'apiKey',
                label: 'API Key',
                type: 'text',
                placeholder: 'Your Upstox API Key',
                sensitive: false,
                helpText: 'From the Upstox Developer Console',
            },
            {
                key: 'apiSecret',
                label: 'API Secret',
                type: 'password',
                placeholder: 'Your Upstox API Secret',
                sensitive: true,
                helpText: 'Never share this with anyone',
            },
            {
                key: 'redirectUri',
                label: 'Redirect URI',
                type: 'text',
                placeholder: `${APP_URL}/brokers/upstox/callback`,
                sensitive: false,
                helpText: 'Must exactly match the redirect URL set in your Upstox developer app',
            },
        ],
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
