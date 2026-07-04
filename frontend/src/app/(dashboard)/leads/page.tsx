'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { apiClient } from '../../../lib/api-client';
import {
  Users,
  Search,
  Download,
  Mail,
  Calendar,
  Building,
  FileText,
  Link2,
  Sparkles,
  Clock,
  TrendingUp,
  Zap,
  Award
} from 'lucide-react';

interface LeadItem {
  _id: string;
  email: string;
  name?: string;
  company?: string;
  visitorId: string;
  assetId?: {
    _id: string;
    title?: string;
    originalName?: string;
    shortCode: string;
  };
  assetType: 'link' | 'file';
  createdAt: string;
}

interface ScoreItem {
  _id: string;
  visitorId: string;
  score: number;
  interestLevel: string;
  factors: string[];
  lastActive: string;
  assetName: string;
  assetType: string;
  shortCode: string;
  leadEmail: string;
  leadName?: string;
  leadCompany?: string;
}

export default function LeadsPage() {
  const searchParams = useSearchParams();
  const currentView = searchParams.get('view') || 'default';
  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [scores, setScores] = useState<ScoreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchLeadsAndScores = async () => {
    try {
      const [leadsRes, scoresRes] = await Promise.all([
        apiClient.get('/api/analytics/leads'),
        apiClient.get('/api/analytics/scores')
      ]);
      setLeads(leadsRes.data || []);
      setScores(scoresRes.data || []);
    } catch (err) {
      console.error('Failed to load leads or scores list', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeadsAndScores();
  }, []);

  const exportToCSV = () => {
    if (leads.length === 0) return;

    const headers = ['Email', 'Name', 'Company', 'Asset Name', 'Asset Type', 'Asset Shortcode', 'Captured Date'];
    const rows = leads.map((lead) => {
      const assetName = lead.assetId
        ? lead.assetId.title || lead.assetId.originalName || 'Asset'
        : 'Deleted Asset';
      const shortCode = lead.assetId ? lead.assetId.shortCode : '';

      return [
        lead.email,
        lead.name || '',
        lead.company || '',
        assetName,
        lead.assetType,
        shortCode,
        new Date(lead.createdAt).toLocaleDateString(),
      ];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const downloadLink = document.createElement('a');
    downloadLink.setAttribute('href', encodedUri);
    downloadLink.setAttribute('download', `tracelink-leads-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  const filteredLeads = leads.filter((l) => {
    const term = search.toLowerCase();
    const assetName = l.assetId
      ? (l.assetId.title || l.assetId.originalName || '').toLowerCase()
      : '';
    return (
      l.email.toLowerCase().includes(term) ||
      (l.name || '').toLowerCase().includes(term) ||
      (l.company || '').toLowerCase().includes(term) ||
      assetName.includes(term)
    );
  });

  const pageCount = Math.ceil(filteredLeads.length / itemsPerPage);
  const displayedLeads = filteredLeads.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const filteredScores = scores.filter((s) => {
    const term = search.toLowerCase();
    const assetName = (s.assetName || '').toLowerCase();
    return (
      s.leadEmail.toLowerCase().includes(term) ||
      (s.leadName || '').toLowerCase().includes(term) ||
      (s.leadCompany || '').toLowerCase().includes(term) ||
      (s.interestLevel || '').toLowerCase().includes(term) ||
      assetName.includes(term)
    );
  });

  const sortedScores = [...filteredScores].sort((a, b) => b.score - a.score);

  const scoresPageCount = Math.ceil(sortedScores.length / itemsPerPage);
  const displayedScores = sortedScores.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-text-primary">
            {currentView === 'engagement' ? 'Engagement Scoring' : 'Engagement Leads'}
          </h2>
          <p className="text-sm text-text-secondary">
            {currentView === 'engagement'
              ? 'Analyze visitor interest levels, scan events, and download telemetry scores.'
              : 'Track visitor credentials collected through your interactive email gates.'}
          </p>
        </div>
        {currentView !== 'engagement' && leads.length > 0 && (
          <button
            onClick={exportToCSV}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-xs font-bold text-text-primary hover:bg-sidebar-hover shadow-sm transition-colors cursor-pointer"
          >
            <Download className="h-4 w-4" /> Export Leads CSV
          </button>
        )}
      </div>

      {/* Control panel */}
      <div className="flex rounded-xl border border-border bg-surface p-4 shadow-[0px_1px_3px_rgba(0,0,0,0.02)] items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3.5 top-2.5 h-4.5 w-4.5 text-text-muted" />
          <input
            type="text"
            placeholder={
              currentView === 'engagement'
                ? 'Filter engagement scoreboards by email, company, interest level, or asset...'
                : 'Filter leads by name, email, company, or asset...'
            }
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full rounded-lg border border-input-border bg-surface pl-10 pr-4 py-1.5 text-xs text-text-primary focus:border-accent-blue focus:ring-2 focus:ring-accent-blue-light focus:outline-none"
          />
        </div>
      </div>

      {/* Leads or Scores Table */}
      <div className="overflow-auto max-h-[600px] rounded-xl border border-border bg-surface shadow-card">
        {loading ? (
          <div className="divide-y divide-divider animate-pulse">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-50 dark:bg-gray-800/30" />
            ))}
          </div>
        ) : currentView !== 'engagement' ? (
          displayedLeads.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 text-center max-w-md mx-auto">
              <div className="mb-6 relative flex h-16 w-16 items-center justify-center rounded-full bg-accent-blue-light text-accent-blue">
                <Users className="h-8 w-8" />
              </div>
              <h3 className="text-sm font-bold text-text-primary">No leads captured yet</h3>
              <p className="mt-2 text-xs leading-relaxed text-text-secondary">
                Leads will populate here automatically once readers register their credentials to view gated files or links.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs text-text-secondary">
                <thead className="sticky top-0 bg-[#EEF2F6] dark:bg-[#1E293B] text-[10px] font-bold uppercase tracking-wider text-text-muted border-b border-border z-10">
                  <tr>
                    <th className="px-5 py-4">Lead Contact Details</th>
                    <th className="px-5 py-4">Associated Company</th>
                    <th className="px-5 py-4">Unlocked Asset</th>
                    <th className="px-5 py-4">Asset Type</th>
                    <th className="px-5 py-4">Captured Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-divider">
                  {displayedLeads.map((l) => {
                    const assetName = l.assetId
                      ? l.assetId.title || l.assetId.originalName || 'Asset'
                      : 'Deleted Asset';
                    return (
                      <tr key={l._id} className="hover:bg-[#F5F8FC]/50 transition-colors">
                        {/* Name / Email */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-light font-bold text-primary text-xs shrink-0">
                              {l.name ? l.name.charAt(0).toUpperCase() : <Mail className="h-3.5 w-3.5" />}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-text-primary text-xs truncate max-w-xs">{l.name || 'Anonymous Reader'}</div>
                              <div className="text-[10px] text-text-muted flex items-center gap-1.5 mt-0.5 truncate max-w-xs">
                                <Mail className="h-3 w-3 shrink-0" /> {l.email}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Company */}
                        <td className="px-5 py-4">
                          {l.company ? (
                            <div className="flex items-center gap-1.5 text-xs text-text-primary font-semibold">
                              <Building className="h-3.5 w-3.5 text-text-muted shrink-0" />
                              <span className="truncate max-w-[150px]">{l.company}</span>
                            </div>
                          ) : (
                            <span className="text-text-muted">--</span>
                          )}
                        </td>

                        {/* Asset Title */}
                        <td className="px-5 py-4">
                          <div className="font-bold text-text-primary truncate max-w-xs">{assetName}</div>
                          <div className="text-[9px] text-text-muted mt-0.5 uppercase font-semibold">Code: {l.assetId?.shortCode}</div>
                        </td>

                        {/* Asset Type */}
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider border ${
                              l.assetType === 'file'
                                ? 'bg-analytics-green-light text-analytics-green border-analytics-green/15'
                                : 'bg-accent-blue-light text-accent-blue border-accent-blue/15'
                            }`}
                          >
                            {l.assetType === 'file' ? (
                              <>
                                <FileText className="h-3 w-3" /> Document
                              </>
                            ) : (
                              <>
                                <Link2 className="h-3 w-3" /> Link
                              </>
                            )}
                          </span>
                        </td>

                        {/* Capture Date */}
                        <td className="px-5 py-4 text-text-muted">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 shrink-0" />
                            <span>
                              {new Date(l.createdAt).toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        ) : (
          displayedScores.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 text-center max-w-md mx-auto">
              <div className="mb-6 relative flex h-16 w-16 items-center justify-center rounded-full bg-accent-blue-light text-accent-blue">
                <Sparkles className="h-8 w-8 animate-pulse" />
              </div>
              <h3 className="text-sm font-bold text-text-primary">No engagement analytics compiled yet</h3>
              <p className="mt-2 text-xs leading-relaxed text-text-secondary">
                Our insights engine compiles interest levels automatically once visitor clicks, views, and downloads are registered on links and documents.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs text-text-secondary">
                <thead className="sticky top-0 bg-[#EEF2F6] dark:bg-[#1E293B] text-[10px] font-bold uppercase tracking-wider text-text-muted border-b border-border z-10">
                  <tr>
                    <th className="px-5 py-4">Visitor / Lead Identity</th>
                    <th className="px-5 py-4">Interest Level</th>
                    <th className="px-5 py-4">Engagement Score</th>
                    <th className="px-5 py-4">Last Active Target</th>
                    <th className="px-5 py-4">Key Scoring Factors</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-divider">
                  {displayedScores.map((s) => {
                    const isHot = s.score >= 70;
                    const isWarm = s.score >= 40 && s.score < 70;
                    return (
                      <tr key={s._id} className="hover:bg-[#F5F8FC]/50 transition-colors">
                        {/* Lead Identity details */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-light font-bold text-primary text-xs shrink-0">
                              {s.leadName ? s.leadName.charAt(0).toUpperCase() : <Mail className="h-3.5 w-3.5" />}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-text-primary text-xs truncate max-w-xs">{s.leadName || 'Anonymous Visitor'}</div>
                              <div className="text-[10px] text-text-muted flex items-center gap-1.5 mt-0.5 truncate max-w-xs">
                                <Mail className="h-3 w-3 shrink-0" /> {s.leadEmail || s.visitorId}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Interest Level badge */}
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase border ${
                            isHot
                              ? 'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/50'
                              : isWarm
                              ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/50'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-transparent'
                          }`}>
                            {isHot ? '🔥 Hot Prospect' : isWarm ? '⚡ Warm Lead' : '❄️ Cold Lead'}
                          </span>
                        </td>

                        {/* Numeric Engagement Score pill */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-16 bg-divider rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  isHot ? 'bg-red-500' : isWarm ? 'bg-amber-500' : 'bg-slate-400'
                                }`}
                                style={{ width: `${s.score}%` }}
                              />
                            </div>
                            <span className="font-bold text-text-primary">{s.score}%</span>
                          </div>
                        </td>

                        {/* Last Active Target */}
                        <td className="px-5 py-4">
                          <div className="font-bold text-text-primary truncate max-w-xs">{s.assetName}</div>
                          <div className="text-[9px] text-text-muted mt-0.5 uppercase font-semibold">
                            {s.assetType} • Code: {s.shortCode}
                          </div>
                        </td>

                        {/* Scoring Factors */}
                        <td className="px-5 py-4">
                          <div className="flex flex-wrap gap-1">
                            {s.factors && s.factors.length > 0 ? (
                              s.factors.map((f, i) => (
                                <span key={i} className="inline-flex rounded bg-[#EEF2F6] dark:bg-[#1E293B] px-1.5 py-0.5 text-[9px] font-semibold text-text-secondary capitalize">
                                  {f.replace('_', ' ')}
                                </span>
                              ))
                            ) : (
                              <span className="text-text-muted">--</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      {/* Pagination Footer */}
      {!loading && (currentView !== 'engagement' ? pageCount > 1 : scoresPageCount > 1) && (
        <div className="flex items-center justify-between border-t border-border pt-4">
          <span className="text-xs text-text-muted">
            {currentView === 'engagement'
              ? `Showing Page ${currentPage} of ${scoresPageCount} (${filteredScores.length} unique profiles)`
              : `Showing Page ${currentPage} of ${pageCount} (${filteredLeads.length} total leads)`}
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
              onClick={() => setCurrentPage((p) => Math.min(p + 1, currentView === 'engagement' ? scoresPageCount : pageCount))}
              disabled={currentPage === (currentView === 'engagement' ? scoresPageCount : pageCount)}
              className="rounded-lg border border-border px-3 py-1 text-xs font-semibold text-text-primary hover:bg-sidebar-hover disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
