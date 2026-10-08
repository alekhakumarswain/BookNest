'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { BookOpen, LogOut, User as UserIcon, Bell, ChevronDown } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-background-surface/80 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Left Branding */}
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-amber-brand/10 border border-amber-brand/30 flex items-center justify-center text-amber-brand group-hover:scale-105 transition-transform shadow-md shadow-amber-brand/10">
            <BookOpen className="w-5 h-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white hidden sm:inline-block">
            Book<span className="text-amber-brand">Nest</span>
          </span>
        </Link>

        {/* Right User Controls */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-background-elevated/50 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-amber-brand/20 border border-amber-brand/40 text-amber-brand flex items-center justify-center font-bold text-xs">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="hidden md:block text-left">
                <div className="text-xs font-semibold text-white">{user?.name || 'User'}</div>
                <div className="text-[10px] text-slateText-secondary">{user?.email}</div>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>

            {/* User Dropdown */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-xl glass-card border border-slate-700/80 shadow-2xl py-1 z-50">
                <div className="px-4 py-2 border-b border-slate-800 text-xs md:hidden">
                  <div className="font-semibold text-white">{user?.name}</div>
                  <div className="text-slate-400 truncate">{user?.email}</div>
                </div>
                <button
                  onClick={logout}
                  className="w-full text-left px-4 py-2.5 text-xs text-red-400 hover:bg-red-500/10 flex items-center gap-2 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
