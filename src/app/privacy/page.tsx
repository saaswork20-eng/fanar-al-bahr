import React from 'react';
import type { Metadata } from 'next';
import StorefrontHeader from '@/components/storefront/Header';
import StorefrontFooter from '@/components/storefront/Footer';
import { ShieldCheck, Lock, Eye, Server, RefreshCw } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy — FANAR AL BHAR',
  description: 'Privacy policy and data protection disclosures for Fanar Al Bhar single-vendor store.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#070a0f] text-slate-100 flex flex-col font-sans">
      <StorefrontHeader />

      <main className="flex-1 py-14 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
        <div className="space-y-3 mb-10 pb-8 border-b border-slate-800">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" /> Data Security & Compliance
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white">Privacy Policy</h1>
          <p className="text-xs text-slate-400">
            Last Updated: September 2026 | Effective Date: September 2026
          </p>
        </div>

        <div className="space-y-8 text-xs text-slate-300 leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Eye className="w-4 h-4 text-cyan-400" /> 1. Overview & Information We Collect
            </h2>
            <p>
              Fanar Al Bhar is a single-vendor retail platform. We collect information necessary to fulfill your orders, provide cryptographic key unsealing, deliver physical merchandise, and maintain secure authentication.
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-400">
              <li><strong>Account Identification:</strong> Full name, verified email address, contact telephone number, and encrypted credentials.</li>
              <li><strong>Order Data:</strong> Line items, invoice amounts, payment reference identifiers, and delivery timestamps.</li>
              <li><strong>Physical Shipping:</strong> Delivery addresses provided strictly for physical product shipments.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-400" /> 2. Hardware-Grade Encryption & Vault Security
            </h2>
            <p>
              All digital activation codes, license keys, and security credentials are encrypted at rest using AES-256-GCM. Keys are decrypted solely in server memory at the exact instant an authorized buyer initiates reveal in their account orders center. We never store plaintext keys in public databases.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Server className="w-4 h-4 text-indigo-400" /> 3. Payment Processing & No Card Retention
            </h2>
            <p>
              Fanar Al Bhar never stores, processes, or captures full credit card numbers or banking passwords. Payments are processed securely via verified compliant payment gateways (Razorpay / Stripe) using tokenized server sessions and signature-verified webhook callbacks.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-amber-400" /> 4. Zero Third-Party Sharing
            </h2>
            <p>
              Because Fanar Al Bhar operates strictly as a single-vendor store without marketplace sellers, your customer data is never sold, leased, or distributed to third-party merchants or marketing syndicates.
            </p>
          </section>
        </div>
      </main>

      <StorefrontFooter />
    </div>
  );
}
