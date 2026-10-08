'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { BookOpen, Star, Sparkles, CheckCircle2, Bookmark, Clock, ArrowRight, Eye, RefreshCw, Lock, Globe, Layers, ShieldCheck, X } from 'lucide-react';

interface BookItem {
  id: string;
  title: string;
  author: string;
  category: string;
  progress: number; // 0 to 100
  totalPages: number;
  readPages: number;
  rating: number;
  coverGradient: string;
  spineGradient: string;
  shelfTier: 'Reading' | 'Completed' | 'Wishlist';
  tag: string;
  isPublic: boolean;
  spineWidth: string;
  spineHeight: string;
}

const SHELVES: { id: 'Reading' | 'Completed' | 'Wishlist'; name: string; icon: string; isPublic: boolean }[] = [
  {
    id: 'Reading',
    name: 'Top Tier: Active Reading Progress',
    icon: '📖',
    isPublic: true
  },
  {
    id: 'Completed',
    name: 'Middle Tier: Public Favorites & Completed',
    icon: '🌟',
    isPublic: true
  },
  {
    id: 'Wishlist',
    name: 'Bottom Tier: Public Wishlist & Queued',
    icon: '🎯',
    isPublic: true
  }
];

const BOOKS: BookItem[] = [
  // Top Shelf - Reading (Compact Screen-Fit Spine Edge View)
  {
    id: '1',
    title: 'Atomic Habits',
    author: 'James Clear',
    category: 'Self-Improvement',
    progress: 78,
    totalPages: 320,
    readPages: 250,
    rating: 4.9,
    coverGradient: 'from-amber-500 via-orange-500 to-amber-600',
    spineGradient: 'from-amber-600 via-amber-700 to-amber-800 border-amber-400',
    shelfTier: 'Reading',
    tag: 'Daily Habit ⚡',
    isPublic: true,
    spineWidth: 'w-7 sm:w-8',
    spineHeight: 'h-24 sm:h-28'
  },
  {
    id: '2',
    title: 'Dune: Part One',
    author: 'Frank Herbert',
    category: 'Sci-Fi Epic',
    progress: 42,
    totalPages: 680,
    readPages: 285,
    rating: 4.8,
    coverGradient: 'from-indigo-600 via-purple-600 to-blue-700',
    spineGradient: 'from-indigo-700 via-indigo-800 to-slate-900 border-indigo-400',
    shelfTier: 'Reading',
    tag: 'Shared Club 👥',
    isPublic: true,
    spineWidth: 'w-8 sm:w-9',
    spineHeight: 'h-26 sm:h-30'
  },
  {
    id: '5',
    title: 'Project Hail Mary',
    author: 'Andy Weir',
    category: 'Sci-Fi',
    progress: 15,
    totalPages: 496,
    readPages: 75,
    rating: 4.9,
    coverGradient: 'from-sky-500 via-blue-600 to-cyan-600',
    spineGradient: 'from-sky-600 via-blue-700 to-sky-900 border-sky-400',
    shelfTier: 'Reading',
    tag: 'Public Access 🌐',
    isPublic: true,
    spineWidth: 'w-7.5 sm:w-8.5',
    spineHeight: 'h-25 sm:h-29'
  },
  {
    id: '10',
    title: 'Steve Jobs',
    author: 'Walter Isaacson',
    category: 'Biography',
    progress: 60,
    totalPages: 656,
    readPages: 393,
    rating: 4.9,
    coverGradient: 'from-slate-700 via-slate-800 to-slate-900',
    spineGradient: 'from-slate-800 via-slate-900 to-black border-slate-500',
    shelfTier: 'Reading',
    tag: 'Public Access 🌐',
    isPublic: true,
    spineWidth: 'w-8 sm:w-9',
    spineHeight: 'h-26 sm:h-30'
  },
  {
    id: '11',
    title: 'Deep Work',
    author: 'Cal Newport',
    category: 'Productivity',
    progress: 88,
    totalPages: 304,
    readPages: 267,
    rating: 4.8,
    coverGradient: 'from-orange-600 via-red-600 to-amber-700',
    spineGradient: 'from-red-700 via-orange-800 to-red-900 border-orange-400',
    shelfTier: 'Reading',
    tag: 'Currently Reading',
    isPublic: true,
    spineWidth: 'w-7 sm:w-8',
    spineHeight: 'h-24 sm:h-28'
  },

  // Middle Shelf - Completed
  {
    id: '3',
    title: 'The Psychology of Money',
    author: 'Morgan Housel',
    category: 'Finance',
    progress: 100,
    totalPages: 256,
    readPages: 256,
    rating: 5.0,
    coverGradient: 'from-emerald-600 via-teal-600 to-emerald-700',
    spineGradient: 'from-emerald-700 via-teal-800 to-emerald-950 border-emerald-400',
    shelfTier: 'Completed',
    tag: '5 ★ Favorite',
    isPublic: true,
    spineWidth: 'w-7 sm:w-8',
    spineHeight: 'h-24 sm:h-28'
  },
  {
    id: '4',
    title: 'Design Systems Handbook',
    author: 'Marco Suarez',
    category: 'UI/UX & Tech',
    progress: 100,
    totalPages: 190,
    readPages: 190,
    rating: 4.7,
    coverGradient: 'from-rose-500 via-pink-600 to-red-600',
    spineGradient: 'from-rose-700 via-pink-800 to-rose-950 border-rose-400',
    shelfTier: 'Completed',
    tag: 'Lent Out 📖',
    isPublic: true,
    spineWidth: 'w-6.5 sm:w-7.5',
    spineHeight: 'h-23 sm:h-27'
  },
  {
    id: '7',
    title: 'Thinking, Fast and Slow',
    author: 'Daniel Kahneman',
    category: 'Psychology',
    progress: 100,
    totalPages: 499,
    readPages: 499,
    rating: 4.8,
    coverGradient: 'from-amber-600 via-yellow-600 to-amber-700',
    spineGradient: 'from-amber-700 via-yellow-800 to-amber-950 border-yellow-400',
    shelfTier: 'Completed',
    tag: 'Public Review 🌐',
    isPublic: true,
    spineWidth: 'w-8 sm:w-9',
    spineHeight: 'h-26 sm:h-30'
  },
  {
    id: '12',
    title: 'Sapiens: A Brief History',
    author: 'Yuval Noah Harari',
    category: 'History',
    progress: 100,
    totalPages: 443,
    readPages: 443,
    rating: 4.9,
    coverGradient: 'from-yellow-600 via-amber-600 to-orange-700',
    spineGradient: 'from-amber-800 via-yellow-900 to-amber-950 border-yellow-500',
    shelfTier: 'Completed',
    tag: 'Masterpiece 🏆',
    isPublic: true,
    spineWidth: 'w-8 sm:w-9',
    spineHeight: 'h-26 sm:h-30'
  },
  {
    id: '13',
    title: 'Zero to One',
    author: 'Peter Thiel',
    category: 'Startup',
    progress: 100,
    totalPages: 224,
    readPages: 224,
    rating: 4.7,
    coverGradient: 'from-blue-600 via-indigo-600 to-blue-700',
    spineGradient: 'from-blue-700 via-indigo-800 to-slate-900 border-blue-400',
    shelfTier: 'Completed',
    tag: 'Finished',
    isPublic: true,
    spineWidth: 'w-6.5 sm:w-7.5',
    spineHeight: 'h-23 sm:h-27'
  },

  // Bottom Shelf - Wishlist
  {
    id: '6',
    title: 'Klara and the Sun',
    author: 'Kazuo Ishiguro',
    category: 'Literary Fiction',
    progress: 0,
    totalPages: 320,
    readPages: 0,
    rating: 4.6,
    coverGradient: 'from-violet-600 via-purple-700 to-indigo-800',
    spineGradient: 'from-violet-700 via-purple-800 to-indigo-950 border-violet-400',
    shelfTier: 'Wishlist',
    tag: 'Queued Next 🎯',
    isPublic: true,
    spineWidth: 'w-7 sm:w-8',
    spineHeight: 'h-24 sm:h-28'
  },
  {
    id: '8',
    title: 'Clean Code',
    author: 'Robert C. Martin',
    category: 'Engineering',
    progress: 0,
    totalPages: 464,
    readPages: 0,
    rating: 4.7,
    coverGradient: 'from-teal-600 via-emerald-700 to-cyan-800',
    spineGradient: 'from-teal-700 via-emerald-800 to-teal-950 border-teal-400',
    shelfTier: 'Wishlist',
    tag: 'Club Pick 👥',
    isPublic: true,
    spineWidth: 'w-8 sm:w-9',
    spineHeight: 'h-26 sm:h-30'
  },
  {
    id: '9',
    title: 'The Lean Startup',
    author: 'Eric Ries',
    category: 'Business',
    progress: 0,
    totalPages: 336,
    readPages: 0,
    rating: 4.5,
    coverGradient: 'from-blue-600 via-indigo-700 to-blue-800',
    spineGradient: 'from-blue-700 via-indigo-800 to-blue-950 border-blue-400',
    shelfTier: 'Wishlist',
    tag: 'Public Access 🌐',
    isPublic: true,
    spineWidth: 'w-7 sm:w-8',
    spineHeight: 'h-24 sm:h-28'
  },
  {
    id: '14',
    title: 'Man\'s Search for Meaning',
    author: 'Viktor E. Frankl',
    category: 'Philosophy',
    progress: 0,
    totalPages: 165,
    readPages: 0,
    rating: 4.9,
    coverGradient: 'from-stone-600 via-neutral-700 to-stone-800',
    spineGradient: 'from-stone-700 via-neutral-800 to-stone-950 border-stone-400',
    shelfTier: 'Wishlist',
    tag: 'Wishlist',
    isPublic: true,
    spineWidth: 'w-6.5 sm:w-7.5',
    spineHeight: 'h-23 sm:h-27'
  }
];

