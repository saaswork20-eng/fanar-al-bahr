'use client';

import React, { useEffect, useState } from 'react';
import {
  Layers,
  PlusCircle,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  X,
  AlertTriangle,
  Package,
} from 'lucide-react';
import AdminSidebar from '@/components/admin/AdminSidebar';

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  isActive: boolean;
  productCount: number;
  createdAt?: string;
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Create / Edit modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCat, setSelectedCat] = useState<CategoryItem | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      const res = await fetch(`/api/v1/admin/categories?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setCategories(json.categories);
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openCreateModal = () => {
    setIsEditing(false);
    setSelectedCat(null);
    setName('');
    setSlug('');
    setDescription('');
    setImageUrl('');
    setIsActive(true);
    setModalOpen(true);
  };

  const openEditModal = (cat: CategoryItem) => {
    setIsEditing(true);
    setSelectedCat(cat);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description || '');
    setImageUrl(cat.imageUrl || '');
    setIsActive(cat.isActive);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setMessage({ type: 'error', text: 'Category name is required.' });
      return;
    }

    setSaving(true);
    try {
      if (isEditing && selectedCat) {
        const res = await fetch(`/api/v1/admin/categories/${selectedCat.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            slug: slug.trim() || undefined,
            description: description.trim() || null,
            imageUrl: imageUrl.trim() || null,
            isActive,
          }),
        });
        const json = await res.json();
        if (json.success) {
          setMessage({ type: 'success', text: 'Category updated successfully.' });
          setModalOpen(false);
          fetchCategories();
        } else {
          setMessage({ type: 'error', text: json.error || 'Failed to update category.' });
        }
      } else {
        const res = await fetch('/api/v1/admin/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            slug: slug.trim() || undefined,
            description: description.trim() || null,
            imageUrl: imageUrl.trim() || null,
            isActive,
          }),
        });
        const json = await res.json();
        if (json.success) {
          setMessage({ type: 'success', text: 'Category created successfully.' });
          setModalOpen(false);
          fetchCategories();
        } else {
          setMessage({ type: 'error', text: json.error || 'Failed to create category.' });
        }
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error occurred.' });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (cat: CategoryItem) => {
    try {
      const res = await fetch(`/api/v1/admin/categories/${cat.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !cat.isActive }),
      });
      const json = await res.json();
      if (json.success) {
        setMessage({
          type: 'success',
          text: `Category "${cat.name}" ${!cat.isActive ? 'activated' : 'deactivated'}.`,
        });
        fetchCategories();
      } else {
        setMessage({ type: 'error', text: json.error || 'Failed to toggle status.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleDelete = async (cat: CategoryItem) => {
    if (cat.productCount > 0) {
      setMessage({
        type: 'error',
        text: `Cannot delete "${cat.name}": ${cat.productCount} product(s) are assigned to it. Please deactivate the category or reassign its products first.`,
      });
      return;
    }

    if (!confirm(`Are you sure you want to permanently delete category "${cat.name}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/v1/admin/categories/${cat.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setMessage({ type: 'success', text: `Category "${cat.name}" deleted.` });
        fetchCategories();
      } else {
        setMessage({ type: 'error', text: json.error || 'Failed to delete category.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
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
              <Layers className="w-4 h-4 text-amber-400" />
              <span>Category Management</span>
            </h1>
            <p className="text-xs text-slate-400">Organize store catalog hierarchy and navigation</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={openCreateModal}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Add Category</span>
            </button>

            <button
              onClick={fetchCategories}
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

          {/* Search Bar */}
          <div className="p-4 rounded-2xl bg-[#0e121a] border border-[#232a3b] flex items-center justify-between gap-4">
            <div className="w-full md:w-96 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search categories by name, slug..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#141a24] border border-[#283247] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Total Categories: {categories.length}
            </span>
          </div>

          {/* Category Table */}
          <div className="rounded-2xl bg-[#0e121a] border border-[#232a3b] overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                <span>Loading categories...</span>
              </div>
            ) : categories.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-500">
                No categories found. Click &quot;Add Category&quot; to create one.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#141a24] text-[10px] uppercase font-bold text-slate-400 border-b border-[#232a3b]">
                    <tr>
                      <th className="py-3.5 px-4">Name</th>
                      <th className="py-3.5 px-4">Slug</th>
                      <th className="py-3.5 px-4">Description</th>
                      <th className="py-3.5 px-4 text-center">Products</th>
                      <th className="py-3.5 px-4 text-center">Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#232a3b]">
                    {categories.map((cat) => (
                      <tr key={cat.id} className="hover:bg-[#121620] transition-colors">
                        <td className="py-3 px-4 font-semibold text-white">
                          <div className="flex items-center gap-2.5">
                            {cat.imageUrl ? (
                              <img
                                src={cat.imageUrl}
                                alt={cat.name}
                                className="w-7 h-7 rounded object-cover border border-[#232a3b]"
                              />
                            ) : (
                              <div className="w-7 h-7 rounded bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                                <Layers className="w-3.5 h-3.5" />
                              </div>
                            )}
                            <span>{cat.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-400">{cat.slug}</td>
                        <td className="py-3 px-4 text-slate-400 max-w-xs truncate">
                          {cat.description || '—'}
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-white">
                          {cat.productCount}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => handleToggleActive(cat)}
                            className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold transition-all ${
                              cat.isActive
                                ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 hover:bg-emerald-900/60'
                                : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
                            }`}
                          >
                            {cat.isActive ? 'ACTIVE' : 'INACTIVE'}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-right space-x-2">
                          <button
                            onClick={() => openEditModal(cat)}
                            className="p-1.5 rounded-lg bg-[#182030] hover:bg-[#202b40] text-slate-300 hover:text-white border border-[#2b3952] transition-colors"
                            title="Edit Category"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(cat)}
                            className="p-1.5 rounded-lg bg-rose-950/30 hover:bg-rose-900/40 text-rose-400 border border-rose-900/40 transition-colors"
                            title="Delete Category"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Create / Edit Category Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0f131c] border border-[#283247] rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#232a3b] pb-3">
              <h3 className="font-bold text-sm text-white">
                {isEditing ? 'Edit Category' : 'Create New Category'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!isEditing && !slug) {
                      setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
                    }
                  }}
                  placeholder="e.g. Operating Systems"
                  className="w-full px-3 py-2 rounded-xl bg-[#141a24] border border-[#283247] text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Slug (URL identifier)</label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="e.g. operating-systems"
                  className="w-full px-3 py-2 rounded-xl bg-[#141a24] border border-[#283247] text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of products in this category..."
                  className="w-full px-3 py-2 rounded-xl bg-[#141a24] border border-[#283247] text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Image URL (Optional)</label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 rounded-xl bg-[#141a24] border border-[#283247] text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="categoryActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded bg-[#141a24] border-[#283247] text-amber-500 focus:ring-0"
                />
                <label htmlFor="categoryActive" className="text-slate-300 font-semibold cursor-pointer">
                  Active (Visible on buyer storefront navigation)
                </label>
              </div>

              <div className="pt-3 border-t border-[#232a3b] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl border border-[#232a3b] text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold disabled:opacity-50"
                >
                  {saving ? 'Saving...' : isEditing ? 'Update Category' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
