'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useWebSocket } from '@/context/WebSocketContext';
import {
  BookOpen,
  FolderKanban,
  Users,
  Repeat,
  Star,
  CheckCircle2,
  Plus,
  ArrowRight,
  TrendingUp,
  Activity,
  Award,
  Sparkles,
  Clock
} from 'lucide-react';

interface DashboardStats {
  total_books: number;
  status_counts: {
    'Want to Read': number;
    Reading: number;
    Finished: number;
  };
  finished_this_year: number;
  average_rating: number;
  largest_shelf?: { name: string; book_count: number } | null;
  books_lent_out: number;
  books_borrowed: number;
  shelves_shared_with_me: number;
}

interface ActivityItem {
  id: string;
  action: string;
  details: string;
  created_at: string;
}

export default function DashboardOverviewPage() {
  const { user } = useAuth();
  const { lastEvent } = useWebSocket();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    try {
      const [statsRes, activityRes] = await Promise.all([
        api.get<DashboardStats>('/api/dashboard/stats'),
        api.get<ActivityItem[]>('/api/activity?limit=5')
      ]);
      setStats(statsRes.data);
      setActivities(activityRes.data);
    } catch (err) {
      console.error('Failed to load dashboard stats', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    if (lastEvent) {
      fetchDashboardData();
    }
  }, [lastEvent, fetchDashboardData]);

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl glass-card p-6 sm:p-8 border border-slate-700/60 bg-gradient-to-r from-amber-brand/10 via-slate-900 to-amber-brand/5 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-brand/10 border border-amber-brand/30 text-amber-brand text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Personal Reading Nest</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Welcome back, <span className="text-amber-brand">{user?.name || 'Reader'}</span>!
            </h1>
            <p className="text-xs sm:text-sm text-slateText-secondary max-w-xl">
              Track your reading progress, organize custom shelves, share collections with friends, and manage book lendings in real-time.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              href="/dashboard/books"
              className="px-4 py-2.5 rounded-xl bg-amber-brand hover:bg-amber-hover text-slate-950 font-bold text-xs shadow-lg shadow-amber-brand/20 transition-all flex items-center gap-2 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add Book</span>
            </Link>
            <Link
              href="/dashboard/shelves"
              className="px-4 py-2.5 rounded-xl bg-background-elevated hover:bg-slate-700 border border-slate-700 text-white font-semibold text-xs transition-all flex items-center gap-2"
            >
              <FolderKanban className="w-4 h-4 text-amber-brand" />
              <span>New Shelf</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Metric Cards (6 Cards Grid) */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="glass-card p-6 rounded-2xl border border-slate-800 animate-pulse h-32" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1: Total Books */}
          <div className="glass-card p-6 rounded-2xl border border-slate-700/60 flex flex-col justify-between hover:border-slate-600 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Books</span>
              <div className="w-9 h-9 rounded-xl bg-amber-brand/10 border border-amber-brand/30 text-amber-brand flex items-center justify-center">
                <BookOpen className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-extrabold text-white">{stats?.total_books || 0}</div>
              <div className="flex items-center gap-2 mt-2 text-[10px] font-semibold text-slate-400">
                <span className="text-purple-400">{stats?.status_counts['Want to Read'] || 0} Want</span>
                <span>•</span>
                <span className="text-blue-400">{stats?.status_counts['Reading'] || 0} Reading</span>
                <span>•</span>
                <span className="text-emerald-400">{stats?.status_counts['Finished'] || 0} Finished</span>
              </div>
            </div>
          </div>

          {/* Card 2: Finished This Year */}
          <div className="glass-card p-6 rounded-2xl border border-slate-700/60 flex flex-col justify-between hover:border-slate-600 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Finished This Year</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                <Award className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-extrabold text-white">{stats?.finished_this_year || 0}</div>
              <p className="text-[11px] text-emerald-400 font-medium mt-1">Books completed in 2026</p>
            </div>
          </div>

          {/* Card 3: Average Rating */}
          <div className="glass-card p-6 rounded-2xl border border-slate-700/60 flex flex-col justify-between hover:border-slate-600 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Average Rating</span>
              <div className="w-9 h-9 rounded-xl bg-amber-brand/10 border border-amber-brand/30 text-amber-brand flex items-center justify-center">
                <Star className="w-5 h-5 fill-current" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-extrabold text-white">{stats?.average_rating ? `${stats.average_rating} / 5` : 'N/A'}</div>
              <p className="text-[11px] text-slate-400 mt-1">Average user score assigned</p>
            </div>
          </div>

          {/* Card 4: Largest Custom Shelf */}
          <div className="glass-card p-6 rounded-2xl border border-slate-700/60 flex flex-col justify-between hover:border-slate-600 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Largest Shelf</span>
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center">
                <FolderKanban className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-lg font-bold text-white truncate">
                {stats?.largest_shelf?.name || 'No shelves yet'}
              </div>
              <p className="text-[11px] text-blue-400 font-semibold mt-0.5">
                {stats?.largest_shelf ? `${stats.largest_shelf.book_count} books collected` : 'Create your first shelf'}
              </p>
            </div>
          </div>

          {/* Card 5: Books Lent Out */}
          <div className="glass-card p-6 rounded-2xl border border-slate-700/60 flex flex-col justify-between hover:border-slate-600 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Books Lent Out</span>
              <div className="w-9 h-9 rounded-xl bg-pink-500/10 border border-pink-500/30 text-pink-400 flex items-center justify-center">
                <Repeat className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-extrabold text-white">{stats?.books_lent_out || 0}</div>
              <p className="text-[11px] text-pink-400 font-semibold mt-1">
                {stats?.books_borrowed || 0} books borrowed from others
              </p>
            </div>
          </div>

          {/* Card 6: Shared With Me */}
          <div className="glass-card p-6 rounded-2xl border border-slate-700/60 flex flex-col justify-between hover:border-slate-600 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Shared Shelves</span>
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-extrabold text-white">{stats?.shelves_shared_with_me || 0}</div>
              <p className="text-[11px] text-purple-400 font-semibold mt-1">Shelves shared with your account</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Grid: Reading Stats Visualizer + Live Activity Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Reading Breakdown Visualizer */}
        <div className="lg:col-span-2 glass-card p-6 rounded-2xl border border-slate-700/60 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-amber-brand" />
              <span>Library Reading Progress Overview</span>
            </h3>
            <Link
              href="/dashboard/books"
              className="text-xs font-semibold text-amber-brand hover:text-amber-hover flex items-center gap-1"
            >
              <span>View All Books</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Visual Progress Bar Breakdown */}
          {stats && (
            <div className="space-y-4">
              <div className="w-full h-4 rounded-full bg-slate-800 flex overflow-hidden p-0.5 border border-slate-700">
                {stats.total_books > 0 ? (
                  <>
                    <div
                      style={{ width: `${(stats.status_counts['Finished'] / stats.total_books) * 100}%` }}
                      className="bg-emerald-400 h-full rounded-l-full"
                      title="Finished"
                    />
                    <div
                      style={{ width: `${(stats.status_counts['Reading'] / stats.total_books) * 100}%` }}
                      className="bg-blue-400 h-full"
                      title="Reading"
                    />
                    <div
                      style={{ width: `${(stats.status_counts['Want to Read'] / stats.total_books) * 100}%` }}
                      className="bg-purple-400 h-full rounded-r-full"
                      title="Want to Read"
                    />
                  </>
                ) : (
                  <div className="w-full bg-slate-800 h-full rounded-full" />
                )}
              </div>

              {/* Status Counters Legend */}
              <div className="grid grid-cols-3 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-background-elevated/40 border border-slate-800 text-center">
                  <div className="text-xs text-purple-400 font-semibold">Want to Read</div>
                  <div className="text-xl font-bold text-white mt-1">{stats.status_counts['Want to Read']}</div>
                </div>
                <div className="p-4 rounded-xl bg-background-elevated/40 border border-slate-800 text-center">
                  <div className="text-xs text-blue-400 font-semibold">Reading</div>
                  <div className="text-xl font-bold text-white mt-1">{stats.status_counts['Reading']}</div>
                </div>
                <div className="p-4 rounded-xl bg-background-elevated/40 border border-slate-800 text-center">
                  <div className="text-xs text-emerald-400 font-semibold">Finished</div>
                  <div className="text-xl font-bold text-white mt-1">{stats.status_counts['Finished']}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Col: Recent Activity Stream Widget */}
        <div className="glass-card p-6 rounded-2xl border border-slate-700/60 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber-brand" />
              <span>Live Activity Stream</span>
            </h3>
            <Link href="/dashboard/activity" className="text-[11px] text-amber-brand hover:underline font-medium">
              View Feed
            </Link>
          </div>

          <div className="flex-1 space-y-3">
            {activities.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-6 text-center">No recent activity.</p>
            ) : (
              activities.map((act) => (
                <div key={act.id} className="p-3 rounded-xl bg-background-elevated/30 border border-slate-800/80 space-y-1">
                  <p className="text-xs font-medium text-white line-clamp-2">{act.details}</p>
                  <div className="text-[10px] text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(act.created_at).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
