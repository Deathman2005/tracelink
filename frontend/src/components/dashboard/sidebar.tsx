'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from '../../hooks/use-auth';
import {
  LayoutDashboard,
  TrendingUp,
  Users,
  Link2,
  FileText,
  QrCode,
  Sparkles,
  Mail,
  Settings,
  CreditCard,
  LogOut,
  TrendingUp as LogoIcon,
} from 'lucide-react';

interface NavCategory {
  category: string;
  items: {
    name: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
  }[];
}

const navCategories: NavCategory[] = [
  {
    category: 'Analytics',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Traffic', href: '/dashboard?tab=traffic', icon: TrendingUp },
      { name: 'Visitors', href: '/dashboard?tab=visitors', icon: Users },
    ],
  },
  {
    category: 'Assets',
    items: [
      { name: 'Links', href: '/links', icon: Link2 },
      { name: 'Files', href: '/files', icon: FileText },
      { name: 'QR Codes', href: '/links?view=qr', icon: QrCode },
    ],
  },
  {
    category: 'Intelligence',
    items: [
      { name: 'Engagement', href: '/leads?view=engagement', icon: Sparkles },
      { name: 'Leads', href: '/leads', icon: Mail },
    ],
  },
  {
    category: 'Account',
    items: [
      { name: 'Settings', href: '/settings', icon: Settings },
      { name: 'Billing', href: '/settings?tab=billing', icon: CreditCard },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { logout, user } = useAuth();

  const isLinkActive = (href: string) => {
    const [basePath, queryStr] = href.split('?');
    if (pathname !== basePath) return false;

    if (queryStr) {
      const params = new URLSearchParams(queryStr);
      for (const [key, value] of params.entries()) {
        if (searchParams.get(key) !== value) return false;
      }
      return true;
    }

    if (basePath === '/dashboard') {
      return !searchParams.get('tab');
    }
    if (basePath === '/links') {
      return !searchParams.get('view');
    }
    if (basePath === '/leads') {
      return !searchParams.get('view');
    }
    if (basePath === '/settings') {
      return !searchParams.get('tab');
    }

    return true;
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-20 flex w-64 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-text">
      {/* Platform Branding */}
      <div className="flex h-16 items-center px-6 border-b border-divider">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-text-primary text-lg tracking-tight">
          <LogoIcon className="h-5.5 w-5.5 text-accent-blue shrink-0" />
          <span>TraceLink</span>
        </Link>
      </div>

      {/* Nav List grouped by category */}
      <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {navCategories.map((cat) => (
          <div key={cat.category} className="space-y-1.5">
            <span className="px-4 text-[10px] font-bold uppercase tracking-wider text-text-muted">
              {cat.category}
            </span>
            <ul className="space-y-0.5">
              {cat.items.map((item) => {
                const active = isLinkActive(item.href);
                const Icon = item.icon;

                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-3 rounded-lg px-4 py-2 text-xs font-semibold transition-colors ${
                        active
                          ? 'bg-sidebar-active text-sidebar-active-text'
                          : 'text-sidebar-text hover:bg-sidebar-hover hover:text-text-primary'
                      }`}
                    >
                      <Icon className={`h-4.5 w-4.5 shrink-0 ${active ? 'text-sidebar-active-text' : 'text-text-muted'}`} />
                      <span>{item.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* User profile information card */}
      <div className="border-t border-border p-4 bg-transparent">
        {user && (
          <div className="mb-3 flex items-center gap-3 px-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-light font-bold text-primary text-xs shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="truncate text-xs font-semibold text-text-primary leading-tight">{user.name}</span>
              <span className="truncate text-[10px] text-text-muted mt-0.5">{user.email}</span>
            </div>
          </div>
        )}
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-4 py-2 text-xs font-semibold transition-colors hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400"
        >
          <LogOut className="h-4.5 w-4.5 text-text-muted hover:text-red-600 dark:hover:text-red-400 shrink-0" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
