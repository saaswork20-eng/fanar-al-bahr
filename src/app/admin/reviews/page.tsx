'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Star,
  ShieldCheck,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Filter,
  Package,
  ExternalLink,
  MessageSquare,
} from 'lucide-react';
import AdminSidebar from '@/components/admin/AdminSidebar';

interface AdminReviewItem {
  id: string;
  productId: string;
  productTitle: string;
  productSlug: string;
  buyerId: string;
  buyerEmail?: string;
  buyerDisplayName: string;
  orderId?: string | null;
  rating: number;
  comment: string;
  isVerifiedPurchase: boolean;
  isApproved: boolean;
  createdAt: string;
}

export default function AdminReviewsPage() {
  const router = useRouter();
  const [reviews, setReviews] = useState<AdminReviewItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'APPROVED' | 'HIDDEN'>('ALL');
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter === 'APPROVED') params.set('isApproved', 'true');
      if (statusFilter === 'HIDDEN') params.set('isApproved', 'false');

      const res = await fetch(`/api/v1/admin/reviews?${params.toString()}`);
      if (res.status === 401 || res.status === 403) {
        router.push('/login?from=/admin/reviews');
        return;
      }
      const data = await res.json();
      if (data.success && Array.isArray(data.reviews)) {
        setReviews(data.reviews);
        setTotal(data.total ?? data.reviews.length);
      }
    } catch (err) {
      console.error('Error fetching admin reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [statusFilter]);

  const showNotification = (type: 'success' | 'error', text: string) => {
    setActionMessage({ type, text });
    setTimeout(() => setActionMessage(null), 3500);
  };

  const handleToggleApproval = async (review: AdminReviewItem) => {
    const updatedApproved = !review.isApproved;
    try {
      const res = await fetch(`/api/v1/admin/reviews/${review.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isApproved: updatedApproved }),
      });
      const data = await res.json();
      if (data.success) {
        showNotification(
          'success',
          `Review has been ${updatedApproved ? 'approved and made visible' : 'hidden from public view'}.`
        );
        fetchReviews();
      } else {
        showNotification('error', data.error || 'Failed to update review status.');
      }
    } catch {
      showNotification('error', 'Network error modifying review.');
    }
  };

  const handleDelete = async (reviewId: string) => {
    if (!confirm('Are you sure you want to permanently delete this customer review?')) return;
    try {
      const res = await fetch(`/api/v1/admin/reviews/${reviewId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        showNotification('success', 'Review deleted successfully.');
        setReviews((prev) => prev.filter((r) => r.id !== reviewId));
        setTotal((prev) => Math.max(0, prev - 1));
      } else {
        showNotification('error', data.error || 'Failed to delete review.');
      }
    } catch {
      showNotification('error', 'Network error deleting review.');
    }
  };

  return (
    <div className="flex min-h-screen bg-[#070a0f] text-slate-100 font-sans">
      <AdminSidebar />

      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header */}
        <header className="h-16 border-b border-slate-800 bg-[#0d1117]/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <Star className="w-5 h-5 text-amber-400" />
            <h1 className="font-bold text-base text-white">Product Review Moderation</h1>
          </div>
          <div className="text-xs text-slate-400 font-mono">
            {total} Total Reviews
          </div>
        </header>

        <div className="p-6 sm:p-8 max-w-7xl w-full mx-auto space-y-6">
          {/* Notification Alert */}
          {actionMessage && (
            <div
              className={`p-4 rounded-xl border text-xs flex items-center gap-3 shadow-lg ${
                actionMessage.type === 'success'
                  ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-950/80 border-rose-500/40 text-rose-300'
              }`}
            >
              {actionMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              )}
              <span>{actionMessage.text}</span>
            </div>
          )}

          {/* Filter Toolbar */}
          <div className="flex items-center justify-between bg-[#12161f] border border-slate-800 p-4 rounded-2xl">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <span className="text-xs text-slate-400 font-medium">Filter by Status:</span>
              <div className="flex items-center gap-1.5 ml-2">
                {(['ALL', 'APPROVED', 'HIDDEN'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setStatusFilter(mode)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      statusFilter === mode
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    {mode === 'ALL' ? 'All Reviews' : mode === 'APPROVED' ? 'Approved' : 'Hidden'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Reviews Table */}
          <div className="bg-[#12161f] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            {loading ? (
              <div className="py-20 text-center text-slate-400 text-xs">
                Loading reviews...
              </div>
            ) : reviews.length === 0 ? (
              <div className="p-12 text-center text-slate-400 space-y-2">
                <MessageSquare className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                <p className="text-sm font-bold text-white">No reviews found</p>
                <p className="text-xs">No customer reviews match your selected filter.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Product</th>
                      <th className="py-3 px-4 font-semibold">Buyer / Order</th>
                      <th className="py-3 px-4 font-semibold">Rating</th>
                      <th className="py-3 px-4 font-semibold">Review Text</th>
                      <th className="py-3 px-4 font-semibold">Date</th>
                      <th className="py-3 px-4 font-semibold">Status</th>
                      <th className="py-3 px-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {reviews.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-white max-w-[200px]">
                          <Link
                            href={`/product/${r.productSlug}`}
                            target="_blank"
                            className="hover:text-amber-400 transition-colors line-clamp-2"
                          >
                            {r.productTitle}
                          </Link>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-200">{r.buyerDisplayName}</div>
                          <div className="text-[11px] text-slate-500 font-mono">{r.buyerEmail || r.buyerId}</div>
                          {r.isVerifiedPurchase && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 mt-0.5">
                              <ShieldCheck className="w-3 h-3" />
                              Verified Buyer
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1 text-amber-400 font-bold">
                            <span>{r.rating}</span>
                            <Star className="w-3.5 h-3.5 fill-amber-400" />
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-300 max-w-sm">
                          <p className="line-clamp-3 leading-relaxed">{r.comment}</p>
                        </td>
                        <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                          {new Date(r.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              r.isApproved
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}
                          >
                            {r.isApproved ? 'Visible' : 'Hidden'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleToggleApproval(r)}
                              title={r.isApproved ? 'Hide Review' : 'Approve Review'}
                              className={`p-1.5 rounded-lg transition-colors ${
                                r.isApproved
                                  ? 'hover:bg-amber-500/20 text-slate-400 hover:text-amber-300'
                                  : 'hover:bg-emerald-500/20 text-emerald-400'
                              }`}
                            >
                              {r.isApproved ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => handleDelete(r.id)}
                              title="Delete Inappropriate Review"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/20 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
