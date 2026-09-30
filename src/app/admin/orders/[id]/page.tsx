'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ShoppingBag,
  ArrowLeft,
  Calendar,
  CreditCard,
  User,
  Truck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Receipt,
  Save,
} from 'lucide-react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { formatINR } from '@/lib/product-helper';

interface OrderItem {
  id: string;
  productId: string;
  productTitle: string;
  sku: string;
  priceAtPurchase: number;
  quantity: number;
  subtotal: number;
}

interface OrderDetail {
  id: string;
  orderNumber: string;
  buyerId: string;
  buyer?: {
    id: string;
    name: string | null;
    firstName?: string | null;
    lastName?: string | null;
    email: string;
    phone?: string | null;
  };
  status: string;
  paymentStatus: string;
  subtotal: number;
  discount: number;
  tax: number;
  shipping: number;
  total: number;
  totalAmount?: number;
  currency: string;
  paymentId: string | null;
  shippingAddress: any;
  shippingMethod?: string | null;
  trackingNumber?: string | null;
  couponCode?: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
}

export default function AdminOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Status update
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<string>('');
  const [trackingNumber, setTrackingNumber] = useState<string>('');
  const [shippingMethod, setShippingMethod] = useState<string>('');
  const [updating, setUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/v1/admin/orders/${orderId}`);

      if (res.status === 401 || res.status === 403) {
        router.push('/admin/login');
        return;
      }

      const data = await res.json();
      if (res.ok && data.success && data.order) {
        setOrder(data.order);
        setSelectedStatus(data.order.status);
        setSelectedPaymentStatus(data.order.paymentStatus);
        setTrackingNumber(data.order.trackingNumber || '');
        setShippingMethod(data.order.shippingMethod || '');
      } else {
        setError(data.error || 'Failed to load order');
      }
    } catch (err: any) {
      setError(err.message || 'Error fetching order');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    try {
      setUpdating(true);
      setUpdateSuccess(false);

      const res = await fetch(`/api/v1/admin/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: selectedStatus,
          paymentStatus: selectedPaymentStatus,
          trackingNumber: trackingNumber || undefined,
          shippingMethod: shippingMethod || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.order) {
        setOrder(data.order);
        setUpdateSuccess(true);
        setTimeout(() => setUpdateSuccess(false), 3000);
      } else {
        alert(data.error || 'Failed to update order status');
      }
    } catch (err: any) {
      alert(err.message || 'Error updating order status');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans">
      <AdminSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-6 sm:p-8 max-w-5xl w-full mx-auto space-y-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Link href="/admin/orders" className="hover:text-amber-400 transition-colors">
              Orders
            </Link>
            <span>/</span>
            <span className="text-amber-400 font-medium">Order Details</span>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 text-slate-400">
              <div className="w-8 h-8 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mb-3" />
              <p className="text-xs">Loading order from database...</p>
            </div>
          ) : error || !order ? (
            <div className="p-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-center">
              <AlertTriangle className="w-10 h-10 mx-auto text-rose-400 mb-2" />
              <p className="font-bold text-sm mb-4">{error || 'Order not found'}</p>
              <Link
                href="/admin/orders"
                className="px-4 py-2 rounded-xl bg-slate-800 text-xs text-white font-semibold hover:bg-slate-700"
              >
                Back to Orders
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
                <div>
                  <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
                    <ShoppingBag className="w-7 h-7 text-amber-400" />
                    Order #{order.orderNumber}
                  </h1>
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5" /> Placed on{' '}
                    {new Date(order.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>

                <Link
                  href="/admin/orders"
                  className="self-start sm:self-auto px-4 py-2 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Orders
                </Link>
              </div>

              {/* Status Management Bar */}
              <form
                onSubmit={handleUpdateStatus}
                className="p-5 rounded-2xl border border-slate-800/80 bg-slate-900/60 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex flex-wrap items-center gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Fulfillment Status
                    </label>
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-950 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                    >
                      <option value="PENDING_PAYMENT">PENDING_PAYMENT</option>
                      <option value="CONFIRMED">CONFIRMED</option>
                      <option value="PROCESSING">PROCESSING</option>
                      <option value="SHIPPED">SHIPPED</option>
                      <option value="DELIVERED">DELIVERED</option>
                      <option value="CANCELLED">CANCELLED</option>
                      <option value="REFUNDED">REFUNDED</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Payment Status
                    </label>
                    <select
                      value={selectedPaymentStatus}
                      onChange={(e) => setSelectedPaymentStatus(e.target.value)}
                      className="px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-950 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                    >
                      <option value="PENDING">PENDING</option>
                      <option value="PAID">PAID</option>
                      <option value="FAILED">FAILED</option>
                      <option value="REFUNDED">REFUNDED</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Shipment Tracking #
                    </label>
                    <input
                      type="text"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      placeholder="e.g. TRK-IND-987654"
                      className="px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-950 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-400 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Shipping Method
                    </label>
                    <input
                      type="text"
                      value={shippingMethod}
                      onChange={(e) => setShippingMethod(e.target.value)}
                      placeholder="e.g. Blue Dart / Express"
                      className="px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-950 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {updateSuccess && (
                    <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Updated!
                    </span>
                  )}
                  <button
                    type="submit"
                    disabled={updating}
                    className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/20"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{updating ? 'Saving...' : 'Update Status'}</span>
                  </button>
                </div>
              </form>

              {/* Customer and Delivery Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Customer Information */}
                <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-6 space-y-3">
                  <h2 className="text-sm font-bold text-white flex items-center gap-2 pb-3 border-b border-slate-800">
                    <User className="w-4 h-4 text-amber-400" />
                    Customer Details
                  </h2>
                  <div className="text-xs space-y-1.5 text-slate-300">
                    <p>
                      <span className="text-slate-500">Name: </span>
                      <span className="font-semibold text-white">
                        {order.buyer?.name || [order.buyer?.firstName, order.buyer?.lastName].filter(Boolean).join(' ') || 'Customer'}
                      </span>
                    </p>
                    <p>
                      <span className="text-slate-500">Email: </span>
                      <span className="font-mono text-slate-200">
                        {order.buyer?.email || order.buyerId}
                      </span>
                    </p>
                    <p>
                      <span className="text-slate-500">Phone: </span>
                      <span className="font-mono text-slate-200">
                        {order.buyer?.phone || (order.shippingAddress && order.shippingAddress.phone) || 'N/A'}
                      </span>
                    </p>
                    <p>
                      <span className="text-slate-500">Buyer ID: </span>
                      <span className="font-mono text-slate-400">{order.buyerId}</span>
                    </p>
                    {order.paymentId && (
                      <p>
                        <span className="text-slate-500">Payment Reference: </span>
                        <span className="font-mono text-emerald-400 font-semibold">
                          {order.paymentId}
                        </span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Delivery Information */}
                <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-6 space-y-3">
                  <h2 className="text-sm font-bold text-white flex items-center gap-2 pb-3 border-b border-slate-800">
                    <Truck className="w-4 h-4 text-amber-400" />
                    Shipping & Delivery
                  </h2>
                  {order.shippingAddress ? (
                    <div className="text-xs text-slate-300 space-y-1">
                      <p className="font-bold text-white">{order.shippingAddress.fullName}</p>
                      <p>{order.shippingAddress.address}</p>
                      <p>
                        {order.shippingAddress.city}, {order.shippingAddress.state} -{' '}
                        {order.shippingAddress.postalCode}
                      </p>
                      <p>{order.shippingAddress.country}</p>
                      <p className="text-slate-400 mt-1">Phone: {order.shippingAddress.phone}</p>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">
                      Digital Fulfillment Only — no physical shipping address required.
                    </p>
                  )}
                  {order.trackingNumber && (
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
                      <span className="text-slate-400 block font-semibold">Tracking Number:</span>
                      <span className="font-mono font-bold text-amber-400 text-sm block">{order.trackingNumber}</span>
                      {order.shippingMethod && (
                        <span className="text-[11px] text-slate-400 block">Method: {order.shippingMethod}</span>
                      )}
                    </div>
                  )}
                  {order.notes && (
                    <div className="pt-2 border-t border-slate-800 text-xs">
                      <span className="text-slate-500">Customer Note: </span>
                      <span className="italic text-slate-300">{order.notes}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Order Items & Financial Snapshot (Read-Only) */}
              <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-amber-400" />
                    Purchased Order Items Snapshot (Historical Immutable Prices)
                  </h2>
                  <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                    Financial Immuntability Protected
                  </span>
                </div>

                <div className="divide-y divide-slate-800/60">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="py-3 flex items-center justify-between text-xs text-slate-200"
                    >
                      <div>
                        <span className="font-semibold text-white block">{item.productTitle}</span>
                        <span className="text-slate-400 text-[11px]">
                          SKU: <span className="font-mono text-slate-300">{item.sku}</span> &bull;
                          Qty: {item.quantity} &times; {formatINR(item.priceAtPurchase)}
                        </span>
                      </div>
                      <span className="font-bold text-white">{formatINR(item.subtotal)}</span>
                    </div>
                  ))}
                </div>

                {/* Financial Totals */}
                <div className="pt-4 border-t border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Subtotal</span>
                    <span className="text-slate-200">{formatINR(order.subtotal)}</span>
                  </div>
                  {order.discount > 0 && (
                    <div className="flex justify-between text-emerald-400">
                      <span>Discount</span>
                      <span>−{formatINR(order.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-400">
                    <span>Shipping</span>
                    <span className="text-slate-200">
                      {order.shipping === 0 ? 'FREE' : formatINR(order.shipping)}
                    </span>
                  </div>
                  {order.tax > 0 && (
                    <div className="flex justify-between text-slate-400">
                      <span>Tax (GST 18%)</span>
                      <span className="text-slate-200">{formatINR(order.tax)}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-slate-800 flex justify-between font-bold text-sm text-white">
                    <span>Payable Grand Total</span>
                    <span className="text-amber-400 text-base">
                      {formatINR((order as any).totalAmount ?? order.total ?? 0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
