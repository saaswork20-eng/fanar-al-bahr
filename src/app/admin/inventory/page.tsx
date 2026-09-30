'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Boxes,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Edit2,
  RefreshCw,
  PlusCircle,
  Save,
  X,
  Package,
} from 'lucide-react';
import AdminSidebar from '@/components/admin/AdminSidebar';

interface InventoryItem {
  id: string;
  title: string;
  slug: string;
  sku: string;
  coverImageUrl: string;
  price: number;
  discountPrice: number | null;
  stockQuantity: number;
  lowStockThreshold: number;
  status: string;
  deliveryType: string;
  isActive: boolean;
  categoryName: string;
  stockStatus: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
  updatedAt: string;
}

interface InventoryStats {
  totalProducts: number;
  inStockCount: number;
  lowStockCount: number;
  outOfStockCount: number;
}

export default function AdminInventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [stats, setStats] = useState<InventoryStats | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'>('ALL');
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<{ id: string; stock: number; threshold: number } | null>(null);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Bulk edit state
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkEdits, setBulkEdits] = useState<Record<string, number>>({});

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      if (statusFilter !== 'ALL') params.append('status', statusFilter);

      const res = await fetch(`/api/v1/admin/inventory?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setItems(json.items);
        setStats(json.stats);
      }
    } catch (err) {
      console.error('Failed to load inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchInventory();
  };

  const handleSaveStock = async () => {
    if (!editingItem) return;
    if (editingItem.stock < 0) {
      setMessage({ type: 'error', text: 'Stock quantity cannot be negative.' });
      return;
    }

    setUpdating(true);
    try {
      const res = await fetch('/api/v1/admin/inventory', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: editingItem.id,
          stockQuantity: editingItem.stock,
          lowStockThreshold: editingItem.threshold,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setMessage({ type: 'success', text: 'Stock updated successfully.' });
        setEditingItem(null);
        fetchInventory();
      } else {
        setMessage({ type: 'error', text: json.error || 'Failed to update stock.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error updating stock.' });
    } finally {
      setUpdating(false);
    }
  };

  const handleBulkSave = async () => {
    const updates = Object.entries(bulkEdits).map(([id, stockQuantity]) => ({
      id,
      stockQuantity,
    }));

    if (updates.length === 0) {
      setBulkMode(false);
      return;
    }

    for (const u of updates) {
      if (u.stockQuantity < 0) {
        setMessage({ type: 'error', text: 'Stock values cannot be negative.' });
        return;
      }
    }

    setUpdating(true);
    try {
      const res = await fetch('/api/v1/admin/inventory', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
      });
      const json = await res.json();
      if (json.success) {
        setMessage({ type: 'success', text: `Updated ${json.updatedCount} items successfully.` });
        setBulkMode(false);
        setBulkEdits({});
        fetchInventory();
      } else {
        setMessage({ type: 'error', text: json.error || 'Failed bulk update.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error during bulk update.' });
    } finally {
      setUpdating(false);
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
              <Boxes className="w-4 h-4 text-amber-400" />
              <span>Real-Time Inventory Control</span>
            </h1>
            <p className="text-xs text-slate-400">Stock thresholds, warehouse telemetry & instant updates</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setBulkMode(!bulkMode);
                setBulkEdits({});
              }}
              className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                bulkMode
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-[#12161f] border-[#232a3b] text-slate-300 hover:text-white'
              }`}
            >
              {bulkMode ? 'Cancel Bulk Mode' : 'Bulk Stock Edit'}
            </button>

            {bulkMode && (
              <button
                onClick={handleBulkSave}
                disabled={updating || Object.keys(bulkEdits).length === 0}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save All Changes ({Object.keys(bulkEdits).length})</span>
              </button>
            )}

            <button
              onClick={fetchInventory}
              disabled={loading}
              className="p-2 rounded-xl bg-[#12161f] border border-[#232a3b] text-slate-400 hover:text-white transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-6 md:p-8 space-y-6 max-w-7xl">
          {/* Notification banner */}
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

          {/* Metric Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-[#0f131c] border border-[#232a3b]">
              <span className="text-xs text-slate-400 block">Total Catalog Items</span>
              <span className="text-xl font-bold text-white mt-1 block">{stats?.totalProducts ?? '—'}</span>
            </div>
            <div className="p-4 rounded-xl bg-[#0f131c] border border-[#232a3b]">
              <span className="text-xs text-emerald-400 block">In Stock Items</span>
              <span className="text-xl font-bold text-emerald-400 mt-1 block">{stats?.inStockCount ?? '—'}</span>
            </div>
            <div className="p-4 rounded-xl bg-[#0f131c] border border-[#232a3b]">
              <span className="text-xs text-amber-400 block">Low Stock Alert</span>
              <span className="text-xl font-bold text-amber-400 mt-1 block">{stats?.lowStockCount ?? '—'}</span>
            </div>
            <div className="p-4 rounded-xl bg-[#0f131c] border border-[#232a3b]">
              <span className="text-xs text-rose-400 block">Out of Stock</span>
              <span className="text-xl font-bold text-rose-400 mt-1 block">{stats?.outOfStockCount ?? '—'}</span>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="p-4 rounded-2xl bg-[#0e121a] border border-[#232a3b] flex flex-col md:flex-row items-center justify-between gap-4">
            <form onSubmit={handleSearchSubmit} className="w-full md:w-96 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by product name, SKU..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#141a24] border border-[#283247] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </form>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#141a24] border border-[#283247] text-xs self-stretch md:self-auto overflow-x-auto">
              {(['ALL', 'IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all ${
                    statusFilter === st
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {st === 'ALL'
                    ? 'All Items'
                    : st === 'IN_STOCK'
                    ? 'In Stock'
                    : st === 'LOW_STOCK'
                    ? 'Low Stock'
                    : 'Out of Stock'}
                </button>
              ))}
            </div>
          </div>

          {/* Inventory Table */}
          <div className="rounded-2xl bg-[#0e121a] border border-[#232a3b] overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                <span>Loading real inventory...</span>
              </div>
            ) : items.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-500">
                No inventory records match the current filter.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#141a24] text-[10px] uppercase font-bold text-slate-400 border-b border-[#232a3b]">
                    <tr>
                      <th className="py-3.5 px-4">Product</th>
                      <th className="py-3.5 px-4">SKU</th>
                      <th className="py-3.5 px-4">Delivery</th>
                      <th className="py-3.5 px-4 text-center">Status</th>
                      <th className="py-3.5 px-4 text-right">Threshold</th>
                      <th className="py-3.5 px-4 text-right">Current Stock</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#232a3b]">
                    {items.map((item) => {
                      const isLow = item.stockStatus === 'LOW_STOCK';
                      const isOut = item.stockStatus === 'OUT_OF_STOCK';

                      return (
                        <tr key={item.id} className="hover:bg-[#121620] transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={item.coverImageUrl}
                                alt={item.title}
                                className="w-10 h-10 rounded-lg object-cover border border-[#283247] flex-shrink-0"
                              />
                              <div className="min-w-0">
                                <span className="font-semibold text-white block truncate">{item.title}</span>
                                <span className="text-[10px] text-slate-400">{item.categoryName}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-400">{item.sku}</td>
                          <td className="py-3 px-4">
                            <span className="text-[10px] font-mono text-slate-300">
                              {item.deliveryType.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border inline-block ${
                                isOut
                                  ? 'bg-rose-950/60 text-rose-400 border-rose-800/40'
                                  : isLow
                                  ? 'bg-amber-950/60 text-amber-400 border-amber-800/40'
                                  : 'bg-emerald-950/60 text-emerald-400 border-emerald-800/40'
                              }`}
                            >
                              {item.stockStatus.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-slate-400">
                            {item.lowStockThreshold}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {bulkMode ? (
                              <input
                                type="number"
                                min="0"
                                value={
                                  bulkEdits[item.id] !== undefined
                                    ? bulkEdits[item.id]
                                    : item.stockQuantity
                                }
                                onChange={(e) => {
                                  const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                                  setBulkEdits({ ...bulkEdits, [item.id]: val });
                                }}
                                className="w-20 px-2 py-1 rounded bg-[#182030] border border-amber-500/40 text-amber-300 font-bold text-right text-xs focus:outline-none"
                              />
                            ) : (
                              <span
                                className={`font-mono font-bold text-sm ${
                                  isOut ? 'text-rose-400' : isLow ? 'text-amber-400' : 'text-emerald-400'
                                }`}
                              >
                                {item.stockQuantity}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {!bulkMode && (
                              <button
                                onClick={() =>
                                  setEditingItem({
                                    id: item.id,
                                    stock: item.stockQuantity,
                                    threshold: item.lowStockThreshold,
                                  })
                                }
                                className="p-1.5 rounded-lg bg-[#182030] hover:bg-[#202b40] text-slate-300 hover:text-white border border-[#2b3952] transition-colors"
                                title="Adjust Stock"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Edit Stock Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#0f131c] border border-[#283247] rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#232a3b] pb-3">
              <h3 className="font-bold text-sm text-white">Adjust Stock Level</h3>
              <button onClick={() => setEditingItem(null)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">New Stock Quantity (Units)</label>
                <input
                  type="number"
                  min="0"
                  value={editingItem.stock}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      stock: Math.max(0, parseInt(e.target.value, 10) || 0),
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-[#141a24] border border-[#283247] text-white font-mono font-bold focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Low-Stock Alert Threshold</label>
                <input
                  type="number"
                  min="0"
                  value={editingItem.threshold}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      threshold: Math.max(0, parseInt(e.target.value, 10) || 0),
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-[#141a24] border border-[#283247] text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="px-3 py-1.5 rounded-xl border border-[#232a3b] text-slate-400 hover:text-white text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveStock}
                disabled={updating}
                className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs disabled:opacity-50"
              >
                {updating ? 'Saving...' : 'Save Stock'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
