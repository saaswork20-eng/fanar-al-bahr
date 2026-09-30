'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import {
  Package,
  ArrowLeft,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Plus,
  Trash2,
  Upload,
  Sparkles,
  Layers,
  Image as ImageIcon,
  Info,
  Calendar,
  Save,
} from 'lucide-react';
import { formatINR } from '@/lib/utils';
import AdminSidebar from '@/components/admin/AdminSidebar';

interface Category {
  id: string;
  name: string;
}

interface Platform {
  id: string;
  name: string;
}

interface SpecItem {
  key: string;
  value: string;
}

interface ProductDetail {
  id: string;
  title: string;
  slug: string;
  description: string;
  shortDescription?: string | null;
  price: number;
  discountPrice?: number | null;
  discountStartDate?: string | null;
  discountEndDate?: string | null;
  stockQuantity: number;
  lowStockThreshold?: number;
  categoryId: string;
  platformId?: string | null;
  region: string;
  deliveryType: string;
  status: 'DRAFT' | 'PUBLISHED' | 'UNPUBLISHED' | 'OUT_OF_STOCK';
  isActive: boolean;
  isFeatured?: boolean;
  coverImageUrl: string;
  images?: string[];
  sku?: string | null;
  brand?: string | null;
  specifications?: string | null;
  weight?: string | null;
  dimensions?: string | null;
  createdAt: string;
  updatedAt: string;
  vaultStats?: {
    availableKeys: number;
    soldKeys: number;
    totalKeys: number;
  };
  maskedKeys?: Array<{
    id: string;
    status: string;
    maskedPreview: string;
    isRevealed: boolean;
    createdAt: string;
  }>;
}

