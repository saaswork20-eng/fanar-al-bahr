'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar,
  ShieldAlert,
  ShieldCheck,
  Package,
  MapPin,
  Clock,
  AlertCircle,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { formatINR } from '@/lib/product-helper';

interface CustomerDetail {
  id: string;
  email: string;
  name: string | null;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  role: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'BANNED';
  emailVerified: string | null;
  createdAt: string;
  orderCount: number;
  paidOrderCount: number;
  totalSpent: number;
  addresses: any[];
  orders: any[];
}

export default function AdminCustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;

  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchCustomerDetails = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/v1/admin/customers/${customerId}`);
      if (res.status === 401 || res.status === 403) {
        router.push('/login?from=/admin/customers');
        return;
      }
      const data = await res.json();
      if (data.success && data.customer) {
        setCustomer(data.customer);
      }
    } catch (err) {
      console.error('Error fetching customer details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (customerId) fetchCustomerDetails();
  }, [customerId]);

  const handleToggleStatus = async () => {
    if (!customer) return;
    const newStatus = customer.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    const confirmMsg =
      newStatus === 'SUSPENDED'
        ? 'Are you sure you want to suspend this customer account? They will not be able to log in or purchase.'
        : 'Are you sure you want to reactivate this customer account?';

    if (!confirm(confirmMsg)) return;

    try {
      setUpdatingStatus(true);
      const res = await fetch(`/api/v1/admin/customers/${customer.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage({
          type: 'success',
          text: `Customer status updated to ${newStatus} successfully.`,
        });
        fetchCustomerDetails();
      } else {
        setStatusMessage({
          type: 'error',
          text: data.error || 'Failed to update customer status.',
        });
      }
    } catch {
      setStatusMessage({
        type: 'error',
        text: 'Network error updating customer status.',
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#070a0f] text-slate-100 font-sans">
      <AdminSidebar />

      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header */}
        <header className="h-16 border-b border-slate-800 bg-[#0d1117]/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/customers"
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="font-bold text-base text-white">Customer Profile & Order History</h1>
          </div>
          <div className="text-xs text-slate-400 font-mono">
            {customerId}
          </div>
        </header>

        <div className="p-6 sm:p-8 max-w-7xl w-full mx-auto space-y-6">
          {/* Status Message */}
          {statusMessage && (
            <div
              className={`p-4 rounded-xl border text-xs flex items-center gap-3 shadow-lg ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-950/80 border-rose-500/40 text-rose-300'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {loading ? (
            <div className="py-20 text-center text-slate-400 text-xs">
              Loading customer record...
            </div>
          ) : !customer ? (
            <div className="p-12 text-center text-slate-400 space-y-2 bg-[#12161f] rounded-2xl border border-slate-800">
              <p className="text-base font-bold text-white">Customer record not found</p>
              <Link href="/admin/customers" className="text-amber-400 text-xs hover:underline">
                Back to Customers List
              </Link>
            </div>
          ) : (
            <>
              {/* Profile Card & Controls */}
              <div className="p-6 sm:p-8 rounded-3xl bg-[#12161f] border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                  <div className="h-16 w-16 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center font-black text-2xl text-amber-400">
                    {(customer.name || customer.email)[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-xl font-bold text-white">
                        {customer.name || `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'Anonymous Buyer'}
                      </h2>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          customer.status === 'ACTIVE'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {customer.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-mono">{customer.email}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Member since {new Date(customer.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Account Actions Gate */}
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={handleToggleStatus}
                    disabled={updatingStatus}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
                      customer.status === 'ACTIVE'
                        ? 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30'
                    }`}
                  >
                    {updatingStatus ? (
                      'Updating...'
                    ) : customer.status === 'ACTIVE' ? (
                      <>
                        <ShieldAlert className="w-4 h-4 text-rose-400" />
                        <span>Suspend Account</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        <span>Reactivate Account</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Statistics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-[#12161f] border border-slate-800">
                  <span className="text-xs font-medium text-slate-400 block mb-1">Total Purchases</span>
                  <span className="text-2xl font-black text-white">{customer.orderCount} Orders</span>
                </div>
                <div className="p-5 rounded-2xl bg-[#12161f] border border-slate-800">
                  <span className="text-xs font-medium text-slate-400 block mb-1">Paid Orders</span>
                  <span className="text-2xl font-black text-emerald-400">{customer.paidOrderCount} Confirmed</span>
                </div>
                <div className="p-5 rounded-2xl bg-[#12161f] border border-slate-800">
                  <span className="text-xs font-medium text-slate-400 block mb-1">Lifetime Value (LTV)</span>
                  <span className="text-2xl font-black text-amber-400">{formatINR(customer.totalSpent)}</span>
                </div>
              </div>

              {/* Saved Addresses */}
              <div className="bg-[#12161f] border border-slate-800 rounded-2xl p-6">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-cyan-400" />
                  <span>Customer Delivery Addresses ({customer.addresses?.length || 0})</span>
                </h3>
                {(!customer.addresses || customer.addresses.length === 0) ? (
                  <p className="text-xs text-slate-500">No delivery addresses registered for this customer.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {customer.addresses.map((a: any) => (
                      <div key={a.id} className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 text-xs text-slate-300 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white">{a.fullName}</span>
                          {a.isDefault && (
                            <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-slate-400">{a.phone}</p>
                        <p>{a.addressLine}</p>
                        <p>{a.city}, {a.state} - {a.postalCode}, {a.country}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Order History */}
              <div className="bg-[#12161f] border border-slate-800 rounded-2xl p-6">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Package className="w-4 h-4 text-amber-400" />
                  <span>Customer Order History</span>
                </h3>
                {(!customer.orders || customer.orders.length === 0) ? (
                  <p className="text-xs text-slate-500">No orders placed by this customer yet.</p>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/40">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
                        <tr>
                          <th className="py-3 px-4 font-semibold">Order Reference</th>
                          <th className="py-3 px-4 font-semibold">Date</th>
                          <th className="py-3 px-4 font-semibold">Amount</th>
                          <th className="py-3 px-4 font-semibold">Payment Status</th>
                          <th className="py-3 px-4 font-semibold">Fulfillment</th>
                          <th className="py-3 px-4 font-semibold text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {customer.orders.map((o: any) => (
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
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300">
                                {o.status}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <Link
                                href={`/admin/orders/${o.id}`}
                                className="text-amber-400 hover:text-amber-300 font-semibold"
                              >
                                View Order &rarr;
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
