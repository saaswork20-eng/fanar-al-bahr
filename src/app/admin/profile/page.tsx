'use client';

import React, { useEffect, useState } from 'react';
import {
  UserCheck,
  Shield,
  Mail,
  Phone,
  Save,
  CheckCircle2,
  RefreshCw,
  X,
  Lock,
  User,
} from 'lucide-react';
import AdminSidebar from '@/components/admin/AdminSidebar';

interface AdminProfileData {
  id: string;
  email: string;
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  role: string;
  createdAt: string;
}

export default function AdminProfilePage() {
  const [profile, setProfile] = useState<AdminProfileData | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/admin/profile');
      const json = await res.json();
      if (json.success) {
        setProfile(json.profile);
        setFirstName(json.profile.firstName || '');
        setLastName(json.profile.lastName || '');
        setPhone(json.profile.phone || '');
      }
    } catch (err) {
      console.error('Failed to load admin profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/v1/admin/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          phone,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setMessage({ type: 'success', text: 'Admin profile updated successfully.' });
        fetchProfile();
      } else {
        setMessage({ type: 'error', text: json.error || 'Failed to update profile.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error occurred.' });
    } finally {
      setSaving(false);
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
              <UserCheck className="w-4 h-4 text-amber-400" />
              <span>Admin Profile & Credentials</span>
            </h1>
            <p className="text-xs text-slate-400">Store owner personal information and system authority</p>
          </div>

          <button
            onClick={fetchProfile}
            disabled={loading}
            className="p-2 rounded-xl bg-[#12161f] border border-[#232a3b] text-slate-400 hover:text-white transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-6 md:p-8 space-y-6 max-w-2xl">
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

          {loading || !profile ? (
            <div className="p-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
              <span>Loading profile details...</span>
            </div>
          ) : (
            <form onSubmit={handleSave} className="p-6 rounded-2xl bg-[#0e121a] border border-[#232a3b] space-y-5">
              <div className="flex items-center justify-between border-b border-[#232a3b] pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <Shield className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">{profile.name || 'Store Administrator'}</h3>
                    <span className="text-[11px] text-amber-400 font-mono font-bold uppercase">
                      Role: {profile.role} (Fanar Store Owner)
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#141a24] border border-[#283247] text-[10px] text-emerald-400 font-mono">
                  <Lock className="w-3 h-3" />
                  <span>Role Protected</span>
                </div>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">Primary Email (Locked)</label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      disabled
                      value={profile.email}
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#141a24] border border-[#283247] text-slate-400 font-mono cursor-not-allowed opacity-80"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Security notice: Email address modification requires identity re-verification.
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-slate-400 block mb-1">First Name</label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="e.g. Fanar"
                      className="w-full px-3 py-2 rounded-xl bg-[#141a24] border border-[#283247] text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Last Name</label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="e.g. Admin"
                      className="w-full px-3 py-2 rounded-xl bg-[#141a24] border border-[#283247] text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Phone Number</label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 ..."
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#141a24] border border-[#283247] text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-[#232a3b] flex items-center justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-md shadow-amber-500/20 disabled:opacity-50 transition-all"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Saving...' : 'Save Profile'}</span>
                </button>
              </div>
            </form>
          )}
        </main>
      </div>
    </div>
  );
}
