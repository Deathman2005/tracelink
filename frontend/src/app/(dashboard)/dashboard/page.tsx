'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/use-auth';
import { useSearchParams } from 'next/navigation';
import { apiClient } from '../../../lib/api-client';
import {
  Link2,
  MousePointerClick,
  Eye,
  Activity,
  Globe,
  Plus,
  ArrowRight,
  TrendingUp,
  FileText,
  UserCheck,
  MapPin,
  Laptop,
  Compass,
  Zap,
  Users,
  Target
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface KPIs {
  totalLinks: number;
  totalFiles: number;
  totalClicks: number;
  totalDownloads: number;
  totalViews: number;
  uniqueVisitors: number;
  returningVisitors: number;
  avgEngagementScore: number;
}

interface ChartTimeline {
  date: string;
  clicks: number;
  opens: number;
  downloads: number;
  total: number;
}

interface SourceItem {
  name: string;
  value: number;
}

interface VisitorSources {
  devices: SourceItem[];
  browsers: SourceItem[];
  referers: SourceItem[];
  countries?: SourceItem[];
}

interface ActivityEvent {
  _id: string;
  assetId: string;
  assetType: 'link' | 'file';
  assetName: string;
  shortCode: string;
  eventType: string;
  visitorId: string;
  timestamp: string;
  metadata: {
    browser?: string;
    device?: string;
    os?: string;
    ip?: string;
    country?: string;
    region?: string;
    city?: string;
  };
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

const COLORS = ['#2B6EF3', '#3B82F6', '#60A5FA', '#93C5FD', '#64748B'];



export default function Dashboard() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get('tab') || 'overview';
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [chartData, setChartData] = useState<ChartTimeline[]>([]);
  const [sources, setSources] = useState<VisitorSources | null>(null);
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [scores, setScores] = useState<ScoreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  
  // Date filter states: '7' | '30' | '90'
  const [daysFilter, setDaysFilter] = useState<'7' | '30' | '90'>('30');

  const fetchDashboardData = async () => {
    try {
      const [kpisRes, chartsRes, sourcesRes, activitiesRes, scoresRes] = await Promise.all([
        apiClient.get('/api/analytics/dashboard-kpis'),
        apiClient.get('/api/analytics/charts'),
        apiClient.get('/api/analytics/visitor-sources'),
        apiClient.get('/api/analytics/recent-events'),
        apiClient.get('/api/analytics/scores'),
      ]);

      setKpis(kpisRes.data);
      setChartData(chartsRes.data);
      setSources(sourcesRes.data);
      setActivities(activitiesRes.data);
      setScores(scoresRes.data);
    } catch (err) {
      console.error('Failed to load dashboard statistics', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 20000);
    return () => clearInterval(interval);
  }, []);

  const getGreeting = () => {
    const hr = new Date().getHours();
    const name = user?.name ? `, ${user.name.split(' ')[0]}` : '';
    if (hr < 12) return `Good morning${name}`;
    if (hr < 17) return `Good afternoon${name}`;
    return `Good evening${name}`;
  };

  if (loading || !mounted) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="space-y-3">
          <div className="h-8 w-64 rounded bg-[#E3E8EE] dark:bg-[#1E293B]" />
          <div className="h-4 w-96 rounded bg-[#E3E8EE] dark:bg-[#1E293B]" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-[#E3E8EE] dark:bg-[#1E293B]" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="h-96 rounded-xl bg-[#E3E8EE] dark:bg-[#1E293B] lg:col-span-2" />
          <div className="h-96 rounded-xl bg-[#E3E8EE] dark:bg-[#1E293B]" />
        </div>
      </div>
    );
  }

  // Slice chart data depending on day filters
  const filteredChartData = (() => {
    if (daysFilter === '7') return chartData.slice(-7);
    return chartData; // past 30 days is our default and max from backend
  })();

  // Calculate sparkline timelines
  const clickTimeline = chartData.map((d) => d.clicks);
  const openTimeline = chartData.map((d) => d.opens);
  const totalActivityTimeline = chartData.map((d) => d.total);
  const downloadTimeline = chartData.map((d) => d.downloads);

  // Helper to translate country codes (e.g. IN, US) to full names (e.g. India, United States)
  const getCountryName = (code?: string): string => {
    if (!code) return 'Unknown';
    if (code === 'Unknown') return 'Unknown';
    if (code.length > 2) return code;
    try {
      const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
      return regionNames.of(code.toUpperCase()) || code;
    } catch (e) {
      return code;
    }
  };

  // Format Event Types for timeline logs
  const formatEventDescription = (event: ActivityEvent) => {
    const countryName = getCountryName(event.metadata?.country);
    const city = event.metadata?.city;
    const region = event.metadata?.region;

    const locationParts = [];
    if (city) locationParts.push(city);
    if (region) locationParts.push(region);
    if (countryName && countryName !== 'Unknown') locationParts.push(countryName);

    const loc = locationParts.length > 0 ? `from ${locationParts.join(', ')}` : 'visitor';
    const client = event.metadata?.browser ? `on ${event.metadata.browser}` : '';

    switch (event.eventType) {
      case 'link_open':
        return (
          <span>
            Opened link <strong className="text-text-primary">{event.assetName}</strong> {loc} {client}
          </span>
        );
      case 'qr_scan':
        return (
          <span>
            Scanned QR code for <strong className="text-text-primary">{event.assetName}</strong> {loc}
          </span>
        );
      case 'file_open':
        return (
          <span>
            Viewed document <strong className="text-text-primary">{event.assetName}</strong> {loc}
          </span>
        );
      case 'file_download':
        return (
          <span>
            Downloaded file <strong className="text-text-primary">{event.assetName}</strong> {loc}
          </span>
        );
      case 'lead_submit':
        return (
          <span>
            Unlocked asset <strong className="text-text-primary">{event.assetName}</strong> using email gate
          </span>
        );
      default:
        return <span>Interacted with asset <strong className="text-text-primary">{event.assetName}</strong></span>;
    }
  };

  // Visitor insights variables
  const hasActivity = activities && activities.length > 0;
  const topCountryCode = hasActivity
    ? (sources?.countries?.[0]?.name || activities.find((a) => a.metadata?.country)?.metadata?.country || '')
    : '';
  const topCountry = topCountryCode ? getCountryName(topCountryCode) : 'N/A (No Traffic Registered)';
  const topDevice = hasActivity ? (sources?.devices?.[0]?.name || 'Desktop') : 'N/A';
  const topReferrer = hasActivity ? (sources?.referers?.[0]?.name || 'Direct Link') : 'No Traffic';
  const mostEngagedLead = scores?.[0];
  const highInterestLeads = scores?.filter((s) => s.score >= 70).slice(0, 3) || [];

  return (
    <div className="space-y-8">
      {currentTab === 'overview' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Welcome Banner */}
          <div className="flex flex-col gap-2">
            <h2 className="text-3xl font-bold tracking-tight text-text-primary">{getGreeting()}</h2>
            <p className="text-sm text-text-secondary max-w-2xl">
              Welcome to TraceLink. Here is what is happening across your tracked links, portfolios, and shared documents.
            </p>
          </div>

          {/* KPI Cards Grid with mini Recharts Sparklines */}
          {kpis && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {/* Card 1: Assets Shared */}
              <div className="rounded-card border border-border bg-surface p-5 shadow-card transition-all hover:shadow-card-hover flex flex-col justify-between h-32">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Assets Shared</span>
                  <div className="rounded-md bg-[#EEF2F6] dark:bg-[#1E293B] p-1.5 text-text-secondary">
                    <FileText className="h-4 w-4" />
                  </div>
                </div>
                <div className="flex items-end justify-between mt-2">
                  <div>
                    <h3 className="text-3xl font-bold text-text-primary leading-none">{kpis.totalLinks + kpis.totalFiles}</h3>
                    <p className="text-[10px] text-text-muted mt-1.5">{kpis.totalLinks} links, {kpis.totalFiles} documents</p>
                  </div>
                </div>
              </div>

              {/* Card 2: Link Click-Throughs */}
              <div className="rounded-card border border-border bg-surface p-5 shadow-card transition-all hover:shadow-card-hover flex flex-col justify-between h-32">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Link Clicks</span>
                  <div className="rounded-md bg-[#EEF2F6] dark:bg-[#1E293B] p-1.5 text-text-secondary">
                    <MousePointerClick className="h-4 w-4" />
                  </div>
                </div>
                <div className="flex items-end justify-between mt-2">
                  <div>
                    <h3 className="text-3xl font-bold text-text-primary leading-none">{kpis.totalClicks}</h3>
                    <p className="text-[10px] text-accent-blue font-medium mt-1.5">Active Links</p>
                  </div>
                </div>
              </div>

              {/* Card 3: Document Reads */}
              <div className="rounded-card border border-border bg-surface p-5 shadow-card transition-all hover:shadow-card-hover flex flex-col justify-between h-32">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Document Views</span>
                  <div className="rounded-md bg-[#EEF2F6] dark:bg-[#1E293B] p-1.5 text-text-secondary">
                    <Eye className="h-4 w-4" />
                  </div>
                </div>
                <div className="flex items-end justify-between mt-2">
                  <div>
                    <span className="inline-flex rounded-full bg-accent-blue-light border border-accent-blue/15 px-2.5 py-0.5 text-[9px] font-bold text-accent-blue uppercase tracking-wider mb-1.5">
                      Coming Soon
                    </span>
                    <p className="text-[10px] text-text-muted">Document telemetry & views dashboard</p>
                  </div>
                </div>
              </div>

              {/* Card 4: Audience Interest */}
              <div className="rounded-card border border-border bg-surface p-5 shadow-card transition-all hover:shadow-card-hover flex flex-col justify-between h-32">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Interest Score</span>
                  <div className="rounded-md bg-[#EEF2F6] dark:bg-[#1E293B] p-1.5 text-text-secondary">
                    <Target className="h-4 w-4" />
                  </div>
                </div>
                <div className="flex items-end justify-between mt-2">
                  <div>
                    <h3 className="text-3xl font-bold text-text-primary leading-none">{kpis.avgEngagementScore}%</h3>
                    <p className="text-[10px] text-text-muted mt-1.5">
                      {kpis.avgEngagementScore >= 60 ? 'Highly Active Audience 🔥' : 'Moderate Interest'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Main Charts & Traffic Split */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Large Traffic Overview AreaChart */}
            <div className="lg:col-span-2 rounded-xl border border-border bg-surface p-6 shadow-[0px_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted">Traffic Trend</h3>
                  <p className="text-lg font-bold text-text-primary mt-0.5">Link Clicks Traffic Trend</p>
                </div>
                {/* Filter buttons */}
                <div className="flex rounded-lg bg-background p-1 border border-border">
                  <button
                    onClick={() => setDaysFilter('7')}
                    className={`rounded-md px-3 py-1 text-xs font-semibold ${
                      daysFilter === '7'
                        ? 'bg-surface text-text-primary shadow-[0px_1px_2px_rgba(0,0,0,0.05)]'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    7 Days
                  </button>
                  <button
                    onClick={() => setDaysFilter('30')}
                    className={`rounded-md px-3 py-1 text-xs font-semibold ${
                      daysFilter === '30'
                        ? 'bg-surface text-text-primary shadow-[0px_1px_2px_rgba(0,0,0,0.05)]'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    30 Days
                  </button>
                </div>
              </div>

              <div className="h-72 w-full">
                {filteredChartData.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-xs text-text-muted">
                    No visitor traffic recorded during this timeframe.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={filteredChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="gradientClicks" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2B6EF3" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="#2B6EF3" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--divider)" />
                      <XAxis
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'var(--text-secondary)', fontSize: 10, fontWeight: 500 }}
                      />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 10, fontWeight: 500 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'var(--surface)',
                          border: '1px solid var(--border)',
                          borderRadius: '8px',
                          fontSize: '11px',
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                        }}
                      />
                      <Area
                        type="monotone"
                        name="Link Clicks"
                        dataKey="clicks"
                        stroke="#2B6EF3"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#gradientClicks)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Device breakdown pie chart */}
            <div className="rounded-xl border border-border bg-surface p-6 shadow-[0px_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted">Visitor Devices</h3>
                <p className="text-lg font-bold text-text-primary mt-0.5">Hardware Breakdown</p>
              </div>
              
              <div className="h-56 w-full flex flex-col items-center justify-center mt-4">
                {!sources?.devices || sources.devices.length === 0 ? (
                  <div className="text-xs text-text-muted">No device data captured yet.</div>
                ) : (
                  <>
                    <div className="h-44 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={sources?.devices}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={68}
                            paddingAngle={4}
                            dataKey="value"
                          >
                            {sources?.devices.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    {/* Custom Legend */}
                    <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px] w-full px-2">
                      {sources.devices.map((device, index) => (
                        <div key={device.name} className="flex items-center gap-1.5">
                          <span
                            className="h-2 w-2 rounded-full shrink-0"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="font-semibold text-text-secondary capitalize truncate">{device.name}</span>
                          <span className="text-text-muted">({device.value})</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Activity Logs & Visitor Insights */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Live Activity Timeline */}
            <div className="lg:col-span-2 rounded-xl border border-border bg-surface p-6 shadow-[0px_1px_3px_rgba(0,0,0,0.02)]">
              <div className="flex items-center justify-between border-b border-divider pb-4 mb-6">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted">Real-Time Tracker</h3>
                  <p className="text-lg font-bold text-text-primary mt-0.5">Audience Signals & Logs</p>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-analytics-green px-2.5 py-1 text-[10px] font-bold text-white uppercase tracking-wider">
                  <span className="h-1.5 w-1.5 rounded-full bg-white" /> LIVE
                </span>
              </div>

              <div className="relative pl-6 space-y-6 max-h-[360px] overflow-y-auto pr-2 border-l border-divider">
                {activities.length === 0 ? (
                  <div className="py-12 text-center text-xs text-text-muted">No client interactions recorded yet.</div>
                ) : (
                  activities.map((act) => {
                    const isDoc = act.eventType.startsWith('file');
                    const isLead = act.eventType === 'lead_submit';

                    return (
                      <div key={act._id} className="relative flex flex-col sm:flex-row sm:items-start justify-between gap-2 text-xs">
                        {/* Bullet indicator anchor */}
                        <span className={`absolute -left-[30px] top-1.5 flex h-2 w-2 rounded-full border bg-surface ring-4 ring-surface ${
                          isLead 
                            ? 'border-purple-600 bg-purple-600'
                            : isDoc
                            ? 'border-analytics-green bg-analytics-green'
                            : 'border-accent-blue bg-accent-blue'
                        }`} />
                        
                        <div className="space-y-1">
                          <p className="text-text-secondary leading-normal">{formatEventDescription(act)}</p>
                          <p className="text-[10px] text-text-muted flex items-center gap-2">
                            <span>IP: {act.metadata?.ip || 'Hidden'}</span>
                            <span>•</span>
                            <span>OS: {act.metadata?.os || 'Unknown Device'}</span>
                            {(act.metadata?.city || act.metadata?.region) && (
                              <>
                                <span>•</span>
                                <span>
                                  Location: {[act.metadata.city, act.metadata.region].filter(Boolean).join(', ')}
                                </span>
                              </>
                            )}
                          </p>
                        </div>

                        <span className="text-[10px] font-semibold text-text-muted whitespace-nowrap sm:self-start mt-0.5">
                          {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Visitor Insights Panel Widgets */}
            <div className="rounded-xl border border-border bg-surface p-6 shadow-[0px_1px_3px_rgba(0,0,0,0.02)] flex flex-col gap-6">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted">Insights Engine</h3>
                <p className="text-lg font-bold text-text-primary mt-0.5">Audience Intel</p>
              </div>

              <div className="space-y-4">
                {/* Top Country Widget */}
                <div className="flex items-center gap-3.5 p-3 rounded-lg border border-divider bg-background">
                  <div className="rounded-md bg-[#EEF2F6] p-2 text-text-primary shrink-0">
                    <MapPin className="h-4.5 w-4.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Top Audience Hub</div>
                    <div className="text-xs font-bold text-text-primary mt-0.5">{topCountry}</div>
                  </div>
                </div>

                {/* Dominant Device Widget */}
                <div className="flex items-center gap-3.5 p-3 rounded-lg border border-divider bg-background">
                  <div className="rounded-md bg-[#EEF2F6] p-2 text-text-primary shrink-0">
                    <Laptop className="h-4.5 w-4.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Primary Device Gateway</div>
                    <div className="text-xs font-bold text-text-primary mt-0.5 capitalize">
                      {hasActivity ? `${topDevice} (${topReferrer})` : 'N/A (No Traffic Registered)'}
                    </div>
                  </div>
                </div>

                {/* Most Engaged Account Widget */}
                <div className="flex items-center gap-3.5 p-3 rounded-lg border border-divider bg-background">
                  <div className="rounded-md bg-[#EEF2F6] p-2 text-text-primary shrink-0">
                    <UserCheck className="h-4.5 w-4.5" />
                  </div>
                  <div className="min-w-0 truncate">
                    <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Most Active Account</div>
                    <div className="text-xs font-bold text-text-primary mt-0.5 truncate">
                      {mostEngagedLead ? mostEngagedLead.leadEmail : 'No Leads Captured Yet'}
                    </div>
                    {mostEngagedLead && (
                      <div className="text-[9px] font-semibold text-analytics-green mt-0.5">
                        Engagement Score: {mostEngagedLead.score}%
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* High Interest Leads Panel */}
              <div className="border-t border-divider pt-4 flex-1">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-3 flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" /> High-Interest Leads (Score &ge; 70)
                </h4>
                <div className="space-y-2">
                  {highInterestLeads.length === 0 ? (
                    <div className="text-[11px] text-text-muted py-2">
                      No leads have reached high-interest status yet.
                    </div>
                  ) : (
                    highInterestLeads.map((hl) => (
                      <div key={hl._id} className="flex items-center justify-between text-xs py-1">
                        <div className="min-w-0 pr-2">
                          <div className="font-semibold text-text-primary truncate">{hl.leadEmail}</div>
                          <div className="text-[9px] text-text-muted truncate mt-0.5">
                            Asset: {hl.assetName} ({hl.assetType})
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-analytics-green bg-analytics-green-light px-1.5 py-0.5 rounded shrink-0">
                          {hl.score}%
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {currentTab === 'traffic' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Header */}
          <div className="flex flex-col gap-2">
            <h2 className="text-3xl font-bold tracking-tight text-text-primary">Traffic Analytics</h2>
            <p className="text-sm text-text-secondary">Detailed view of campaign traffic trend, referrals, and geographic distribution.</p>
          </div>

          {/* Large Traffic Overview Chart */}
          <div className="rounded-xl border border-border bg-surface p-6 shadow-card flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted">Interactive Analytics</h3>
                <p className="text-lg font-bold text-text-primary mt-0.5">Link Click-through Performance</p>
              </div>
              <div className="flex rounded-lg bg-background p-1 border border-border">
                <button
                  onClick={() => setDaysFilter('7')}
                  className={`rounded-md px-3 py-1 text-xs font-semibold ${
                    daysFilter === '7'
                      ? 'bg-surface text-text-primary shadow-sm'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  7 Days
                </button>
                <button
                  onClick={() => setDaysFilter('30')}
                  className={`rounded-md px-3 py-1 text-xs font-semibold ${
                    daysFilter === '30'
                      ? 'bg-surface text-text-primary shadow-sm'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  30 Days
                </button>
              </div>
            </div>

            <div className="h-96 w-full">
              {filteredChartData.length === 0 ? (
                <div className="flex h-full items-center justify-center text-xs text-text-muted">
                  No visitor traffic recorded during this timeframe.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={filteredChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradientClicks" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2B6EF3" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#2B6EF3" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--divider)" />
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'var(--text-secondary)', fontSize: 10, fontWeight: 500 }}
                    />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 10, fontWeight: 500 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--surface)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        fontSize: '11px',
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                      }}
                    />
                    <Area
                      type="monotone"
                      name="Link Clicks"
                      dataKey="clicks"
                      stroke="#2B6EF3"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#gradientClicks)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Referrers & Geographic Distribution */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Referral Channels Card */}
            <div className="rounded-xl border border-border bg-surface p-6 shadow-card flex flex-col">
              <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-4">Traffic Referral Channels</h3>
              <div className="space-y-5 flex-1 justify-center flex flex-col">
                {!sources?.referers || sources.referers.length === 0 ? (
                  <div className="text-xs text-text-muted text-center py-10">No referral data recorded.</div>
                ) : (
                  (() => {
                    const totalReferrals = sources.referers.reduce((acc, curr) => acc + curr.value, 0) || 1;
                    return sources.referers.map((ref, idx) => {
                      const percentage = Math.round((ref.value / totalReferrals) * 100);
                      return (
                        <div key={ref.name} className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs font-semibold text-text-primary">
                            <span className="capitalize">{ref.name}</span>
                            <span>{ref.value} clicks ({percentage}%)</span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-divider overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${percentage}%`,
                                backgroundColor: COLORS[idx % COLORS.length]
                              }}
                            />
                          </div>
                        </div>
                      );
                    });
                  })()
                )}
              </div>
            </div>

            {/* Geographical Audience Card */}
            <div className="rounded-xl border border-border bg-surface p-6 shadow-card flex flex-col">
              <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-4">Geographical Performance</h3>
              <div className="space-y-5 flex-1 justify-center flex flex-col">
                {!sources?.countries || sources.countries.length === 0 ? (
                  <div className="text-xs text-text-muted text-center py-10">No geographical data captured yet.</div>
                ) : (
                  (() => {
                    const totalCountries = sources.countries.reduce((acc, curr) => acc + curr.value, 0) || 1;
                    return sources.countries.map((c, idx) => {
                      const name = getCountryName(c.name);
                      const percentage = Math.round((c.value / totalCountries) * 100);
                      return (
                        <div key={c.name} className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs font-semibold text-text-primary">
                            <span className="flex items-center gap-2">
                              <Globe className="h-4 w-4 text-text-muted" />
                              {name}
                            </span>
                            <span>{c.value} visits ({percentage}%)</span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-divider overflow-hidden">
                            <div
                              className="h-full rounded-full bg-analytics-green transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    });
                  })()
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {currentTab === 'visitors' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Header */}
          <div className="flex flex-col gap-2">
            <h2 className="text-3xl font-bold tracking-tight text-text-primary">Visitor Insights</h2>
            <p className="text-sm text-text-secondary">Identify hardware environments, operating platforms, and user agents of your readers.</p>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-card border border-border bg-surface p-5 shadow-card flex flex-col justify-between h-28">
              <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Unique Visitors</span>
              <h3 className="text-3xl font-bold text-text-primary mt-2">{kpis?.uniqueVisitors || 0}</h3>
              <p className="text-[10px] text-text-muted mt-1">Total unique traffic tags</p>
            </div>
            <div className="rounded-card border border-border bg-surface p-5 shadow-card flex flex-col justify-between h-28">
              <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Dominant Platform</span>
              <h3 className="text-3xl font-bold text-text-primary mt-2">{topDevice}</h3>
              <p className="text-[10px] text-text-muted mt-1">Main client hardware</p>
            </div>
            <div className="rounded-card border border-border bg-surface p-5 shadow-card flex flex-col justify-between h-28">
              <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Top Country</span>
              <h3 className="text-3xl font-bold text-text-primary mt-2 truncate">{topCountry}</h3>
              <p className="text-[10px] text-text-muted mt-1">Highest audience hub</p>
            </div>
            <div className="rounded-card border border-border bg-surface p-5 shadow-card flex flex-col justify-between h-28">
              <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Returning Visitors</span>
              <h3 className="text-3xl font-bold text-text-primary mt-2">{kpis?.returningVisitors || 0}</h3>
              <p className="text-[10px] text-text-muted mt-1">Loyal readers</p>
            </div>
          </div>

          {/* Hardware & Browser Distribution Grid */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Device breakdown pie chart */}
            <div className="rounded-xl border border-border bg-surface p-6 shadow-card flex flex-col">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted">Visitor Devices</h3>
                <p className="text-lg font-bold text-text-primary mt-0.5">Hardware Breakdown</p>
              </div>
              <div className="h-64 w-full flex flex-col items-center justify-center mt-4">
                {!sources?.devices || sources.devices.length === 0 ? (
                  <div className="text-xs text-text-muted">No device data captured yet.</div>
                ) : (
                  <>
                    <div className="h-44 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={sources?.devices}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={68}
                            paddingAngle={4}
                            dataKey="value"
                          >
                            {sources?.devices.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    {/* Custom Legend */}
                    <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px] w-full px-2">
                      {sources.devices.map((device, index) => (
                        <div key={device.name} className="flex items-center gap-1.5">
                          <span
                            className="h-2 w-2 rounded-full shrink-0"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="font-semibold text-text-secondary capitalize truncate">{device.name}</span>
                          <span className="text-text-muted">({device.value})</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Browser breakdown list */}
            <div className="rounded-xl border border-border bg-surface p-6 shadow-card flex flex-col">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted">User Agents</h3>
                <p className="text-lg font-bold text-text-primary mt-0.5">Browser Distribution</p>
              </div>
              <div className="space-y-5 flex-1 justify-center flex flex-col mt-4">
                {!sources?.browsers || sources.browsers.length === 0 ? (
                  <div className="text-xs text-text-muted text-center py-10">No browser data captured.</div>
                ) : (
                  (() => {
                    const totalBrowsers = sources.browsers.reduce((acc, curr) => acc + curr.value, 0) || 1;
                    return sources.browsers.map((b, idx) => {
                      const percentage = Math.round((b.value / totalBrowsers) * 100);
                      return (
                        <div key={b.name} className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs font-semibold text-text-primary">
                            <span className="capitalize">{b.name}</span>
                            <span>{b.value} visits ({percentage}%)</span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-divider overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${percentage}%`,
                                backgroundColor: COLORS[(idx + 2) % COLORS.length]
                              }}
                            />
                          </div>
                        </div>
                      );
                    });
                  })()
                )}
              </div>
            </div>
          </div>

          {/* Visitor Timeline Logs */}
          <div className="rounded-xl border border-border bg-surface p-6 shadow-card">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-4">Detailed Visitor Activity Logs</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs text-text-secondary">
                <thead className="bg-[#EEF2F6] dark:bg-[#1E293B] text-[10px] font-bold uppercase tracking-wider text-text-muted border-b border-border">
                  <tr>
                    <th className="px-5 py-4">Activity Date & Time</th>
                    <th className="px-5 py-4">IP Address</th>
                    <th className="px-5 py-4">Location</th>
                    <th className="px-5 py-4">Operating System</th>
                    <th className="px-5 py-4">Client Agent</th>
                    <th className="px-5 py-4">Interacted Asset</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-divider">
                  {activities.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-text-muted">No visitor activities tracked yet.</td>
                    </tr>
                  ) : (
                    activities.map((act) => (
                      <tr key={act._id} className="hover:bg-[#F5F8FC]/50 transition-colors">
                        <td className="px-5 py-4 font-semibold text-text-primary">
                          {new Date(act.timestamp).toLocaleString()}
                        </td>
                        <td className="px-5 py-4 font-mono">{act.metadata?.ip || 'Hidden'}</td>
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-2">
                            {act.metadata?.country && act.metadata.country !== 'Unknown' && act.metadata.country.length === 2 && (
                              <img
                                src={`https://flagcdn.com/w40/${act.metadata.country.toLowerCase()}.png`}
                                className="w-4.5 h-auto object-contain rounded-sm shrink-0 border border-divider"
                                alt={getCountryName(act.metadata.country)}
                              />
                            )}
                            <span>
                              {act.metadata?.city ? `${act.metadata.city}, ` : ''}
                              {act.metadata?.region ? `${act.metadata.region}, ` : ''}
                              {getCountryName(act.metadata?.country)}
                            </span>
                          </span>
                        </td>
                        <td className="px-5 py-4 capitalize">{act.metadata?.os || 'Unknown'}</td>
                        <td className="px-5 py-4 capitalize">{act.metadata?.browser || 'Unknown'}</td>
                        <td className="px-5 py-4 capitalize">
                          {act.assetName} ({act.assetType})
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
