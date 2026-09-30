import React from 'react';
import type { Metadata } from 'next';
import StorefrontHeader from '@/components/storefront/Header';
import StorefrontFooter from '@/components/storefront/Footer';
import { RotateCcw, CheckCircle2, AlertOctagon, HelpCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Refund & Returns Policy — FANAR AL BHAR',
  description: 'Refund terms and warranty guidelines for digital licenses and physical goods.',
};

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-[#070a0f] text-slate-100 flex flex-col font-sans">
      <StorefrontHeader />

      <main className="flex-1 py-14 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
        <div className="space-y-3 mb-10 pb-8 border-b border-slate-800">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold">
            <RotateCcw className="w-3.5 h-3.5" /> Buyer Warranty
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white">Refund & Return Policy</h1>
          <p className="text-xs text-slate-400">
            Clear, transparent policies for digital activation keys and physical store goods.
          </p>
        </div>

        <div className="space-y-8 text-xs text-slate-300 leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> 1. Digital License Keys & Software
            </h2>
            <p>
              Due to the unique, one-time nature of cryptographic activation keys, once a digital product key has been <strong>unsealed and revealed</strong> by the buyer in their account dashboard, it cannot be returned or cancelled unless determined to be defective by publisher activation servers.
            </p>
            <p>
              If an unsealed key fails activation with a verifiable publisher error (e.g., duplicated or region mismatch), our support team will replace the key immediately from our reserve inventory or issue a full refund within 24-48 business hours.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-cyan-400" /> 2. Physical Merchandise Returns
            </h2>
            <p>
              Physical items (gaming hardware, accessories, boxed software) may be returned within 7 days of delivery provided the packaging remains unopened, untampered, and with all original seals intact.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-amber-400" /> 3. Initiating a Resolution Request
            </h2>
            <p>
              To report an issue or request an authorized refund, navigate to your <a href="/account/orders" className="text-cyan-400 hover:underline">Order History</a> and click on your order, or reach out directly to <a href="mailto:support@fanar.com" className="text-cyan-400 hover:underline">support@fanar.com</a> with your Order Number (e.g., <code>FAB-ORD-1002</code>).
            </p>
          </section>
        </div>
      </main>

      <StorefrontFooter />
    </div>
  );
}
