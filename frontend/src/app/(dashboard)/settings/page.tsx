'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/use-auth';
import { useSearchParams } from 'next/navigation';
import { 
  User, 
  Lock, 
  Server, 
  Key, 
  AlertCircle, 
  CheckCircle, 
  Loader2, 
  CreditCard, 
  Sparkles, 
  Shield, 
  ShieldCheck,
  Receipt, 
  Download, 
  ChevronRight, 
  ArrowUpRight,
  X
} from 'lucide-react';
import { apiClient } from '../../../lib/api-client';

export default function SettingsPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get('tab') || 'default';

  const [quotaStats, setQuotaStats] = useState({
    linksCount: 0,
    filesCount: 0,
    totalStorage: 0,
  });

  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'pro' | 'enterprise'>('free');

  useEffect(() => {
    const fetchQuotas = async () => {
      try {
        const [linksRes, filesRes] = await Promise.all([
          apiClient.get('/api/links'),
          apiClient.get('/api/files'),
        ]);
        const links = linksRes.data || [];
        const files = filesRes.data || [];
        const storageSum = files.reduce((acc: number, f: any) => acc + (f.size || 0), 0);
        setQuotaStats({
          linksCount: links.length,
          filesCount: files.length,
          totalStorage: storageSum,
        });
      } catch (err) {
        console.error('Failed to fetch stats for quota computation', err);
      }
    };
    fetchQuotas();
  }, []);

  // Profile Form state
  const [name, setName] = useState(user?.name || '');
  const [email] = useState(user?.email || '');
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // Password Form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Storage Form state
  const [r2AccessKey, setR2AccessKey] = useState('');
  const [r2SecretKey, setR2SecretKey] = useState('');
  const [r2Bucket, setR2Bucket] = useState('');
  const [r2Endpoint, setR2Endpoint] = useState('');
  const [savingStorage, setSavingStorage] = useState(false);
  const [storageSuccess, setStorageSuccess] = useState('');
  const [storageError, setStorageError] = useState('');

  useEffect(() => {
    const loadUserSettings = async () => {
      try {
        const res = await apiClient.get('/api/auth/me');
        const userData = res.data;
        if (userData) {
          setName(userData.name || '');
          if (userData.storageConfig) {
            setR2AccessKey(userData.storageConfig.accessKeyId || '');
            setR2SecretKey(userData.storageConfig.secretAccessKey || '');
            setR2Bucket(userData.storageConfig.bucketName || '');
            setR2Endpoint(userData.storageConfig.endpoint || '');
          }
        }
      } catch (err) {
        console.error('Failed to load user settings profile', err);
      }
    };
    loadUserSettings();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');

    if (!name) {
      setProfileError('Name cannot be empty.');
      return;
    }

    setUpdatingProfile(true);
    try {
      await apiClient.put('/api/auth/settings', { name });
      setProfileSuccess('Profile name updated successfully.');
    } catch (err: any) {
      setProfileError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Please fill in all fields.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    setUpdatingPassword(true);
    try {
      await apiClient.put('/api/auth/settings', { currentPassword, newPassword });
      setPasswordSuccess('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordError(err.response?.data?.message || 'Failed to change password. Please check your credentials.');
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleSaveStorage = async (e: React.FormEvent) => {
    e.preventDefault();
    setStorageSuccess('');
    setStorageError('');
    setSavingStorage(true);

    try {
      const storageConfig = {
        accessKeyId: r2AccessKey,
        secretAccessKey: r2SecretKey,
        bucketName: r2Bucket,
        endpoint: r2Endpoint,
      };

      const res = await apiClient.put('/api/auth/settings', { storageConfig });
      setStorageSuccess('Cloudflare R2 storage credentials saved successfully.');
      
      const updatedUser = res.data?.user;
      if (updatedUser && updatedUser.storageConfig) {
        setR2AccessKey(updatedUser.storageConfig.accessKeyId || '');
        setR2SecretKey(updatedUser.storageConfig.secretAccessKey || '');
        setR2Bucket(updatedUser.storageConfig.bucketName || '');
        setR2Endpoint(updatedUser.storageConfig.endpoint || '');
      }
    } catch (err: any) {
      setStorageError(err.response?.data?.message || 'Failed to save storage settings.');
    } finally {
      setSavingStorage(false);
    }
  };

  const handleResetStorage = async () => {
    if (!confirm('Are you sure you want to reset to default storage? All future uploads will use the platform default storage.')) {
      return;
    }
    setStorageSuccess('');
    setStorageError('');
    setSavingStorage(true);
    try {
      const res = await apiClient.put('/api/auth/settings', { storageConfig: null });
      setStorageSuccess('Storage settings reset to platform default.');
      setR2AccessKey('');
      setR2SecretKey('');
      setR2Bucket('');
      setR2Endpoint('');
    } catch (err: any) {
      setStorageError(err.response?.data?.message || 'Failed to reset storage configuration.');
    } finally {
      setSavingStorage(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-text-primary">
          {currentTab === 'billing' ? 'Billing & Subscriptions' : 'Account Settings'}
        </h2>
        <p className="text-sm text-text-secondary">
          {currentTab === 'billing'
            ? 'Manage your subscriptions, usage limits, billing history, and invoices.'
            : 'Configure your profile, security details, and storage drivers.'}
        </p>
      </div>

      {currentTab !== 'billing' ? (
        <>
          <div className="grid gap-8 md:grid-cols-2">
            {/* Profile Card */}
            <div className="rounded-card border border-border bg-surface p-6 shadow-[0px_1px_3px_rgba(0,0,0,0.03)]">
              <div className="flex items-center gap-2 border-b border-divider pb-3 mb-4">
                <User className="h-5 w-5 text-text-muted" />
                <h3 className="font-bold text-text-primary">Profile Info</h3>
              </div>

              {profileError && (
                <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 p-3.5 text-xs text-red-600 font-medium">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{profileError}</span>
                </div>
              )}

              {profileSuccess && (
                <div className="mb-4 flex items-center gap-2 rounded-lg bg-green-50 p-3.5 text-xs text-green-700 font-medium">
                  <CheckCircle className="h-4 w-4 shrink-0" />
                  <span>{profileSuccess}</span>
                </div>
              )}

              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-primary">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-lg border border-input-border bg-surface px-3.5 py-2 text-sm text-text-primary focus:border-accent-blue focus:ring-2 focus:ring-accent-blue-light focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-primary">Email Address (Read-only)</label>
                  <input
                    type="email"
                    value={email}
                    disabled
                    className="w-full rounded-lg border border-input-border bg-divider/50 px-3.5 py-2 text-sm text-text-muted cursor-not-allowed focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={updatingProfile}
                  className="flex items-center justify-center gap-2 rounded-lg bg-accent-blue px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-accent-blue-hover disabled:bg-gray-400 cursor-pointer shadow-sm"
                >
                  {updatingProfile ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                  Save Changes
                </button>
              </form>
            </div>

            {/* Password Security Card */}
            <div className="rounded-card border border-border bg-surface p-6 shadow-[0px_1px_3px_rgba(0,0,0,0.03)]">
              <div className="flex items-center gap-2 border-b border-divider pb-3 mb-4">
                <Lock className="h-5 w-5 text-text-muted" />
                <h3 className="font-bold text-text-primary">Security Settings</h3>
              </div>

              {passwordError && (
                <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 p-3.5 text-xs text-red-600 font-medium">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              {passwordSuccess && (
                <div className="mb-4 flex items-center gap-2 rounded-lg bg-green-50 p-3.5 text-xs text-green-700 font-medium">
                  <CheckCircle className="h-4 w-4 shrink-0" />
                  <span>{passwordSuccess}</span>
                </div>
              )}

              <form onSubmit={handleUpdatePassword} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-primary">Current Password</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-input-border bg-surface px-3.5 py-2 text-sm text-text-primary focus:border-accent-blue focus:ring-2 focus:ring-accent-blue-light focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-primary">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full rounded-lg border border-input-border bg-surface px-3.5 py-2 text-sm text-text-primary focus:border-accent-blue focus:ring-2 focus:ring-accent-blue-light focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-primary">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-input-border bg-surface px-3.5 py-2 text-sm text-text-primary focus:border-accent-blue focus:ring-2 focus:ring-accent-blue-light focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={updatingPassword}
                  className="flex items-center justify-center gap-2 rounded-lg bg-accent-blue px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-accent-blue-hover disabled:bg-gray-400 cursor-pointer shadow-sm"
                >
                  {updatingPassword ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                  Update Password
                </button>
              </form>
            </div>
          </div>

          {/* Cloudflare R2 Storage Driver Configurations */}
          <div className="rounded-card border border-border bg-surface p-6 shadow-[0px_1px_3px_rgba(0,0,0,0.03)]">
            <div className="flex flex-col gap-4 border-b border-divider pb-3 mb-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <Server className="h-5 w-5 text-text-muted" />
                <div className="flex flex-col">
                  <h3 className="font-bold text-text-primary">Cloudflare R2 Storage Config</h3>
                  <span className="text-[10px] text-text-muted">Enter credentials to bypass local storage and stream files directly to R2 bucket.</span>
                </div>
              </div>
              <div className="shrink-0">
                {r2AccessKey && r2SecretKey && r2Bucket && r2Endpoint ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-accent-blue-light border border-accent-blue/15 px-2.5 py-0.5 text-[10px] font-bold text-accent-blue uppercase tracking-wider">
                    <Shield className="h-3 w-3" /> Custom Override Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-analytics-green-light border border-analytics-green/15 px-2.5 py-0.5 text-[10px] font-bold text-analytics-green uppercase tracking-wider">
                    <CheckCircle className="h-3 w-3" /> Platform Default Active
                  </span>
                )}
              </div>
            </div>

            {storageSuccess && (
              <div className="mb-4 flex items-center gap-2 rounded-lg bg-green-50 p-3.5 text-xs text-green-700 font-medium">
                <CheckCircle className="h-4 w-4 shrink-0" />
                <span>{storageSuccess}</span>
              </div>
            )}

            {storageError && (
              <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 p-3.5 text-xs text-red-600 font-medium">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{storageError}</span>
              </div>
            )}

            <div className="relative">
              {/* Blur Overlay for Coming Soon */}
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-xl bg-surface/75 backdrop-blur-[2px] text-center p-6">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-accent-blue-light text-accent-blue shadow-sm">
                  <Sparkles className="h-6 w-6 animate-pulse" />
                </div>
                <h4 className="text-sm font-bold text-text-primary">Custom Cloud Storage Override</h4>
                <span className="rounded bg-accent-blue px-2.5 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider mt-1.5 mb-1">Coming Soon</span>
                <p className="max-w-md text-[11px] leading-relaxed text-text-secondary mt-1">
                  Connecting your own custom Cloudflare R2 bucket is currently in development. By default, your assets are securely saved on our managed platform storage.
                </p>
              </div>

              {/* Locked Form */}
              <form onSubmit={(e) => e.preventDefault()} className="grid gap-4 md:grid-cols-2 opacity-35 pointer-events-none select-none">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-primary">R2 Client Access Key ID</label>
                  <input
                    type="text"
                    value={r2AccessKey}
                    onChange={(e) => setR2AccessKey(e.target.value)}
                    placeholder="e.g. 1a2b3c4d5e6f7g8h9i0j"
                    className="w-full rounded-lg border border-input-border bg-surface px-3.5 py-2 text-sm text-text-primary focus:border-accent-blue focus:ring-2 focus:ring-accent-blue-light focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-primary">R2 Client Secret Access Key</label>
                  <input
                    type="password"
                    value={r2SecretKey}
                    onChange={(e) => setR2SecretKey(e.target.value)}
                    placeholder="••••••••••••••••••••••••••••••••"
                    className="w-full rounded-lg border border-input-border bg-surface px-3.5 py-2 text-sm text-text-primary focus:border-accent-blue focus:ring-2 focus:ring-accent-blue-light focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-primary">R2 Bucket Name</label>
                  <input
                    type="text"
                    value={r2Bucket}
                    onChange={(e) => setR2Bucket(e.target.value)}
                    placeholder="tracelink-resumes-bucket"
                    className="w-full rounded-lg border border-input-border bg-surface px-3.5 py-2 text-sm text-text-primary focus:border-accent-blue focus:ring-2 focus:ring-accent-blue-light focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-primary">R2 Custom API Endpoint URL</label>
                  <input
                    type="text"
                    value={r2Endpoint}
                    onChange={(e) => setR2Endpoint(e.target.value)}
                    placeholder="https://<account-id>.r2.cloudflarestorage.com"
                    className="w-full rounded-lg border border-input-border bg-surface px-3.5 py-2 text-sm text-text-primary focus:border-accent-blue focus:ring-2 focus:ring-accent-blue-light focus:outline-none"
                  />
                </div>

                <div className="md:col-span-2 pt-2 flex gap-3">
                  <button
                    type="submit"
                    disabled={savingStorage}
                    className="flex items-center justify-center gap-2 rounded-lg bg-accent-blue px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-accent-blue-hover disabled:bg-gray-400 cursor-pointer shadow-sm"
                  >
                    {savingStorage ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                    Save Storage Configuration
                  </button>
                  {(r2AccessKey || r2SecretKey || r2Bucket || r2Endpoint) && (
                    <button
                      type="button"
                      onClick={handleResetStorage}
                      disabled={savingStorage}
                      className="flex items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 text-xs font-semibold text-text-primary hover:bg-[#EEF2F6] disabled:opacity-50 cursor-pointer shadow-sm"
                    >
                      Reset to Platform Default
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </>
      ) : (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Billing Overview Cards */}
          <div className="grid gap-6 md:grid-cols-3">
            {/* Card 1: Subscription Info */}
            <div className="rounded-card border border-border bg-surface p-5 shadow-card flex flex-col justify-between h-36">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Current Plan</span>
                <span className="rounded bg-accent-blue-light px-2 py-0.5 text-[9px] font-bold text-accent-blue uppercase tracking-wider">
                  {selectedPlan === 'free' ? 'Free Trial' : selectedPlan === 'pro' ? 'Pro Active' : 'Enterprise'}
                </span>
              </div>
              <div className="mt-2">
                <h3 className="text-xl font-bold text-text-primary capitalize">{selectedPlan === 'free' ? 'Starter Trial' : selectedPlan === 'pro' ? 'Growth Pro' : 'Enterprise Suite'}</h3>
                <p className="text-[10px] text-text-muted mt-1">
                  {selectedPlan === 'free' ? 'Renews (trial ends) on July 18, 2026' : 'Next invoice: Aug 04, 2026'}
                </p>
              </div>
              <button
                onClick={() => setShowUpgradeModal(true)}
                className="mt-2 text-xs font-bold text-accent-blue hover:text-accent-blue-hover flex items-center gap-1 self-start"
              >
                <span>{selectedPlan === 'free' ? 'Upgrade to Pro' : 'Change Plan'}</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Card 2: Link Quota Progress */}
            <div className="rounded-card border border-border bg-surface p-5 shadow-card flex flex-col justify-between h-36">
              <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Campaign Links Shared</span>
              <div>
                <div className="flex justify-between items-end text-xs font-bold text-text-primary mb-1">
                  <span>{quotaStats.linksCount} / {selectedPlan === 'free' ? '50' : selectedPlan === 'pro' ? '500' : 'Unlimited'}</span>
                  <span className="text-[10px] text-text-muted">
                    {Math.round((quotaStats.linksCount / (selectedPlan === 'free' ? 50 : 500)) * 100)}%
                  </span>
                </div>
                <div className="h-1.5 w-full bg-divider rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent-blue rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((quotaStats.linksCount / (selectedPlan === 'free' ? 50 : 500)) * 100, 100)}%` }}
                  />
                </div>
              </div>
              <p className="text-[9px] text-text-muted mt-2">Active redirection smart campaigns</p>
            </div>

            {/* Card 3: Storage Progress */}
            <div className="rounded-card border border-border bg-surface p-5 shadow-card flex flex-col justify-between h-36">
              <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Proposal Storage</span>
              <div>
                <div className="flex justify-between items-end text-xs font-bold text-text-primary mb-1">
                  <span>{(quotaStats.totalStorage / (1024 * 1024)).toFixed(2)} MB / {selectedPlan === 'free' ? '50' : selectedPlan === 'pro' ? '500' : 'Unlimited'} MB</span>
                  <span className="text-[10px] text-text-muted">
                    {Math.round((quotaStats.totalStorage / (50 * 1024 * 1024)) * 100)}%
                  </span>
                </div>
                <div className="h-1.5 w-full bg-divider rounded-full overflow-hidden">
                  <div
                    className="h-full bg-analytics-green rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((quotaStats.totalStorage / (50 * 1024 * 1024)) * 100, 100)}%` }}
                  />
                </div>
              </div>
              <p className="text-[9px] text-text-muted mt-2">Maximum file limit per upload: 10MB</p>
            </div>
          </div>

          {/* Invoices List */}
          <div className="rounded-card border border-border bg-surface p-6 shadow-card">
            <div className="flex items-center gap-2 border-b border-divider pb-3 mb-4">
              <Receipt className="h-5 w-5 text-text-muted" />
              <h3 className="font-bold text-text-primary">Invoice History</h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs text-text-secondary">
                <thead className="bg-[#EEF2F6] dark:bg-[#1E293B] text-[10px] font-bold uppercase tracking-wider text-text-muted border-b border-border">
                  <tr>
                    <th className="px-5 py-4">Invoice ID</th>
                    <th className="px-5 py-4">Date Issued</th>
                    <th className="px-5 py-4">Billing Amount</th>
                    <th className="px-5 py-4">Payment Method</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4 text-right">Invoice</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-divider">
                  {selectedPlan === 'free' ? (
                    <>
                      <tr className="hover:bg-[#F5F8FC]/50 transition-colors">
                        <td className="px-5 py-4 font-bold text-text-primary">INV-2026-002</td>
                        <td className="px-5 py-4">Jun 18, 2026</td>
                        <td className="px-5 py-4 font-semibold text-text-primary">$0.00</td>
                        <td className="px-5 py-4 text-text-muted">Trial Signup</td>
                        <td className="px-5 py-4">
                          <span className="inline-flex rounded-full bg-analytics-green-light px-2 py-0.5 text-[9px] font-bold text-analytics-green uppercase border border-analytics-green/10">Paid</span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() => alert('Mock invoice generated. PDF downloaded successfully.')}
                            className="rounded p-1 text-text-secondary hover:bg-[#EEF2F6] hover:text-text-primary"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                      <tr className="hover:bg-[#F5F8FC]/50 transition-colors">
                        <td className="px-5 py-4 font-bold text-text-primary">INV-2026-001</td>
                        <td className="px-5 py-4">May 18, 2026</td>
                        <td className="px-5 py-4 font-semibold text-text-primary">$0.00</td>
                        <td className="px-5 py-4 text-text-muted">Account Created</td>
                        <td className="px-5 py-4">
                          <span className="inline-flex rounded-full bg-analytics-green-light px-2 py-0.5 text-[9px] font-bold text-analytics-green uppercase border border-analytics-green/10">Paid</span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() => alert('Mock invoice generated. PDF downloaded successfully.')}
                            className="rounded p-1 text-text-secondary hover:bg-[#EEF2F6] hover:text-text-primary"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    </>
                  ) : (
                    <tr className="hover:bg-[#F5F8FC]/50 transition-colors">
                      <td className="px-5 py-4 font-bold text-text-primary">INV-2026-PRO-01</td>
                      <td className="px-5 py-4">Jul 04, 2026</td>
                      <td className="px-5 py-4 font-semibold text-text-primary">
                        {selectedPlan === 'pro' ? '$29.00' : '$149.00'}
                      </td>
                      <td className="px-5 py-4 text-text-muted">Visa ending 4242</td>
                      <td className="px-5 py-4">
                        <span className="inline-flex rounded-full bg-analytics-green-light px-2 py-0.5 text-[9px] font-bold text-analytics-green uppercase border border-analytics-green/10">Paid</span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => alert('Invoice generated. PDF downloaded successfully.')}
                          className="rounded p-1 text-text-secondary hover:bg-[#EEF2F6] hover:text-text-primary"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Pricing Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A2540]/30 backdrop-blur-xs p-4">
          <div className="w-full max-w-4xl rounded-xl border border-border bg-surface p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 flex flex-col h-[520px]">
            <div className="flex items-center justify-between border-b border-divider pb-3 mb-6 shrink-0">
              <div>
                <h3 className="text-sm font-bold text-text-primary flex items-center gap-1.5">
                  <ShieldCheck className="h-4.5 w-4.5 text-accent-blue" />
                  Upgrade Subscription Tier
                </h3>
                <span className="text-[10px] text-text-muted">Unlock unlimited tracked redirections, custom landing banners, and email gateways.</span>
              </div>
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="rounded-lg p-1 text-text-secondary hover:bg-[#EEF2F6]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Pricing Tiers Grid */}
            <div className="grid gap-6 md:grid-cols-3 flex-1 overflow-y-auto pr-1">
              {/* Card Tier 1 */}
              <div className={`rounded-xl border p-5 flex flex-col justify-between ${
                selectedPlan === 'free' ? 'border-accent-blue bg-accent-blue-light/5' : 'border-border bg-surface'
              }`}>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">Starter Trial</h4>
                    <p className="text-2xl font-bold text-text-primary mt-1">$0 <span className="text-[10px] text-text-muted font-normal">/ month</span></p>
                  </div>
                  <div className="h-px bg-divider" />
                  <ul className="space-y-2 text-[10px] text-text-secondary font-medium">
                    <li className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-accent-blue shrink-0" />
                      50 smart redirect campaigns
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-accent-blue shrink-0" />
                      10 Proposal hosted documents
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-accent-blue shrink-0" />
                      50MB total Storage
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-accent-blue shrink-0" />
                      Basic visitor activity logs
                    </li>
                  </ul>
                </div>
                <button
                  onClick={() => {
                    setSelectedPlan('free');
                    setShowUpgradeModal(false);
                  }}
                  className="mt-6 w-full rounded-lg border border-border bg-background py-2 text-xs font-bold text-text-primary hover:bg-[#EEF2F6] cursor-pointer"
                >
                  {selectedPlan === 'free' ? 'Active Plan' : 'Downgrade to Starter'}
                </button>
              </div>

              {/* Card Tier 2 (Pro) */}
              <div className={`rounded-xl border p-5 flex flex-col justify-between ${
                selectedPlan === 'pro' ? 'border-accent-blue bg-accent-blue-light/5' : 'border-border bg-surface'
              }`}>
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">Growth Pro</h4>
                      <p className="text-2xl font-bold text-text-primary mt-1">$29 <span className="text-[10px] text-text-muted font-normal">/ month</span></p>
                    </div>
                    <span className="rounded bg-analytics-green-light px-2 py-0.5 text-[8px] font-bold text-analytics-green uppercase tracking-wider shrink-0">Popular</span>
                  </div>
                  <div className="h-px bg-divider" />
                  <ul className="space-y-2 text-[10px] text-text-secondary font-medium">
                    <li className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-analytics-green shrink-0" />
                      500 smart redirect campaigns
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-analytics-green shrink-0" />
                      100 Proposal hosted documents
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-analytics-green shrink-0" />
                      500MB cloud R2 Storage
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-analytics-green shrink-0" />
                      Interest score insight engine
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-analytics-green shrink-0" />
                      Custom email gate inputs
                    </li>
                  </ul>
                </div>
                <button
                  onClick={() => {
                    setSelectedPlan('pro');
                    setShowUpgradeModal(false);
                    alert('Subscribed to Growth Pro successfully!');
                  }}
                  className="mt-6 w-full rounded-lg bg-accent-blue py-2 text-xs font-bold text-white hover:bg-accent-blue-hover cursor-pointer"
                >
                  {selectedPlan === 'pro' ? 'Active Plan' : 'Select Pro'}
                </button>
              </div>

              {/* Card Tier 3 (Enterprise) */}
              <div className={`rounded-xl border p-5 flex flex-col justify-between ${
                selectedPlan === 'enterprise' ? 'border-accent-blue bg-accent-blue-light/5' : 'border-border bg-surface'
              }`}>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">Enterprise</h4>
                    <p className="text-2xl font-bold text-text-primary mt-1">$149 <span className="text-[10px] text-text-muted font-normal">/ month</span></p>
                  </div>
                  <div className="h-px bg-divider" />
                  <ul className="space-y-2 text-[10px] text-text-secondary font-medium">
                    <li className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#64748B] shrink-0" />
                      Unlimited redirect campaigns
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#64748B] shrink-0" />
                      Unlimited documents
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#64748B] shrink-0" />
                      Dedicated Cloud R2 bucket
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#64748B] shrink-0" />
                      Custom white-labeled domains
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#64748B] shrink-0" />
                      Dedicated custom support SLA
                    </li>
                  </ul>
                </div>
                <button
                  onClick={() => {
                    setSelectedPlan('enterprise');
                    setShowUpgradeModal(false);
                    alert('Upgraded to Enterprise successfully!');
                  }}
                  className="mt-6 w-full rounded-lg border border-border bg-background py-2 text-xs font-bold text-text-primary hover:bg-[#EEF2F6] cursor-pointer"
                >
                  {selectedPlan === 'enterprise' ? 'Active Plan' : 'Upgrade Enterprise'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
