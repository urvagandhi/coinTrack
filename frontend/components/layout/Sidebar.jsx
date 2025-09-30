'use client';

import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';

const navigation = [
	{
		name: 'Dashboard',
		href: '/dashboard',
		icon: (
			<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2z" />
			</svg>
		),
	},
	{
		name: 'Portfolio',
		href: '/portfolio',
		icon: (
			<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
			</svg>
		),
	},
	{
		name: 'Brokers',
		href: '/brokers',
		icon: (
			<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
			</svg>
		),
		children: [
			{ name: 'Zerodha', href: '/brokers/zerodha' },
			{ name: 'Upstox', href: '/brokers/upstox' },
			{ name: 'AngelOne', href: '/brokers/angelone' },
		],
	},
	{
		name: 'Analytics',
		href: '/analytics',
		icon: (
			<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
			</svg>
		),
	},
	{
		name: 'Calculators',
		href: '/calculator',
		icon: (
			<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L12.732 4.5c-.77-.833-1.732-.833-2.502 0L1.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
			</svg>
		),
	},
	{
		name: 'Profile',
		href: '/profile',
		icon: (
			<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
			</svg>
		),
	},
];

export default function Sidebar({ isOpen, onClose, isMobile }) {
	const pathname = usePathname();
	const router = useRouter();

	const isActiveRoute = (href) => {
		if (href === '/dashboard') {
			return pathname === '/dashboard' || pathname === '/';
		}
		return pathname.startsWith(href);
	};

	return (
		<>
			{/* Desktop sidebar */}
			<div className={`fixed left-0 top-0 z-50 h-full w-64 transform bg-white dark:bg-cointrack-dark-card border-r border-cointrack-light/20 dark:border-cointrack-dark/20 transition-transform duration-300 ${isMobile ? (isOpen ? 'translate-x-0' : '-translate-x-full') : 'translate-x-0'
				} lg:translate-x-0`}>
				{/* Logo */}
				<div className="flex h-16 items-center justify-between px-6 border-b border-cointrack-light/20 dark:border-cointrack-dark/20">
					<Link href="/dashboard" className="flex items-center space-x-2">
						<div className="h-8 w-8 rounded-lg bg-gradient-to-r from-cointrack-primary to-cointrack-secondary flex items-center justify-center">
							<span className="text-lg font-bold text-white">C</span>
						</div>
						<span className="text-xl font-bold bg-gradient-to-r from-cointrack-primary to-cointrack-secondary bg-clip-text text-transparent">
							CoinTrack
						</span>
					</Link>

					{/* Close button for mobile */}
					{isMobile && (
						<button
							onClick={onClose}
							className="rounded-lg p-1 text-cointrack-dark/60 hover:bg-cointrack-light/20 dark:text-cointrack-light/60 dark:hover:bg-cointrack-dark/20 lg:hidden"
						>
							<svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
					)}
				</div>

				{/* Navigation */}
				<nav className="flex-1 space-y-1 px-3 py-4">
					{navigation.map((item) => (
						<div key={item.name}>
							<Link
								href={item.href}
								onClick={isMobile ? onClose : undefined}
								className={`group flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isActiveRoute(item.href)
										? 'bg-cointrack-primary/10 text-cointrack-primary dark:bg-cointrack-primary/20'
										: 'text-cointrack-dark/70 hover:bg-cointrack-light/20 hover:text-cointrack-dark dark:text-cointrack-light/70 dark:hover:bg-cointrack-dark/20 dark:hover:text-cointrack-light'
									}`}
							>
								<span className={`mr-3 ${isActiveRoute(item.href) ? 'text-cointrack-primary' : ''}`}>
									{item.icon}
								</span>
								{item.name}

								{/* Badge for notifications */}
								{item.name === 'Brokers' && (
									<span className="ml-auto inline-flex h-2 w-2 rounded-full bg-cointrack-secondary"></span>
								)}
							</Link>

							{/* Sub-navigation for Brokers */}
							{item.children && isActiveRoute(item.href) && (
								<motion.div
									initial={{ opacity: 0, height: 0 }}
									animate={{ opacity: 1, height: 'auto' }}
									exit={{ opacity: 0, height: 0 }}
									className="mt-1 space-y-1 pl-10"
								>
									{item.children.map((child) => (
										<Link
											key={child.name}
											href={child.href}
											onClick={isMobile ? onClose : undefined}
											className={`block rounded-lg px-3 py-2 text-sm transition-colors ${pathname === child.href
													? 'bg-cointrack-primary/10 text-cointrack-primary dark:bg-cointrack-primary/20'
													: 'text-cointrack-dark/60 hover:bg-cointrack-light/20 hover:text-cointrack-dark dark:text-cointrack-light/60 dark:hover:bg-cointrack-dark/20 dark:hover:text-cointrack-light'
												}`}
										>
											{child.name}
										</Link>
									))}
								</motion.div>
							)}
						</div>
					))}
				</nav>

				{/* Bottom section */}
				<div className="border-t border-cointrack-light/20 dark:border-cointrack-dark/20 p-4">
					<div className="rounded-lg bg-gradient-to-r from-cointrack-primary/10 to-cointrack-secondary/10 p-3">
						<div className="flex items-center">
							<div className="flex-shrink-0">
								<svg className="h-5 w-5 text-cointrack-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
								</svg>
							</div>
							<div className="ml-3 flex-1">
								<h3 className="text-sm font-medium text-cointrack-dark dark:text-cointrack-light">
									Need Help?
								</h3>
								<p className="text-xs text-cointrack-dark/60 dark:text-cointrack-light/60">
									Check our docs
								</p>
							</div>
						</div>
						<div className="mt-3">
							<a
								href="/docs"
								className="inline-flex w-full items-center justify-center rounded-lg bg-white dark:bg-cointrack-dark/50 px-3 py-2 text-xs font-medium text-cointrack-primary hover:bg-cointrack-light/50 dark:hover:bg-cointrack-dark/70 transition-colors"
							>
								View Documentation
							</a>
						</div>
					</div>
				</div>
			</div>
		</>
	);
}