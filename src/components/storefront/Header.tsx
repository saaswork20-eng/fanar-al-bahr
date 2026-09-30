'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  Search,
  ShoppingBag,
  Heart,
  User,
  ShieldCheck,
  Menu,
  X,
  Flame,
  Sparkles,
  ChevronDown,
  LogOut,
  Package,
  Layers,
} from 'lucide-react';

interface AuthUser {
  id: string;
  name: string | null;
  email: string;
  role: 'ADMIN' | 'BUYER';
}

export default function StorefrontHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [cartCount, setCartCount] = useState<number>(0);
  const [wishlistCount, setWishlistCount] = useState<number>(0);

  // Sync cart and wishlist count from server cart API or fallback to localStorage
  const updateCounts = async () => {
    // 1. Fetch server-authoritative cart
    try {
      const res = await fetch('/api/v1/cart');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.cart) {
          const totalQty = data.cart.itemCount ?? (Array.isArray(data.cart.items)
            ? data.cart.items.reduce((acc: number, item: any) => acc + (item.quantity || 1), 0)
            : 0);
          setCartCount(totalQty);
        }
      } else {
        setCartCount(0);
      }
    } catch {
      setCartCount(0);
    }

    // 2. Fetch server-authoritative wishlist from database
    try {
      const res = await fetch('/api/v1/account/wishlist');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setWishlistCount(Number(data.count) || 0);
        }
      } else {
        setWishlistCount(0);
      }
    } catch {
      setWishlistCount(0);
    }
  };

  useEffect(() => {
    updateCounts();
    window.addEventListener('storage', updateCounts);
    window.addEventListener('cart-updated', updateCounts);
    window.addEventListener('wishlist-updated', updateCounts);

    // Fetch user status
    async function fetchMe() {
      try {
        const res = await fetch('/api/v1/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.user) {
            setUser(data.user);
          }
        }
      } catch (err) {
        console.error('Failed to fetch auth state:', err);
      }
    }
    fetchMe();

    return () => {
      window.removeEventListener('storage', updateCounts);
      window.removeEventListener('cart-updated', updateCounts);
      window.removeEventListener('wishlist-updated', updateCounts);
    };
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setMobileMenuOpen(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/v1/auth/logout', { method: 'POST' });
      setUser(null);
      setUserDropdownOpen(false);
      router.refresh();
      router.push('/login');
    } catch (e) {
      console.error('Logout error:', e);
    }
  };

  const navLinks = [
    { label: 'Shop', href: '/shop' },
    { label: 'Categories', href: '/categories' },
    { label: 'Deals', href: '/shop?onSale=true', icon: Flame, badge: 'Hot' },
    { label: 'New Releases', href: '/shop?sort=newest', icon: Sparkles },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-[#070a0f]/90 backdrop-blur-md transition-all">
      {/* Top Banner Notice */}
      <div className="bg-gradient-to-r from-amber-600/20 via-indigo-600/20 to-emerald-600/20 border-b border-slate-800/50 py-1.5 px-4 text-xs font-medium text-slate-300">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-200">Official Single-Vendor Store</span>
            <span className="text-slate-500">•</span>
            <span className="hidden sm:inline text-slate-400">100% Genuine Direct Keys & Instant Dispatch</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            {user?.role === 'ADMIN' && (
              <Link
                href="/admin/dashboard"
                className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 text-xs"
              >
                <ShieldCheck className="w-3.5 h-3.5" /> Admin Control
              </Link>
            )}
            <span className="hidden md:inline">24/7 Verified Support</span>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-4">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-3 group shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 via-amber-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform duration-200">
              <ShieldCheck className="w-5 h-5 text-slate-950 font-bold" />
            </div>
            <div>
              <div className="text-lg sm:text-xl font-black tracking-wider text-white flex items-center gap-1.5 font-mono">
                FANAR <span className="text-amber-400">AL BHAR</span>
              </div>
              <p className="text-[10px] text-slate-400 tracking-wider font-semibold uppercase -mt-1">
                Official Digital Store
              </p>
            </div>
          </Link>

          {/* Desktop Search Bar */}
          <form
            onSubmit={handleSearch}
            className="hidden md:flex flex-1 max-w-lg items-center relative"
          >
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search games, software, licenses, gift cards..."
                className="w-full bg-slate-900/90 text-sm text-slate-100 placeholder-slate-400 pl-10 pr-20 py-2.5 rounded-xl border border-slate-700/60 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all shadow-inner"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors shadow-sm"
              >
                Search
              </button>
            </div>
          </form>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 transition-colors ${
                    isActive
                      ? 'text-amber-400 font-semibold'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {Icon && <Icon className="w-3.5 h-3.5 text-amber-400" />}
                  {item.label}
                  {item.badge && (
                    <span className="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30 px-1.5 py-0.2 rounded font-bold uppercase">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Action Utilities */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Wishlist */}
            <Link
              href={user ? "/account/wishlist" : "/login?redirect=/account/wishlist"}
              title="Saved Items"
              className="relative p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
            >
              <Heart className="w-5 h-5" />
              {wishlistCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-rose-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center shadow">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Cart Button */}
            <Link
              href="/cart"
              title="Shopping Cart"
              className="relative p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors flex items-center gap-2"
            >
              <ShoppingBag className="w-5 h-5 text-amber-400" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-amber-500 text-slate-950 text-[10px] font-black rounded-full w-4 h-4 flex items-center justify-center shadow">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* User Account / Auth */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-900/80 hover:bg-slate-800 transition-colors text-sm text-slate-200"
                >
                  <div className="w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-xs">
                    {user.name ? user.name[0].toUpperCase() : 'U'}
                  </div>
                  <span className="hidden sm:inline max-w-[100px] truncate text-xs font-medium">
                    {user.name || user.email.split('@')[0]}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-800 bg-slate-950 p-2 shadow-2xl z-50 backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-3 py-2 border-b border-slate-800/80 mb-1">
                      <p className="text-xs text-slate-400">Signed in as</p>
                      <p className="text-sm font-semibold text-slate-100 truncate">{user.email}</p>
                      <span className="inline-block mt-1 text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        {user.role}
                      </span>
                    </div>

                    {user.role === 'ADMIN' && (
                      <Link
                        href="/admin/dashboard"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors font-medium"
                      >
                        <ShieldCheck className="w-4 h-4" /> Admin Dashboard
                      </Link>
                    )}

                    <Link
                      href="/account"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800/80 rounded-lg transition-colors"
                    >
                      <User className="w-4 h-4 text-slate-400" /> Account Overview
                    </Link>

                    <Link
                      href="/account/orders"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800/80 rounded-lg transition-colors"
                    >
                      <Package className="w-4 h-4 text-slate-400" /> Orders & Keys
                    </Link>

                    <Link
                      href="/account/wishlist"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800/80 rounded-lg transition-colors"
                    >
                      <Heart className="w-4 h-4 text-rose-400" /> Wishlist ({wishlistCount})
                    </Link>

                    <Link
                      href="/cart"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800/80 rounded-lg transition-colors"
                    >
                      <ShoppingBag className="w-4 h-4 text-amber-400" /> Cart ({cartCount})
                    </Link>

                    <div className="border-t border-slate-800/80 my-1" />

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors text-left font-medium"
                    >
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="px-3 py-1.5 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg transition-colors shadow-sm"
                >
                  Register
                </Link>
              </div>
            )}

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="md:hidden pb-3">
          <form onSubmit={handleSearch} className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="w-full bg-slate-900/90 text-sm text-slate-100 placeholder-slate-400 pl-9 pr-16 py-2 rounded-xl border border-slate-700/60 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-amber-500 text-slate-950 text-xs font-bold px-2.5 py-1 rounded-lg"
            >
              Go
            </button>
          </form>
        </div>

        {/* Mobile Menu Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-800 py-3 space-y-1 animate-in fade-in duration-200">
            {navLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-3 py-2 text-sm text-slate-200 hover:bg-slate-800/80 rounded-lg"
                >
                  <span className="flex items-center gap-2">
                    {Icon && <Icon className="w-4 h-4 text-amber-400" />}
                    {item.label}
                  </span>
                  {item.badge && (
                    <span className="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30 px-1.5 py-0.5 rounded font-bold">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
            {user?.role === 'ADMIN' && (
              <Link
                href="/admin/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-amber-400 hover:bg-amber-500/10 rounded-lg font-semibold"
              >
                <ShieldCheck className="w-4 h-4" /> Admin Control Center
              </Link>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