export default function AdminEditProductPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [ingestingKeys, setIngestingKeys] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [sku, setSku] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [brand, setBrand] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [platformId, setPlatformId] = useState('');
  const [region, setRegion] = useState('GLOBAL');

  const [price, setPrice] = useState('');
  const [discountPrice, setDiscountPrice] = useState('');
  const [discountStartDate, setDiscountStartDate] = useState('');
  const [discountEndDate, setDiscountEndDate] = useState('');

  const [stockQuantity, setStockQuantity] = useState('');
  const [lowStockThreshold, setLowStockThreshold] = useState('5');
  const [deliveryType, setDeliveryType] = useState('INSTANT_KEY');

  const [images, setImages] = useState<string[]>([]);
  const [customImageUrl, setCustomImageUrl] = useState('');

  const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED' | 'UNPUBLISHED' | 'OUT_OF_STOCK'>('PUBLISHED');
  const [isFeatured, setIsFeatured] = useState(false);
  const [weight, setWeight] = useState('');
  const [dimensions, setDimensions] = useState('');
  const [specList, setSpecList] = useState<SpecItem[]>([]);

  // Key addition
  const [additionalKeys, setAdditionalKeys] = useState('');

  const loadData = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const [productRes, metaRes] = await Promise.all([
        fetch(`/api/v1/admin/products/${id}`),
        fetch('/api/v1/admin/products'),
      ]);

      const pData = await productRes.json();
      const mData = await metaRes.json();

      if (mData.success) {
        setCategories(mData.categories || []);
        setPlatforms(mData.platforms || []);
      }

      if (pData.success && pData.product) {
        const p = pData.product;
        setProduct(p);
        setTitle(p.title);
        setSlug(p.slug);
        setSku(p.sku || '');
        setShortDescription(p.shortDescription || '');
        setDescription(p.description || '');
        setBrand(p.brand || 'Fanar Al Bhar');
        setCategoryId(p.categoryId);
        setPlatformId(p.platformId || '');
        setRegion(p.region || 'GLOBAL');

        setPrice(String(p.price));
        setDiscountPrice(p.discountPrice ? String(p.discountPrice) : '');
        setDiscountStartDate(p.discountStartDate ? p.discountStartDate.substring(0, 16) : '');
        setDiscountEndDate(p.discountEndDate ? p.discountEndDate.substring(0, 16) : '');

        setStockQuantity(String(p.stockQuantity));
        setLowStockThreshold(String(p.lowStockThreshold ?? 5));
        setDeliveryType(p.deliveryType || 'INSTANT_KEY');

        setImages(p.images && p.images.length > 0 ? p.images : [p.coverImageUrl]);
        setStatus(p.status || (p.isActive ? 'PUBLISHED' : 'UNPUBLISHED'));
        setIsFeatured(Boolean(p.isFeatured));
        setWeight(p.weight || '');
        setDimensions(p.dimensions || '');

        if (p.specifications) {
          try {
            const parsed = JSON.parse(p.specifications);
            const list = Object.entries(parsed).map(([key, value]) => ({
              key,
              value: String(value),
            }));
            setSpecList(list);
          } catch {
            setSpecList([]);
          }
        }
      } else {
        setFeedback({ type: 'error', message: pData.error || 'Product not found.' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Failed to load product details.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  // Image Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setFeedback(null);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/v1/admin/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        setImages((prev) => [...prev, data.url]);
      } else {
        setFeedback({ type: 'error', message: data.error || 'Failed to upload image.' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Network error uploading image.' });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAddImageUrl = () => {
    if (customImageUrl.trim() && !images.includes(customImageUrl.trim())) {
      setImages((prev) => [...prev, customImageUrl.trim()]);
      setCustomImageUrl('');
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSetPrimary = (index: number) => {
    if (index === 0) return;
    setImages((prev) => {
      const copy = [...prev];
      const [item] = copy.splice(index, 1);
      copy.unshift(item);
      return copy;
    });
  };

  // Specs
  const handleAddSpec = () => {
    setSpecList((prev) => [...prev, { key: '', value: '' }]);
  };

  const handleRemoveSpec = (index: number) => {
    setSpecList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSpecChange = (index: number, field: 'key' | 'value', val: string) => {
    setSpecList((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: val } : item))
    );
  };

  // Save Product Updates
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);

    try {
      const numPrice = Number(price);
      if (isNaN(numPrice) || numPrice < 0) {
        setFeedback({ type: 'error', message: 'Price cannot be negative.' });
        setSaving(false);
        return;
      }

      let numDiscount: number | null = null;
      if (discountPrice.trim()) {
        numDiscount = Number(discountPrice);
        if (isNaN(numDiscount) || numDiscount < 0) {
          setFeedback({ type: 'error', message: 'Discount price cannot be negative.' });
          setSaving(false);
          return;
        }
        if (numDiscount > numPrice) {
          setFeedback({ type: 'error', message: 'Discount price cannot exceed regular price.' });
          setSaving(false);
          return;
        }
      }

      const specMap: Record<string, string> = {};
      specList.forEach((s) => {
        if (s.key.trim() && s.value.trim()) {
          specMap[s.key.trim()] = s.value.trim();
        }
      });

      const finalCover = images[0] || product?.coverImageUrl || '';

      const payload = {
        title: title.trim(),
        slug: slug.trim(),
        sku: sku.trim() || null,
        description: description.trim(),
        shortDescription: shortDescription.trim() || null,
        brand: brand.trim() || null,
        categoryId,
        platformId: platformId || null,
        region,
        price: numPrice,
        discountPrice: numDiscount,
        discountStartDate: discountStartDate || null,
        discountEndDate: discountEndDate || null,
        stockQuantity: Number(stockQuantity),
        lowStockThreshold: Number(lowStockThreshold),
        deliveryType,
        coverImageUrl: finalCover,
        images: images.length > 0 ? images : [finalCover],
        status,
        isFeatured,
        specifications: JSON.stringify(specMap),
        weight: weight.trim() || null,
        dimensions: dimensions.trim() || null,
      };

      const res = await fetch(`/api/v1/admin/products/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setFeedback({ type: 'success', message: 'Product updated successfully.' });
        await loadData();
      } else {
        setFeedback({ type: 'error', message: data.error || 'Failed to update product.' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Network connection error.' });
    } finally {
      setSaving(false);
    }
  };

  // Ingest Additional Digital Keys
  const handleIngestKeys = async () => {
    if (!additionalKeys.trim()) return;
    setIngestingKeys(true);
    setFeedback(null);

    const keysArray = additionalKeys
      .split('\n')
      .map((k) => k.trim())
      .filter((k) => k.length > 0);

    if (keysArray.length === 0) {
      setIngestingKeys(false);
      return;
    }

    try {
      const res = await fetch(`/api/v1/admin/products/${id}/keys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keys: keysArray }),
      });

      const data = await res.json();
      if (data.success) {
        setFeedback({ type: 'success', message: data.message });
        setAdditionalKeys('');
        await loadData();
      } else {
        setFeedback({ type: 'error', message: data.error || 'Failed to ingest keys.' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Network error ingesting keys.' });
    } finally {
      setIngestingKeys(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07090d] text-slate-100 flex">
      <AdminSidebar />

      <div className="flex-1 min-w-0 flex flex-col h-screen overflow-y-auto">
        <header className="h-16 px-6 sm:px-8 border-b border-slate-800/80 bg-[#0d1017]/80 backdrop-blur-md flex items-center justify-between sticky top-0 z-30 flex-shrink-0">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/products"
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-base font-bold text-white tracking-wide">
                Edit Product: {product?.title || 'Loading...'}
              </h1>
              <p className="text-[11px] text-slate-400 font-mono">ID: {id}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/admin/products/${id}`}
              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 font-medium transition-colors"
            >
              Inspect Details
            </Link>
          </div>
        </header>

        <main className="p-6 sm:p-8 space-y-6 flex-1 max-w-5xl">
          {feedback && (
            <div
              className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 ${
                feedback.type === 'success'
                  ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                  : 'bg-rose-950/40 border-rose-800 text-rose-300'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          {loading ? (
            <div className="py-20 text-center text-xs text-slate-500 space-y-2">
              <RefreshCw className="w-6 h-6 mx-auto animate-spin text-indigo-400" />
              <p>Loading product record from database...</p>
            </div>
          ) : !product ? (
            <div className="py-16 text-center text-xs text-slate-500">Product not found.</div>
          ) : (
            <form onSubmit={handleSave} className="space-y-6">
              {/* 1. Basic Info */}
              <div className="bg-[#0f131c] border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
                <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                  <Package className="w-4 h-4 text-indigo-400" />
                  <span>1. Core Product Information</span>
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="md:col-span-2 space-y-1.5">
                    <label className="font-semibold text-slate-300 block">Product Name</label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700/80 rounded-lg text-sm text-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-300 block">SKU</label>
                    <input
                      type="text"
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-xs font-mono text-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-300 block">Slug</label>
                    <input
                      type="text"
                      required
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-xs font-mono text-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-300 block">Category</label>
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-white"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-300 block">Platform</label>
                    <select
                      value={platformId}
                      onChange={(e) => setPlatformId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-white"
                    >
                      {platforms.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-300 block">Brand</label>
                    <input
                      type="text"
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-300 block">Region</label>
                    <select
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-white"
                    >
                      <option value="GLOBAL">GLOBAL</option>
                      <option value="INDIA">INDIA</option>
                      <option value="EUROPE">EUROPE</option>
                      <option value="NORTH_AMERICA">NORTH AMERICA</option>
                    </select>
                  </div>

                  <div className="md:col-span-2 space-y-1.5">
                    <label className="font-semibold text-slate-300 block">Short Description</label>
                    <input
                      type="text"
                      value={shortDescription}
                      onChange={(e) => setShortDescription(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-white"
                    />
                  </div>

                  <div className="md:col-span-2 space-y-1.5">
                    <label className="font-semibold text-slate-300 block">Full Description</label>
                    <textarea
                      rows={4}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-white"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Pricing & Dates */}
              <div className="bg-[#0f131c] border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
                <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                  <span className="text-emerald-400 font-bold">₹</span>
                  <span>2. Pricing &amp; Discounts</span>
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-300 block">Regular Price (₹)</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-sm text-white font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-300 block">Discount Price (₹)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={discountPrice}
                      onChange={(e) => setDiscountPrice(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-sm text-emerald-400 font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-300 block">Discount Starts</label>
                    <input
                      type="datetime-local"
                      value={discountStartDate}
                      onChange={(e) => setDiscountStartDate(e.target.value)}
                      className="w-full px-2.5 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-slate-300"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-300 block">Discount Ends</label>
                    <input
                      type="datetime-local"
                      value={discountEndDate}
                      onChange={(e) => setDiscountEndDate(e.target.value)}
                      className="w-full px-2.5 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-slate-300"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Inventory */}
              <div className="bg-[#0f131c] border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
                <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  <span>3. Inventory &amp; Stock Threshold</span>
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-300 block">Stock Units</label>
                    <input
                      type="number"
                      min="0"
                      value={stockQuantity}
                      onChange={(e) => setStockQuantity(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-sm text-white font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-300 block">Low-Stock Alert Level</label>
                    <input
                      type="number"
                      min="0"
                      value={lowStockThreshold}
                      onChange={(e) => setLowStockThreshold(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-sm text-white font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-300 block">Delivery Mechanism</label>
                    <select
                      value={deliveryType}
                      onChange={(e) => setDeliveryType(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-white"
                    >
                      <option value="INSTANT_KEY">Instant Digital Key</option>
                      <option value="ACCOUNT_SERVICE">Direct Account Service</option>
                      <option value="GIFT_LINK">Official Gift Link</option>
                      <option value="PHYSICAL_SHIPPING">Physical Shipping</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 4. Images */}
              <div className="bg-[#0f131c] border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-indigo-400" />
                    <span>4. Product Media &amp; Gallery</span>
                  </h2>
                  <span className="text-[11px] text-slate-400">{images.length} image(s)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 bg-slate-950 border border-dashed border-slate-700 rounded-xl text-center space-y-2">
                    <Upload className="w-5 h-5 mx-auto text-indigo-400" />
                    <div>
                      <label className="cursor-pointer font-bold text-indigo-400 hover:text-indigo-300">
                        <span>Upload new image</span>
                        <input
                          type="file"
                          accept="image/png, image/jpeg, image/webp"
                          onChange={handleFileUpload}
                          disabled={uploadingImage}
                          className="hidden"
                        />
                      </label>
                    </div>
                    {uploadingImage && <p className="text-[10px] text-indigo-300 animate-pulse">Uploading...</p>}
                  </div>

                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                    <label className="font-semibold text-slate-300 block">Add by URL</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="url"
                        value={customImageUrl}
                        onChange={(e) => setCustomImageUrl(e.target.value)}
                        placeholder="https://example.com/image.jpg"
                        className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                      />
                      <button
                        type="button"
                        onClick={handleAddImageUrl}
                        className="px-3 py-2 bg-slate-800 text-white font-semibold rounded-lg"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>

                {images.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 pt-2">
                    {images.map((img, i) => (
                      <div
                        key={i}
                        className={`relative group rounded-xl overflow-hidden bg-slate-950 border ${
                          i === 0 ? 'border-indigo-500 shadow-md shadow-indigo-500/20' : 'border-slate-800'
                        }`}
                      >
                        <img src={img} alt="Product media" className="h-28 w-full object-cover" />
                        {i === 0 && (
                          <span className="absolute top-1 left-1 bg-indigo-600 text-[9px] font-bold text-white px-1.5 py-0.5 rounded shadow">
                            PRIMARY
                          </span>
                        )}
                        <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1 transition-opacity">
                          {i > 0 && (
                            <button
                              type="button"
                              onClick={() => handleSetPrimary(i)}
                              className="p-1 bg-indigo-600 hover:bg-indigo-500 rounded text-white text-[10px]"
                            >
                              Set Main
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(i)}
                            className="p-1 bg-rose-600 hover:bg-rose-500 rounded text-white"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 5. Status & Visibility */}
              <div className="bg-[#0f131c] border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
                <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>5. Visibility &amp; Status</span>
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-300 block">Catalog Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-white"
                    >
                      <option value="PUBLISHED">PUBLISHED (Live on Customer Storefront)</option>
                      <option value="DRAFT">DRAFT (Hidden from Storefront)</option>
                      <option value="UNPUBLISHED">UNPUBLISHED (Archived)</option>
                      <option value="OUT_OF_STOCK">OUT OF STOCK</option>
                    </select>
                  </div>

                  <div className="space-y-1.5 flex flex-col justify-center">
                    <label className="font-semibold text-slate-300 block">Homepage Spotlight</label>
                    <label className="inline-flex items-center gap-2 cursor-pointer mt-1">
                      <input
                        type="checkbox"
                        checked={isFeatured}
                        onChange={(e) => setIsFeatured(e.target.checked)}
                        className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-900 h-4 w-4"
                      />
                      <span className="text-slate-300">Feature on store homepage</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* 6. Specifications */}
              <div className="bg-[#0f131c] border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <Info className="w-4 h-4 text-slate-400" />
                    <span>6. Specifications &amp; Attributes</span>
                  </h2>
                  <button
                    type="button"
                    onClick={handleAddSpec}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Row</span>
                  </button>
                </div>

                <div className="space-y-2 text-xs">
                  {specList.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={item.key}
                        onChange={(e) => handleSpecChange(idx, 'key', e.target.value)}
                        placeholder="Property Name"
                        className="w-1/3 px-3 py-1.5 bg-slate-950 border border-slate-700/80 rounded-lg text-white"
                      />
                      <input
                        type="text"
                        value={item.value}
                        onChange={(e) => handleSpecChange(idx, 'value', e.target.value)}
                        placeholder="Property Value"
                        className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-700/80 rounded-lg text-white"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveSpec(idx)}
                        className="p-1.5 text-slate-500 hover:text-rose-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-3 border-t border-slate-800/60">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-400">Weight</label>
                    <input
                      type="text"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      placeholder="e.g. 0.25 kg"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-400">Dimensions</label>
                    <input
                      type="text"
                      value={dimensions}
                      onChange={(e) => setDimensions(e.target.value)}
                      placeholder="e.g. 15 x 10 x 2 cm"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <Link
                  href="/admin/products"
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg shadow-lg shadow-indigo-600/30 flex items-center gap-2 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save All Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Key Vault Section */}
          {product && (
            <div className="bg-[#0f131c] border border-cyan-800/30 rounded-2xl p-6 space-y-4 shadow-xl mt-8">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-cyan-400" />
                    <span>Fanar Key Vault &amp; License Ingestion</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Hardware-grade AES-256-GCM encrypted serial inventory
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs font-mono">
                  <span className="text-emerald-400">
                    {product.vaultStats?.availableKeys || 0} Available
                  </span>
                  <span className="text-slate-500">|</span>
                  <span className="text-slate-400">{product.vaultStats?.soldKeys || 0} Sold</span>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <label className="font-semibold text-slate-300 block">
                  Add New Serial Keys to Vault (One key per line)
                </label>
                <textarea
                  rows={3}
                  value={additionalKeys}
                  onChange={(e) => setAdditionalKeys(e.target.value)}
                  placeholder="KEY1-XXXX-YYYY&#10;KEY2-XXXX-YYYY"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg font-mono text-cyan-300 text-xs focus:outline-none focus:border-cyan-500"
                />
                <button
                  type="button"
                  onClick={handleIngestKeys}
                  disabled={ingestingKeys || !additionalKeys.trim()}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 disabled:opacity-40 transition-colors"
                >
                  {ingestingKeys ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Encrypting &amp; Ingesting...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Encrypt &amp; Add Keys</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
