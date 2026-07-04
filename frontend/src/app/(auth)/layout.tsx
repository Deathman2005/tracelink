import React from 'react';
import { Sparkles, TrendingUp } from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-screen bg-background">
      {/* Branding Sidebar Pane (Left side) - Desktop only */}
      <div className="hidden w-1/2 flex-col justify-between bg-primary p-12 text-primary-light lg:flex border-r border-border">
        {/* Top Logo */}
        <div className="flex items-center gap-2 text-xl font-bold text-white">
          <TrendingUp className="h-7 w-7 text-accent-blue" />
          <span>TraceLink</span>
        </div>

        {/* Value Proposition Hero */}
        <div className="space-y-6">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-accent-blue-light/10 px-3.5 py-1.5 text-xs font-semibold text-accent-blue">
            <Sparkles className="h-3.5 w-3.5 text-accent-blue" />
            <span>Digital Asset Intelligence Platform</span>
          </div>
          <h2 className="text-4xl font-extrabold tracking-tight leading-tight text-white">
            Know exactly what happens <br /> after you press share.
          </h2>
          <p className="text-lg text-text-muted max-w-md">
            Understand document views, capture leads, monitor scrolling behavior, and compute engagement scores for shared documents, resumes, and portfolios.
          </p>
        </div>

        {/* Footer info */}
        <div className="text-xs text-text-disabled">
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
