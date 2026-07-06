'use client';

import React from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  Sparkles,
  MousePointerClick,
  Eye,
  Award,
  Users,
  ShieldCheck,
  QrCode,
  ArrowRight,
  CheckCircle,
} from 'lucide-react';

export default function MarketingLanding() {
  return (
    <div className="min-h-screen bg-background text-text-primary flex flex-col font-sans">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-surface/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <img src="/logo.png" alt="TraceLink" className="h-6 sm:h-7.5 w-auto object-contain dark:brightness-0 dark:invert" />
          </Link>

          {/* Nav links */}
          <nav className="hidden gap-6 text-sm font-medium text-text-secondary md:flex">
            <a href="#features" className="hover:text-text-primary transition-colors">Features</a>
            <a href="#solutions" className="hover:text-text-primary transition-colors">Solutions</a>
            <a href="#pricing" className="hover:text-text-primary transition-colors">Pricing</a>
          </nav>

          {/* Action buttons */}
          <div className="flex items-center gap-2.5 sm:gap-4">
            <Link href="/login" className="text-xs sm:text-sm font-semibold text-text-secondary hover:text-text-primary whitespace-nowrap">
              Sign in
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-accent-blue px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold text-white transition-colors hover:bg-accent-blue-hover shadow-sm whitespace-nowrap"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="mx-auto max-w-7xl px-6 py-20 lg:py-28 grid gap-12 lg:grid-cols-2 items-center">
        {/* Left pitch */}
        <div className="space-y-8 text-center lg:text-left">
          <h1 className="text-4xl font-extrabold tracking-tight text-text-primary sm:text-5xl md:text-6xl leading-tight">
            Stop guessing if <br /> they opened your file.
          </h1>
          <p className="text-lg text-text-secondary max-w-lg mx-auto lg:mx-0">
            TraceLink is a Digital Asset Intelligence Platform that helps you understand what happens after you share links, resumes, client proposals, and pitch decks.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent-blue px-6 py-3 font-semibold text-white transition-colors hover:bg-accent-blue-hover shadow-sm"
            >
              Start Sharing Free <ArrowRight className="h-4.5 w-4.5" />
            </Link>
            <a
              href="#features"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-surface px-6 py-3 font-semibold text-text-primary hover:bg-alternate"
            >
              Learn More
            </a>
          </div>
        </div>

        {/* Right dashboard mockup card */}
        <div className="rounded-xl border border-border bg-surface/75 backdrop-blur-md p-6 sm:p-8 shadow-card hover:shadow-card-hover transition-all duration-300 max-w-lg mx-auto lg:max-w-none w-full relative">
          {/* Subtle Ambient Radial Glow inside the card */}
          <div className="absolute -top-12 -right-12 h-48 w-48 rounded-full bg-accent-blue/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 h-48 w-48 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none" />

          {/* Header of Mockup Card */}
          <div className="flex items-center justify-between border-b border-divider pb-4 mb-5 relative z-10">
            <div className="flex gap-1.5">
              <span className="h-3 w-3 rounded-full bg-red-400/90" />
              <span className="h-3 w-3 rounded-full bg-amber-400/90" />
              <span className="h-3 w-3 rounded-full bg-green-400/90" />
            </div>
            {/* Live viewer badge (static) */}
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
              <span>LIVE READER TRACKING</span>
            </div>
          </div>

          <div className="space-y-5 relative z-10">
            {/* KPI grid mockup */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl bg-background/50 backdrop-blur-sm p-4 border border-border flex flex-col justify-between h-32 hover:border-accent-blue/30 hover:bg-background/80 transition-all">
                <div>
                  <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider">Clicks & Opens</span>
                  <p className="text-2xl font-extrabold text-text-primary mt-1">14,285</p>
                </div>
                {/* SVG Micro line chart */}
                <div className="w-full">
                  <svg className="w-full h-8" viewBox="0 0 120 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <linearGradient id="sparkline-grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--accent-blue)" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="var(--accent-blue)" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <path d="M0 25 C 10 23, 20 5, 30 8 C 40 12, 50 2, 60 5 C 70 8, 80 2, 90 4 C 100 6, 110 20, 120 22" stroke="var(--accent-blue)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M0 25 C 10 23, 20 5, 30 8 C 40 12, 50 2, 60 5 C 70 8, 80 2, 90 4 C 100 6, 110 20, 120 22 L 120 30 L 0 30 Z" fill="url(#sparkline-grad)" />
                  </svg>
                </div>
              </div>
              <div className="rounded-xl bg-background/50 backdrop-blur-sm p-4 border border-border flex flex-col justify-between h-32 hover:border-emerald-500/30 hover:bg-background/80 transition-all">
                <div>
                  <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider">Engagement Score</span>
                  <p className="text-2xl font-extrabold text-text-primary mt-1">82/100</p>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-analytics-green font-bold uppercase tracking-wider">
                  <span className="h-1.5 w-1.5 rounded-full bg-analytics-green" />
                  High Interest
                </div>
              </div>
            </div>

            {/* Document stats item mock */}
            <div className="rounded-xl border border-border bg-background/40 backdrop-blur-sm p-4 space-y-3.5 hover:border-accent-blue/30 transition-all relative overflow-hidden group">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-text-primary">PitchDeck_2026.pdf</span>
                <div className="flex gap-2 items-center">
                  <span className="rounded bg-analytics-green-light border border-analytics-green/10 text-analytics-green px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider">Coming Soon</span>
                  <span className="rounded bg-accent-blue-light text-accent-blue px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider">PDF</span>
                </div>
              </div>
              <div className="h-2 w-full bg-divider rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-accent-blue to-indigo-500 rounded-full" style={{ width: '82%' }} />
              </div>
              <div className="flex justify-between text-[10px] text-text-muted font-medium">
                <span>View duration: 1m 45s</span>
                <span>Scroll depth: 95% (Fully read)</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="border-t border-border bg-surface py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-text-primary">
              Built for depth. Designed for simplicity.
            </h2>
            <p className="text-sm text-text-secondary">
              TraceLink gives you comprehensive visitor-by-visitor engagement intelligence without the clutter of legacy web analytics.
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <div className="rounded-xl border border-border bg-card p-6 space-y-4 shadow-card hover:shadow-card-hover transition-all duration-300">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-accent-blue-light text-accent-blue">
                <MousePointerClick className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-text-primary">Link Tracking</h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                Shorten target links and track total clicks, unique visitors, browser distribution, and device classes on every redirection.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="rounded-xl border border-border bg-card p-6 space-y-4 shadow-card hover:shadow-card-hover transition-all duration-300">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-accent-blue-light text-accent-blue">
                <Eye className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-text-primary">File & Resume Pings</h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                Upload proposal PDFs or resumes. Monitor viewing durations and max scroll depths, and record pings to log reader engagement.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="rounded-xl border border-border bg-card p-6 space-y-4 shadow-card hover:shadow-card-hover transition-all duration-300">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-accent-blue-light text-accent-blue">
                <Award className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-text-primary">Smart Engagement Scoring</h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                Our engine automatically scores visits between 0 and 100 based on reading time, scroll ratios, and downloads.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="rounded-xl border border-border bg-card p-6 space-y-4 shadow-card hover:shadow-card-hover transition-all duration-300">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-accent-blue-light text-accent-blue">
                <Users className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-text-primary">Captured Lead Gates</h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                Enable email lock gates. Visitors must submit their name and corporate email before unlocking downloads or views.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="rounded-xl border border-border bg-card p-6 space-y-4 shadow-card hover:shadow-card-hover transition-all duration-300">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-accent-blue-light text-accent-blue">
                <QrCode className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-text-primary">Dynamic QR Codes</h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                Generate high-quality vector QR codes for every link. Automatically track scan counts and device metrics.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="rounded-xl border border-border bg-card p-6 space-y-4 shadow-card hover:shadow-card-hover transition-all duration-300">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-accent-blue-light text-accent-blue">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-text-primary">Enterprise Security</h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                Built-in JWT auth, cookie storage protection, rate limiting, and Helmet headers to keep metrics secure.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Solutions / Primary Users Section */}
      <section id="solutions" className="bg-background py-24 border-t border-border">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold tracking-tight text-text-primary">Solutions for every share</h2>
            <p className="text-sm text-text-secondary">Choose the workflow that matches how you connect.</p>
          </div>

          <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="bg-card rounded-xl p-6 border border-border shadow-card hover:shadow-card-hover transition-all duration-300 space-y-3">
              <h3 className="font-bold text-text-primary">Job Seekers</h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Track recruiters viewing your PDF resume, monitor reading time, and see if they download it.
              </p>
            </div>
            <div className="bg-card rounded-xl p-6 border border-border shadow-card hover:shadow-card-hover transition-all duration-300 space-y-3">
              <h3 className="font-bold text-text-primary">Freelancers</h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Send proposals with tracking. Know if the client opened the proposal and how much time they spent reviewing it.
              </p>
            </div>
            <div className="bg-card rounded-xl p-6 border border-border shadow-card hover:shadow-card-hover transition-all duration-300 space-y-3">
              <h3 className="font-bold text-text-primary">Startup Founders</h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Share your pitch deck with investors. Know exactly which slide captured their attention and when they forward it.
              </p>
            </div>
            <div className="bg-card rounded-xl p-6 border border-border shadow-card hover:shadow-card-hover transition-all duration-300 space-y-3">
              <h3 className="font-bold text-text-primary">Sales & Marketers</h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Distribute links across channels. Embed lead gates to grow your email lists and analyze campaign traffic sources.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="bg-surface py-24 border-t border-b border-border">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <div className="space-y-4 max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold tracking-tight text-text-primary">Simple, transparent pricing</h2>
            <p className="text-sm text-text-secondary">Start for free. No credit card required.</p>
          </div>

          <div className="mt-16 max-w-sm mx-auto rounded-2xl border border-border bg-card p-8 shadow-card hover:shadow-card-hover transition-all duration-300">
            <h3 className="text-lg font-bold text-text-primary">TraceLink Professional</h3>
            <p className="text-xs text-text-secondary mt-2">Everything you need for asset tracking.</p>
            <div className="mt-6 flex items-baseline justify-center gap-1">
              <span className="text-4xl font-extrabold tracking-tight text-text-primary">$0</span>
              <span className="text-sm font-semibold text-text-muted">/ month</span>
            </div>
            <p className="text-[10px] text-analytics-green mt-1 font-semibold">Free while in Beta</p>

            <ul className="mt-8 space-y-3.5 text-xs text-text-secondary text-left">
              <li className="flex items-center gap-2.5">
                <CheckCircle className="h-4 w-4 text-analytics-green shrink-0" />
                <span>Unlimited tracked links</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle className="h-4 w-4 text-analytics-green shrink-0" />
                <span>Document & Resume uploads</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle className="h-4 w-4 text-analytics-green shrink-0" />
                <span>Scroll depth & duration pings</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle className="h-4 w-4 text-analytics-green shrink-0" />
                <span>Smart engagement score metrics</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle className="h-4 w-4 text-analytics-green shrink-0" />
                <span>Lead capture email locks</span>
              </li>
            </ul>

            <Link
              href="/signup"
              className="mt-8 block w-full rounded-lg bg-accent-blue py-3 text-center text-sm font-semibold text-white hover:bg-accent-blue-hover shadow-sm"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-alternate dark:bg-card text-text-secondary border-t border-border py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-border">
            {/* Branding Column */}
            <div className="space-y-4">
              <div className="flex items-center">
                <img src="/logo.png" alt="TraceLink" className="h-8 w-auto object-contain dark:brightness-0 dark:invert" />
              </div>
              <p className="text-xs text-text-muted leading-relaxed max-w-[240px]">
                Digital Asset Intelligence Platform for tracking, analyzing, and scoring engagement on shared links and document attachments.
              </p>
            </div>

            {/* Product Column */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">Product</h4>
              <ul className="space-y-2.5 text-xs text-text-muted">
                <li><a href="#features" className="hover:text-text-primary transition-colors">Features</a></li>
                <li><a href="#solutions" className="hover:text-text-primary transition-colors">Solutions</a></li>
                <li><a href="#pricing" className="hover:text-text-primary transition-colors">Pricing</a></li>
                <li><Link href="/signup" className="hover:text-text-primary transition-colors">Sign Up</Link></li>
              </ul>
            </div>

            {/* Resources Column */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">Resources</h4>
              <ul className="space-y-2.5 text-xs text-text-muted">
                <li><span className="cursor-not-allowed opacity-50">Documentation</span></li>
                <li><span className="cursor-not-allowed opacity-50">Developer API</span></li>
                <li><span className="cursor-not-allowed opacity-50">System Status</span></li>
                <li><span className="cursor-not-allowed opacity-50">Security Trust</span></li>
              </ul>
            </div>

            {/* Legal Column */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">Legal</h4>
              <ul className="space-y-2.5 text-xs text-text-muted">
                <li><span className="cursor-not-allowed opacity-50">Privacy Policy</span></li>
                <li><span className="cursor-not-allowed opacity-50">Terms of Service</span></li>
                <li><span className="cursor-not-allowed opacity-50">GDPR Compliance</span></li>
                <li><span className="cursor-not-allowed opacity-50">Acceptable Use</span></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 flex justify-center">
            <p className="text-xs text-text-muted text-center">
              &copy; {new Date().getFullYear()} TraceLink.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
