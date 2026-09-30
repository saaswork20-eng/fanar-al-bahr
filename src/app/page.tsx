'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Zap,
  Lock,
  Flame,
  Sparkles,
  ShoppingBag,
  ArrowRight,
  Gamepad2,
  Cpu,
  CreditCard,
  Layers,
  ChevronRight,
  TrendingDown,
  Award,
  Clock,
  Key,
} from 'lucide-react';
import StorefrontHeader from '@/components/storefront/Header';
import StorefrontFooter from '@/components/storefront/Footer';
import ProductCard from '@/components/storefront/ProductCard';
import { formatINR } from '@/lib/utils';

export default function HomePage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Cryptographic Vault Demonstration State
  const [vaultKeyRevealed, setVaultKeyRevealed] = useState(false);
  const [simulatedOrder, setSimulatedOrder] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [prodRes, catRes] = await Promise.all([
          fetch('/api/v1/products?limit=0'),
          fetch('/api/v1/categories'),
        ]);

        const prodData = await prodRes.json();
        const catData = await catRes.json();

        if (prodData.success) {
          setProducts(prodData.products || []);
        }
        if (catData.success) {
          setCategories(catData.categories || []);
        }
      } catch (err) {
        console.error('Failed to load homepage catalog:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Filter sections using real database data
  const featuredProducts = products.filter((p) => p.isFeatured).slice(0, 4);
  const dealProducts = products.filter((p) => p.isOnSale).slice(0, 4);
  const newProducts = [...products]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 4);
  const popularProducts = [...products]
    .sort((a, b) => (b.stockQuantity || 0) - (a.stockQuantity || 0))
    .slice(0, 4);

  const getCategoryIcon = (slug: string) => {
    if (slug.includes('game')) return Gamepad2;
    if (slug.includes('software')) return Cpu;
    return CreditCard;
  };

  return (
    <div className="min-h-screen bg-[#070a0f] text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      <StorefrontHeader />

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative overflow-hidden border-b border-slate-800/80 bg-gradient-to-b from-[#0a0d14] via-[#070a0f] to-[#070a0f] py-16 sm:py-24">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-amber-500/10 via-indigo-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              {/* Hero Left Content */}
              <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-500/10 to-indigo-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider shadow-sm">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  Official Single-Vendor Digital Store
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1]">
                  Authentic Digital Keys.{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500">
                    Direct From Source.
                  </span>
                </h1>

                <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed mx-auto lg:mx-0">
                  Welcome to <strong className="text-white">Fanar Al Bhar</strong>. No marketplace
                  sellers, no unknown third parties. Every video game key, OS license, and prepaid
                  gift card is sourced directly with instant automated vault dispatch.
                </p>

                {/* Hero CTA Buttons */}
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
                  <Link
                    href="/shop"
                    className="px-7 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm flex items-center gap-2 shadow-xl shadow-amber-500/20 hover:scale-105 active:scale-95 transition-all"
                  >
                    <ShoppingBag className="w-4 h-4" /> Explore Catalog
                  </Link>

                  <Link
                    href="/shop?onSale=true"
                    className="px-7 py-3.5 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700/80 font-semibold text-sm flex items-center gap-2 hover:border-amber-500/50 transition-all"
                  >
                    <Flame className="w-4 h-4 text-rose-500" /> Today&apos;s Flash Deals
                  </Link>
                </div>

                {/* Hero Trust Badges */}
                <div className="pt-6 border-t border-slate-800/80 grid grid-cols-3 gap-4 text-left">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                      <Zap className="w-3.5 h-3.5 text-amber-400" /> Instant
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">Automated key release</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                      <Award className="w-3.5 h-3.5 text-emerald-400" /> 100% Genuine
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">Authorized licenses</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                      <Lock className="w-3.5 h-3.5 text-indigo-400" /> AES-256 Vault
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">Encrypted key storage</p>
                  </div>
                </div>
              </div>

              {/* Hero Right: Interactive Single-Vendor Key Vault Feature */}
              <div className="lg:col-span-5">
                <div className="relative rounded-3xl border border-slate-800 bg-slate-950/80 p-6 sm:p-8 shadow-2xl backdrop-blur-xl overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

                  <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-6">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
                        Fanar Key Vault Live
                      </span>
                    </div>
                    <span className="text-[10px] bg-slate-900 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded font-mono">
                      DIRECT PURCHASE
                    </span>
                  </div>

                  {products.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
                        <img
                          src={products[0].coverImageUrl}
                          alt={products[0].title}
                          className="w-14 h-14 rounded-xl object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <span className="text-[10px] uppercase font-bold text-amber-400 block truncate">
                            {products[0].categoryName}
                          </span>
                          <h4 className="text-xs font-bold text-white truncate">
                            {products[0].title}
                          </h4>
                          <span className="text-xs font-mono font-black text-emerald-400">
                            {formatINR(products[0].currentPrice)}
                          </span>
                        </div>
                      </div>

                      {/* Cryptographic simulation */}
                      <div className="p-4 rounded-2xl bg-black/40 border border-slate-800/80 space-y-2">
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span className="flex items-center gap-1 font-mono">
                            <Key className="w-3 h-3 text-amber-400" /> Digital Key Status
                          </span>
                          <span className="text-emerald-400 font-semibold">Ready in Vault</span>
                        </div>

                        <div className="font-mono text-xs bg-slate-900 p-2.5 rounded-xl border border-slate-800 text-center tracking-widest text-slate-200">
                          {vaultKeyRevealed
                            ? 'FC26-9KM4-WY82-NX99'
                            : '••••-••••-••••-•••• (ENCRYPTED)'}
                        </div>

                        <button
                          onClick={() => setVaultKeyRevealed(!vaultKeyRevealed)}
                          className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5"
                        >
                          <Lock className="w-3.5 h-3.5 text-amber-400" />
                          {vaultKeyRevealed ? 'Hide Test Key' : 'Reveal Encrypted Sample'}
                        </button>
                      </div>

                      <Link
                        href={`/product/${products[0].slug}`}
                        className="block w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 text-center font-bold text-xs rounded-xl shadow transition-all"
                      >
                        View Featured Release
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION: CATEGORIES SHOWCASE */}
        {categories.length > 0 && (
          <section className="py-12 border-b border-slate-800/60 bg-slate-950/40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                    <Layers className="w-5 h-5 text-amber-400" /> Shop by Department
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Explore curated categories with instant digital delivery
                  </p>
                </div>
                <Link
                  href="/categories"
                  className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1"
                >
                  All Categories <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {categories.map((cat) => {
                  const Icon = getCategoryIcon(cat.slug);
                  return (
                    <Link
                      key={cat.id}
                      href={`/category/${cat.slug}`}
                      className="group p-6 rounded-2xl border border-slate-800 bg-slate-900/40 hover:bg-slate-900/80 hover:border-amber-500/40 transition-all flex items-center justify-between shadow-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                          <Icon className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-bold text-sm text-white group-hover:text-amber-400 transition-colors">
                            {cat.name}
                          </h3>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {cat.productCount ?? 'Direct stock'} available
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* SECTION: FEATURED PRODUCTS */}
        {featuredProducts.length > 0 && (
          <section className="py-16 border-b border-slate-800/60">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded-md bg-amber-500/10 text-amber-400">
                      <Sparkles className="w-4 h-4" />
                    </span>
                    <h2 className="text-2xl font-black text-white tracking-tight">
                      Featured Products
                    </h2>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Hand-picked flagship digital releases from Fanar Al Bhar
                  </p>
                </div>
                <Link
                  href="/shop?featured=true"
                  className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1"
                >
                  View All Featured <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {featuredProducts.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* SECTION: FLASH DEALS & DISCOUNTS */}
        {dealProducts.length > 0 && (
          <section className="py-16 border-b border-slate-800/60 bg-gradient-to-b from-rose-950/10 via-transparent to-transparent">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded-md bg-rose-500/20 text-rose-400">
                      <Flame className="w-4 h-4" />
                    </span>
                    <h2 className="text-2xl font-black text-white tracking-tight">
                      Special Deals & Discounts
                    </h2>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Authentic licenses and keys at exclusive discounted pricing
                  </p>
                </div>
                <Link
                  href="/shop?onSale=true"
                  className="text-xs font-semibold text-rose-400 hover:text-rose-300 flex items-center gap-1"
                >
                  All Deals <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {dealProducts.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* SECTION: NEW ARRIVALS */}
        {newProducts.length > 0 && (
          <section className="py-16 border-b border-slate-800/60">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded-md bg-emerald-500/10 text-emerald-400">
                      <Clock className="w-4 h-4" />
                    </span>
                    <h2 className="text-2xl font-black text-white tracking-tight">
                      New Arrivals & Releases
                    </h2>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Recently published authentic digital stock in our vault
                  </p>
                </div>
                <Link
                  href="/shop?sort=newest"
                  className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1"
                >
                  View All New <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {newProducts.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* SECTION: WHY CHOOSE FANAR AL BHAR */}
        <section className="py-20 bg-slate-950/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl font-black text-white tracking-tight">
                Why Buy From Fanar Al Bhar?
              </h2>
              <p className="text-sm text-slate-400 mt-2">
                A personal single-vendor digital store built on security, authenticity, and transparency.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="rounded-3xl border border-slate-800/80 bg-slate-900/40 p-8 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">Direct Authorized Keys</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  We are not an open marketplace with anonymous third-party sellers. Every key is procured directly from verified publisher distribution networks, eliminating revoked or duplicate key risks.
                </p>
              </div>

              <div className="rounded-3xl border border-slate-800/80 bg-slate-900/40 p-8 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">Automated Instant Dispatch</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Our system verifies payments in real time and automatically unseals your unique activation code from the cryptographic vault within seconds. No waiting for sellers to be online.
                </p>
              </div>

              <div className="rounded-3xl border border-slate-800/80 bg-slate-900/40 p-8 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">Cryptographic Vault Security</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Keys are stored using AES-256-GCM encryption with unique initialization vectors. Only your authenticated customer account can access the decrypted key for activation.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <StorefrontFooter />
    </div>
  );
}
