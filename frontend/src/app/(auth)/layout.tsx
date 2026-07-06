import React from 'react';
import { Sparkles, TrendingUp } from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-screen bg-background">
      {/* Branding Sidebar Pane (Left side) - Desktop only */}
      <div className="hidden w-1/2 flex-col justify-between bg-alternate dark:bg-card p-12 text-text-secondary lg:flex border-r border-border">
        {/* Top Logo */}
        <div className="flex items-center">
          <img src="/logo.png" alt="TraceLink" className="h-9 w-auto object-contain dark:brightness-0 dark:invert" />
        </div>

        {/* Value Proposition Hero */}
        <div className="space-y-6">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-accent-blue-light/10 px-3.5 py-1.5 text-xs font-semibold text-accent-blue">
            <span>Digital Asset Intelligence Platform</span>
          </div>
          <h2 className="text-4xl font-extrabold tracking-tight leading-tight text-text-primary">
            Know exactly what happens <br /> after you press share.
          </h2>
          <p className="text-lg text-text-muted max-w-md">
            Understand document views, capture leads, monitor scrolling behavior, and compute engagement scores for shared documents, resumes, and portfolios.
          </p>
        </div>

        {/* Footer info */}
        <div className="text-xs text-text-muted">
          &copy; {new Date().getFullYear()} TraceLink Inc. All rights reserved.
        </div>
      </div>

      {/* Main Content Pane (Right side) - Centered on Mobile */}
      <div className="flex w-full items-center justify-center p-8 lg:w-1/2">
        <div className="w-full max-w-md rounded-card border border-border bg-surface p-10 shadow-card">
          {children}
        </div>
      </div>
    </div>
  );
}
