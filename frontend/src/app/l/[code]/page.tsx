'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { apiClient } from '../../../lib/api-client';
import { Mail, User, Building, ArrowRight, Loader2, AlertCircle, Sparkles } from 'lucide-react';

export default function LinkGatewayPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const code = params?.code as string;
  const isGated = searchParams?.get('gate') === 'true';

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If not gated, immediately redirect to backend redirections router
    if (!isGated && code) {
      const apiURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      window.location.href = `${apiURL}/l/${code}`;
    }
  }, [isGated, code]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Please provide your email address.');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please provide a valid corporate email.');
      return;
    }

    setLoading(true);
    try {
      // 1. Fetch asset details first or submit lead directly
      // Since it's a link, we need to locate its ID. On the backend redirect endpoint:
      // We can just forward email as query parameters, which handles lead creation automatically!
      // This is extremely simple and robust. We redirect the visitor to:
      // /l/:code?email=visitor@company.com
      const apiURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      window.location.href = `${apiURL}/l/${code}?email=${encodeURIComponent(email.toLowerCase())}`;
    } catch (err: any) {
      setError('Failed to authorize access. Please try again.');
      setLoading(false);
    }
  };

  // If auto-redirecting, show spinner
  if (!isGated) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-background text-text-primary">
        <Loader2 className="h-8 w-8 animate-spin text-brand-accent mb-4" />
        <p className="text-sm font-medium">Redirecting you to target destination...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-screen items-center justify-center bg-background p-6 text-text-primary">
      <div className="w-full max-w-md rounded-card border border-border bg-card p-8 shadow-card text-center space-y-6">
        {/* Branding icon */}
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent-blue-light text-accent-blue">
          <Sparkles className="h-6 w-6 text-accent-blue animate-pulse" />
        </div>

        {/* Text */}
        <div className="space-y-2">
          <h2 className="text-xl font-bold tracking-tight text-text-primary">Authorization Required</h2>
          <p className="text-xs text-text-secondary">
            The owner of this link requested email verification. Please submit your details to proceed.
          </p>
        </div>

        {/* Validation Errors */}
        {error && (
          <div className="flex items-start gap-2.5 rounded-lg bg-red-50 dark:bg-red-950/20 p-4 text-xs font-medium text-red-600 dark:text-red-400 text-left border border-red-200 dark:border-red-900/50">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Lead Capture Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          {/* Name input */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-text-primary">Full Name (Optional)</label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 h-4 w-4 text-text-muted" />
              <input
                type="text"
                placeholder="Jane Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-input-border bg-surface pl-9 pr-4 py-2 text-xs text-text-primary focus:border-accent-blue focus:outline-none"
              />
            </div>
          </div>

          {/* Email input */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-text-primary">Corporate Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-text-muted" />
              <input
                type="email"
                placeholder="jane@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-input-border bg-surface pl-9 pr-4 py-2 text-xs text-text-primary focus:border-accent-blue focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Company input */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-text-primary">Company (Optional)</label>
            <div className="relative">
              <Building className="absolute left-3 top-2.5 h-4 w-4 text-text-muted" />
              <input
                type="text"
                placeholder="e.g. Stripe, Acme Corp"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full rounded-lg border border-input-border bg-surface pl-9 pr-4 py-2 text-xs text-text-primary focus:border-accent-blue focus:outline-none"
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent-blue py-3 text-xs font-semibold text-white transition-colors hover:bg-accent-blue-hover cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Redirecting...</span>
              </>
            ) : (
              <>
                <span>Access Destination</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
