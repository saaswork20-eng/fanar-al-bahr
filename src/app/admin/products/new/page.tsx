'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Package,
  PlusCircle,
  ArrowLeft,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Upload,
  Info,
  Star,
  Image as ImageIcon,
  Trash2,
  MoveLeft,
  MoveRight,
  Plus,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';
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

export default function AdminNewProductPage() {
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State - Basic
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [sku, setSku] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [brand, setBrand] = useState('Fanar Al Bhar');
  const [categoryId, setCategoryId] = useState('');
  const [platformId, setPlatformId] = useState('');
  const [region, setRegion] = useState('GLOBAL');

  // Form State - Pricing
  const [price, setPrice] = useState('');
  const [discountPrice, setDiscountPrice] = useState('');
  const [discountStartDate, setDiscountStartDate] = useState('');
  const [discountEndDate, setDiscountEndDate] = useState('');

  // Form State - Inventory
  const [stockQuantity, setStockQuantity] = useState('10');
  const [lowStockThreshold, setLowStockThreshold] = useState('5');
  const [deliveryType, setDeliveryType] = useState('INSTANT_KEY');
  const [rawKeys, setRawKeys] = useState('');

  // Form State - Images
  const [images, setImages] = useState<string[]>([]);
  const [customImageUrl, setCustomImageUrl] = useState('');

  // Form State - Status & Attributes
  const [status, setStatus] = useState<'PUBLISHED' | 'DRAFT' | 'UNPUBLISHED'>('PUBLISHED');
  const [isFeatured, setIsFeatured] = useState(false);
  const [weight, setWeight] = useState('');
  const [dimensions, setDimensions] = useState('');
  const [specList, setSpecList] = useState<SpecItem[]>([
    { key: 'Platform', value: 'PC / Digital' },
    { key: 'Region', value: 'Global' },
  ]);

  useEffect(() => {
    async function loadMeta() {
      try {
        const res = await fetch('/api/v1/admin/products');
        const data = await res.json();
        if (data.success) {
          setCategories(data.categories || []);
          setPlatforms(data.platforms || []);
          if (data.categories?.length > 0) setCategoryId(data.categories[0].id);
          if (data.platforms?.length > 0) setPlatformId(data.platforms[0].id);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadMeta();
  }, []);

  // Auto-generate slug from title
  const handleTitleChange = (val: string) => {
    setTitle(val);
    const autoSlug = val
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    setSlug(autoSlug);
  };

  const handleGenerateSku = () => {
    const random = Math.random().toString(36).substring(2, 7).toUpperCase();
    setSku(`FAB-${random}`);
  };

  // Image Upload Handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setError(null);
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
        setError(data.error || 'Failed to upload image.');
      }
    } catch {
      setError('Network error while uploading image.');
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

  const handleMoveImage = (from: number, to: number) => {
    if (to < 0 || to >= images.length) return;
    setImages((prev) => {
      const copy = [...prev];
      const [item] = copy.splice(from, 1);
      copy.splice(to, 0, item);
      return copy;
    });
  };

  // Specifications
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

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const keysArray = rawKeys
        .split('\n')
        .map((k) => k.trim())
        .filter((k) => k.length > 0);

      // Validate pricing
      const numPrice = Number(price);
      if (isNaN(numPrice) || numPrice < 0) {
        setError('Price must be a valid non-negative number.');
        setSubmitting(false);
        return;
      }

      let numDiscount: number | null = null;
      if (discountPrice.trim()) {
        numDiscount = Number(discountPrice);
        if (isNaN(numDiscount) || numDiscount < 0) {
          setError('Discount price cannot be negative.');
          setSubmitting(false);
          return;
        }
        if (numDiscount > numPrice) {
          setError('Discount price cannot be greater than the regular price.');
          setSubmitting(false);
          return;
        }
      }

      // Convert specs to map
      const specMap: Record<string, string> = {};
      specList.forEach((s) => {
        if (s.key.trim() && s.value.trim()) {
          specMap[s.key.trim()] = s.value.trim();
        }
      });

      const finalCover = images[0] || 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80';

      const payload = {
        title: title.trim(),
        slug: slug.trim(),
        sku: sku.trim() || undefined,
        description: description.trim(),
        shortDescription: shortDescription.trim() || undefined,
        brand: brand.trim(),
        categoryId,
        platformId: platformId || undefined,
        region,
        price: numPrice,
        discountPrice: numDiscount,
        discountStartDate: discountStartDate || undefined,
        discountEndDate: discountEndDate || undefined,
        stockQuantity: keysArray.length > 0 ? keysArray.length : Number(stockQuantity),
        lowStockThreshold: Number(lowStockThreshold),
        deliveryType,
        coverImageUrl: finalCover,
        images: images.length > 0 ? images : [finalCover],
        status,
        isFeatured,
        specifications: JSON.stringify(specMap),
        weight: weight.trim() || undefined,
        dimensions: dimensions.trim() || undefined,
        keys: keysArray.length > 0 ? keysArray : undefined,
      };

      const res = await fetch('/api/v1/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to create product.');
        setSubmitting(false);
        return;
      }

      router.push('/admin/products');
      router.refresh();
    } catch {
      setError('Network connection error while creating product.');
      setSubmitting(false);
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
              <h1 className="text-base font-bold text-white tracking-wide">Add New Product</h1>
              <p className="text-[11px] text-slate-400">Create a Fanar Al Bhar product in the database</p>
            </div>
          </div>
        </header>

        <main className="p-6 sm:p-8 space-y-6 flex-1 max-w-5xl">
          {error && (
            <div className="p-3.5 rounded-xl border bg-rose-950/40 border-rose-800 text-rose-300 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Section 1: Basic Information */}
            <div className="bg-[#0f131c] border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
              <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                <Package className="w-4 h-4 text-indigo-400" />
                <span>1. Basic Product Information</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Product Name */}
                <div className="md:col-span-2 space-y-1.5">
                  <label className="font-semibold text-slate-300 block">
                    Product Title / Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="e.g. EA Sports FC 26 — Standard Edition"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700/80 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* SKU */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-slate-300">
                      SKU (Stock Keeping Unit)
                    </label>
                    <button
                      type="button"
                      onClick={handleGenerateSku}
                      className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold"
                    >
                      Generate SKU
                    </button>
                  </div>
                  <input
                    type="text"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="e.g. FAB-EAFC26-PC"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Slug */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300">
                    URL Slug (SEO Friendly) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="e.g. ea-sports-fc-26-pc"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Category */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300">
                    Category <span className="text-rose-400">*</span>
                  </label>
                  <select
                    required
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Platform / Device */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300">Platform / Ecosystem</label>
                  <select
                    value={platformId}
                    onChange={(e) => setPlatformId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    {platforms.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Brand */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300">Brand / Publisher</label>
                  <input
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="Fanar Al Bhar or Electronic Arts"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Region */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300">Region Activation</label>
                  <select
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="GLOBAL">GLOBAL (Worldwide)</option>
                    <option value="INDIA">INDIA / South Asia</option>
                    <option value="EUROPE">EUROPE</option>
                    <option value="NORTH_AMERICA">NORTH AMERICA</option>
                  </select>
                </div>

                {/* Short Description */}
                <div className="md:col-span-2 space-y-1.5">
                  <label className="font-semibold text-slate-300">Short Summary</label>
                  <input
                    type="text"
                    value={shortDescription}
                    onChange={(e) => setShortDescription(e.target.value)}
                    placeholder="One-line feature highlight displayed in search and product cards"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Full Description */}
                <div className="md:col-span-2 space-y-1.5">
                  <label className="font-semibold text-slate-300">
                    Product Description <span className="text-rose-400">*</span>
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Comprehensive description of features, compatibility, redemption steps..."
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Pricing & Discounts */}
            <div className="bg-[#0f131c] border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
              <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                <span className="text-emerald-400 font-bold">₹</span>
                <span>2. Pricing &amp; Promotional Schedule</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                {/* Regular Price */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300 block">
                    Regular Price (₹) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="e.g. 3850"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-sm text-white font-mono placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Discount Price */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300 block">
                    Sale / Discount Price (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={discountPrice}
                    onChange={(e) => setDiscountPrice(e.target.value)}
                    placeholder="e.g. 2999"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-sm text-emerald-400 font-mono placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Discount Start Date */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300 block">Sale Start Date</label>
                  <input
                    type="datetime-local"
                    value={discountStartDate}
                    onChange={(e) => setDiscountStartDate(e.target.value)}
                    className="w-full px-2.5 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Discount End Date */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300 block">Sale End Date</label>
                  <input
                    type="datetime-local"
                    value={discountEndDate}
                    onChange={(e) => setDiscountEndDate(e.target.value)}
                    className="w-full px-2.5 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Inventory Management */}
            <div className="bg-[#0f131c] border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
              <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                <Layers className="w-4 h-4 text-cyan-400" />
                <span>3. Inventory &amp; Digital Fulfillment</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                {/* Stock Quantity */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300 block">
                    Available Stock Quantity <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-sm text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                  <span className="text-[10px] text-slate-500 block">
                    Server-validated. Automatically counted if digital keys are pasted below.
                  </span>
                </div>

                {/* Low Stock Threshold */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300 block">Low-Stock Alert Level</label>
                  <input
                    type="number"
                    min="0"
                    value={lowStockThreshold}
                    onChange={(e) => setLowStockThreshold(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-sm text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                  <span className="text-[10px] text-slate-500 block">
                    Triggers warning in admin dashboard when stock &le; threshold.
                  </span>
                </div>

                {/* Delivery Type */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300 block">Delivery Mechanism</label>
                  <select
                    value={deliveryType}
                    onChange={(e) => setDeliveryType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="INSTANT_KEY">Instant Digital License Key (Vault)</option>
                    <option value="ACCOUNT_SERVICE">Direct Account Activation</option>
                    <option value="GIFT_LINK">Official Gift URL</option>
                    <option value="PHYSICAL_SHIPPING">Physical Shipping</option>
                  </select>
                </div>

                {/* Optional Batch Digital Key Vault */}
                <div className="md:col-span-3 space-y-1.5 pt-2">
                  <label className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Batch Digital Keys Ingestion (AES-256 Encrypted)</span>
                  </label>
                  <textarea
                    rows={3}
                    value={rawKeys}
                    onChange={(e) => setRawKeys(e.target.value)}
                    placeholder="Paste one license serial key per line (e.g. 4X9J-KP82-M7Q1)... Each key is encrypted using AES-256-GCM."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-xs font-mono text-cyan-300 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
            </div>

            {/* Section 4: Product Images */}
            <div className="bg-[#0f131c] border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-indigo-400" />
                  <span>4. Product Media &amp; Gallery</span>
                </h2>
                <span className="text-[11px] text-slate-400">{images.length} image(s) attached</span>
              </div>

              {/* Upload & Add Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* File Upload Button */}
                <div className="p-4 bg-slate-950 border border-dashed border-slate-700 rounded-xl text-center space-y-2">
                  <Upload className="w-5 h-5 mx-auto text-indigo-400" />
                  <div>
                    <label className="cursor-pointer font-bold text-indigo-400 hover:text-indigo-300">
                      <span>Click to upload image file</span>
                      <input
                        type="file"
                        accept="image/png, image/jpeg, image/webp"
                        onChange={handleFileUpload}
                        disabled={uploadingImage}
                        className="hidden"
                      />
                    </label>
                    <p className="text-[10px] text-slate-500 mt-1">PNG, JPG, or WEBP (Max 5MB)</p>
                  </div>
                  {uploadingImage && <p className="text-[10px] text-indigo-300 animate-pulse">Uploading...</p>}
                </div>

                {/* External URL Adder */}
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                  <label className="font-semibold text-slate-300 block">Or add by Image URL</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      value={customImageUrl}
                      onChange={(e) => setCustomImageUrl(e.target.value)}
                      placeholder="https://example.com/cover.jpg"
                      className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddImageUrl}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-lg transition-colors"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>

              {/* Gallery Grid */}
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

                      {/* Image Action Overlay */}
                      <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1 transition-opacity">
                        {i > 0 && (
                          <button
                            type="button"
                            onClick={() => handleSetPrimary(i)}
                            className="p-1 bg-indigo-600 hover:bg-indigo-500 rounded text-white text-[10px]"
                            title="Set as Primary"
                          >
                            Set Main
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(i)}
                          className="p-1 bg-rose-600 hover:bg-rose-500 rounded text-white"
                          title="Remove Image"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Section 5: Visibility & Publication Status */}
            <div className="bg-[#0f131c] border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
              <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>5. Publication Status &amp; Storefront Visibility</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Status Selection */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300 block">Catalog Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="PUBLISHED">PUBLISHED (Live on Customer Storefront)</option>
                    <option value="DRAFT">DRAFT (Hidden from Buyers)</option>
                    <option value="UNPUBLISHED">UNPUBLISHED (Deactivated)</option>
                  </select>
                </div>

                {/* Featured Toggle */}
                <div className="space-y-1.5 flex flex-col justify-center">
                  <label className="font-semibold text-slate-300 block">Homepage Spotlight</label>
                  <label className="inline-flex items-center gap-2 cursor-pointer mt-1">
                    <input
                      type="checkbox"
                      checked={isFeatured}
                      onChange={(e) => setIsFeatured(e.target.checked)}
                      className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-900 h-4 w-4"
                    />
                    <span className="text-slate-300">Showcase this product on homepage spotlight</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Section 6: Additional Information & Specs */}
            <div className="bg-[#0f131c] border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Info className="w-4 h-4 text-slate-400" />
                  <span>6. Specifications &amp; Dimensions</span>
                </h2>
                <button
                  type="button"
                  onClick={handleAddSpec}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Spec Row</span>
                </button>
              </div>

              {/* Specs Rows */}
              <div className="space-y-2 text-xs">
                {specList.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={item.key}
                      onChange={(e) => handleSpecChange(idx, 'key', e.target.value)}
                      placeholder="Spec Name (e.g. Developer, Storage)"
                      className="w-1/3 px-3 py-1.5 bg-slate-950 border border-slate-700/80 rounded-lg text-white"
                    />
                    <input
                      type="text"
                      value={item.value}
                      onChange={(e) => handleSpecChange(idx, 'value', e.target.value)}
                      placeholder="Spec Value (e.g. 50 GB, EA Games)"
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

              {/* Weight & Dimensions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-3 border-t border-slate-800/60">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-400">Weight (where applicable)</label>
                  <input
                    type="text"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="e.g. 0.25 kg"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-400">Dimensions (L x W x H)</label>
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

            {/* Form Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4">
              <Link
                href="/admin/products"
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Creating Product...</span>
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-4 h-4" />
                    <span>Create &amp; Save Product</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}
