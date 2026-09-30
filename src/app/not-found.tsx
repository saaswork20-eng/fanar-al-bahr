import React from 'react';
import Link from 'next/link';
import StorefrontHeader from '@/components/storefront/Header';
import StorefrontFooter from '@/components/storefront/Footer';
import { PackageX, ShoppingBag, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#070a0f] text-slate-100 flex flex-col font-sans">
      <StorefrontHeader />

      <main className="flex-1 flex items-center justify-center py-20 px-4">
        <div className="max-w-md w-full text-center space-y-6 bg-slate-950/60 border border-slate-800 p-8 sm:p-10 rounded-3xl shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mx-auto">
            <PackageX className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-xs uppercase font-mono font-bold text-amber-400 tracking-wider">
              404 — Item Not Found
            </span>
            <h1 className="text-2xl font-black text-white">
              Page or Product Unavailable
            </h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              The product, category, or page you requested does not exist or may have been unlisted from our catalog.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link
              href="/shop"
              className="flex-1 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all"
            >
              <ShoppingBag className="w-4 h-4" /> Browse Catalog
            </Link>
            <Link
              href="/"
              className="flex-1 py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 font-semibold text-xs flex items-center justify-center gap-2 transition-all"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Home
            </Link>
          </div>
        </div>
      </main>

      <StorefrontFooter />
    </div>
  );
}
