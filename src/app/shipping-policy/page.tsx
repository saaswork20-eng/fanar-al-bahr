import React from 'react';
import type { Metadata } from 'next';
import StorefrontHeader from '@/components/storefront/Header';
import StorefrontFooter from '@/components/storefront/Footer';
import { Truck, Zap, Package, MapPin } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Shipping Policy — FANAR AL BHAR',
  description: 'Instant digital delivery and physical shipment fulfillment terms.',
};

export default function ShippingPolicyPage() {
  return (
    <div className="min-h-screen bg-[#070a0f] text-slate-100 flex flex-col font-sans">
      <StorefrontHeader />

      <main className="flex-1 py-14 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
        <div className="space-y-3 mb-10 pb-8 border-b border-slate-800">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold">
            <Truck className="w-3.5 h-3.5" /> Order Fulfillment
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white">Shipping & Delivery Policy</h1>
          <p className="text-xs text-slate-400">
            Learn how digital products and physical merchandise are delivered by Fanar Al Bhar.
          </p>
        </div>

        <div className="space-y-8 text-xs text-slate-300 leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-400" /> 1. Digital License Products — Instant Delivery
            </h2>
            <p>
              Digital products (PC games, console game codes, software licenses, gift cards) incur <strong>₹0 shipping charges</strong> and require no physical mailing address.
            </p>
            <p>
              Upon confirmed payment receipt, the cryptographic vault unseals your activation keys instantly and displays them in your <a href="/account/orders" className="text-cyan-400 hover:underline">Customer Orders</a> screen. An email notification confirming your payment is simultaneously dispatched.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Package className="w-4 h-4 text-cyan-400" /> 2. Physical Merchandise Fulfillment
            </h2>
            <p>
              For physical merchandise (hardware, accessories), shipping fees are calculated transparently server-side during checkout:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-400">
              <li><strong>Free Standard Express Shipping:</strong> Available on all physical orders with a cart subtotal of <strong>₹999 or higher</strong>.</li>
              <li><strong>Standard Express Shipping:</strong> Flat rate of <strong>₹99</strong> on physical orders below ₹999.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-400" /> 3. Real Shipment Tracking
            </h2>
            <p>
              When your physical package is dispatched from our Mumbai fulfillment center, our administrators register the verified tracking number into your order details. You can track package transit directly in your buyer orders dashboard.
            </p>
          </section>
        </div>
      </main>

      <StorefrontFooter />
    </div>
  );
}
