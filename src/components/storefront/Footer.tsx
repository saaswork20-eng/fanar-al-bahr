import React from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Zap,
  Lock,
  Headphones,
  Mail,
  CheckCircle2,
  RefreshCw,
  Globe,
  Award,
} from 'lucide-react';

export default function StorefrontFooter() {
  return (
    <footer className="border-t border-slate-800/80 bg-[#05070a] text-slate-400 text-sm">
      {/* Trust Badges Strip */}
      <div className="border-b border-slate-800/60 bg-slate-900/40 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-100 text-sm">Instant Delivery</h4>
                <p className="text-xs text-slate-400">Automated key release within seconds</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-100 text-sm">100% Genuine</h4>
                <p className="text-xs text-slate-400">Direct authorized single-vendor keys</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-100 text-sm">AES-256 Vault</h4>
                <p className="text-xs text-slate-400">Military-grade key encryption</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                <Headphones className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-100 text-sm">Verified Support</h4>
                <p className="text-xs text-slate-400">Dedicated assistance for buyers</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-indigo-600 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-slate-950 font-bold" />
              </div>
              <span className="text-lg font-black tracking-wider text-white font-mono">
                FANAR <span className="text-amber-400">AL BHAR</span>
              </span>
            </Link>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              Fanar Al Bhar is a specialized direct digital store providing authentic PC & console games,
              verified software licenses, and prepaid digital cards with zero marketplace intermediaries.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Mail className="w-4 h-4 text-amber-400" />
              <span>support@fanar.com</span>
            </div>
          </div>

          {/* Catalog Links */}
          <div>
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-3">Catalog</h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/shop" className="hover:text-amber-400 transition-colors">
                  All Products
                </Link>
              </li>
              <li>
                <Link href="/category/video-games" className="hover:text-amber-400 transition-colors">
                  Video Games
                </Link>
              </li>
              <li>
                <Link href="/category/software-os" className="hover:text-amber-400 transition-colors">
                  Software & OS
                </Link>
              </li>
              <li>
                <Link href="/category/subscriptions-gift-cards" className="hover:text-amber-400 transition-colors">
                  Subscriptions & Gift Cards
                </Link>
              </li>
              <li>
                <Link href="/shop?onSale=true" className="hover:text-amber-400 transition-colors">
                  Flash Sales & Discounts
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Care */}
          <div>
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-3">Customer Support</h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/account" className="hover:text-amber-400 transition-colors">
                  My Orders & Digital Keys
                </Link>
              </li>
              <li>
                <Link href="/shop" className="hover:text-amber-400 transition-colors">
                  Digital Key Activation Guide
                </Link>
              </li>
              <li>
                <Link href="/shop" className="hover:text-amber-400 transition-colors">
                  Instant Dispatch Policy
                </Link>
              </li>
              <li>
                <Link href="/shop" className="hover:text-amber-400 transition-colors">
                  Warranty & Refund Policy
                </Link>
              </li>
              <li>
                <Link href="/shop" className="hover:text-amber-400 transition-colors">
                  Buyer Protection Terms
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Security */}
          <div>
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-3">Security & Trust</h3>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center gap-1.5 text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Authorized Stock Only
              </li>
              <li className="flex items-center gap-1.5 text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Direct Single-Vendor Store
              </li>
              <li className="flex items-center gap-1.5 text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> 256-Bit SSL Encryption
              </li>
              <li className="flex items-center gap-1.5 text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Zero Middleman Fees
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-800/80 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} FANAR AL BHAR. All rights reserved. Personal Single-Vendor E-Commerce Platform.</p>
          <div className="flex items-center gap-6">
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
            <span>Key Delivery Security</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
