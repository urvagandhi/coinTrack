'use client';

import {
	Briefcase,
	FileText,
	Home,
	Link as LinkIcon,
	LogOut,
	StickyNote,
	UserCog
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const SidebarItem = ({ icon: Icon, label, href, isActive, isDanger = false }) => {
	return (
		<Link
			href={href}
			className={`
                group flex items-center justify-center w-12 h-12 mb-2 rounded-xl transition-all duration-300 relative
                ${isActive
					? 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-500 shadow-sm'
					: isDanger
						? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
						: 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
				}
            `}
			title={label}
		>
			<Icon className={`w-6 h-6 ${isActive ? 'stroke-2' : 'stroke-[1.5]'}`} />

			{/* Tooltip for collapsed state */}
			<span className="absolute left-14 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
				{label}
			</span>

			{/* Active Indicator Bar (Left) */}
			{isActive && (
				<div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-orange-500 rounded-r-full" />
			)}
		</Link>
	);
};

export default function Sidebar() {
	const pathname = usePathname();

	const navItems = [
		{ icon: Home, label: 'Home', href: '/dashboard' },
		{ icon: Briefcase, label: 'Portfolio', href: '/portfolio' },
		{ icon: LinkIcon, label: 'Broker Integration', href: '/brokers' },
		{ icon: StickyNote, label: 'Notes', href: '/notes' },
		{ icon: FileText, label: 'Form', href: '/form' },
	];

	const bottomItems = [
		{ icon: UserCog, label: 'Edit Profile', href: '/profile' },
		// Log Out often handled by specific functionality, using link for visual mock
		{ icon: LogOut, label: 'Log Out', href: '/logout', isDanger: true },
	];

	return (
		<aside className="hidden md:flex flex-col w-20 h-screen sticky top-0 bg-white dark:bg-black border-r border-gray-100 dark:border-gray-800 py-6 items-center z-40">
			{/* Logo/Brand Icon */}
			<div className="mb-8">
				<div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-orange-500/30">
					C
				</div>
			</div>

			{/* Main Navigation */}
			<nav className="flex-1 w-full px-4 flex flex-col gap-2">
				{navItems.map((item) => (
					<SidebarItem
						key={item.href}
						{...item}
						isActive={pathname === item.href}
					/>
				))}
			</nav>

			{/* Bottom Navigation */}
			<div className="w-full px-4 flex flex-col gap-2">
				{bottomItems.map((item) => (
					<SidebarItem
						key={item.href}
						{...item}
						isActive={pathname === item.href}
						isDanger={item.isDanger}
					/>
				))}
			</div>
		</aside>
	);
}
