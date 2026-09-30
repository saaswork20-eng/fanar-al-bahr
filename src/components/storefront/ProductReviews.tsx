'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Star,
  ShieldCheck,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  ThumbsUp,
  User,
} from 'lucide-react';

interface ReviewItem {
  id: string;
  rating: number;
  comment: string;
  isVerifiedPurchase: boolean;
  createdAt: string;
  buyerDisplayName: string;
}

interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  breakdown: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

interface UserReviewState {
  canReview: boolean;
  alreadyReviewed: boolean;
  hasPurchased: boolean;
}

interface ProductReviewsProps {
  productId: string;
  slug: string;
}

export default function ProductReviews({ productId, slug }: ProductReviewsProps) {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [stats, setStats] = useState<ReviewStats>({
    averageRating: 0,
    totalReviews: 0,
    breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  });
  const [userState, setUserState] = useState<UserReviewState>({
    canReview: false,
    alreadyReviewed: false,
    hasPurchased: false,
  });
  const [loading, setLoading] = useState(true);

  // Form states
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/v1/products/${slug}/reviews`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setReviews(data.reviews || []);
          if (data.stats) setStats(data.stats);
          if (data.userState) setUserState(data.userState);
        }
      }
    } catch (err) {
      console.error('Error fetching reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [slug]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/v1/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          rating,
          comment,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSubmitSuccess('Thank you! Your verified review has been submitted.');
        setComment('');
        fetchReviews();
      } else {
        setSubmitError(data.error || 'Failed to submit review');
      }
    } catch {
      setSubmitError('Network error submitting your review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-950/60 p-6 sm:p-10 mb-16 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6 mb-8">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5">
            <Star className="w-6 h-6 text-amber-400 fill-amber-400" />
            Customer Ratings & Reviews
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Authentic feedback from verified customers of Fanar Al Bhar.
          </p>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-black text-white">
            {stats.totalReviews > 0 ? stats.averageRating.toFixed(1) : '0.0'}
          </span>
          <span className="text-xs text-slate-400">/ 5.0</span>
          <span className="text-xs text-slate-500 ml-1">
            ({stats.totalReviews} {stats.totalReviews === 1 ? 'review' : 'reviews'})
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-10">
        {/* Rating Breakdown Bars (5 cols) */}
        <div className="lg:col-span-5 bg-[#12161f] border border-slate-800 rounded-2xl p-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-4">
            Rating Distribution
          </h3>
          <div className="space-y-2.5">
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = stats.breakdown[stars as 1 | 2 | 3 | 4 | 5] || 0;
              const percent = stats.totalReviews > 0 ? Math.round((count / stats.totalReviews) * 100) : 0;
              return (
                <div key={stars} className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1 w-12 text-slate-300 font-semibold">
                    <span>{stars}</span>
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  </div>
                  <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <div className="w-10 text-right text-slate-400 text-[11px] font-mono">
                    {count}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center gap-2 text-[11px] text-emerald-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Strict Verified Purchase policy: Only authentic buyers can post reviews.</span>
          </div>
        </div>

        {/* Review Submission Area / Gate (7 cols) */}
        <div className="lg:col-span-7 bg-[#12161f] border border-slate-800 rounded-2xl p-6">
          {userState.canReview ? (
            <div>
              <h3 className="text-sm font-bold text-white mb-2">Write a Verified Review</h3>
              <p className="text-xs text-slate-400 mb-5">
                Share your authentic experience with this product with fellow gamers.
              </p>

              {submitSuccess && (
                <div className="mb-4 p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>{submitSuccess}</span>
                </div>
              )}

              {submitError && (
                <div className="mb-4 p-3.5 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              <form onSubmit={handleSubmitReview} className="space-y-4">
                {/* Rating selection */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Your Rating
                  </label>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((starVal) => {
                      const filled = (hoverRating || rating) >= starVal;
                      return (
                        <button
                          key={starVal}
                          type="button"
                          onMouseEnter={() => setHoverRating(starVal)}
                          onMouseLeave={() => setHoverRating(0)}
                          onClick={() => setRating(starVal)}
                          className="p-1 text-slate-600 hover:scale-110 transition-transform"
                        >
                          <Star
                            className={`w-6 h-6 transition-colors ${
                              filled ? 'text-amber-400 fill-amber-400' : 'text-slate-700'
                            }`}
                          />
                        </button>
                      );
                    })}
                    <span className="text-xs font-bold text-amber-400 ml-2">
                      {hoverRating || rating} / 5 Stars
                    </span>
                  </div>
                </div>

                {/* Review Text */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Your Review
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Tell us what you liked about the game, key delivery speed, or product performance..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs transition-colors shadow-lg shadow-amber-500/10"
                >
                  {submitting ? 'Submitting...' : 'Post Verified Review'}
                </button>
              </form>
            </div>
          ) : userState.alreadyReviewed ? (
            <div className="p-6 text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-white mb-1">Review Submitted</h4>
              <p className="text-xs text-slate-400">
                You have already reviewed this product. Thank you for supporting Fanar Al Bhar!
              </p>
            </div>
          ) : userState.hasPurchased === false ? (
            <div className="p-6 text-center">
              <ShieldCheck className="w-8 h-8 text-slate-500 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-white mb-1">Verified Purchases Only</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
                To guarantee 100% authentic ratings, only customers who purchased this item from Fanar Al Bhar can submit a review.
              </p>
              <Link
                href="/login"
                className="text-xs text-amber-400 hover:text-amber-300 font-semibold"
              >
                Sign in to your customer account &rarr;
              </Link>
            </div>
          ) : null}
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
          Customer Feedback ({reviews.length})
        </h3>

        {loading ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            Loading customer reviews...
          </div>
        ) : reviews.length === 0 ? (
          /* Empty state requirement: "You haven't reviewed any products yet." / "No reviews yet" */
          <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800 text-center">
            <MessageSquare className="w-8 h-8 text-slate-500 mx-auto mb-2" />
            <p className="text-sm font-semibold text-white">No reviews yet.</p>
            <p className="text-xs text-slate-400 mt-1">
              Be the first verified customer to share feedback for this product.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {reviews.map((r) => (
              <div
                key={r.id}
                className="p-5 rounded-2xl bg-[#12161f] border border-slate-800/80 space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-slate-300">
                      {r.buyerDisplayName[0]?.toUpperCase() || 'C'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-white">
                          {r.buyerDisplayName}
                        </span>
                        {r.isVerifiedPurchase && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                            <ShieldCheck className="w-3 h-3" />
                            Verified Purchase
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Stars */}
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((starVal) => (
                      <Star
                        key={starVal}
                        className={`w-3.5 h-3.5 ${
                          starVal <= r.rating
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-700'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed pl-11">
                  {r.comment}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
