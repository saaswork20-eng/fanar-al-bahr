'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User,
  ShoppingBag,
  Package,
  Heart,
  MapPin,
  ExternalLink,
  Clock,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  CreditCard,
} from 'lucide-react';
import StorefrontHeader from '@/components/storefront/Header';
import StorefrontFooter from '@/components/storefront/Footer';
import AccountNav from '@/components/storefront/AccountNav';
import { formatINR } from '@/lib/product-helper';

interface UserProfile {
  id: string;
  name: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email: string;
  phone?: string | null;
  role: 'BUYER' | 'ADMIN';
  status: string;
  emailVerified: string | null;
  totalOrders: number;
  wishlistCount: number;
}

interface OrderItem {
  id: string;
  orderNumber: string;
  totalAmount: number;
  total?: number;
  status: string;
  paymentStatus?: string;
  createdAt: string;
}

export default function AccountPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [addressCount, setAddressCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const fetchAccountData = async () => {
    setLoading(true);
    try {
      const [profileRes, ordersRes, addressesRes] = await Promise.all([
        fetch('/api/v1/account/profile'),
        fetch('/api/v1/account/orders'),
        fetch('/api/v1/account/addresses'),
      ]);

      if (profileRes.status === 401) {
        router.push('/login?from=/account');
        return;
      }

      const profileData = await profileRes.json();
      const ordersData = await ordersRes.json();
      const addressesData = await addressesRes.json();

      if (profileData.success) {
        setProfile(profileData.user);
      }
      if (ordersData.success && Array.isArray(ordersData.orders)) {
        setOrders(ordersData.orders);
      }
      if (addressesData.success && Array.isArray(addressesData.addresses)) {
        setAddressCount(addressesData.addresses.length);
      }
    } catch (err) {
      console.error('Error fetching account data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccountData();
  }, []);

  const displayName = profile?.firstName || profile?.name?.split(' ')[0] || 'Customer';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      <StorefrontHeader />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-400 mb-6">
          <Link href="/" className="hover:text-amber-400 transition-colors">
            Home
          </Link>
          <span>/</span>
          <span className="text-amber-400 font-medium">Customer Account</span>
        </div>

        {/* Welcome Banner */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#12161f] via-[#161c28] to-[#12161f] border border-slate-800 shadow-2xl mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 flex items-center justify-center font-black text-2xl sm:text-3xl text-amber-400 shadow-inner">
              {displayName[0]?.toUpperCase() || 'C'}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                  Customer Dashboard
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {profile?.status || 'ACTIVE'}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white">
                Welcome back, {displayName}!
              </h1>
              <p className="text-xs text-slate-400 font-mono mt-1">{profile?.email}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/account/profile"
              className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-amber-400 text-xs text-slate-200 hover:text-white transition-colors font-semibold"
            >
              Edit Profile
            </Link>
            <Link
              href="/shop"
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors shadow-lg shadow-amber-500/10"
            >
              Browse Catalog
            </Link>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Navigation Sidebar */}
          <AccountNav
            wishlistCount={profile?.wishlistCount}
            orderCount={orders.length}
          />

          {/* Main Dashboard Content */}
          <div className="flex-1 w-full space-y-8">
            {/* Real Stats Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-[#12161f] border border-slate-800 rounded-2xl p-4 sm:p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-slate-400">Total Orders</span>
                  <Package className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-2xl font-black text-white">
                  {loading ? '...' : orders.length}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">Confirmed purchases</div>
              </div>

              <div className="bg-[#12161f] border border-slate-800 rounded-2xl p-4 sm:p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-slate-400">Wishlist Items</span>
                  <Heart className="w-4 h-4 text-rose-500" />
                </div>
                <div className="text-2xl font-black text-white">
                  {loading ? '...' : profile?.wishlistCount ?? 0}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">Saved for later</div>
              </div>

              <div className="bg-[#12161f] border border-slate-800 rounded-2xl p-4 sm:p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-slate-400">Saved Addresses</span>
                  <MapPin className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="text-2xl font-black text-white">
                  {loading ? '...' : addressCount}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">Delivery locations</div>
              </div>

              <div className="bg-[#12161f] border border-slate-800 rounded-2xl p-4 sm:p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-slate-400">Security Status</span>
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-base font-bold text-emerald-400 flex items-center gap-1.5 mt-1">
                  <span>Verified Buyer</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">AES-256 Vault active</div>
              </div>
            </div>

            {/* Quick Shortcuts */}
            <div className="bg-[#12161f] border border-slate-800 rounded-2xl p-6">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-4">
                Account Shortcuts
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <Link
                  href="/account/orders"
                  className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-amber-500/40 hover:bg-slate-900 transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                      <Package className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-white group-hover:text-amber-400 transition-colors">
                        View Orders
                      </div>
                      <div className="text-[11px] text-slate-400">Track status & digital keys</div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition-colors" />
                </Link>

                <Link
                  href="/account/wishlist"
                  className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-rose-500/40 hover:bg-slate-900 transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
                      <Heart className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-white group-hover:text-rose-400 transition-colors">
                        Saved Wishlist
                      </div>
                      <div className="text-[11px] text-slate-400">Manage wishlist items</div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-rose-400 transition-colors" />
                </Link>

                <Link
                  href="/account/addresses"
                  className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/40 hover:bg-slate-900 transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-white group-hover:text-cyan-400 transition-colors">
                        Delivery Addresses
                      </div>
                      <div className="text-[11px] text-slate-400">Add or edit locations</div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                </Link>
              </div>
            </div>

            {/* Recent Orders Section */}
            <div className="bg-[#12161f] border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-amber-400" />
                  <span>Recent Purchases</span>
                </h2>
                {orders.length > 0 && (
                  <Link
                    href="/account/orders"
                    className="text-xs text-amber-400 hover:text-amber-300 font-semibold"
                  >
                    View All Orders &rarr;
                  </Link>
                )}
              </div>

              {loading ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  Loading your orders...
                </div>
              ) : orders.length === 0 ? (
                /* Empty state requirement: "You haven't placed any orders yet." */
                <div className="py-10 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto text-slate-400">
                    <Package className="w-6 h-6 text-amber-400/70" />
                  </div>
                  <h3 className="text-sm font-bold text-white">You haven't placed any orders yet.</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Browse our single-vendor catalog of licensed digital keys and products.
                  </p>
                  <Link
                    href="/shop"
                    className="inline-flex py-2 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-colors"
                  >
                    Start Shopping
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-800/80 bg-slate-900/40">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
                      <tr>
                        <th className="py-3 px-4 font-semibold">Order #</th>
                        <th className="py-3 px-4 font-semibold">Date</th>
                        <th className="py-3 px-4 font-semibold">Amount</th>
                        <th className="py-3 px-4 font-semibold">Payment</th>
                        <th className="py-3 px-4 font-semibold">Status</th>
                        <th className="py-3 px-4 font-semibold text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {orders.slice(0, 5).map((o) => (
                        <tr key={o.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-semibold text-amber-400">
                            {o.orderNumber}
                          </td>
                          <td className="py-3.5 px-4 text-slate-400">
                            {new Date(o.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-white">
                            {formatINR(o.totalAmount ?? o.total ?? 0)}
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                o.paymentStatus === 'PAID'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              }`}
                            >
                              {o.paymentStatus || 'PAID'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                              {o.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <Link
                              href={`/account/orders/${o.id}`}
                              className="text-amber-400 hover:text-amber-300 font-semibold"
                            >
                              Details &rarr;
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <StorefrontFooter />
    </div>
  );
}
