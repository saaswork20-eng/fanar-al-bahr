'use client';

import React from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home, Mail } from 'lucide-react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalErrorPage({ error, reset }: ErrorProps) {
  // Never expose internal stack traces or database errors in production
  console.error('[Fanar Store Client Error Boundary]:', error?.message || error);

  return (
    <div className="min-h-screen bg-[#070a0f] text-slate-100 flex flex-col items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full text-center space-y-6 bg-slate-950/80 border border-slate-800 p-8 sm:p-10 rounded-3xl shadow-2xl backdrop-blur-xl">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mx-auto">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-xs uppercase font-mono font-bold text-rose-400 tracking-wider">
            System Notice
          </span>
          <h1 className="text-2xl font-black text-white">
            Something Went Wrong
          </h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            An unexpected error occurred while processing your request. Our technical team has been notified.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="flex-1 py-3 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all"
          >
            <RefreshCw className="w-4 h-4" /> Try Again
          </button>
          <Link
            href="/"
            className="flex-1 py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 font-semibold text-xs flex items-center justify-center gap-2 transition-all"
          >
            <Home className="w-4 h-4" /> Store Home
          </Link>
        </div>

        <p className="text-[11px] text-slate-500 pt-4 border-t border-slate-900 flex items-center justify-center gap-1">
          <Mail className="w-3.5 h-3.5" /> Need assistance? Contact{' '}
          <a href="mailto:support@fanar.com" className="text-cyan-400 hover:underline">
            support@fanar.com
          </a>
        </p>
      </div>
    </div>
  );
}
