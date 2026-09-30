'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User,
  Mail,
  Shield,
  Phone,
  CheckCircle2,
  AlertCircle,
  Save,
  Lock,
  Calendar,
} from 'lucide-react';
import StorefrontHeader from '@/components/storefront/Header';
import StorefrontFooter from '@/components/storefront/Footer';
import AccountNav from '@/components/storefront/AccountNav';

export default function ProfilePage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('BUYER');
  const [status, setStatus] = useState('ACTIVE');
  const [userId, setUserId] = useState('');
  const [createdAt, setCreatedAt] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch('/api/v1/account/profile');
        if (res.status === 401) {
          router.push('/login?from=/account/profile');
          return;
        }
        const data = await res.json();
        if (data.success && data.user) {
          setFirstName(data.user.firstName || '');
          setLastName(data.user.lastName || '');
          setPhone(data.user.phone || '');
          setEmail(data.user.email || '');
          setRole(data.user.role || 'BUYER');
          setStatus(data.user.status || 'ACTIVE');
          setUserId(data.user.id || '');
          setCreatedAt(data.user.createdAt || '');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');
    setSaving(true);

    try {
      const res = await fetch('/api/v1/account/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          phone,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMessage('Your profile information has been saved successfully.');
      } else {
        setErrorMessage(data.error || 'Failed to update profile.');
      }
    } catch {
      setErrorMessage('Network connection error.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      <StorefrontHeader />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-400 mb-6">
          <Link href="/" className="hover:text-amber-400 transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link href="/account" className="hover:text-amber-400 transition-colors">
            Account
          </Link>
          <span>/</span>
          <span className="text-amber-400 font-medium">Profile Settings</span>
        </div>

        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <User className="w-8 h-8 text-amber-400" />
            Profile Information
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Update your personal contact details. Security roles and account status are strictly governed.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Account Navigation Sidebar */}
          <AccountNav />

          {/* Profile Form */}
          <div className="flex-1 w-full max-w-2xl bg-[#12161f] border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
            {successMessage && (
              <div className="mb-6 p-4 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2 shadow-lg">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {errorMessage && (
              <div className="mb-6 p-4 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2 shadow-lg">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {loading ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                Loading profile details...
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Editable Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="e.g. Alex"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="e.g. Mercer"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Phone Number
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 9876543210"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
                    />
                    <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  </div>
                </div>

                {/* Email (Protected / Read-only in profile directly) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-300">
                      Email Address
                    </label>
                    <span className="text-[10px] text-amber-400/80 flex items-center gap-1 font-medium">
                      <Lock className="w-3 h-3" />
                      Verification Required to Change
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      disabled
                      className="w-full bg-slate-900/60 border border-slate-800/80 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-slate-400 cursor-not-allowed"
                    />
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  </div>
                </div>

                {/* Read-only Security Claims */}
                <div className="pt-4 border-t border-slate-800">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-slate-400" />
                    System Authorization & Status
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                      <span className="text-slate-500 block text-[10px]">Assigned Role</span>
                      <span className="font-semibold text-white mt-0.5 block">{role}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                      <span className="text-slate-500 block text-[10px]">Account Status</span>
                      <span className="font-semibold text-emerald-400 mt-0.5 block">{status}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 col-span-2 sm:col-span-1">
                      <span className="text-slate-500 block text-[10px]">Member Since</span>
                      <span className="font-semibold text-slate-300 mt-0.5 block">
                        {createdAt ? new Date(createdAt).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs transition-colors flex items-center gap-2 shadow-lg shadow-amber-500/10"
                  >
                    <Save className="w-4 h-4" />
                    <span>{saving ? 'Saving Changes...' : 'Save Profile'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>

      <StorefrontFooter />
    </div>
  );
}
