'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/use-auth';
import Sidebar from '../../components/dashboard/sidebar';
import Header from '../../components/dashboard/header';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Keep screen locked during active verification
  if (loading || !user) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar Layout */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile Drawer Navigation */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-30 lg:hidden">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs"
            onClick={() => setIsMobileOpen(false)}
          />
          <div className="relative w-64 h-full">
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main Container Wrapper */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        <Header onMenuToggle={() => setIsMobileOpen(!isMobileOpen)} isMobileOpen={isMobileOpen} />
        <main className="flex-1 px-6 py-8 max-w-[1440px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
