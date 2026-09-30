'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Shield,
  LayoutDashboard,
  Users,
  Package,
  Layers,
  ShoppingBag,
  Star,
  BarChart3,
  Settings,
  Boxes,
  UserCheck,
  LogOut,
  ExternalLink,
  Search,
  X,
  Loader2,
  Menu,
  Tag,
} from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
}

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{
    products: any[];
    orders: any[];
    customers: any[];
  } | null>(null);
  const [searching, setSearching] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems: NavItem[] = [
    {
      name: 'Dashboard',
      href: '/admin/dashboard',
      icon: LayoutDashboard,
      active: pathname === '/admin' || pathname === '/admin/dashboard',
    },
    {
      name: 'Products',
      href: '/admin/products',
      icon: Package,
      active: pathname.startsWith('/admin/products'),
    },
    {
      name: 'Categories',
      href: '/admin/categories',
      icon: Layers,
      active: pathname.startsWith('/admin/categories'),
    },
    {
      name: 'Inventory',
      href: '/admin/inventory',
      icon: Boxes,
      active: pathname.startsWith('/admin/inventory'),
    },
    {
      name: 'Orders',
      href: '/admin/orders',
      icon: ShoppingBag,
      active: pathname.startsWith('/admin/orders'),
    },
    {
      name: 'Customers',
      href: '/admin/customers',
      icon: Users,
      active: pathname.startsWith('/admin/customers') || pathname.startsWith('/admin/users'),
    },
    {
      name: 'Reviews',
      href: '/admin/reviews',
      icon: Star,
      active: pathname.startsWith('/admin/reviews'),
    },
    {
      name: 'Analytics',
      href: '/admin/analytics',
      icon: BarChart3,
      active: pathname.startsWith('/admin/analytics'),
    },
    {
      name: 'Coupons',
      href: '/admin/coupons',
      icon: Tag,
      active: pathname.startsWith('/admin/coupons'),
    },
    {
      name: 'Settings',
      href: '/admin/settings',
      icon: Settings,
      active: pathname.startsWith('/admin/settings'),
    },
    {
      name: 'Profile',
      href: '/admin/profile',
      icon: UserCheck,
      active: pathname.startsWith('/admin/profile'),
    },
  ];

  const handleLogout = async () => {
    try {
      await fetch('/api/v1/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error(e);
    }
    router.push('/admin/login');
    router.refresh();
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(`/api/v1/admin/search?q=${encodeURIComponent(searchQuery.trim())}`);
      const data = await res.json();
      if (data.success) {
        setSearchResults(data.results);
      }
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setSearching(false);
    }
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="md:hidden fixed top-3 left-3 z-50 p-2.5 rounded-xl bg-[#12161f] border border-[#232a3b] text-slate-300 hover:text-white shadow-lg"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Backdrop for mobile */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:sticky top-0 h-screen w-64 bg-[#0a0c10] border-r border-[#232a3b] flex flex-col flex-shrink-0 z-40 transition-transform duration-200 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } text-slate-300`}
      >
        {/* Brand Header */}
        <div className="h-16 px-5 border-b border-[#232a3b] flex items-center justify-between">
          <Link href="/admin/dashboard" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Shield className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <span className="font-black text-sm tracking-wider text-white block uppercase">FANAR COMMAND</span>
              <span className="text-[10px] text-amber-400 font-mono tracking-tight uppercase">Single-Vendor Admin</span>
            </div>
          </Link>
          <Link
            href="/"
            target="_blank"
            title="Open Customer Storefront"
            className="p-1 rounded text-slate-400 hover:text-white transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Global Search Button */}
        <div className="p-3">
          <button
            onClick={() => setSearchOpen(true)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-[#12161f] border border-[#232a3b] hover:border-slate-600 text-xs text-slate-400 hover:text-slate-200 transition-all text-left"
          >
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <span>Search products, orders...</span>
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#1c2230] text-slate-400 border border-[#283247]">
              /
            </span>
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 py-1 px-3 space-y-1 overflow-y-auto">
          <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Store Operations
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  item.active
                    ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-[#181e2b]'
                }`}
              >
                <Icon className={`w-4 h-4 ${item.active ? 'text-amber-400' : 'text-slate-400'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>

        {/* Admin Session Profile & Logout */}
        <div className="p-3 border-t border-[#232a3b]">
          <div className="p-2.5 rounded-xl bg-[#12161f] border border-[#232a3b] flex items-center justify-between">
            <Link href="/admin/profile" className="min-w-0 pr-2 block group">
              <span className="text-xs font-bold text-white group-hover:text-amber-300 block truncate transition-colors">
                Store Owner
              </span>
              <span className="text-[10px] text-slate-400 font-mono block truncate">admin@fanar.com</span>
            </Link>
            <button
              onClick={handleLogout}
              title="Sign out of Admin Console"
              className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 border border-rose-900/30 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Global Search Modal */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-start justify-center pt-20 p-4">
          <div className="w-full max-w-2xl bg-[#0f131c] border border-[#2a3449] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <form onSubmit={handleSearch} className="p-4 border-b border-[#232a3b] flex items-center gap-3">
              <Search className="w-5 h-5 text-amber-400 flex-shrink-0" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search across Products, Orders, and Customers..."
                className="flex-1 bg-transparent text-white placeholder-slate-500 text-sm focus:outline-none"
              />
              {searching ? (
                <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setSearchOpen(false);
                    setSearchResults(null);
                    setSearchQuery('');
                  }}
                  className="p-1 rounded text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </form>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {!searchResults && !searching && (
                <div className="text-center py-10 text-xs text-slate-500">
                  Type a keyword and press Enter to search products, orders, or registered buyers.
                </div>
              )}

              {searchResults && (
                <>
                  {/* Products Results */}
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
                      <span>Products ({searchResults.products.length})</span>
                    </div>
                    {searchResults.products.length === 0 ? (
                      <p className="text-xs text-slate-500 italic">No matching products found.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {searchResults.products.map((p) => (
                          <Link
                            key={p.id}
                            href={`/admin/products/${p.id}/edit`}
                            onClick={() => setSearchOpen(false)}
                            className="flex items-center justify-between p-2.5 rounded-xl bg-[#141a26] hover:bg-[#1a2233] border border-[#232d40] text-xs transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <img
                                src={p.coverImageUrl}
                                alt={p.title}
                                className="w-8 h-8 rounded object-cover border border-[#232d40]"
                              />
                              <div>
                                <span className="font-semibold text-white block">{p.title}</span>
                                <span className="text-[10px] text-slate-400 font-mono">SKU: {p.sku || 'N/A'}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="font-bold text-amber-300 block">₹{p.price}</span>
                              <span className="text-[10px] text-slate-400">Stock: {p.stock}</span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Orders Results */}
                  <div className="border-t border-[#232a3b] pt-3">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
                      <span>Orders ({searchResults.orders.length})</span>
                    </div>
                    {searchResults.orders.length === 0 ? (
                      <p className="text-xs text-slate-500 italic">No matching orders found.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {searchResults.orders.map((o) => (
                          <Link
                            key={o.id}
                            href={`/admin/orders/${o.id}`}
                            onClick={() => setSearchOpen(false)}
                            className="flex items-center justify-between p-2.5 rounded-xl bg-[#141a26] hover:bg-[#1a2233] border border-[#232d40] text-xs transition-colors"
                          >
                            <div>
                              <span className="font-semibold text-white block">{o.orderNumber}</span>
                              <span className="text-[10px] text-slate-400">{o.buyerName}</span>
                            </div>
                            <div className="text-right">
                              <span className="font-bold text-emerald-400 block">₹{o.totalAmount}</span>
                              <span className="text-[10px] text-amber-300 uppercase font-mono">{o.status}</span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Customers Results */}
                  <div className="border-t border-[#232a3b] pt-3">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
                      <span>Customers ({searchResults.customers.length})</span>
                    </div>
                    {searchResults.customers.length === 0 ? (
                      <p className="text-xs text-slate-500 italic">No matching customers found.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {searchResults.customers.map((c) => (
                          <Link
                            key={c.id}
                            href={`/admin/customers/${c.id}`}
                            onClick={() => setSearchOpen(false)}
                            className="flex items-center justify-between p-2.5 rounded-xl bg-[#141a26] hover:bg-[#1a2233] border border-[#232d40] text-xs transition-colors"
                          >
                            <div>
                              <span className="font-semibold text-white block">{c.name}</span>
                              <span className="text-[10px] text-slate-400 font-mono">{c.email}</span>
                            </div>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-[#1c2436] text-amber-300 border border-[#2b3752]">
                              {c.status}
                            </span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
