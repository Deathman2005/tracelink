'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { apiClient } from '../../../lib/api-client';
import {
  Link2,
  Plus,
  Search,
  QrCode,
  Trash2,
  ExternalLink,
  Power,
  Download,
  AlertCircle,
  X,
  Copy,
  Check,
  CheckCircle,
  HelpCircle,
  Filter
} from 'lucide-react';

interface LinkItem {
  _id: string;
  originalUrl: string;
  shortCode: string;
  title: string;
  description?: string;
  isActive: boolean;
  clicksCount: number;
  requireLeadGate: boolean;
  qrCodeUrl?: string;
  createdAt: string;
}

export default function LinksPage() {
  const searchParams = useSearchParams();
  const currentView = searchParams.get('view') || 'default';
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'clicks'>('date');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Selected row state for bulk actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState<LinkItem | null>(null);

  // Form state
  const [originalUrl, setOriginalUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [requireLeadGate, setRequireLeadGate] = useState(false);
  const [formError, setFormError] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchLinks = async () => {
    try {
      const res = await apiClient.get('/api/links');
      setLinks(res.data);
    } catch (err) {
      console.error('Failed to load links', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLinks();
  }, []);

  // Listen for query action trigger from header search quick navigation
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('action') === 'new') {
        setShowCreateModal(true);
      }
    }
  }, []);

  const handleCreateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!originalUrl) {
      setFormError('Please enter a target URL.');
      return;
    }

    if (!/^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/.test(originalUrl)) {
      setFormError('Please enter a valid URL.');
      return;
    }

    setCreating(true);
    try {
      await apiClient.post('/api/links', {
        originalUrl: originalUrl.startsWith('http') ? originalUrl : `https://${originalUrl}`,
        title: title || undefined,
        description: description || undefined,
        requireLeadGate,
      });

      setOriginalUrl('');
      setTitle('');
      setDescription('');
      setRequireLeadGate(false);
      setShowCreateModal(false);
      fetchLinks();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to generate link.');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleActive = async (item: LinkItem) => {
    try {
      const res = await apiClient.put(`/api/links/${item._id}`, {
        isActive: !item.isActive,
      });
      setLinks((prev) => prev.map((l) => (l._id === item._id ? res.data : l)));
    } catch (err) {
      console.error('Failed to toggle link state', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this link? This action cannot be undone.')) {
      return;
    }
    try {
      await apiClient.delete(`/api/links/${id}`);
      setLinks((prev) => prev.filter((l) => l._id !== id));
      setSelectedIds((prev) => prev.filter((item) => item !== id));
    } catch (err) {
      console.error('Failed to delete link', err);
    }
  };

  // Bulk Actions
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(displayedLinks.map((l) => l._id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((item) => item !== id));
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete these ${selectedIds.length} links?`)) return;
    try {
      await Promise.all(selectedIds.map((id) => apiClient.delete(`/api/links/${id}`)));
      setLinks((prev) => prev.filter((l) => !selectedIds.includes(l._id)));
      setSelectedIds([]);
    } catch (err) {
      console.error('Bulk deletion failed', err);
    }
  };

  const handleBulkToggleActive = async (active: boolean) => {
    try {
      await Promise.all(
        selectedIds.map((id) => apiClient.put(`/api/links/${id}`, { isActive: active }))
      );
      fetchLinks();
      setSelectedIds([]);
    } catch (err) {
      console.error('Bulk toggle status failed', err);
    }
  };

  const copyLink = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Searching & Sorting
  const filteredLinks = links.filter((l) => {
    const term = search.toLowerCase();
    return (
      (l.title || '').toLowerCase().includes(term) ||
      (l.shortCode || '').toLowerCase().includes(term) ||
      (l.originalUrl || '').toLowerCase().includes(term)
    );
  });

  const sortedLinks = [...filteredLinks].sort((a, b) => {
    if (sortBy === 'clicks') {
      return b.clicksCount - a.clicksCount;
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const pageCount = Math.ceil(sortedLinks.length / itemsPerPage);
  const displayedLinks = sortedLinks.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-text-primary">
            {currentView === 'qr' ? 'QR Campaigns' : 'Redirection Links'}
          </h2>
          <p className="text-sm text-text-secondary">
            {currentView === 'qr'
              ? 'Download and share high-resolution QR access graphics linked to your marketing channels.'
              : 'Generate and track smart campaigns. Connect routing rules and lead gates.'}
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent-blue px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-accent-blue-hover shadow-sm cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Share new Link
        </button>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-4 shadow-[0px_1px_3px_rgba(0,0,0,0.02)] md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-2.5 h-4.5 w-4.5 text-text-muted" />
          <input
            type="text"
            placeholder="Search links by title, code, or destination..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full rounded-lg border border-input-border bg-surface pl-10 pr-4 py-1.5 text-xs text-text-primary focus:border-accent-blue focus:ring-2 focus:ring-accent-blue-light focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5 text-text-muted">
            <Filter className="h-3.5 w-3.5" />
            <span>Sort by:</span>
          </div>
          <button
            onClick={() => setSortBy('date')}
            className={`font-semibold transition-colors ${
              sortBy === 'date' ? 'text-accent-blue underline underline-offset-4' : 'text-text-muted hover:text-text-primary'
            }`}
          >
            Date Added
          </button>
          <button
            onClick={() => setSortBy('clicks')}
            className={`font-semibold transition-colors ${
              sortBy === 'clicks' ? 'text-accent-blue underline underline-offset-4' : 'text-text-muted hover:text-text-primary'
            }`}
          >
            Engagement volume
          </button>
        </div>
      </div>

      {/* Main Content */}
      {currentView !== 'qr' ? (
        <div className="relative overflow-auto max-h-[600px] rounded-xl border border-border bg-surface shadow-card">
          {loading ? (
            <div className="divide-y divide-divider animate-pulse">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-50 dark:bg-gray-800/30" />
              ))}
            </div>
          ) : displayedLinks.length === 0 ? (
            /* Premium Empty State */
            <div className="flex flex-col items-center justify-center p-16 text-center max-w-md mx-auto">
              <div className="mb-6 relative flex h-16 w-16 items-center justify-center rounded-full bg-primary-light text-primary">
                <Link2 className="h-8 w-8" />
                <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-analytics-green text-white border-2 border-surface font-bold text-xs">
                  +
                </span>
              </div>
              <h3 className="text-sm font-bold text-text-primary">Create your first TraceLink</h3>
              <p className="mt-2 text-xs leading-relaxed text-text-secondary">
                Redirect traffic with custom marketing tags. Require leads to input names and email domains before reaching your assets.
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-accent-blue px-4 py-2 text-xs font-bold text-white hover:bg-accent-blue-hover shadow-sm cursor-pointer"
              >
                Share your first TraceLink
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs text-text-secondary">
                <thead className="sticky top-0 bg-[#EEF2F6] dark:bg-[#1E293B] text-[10px] font-bold uppercase tracking-wider text-text-muted border-b border-border z-10">
                  <tr>
                    <th className="px-5 py-4 w-10">
                      <input
                        type="checkbox"
                        checked={displayedLinks.length > 0 && selectedIds.length === displayedLinks.length}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="rounded border-input-border text-accent-blue focus:ring-accent-blue h-3.5 w-3.5"
                      />
                    </th>
                    <th className="px-5 py-4">Link Details & Destination</th>
                    <th className="px-5 py-4">Short Redirection URL</th>
                    <th className="px-5 py-4">Visitor Lead Gate</th>
                    <th className="px-5 py-4">Metrics</th>
                    <th className="px-5 py-4 text-right">Settings</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-divider">
                  {displayedLinks.map((l) => {
                    const origin = typeof window !== 'undefined' ? window.location.origin : '';
                    const shortUrl = `${origin}/l/${l.shortCode}`;
                    const isRowSelected = selectedIds.includes(l._id);

                    return (
                      <tr
                        key={l._id}
                        className={`transition-colors hover:bg-[#F5F8FC]/50 ${
                          isRowSelected ? 'bg-primary-light/30' : ''
                        }`}
                      >
                        {/* Checkbox column */}
                        <td className="px-5 py-4">
                          <input
                            type="checkbox"
                            checked={isRowSelected}
                            onChange={(e) => handleSelectRow(l._id, e.target.checked)}
                            className="rounded border-input-border text-accent-blue focus:ring-accent-blue h-3.5 w-3.5"
                          />
                        </td>

                        {/* Title & Target */}
                        <td className="px-5 py-4">
                          <div className="font-bold text-text-primary text-xs truncate max-w-xs">{l.title || 'Untitled Campaign'}</div>
                          <div className="mt-1 text-[10px] text-text-muted truncate max-w-xs">{l.originalUrl}</div>
                        </td>

                        {/* Short Copy Redirection */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5 font-bold text-text-primary">
                            <span className="truncate max-w-xs font-semibold">{shortUrl}</span>
                            <button
                              onClick={() => copyLink(shortUrl, l._id)}
                              className="text-text-muted hover:text-accent-blue rounded p-1 hover:bg-accent-blue-light"
                              title="Copy link to clipboard"
                            >
                              {copiedId === l._id ? (
                                <Check className="h-3.5 w-3.5 text-analytics-green" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </button>
                            <a
                              href={shortUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-text-muted hover:text-accent-blue rounded p-1 hover:bg-accent-blue-light"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          </div>
                        </td>

                        {/* Lead Gate status */}
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider ${
                              l.requireLeadGate
                                ? 'text-text-primary'
                                : 'text-text-muted'
                            }`}
                          >
                            {l.requireLeadGate ? 'Email Gate Active' : 'Off'}
                          </span>
                        </td>

                        {/* Clicks metric */}
                        <td className="px-5 py-4">
                          <div className="font-bold text-text-primary text-sm">{l.clicksCount}</div>
                          <div className="text-[9px] text-text-muted uppercase font-semibold">clicks</div>
                        </td>

                        {/* Row actions */}
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                             <button
                              onClick={() => handleToggleActive(l)}
                              title={l.isActive ? 'Deactivate link' : 'Activate link'}
                              className={`rounded-md p-1.5 transition-colors ${
                                l.isActive
                                  ? 'text-analytics-green hover:bg-analytics-green-light'
                                  : 'text-text-muted hover:bg-sidebar-hover'
                              }`}
                            >
                              <Power className="h-4 w-4" />
                            </button>

                            <button
                              onClick={() => setShowQRModal(l)}
                              title="Generate QR code"
                              className="rounded-md p-1.5 text-text-secondary hover:bg-[#EEF2F6] transition-colors"
                            >
                              <QrCode className="h-4 w-4" />
                            </button>

                            <button
                              onClick={() => handleDelete(l._id)}
                              title="Delete link"
                              className="rounded-md p-1.5 text-text-muted hover:bg-red-50 hover:text-red-600 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in duration-300">
          {loading ? (
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-64 rounded-xl border border-border bg-surface animate-pulse" />
              ))}
            </div>
          ) : displayedLinks.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 text-center max-w-md mx-auto">
              <div className="mb-6 relative flex h-16 w-16 items-center justify-center rounded-full bg-accent-blue-light text-accent-blue">
                <QrCode className="h-8 w-8" />
              </div>
              <h3 className="text-sm font-bold text-text-primary">No QR Codes generated</h3>
              <p className="mt-2 text-xs leading-relaxed text-text-secondary">
                Shorten and generate dynamic redirection links to automatically populate high-resolution analytics QR codes here.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {displayedLinks.map((l) => {
                const origin = typeof window !== 'undefined' ? window.location.origin : '';
                const shortUrl = `${origin}/l/${l.shortCode}`;
                return (
                  <div key={l._id} className="rounded-xl border border-border bg-surface p-5 shadow-card hover:shadow-card-hover transition-all flex flex-col justify-between h-[340px]">
                    <div className="space-y-3">
                      {/* Card Title & Info */}
                      <div className="min-w-0">
                        <h4 className="font-bold text-text-primary text-xs truncate">{l.title || 'Untitled Campaign'}</h4>
                        <p className="text-[10px] text-text-muted truncate mt-0.5">{l.originalUrl}</p>
                      </div>

                      {/* QR Code Graphic Frame */}
                      <div
                        onClick={() => setShowQRModal(l)}
                        className="bg-white rounded-lg border border-border p-3 flex justify-center items-center cursor-pointer hover:bg-slate-50 transition-colors"
                        title="Click to preview large QR code"
                      >
                        {l.qrCodeUrl ? (
                          <img
                            src={l.qrCodeUrl}
                            alt={`QR for ${l.title}`}
                            className="h-32 w-32 object-contain"
                          />
                        ) : (
                          <div className="h-32 w-32 flex flex-col items-center justify-center text-text-muted">
                            <QrCode className="h-10 w-10 text-text-disabled" />
                            <span className="text-[9px] mt-2">No code available</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3 mt-4">
                      {/* Volume & Short Code */}
                      <div className="flex items-center justify-between text-[10px] font-semibold text-text-muted">
                        <span>Code: {l.shortCode}</span>
                        <span>{l.clicksCount} scans</span>
                      </div>

                      {/* Action buttons */}
                      <div className="grid grid-cols-2 gap-2">
                        {l.qrCodeUrl ? (
                          <a
                            href={l.qrCodeUrl}
                            download={`tracelink-qr-${l.shortCode}.png`}
                            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-background py-1.5 text-[10px] font-bold text-text-primary hover:bg-[#EEF2F6] cursor-pointer"
                          >
                            <Download className="h-3 w-3" /> Save PNG
                          </a>
                        ) : (
                          <button
                            disabled
                            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-background py-1.5 text-[10px] font-bold text-text-disabled cursor-not-allowed"
                          >
                            <Download className="h-3 w-3" /> Save PNG
                          </button>
                        )}
                        <button
                          onClick={() => copyLink(shortUrl, l._id)}
                          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-accent-blue py-1.5 text-[10px] font-bold text-white hover:bg-accent-blue-hover cursor-pointer"
                        >
                          {copiedId === l._id ? (
                            <>
                              <Check className="h-3 w-3" /> Copied
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3" /> Copy URL
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

       {/* Bulk actions Floating Bar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-4 rounded-xl border border-primary-hover bg-primary px-4 py-3 text-xs text-white shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-200">
          <span className="font-semibold text-[#CBD5E1]">
            {selectedIds.length} link{selectedIds.length > 1 ? 's' : ''} selected
          </span>
          <div className="h-4 w-px bg-text-disabled" />
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleBulkToggleActive(true)}
              className="rounded bg-primary-hover px-3 py-1 font-semibold hover:bg-primary-light hover:text-primary transition-colors cursor-pointer"
            >
              Activate
            </button>
            <button
              onClick={() => handleBulkToggleActive(false)}
              className="rounded bg-primary-hover px-3 py-1 font-semibold hover:bg-primary-light hover:text-primary transition-colors cursor-pointer"
            >
              Deactivate
            </button>
            <button
              onClick={handleBulkDelete}
              className="rounded bg-danger px-3 py-1 font-semibold hover:bg-red-700 transition-colors cursor-pointer"
            >
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Pagination Footer */}
       {!loading && pageCount > 1 && (
        <div className="flex items-center justify-between border-t border-border pt-4">
          <span className="text-xs text-text-muted">
            Showing Page {currentPage} of {pageCount} ({filteredLinks.length} total links)
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="rounded-lg border border-border px-3 py-1 text-xs font-semibold text-text-primary hover:bg-sidebar-hover disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, pageCount))}
              disabled={currentPage === pageCount}
              className="rounded-lg border border-border px-3 py-1 text-xs font-semibold text-text-primary hover:bg-sidebar-hover disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Create Link Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A2540]/30 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-divider pb-3">
              <h3 className="text-sm font-bold text-text-primary">Shorten new dynamic link</h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setFormError('');
                }}
                className="rounded-lg p-1 text-text-secondary hover:bg-primary-light hover:text-text-primary"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 flex items-start gap-2 rounded-lg bg-red-50 dark:bg-red-950/20 p-3 text-xs font-medium text-red-600 dark:text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

             <form onSubmit={handleCreateLink} className="mt-4 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-text-primary">Target URL Destination</label>
                <input
                  type="text"
                  placeholder="https://example.com/some/long/path"
                  value={originalUrl}
                  onChange={(e) => setOriginalUrl(e.target.value)}
                  className="w-full rounded-lg border border-input-border bg-surface px-3 py-2 text-xs text-text-primary focus:border-accent-blue focus:ring-2 focus:ring-accent-blue-light focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-text-primary">Title (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g., Q2 Portfolio Deck"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-lg border border-input-border bg-surface px-3 py-2 text-xs text-text-primary focus:border-accent-blue focus:ring-2 focus:ring-accent-blue-light focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-text-primary">Internal Notes / Description</label>
                <textarea
                  placeholder="Additional context about this tracking link..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-lg border border-input-border bg-surface px-3 py-2 text-xs text-text-primary focus:border-accent-blue focus:ring-2 focus:ring-accent-blue-light focus:outline-none h-16"
                />
              </div>

              <div className="flex items-center justify-between border-t border-divider pt-3">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-text-primary">Visitor Lead Gate</span>
                  <span className="text-[10px] text-text-muted">Require email signup to access target URL.</span>
                </div>
                <input
                  type="checkbox"
                  checked={requireLeadGate}
                  onChange={(e) => setRequireLeadGate(e.target.checked)}
                  className="h-4.5 w-4.5 rounded border-input-border text-accent-blue focus:ring-accent-blue cursor-pointer"
                />
              </div>

              <button
                type="submit"
                disabled={creating}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-accent-blue py-2 text-xs font-bold text-white transition-colors hover:bg-accent-blue-hover disabled:bg-gray-400 cursor-pointer shadow-sm"
              >
                {creating ? 'Creating redirection asset...' : 'Shorten Link'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQRModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A2540]/30 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-6 shadow-2xl text-center animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-divider pb-3 mb-4">
              <h3 className="text-xs font-bold text-text-primary">QR Analytics Code</h3>
              <button
                onClick={() => setShowQRModal(null)}
                className="rounded-lg p-1 text-text-secondary hover:bg-[#EEF2F6]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {showQRModal.qrCodeUrl ? (
              <div className="space-y-4">
                <div className="inline-block rounded-xl border border-border bg-white p-4 shadow-sm">
                  <img
                    src={showQRModal.qrCodeUrl}
                    alt={`QR Code for ${showQRModal.title}`}
                    className="mx-auto h-48 w-48"
                  />
                </div>
                <div className="text-xs">
                  <p className="font-bold text-text-primary">{showQRModal.title || 'QR Campaign'}</p>
                  <p className="mt-0.5 text-text-muted">Code: {showQRModal.shortCode}</p>
                </div>
                <div className="flex justify-center pt-2">
                  <a
                    href={showQRModal.qrCodeUrl}
                    download={`tracelink-qr-${showQRModal.shortCode}.png`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-xs font-semibold text-text-primary hover:bg-[#F5F8FC]"
                  >
                    <Download className="h-3.5 w-3.5" /> Download QR Image
                  </a>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-text-muted">
                No QR code has been created for this redirection link.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