export default function AnimatedBookshelf() {
  const [activeFilter, setActiveFilter] = useState<'All' | 'Reading' | 'Completed' | 'Wishlist'>('All');
  const [selectedBook, setSelectedBook] = useState<BookItem | null>(BOOKS[0]);
  const [hoveredBookId, setHoveredBookId] = useState<string | null>(null);

  const displayedShelves = SHELVES.filter(s => activeFilter === 'All' || s.id === activeFilter);

  return (
    <div className="w-full max-w-3xl mx-auto py-4 px-3 sm:px-4 font-sans">
      
      {/* Compact Section Header */}
      <div className="text-center max-w-xl mx-auto mb-3">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-[10px] font-black uppercase tracking-wider mb-1.5">
          <Sparkles className="w-3 h-3 text-amber-600" />
          <span>Screen-Fit Library Bookshelf</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight font-display">
          Full 3-Tier Cabinet{' '}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-600 to-indigo-600">
            (Spine Edge View)
          </span>
        </h2>
      </div>

      {/* Privacy Notice Bar */}
      <div className="mb-3 rounded-lg bg-amber-500/10 border border-amber-300 px-3 py-1.5 flex items-center justify-between gap-2 text-[11px] font-semibold text-amber-950">
        <div className="flex items-center gap-2">
          <Globe className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span><strong>Public Access Only 🌐:</strong> Personal private shelves stay 100% confidential 🔒.</span>
        </div>
        <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-amber-200">
          <Lock className="w-3 h-3 text-slate-500" /> Protected
        </span>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-center gap-1 mb-3">
        <button
          onClick={() => setActiveFilter('All')}
          className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
            activeFilter === 'All'
              ? 'bg-amber-500 text-slate-950 shadow-xs'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
          }`}
        >
          📚 All 3 Tiers
        </button>
        {SHELVES.map(shelf => (
          <button
            key={shelf.id}
            onClick={() => setActiveFilter(shelf.id)}
            className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
              activeFilter === shelf.id
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            {shelf.icon} {shelf.name.split(':')[0]}
          </button>
        ))}
      </div>

      {/* Screen-Fit Wooden Cabinet */}
      <div className="relative rounded-xl bg-gradient-to-b from-amber-100/70 via-amber-50/40 to-amber-100/60 p-3 sm:p-4 border-2 border-amber-300 shadow-lg space-y-3">
        
        {/* Wooden Frame Sides */}
        <div className="absolute top-0 bottom-0 left-0 w-2 bg-gradient-to-r from-amber-900 to-amber-800 rounded-l-xl border-r border-amber-700" />
        <div className="absolute top-0 bottom-0 right-0 w-2 bg-gradient-to-l from-amber-900 to-amber-800 rounded-r-xl border-l border-amber-700" />

        {displayedShelves.map((shelf) => {
          const shelfBooks = BOOKS.filter(b => b.shelfTier === shelf.id);

          return (
            <div key={shelf.id} className="relative z-10">
              
              {/* Ultra-Slim Tier Header */}
              <div className="flex items-center justify-between gap-2 mb-1 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-amber-200 text-xs">
                <div className="flex items-center gap-1.5 font-extrabold text-slate-900">
                  <span>{shelf.icon}</span>
                  <span className="font-display text-[11px] sm:text-xs">{shelf.name}</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-black border border-emerald-300">
                  Public Access 🌐 ({shelfBooks.length})
                </span>
              </div>

              {/* Wooden Shelf Rack */}
              <div className="relative pt-2 pb-0.5 px-2">
                
                {/* Book Spines Packed Side-by-Side */}
                <div className="flex flex-row items-end justify-center gap-1.5 sm:gap-2 min-h-[125px]">
                  {shelfBooks.map((book) => {
                    const isSelected = selectedBook?.id === book.id;
                    const isHovered = hoveredBookId === book.id;

                    return (
                      <div
                        key={book.id}
                        onClick={() => setSelectedBook(book)}
                        onMouseEnter={() => setHoveredBookId(book.id)}
                        onMouseLeave={() => setHoveredBookId(null)}
                        className={`group relative cursor-pointer perspective-1000 flex flex-col items-center shrink-0 transition-all duration-200 ${
                          isSelected ? '-translate-y-3 scale-105 z-30' : 'hover:-translate-y-2 z-10'
                        }`}
                      >
                        {/* Hover Spine Tag */}
                        <div className={`absolute -top-6 px-1.5 py-0.5 rounded bg-slate-900 text-white text-[8px] font-bold shadow-md transition-all duration-150 pointer-events-none z-40 whitespace-nowrap ${
                          isHovered || isSelected ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'
                        }`}>
                          {book.title}
                        </div>

                        {/* Compact Vertical Book Spine Edge Object */}
                        <div className={`book-spine-3d relative ${book.spineWidth} ${book.spineHeight} rounded-t-xs rounded-b-2xs bg-gradient-to-b ${book.spineGradient} text-white shadow-sm border-x border-t border-white/20 flex flex-col items-center justify-between p-1 ${
                          isSelected ? 'ring-2 ring-amber-400 shadow-amber-500/40 shadow-md' : ''
                        }`}>
                          
                          {/* Ribbon Marker */}
                          <div className="w-1 h-2 bg-amber-400 rounded-b-2xs" />

                          {/* Rotated Vertical Title Text */}
                          <div className="my-auto py-0.5 flex items-center justify-center">
                            <span
                              className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-white/95 truncate font-display drop-shadow-sm"
                              style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                            >
                              {book.title}
                            </span>
                          </div>

                          {/* Bottom Dot */}
                          <div className="flex items-center justify-center pt-0.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              book.progress === 100 ? 'bg-emerald-400' : book.progress > 0 ? 'bg-amber-400' : 'bg-slate-400'
                            }`} />
                          </div>
                        </div>

                        {/* Shadow */}
                        <div className={`w-full h-1 bg-slate-950/20 rounded-full blur-xs transition-all duration-150 mt-0.5 ${
                          isHovered || isSelected ? 'scale-110 opacity-50' : 'opacity-20'
                        }`} />
                      </div>
                    );
                  })}
                </div>

                {/* Tight Wooden Plank */}
                <div className="mt-0.5 h-2.5 w-full rounded-xs bg-gradient-to-r from-amber-900 via-amber-800 to-amber-900 shadow-sm border-t border-amber-600 flex items-center justify-between px-2">
                  <div className="w-1 h-1 rounded-full bg-amber-500/40" />
                  <div className="h-0.5 w-3/4 bg-amber-500/20 rounded-full" />
                  <div className="w-1 h-1 rounded-full bg-amber-500/40" />
                </div>
              </div>
            </div>
          );
        })}

        {/* Compact Front Cover Inspection Drawer */}
        {selectedBook && (
          <div className="mt-2 rounded-lg bg-white p-3 border-2 border-amber-300 shadow-md flex items-center justify-between gap-3 animate-fadeIn relative">
            <button
              onClick={() => setSelectedBook(null)}
              className="absolute top-2 right-2 text-slate-400 hover:text-slate-700 p-0.5 rounded hover:bg-slate-100"
            >
              <X className="w-3.5 h-3.5" />
            </button>

            <div className="flex items-center gap-3">
              <div className={`w-10 h-14 rounded bg-gradient-to-br ${selectedBook.coverGradient} p-1 text-white flex flex-col justify-between shadow-xs shrink-0 border border-white/20`}>
                <span className="text-[6px] font-black uppercase">{selectedBook.category}</span>
                <span className="text-[8px] font-extrabold line-clamp-2 leading-tight">{selectedBook.title}</span>
                <span className="text-[7px] text-amber-200 font-bold">{selectedBook.progress}%</span>
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300">
                    {selectedBook.tag}
                  </span>
                  <span className="text-[10px] text-slate-500">Public Access 🌐 • {selectedBook.totalPages} Pages</span>
                </div>
                <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 mt-0.5 font-display">
                  {selectedBook.title}
                </h4>
                <p className="text-[10px] text-slate-600">
                  By <span className="font-semibold text-slate-800">{selectedBook.author}</span> • Rated {selectedBook.rating} ★
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0 pr-5">
              <button
                onClick={() => {
                  setSelectedBook({
                    ...selectedBook,
                    progress: Math.min(100, selectedBook.progress + 10),
                    readPages: Math.min(selectedBook.totalPages, Math.round(selectedBook.totalPages * (selectedBook.progress + 10) / 100))
                  });
                }}
                className="px-2.5 py-1.5 rounded-md bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-bold transition-all flex items-center gap-1 shadow-xs active:scale-95"
              >
                <RefreshCw className="w-3 h-3 text-amber-600" />
                <span>Progress +10%</span>
              </button>
              <Link href="/signup" className="px-3 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold transition-all shadow-xs flex items-center gap-1">
                <span>Create Shelf</span>
                <ArrowRight className="w-3 h-3 text-amber-400" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
