'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Briefcase, Calculator, Home, Link as LinkIcon, LogOut, StickyNote, UserCog, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

const SidebarItem = ({ icon: Icon, label, href, isActive, isDanger = false, isExpanded, onClick }) => {
	return (
		<Link
			href={href}
			onClick={onClick}
			className={`
                group flex items-center ${isExpanded ? 'justify-start px-3 gap-3' : 'justify-center'}
                h-12 mb-2 rounded-xl transition-all duration-300 relative
                ${isActive
					? 'bg-orange-500/10 text-orange-600 dark:text-orange-500 shadow-sm border border-orange-500/20'
					: isDanger
						? 'text-red-500 hover:bg-red-500/10'
						: 'text-gray-500 hover:bg-gray-100/50 dark:text-gray-400 dark:hover:bg-white/5'
				}
                ${isExpanded ? 'w-full' : 'w-12'}
            `}
			title={!isExpanded ? label : ''}
		>
			<Icon className={`flex-shrink-0 w-6 h-6 ${isActive ? 'stroke-2' : 'stroke-[1.5]'}`} />

			{/* Label for expanded state */}
			<span className={`whitespace-nowrap overflow-hidden transition-all duration-300 ${isExpanded ? 'w-auto opacity-100' : 'w-0 opacity-0'}`}>
				{label}
			</span>

			{/* Tooltip for collapsed state (Only show if NOT expanded) */}
			{!isExpanded && (
				<span className="absolute left-14 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none md:block hidden">
					{label}
				</span>
			)}

			{/* Active Indicator Bar (Left) */}
			{isActive && (
				<div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-orange-500 rounded-r-full shadow-[0_0_10px_rgba(249,115,22,0.5)]" />
			)}
		</Link>
	);
};

export default function Sidebar({ isMobileOpen, onClose }) {
	const { logout } = useAuth();
	const pathname = usePathname();
	const [isHovered, setIsHovered] = useState(false);

	const handleLogout = async (e) => {
		e.preventDefault();
		await logout();
	};

	// Determine if expanded: Always expanded on mobile drawer, or hovered on desktop
	const isExpanded = isMobileOpen || isHovered;

	// Handle Closing on route change for mobile
	const prevPathnameRef = useRef(pathname);
	useEffect(() => {
		if (prevPathnameRef.current !== pathname && isMobileOpen && onClose) {
			onClose();
		}
		prevPathnameRef.current = pathname;
	}, [pathname, isMobileOpen, onClose]);

	const navItems = [
		{ icon: Home, label: 'Home', href: '/dashboard' },
		{ icon: Briefcase, label: 'Portfolio', href: '/portfolio' },
		{ icon: Calculator, label: 'Calculators', href: '/calculators' },
		{ icon: LinkIcon, label: 'Broker Integration', href: '/brokers' },
		{ icon: StickyNote, label: 'Notes', href: '/notes' },

	];

	const bottomItems = [
		{ icon: UserCog, label: 'Edit Profile', href: '/profile' },
		{ icon: LogOut, label: 'Log Out', href: '#', isDanger: true, onClick: handleLogout },
	];

	return (
		<>
			{/* Mobile Backdrop */}
			<div
				className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300 md:hidden ${isMobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
				onClick={onClose}
			/>

			<aside
				onMouseEnter={() => setIsHovered(true)}
				onMouseLeave={() => setIsHovered(false)}
				className={`
                    fixed md:sticky top-0 left-0 h-screen z-50 py-6 flex flex-col items-center
                    bg-white/70 dark:bg-gray-900/80 backdrop-blur-xl border-r border-white/50 dark:border-white/10
                    transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]
                    ${isExpanded ? 'w-64' : 'w-20'}
                    ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
                `}
			>
				{/* Mobile Close Button */}
				<button
					onClick={onClose}
					className="md:hidden absolute top-4 right-4 p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
				>
					<X className="w-6 h-6" />
				</button>

				{/* Logo/Brand Icon */}
				<div className="mb-8 w-full flex justify-center overflow-hidden">
					<div className={`transition-all duration-300 flex items-center gap-3 ${isExpanded ? 'px-4 w-full' : 'justify-center w-10'}`}>
						<div className="w-10 h-10 relative flex-shrink-0">
							<Image
								src="/coinTrack.png"
								alt="coinTrack logo"
								fill
								className="object-contain"
							/>
						</div>
						<span className={`font-bold text-xl text-gray-900 dark:text-white whitespace-nowrap transition-all duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0 w-0'}`}>
							coinTrack
						</span>
					</div>
				</div>

				{/* Main Navigation */}
				<nav className="flex-1 w-full px-4 flex flex-col gap-2 overflow-x-hidden scrollbar-hide overflow-y-auto">
					{navItems.map((item) => (
						<SidebarItem
							key={item.href}
							{...item}
							isActive={pathname === item.href}
							isExpanded={isExpanded}
							onClick={onClose} // Auto close on mobile click
						/>
					))}
				</nav>

				{/* Bottom Navigation */}
				<div className="w-full px-4 flex flex-col gap-2 overflow-x-hidden mt-4">
					{bottomItems.map((item) => (
						<SidebarItem
							key={item.href}
							{...item}
							isActive={pathname === item.href}
							isDanger={item.isDanger}
							isExpanded={isExpanded}
							onClick={(e) => {
								if (item.onClick) item.onClick(e);
								if (onClose) onClose();
							}}
						/>
					))}
				</div>
			</aside>
		</>
	);
}
