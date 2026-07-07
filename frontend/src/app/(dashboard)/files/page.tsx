'use client';

import React, { useState, useEffect } from 'react';
import { apiClient } from '../../../lib/api-client';
import {
  FileText,
  Upload,
  Search,
  QrCode,
  Trash2,
  Download,
  AlertCircle,
  X,
  FileDown,
  Eye,
  CheckCircle,
  Sparkles,
  HelpCircle,
  Filter
} from 'lucide-react';

interface FileItem {
  _id: string;
  originalName: string;
  fileUrl: string;
  fileType: 'pdf' | 'docx' | 'ppt' | 'pptx' | 'image' | 'other';
  shortCode: string;
  size: number;
  downloadCount: number;
  viewCount: number;
  requireLeadGate: boolean;
  qrCodeUrl?: string;
  createdAt: string;
}

export default function FilesPage() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [origin, setOrigin] = useState('');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Selected row state for bulk actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modals state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState<FileItem | null>(null);

  // Upload Form state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [requireLeadGate, setRequireLeadGate] = useState(false);
  const [formError, setFormError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const fetchFiles = async () => {
    try {
      const res = await apiClient.get('/api/files');
      setFiles(res.data);
    } catch (err) {
      console.error('Failed to load files', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);

  // Listen for query action trigger from header search quick navigation
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('action') === 'new') {
        setShowUploadModal(true);
      }
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const filesList = e.target.files;
    if (filesList && filesList[0]) {
      setSelectedFile(filesList[0]);
      setFormError('');
    }
  };

  const handleUploadFile = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSuccessMsg('');

    if (!selectedFile) {
      setFormError('Please select a document or image file to upload.');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('requireLeadGate', String(requireLeadGate));

    setUploading(true);
    try {
      await apiClient.post('/api/files', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setSuccessMsg('Document uploaded and tracking link generated successfully!');
      setSelectedFile(null);
      setRequireLeadGate(false);
      fetchFiles();
      
      setTimeout(() => {
        setShowUploadModal(false);
        setSuccessMsg('');
      }, 1500);
    } catch (err: any) {
      setFormError(
        err.response?.data?.message || 'Failed to upload file. Check size limits (max 10MB).'
      );
    } finally {
      setUploading(false);
    }
  };

  const handleToggleLeadGate = async (item: FileItem) => {
    try {
      const res = await apiClient.put(`/api/files/${item._id}`, {
        requireLeadGate: !item.requireLeadGate,
      });
      setFiles((prev) => prev.map((f) => (f._id === item._id ? res.data : f)));
    } catch (err) {
      console.error('Failed to update lead gate setting', err);
    }
  };

  const handleDeleteFile = async (id: string) => {
    if (!confirm('Are you sure you want to delete this file? This will remove all visitor logs.')) {
      return;
    }
    try {
      await apiClient.delete(`/api/files/${id}`);
      setFiles((prev) => prev.filter((f) => f._id !== id));
      setSelectedIds((prev) => prev.filter((item) => item !== id));
    } catch (err) {
      console.error('Failed to delete file', err);
    }
  };

  // Bulk operations
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(displayedFiles.map((f) => f._id));
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
    if (!confirm(`Are you sure you want to delete these ${selectedIds.length} files?`)) return;
    try {
      await Promise.all(selectedIds.map((id) => apiClient.delete(`/api/files/${id}`)));
      setFiles((prev) => prev.filter((f) => !selectedIds.includes(f._id)));
      setSelectedIds([]);
    } catch (err) {
      console.error('Bulk deletion failed', err);
    }
  };

  const handleBulkToggleLeadGate = async (gate: boolean) => {
    try {
      await Promise.all(
        selectedIds.map((id) => apiClient.put(`/api/files/${id}`, { requireLeadGate: gate }))
      );
      fetchFiles();
      setSelectedIds([]);
    } catch (err) {
      console.error('Bulk toggle lead gate settings failed', err);
    }
  };

  const formatBytes = (bytes: number, decimals = 1) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  // Filtering
  const filteredFiles = files.filter((f) => {
    return (
      (f.originalName || '').toLowerCase().includes(search.toLowerCase()) ||
      (f.shortCode || '').toLowerCase().includes(search.toLowerCase())
    );
  });

  const pageCount = Math.ceil(filteredFiles.length / itemsPerPage);
  const displayedFiles = filteredFiles.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-text-primary">Documents & Portfolios</h2>
          <p className="text-sm text-text-secondary">Host dynamic proposals, resumes, and pitch decks. Log viewing duration and pings.</p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          disabled
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent-blue/50 px-4 py-2.5 text-xs font-bold text-white/70 shadow-sm cursor-not-allowed"
        >
          <Upload className="h-4 w-4" /> Upload Document
        </button>
      </div>

      <div className="relative">
        {/* Blur Overlay for Coming Soon */}
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-2xl bg-surface/75 backdrop-blur-[2px] text-center p-16 min-h-[400px]">
          <h3 className="text-lg font-bold text-text-primary">Document Sharing & Portfolios</h3>
          <span className="rounded bg-accent-blue px-3 py-1 text-[10px] font-bold text-white uppercase tracking-wider mt-2.5 mb-2 shadow-xs">Coming Soon</span>
          <p className="max-w-md text-xs leading-relaxed text-text-secondary mt-1">
            Dynamic document tracking, proposal hosting, and reader analytics are currently in development. You will soon be able to upload PDFs, resumes, and slide decks to track reader pings in real time.
          </p>
        </div>

        {/* Locked page body */}
        <div className="opacity-25 pointer-events-none select-none space-y-6">
          {/* Filter Bar */}
          <div className="flex rounded-xl border border-border bg-surface p-4 shadow-[0px_1px_3px_rgba(0,0,0,0.02)] items-center justify-between">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3.5 top-2.5 h-4.5 w-4.5 text-text-muted" />
              <input
                type="text"
                placeholder="Search documents by filename..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full rounded-lg border border-input-border bg-surface pl-10 pr-4 py-1.5 text-xs text-text-primary focus:border-accent-blue focus:ring-2 focus:ring-accent-blue-light focus:outline-none"
              />
            </div>
          </div>

          {/* Main Files Table */}
          <div className="relative overflow-auto max-h-[600px] rounded-xl border border-border bg-surface shadow-card">
            {loading ? (
              <div className="divide-y divide-divider animate-pulse">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-20 bg-gray-50 dark:bg-gray-800/30" />
                ))}
              </div>
            ) : displayedFiles.length === 0 ? (
              /* Premium Empty State */
              <div className="flex flex-col items-center justify-center p-16 text-center max-w-md mx-auto">
                <div className="mb-6 relative flex h-16 w-16 items-center justify-center rounded-full bg-primary-light text-primary">
                  <FileText className="h-8 w-8" />
                  <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-analytics-green text-white border-2 border-surface font-bold text-xs animate-bounce">
                    ↑
                  </span>
                </div>
                <h3 className="text-sm font-bold text-text-primary">Upload your first document</h3>
                <p className="mt-2 text-xs leading-relaxed text-text-secondary">
                  Upload proposals, PDFs, or slides. Track reader interactions, locations, and request lead signups.
                </p>
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="mt-5 inline-flex items-center gap-2 rounded-lg bg-accent-blue px-4 py-2 text-xs font-bold text-white hover:bg-accent-blue-hover shadow-sm cursor-pointer"
                >
                  Upload document asset
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
                          checked={displayedFiles.length > 0 && selectedIds.length === displayedFiles.length}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          className="rounded border-input-border text-accent-blue focus:ring-accent-blue h-3.5 w-3.5"
                        />
                      </th>
                      <th className="px-5 py-4">Document details</th>
                      <th className="px-5 py-4">Short redirection URL</th>
                      <th className="px-5 py-4">Lead gate</th>
                      <th className="px-5 py-4">telemetry metrics</th>
                      <th className="px-5 py-4 text-right">Settings</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-divider">
                    {displayedFiles.map((f) => {
                      const shortUrl = `${origin}/f/${f.shortCode}`;
                      const isRowSelected = selectedIds.includes(f._id);

                      return (
                        <tr
                          key={f._id}
                          className={`transition-colors hover:bg-[#F5F8FC]/50 ${
                            isRowSelected ? 'bg-primary-light/30' : ''
                          }`}
                        >
                          {/* Checkbox column */}
                          <td className="px-5 py-4">
                            <input
                              type="checkbox"
                              checked={isRowSelected}
                              onChange={(e) => handleSelectRow(f._id, e.target.checked)}
                              className="rounded border-input-border text-accent-blue focus:ring-accent-blue h-3.5 w-3.5"
                            />
                          </td>

                          {/* File details */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="rounded-lg bg-[#EEF2F6] dark:bg-[#1E293B] p-2 text-text-primary shrink-0">
                                <FileText className="h-4.5 w-4.5" />
                              </div>
                              <div className="min-w-0">
                                <div className="font-bold text-text-primary text-xs truncate max-w-xs">{f.originalName}</div>
                                <div className="mt-1 text-[9px] text-text-muted uppercase font-semibold">
                                  {f.fileType} • {formatBytes(f.size)}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Short redirection link */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-1.5 font-bold text-text-primary">
                              <span className="truncate max-w-xs font-semibold">{shortUrl}</span>
                              <a
                                href={shortUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-text-muted hover:text-primary rounded p-1 hover:bg-primary-light"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </a>
                            </div>
                          </td>

                          {/* Email Lead gate switch */}
                          <td className="px-5 py-4">
                            <button
                              onClick={() => handleToggleLeadGate(f)}
                              className={`relative inline-flex h-5.5 w-10.5 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                f.requireLeadGate ? 'bg-accent-blue' : 'bg-[#EEF2F6] dark:bg-[#1E293B]'
                              }`}
                            >
                              <span
                                className={`pointer-events-none inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                                  f.requireLeadGate ? 'translate-x-5' : 'translate-x-0'
                                }`}
                              />
                            </button>
                          </td>

                          {/* Telemetry metrics */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-4 text-xs font-semibold text-text-primary">
                              <div className="flex items-center gap-1">
                                <Eye className="h-4 w-4 text-text-muted shrink-0" />
                                <span>{f.viewCount || 0}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <FileDown className="h-4 w-4 text-text-muted shrink-0" />
                                <span>{f.downloadCount || 0}</span>
                              </div>
                            </div>
                          </td>

                          {/* Delete/Action settings */}
                          <td className="px-5 py-4 text-right">
                            <div className="flex justify-end gap-1.5">
                              <button
                                onClick={() => setShowQRModal(f)}
                                className="rounded p-1.5 text-text-secondary hover:bg-[#EEF2F6] hover:text-text-primary transition-colors cursor-pointer"
                                title="View access QR Code"
                              >
                                <QrCode className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteFile(f._id)}
                                className="rounded p-1.5 text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                title="Delete document tracking link"
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

          {/* Pagination Footer */}
          {!loading && pageCount > 1 && (
            <div className="flex items-center justify-between border-t border-border pt-4">
              <span className="text-xs text-text-muted">
                Showing Page {currentPage} of {pageCount} ({filteredFiles.length} total documents)
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
        </div>
      </div>

      {/* Bulk actions Floating Bar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-4 rounded-xl border border-primary-hover bg-primary px-4 py-3 text-xs text-white shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-200">
          <span className="font-semibold text-[#CBD5E1]">
            {selectedIds.length} asset{selectedIds.length > 1 ? 's' : ''} selected
          </span>
          <div className="h-4 w-px bg-text-disabled" />
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleBulkToggleLeadGate(true)}
              className="rounded bg-primary-hover px-3 py-1 font-semibold hover:bg-primary-light hover:text-primary transition-colors cursor-pointer"
            >
              Gate Active
            </button>
            <button
              onClick={() => handleBulkToggleLeadGate(false)}
              className="rounded bg-primary-hover px-3 py-1 font-semibold hover:bg-primary-light hover:text-primary transition-colors cursor-pointer"
            >
              Gate Off
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
            Showing Page {currentPage} of {pageCount} ({filteredFiles.length} total documents)
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

      {/* Upload File Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A2540]/30 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-divider pb-3">
              <h3 className="text-sm font-bold text-text-primary">Upload new document tracking asset</h3>
              <button
                onClick={() => {
                  setShowUploadModal(false);
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

            {successMsg && (
              <div className="mt-4 flex items-start gap-2 rounded-lg bg-green-50 p-3 text-xs font-medium text-green-700">
                <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleUploadFile} className="mt-4 space-y-4">
              {/* Drag n drop box */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-text-primary">Document File</label>
                <div className="relative border-2 border-dashed border-border rounded-xl p-6 text-center hover:bg-sidebar-hover transition-colors">
                  <input
                    type="file"
                    onChange={handleFileChange}
                    accept=".pdf,.docx,.doc,.ppt,.pptx,image/*"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="space-y-2">
                    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-primary-light text-primary">
                      <Upload className="h-5 w-5" />
                    </div>
                    {selectedFile ? (
                      <p className="text-xs font-bold text-text-primary truncate">{selectedFile.name}</p>
                    ) : (
                      <>
                        <p className="text-xs font-bold text-text-primary">Drag & drop your file, or browse</p>
                        <p className="text-[10px] text-text-muted">PDF, DOCX, PPTX, JPG, PNG (Max 10MB)</p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Email gate toggle */}
              <div className="flex items-center justify-between border-t border-divider pt-3">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-text-primary">Visitor Lead Gate</span>
                  <span className="text-[10px] text-text-muted">Prompt reader for contact credentials to unlock PDF.</span>
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
                disabled={uploading}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-accent-blue py-2 text-xs font-bold text-white transition-colors hover:bg-accent-blue-hover disabled:bg-gray-400 cursor-pointer shadow-sm"
              >
                {uploading ? 'Processing file upload...' : 'Upload & start tracking'}
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
              <h3 className="text-xs font-bold text-text-primary">QR Access Link</h3>
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
                    alt={`QR Code for ${showQRModal.originalName}`}
                    className="mx-auto h-48 w-48"
                  />
                </div>
                <div className="text-xs">
                  <p className="font-bold text-text-primary">{showQRModal.originalName}</p>
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
                No QR code has been created for this document asset.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
