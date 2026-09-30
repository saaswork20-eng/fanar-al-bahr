'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  User,
  Package,
  Heart,
  MapPin,
  Star,
  LogOut,
} from 'lucide-react';

interface AccountNavProps {
  wishlistCount?: number;
  orderCount?: number;
}

export default function AccountNav({ wishlistCount, orderCount }: AccountNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/v1/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const navItems = [
    {
      name: 'Overview',
      href: '/account',
      icon: LayoutDashboard,
      active: pathname === '/account',
    },
    {
      name: 'Profile',
      href: '/account/profile',
      icon: User,
      active: pathname === '/account/profile',
    },
    {
      name: 'Orders',
      href: '/account/orders',
      icon: Package,
      badge: orderCount !== undefined && orderCount > 0 ? orderCount : undefined,
      active: pathname.startsWith('/account/orders'),
    },
    {
      name: 'Wishlist',
      href: '/account/wishlist',
      icon: Heart,
      badge: wishlistCount !== undefined && wishlistCount > 0 ? wishlistCount : undefined,
      active: pathname === '/account/wishlist',
    },
    {
      name: 'Addresses',
      href: '/account/addresses',
      icon: MapPin,
      active: pathname === '/account/addresses',
    },
  ];

  return (
    <aside className="w-full lg:w-64 flex-shrink-0">
      <div className="bg-[#12161f] border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div className="px-3 py-2 mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Account Menu
        </div>
        <nav className="flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
                  item.active
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${item.active ? 'text-amber-400' : 'text-slate-400'}`} />
                  <span>{item.name}</span>
                </div>
                {item.badge !== undefined && (
                  <span className="ml-2 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}

          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-all text-left mt-2 lg:mt-4 border-t border-slate-800/60 pt-3"
          >
            <LogOut className="w-4 h-4 text-rose-400" />
            <span>Sign Out</span>
          </button>
        </nav>
      </div>
    </aside>
  );
}
