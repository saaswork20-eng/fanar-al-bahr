'use client';

import React, { useEffect, useState } from 'react';
import {
  Settings,
  Store,
  CreditCard,
  ShieldCheck,
  Save,
  CheckCircle2,
  XCircle,
  RefreshCw,
  X,
  Lock,
  Percent,
  Truck,
  Mail,
  Phone,
  MapPin,
  Star,
} from 'lucide-react';
import AdminSidebar from '@/components/admin/AdminSidebar';

interface StoreSettingsData {
  storeName: string;
  storeDescription: string;
  logoUrl: string | null;
  contactEmail: string;
  contactPhone: string;
  address: string;
  currency: string;
  taxRatePercent: number;
  shippingRate: number;
  freeShippingThreshold: number;
  enableGuestCheckout: boolean;
  autoApproveReviews: boolean;
  lowStockThreshold: number;
  paymentStatus: {
    razorpayConfigured: boolean;
    stripeConfigured: boolean;
    codEnabled: boolean;
  };
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<StoreSettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/admin/settings');
      const json = await res.json();
      if (json.success) {
        setSettings(json.settings);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    setSaving(true);
    try {
      const res = await fetch('/api/v1/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const json = await res.json();
      if (json.success) {
        setMessage({ type: 'success', text: 'Store settings saved successfully.' });
        fetchSettings();
      } else {
        setMessage({ type: 'error', text: json.error || 'Failed to save settings.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error occurred while saving.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070a0f] text-slate-100 flex">
      <AdminSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 px-6 md:px-8 border-b border-[#232a3b] bg-[#0c1017]/80 backdrop-blur-md flex items-center justify-between sticky top-0 z-30">
          <div className="pl-12 md:pl-0">
            <h1 className="font-black text-base text-white flex items-center gap-2">
              <Settings className="w-4 h-4 text-amber-400" />
              <span>Store Settings & Configuration</span>
            </h1>
            <p className="text-xs text-slate-400">Manage business details, commerce rules, and provider integrations</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchSettings}
              disabled={loading}
              className="p-2 rounded-xl bg-[#12161f] border border-[#232a3b] text-slate-400 hover:text-white transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-6 md:p-8 space-y-6 max-w-4xl">
          {message && (
            <div
              className={`p-4 rounded-xl text-xs flex items-center justify-between ${
                message.type === 'success'
                  ? 'bg-emerald-950/40 border border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-950/40 border border-rose-500/40 text-rose-300'
              }`}
            >
              <span>{message.text}</span>
              <button onClick={() => setMessage(null)} className="p-1 hover:opacity-80">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {loading || !settings ? (
            <div className="p-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
              <span>Loading store settings...</span>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-6">
              {/* 1. STORE PROFILE */}
              <div className="p-6 rounded-2xl bg-[#0e121a] border border-[#232a3b] space-y-4">
                <div className="flex items-center gap-2.5 border-b border-[#232a3b] pb-3">
                  <Store className="w-4 h-4 text-amber-400" />
                  <h3 className="font-bold text-sm text-white">Store Identity & Contact</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="text-slate-400 block mb-1">Store Name</label>
                    <input
                      type="text"
                      required
                      value={settings.storeName}
                      onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-[#141a24] border border-[#283247] text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Store Logo URL</label>
                    <input
                      type="text"
                      value={settings.logoUrl || ''}
                      onChange={(e) => setSettings({ ...settings, logoUrl: e.target.value || null })}
                      className="w-full px-3 py-2 rounded-xl bg-[#141a24] border border-[#283247] text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-slate-400 block mb-1">Store Description</label>
                    <textarea
                      rows={2}
                      value={settings.storeDescription}
                      onChange={(e) => setSettings({ ...settings, storeDescription: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-[#141a24] border border-[#283247] text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Customer Support Email</label>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={settings.contactEmail}
                        onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#141a24] border border-[#283247] text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Customer Support Phone</label>
                    <div className="relative">
                      <Phone className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={settings.contactPhone}
                        onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#141a24] border border-[#283247] text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-slate-400 block mb-1">Commercial Physical Address</label>
                    <div className="relative">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                      <textarea
                        rows={2}
                        value={settings.address}
                        onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#141a24] border border-[#283247] text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. COMMERCE & TAX */}
              <div className="p-6 rounded-2xl bg-[#0e121a] border border-[#232a3b] space-y-4">
                <div className="flex items-center gap-2.5 border-b border-[#232a3b] pb-3">
                  <Truck className="w-4 h-4 text-cyan-400" />
                  <h3 className="font-bold text-sm text-white">Commerce, Taxes & Shipping</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="text-slate-400 block mb-1">Store Currency</label>
                    <input
                      type="text"
                      disabled
                      value={settings.currency}
                      className="w-full px-3 py-2 rounded-xl bg-[#141a24] border border-[#283247] text-slate-400 font-mono"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">Locked to Indian Rupee (INR)</span>
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Tax Rate (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={settings.taxRatePercent}
                      onChange={(e) =>
                        setSettings({ ...settings, taxRatePercent: Number(e.target.value) || 0 })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-[#141a24] border border-[#283247] text-white font-mono focus:outline-none focus:border-amber-500"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">Applied to physical shipments</span>
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Standard Physical Shipping (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={settings.shippingRate}
                      onChange={(e) =>
                        setSettings({ ...settings, shippingRate: Number(e.target.value) || 0 })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-[#141a24] border border-[#283247] text-white font-mono focus:outline-none focus:border-amber-500"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">Digital orders are always ₹0</span>
                  </div>
                </div>
              </div>

              {/* 3. CUSTOMER & REVIEWS POLICY */}
              <div className="p-6 rounded-2xl bg-[#0e121a] border border-[#232a3b] space-y-4">
                <div className="flex items-center gap-2.5 border-b border-[#232a3b] pb-3">
                  <Star className="w-4 h-4 text-indigo-400" />
                  <h3 className="font-bold text-sm text-white">Customer & Reviews Policy</h3>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-[#141a24] border border-[#283247]">
                    <div>
                      <span className="font-semibold text-white block">Auto-Approve Verified Reviews</span>
                      <span className="text-[11px] text-slate-400 block">
                        Publish reviews immediately if submitted by a verified buyer with confirmed order
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.autoApproveReviews}
                      onChange={(e) =>
                        setSettings({ ...settings, autoApproveReviews: e.target.checked })
                      }
                      className="rounded bg-[#0e121a] border-[#283247] text-amber-500 w-4 h-4"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-[#141a24] border border-[#283247]">
                    <div>
                      <span className="font-semibold text-white block">Allow Guest Checkout</span>
                      <span className="text-[11px] text-slate-400 block">
                        Permit purchasing without creating a customer account (Disabled for single-vendor key safety)
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      disabled
                      checked={settings.enableGuestCheckout}
                      className="rounded bg-[#0e121a] border-[#283247] text-slate-600 w-4 h-4 cursor-not-allowed opacity-50"
                    />
                  </div>
                </div>
              </div>

              {/* 4. PAYMENT PROVIDER STATUS (NEVER EXPOSES SECRETS) */}
              <div className="p-6 rounded-2xl bg-[#0e121a] border border-[#232a3b] space-y-4">
                <div className="flex items-center justify-between border-b border-[#232a3b] pb-3">
                  <div className="flex items-center gap-2.5">
                    <CreditCard className="w-4 h-4 text-emerald-400" />
                    <h3 className="font-bold text-sm text-white">Payment Gateway Status</h3>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-400">
                    <Lock className="w-3 h-3" />
                    <span>Secrets Masked</span>
                  </div>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="p-3.5 rounded-xl bg-[#141a24] border border-[#283247] flex items-center justify-between">
                    <div>
                      <span className="font-bold text-white block">Razorpay Gateway (UPI, Cards, Netbanking)</span>
                      <span className="text-[11px] text-slate-400">India primary checkout integration</span>
                    </div>
                    <span
                      className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded border ${
                        settings.paymentStatus.razorpayConfigured
                          ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/40'
                          : 'bg-amber-950/60 text-amber-400 border-amber-800/40'
                      }`}
                    >
                      {settings.paymentStatus.razorpayConfigured ? 'CONFIGURED (LIVE/SANDBOX)' : 'NOT CONFIGURED'}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#141a24] border border-[#283247] flex items-center justify-between">
                    <div>
                      <span className="font-bold text-white block">Stripe Gateway (International Cards)</span>
                      <span className="text-[11px] text-slate-400">Global credit/debit card processing</span>
                    </div>
                    <span
                      className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded border ${
                        settings.paymentStatus.stripeConfigured
                          ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/40'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {settings.paymentStatus.stripeConfigured ? 'CONFIGURED' : 'NOT CONFIGURED'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex items-center justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50 transition-all"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Saving...' : 'Save Settings'}</span>
                </button>
              </div>
            </form>
          )}
        </main>
      </div>
    </div>
  );
}
