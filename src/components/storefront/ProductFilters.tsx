'use client';

import React, { useState } from 'react';
import {
  SlidersHorizontal,
  X,
  RotateCcw,
  Check,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export interface FilterState {
  category: string;
  platform: string;
  brand: string;
  minPrice: string;
  maxPrice: string;
  availability: string;
  onSale: boolean;
}

interface ProductFiltersProps {
  filters: FilterState;
  onChange: (newFilters: FilterState) => void;
  onReset: () => void;
  categories: Array<{ id: string; name: string; slug: string }>;
  platforms: Array<{ id: string; name: string; slug: string }>;
  brands: string[];
  totalResults: number;
}

export default function ProductFilters({
  filters,
  onChange,
  onReset,
  categories,
  platforms,
  brands,
  totalResults,
}: ProductFiltersProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [priceMinInput, setPriceMinInput] = useState(filters.minPrice);
  const [priceMaxInput, setPriceMaxInput] = useState(filters.maxPrice);

  const applyPrice = () => {
    onChange({
      ...filters,
      minPrice: priceMinInput,
      maxPrice: priceMaxInput,
    });
  };

  const handlePriceKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      applyPrice();
    }
  };

  const hasActiveFilters =
    filters.category !== 'all' ||
    filters.platform !== 'all' ||
    filters.brand !== 'all' ||
    filters.minPrice !== '' ||
    filters.maxPrice !== '' ||
    filters.availability !== 'all' ||
    filters.onSale;

  const content = (
    <div className="space-y-6 text-sm">
      {/* Active Filter Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-amber-400" />
          <span className="font-semibold text-slate-100">Filters</span>
          <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-mono">
            {totalResults}
          </span>
        </div>
        {hasActiveFilters && (
          <button
            onClick={() => {
              setPriceMinInput('');
              setPriceMaxInput('');
              onReset();
            }}
            className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 font-medium"
          >
            <RotateCcw className="w-3 h-3" /> Reset
          </button>
        )}
      </div>

      {/* On Sale Switch */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800">
        <div>
          <span className="font-medium text-slate-200 block text-xs">On Sale Only</span>
          <span className="text-[11px] text-slate-400">Exclusive discount prices</span>
        </div>
        <button
          type="button"
          onClick={() => onChange({ ...filters, onSale: !filters.onSale })}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            filters.onSale ? 'bg-amber-500' : 'bg-slate-800'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-slate-950 transition-transform ${
              filters.onSale ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Categories */}
      <div>
        <h4 className="font-semibold text-xs text-slate-300 uppercase tracking-wider mb-2.5">
          Category
        </h4>
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => onChange({ ...filters, category: 'all' })}
            className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-between ${
              filters.category === 'all'
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <span>All Categories</span>
            {filters.category === 'all' && <Check className="w-3.5 h-3.5" />}
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => onChange({ ...filters, category: cat.slug || cat.id })}
              className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-between ${
                filters.category === cat.slug || filters.category === cat.id
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <span>{cat.name}</span>
              {(filters.category === cat.slug || filters.category === cat.id) && (
                <Check className="w-3.5 h-3.5" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h4 className="font-semibold text-xs text-slate-300 uppercase tracking-wider mb-2.5">
          Price Range (₹)
        </h4>
        <div className="flex items-center gap-2 mb-2">
          <input
            type="number"
            min="0"
            placeholder="Min"
            value={priceMinInput}
            onChange={(e) => setPriceMinInput(e.target.value)}
            onKeyDown={handlePriceKeyDown}
            className="w-1/2 bg-slate-900 text-xs text-slate-100 placeholder-slate-400 px-3 py-2 rounded-lg border border-slate-800 focus:outline-none focus:border-amber-500"
          />
          <span className="text-slate-400 text-xs">—</span>
          <input
            type="number"
            min="0"
            placeholder="Max"
            value={priceMaxInput}
            onChange={(e) => setPriceMaxInput(e.target.value)}
            onKeyDown={handlePriceKeyDown}
            className="w-1/2 bg-slate-900 text-xs text-slate-100 placeholder-slate-400 px-3 py-2 rounded-lg border border-slate-800 focus:outline-none focus:border-amber-500"
          />
        </div>
        <button
          type="button"
          onClick={applyPrice}
          className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors"
        >
          Apply Price
        </button>
      </div>

      {/* Availability */}
      <div>
        <h4 className="font-semibold text-xs text-slate-300 uppercase tracking-wider mb-2.5">
          Availability
        </h4>
        <div className="space-y-1">
          {[
            { id: 'all', label: 'All Items' },
            { id: 'in_stock', label: 'In Stock Only' },
            { id: 'out_of_stock', label: 'Out of Stock' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onChange({ ...filters, availability: item.id })}
              className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-between ${
                filters.availability === item.id
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <span>{item.label}</span>
              {filters.availability === item.id && <Check className="w-3.5 h-3.5" />}
            </button>
          ))}
        </div>
      </div>

      {/* Platform */}
      {platforms.length > 0 && (
        <div>
          <h4 className="font-semibold text-xs text-slate-300 uppercase tracking-wider mb-2.5">
            Platform / Ecosystem
          </h4>
          <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
            <button
              type="button"
              onClick={() => onChange({ ...filters, platform: 'all' })}
              className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-between ${
                filters.platform === 'all'
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <span>All Platforms</span>
              {filters.platform === 'all' && <Check className="w-3.5 h-3.5" />}
            </button>
            {platforms.map((plat) => (
              <button
                key={plat.id}
                type="button"
                onClick={() => onChange({ ...filters, platform: plat.slug || plat.id })}
                className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-between ${
                  filters.platform === plat.slug || filters.platform === plat.id
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <span>{plat.name}</span>
                {(filters.platform === plat.slug || filters.platform === plat.id) && (
                  <Check className="w-3.5 h-3.5" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Brand */}
      {brands.length > 0 && (
        <div>
          <h4 className="font-semibold text-xs text-slate-300 uppercase tracking-wider mb-2.5">
            Brand / Publisher
          </h4>
          <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
            <button
              type="button"
              onClick={() => onChange({ ...filters, brand: 'all' })}
              className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-between ${
                filters.brand === 'all'
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <span>All Brands</span>
              {filters.brand === 'all' && <Check className="w-3.5 h-3.5" />}
            </button>
            {brands.map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => onChange({ ...filters, brand: b })}
                className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-between ${
                  filters.brand === b
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <span className="truncate">{b}</span>
                {filters.brand === b && <Check className="w-3.5 h-3.5" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile Drawer Trigger Button */}
      <div className="lg:hidden mb-4 flex items-center justify-between bg-slate-900/80 p-3 rounded-xl border border-slate-800">
        <button
          onClick={() => setMobileOpen(true)}
          className="flex items-center gap-2 text-xs font-semibold text-slate-200"
        >
          <SlidersHorizontal className="w-4 h-4 text-amber-400" /> Filter Catalog ({totalResults})
        </button>
        {hasActiveFilters && (
          <button
            onClick={() => {
              setPriceMinInput('');
              setPriceMaxInput('');
              onReset();
            }}
            className="text-xs text-amber-400 font-medium"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Desktop Filters Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 bg-slate-950/60 border border-slate-800/80 rounded-2xl p-5 sticky top-24 self-start shadow-xl">
        {content}
      </aside>

      {/* Mobile Modal Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative ml-auto w-full max-w-xs bg-slate-950 border-l border-slate-800 p-5 h-full overflow-y-auto flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                <span className="font-bold text-slate-100 text-sm">Filters</span>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              {content}
            </div>
            <div className="pt-4 border-t border-slate-800 mt-6">
              <button
                onClick={() => setMobileOpen(false)}
                className="w-full py-2.5 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs"
              >
                Apply & View {totalResults} Results
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
