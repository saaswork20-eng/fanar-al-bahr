import React from 'react';
import type { Metadata } from 'next';
import StorefrontHeader from '@/components/storefront/Header';
import StorefrontFooter from '@/components/storefront/Footer';
import { FileText, CheckCircle, AlertCircle, ShoppingBag } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Terms of Service — FANAR AL BHAR',
  description: 'Terms of service and customer conditions for Fanar Al Bhar.',
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-[#070a0f] text-slate-100 flex flex-col font-sans">
      <StorefrontHeader />

      <main className="flex-1 py-14 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
        <div className="space-y-3 mb-10 pb-8 border-b border-slate-800">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold">
            <FileText className="w-3.5 h-3.5" /> Customer Agreement
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white">Terms of Service</h1>
          <p className="text-xs text-slate-400">
            Last Updated: September 2026 | Fanar Al Bhar Single-Vendor Operations
          </p>
        </div>

        <div className="space-y-8 text-xs text-slate-300 leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-cyan-400" /> 1. Single-Vendor Retail Model
            </h2>
            <p>
              Fanar Al Bhar is the sole owner, distributor, and vendor of all products listed on this website. There are no independent third-party sellers, open marketplace vendors, or peer-to-peer sellers. Every order is contracted directly between the buyer and Fanar Al Bhar.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" /> 2. Digital Key Activation & Delivery
            </h2>
            <p>
              Digital activation keys are delivered automatically to your buyer account upon confirmed payment receipt. Keys must be redeemed on their respective official platforms (e.g., Steam, PlayStation Network, Xbox Live, Microsoft Store, EA App).
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400" /> 3. Order Validity & Pricing
            </h2>
            <p>
              All prices, discounts, coupons, taxes, and shipping rates are calculated and verified authoritatively on Fanar Al Bhar’s servers. In the event of a genuine technical pricing error, we reserve the right to cancel an order and immediately return all remitted funds.
            </p>
          </section>
        </div>
      </main>

      <StorefrontFooter />
    </div>
  );
}
