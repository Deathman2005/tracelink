import React from 'react';
import { LucideIcon } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendType?: 'positive' | 'negative' | 'neutral';
  subtitle?: string;
}

export default function KPICard({
  title,
  value,
  icon: Icon,
  trend,
  trendType = 'positive',
  subtitle = 'vs Last Month',
}: KPICardProps) {
  return (
    <div className="rounded-card border border-border bg-surface p-6 shadow-card transition-shadow duration-200 hover:shadow-card-hover">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">{title}</span>
        <div className="rounded-lg bg-primary-light p-2 text-primary">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="mt-4">
        <h3 className="text-3xl font-bold tracking-tight text-text-primary">{value}</h3>
        {trend && (
          <div className="mt-2 flex items-center gap-1.5 text-xs">
            <span
              className={`font-semibold ${
                trendType === 'positive'
                  ? 'text-analytics-green'
                  : trendType === 'negative'
                  ? 'text-danger'
                  : 'text-text-muted'
              }`}
            >
              {trend}
            </span>
            <span className="text-text-muted">{subtitle}</span>
          </div>
        )}
      </div>
    </div>
  );
}
