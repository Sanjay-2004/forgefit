'use client';

import { BottomNav } from './bottom-nav';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface bg-gradient-mesh">
      <main className="pb-20 max-w-lg mx-auto">{children}</main>
      <BottomNav />
    </div>
  );
}
