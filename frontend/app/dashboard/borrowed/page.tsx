'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { useWebSocket } from '@/context/WebSocketContext';
import {
  Repeat,
  BookOpen,
  User,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRightLeft
} from 'lucide-react';

interface BorrowedUser {
  id: string;
  name: string;
  email: string;
}

interface LendingItem {
  id: string;
  book_id: string;
  lender: BorrowedUser;
  borrower: BorrowedUser;
  book_title: string;
  book_author: string;
  borrowed_at: string;
}

export default function BorrowedBooksPage() {
  const { lastEvent } = useWebSocket();
  const [activeTab, setActiveTab] = useState<'borrowed' | 'lent'>('borrowed');
  const [borrowedBooks, setBorrowedBooks] = useState<LendingItem[]>([]);
  const [lentBooks, setLentBooks] = useState<LendingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchLendingData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [borrowedRes, lentRes] = await Promise.all([
        api.get<LendingItem[]>('/api/lending/borrowed'),
        api.get<LendingItem[]>('/api/lending/lent')
      ]);
      setBorrowedBooks(borrowedRes.data);
      setLentBooks(lentRes.data);
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to load lending data.';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLendingData();
  }, [fetchLendingData]);

  useEffect(() => {
    if (lastEvent) {
      fetchLendingData();
    }
  }, [lastEvent, fetchLendingData]);

  const handleReturnBook = async (lendingId: string) => {
    setActionLoading(lendingId);
    try {
      await api.post(`/api/lending/${lendingId}/return`);
      fetchLendingData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to mark book as returned.');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
          <Repeat className="w-6 h-6 text-pink-400" />
          <span>Book Lending Center</span>
        </h1>
        <p className="text-xs text-slateText-secondary mt-1">
          Track books you've borrowed from other readers and books you've lent out
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('borrowed')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors ${
            activeTab === 'borrowed'
              ? 'bg-amber-brand/10 border border-amber-brand/30 text-amber-brand'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
          }`}
        >
          <span>Borrowed from Others</span>
          <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px]">
            {borrowedBooks.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('lent')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors ${
            activeTab === 'lent'
              ? 'bg-pink-500/10 border border-pink-500/30 text-pink-400'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
          }`}
        >
          <span>Lent Out by Me</span>
          <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px]">
            {lentBooks.length}
          </span>
        </button>
      </div>

      {/* Tab Content */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="glass-card p-5 rounded-2xl border border-slate-800 animate-pulse h-20" />
          ))}
        </div>
      ) : error ? (
        <div className="glass-card p-8 rounded-2xl border border-red-500/30 text-center text-red-400 space-y-3">
          <AlertCircle className="w-8 h-8 mx-auto" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      ) : activeTab === 'borrowed' ? (
        borrowedBooks.length === 0 ? (
          <div className="glass-card p-12 rounded-2xl border border-slate-800 text-center space-y-4">
            <Repeat className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-lg font-semibold text-white">No borrowed books</h3>
            <p className="text-xs text-slateText-secondary max-w-sm mx-auto">
              You aren't currently borrowing any books from other platform users.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {borrowedBooks.map((item) => (
              <div
                key={item.id}
                className="glass-card p-5 rounded-2xl border border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/30 text-blue-400">
                    Active Borrowing
                  </span>
                  <h3 className="font-bold text-white text-base leading-snug">{item.book_title}</h3>
                  <p className="text-xs text-slate-400">by {item.book_author}</p>
                  <div className="flex items-center gap-4 text-xs text-slate-400 pt-2">
                    <span className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-amber-brand" />
                      Lender: <strong className="text-white">{item.lender.name}</strong> ({item.lender.email})
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      Borrowed on {new Date(item.borrowed_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="shrink-0">
                  <button
                    onClick={() => handleReturnBook(item.id)}
                    disabled={actionLoading === item.id}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-emerald-500/20 border border-slate-700 hover:border-emerald-500/40 text-slate-300 hover:text-emerald-300 text-xs font-semibold transition-colors flex items-center gap-1.5"
                  >
                    {actionLoading === item.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Return Book</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        lentBooks.length === 0 ? (
          <div className="glass-card p-12 rounded-2xl border border-slate-800 text-center space-y-4">
            <Repeat className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-lg font-semibold text-white">No books lent out</h3>
            <p className="text-xs text-slateText-secondary max-w-sm mx-auto">
              You haven't lent any books from your library yet. Visit "My Library" to lend a book to a friend by email!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {lentBooks.map((item) => (
              <div
                key={item.id}
                className="glass-card p-5 rounded-2xl border border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-pink-500/10 border border-pink-500/30 text-pink-400">
                    Lent to Reader
                  </span>
                  <h3 className="font-bold text-white text-base leading-snug">{item.book_title}</h3>
                  <p className="text-xs text-slate-400">by {item.book_author}</p>
                  <div className="flex items-center gap-4 text-xs text-slate-400 pt-2">
                    <span className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-pink-400" />
                      Borrower: <strong className="text-white">{item.borrower.name}</strong> ({item.borrower.email})
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      Lent on {new Date(item.borrowed_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="shrink-0">
                  <button
                    onClick={() => handleReturnBook(item.id)}
                    disabled={actionLoading === item.id}
                    className="px-4 py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-md"
                  >
                    {actionLoading === item.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Mark as Returned</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
