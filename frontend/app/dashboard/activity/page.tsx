'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { useWebSocket } from '@/context/WebSocketContext';
import {
  Activity,
  BookOpen,
  TrendingUp,
  FolderKanban,
  Users,
  Repeat,
  Trash2,
  Search,
  Clock,
  Radio
} from 'lucide-react';

interface ActivityItem {
  id: string;
  user_id: string;
  action: string;
  details: string;
  metadata?: any;
  created_at: string;
}

export default function ActivityFeedPage() {
  const { isConnected, lastEvent } = useWebSocket();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchActivities = useCallback(async () => {
    try {
      const { data } = await api.get<ActivityItem[]>('/api/activity?limit=50');
      setActivities(data);
    } catch (err) {
      console.error('Failed to load activity log', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  useEffect(() => {
    if (lastEvent) {
      fetchActivities();
    }
  }, [lastEvent, fetchActivities]);

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'BOOK_ADDED':
        return <BookOpen className="w-4 h-4 text-amber-brand" />;
      case 'STATUS_CHANGED':
      case 'PROGRESS_UPDATED':
        return <TrendingUp className="w-4 h-4 text-emerald-400" />;
      case 'SHELF_CREATED':
      case 'SHELF_BOOK_ADDED':
      case 'SHELF_BOOK_REMOVED':
        return <FolderKanban className="w-4 h-4 text-blue-400" />;
      case 'SHELF_SHARED':
      case 'ROLE_CHANGED':
      case 'COLLABORATOR_REMOVED':
        return <Users className="w-4 h-4 text-purple-400" />;
      case 'BOOK_LENT':
      case 'BOOK_RETURNED':
        return <Repeat className="w-4 h-4 text-pink-400" />;
      case 'BOOK_DELETED':
      case 'SHELF_DELETED':
        return <Trash2 className="w-4 h-4 text-red-400" />;
      default:
        return <Activity className="w-4 h-4 text-amber-brand" />;
    }
  };

  const filteredActivities = activities.filter((a) =>
    a.details.toLowerCase().includes(search.toLowerCase()) ||
    a.action.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header with WebSocket Status indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Activity className="w-6 h-6 text-amber-brand" />
            <span>Activity Feed</span>
          </h1>
          <p className="text-xs text-slateText-secondary mt-1">
            Real-time audit log of reading progress, shelf shares, and book lending activities
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-background-surface/80 border border-slate-800 text-xs shrink-0 self-start sm:self-auto">
          <Radio className={`w-3.5 h-3.5 ${isConnected ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
          <span className="text-slate-300 font-semibold">
            {isConnected ? 'Real-Time WebSocket Sync Active' : 'Connecting WebSocket...'}
          </span>
        </div>
      </div>

      {/* Search Input */}
      <div className="glass-card p-4 rounded-2xl border border-slate-700/60">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search activity events..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-background-elevated/40 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-brand/50 text-xs"
          />
        </div>
      </div>

      {/* Timeline List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass-card p-4 rounded-xl border border-slate-800 animate-pulse h-16" />
          ))}
        </div>
      ) : filteredActivities.length === 0 ? (
        <div className="glass-card p-12 rounded-2xl border border-slate-800 text-center space-y-3">
          <Clock className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-sm font-semibold text-white">No activity logged yet</h3>
          <p className="text-xs text-slate-400">Your actions will show up in this timeline as you add books and manage shelves.</p>
        </div>
      ) : (
        <div className="relative border-l border-slate-800 ml-4 space-y-6 pl-6 py-2">
          {filteredActivities.map((act) => (
            <div key={act.id} className="relative group">
              {/* Dot Icon */}
              <div className="absolute -left-[35px] top-0 w-8 h-8 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center shadow-md group-hover:border-amber-brand transition-colors">
                {getActionIcon(act.action)}
              </div>

              {/* Content Box */}
              <div className="glass-card p-4 rounded-xl border border-slate-700/60 transition-all hover:border-slate-600">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-800 text-amber-brand border border-slate-700">
                    {act.action.replace('_', ' ')}
                  </span>
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-500" />
                    {new Date(act.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-xs font-semibold text-white mt-1.5 leading-relaxed">{act.details}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
