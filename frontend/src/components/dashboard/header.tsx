'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Bell,
  Menu,
  X,
  Search,
  FileText,
  Link2,
  Users,
  Settings,
  ArrowRight,
  CornerDownLeft,
  Command,
  Plus,
  FileUp,
  Activity,
  CreditCard
} from 'lucide-react';
import { apiClient } from '../../lib/api-client';

interface NotificationItem {
  _id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export default function Header({
  onMenuToggle,
  isMobileOpen,
}: {
  onMenuToggle?: () => void;
  isMobileOpen?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Search States
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [allData, setAllData] = useState<{
    links: any[];
    files: any[];
    leads: any[];
  } | null>(null);
  const [searchResults, setSearchResults] = useState<{
    links: any[];
    files: any[];
    leads: any[];
  }>({ links: [], files: [], leads: [] });

  // Translate paths to readable headers
  const getPageTitle = () => {
    if (pathname.startsWith('/dashboard')) return 'Dashboard';
    if (pathname.startsWith('/links')) return 'Tracked Links';
    if (pathname.startsWith('/files')) return 'Documents & Files';
    if (pathname.startsWith('/leads')) return 'Engagement & Leads';
    if (pathname.startsWith('/settings')) return 'Settings';
    return 'TraceLink';
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const res = await apiClient.get('/api/analytics/notifications');
      setNotifications(res.data);
    } catch (err) {
      console.error('Failed to load notifications', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000); // Poll every 15s
    return () => clearInterval(interval);
  }, []);

  // Keybindings for search overlay
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fetch all searchable resources once search overlay opens
  useEffect(() => {
    if (isSearchOpen && !allData) {
      const fetchSearchData = async () => {
        setLoadingSearch(true);
        try {
          const [linksRes, filesRes, leadsRes] = await Promise.all([
            apiClient.get('/api/links'),
            apiClient.get('/api/files'),
            apiClient.get('/api/analytics/leads'),
          ]);
          setAllData({
            links: linksRes.data || [],
            files: filesRes.data || [],
            leads: leadsRes.data || [],
          });
        } catch (err) {
          console.error('Failed to fetch search datasets', err);
        } finally {
          setLoadingSearch(false);
        }
      };
      fetchSearchData();
    }
  }, [isSearchOpen, allData]);

  // Handle filtering
  useEffect(() => {
    if (!allData) return;
    const query = searchQuery.toLowerCase().trim();
    if (!query) {
      setSearchResults({ links: [], files: [], leads: [] });
      return;
    }

    const filteredLinks = allData.links.filter(
      (l: any) =>
        (l.title || '').toLowerCase().includes(query) ||
        (l.shortCode || '').toLowerCase().includes(query) ||
        (l.url || '').toLowerCase().includes(query)
    );

    const filteredFiles = allData.files.filter(
      (f: any) =>
        (f.name || '').toLowerCase().includes(query) ||
        (f.code || '').toLowerCase().includes(query)
    );

    const filteredLeads = allData.leads.filter(
      (lead: any) =>
        (lead.email || '').toLowerCase().includes(query) ||
        (lead.name || '').toLowerCase().includes(query) ||
        (lead.company || '').toLowerCase().includes(query)
    );

    setSearchResults({
      links: filteredLinks.slice(0, 5),
      files: filteredFiles.slice(0, 5),
      leads: filteredLeads.slice(0, 5),
    });
  }, [searchQuery, allData]);

  const markAllRead = async () => {
    try {
      await apiClient.put('/api/analytics/notifications/read');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Failed to mark notifications read', err);
    }
  };

  const navigateTo = (path: string) => {
    router.push(path);
    setIsSearchOpen(false);
    setSearchQuery('');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Simple visual toast or log
    setIsSearchOpen(false);
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <>
      <header className="sticky top-0 z-10 flex h-16 w-full items-center justify-between border-b border-border bg-surface px-6">
        {/* Page Title & Mobile Trigger */}
        <div className="flex items-center gap-3">
          {onMenuToggle && (
            <button
              onClick={onMenuToggle}
              className="rounded-lg p-1.5 hover:bg-primary-light lg:hidden text-text-primary"
              aria-label="Toggle navigation drawer"
            >
              {isMobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          )}
          <h1 className="text-lg font-semibold text-text-primary hidden md:block">{getPageTitle()}</h1>
        </div>

        {/* Global Search Bar Trigger button */}
        <div className="flex flex-1 items-center justify-center px-4 max-w-md mx-auto">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-text-muted hover:border-accent-blue hover:text-text-primary focus:outline-none w-full justify-between max-w-sm cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              <span>Search platform...</span>
            </span>
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-surface px-1.5 font-mono text-[9px] font-semibold text-text-muted">
              <span>Ctrl K</span>
            </kbd>
          </button>
        </div>

        {/* Profile actions / Notification Center */}
        <div className="relative flex items-center gap-4">
          {/* Notification Bell */}
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              if (!showNotifications && unreadCount > 0) {
                markAllRead();
              }
            }}
            className="relative rounded-full p-2 text-text-secondary transition-colors hover:bg-primary-light hover:text-text-primary"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5 rounded-full bg-red-600 ring-2 ring-surface" />
            )}
          </button>

          {/* Notification Dropdown Panel */}
          {showNotifications && (
            <div className="absolute right-0 top-12 z-30 w-80 rounded-xl border border-border bg-surface py-2 shadow-lg">
              <div className="flex items-center justify-between border-b border-divider px-4 pb-2">
                <span className="text-sm font-semibold text-text-primary">Alerts & Signals</span>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-xs text-brand-accent hover:underline">
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-text-muted">No alerts yet.</div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif._id}
                      className={`border-b border-divider px-4 py-3 text-xs last:border-b-0 hover:bg-sidebar-hover ${
                        !notif.isRead ? 'bg-primary-light' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between font-semibold text-text-primary">
                        <span>{notif.title}</span>
                        <span className="text-[10px] font-normal text-text-muted">
                          {new Date(notif.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="mt-1 text-text-secondary">{notif.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Global Command Palette Overlay (⌘K) */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-primary/30 backdrop-blur-xs">
          <div
            className="fixed inset-0"
            onClick={() => setIsSearchOpen(false)}
          />
          <div className="relative w-full max-w-lg overflow-hidden rounded-xl border border-border bg-surface shadow-2xl transition-all duration-200">
            {/* Search Input Box */}
            <div className="flex items-center border-b border-divider px-4 py-3">
              <Search className="h-5 w-5 text-text-muted mr-3 shrink-0" />
              <input
                type="text"
                placeholder="Type to find links, files, leads, or actions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="w-full bg-transparent text-sm text-text-primary placeholder-text-muted focus:outline-none"
              />
              <span className="rounded border border-border bg-background px-1.5 py-0.5 text-[9px] font-bold text-text-muted uppercase">
                ESC
              </span>
            </div>

            {/* Results Area */}
            <div className="max-h-[360px] overflow-y-auto p-2">
              {loadingSearch ? (
                <div className="flex items-center justify-center py-12 text-xs text-text-muted gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  <span>Indexing platform assets...</span>
                </div>
              ) : searchQuery.trim() === '' ? (
                /* Quick actions shown when empty query */
                <div className="space-y-1">
                  <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-text-muted">
                    Quick Navigation & Actions
                  </div>
                  
                  <button
                    onClick={() => navigateTo('/links')}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs text-text-secondary hover:bg-sidebar-hover hover:text-text-primary"
                  >
                    <span className="flex items-center gap-2.5">
                      <Plus className="h-4 w-4 text-text-muted" />
                      <span>Create a new Tracked Link</span>
                    </span>
                    <CornerDownLeft className="h-3 w-3 text-text-muted opacity-45" />
                  </button>

                  <button
                    onClick={() => navigateTo('/files')}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs text-text-secondary hover:bg-sidebar-hover hover:text-text-primary"
                  >
                    <span className="flex items-center gap-2.5">
                      <FileUp className="h-4 w-4 text-text-muted" />
                      <span>Upload a Document File</span>
                    </span>
                    <CornerDownLeft className="h-3 w-3 text-text-muted opacity-45" />
                  </button>

                  <button
                    onClick={() => navigateTo('/dashboard?tab=traffic')}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs text-text-secondary hover:bg-sidebar-hover hover:text-text-primary"
                  >
                    <span className="flex items-center gap-2.5">
                      <Activity className="h-4 w-4 text-text-muted" />
                      <span>View Traffic Overview Charts</span>
                    </span>
                    <CornerDownLeft className="h-3 w-3 text-text-muted opacity-45" />
                  </button>

                  <button
                    onClick={() => navigateTo('/settings')}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs text-text-secondary hover:bg-sidebar-hover hover:text-text-primary"
                  >
                    <span className="flex items-center gap-2.5">
                      <Settings className="h-4 w-4 text-text-muted" />
                      <span>Platform Settings & APIs</span>
                    </span>
                    <CornerDownLeft className="h-3 w-3 text-text-muted opacity-45" />
                  </button>
                  
                  <button
                    onClick={() => navigateTo('/settings?tab=billing')}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs text-text-secondary hover:bg-sidebar-hover hover:text-text-primary"
                  >
                    <span className="flex items-center gap-2.5">
                      <CreditCard className="h-4 w-4 text-text-muted" />
                      <span>Billing & Invoices</span>
                    </span>
                    <CornerDownLeft className="h-3 w-3 text-text-muted opacity-45" />
                  </button>
                </div>
              ) : Object.values(searchResults).every((arr) => arr.length === 0) ? (
                <div className="py-12 text-center text-xs text-text-muted">
                  No matches found for <strong className="text-text-primary">"{searchQuery}"</strong>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Matching Links */}
                  {searchResults.links.length > 0 && (
                    <div className="space-y-1">
                      <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                        <Link2 className="h-3 w-3" /> Tracked Links
                      </div>
                      {searchResults.links.map((link) => (
                        <button
                          key={link._id}
                          onClick={() => {
                            const origin = typeof window !== 'undefined' ? window.location.origin : '';
                            copyToClipboard(`${origin}/l/${link.shortCode}`);
                            navigateTo('/links');
                          }}
                          className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs text-text-secondary hover:bg-sidebar-hover hover:text-text-primary text-left"
                        >
                          <div className="truncate pr-4">
                            <div className="font-semibold text-text-primary truncate">{link.title || 'Untitled Link'}</div>
                            <div className="text-[10px] text-text-muted truncate mt-0.5">{link.url}</div>
                          </div>
                          <span className="text-[10px] font-semibold text-brand-accent bg-brand-accent-light px-2 py-0.5 rounded shrink-0">
                            Copy short link
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Matching Files */}
                  {searchResults.files.length > 0 && (
                    <div className="space-y-1">
                      <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                        <FileText className="h-3 w-3" /> Documents & Files
                      </div>
                      {searchResults.files.map((file) => (
                        <button
                          key={file._id}
                          onClick={() => navigateTo('/files')}
                          className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs text-text-secondary hover:bg-sidebar-hover hover:text-text-primary text-left"
                        >
                          <div className="truncate pr-4">
                            <div className="font-semibold text-text-primary truncate">{file.name}</div>
                            <div className="text-[10px] text-text-muted mt-0.5">Code: {file.code}</div>
                          </div>
                          <span className="text-[10px] text-text-muted bg-background border border-border px-1.5 py-0.5 rounded shrink-0">
                            View file
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Matching Leads */}
                  {searchResults.leads.length > 0 && (
                    <div className="space-y-1">
                      <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                        <Users className="h-3 w-3" /> Engagement Leads
                      </div>
                      {searchResults.leads.map((lead) => (
                        <button
                          key={lead._id}
                          onClick={() => navigateTo('/leads')}
                          className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs text-text-secondary hover:bg-sidebar-hover hover:text-text-primary text-left"
                        >
                          <div>
                            <div className="font-semibold text-text-primary">{lead.name || 'Anonymous'}</div>
                            <div className="text-[10px] text-text-muted mt-0.5">{lead.email}</div>
                          </div>
                          {lead.company && (
                            <span className="text-[10px] font-medium text-text-primary bg-primary-light px-2 py-0.5 rounded shrink-0 max-w-[120px] truncate">
                              {lead.company}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* command footer */}
            <div className="flex items-center justify-between border-t border-divider bg-background px-4 py-2 text-[10px] text-text-muted">
              <span className="flex items-center gap-1">
                <Command className="h-3 w-3" />
                <span>Search engine online</span>
              </span>
              <span>Use arrows to navigate</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
