'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { useWebSocket } from '@/context/WebSocketContext';
import {
  Users,
  BookOpen,
  Shield,
  Eye,
  Edit3,
  ChevronRight,
  AlertCircle,
  Plus,
  Trash2,
  X,
  Loader2,
  Lock
} from 'lucide-react';

interface Book {
  id: string;
  title: string;
  author: string;
  status: string;
  total_pages: number;
  current_page: number;
}

interface Shelf {
  id: string;
  owner_id: string;
  name: string;
  description?: string;
  book_count: number;
  created_at: string;
  updated_at: string;
  role: 'editor' | 'viewer';
  owner_info?: { id: string; name: string; email: string };
}

export default function SharedWithMePage() {
  const { lastEvent } = useWebSocket();
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedShelf, setSelectedShelf] = useState<Shelf | null>(null);
  const [shelfBooks, setShelfBooks] = useState<Book[]>([]);
  const [userBooks, setUserBooks] = useState<Book[]>([]);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [addBookModalOpen, setAddBookModalOpen] = useState(false);
  const [selectedBookToAdd, setSelectedBookToAdd] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchSharedShelves = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<Shelf[]>('/api/shelves/shared');
      setShelves(data);
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to load shared shelves.';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSharedShelves();
  }, [fetchSharedShelves]);

  useEffect(() => {
    if (lastEvent) {
      fetchSharedShelves();
      if (selectedShelf) {
        openShelfDetail(selectedShelf);
      }
    }
  }, [lastEvent]);

  const openShelfDetail = async (shelf: Shelf) => {
    setSelectedShelf(shelf);
    setDetailModalOpen(true);
    try {
      const { data } = await api.get(`/api/shelves/${shelf.id}`);
      setShelfBooks(data.books || []);
    } catch (err) {
      console.error('Failed to load shelf detail', err);
    }
  };

  const openAddBookModal = async () => {
    try {
      const { data } = await api.get('/api/books?limit=100');
      setUserBooks(data.items || []);
      if (data.items.length > 0) {
        setSelectedBookToAdd(data.items[0].id);
      }
      setAddBookModalOpen(true);
    } catch (err) {
      console.error('Failed to load user books', err);
    }
  };

  const handleAddBookToShelf = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShelf || !selectedBookToAdd) return;
    setActionLoading(true);
    setFormError(null);
    try {
      await api.post(`/api/shelves/${selectedShelf.id}/books?book_id=${selectedBookToAdd}`);
      setAddBookModalOpen(false);
      openShelfDetail(selectedShelf);
      fetchSharedShelves();
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to add book to shared shelf.';
      setFormError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveBook = async (bookId: string) => {
    if (!selectedShelf) return;
    try {
      await api.delete(`/api/shelves/${selectedShelf.id}/books/${bookId}`);
      openShelfDetail(selectedShelf);
      fetchSharedShelves();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to remove book.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
          <Users className="w-6 h-6 text-amber-brand" />
          <span>Shelves Shared with Me</span>
        </h1>
        <p className="text-xs text-slateText-secondary mt-1">
          Access shelves shared by other users on BookNest under Editor or Viewer permissions
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2].map((idx) => (
            <div key={idx} className="glass-card p-5 rounded-2xl border border-slate-800 animate-pulse space-y-4">
              <div className="h-4 bg-slate-700/50 rounded w-1/2" />
              <div className="h-3 bg-slate-800 rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="glass-card p-8 rounded-2xl border border-red-500/30 text-center text-red-400 space-y-3">
          <AlertCircle className="w-8 h-8 mx-auto" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      ) : shelves.length === 0 ? (
        <div className="glass-card p-12 rounded-2xl border border-slate-800 text-center space-y-4">
          <Users className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-lg font-semibold text-white">No shared shelves</h3>
          <p className="text-xs text-slateText-secondary max-w-sm mx-auto">
            When other users share custom shelves with your email, they will appear right here!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {shelves.map((shelf) => (
            <div
              key={shelf.id}
              className="glass-card glass-card-hover p-5 rounded-2xl border border-slate-700/60 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="text-[10px] text-slate-400">
                    Owner: <strong className="text-white">{shelf.owner_info?.name || 'Unknown'}</strong>
                  </div>

                  <span
                    className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${
                      shelf.role === 'editor'
                        ? 'bg-amber-brand/10 text-amber-brand border-amber-brand/30'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {shelf.role === 'editor' ? <Edit3 className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    <span>{shelf.role}</span>
                  </span>
                </div>

                <h3 className="font-bold text-white text-base leading-snug">{shelf.name}</h3>
                {shelf.description && (
                  <p className="text-xs text-slateText-secondary mt-1 line-clamp-2">{shelf.description}</p>
                )}

                <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                    <strong className="text-white">{shelf.book_count}</strong> books inside
                  </span>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between gap-2">
                <button
                  onClick={() => openShelfDetail(shelf)}
                  className="flex-1 py-2 px-3 rounded-xl bg-background-elevated hover:bg-slate-700 border border-slate-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span>Explore Shelf</span>
                  <ChevronRight className="w-3.5 h-3.5 text-amber-brand" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Shared Shelf Detail */}
      {detailModalOpen && selectedShelf && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="glass-card p-6 rounded-2xl max-w-2xl w-full border border-slate-700 shadow-2xl relative max-h-[90vh] flex flex-col">
            <button
              onClick={() => {
                setDetailModalOpen(false);
                setSelectedShelf(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-4">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border flex items-center gap-1 ${
                    selectedShelf.role === 'editor'
                      ? 'bg-amber-brand/10 text-amber-brand border-amber-brand/30'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {selectedShelf.role === 'editor' ? <Edit3 className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  <span>Assigned Role: {selectedShelf.role.toUpperCase()}</span>
                </span>
              </div>
              <h2 className="text-xl font-bold text-white">{selectedShelf.name}</h2>
              <p className="text-xs text-slate-400 mt-1">
                Shared by: <strong className="text-white">{selectedShelf.owner_info?.name}</strong> ({selectedShelf.owner_info?.email})
              </p>
            </div>

            {selectedShelf.role === 'viewer' && (
              <div className="mb-4 p-3 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-slate-300 flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-brand shrink-0" />
                <span>You have <strong>Viewer Access</strong> to this shelf. You can view shelf books but cannot add or remove items.</span>
              </div>
            )}

            <div className="flex items-center justify-between py-2 border-y border-slate-800 mb-4">
              <span className="text-xs text-slate-400">
                Books in shelf: <strong className="text-white">{shelfBooks.length}</strong>
              </span>

              {selectedShelf.role === 'editor' && (
                <button
                  onClick={openAddBookModal}
                  className="px-3 py-1.5 rounded-lg bg-amber-brand hover:bg-amber-hover text-slate-950 text-xs font-semibold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Book to Shelf</span>
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {shelfBooks.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">
                  No books inside this shared shelf.
                </div>
              ) : (
                shelfBooks.map((book) => (
                  <div
                    key={book.id}
                    className="p-3.5 rounded-xl bg-background-elevated/40 border border-slate-800 flex items-center justify-between gap-4"
                  >
                    <div>
                      <h4 className="font-bold text-white text-xs">{book.title}</h4>
                      <p className="text-[11px] text-slate-400">by {book.author}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold">
                        {book.status}
                      </span>

                      {selectedShelf.role === 'editor' && (
                        <button
                          onClick={() => handleRemoveBook(book.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Remove from Shelf"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add Book to Shared Shelf (Editors only) */}
      {addBookModalOpen && selectedShelf && selectedShelf.role === 'editor' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="glass-card p-6 rounded-2xl max-w-sm w-full border border-slate-700 shadow-2xl relative">
            <button
              onClick={() => setAddBookModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Plus className="w-5 h-5 text-amber-brand" />
              <span>Add Book to Shared Shelf</span>
            </h2>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400">
                {formError}
              </div>
            )}

            <form onSubmit={handleAddBookToShelf} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Select Book from Your Library
                </label>
                <select
                  value={selectedBookToAdd}
                  onChange={(e) => setSelectedBookToAdd(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background-elevated/50 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-amber-brand/50 focus:outline-none"
                >
                  {userBooks.map((b) => (
                    <option key={b.id} value={b.id} className="bg-slate-900">
                      {b.title} ({b.author})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAddBookModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-amber-brand text-slate-950 font-semibold text-xs shadow-md"
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add Book'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
