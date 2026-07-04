'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../hooks/use-auth';
import { Mail, Lock, Loader2, AlertCircle } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  // Validate form fields
  const validateForm = () => {
    let isValid = true;
    setEmailError('');
    setPasswordError('');

    if (!email) {
      setEmailError('Email address is required.');
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Please enter a valid email address.');
      isValid = false;
    }

    if (!password) {
      setPasswordError('Password is required.');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError('');

    if (!validateForm()) return;

    setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setApiError(
        err.response?.data?.message || 'Login failed. Please verify your credentials and try again.'
      );
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="space-y-2 text-center lg:text-left">
        <h3 className="text-2xl font-bold tracking-tight text-text-primary">Sign in to TraceLink</h3>
        <p className="text-sm text-text-secondary">Enter your email credentials to access your dashboard.</p>
      </div>

      {/* API Errors */}
      {apiError && (
        <div className="flex items-start gap-2.5 rounded-lg bg-red-50 p-4 text-xs font-medium text-red-600">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{apiError}</span>
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
        <div className="space-y-1">
          <label htmlFor="email" className="text-xs font-semibold text-text-primary">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-text-muted" />
            <input
              id="email"
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full rounded-lg border px-10 py-3 text-sm text-text-primary bg-surface transition-colors focus:border-accent-blue focus:ring-2 focus:ring-accent-blue-light focus:outline-none ${
                emailError ? 'border-danger' : 'border-input-border'
              }`}
            />
          </div>
          {emailError && <p className="text-[11px] text-danger font-medium">{emailError}</p>}
        </div>

        {/* Password */}
        <div className="space-y-1">
          <label htmlFor="password" className="text-xs font-semibold text-text-primary">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-text-muted" />
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full rounded-lg border px-10 py-3 text-sm text-text-primary bg-surface transition-colors focus:border-accent-blue focus:ring-2 focus:ring-accent-blue-light focus:outline-none ${
                passwordError ? 'border-danger' : 'border-input-border'
              }`}
            />
          </div>
          {passwordError && <p className="text-[11px] text-danger font-medium">{passwordError}</p>}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent-blue py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-blue-hover disabled:bg-gray-400 cursor-pointer shadow-sm"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Logging in...</span>
            </>
          ) : (
            'Sign in'
          )}
        </button>
      </form>

      {/* Redirect footer */}
      <div className="text-center text-xs text-text-secondary">
        Don't have an account?{' '}
        <Link href="/signup" className="font-semibold text-accent-blue hover:underline">
          Create an account
        </Link>
      </div>
    </div>
  );
}
