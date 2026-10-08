'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Library,
  FolderKanban,
  Users,
  Repeat,
  Activity
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'My Library', href: '/dashboard/books', icon: Library },
  { name: 'Custom Shelves', href: '/dashboard/shelves', icon: FolderKanban },
  { name: 'Shared with Me', href: '/dashboard/shared', icon: Users },
  { name: 'Borrowed Books', href: '/dashboard/borrowed', icon: Repeat },
  { name: 'Activity Feed', href: '/dashboard/activity', icon: Activity },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-background-surface/40 border-r border-slate-800 shrink-0 hidden md:block sticky top-[61px] h-[calc(100vh-61px)] overflow-y-auto p-4">
      <nav className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-amber-brand/10 border border-amber-brand/30 text-amber-brand shadow-sm shadow-amber-brand/10'
                  : 'text-slateText-secondary hover:text-white hover:bg-background-elevated/40'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-amber-brand' : 'text-slate-400'}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
