'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { useWebSocket } from '@/context/WebSocketContext';
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  Star,
  Pencil,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  X,
  Repeat,
  FolderPlus,
  Sparkles,
  LayoutGrid,
  Layers,
  RefreshCw
} from 'lucide-react';

interface Book {
  id: string;
  owner_id: string;
  title: string;
  author: string;
  status: 'Want to Read' | 'Reading' | 'Finished';
  total_pages: number;
  current_page: number;
  progress_percentage: number;
  rating?: number;
  notes?: string;
  finished_date?: string;
  created_at: string;
  updated_at: string;
  is_lent: boolean;
  lent_to?: { id: string; name: string; email: string };
}

interface Shelf {
  id: string;
  name: string;
  book_count: number;
  role: string;
}

interface PaginatedResponse {
  items: Book[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

// Preset spine gradient color generator based on string hash
const GRADIENTS = [
  { spine: 'from-amber-600 via-amber-700 to-amber-900 border-amber-400', cover: 'from-amber-500 via-orange-500 to-amber-600' },
  { spine: 'from-indigo-700 via-indigo-800 to-slate-900 border-indigo-400', cover: 'from-indigo-600 via-purple-600 to-blue-700' },
  { spine: 'from-sky-600 via-blue-700 to-sky-900 border-sky-400', cover: 'from-sky-500 via-blue-600 to-cyan-600' },
  { spine: 'from-emerald-700 via-teal-800 to-emerald-950 border-emerald-400', cover: 'from-emerald-600 via-teal-600 to-emerald-700' },
  { spine: 'from-rose-700 via-pink-800 to-rose-950 border-rose-400', cover: 'from-rose-500 via-pink-600 to-red-600' },
  { spine: 'from-violet-700 via-purple-800 to-indigo-950 border-violet-400', cover: 'from-violet-600 via-purple-700 to-indigo-800' },
  { spine: 'from-teal-700 via-emerald-800 to-teal-950 border-teal-400', cover: 'from-teal-600 via-emerald-700 to-cyan-800' },
  { spine: 'from-red-700 via-orange-800 to-red-900 border-orange-400', cover: 'from-orange-600 via-red-600 to-amber-700' }
];

function getBookGradients(idStr: string) {
  let hash = 0;
  for (let i = 0; i < idStr.length; i++) {
    hash = idStr.charCodeAt(i) + ((hash << 5) - hash);
  }
  const idx = Math.abs(hash) % GRADIENTS.length;
  return GRADIENTS[idx];
}

export default function BooksPage() {
  const { lastEvent } = useWebSocket();
  const [books, setBooks] = useState<Book[]>([]);
  const [allUserBooks, setAllUserBooks] = useState<Book[]>([]);
  const [userShelves, setUserShelves] = useState<Shelf[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // View Mode: 'bookshelf' or 'grid'
  const [viewMode, setViewMode] = useState<'bookshelf' | 'grid'>('bookshelf');

  // Controls
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Interactive Bookshelf state
  const [selectedSpineBook, setSelectedSpineBook] = useState<Book | null>(null);
  const [hoveredBookId, setHoveredBookId] = useState<string | null>(null);

  // Modals state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [progressModalOpen, setProgressModalOpen] = useState(false);
  const [lendModalOpen, setLendModalOpen] = useState(false);
  const [shelfModalOpen, setShelfModalOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    status: 'Want to Read',
    total_pages: 100,
    current_page: 0,
    rating: 0,
    notes: ''
  });
  const [borrowerEmail, setBorrowerEmail] = useState('');
  const [selectedShelfId, setSelectedShelfId] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Fetch Paginated Books API Call
  const fetchBooks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {
        page,
        limit: viewMode === 'bookshelf' ? 100 : 9,
        sort_by: sortBy,
        sort_order: sortOrder,
      };
      if (statusFilter !== 'All') params.status = statusFilter;
      if (search.trim()) params.search = search.trim();

      const { data } = await api.get<PaginatedResponse>('/api/books', { params });
      setBooks(data.items);
      setAllUserBooks(data.items);
      setTotalPages(data.total_pages);
      setTotalCount(data.total);

      if (data.items.length > 0 && !selectedSpineBook) {
        setSelectedSpineBook(data.items[0]);
      }
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to load books.';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search, sortBy, sortOrder, viewMode]);

  const fetchShelves = async () => {
    try {
      const { data } = await api.get<Shelf[]>('/api/shelves');
      setUserShelves(data);
    } catch (e) {
      console.error('Failed to load user shelves', e);
    }
  };

  useEffect(() => {
    fetchBooks();
    fetchShelves();
  }, [fetchBooks]);

  // Real-time event refetch trigger
  useEffect(() => {
    if (lastEvent) {
      fetchBooks();
      fetchShelves();
    }
  }, [lastEvent, fetchBooks]);

  // Handle Add Book
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.title.trim() || !formData.author.trim()) {
      setFormError('Title and author are required.');
      return;
    }
    if (formData.total_pages <= 0) {
      setFormError('Total pages must be greater than 0.');
      return;
    }
    if (formData.current_page > formData.total_pages) {
      setFormError(`Current page (${formData.current_page}) cannot exceed total pages (${formData.total_pages}).`);
      return;
    }

    setActionLoading(true);
    try {
      await api.post('/api/books', {
        title: formData.title,
        author: formData.author,
        status: formData.status,
        total_pages: Number(formData.total_pages),
        current_page: Number(formData.current_page),
        rating: formData.rating > 0 ? Number(formData.rating) : null,
        notes: formData.notes || null,
      });

      setAddModalOpen(false);
      resetForm();
      fetchBooks();
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to add book.';
      setFormError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Edit Book
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBook) return;
    setFormError(null);

    if (formData.current_page > formData.total_pages) {
      setFormError(`Current page (${formData.current_page}) cannot exceed total pages (${formData.total_pages}).`);
      return;
    }

    setActionLoading(true);
    try {
      await api.put(`/api/books/${selectedBook.id}`, {
        title: formData.title,
        author: formData.author,
        status: formData.status,
        total_pages: Number(formData.total_pages),
        current_page: Number(formData.current_page),
        rating: formData.rating > 0 ? Number(formData.rating) : null,
        notes: formData.notes || null,
      });

      setEditModalOpen(false);
      setSelectedBook(null);
      resetForm();
      fetchBooks();
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to update book.';
      setFormError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Progress Logger (PATCH endpoint)
  const handleProgressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBook) return;
    setFormError(null);

    if (formData.current_page < 0) {
      setFormError('Current page cannot be negative.');
      return;
    }
    if (formData.current_page > selectedBook.total_pages) {
      setFormError(`Current page cannot exceed total pages (${selectedBook.total_pages}).`);
      return;
    }

    setActionLoading(true);
    try {
      await api.patch(`/api/books/${selectedBook.id}/progress`, {
        current_page: Number(formData.current_page),
      });

      setProgressModalOpen(false);
      setSelectedBook(null);
      fetchBooks();
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to log reading progress.';
      setFormError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Lend Book Submit
  const handleLendSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBook) return;
    setFormError(null);

    if (!borrowerEmail.trim()) {
      setFormError('Borrower email is required.');
      return;
    }

    setActionLoading(true);
    try {
      await api.post('/api/lending', {
        book_id: selectedBook.id,
        borrower_email: borrowerEmail.trim()
      });

      setLendModalOpen(false);
      setSelectedBook(null);
      setBorrowerEmail('');
      fetchBooks();
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to lend book.';
      setFormError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Add Book to Shelf Submit
  const handleAddToShelfSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBook || !selectedShelfId) return;
    setFormError(null);
    setActionSuccess(null);

    setActionLoading(true);
    try {
      await api.post(`/api/shelves/${selectedShelfId}/books?book_id=${selectedBook.id}`);
      setActionSuccess('Book successfully added to custom shelf!');
      setTimeout(() => {
        setShelfModalOpen(false);
        setSelectedBook(null);
        setActionSuccess(null);
      }, 1000);
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to add book to shelf.';
      setFormError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Delete Book
  const handleDeleteBook = async (bookId: string) => {
    if (!confirm('Are you sure you want to delete this book? This will also clean it out of all custom shelves.')) return;
    try {
      await api.delete(`/api/books/${bookId}`);
      if (selectedSpineBook?.id === bookId) {
        setSelectedSpineBook(null);
      }
      fetchBooks();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to delete book.');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      author: '',
      status: 'Want to Read',
      total_pages: 100,
      current_page: 0,
      rating: 0,
      notes: ''
    });
    setFormError(null);
    setActionSuccess(null);
  };

  const openEditModal = (book: Book) => {
    setSelectedBook(book);
    setFormData({
      title: book.title,
      author: book.author,
      status: book.status,
      total_pages: book.total_pages,
      current_page: book.current_page,
      rating: book.rating || 0,
      notes: book.notes || ''
    });
    setFormError(null);
    setEditModalOpen(true);
  };

  const openProgressModal = (book: Book) => {
    setSelectedBook(book);
    setFormData((prev) => ({ ...prev, current_page: book.current_page }));
    setFormError(null);
    setProgressModalOpen(true);
  };

  const openLendModal = (book: Book) => {
    setSelectedBook(book);
    setBorrowerEmail('');
    setFormError(null);
    setLendModalOpen(true);
  };

  const openShelfModal = (book: Book) => {
    setSelectedBook(book);
    setSelectedShelfId(userShelves.length > 0 ? userShelves[0].id : '');
    setFormError(null);
    setActionSuccess(null);
    setShelfModalOpen(true);
  };

  // Categorize books by shelf tiers for 3D Bookshelf View
  const readingBooks = books.filter(b => b.status === 'Reading');
  const finishedBooks = books.filter(b => b.status === 'Finished');
  const wishlistBooks = books.filter(b => b.status === 'Want to Read');

  const bookshelfTiers = [
    { id: 'Reading', name: 'Top Tier: Currently Reading', icon: '📖', items: readingBooks },
    { id: 'Finished', name: 'Middle Tier: Completed Classics', icon: '🌟', items: finishedBooks },
    { id: 'Want to Read', name: 'Bottom Tier: Want to Read / Wishlist', icon: '🎯', items: wishlistBooks },
  ].filter(tier => statusFilter === 'All' || statusFilter === tier.id);

  return (
    <div className="space-y-6">
      {/* Header Title + Action Button + View Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <BookOpen className="w-6 h-6 text-amber-brand" />
            <span>My Reading Library</span>
          </h1>
          <p className="text-xs text-slateText-secondary mt-1">
            Manage your books, filter by status, track progress, and lend to friends ({totalCount} total books)
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="bg-background-elevated/40 border border-slate-700/80 p-1 rounded-xl flex items-center gap-1">
            <button
              onClick={() => setViewMode('bookshelf')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'bookshelf'
                  ? 'bg-amber-brand text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>3D Bookshelf</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'grid'
                  ? 'bg-amber-brand text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Grid Cards</span>
            </button>
          </div>

          <button
            onClick={() => {
              resetForm();
              setAddModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-amber-brand hover:bg-amber-hover text-slate-950 font-semibold text-xs transition-all shadow-lg shadow-amber-brand/20 flex items-center justify-center gap-2 shrink-0 active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Book</span>
          </button>
        </div>
      </div>

      {/* Controls Bar: Search, Status Filter, Sort Selector */}
      <div className="glass-card p-4 rounded-2xl border border-slate-700/60 flex flex-col md:flex-row gap-4 justify-between">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by title or author..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-background-elevated/40 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-brand/50 text-xs"
          />
        </div>

        <div className="flex items-center gap-3 overflow-x-auto pb-1 md:pb-0">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="py-2 px-3 rounded-xl bg-background-elevated/40 border border-slate-700 text-white text-xs focus:outline-none focus:ring-2 focus:ring-amber-brand/50"
            >
              <option value="All" className="bg-slate-900 text-white">All Statuses</option>
              <option value="Want to Read" className="bg-slate-900 text-white">Want to Read</option>
              <option value="Reading" className="bg-slate-900 text-white">Reading</option>
              <option value="Finished" className="bg-slate-900 text-white">Finished</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="py-2 px-3 rounded-xl bg-background-elevated/40 border border-slate-700 text-white text-xs focus:outline-none focus:ring-2 focus:ring-amber-brand/50"
            >
              <option value="created_at" className="bg-slate-900 text-white">Date Added</option>
              <option value="title" className="bg-slate-900 text-white">Title</option>
              <option value="rating" className="bg-slate-900 text-white">Rating</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-2.5 py-2 rounded-xl bg-background-elevated/40 border border-slate-700 text-white text-xs hover:bg-slate-700 transition-colors uppercase font-bold"
              title="Toggle Sort Direction"
            >
              {sortOrder}
            </button>
          </div>
        </div>
      </div>

      {/* Main View Area: 3D Interactive Bookshelf OR Grid View */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <div key={idx} className="glass-card p-5 rounded-2xl border border-slate-800 animate-pulse space-y-4">
              <div className="h-4 bg-slate-700/50 rounded w-3/4" />
              <div className="h-3 bg-slate-800 rounded w-1/2" />
              <div className="h-2 bg-slate-800 rounded w-full mt-4" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="glass-card p-8 rounded-2xl border border-red-500/30 text-center text-red-400 space-y-3">
          <AlertCircle className="w-8 h-8 mx-auto" />
          <p className="text-sm font-medium">{error}</p>
          <button
            onClick={fetchBooks}
            className="px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-xs font-semibold text-red-300 transition-colors"
          >
            Retry Loading
          </button>
        </div>
      ) : books.length === 0 ? (
        <div className="glass-card p-12 rounded-2xl border border-slate-800 text-center space-y-4">
          <BookOpen className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-lg font-semibold text-white">No books found</h3>
          <p className="text-xs text-slateText-secondary max-w-sm mx-auto">
            {search || statusFilter !== 'All'
              ? 'Try changing your search query or filter selection.'
              : 'Your library is empty. Click "Add New Book" to start tracking your reading collection!'}
          </p>
          <button
            onClick={() => {
              resetForm();
              setAddModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-amber-brand hover:bg-amber-hover text-slate-950 font-semibold text-xs transition-colors shadow-md"
          >
            Add Your First Book
          </button>
        </div>
      ) : viewMode === 'bookshelf' ? (
        /* INTERACTIVE 3D WOODEN BOOKSHELF VIEW */
        <div className="relative rounded-2xl bg-gradient-to-b from-amber-950/40 via-amber-900/20 to-amber-950/40 p-4 sm:p-6 border-2 border-amber-800/80 shadow-2xl space-y-6">
          {/* Wooden Cabinet Frames */}
          <div className="absolute top-0 bottom-0 left-0 w-3 bg-gradient-to-r from-amber-950 to-amber-900 rounded-l-2xl border-r border-amber-800" />
          <div className="absolute top-0 bottom-0 right-0 w-3 bg-gradient-to-l from-amber-950 to-amber-900 rounded-r-2xl border-l border-amber-800" />

          {bookshelfTiers.map((tier) => (
            <div key={tier.id} className="relative z-10">
              {/* Tier Header Banner */}
              <div className="flex items-center justify-between gap-2 mb-2 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-amber-500/30 text-xs">
                <div className="flex items-center gap-2 font-extrabold text-white">
                  <span>{tier.icon}</span>
                  <span className="text-amber-brand tracking-wide font-display text-xs sm:text-sm">{tier.name}</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-brand/10 text-amber-brand text-[10px] font-bold border border-amber-brand/30">
                  {tier.items.length} book{tier.items.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Wooden Rack Floor */}
              <div className="relative pt-3 pb-1 px-2">
                <div className="flex flex-row items-end justify-start gap-2.5 sm:gap-3.5 overflow-x-auto min-h-[140px] pb-2">
                  {tier.items.length === 0 ? (
                    <div className="text-xs text-slate-500 italic py-6 px-4">No books in this tier shelf.</div>
                  ) : (
                    tier.items.map((book) => {
                      const gradients = getBookGradients(book.id);
                      const isSelected = selectedSpineBook?.id === book.id;
                      const isHovered = hoveredBookId === book.id;

                      return (
                        <div
                          key={book.id}
                          onClick={() => setSelectedSpineBook(book)}
                          onMouseEnter={() => setHoveredBookId(book.id)}
                          onMouseLeave={() => setHoveredBookId(null)}
                          className={`group relative cursor-pointer perspective-1000 flex flex-col items-center shrink-0 transition-all duration-200 ${
                            isSelected ? '-translate-y-3 scale-105 z-30' : 'hover:-translate-y-2 z-10'
                          }`}
                        >
                          {/* Hover Spine Tooltip */}
                          <div className={`absolute -top-7 px-2 py-0.5 rounded-md bg-slate-900 text-white text-[9px] font-bold shadow-lg border border-amber-500/40 transition-all duration-150 pointer-events-none z-40 whitespace-nowrap ${
                            isHovered || isSelected ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'
                          }`}>
                            {book.title}
                          </div>

                          {/* 3D Vertical Book Spine Edge */}
                          <div className={`book-spine-3d relative w-8 sm:w-10 h-28 sm:h-32 rounded-t-sm rounded-b-2xs bg-gradient-to-b ${gradients.spine} text-white shadow-md border-x border-t border-white/20 flex flex-col items-center justify-between p-1.5 ${
                            isSelected ? 'ring-2 ring-amber-brand shadow-amber-brand/50 shadow-lg' : ''
                          }`}>
                            {/* Ribbon Marker */}
                            <div className="w-1.5 h-3 bg-amber-brand rounded-b-xs" />

                            {/* Rotated Vertical Title Text */}
                            <div className="my-auto py-1 flex items-center justify-center">
                              <span
                                className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-white/95 truncate font-display drop-shadow"
                                style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                              >
                                {book.title}
                              </span>
                            </div>

                            {/* Bottom Dot */}
                            <div className="flex items-center justify-center pt-0.5">
                              <span className={`w-2 h-2 rounded-full ${
                                book.status === 'Finished' ? 'bg-emerald-400' : book.status === 'Reading' ? 'bg-amber-brand animate-pulse' : 'bg-purple-400'
                              }`} />
                            </div>
                          </div>

                          {/* Shadow beneath book */}
                          <div className={`w-full h-1 bg-slate-950/50 rounded-full blur-xs transition-all duration-150 mt-1 ${
                            isHovered || isSelected ? 'scale-110 opacity-70' : 'opacity-30'
                          }`} />
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Heavy Wooden Plank Floor */}
                <div className="mt-1 h-3.5 w-full rounded-xs bg-gradient-to-r from-amber-950 via-amber-900 to-amber-950 shadow-md border-t border-amber-700 flex items-center justify-between px-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500/40" />
                  <div className="h-0.5 w-4/5 bg-amber-500/20 rounded-full" />
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500/40" />
                </div>
              </div>
            </div>
          ))}

          {/* Inspection Drawer for Selected Spine Book */}
          {selectedSpineBook && (
            <div className="mt-4 rounded-xl bg-slate-900/95 p-4 border-2 border-amber-500/60 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative animate-fadeIn">
              <button
                onClick={() => setSelectedSpineBook(null)}
                className="absolute top-3 right-3 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-4">
                <div className={`w-14 h-20 rounded-lg bg-gradient-to-br ${getBookGradients(selectedSpineBook.id).cover} p-2 text-white flex flex-col justify-between shadow-md shrink-0 border border-white/20`}>
                  <span className="text-[7px] font-black uppercase text-amber-200">{selectedSpineBook.status}</span>
                  <span className="text-[9px] font-extrabold line-clamp-2 leading-tight">{selectedSpineBook.title}</span>
                  <span className="text-[8px] font-bold text-amber-300">{selectedSpineBook.progress_percentage}%</span>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                      selectedSpineBook.status === 'Finished'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : selectedSpineBook.status === 'Reading'
                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                        : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                    }`}>
                      {selectedSpineBook.status}
                    </span>
                    {selectedSpineBook.rating && (
                      <span className="text-xs font-semibold text-amber-brand flex items-center gap-0.5">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        {selectedSpineBook.rating}/5
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-extrabold text-white mt-1">{selectedSpineBook.title}</h3>
                  <p className="text-xs text-slate-400">By {selectedSpineBook.author} • Page {selectedSpineBook.current_page} / {selectedSpineBook.total_pages}</p>
                  {selectedSpineBook.notes && (
                    <p className="text-xs text-slate-300 italic mt-1.5 line-clamp-1">"{selectedSpineBook.notes}"</p>
                  )}
                </div>
              </div>

              {/* Action Buttons inside Drawer */}
              <div className="flex flex-wrap items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800 w-full sm:w-auto">
                <button
                  onClick={() => openProgressModal(selectedSpineBook)}
                  className="py-1.5 px-3 rounded-lg bg-amber-brand text-slate-950 font-bold text-xs flex items-center gap-1 shadow-md hover:bg-amber-hover"
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Log Progress</span>
                </button>
                <button
                  onClick={() => openShelfModal(selectedSpineBook)}
                  className="py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium flex items-center gap-1 border border-slate-700"
                >
                  <FolderPlus className="w-3.5 h-3.5 text-amber-brand" />
                  <span>Add Shelf</span>
                </button>
                {!selectedSpineBook.is_lent && (
                  <button
                    onClick={() => openLendModal(selectedSpineBook)}
                    className="py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium flex items-center gap-1 border border-slate-700"
                  >
                    <Repeat className="w-3.5 h-3.5 text-pink-400" />
                    <span>Lend</span>
                  </button>
                )}
                <button
                  onClick={() => openEditModal(selectedSpineBook)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700"
                  title="Edit Book"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDeleteBook(selectedSpineBook.id)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-slate-700"
                  title="Delete Book"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* GRID CARDS VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {books.map((book) => (
            <div
              key={book.id}
              className="glass-card glass-card-hover p-5 rounded-2xl border border-slate-700/60 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span
                    className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full border ${
                      book.status === 'Finished'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : book.status === 'Reading'
                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                        : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                    }`}
                  >
                    {book.status}
                  </span>

                  {book.rating && (
                    <div className="flex items-center gap-0.5 text-amber-brand text-xs">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < book.rating! ? 'fill-current' : 'text-slate-700'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>

                <h3 className="font-bold text-white text-base leading-snug line-clamp-2">{book.title}</h3>
                <p className="text-xs text-slateText-secondary mt-1">by {book.author}</p>

                {book.notes && (
                  <p className="text-xs text-slate-400 italic mt-3 bg-background-elevated/30 p-2.5 rounded-lg border border-slate-800 line-clamp-2">
                    "{book.notes}"
                  </p>
                )}

                {book.is_lent && book.lent_to && (
                  <div className="mt-3 p-2 rounded-lg bg-pink-500/10 border border-pink-500/20 text-pink-300 text-xs flex items-center gap-1.5">
                    <Repeat className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">Lent to: <strong>{book.lent_to.name}</strong></span>
                  </div>
                )}
              </div>

              <div className="mt-5 pt-4 border-t border-slate-800/80 space-y-3">
                <div>
                  <div className="flex justify-between items-center text-xs text-slate-400 mb-1.5">
                    <span>Page {book.current_page} of {book.total_pages}</span>
                    <span className="font-semibold text-amber-brand">{book.progress_percentage}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-brand to-amber-300 rounded-full transition-all duration-300"
                      style={{ width: `${book.progress_percentage}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-1.5 pt-1">
                  <button
                    onClick={() => openProgressModal(book)}
                    className="flex-1 py-1.5 px-2 rounded-lg bg-background-elevated hover:bg-slate-700 border border-slate-700 text-white text-xs font-medium flex items-center justify-center gap-1 transition-colors"
                  >
                    <TrendingUp className="w-3.5 h-3.5 text-amber-brand" />
                    <span>Progress</span>
                  </button>

                  <button
                    onClick={() => openShelfModal(book)}
                    className="p-2 rounded-lg bg-background-elevated hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-amber-brand transition-colors"
                    title="Add to Shelf"
                  >
                    <FolderPlus className="w-3.5 h-3.5" />
                  </button>

                  {!book.is_lent && (
                    <button
                      onClick={() => openLendModal(book)}
                      className="p-2 rounded-lg bg-background-elevated hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-pink-400 transition-colors"
                      title="Lend Book"
                    >
                      <Repeat className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button
                    onClick={() => openEditModal(book)}
                    className="p-2 rounded-lg bg-background-elevated hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-colors"
                    title="Edit Book Details"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleDeleteBook(book.id)}
                    className="p-2 rounded-lg bg-background-elevated hover:bg-red-500/20 border border-slate-700 text-slate-400 hover:text-red-400 transition-colors"
                    title="Delete Book"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Footer (for Grid Mode) */}
      {viewMode === 'grid' && totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <span className="text-xs text-slateText-secondary">
            Showing Page <strong>{page}</strong> of <strong>{totalPages}</strong> ({totalCount} total books)
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-xl bg-background-elevated/40 border border-slate-700 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-700 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-xl bg-background-elevated/40 border border-slate-700 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-700 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Modal: Add Book */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="glass-card p-6 rounded-2xl max-w-md w-full border border-slate-700 shadow-2xl relative">
            <button
              onClick={() => setAddModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-amber-brand" />
              <span>Add Book to Library</span>
            </h2>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Book Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Dune"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background-elevated/50 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-amber-brand/50 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Author *
                </label>
                <input
                  type="text"
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  placeholder="e.g. Frank Herbert"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background-elevated/50 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-amber-brand/50 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-background-elevated/50 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-amber-brand/50 focus:outline-none"
                  >
                    <option value="Want to Read" className="bg-slate-900">Want to Read</option>
                    <option value="Reading" className="bg-slate-900">Reading</option>
                    <option value="Finished" className="bg-slate-900">Finished</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Rating (1-5)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="5"
                    value={formData.rating}
                    onChange={(e) => setFormData({ ...formData, rating: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-background-elevated/50 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-amber-brand/50 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Total Pages *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.total_pages}
                    onChange={(e) => setFormData({ ...formData, total_pages: Number(e.target.value) })}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-background-elevated/50 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-amber-brand/50 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Current Page
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.current_page}
                    onChange={(e) => setFormData({ ...formData, current_page: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-background-elevated/50 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-amber-brand/50 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Add your thoughts or summary..."
                  rows={2}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background-elevated/50 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-amber-brand/50 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-amber-brand hover:bg-amber-hover text-slate-950 font-semibold text-xs transition-all shadow-md flex items-center gap-1.5"
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Book'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Book */}
      {editModalOpen && selectedBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="glass-card p-6 rounded-2xl max-w-md w-full border border-slate-700 shadow-2xl relative">
            <button
              onClick={() => setEditModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Pencil className="w-5 h-5 text-amber-brand" />
              <span>Edit Book Details</span>
            </h2>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Book Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background-elevated/50 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-amber-brand/50 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Author *
                </label>
                <input
                  type="text"
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background-elevated/50 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-amber-brand/50 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-background-elevated/50 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-amber-brand/50 focus:outline-none"
                  >
                    <option value="Want to Read" className="bg-slate-900">Want to Read</option>
                    <option value="Reading" className="bg-slate-900">Reading</option>
                    <option value="Finished" className="bg-slate-900">Finished</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Rating (1-5)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="5"
                    value={formData.rating}
                    onChange={(e) => setFormData({ ...formData, rating: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-background-elevated/50 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-amber-brand/50 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Total Pages *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.total_pages}
                    onChange={(e) => setFormData({ ...formData, total_pages: Number(e.target.value) })}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-background-elevated/50 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-amber-brand/50 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Current Page
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.current_page}
                    onChange={(e) => setFormData({ ...formData, current_page: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-background-elevated/50 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-amber-brand/50 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background-elevated/50 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-amber-brand/50 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-amber-brand hover:bg-amber-hover text-slate-950 font-semibold text-xs transition-all shadow-md flex items-center gap-1.5"
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update Book'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Reading Progress Logger */}
      {progressModalOpen && selectedBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="glass-card p-6 rounded-2xl max-w-sm w-full border border-slate-700 shadow-2xl relative">
            <button
              onClick={() => setProgressModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-amber-brand" />
              <span>Log Reading Progress</span>
            </h2>

            <p className="text-xs text-slateText-secondary mb-4">
              Book: <strong className="text-white">{selectedBook.title}</strong> ({selectedBook.total_pages} total pages)
            </p>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleProgressSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Current Page Logged
                </label>
                <input
                  type="number"
                  min="0"
                  max={selectedBook.total_pages}
                  value={formData.current_page}
                  onChange={(e) => setFormData({ ...formData, current_page: Number(e.target.value) })}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background-elevated/50 border border-slate-700 text-white text-sm focus:ring-2 focus:ring-amber-brand/50 focus:outline-none"
                />
              </div>

              <div className="p-3 rounded-xl bg-background-elevated/30 border border-slate-800 text-xs flex justify-between items-center">
                <span className="text-slate-400">Updated Progress:</span>
                <span className="font-bold text-amber-brand text-sm">
                  {Math.round((formData.current_page / selectedBook.total_pages) * 100)}%
                </span>
              </div>

              {formData.current_page === selectedBook.total_pages && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>Status will automatically update to <strong>Finished</strong>!</span>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setProgressModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-amber-brand hover:bg-amber-hover text-slate-950 font-semibold text-xs transition-all shadow-md flex items-center gap-1.5"
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Progress'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Lend Book */}
      {lendModalOpen && selectedBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="glass-card p-6 rounded-2xl max-w-sm w-full border border-slate-700 shadow-2xl relative">
            <button
              onClick={() => setLendModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Repeat className="w-5 h-5 text-pink-400" />
              <span>Lend Book to Friend</span>
            </h2>

            <p className="text-xs text-slateText-secondary mb-4">
              Lending: <strong className="text-white">{selectedBook.title}</strong>
            </p>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleLendSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Borrower's User Email *
                </label>
                <input
                  type="email"
                  value={borrowerEmail}
                  onChange={(e) => setBorrowerEmail(e.target.value)}
                  placeholder="e.g. bob@example.com"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background-elevated/50 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-pink-500/50 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setLendModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-semibold text-xs transition-all shadow-md flex items-center gap-1.5"
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Lending'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add to Shelf */}
      {shelfModalOpen && selectedBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="glass-card p-6 rounded-2xl max-w-sm w-full border border-slate-700 shadow-2xl relative">
            <button
              onClick={() => setShelfModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <FolderPlus className="w-5 h-5 text-amber-brand" />
              <span>Add to Custom Shelf</span>
            </h2>

            <p className="text-xs text-slateText-secondary mb-4">
              Book: <strong className="text-white">{selectedBook.title}</strong>
            </p>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {actionSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{actionSuccess}</span>
              </div>
            )}

            {userShelves.length === 0 ? (
              <div className="text-center py-4 space-y-3">
                <p className="text-xs text-slate-400">You don't have any custom shelves created yet.</p>
                <a
                  href="/dashboard/shelves"
                  className="inline-block px-4 py-2 rounded-xl bg-amber-brand text-slate-950 font-bold text-xs"
                >
                  Go to Shelves Page
                </a>
              </div>
            ) : (
              <form onSubmit={handleAddToShelfSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Select Target Shelf *
                  </label>
                  <select
                    value={selectedShelfId}
                    onChange={(e) => setSelectedShelfId(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-background-elevated/50 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-amber-brand/50 focus:outline-none"
                  >
                    {userShelves.map((s) => (
                      <option key={s.id} value={s.id} className="bg-slate-900">
                        {s.name} ({s.book_count} books)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShelfModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-5 py-2 rounded-xl bg-amber-brand hover:bg-amber-hover text-slate-950 font-semibold text-xs transition-all shadow-md flex items-center gap-1.5"
                  >
                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add to Shelf'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
