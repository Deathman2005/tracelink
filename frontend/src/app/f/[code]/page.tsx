'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { apiClient } from '../../../lib/api-client';
import {
  FileText,
  Mail,
  User,
  Building,
  ArrowRight,
  Loader2,
  AlertCircle,
  Sparkles,
  Download,
  Eye,
} from 'lucide-react';

interface FileMetadata {
  _id: string;
  originalName: string;
  fileUrl: string;
  fileType: 'pdf' | 'docx' | 'ppt' | 'pptx' | 'image' | 'other';
  size: number;
  shortCode: string;
}

export default function DocumentViewerPage() {
  const params = useParams();
  const code = params?.code as string;

  const [file, setFile] = useState<FileMetadata | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [loading, setLoading] = useState(true);

  // Lead Gate Form state
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [gateError, setGateError] = useState('');
  const [gateSubmitting, setGateSubmitting] = useState(false);

  // Tracking references
  const durationRef = useRef(0);
  const maxScrollRef = useRef(0);

  // Fetch document details on load
  const loadMetadata = async () => {
    try {
      const res = await apiClient.get(`/api/events/file-meta/${code}`);
      setFile(res.data.file);
      setIsUnlocked(res.data.isUnlocked);
    } catch (err: any) {
      console.error('Failed to load document metadata', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (code) {
      loadMetadata();
    }
  }, [code]);

  // Periodic heartbeat pings to track viewing duration & scrolls
  useEffect(() => {
    if (!isUnlocked || !file) return;

    // Track scroll depth
    const trackScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = document.documentElement.clientHeight;
      const totalScrollable = scrollHeight - clientHeight;

      if (totalScrollable > 0) {
        const percent = Math.round((scrollTop / totalScrollable) * 100);
        if (percent > maxScrollRef.current) {
          maxScrollRef.current = Math.min(percent, 100); // Cap at 100%
        }
      }
    };

    window.addEventListener('scroll', trackScroll);

    // Heartbeat ping interval: pings every 5 seconds
    const pingInterval = setInterval(async () => {
      durationRef.current += 5;
      try {
        await apiClient.post('/api/events/ping', {
          assetId: file._id,
          assetType: 'file',
          duration: durationRef.current,
          scrollDepth: maxScrollRef.current,
        });
      } catch (err) {
        console.error('Ping heartbeat failed', err);
      }
    }, 5000);

    return () => {
      window.removeEventListener('scroll', trackScroll);
      clearInterval(pingInterval);
    };
  }, [isUnlocked, file]);

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGateError('');

    if (!email) {
      setGateError('Please enter your email.');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setGateError('Please enter a valid email address.');
      return;
    }

    setGateSubmitting(true);
    try {
      await apiClient.post('/api/events/lead', {
        assetId: file?._id,
        assetType: 'file',
        email: email.toLowerCase(),
        name: name || undefined,
        company: company || undefined,
      });

      // Unlock and reveal document
      setIsUnlocked(true);
    } catch (err: any) {
      setGateError(err.response?.data?.message || 'Access authorization failed.');
    } finally {
      setGateSubmitting(false);
    }
  };

  // Bytes Formatter
  const formatBytes = (bytes: number, decimals = 1) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-background text-text-primary">
        <Loader2 className="h-8 w-8 animate-spin text-brand-accent mb-4" />
        <p className="text-sm font-medium">Retrieving shared document details...</p>
      </div>
    );
  }

  if (!file) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-background text-center p-6">
        <FileText className="h-12 w-12 text-text-muted mb-4" />
        <h2 className="text-lg font-bold text-text-primary">Document Not Found</h2>
        <p className="text-sm text-text-secondary mt-1">This shared link is invalid or may have been deleted by its owner.</p>
      </div>
    );
  }

  // Render email capture gate if locked
  if (!isUnlocked) {
    return (
      <div className="flex min-h-screen w-screen items-center justify-center bg-background p-6 text-text-primary">
        <div className="w-full max-w-md rounded-card border border-border bg-card p-8 shadow-card text-center space-y-6">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent-blue-light text-accent-blue">
            <Sparkles className="h-6 w-6 text-accent-blue animate-pulse" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold tracking-tight text-text-primary">Unlock Document</h2>
            <p className="text-xs text-text-secondary">
              Please enter your details to view or download "{file.originalName}".
            </p>
          </div>

          {gateError && (
            <div className="flex items-start gap-2.5 rounded-lg bg-red-50 dark:bg-red-950/20 p-4 text-xs font-medium text-red-600 dark:text-red-400 text-left border border-red-200 dark:border-red-900/50">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{gateError}</span>
            </div>
          )}

          <form onSubmit={handleLeadSubmit} className="space-y-4 text-left">
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

            <div className="space-y-1">
              <label className="text-xs font-semibold text-text-primary">Work Email</label>
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

            <div className="space-y-1">
              <label className="text-xs font-semibold text-text-primary">Company (Optional)</label>
              <div className="relative">
                <Building className="absolute left-3 top-2.5 h-4 w-4 text-text-muted" />
                <input
                  type="text"
                  placeholder="Acme Corp"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full rounded-lg border border-input-border bg-surface pl-9 pr-4 py-2 text-xs text-text-primary focus:border-accent-blue focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={gateSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent-blue py-3 text-xs font-semibold text-white transition-colors hover:bg-accent-blue-hover cursor-pointer"
            >
              {gateSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Unlocking document...</span>
                </>
              ) : (
                <>
                  <span>Unlock File</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Render file viewer content if unlocked
  return (
    <div className="flex flex-col h-screen w-screen bg-background">
      {/* Viewer Header */}
      <header className="flex h-16 w-full items-center justify-between border-b border-border bg-surface px-6">
        <div className="flex items-center gap-3">
          <div className="rounded bg-accent-blue-light p-2 text-accent-blue">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-text-primary truncate max-w-sm">{file.originalName}</h1>
            <p className="text-[10px] text-text-muted">Size: {formatBytes(file.size)}</p>
          </div>
        </div>

        {/* Download direct link */}
        <a
          href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/events/download/${file.shortCode}`}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-accent-blue hover:bg-accent-blue-hover px-4 py-2 text-xs font-semibold text-white transition-colors shadow-sm"
        >
          <Download className="h-4 w-4" /> Download File
        </a>
      </header>

      {/* Embedded Document Frame */}
      <div className="flex-1 w-full flex items-center justify-center overflow-auto p-4">
        {file.fileType === 'pdf' ? (
          // Embedded PDF viewport
          <object
            data={file.fileUrl}
            type="application/pdf"
            className="w-full max-w-5xl h-full rounded-lg border border-border shadow-card bg-card"
          >
            <iframe
              src={file.fileUrl}
              className="w-full h-full border-0 rounded-lg"
              title={file.originalName}
            />
          </object>
        ) : file.fileType === 'image' ? (
          // Centered Image preview
          <img
            src={file.fileUrl}
            alt={file.originalName}
            className="max-w-full max-h-full rounded-lg shadow-card object-contain border border-border"
          />
        ) : (
          // Download Card layout for non-renderable attachments (Word, Excel, PowerPoint)
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 text-center shadow-card space-y-6">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent-blue-light text-accent-blue">
              <FileText className="h-7 w-7" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-text-primary">{file.originalName}</h2>
              <p className="text-xs text-text-muted">Format: {file.fileType.toUpperCase()} • Size: {formatBytes(file.size)}</p>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              This document type ({file.fileType.toUpperCase()}) cannot be previewed directly inside the web browser. Click below to download the file.
            </p>
            <a
              href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/events/download/${file.shortCode}`}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent-blue hover:bg-accent-blue-hover py-3 text-xs font-semibold text-white transition-colors shadow-sm"
            >
              <Download className="h-4.5 w-4.5" /> Download Document
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
