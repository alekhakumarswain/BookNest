'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import AnimatedBookshelf from '@/components/AnimatedBookshelf';
import {
  BookOpen,
  Library,
  Share2,
  Repeat,
  Zap,
  ShieldCheck,
  BarChart3,
  Users,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Clock,
  Star,
  ChevronDown,
  BookMarked,
  Layers,
  Flame,
  Award
} from 'lucide-react';

export default function LandingPage() {
  const { user } = useAuth();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-slate-900 selection:bg-amber-400 selection:text-slate-950 font-sans">
      
      {/* Top Ambient Glow Background */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[450px] bg-gradient-to-b from-amber-300/20 via-orange-200/10 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Sticky Light Navigation Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600 group-hover:scale-105 transition-transform shadow-sm shadow-amber-500/20">
              <BookOpen className="w-5 h-5 text-amber-600" />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-slate-900 font-display">
              Book<span className="text-amber-600">Nest</span>
            </span>
          </Link>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <a href="#bookshelf" className="hover:text-amber-600 transition-colors">3D Bookshelf</a>
            <a href="#features" className="hover:text-amber-600 transition-colors">Features</a>
            <a href="#analytics" className="hover:text-amber-600 transition-colors">Analytics</a>
            <a href="#how-it-works" className="hover:text-amber-600 transition-colors">How It Works</a>
            <a href="#faq" className="hover:text-amber-600 transition-colors">FAQ</a>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            {user ? (
              <Link
                href="/dashboard"
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm transition-all shadow-md shadow-slate-900/10 active:scale-[0.98] flex items-center gap-2"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-4 h-4 text-amber-400" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm transition-all shadow-md shadow-amber-500/25 active:scale-[0.98]"
                >
                  Get Started Free
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        
        {/* Pill Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100 border border-amber-300 text-amber-800 text-xs font-bold uppercase tracking-wider mb-6 shadow-xs animate-float-slow">
          <Sparkles className="w-4 h-4 text-amber-600" />
          <span>Next-Gen Collaborative Reading Hub</span>
        </div>

        {/* Hero Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-slate-900 tracking-tight leading-[1.12] max-w-5xl mx-auto font-display">
          Organize, Share & Lend Your Book Collection{' '}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-600 via-orange-600 to-indigo-600">
            in Real-Time 3D
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed font-normal">
          Track daily reading progress, build interactive custom shelves, collaborate with granular access roles, and lend books to friends with sub-second real-time sync.
        </p>

        {/* CTA Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/signup"
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-base transition-all shadow-xl shadow-amber-500/30 flex items-center justify-center gap-2 group active:scale-[0.98]"
          >
            <span>Start Tracking Books Free</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <a
            href="#bookshelf"
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-bold text-base transition-all shadow-md flex items-center justify-center gap-2"
          >
            <BookOpen className="w-5 h-5 text-amber-600" />
            <span>Explore 3D Bookshelf</span>
          </a>
        </div>

        {/* Quick Social Proof Highlights */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-8 text-xs font-semibold text-slate-500">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>No Credit Card Required</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Real-Time WebSocket Sync</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Granular Collaborative Shelves</span>
          </div>
        </div>

        {/* Hero 3D Showcase Image Frame */}
        <div className="mt-14 relative mx-auto max-w-5xl rounded-3xl p-3 sm:p-4 bg-white/70 border border-amber-200/80 shadow-2xl shadow-slate-300/80 backdrop-blur-md">
          <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-inner group">
            <Image
              src="/images/hero_bookshelf.jpg"
              alt="BookNest Digital Bookshelf Showcase"
              width={1200}
              height={675}
              priority
              className="w-full h-auto object-cover group-hover:scale-[1.01] transition-transform duration-700"
            />
            {/* Floating Live Badge Overlay */}
            <div className="absolute top-4 left-4 glass-card-light px-3.5 py-1.5 rounded-full border border-emerald-300 text-xs font-bold text-slate-800 flex items-center gap-2 shadow-md">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <span>Real-Time Sanctuary Active</span>
            </div>
            {/* Floating Stats Badge */}
            <div className="absolute bottom-4 right-4 glass-card-light px-4 py-2.5 rounded-2xl border border-amber-300 text-xs font-bold text-slate-800 flex items-center gap-3 shadow-lg">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-600">
                <Flame className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="text-[10px] text-slate-500 font-semibold uppercase">Daily Reading Streak</div>
                <div className="text-sm font-black text-slate-900">39 Days Active 🔥</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Interactive Animated 3D Bookshelf */}
      <section id="bookshelf" className="py-6 sm:py-8 bg-gradient-to-b from-white via-amber-50/30 to-white border-y border-amber-100">
        <AnimatedBookshelf />
      </section>

      {/* Section 3: Reading Analytics & Goal Streaks (Light Design) */}
      <section id="analytics" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Text */}
          <div className="lg:col-span-5 text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-100 border border-indigo-300 text-indigo-800 text-xs font-bold uppercase tracking-wider mb-4">
              <BarChart3 className="w-3.5 h-3.5 text-indigo-600" />
              <span>Deep Reading Intelligence</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight font-display">
              Track Reading Streaks, Daily Speed & Annual Targets
            </h2>
            <p className="mt-4 text-base text-slate-600 leading-relaxed">
              BookNest gives you rich visual insights into your reading velocity, pages finished per session, and estimated book completion dates with automated progress tracking.
            </p>

            {/* Feature Bullet Points */}
            <div className="mt-8 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Visual Goal Rings & Daily Heatmaps</h4>
                  <p className="text-xs text-slate-600">Monitor annual targets (e.g. 50 books/year) with dynamic progress rings.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Automated Finish Date Predictor</h4>
                  <p className="text-xs text-slate-600">Calculates estimated completion dates based on your current reading speed.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  3
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Custom Categories & Rating Tags</h4>
                  <p className="text-xs text-slate-600">Tag books by genre, personal rating, favorite quotes, and custom shelf categories.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Mockup Display */}
          <div className="lg:col-span-7">
            <div className="rounded-3xl p-3 bg-white border border-slate-200 shadow-2xl shadow-slate-200">
              <div className="rounded-2xl overflow-hidden border border-slate-200">
                <Image
                  src="/images/reading_analytics.jpg"
                  alt="Reading Analytics Dashboard"
                  width={900}
                  height={675}
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Platform Features Grid */}
      <section id="features" className="py-20 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-100 border border-amber-300 text-amber-800 text-xs font-bold uppercase tracking-wider mb-4">
            <Zap className="w-3.5 h-3.5 text-amber-600" />
            <span>Built for Modern Readers & Clubs</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-display">
            Everything You Need to Manage Your Library
          </h2>
          <p className="mt-3 text-base text-slate-600 max-w-2xl mx-auto">
            From individual reading progress to collaborative book club shelves and physical lending management.
          </p>

          <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Feature 1 */}
            <div className="glass-card-light p-8 rounded-3xl text-left border border-slate-200 hover:border-amber-400 transition-all shadow-md">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600 mb-6 shadow-xs">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 font-display">Real-Time Sync Engine</h3>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                Powered by FastAPI WebSockets. Changes made to shelves or reading progress instantly sync across all your devices without refreshing.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="glass-card-light p-8 rounded-3xl text-left border border-slate-200 hover:border-amber-400 transition-all shadow-md">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-600 mb-6 shadow-xs">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 font-display">Shared Shelves & Roles</h3>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                Create collaborative shelves with friends or book clubs. Assign granular permissions: Owner, Editor, or Viewer.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="glass-card-light p-8 rounded-3xl text-left border border-slate-200 hover:border-amber-400 transition-all shadow-md">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 mb-6 shadow-xs">
                <Repeat className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 font-display">Smart Book Lending</h3>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                Never lose track of physical books lent to friends. Set return due dates, log borrow history, and send automatic reminders.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 5: How It Works (3 Steps) */}
      <section id="how-it-works" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-100 border border-amber-300 text-amber-800 text-xs font-bold uppercase tracking-wider mb-4">
          <Layers className="w-3.5 h-3.5 text-amber-600" />
          <span>Simple 3-Step Process</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-display">
          How BookNest Works
        </h2>
        <p className="mt-3 text-base text-slate-600 max-w-xl mx-auto">
          Start organizing your physical and digital reading collection in under two minutes.
        </p>

        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          
          {/* Step 1 */}
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-lg text-left relative z-10">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 font-extrabold flex items-center justify-center text-lg mb-6 shadow-md shadow-amber-500/30">
              01
            </div>
            <h3 className="text-lg font-bold text-slate-900 font-display">Build Your Library</h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Add your books, set initial reading status (Reading, Want to Read, Completed), and organize them into custom shelves.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-lg text-left relative z-10">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 font-extrabold flex items-center justify-center text-lg mb-6 shadow-md shadow-amber-500/30">
              02
            </div>
            <h3 className="text-lg font-bold text-slate-900 font-display">Share & Collaborate</h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Invite friends or book club members to shared shelves with granular role permissions (Editor, Viewer).
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-lg text-left relative z-10">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 font-extrabold flex items-center justify-center text-lg mb-6 shadow-md shadow-amber-500/30">
              03
            </div>
            <h3 className="text-lg font-bold text-slate-900 font-display">Track & Lend Real-Time</h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Log daily page progress, view live reading streaks, and manage book lending with automated WebSocket updates.
            </p>
          </div>
        </div>
      </section>

      {/* Section 6: Interactive FAQ Accordion */}
      <section id="faq" className="py-20 bg-slate-50 border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-display">
              Frequently Asked Questions
            </h2>
            <p className="mt-3 text-base text-slate-600">
              Everything you need to know about BookNest accounts, lending, and real-time sync.
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                q: "Is BookNest free to use?",
                a: "Yes! BookNest is 100% free to create an account, track your personal library, build custom shelves, and lend books to friends."
              },
              {
                q: "How does the real-time WebSocket sync work?",
                a: "BookNest uses FastAPI WebSockets to maintain persistent connections. When you update reading progress or lend a book, all members viewing the shelf see the update instantly."
              },
              {
                q: "Can I invite non-registered friends to my shared shelves?",
                a: "Yes, you can send share links to friends. They can view public shelves or create a free account to collaborate with Editor privileges."
              },
              {
                q: "How does the book lending feature handle due dates?",
                a: "When you mark a book as 'Lent Out', you select a borrower and due date. BookNest tracks the loan duration and sends notification alerts when return dates approach."
              }
            ].map((item, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs transition-all"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-5 text-left flex items-center justify-between font-bold text-slate-900 text-base"
                >
                  <span>{item.q}</span>
                  <ChevronDown className={`w-5 h-5 text-slate-500 transition-transform duration-200 ${openFaq === idx ? 'rotate-180 text-amber-600' : ''}`} />
                </button>
                {openFaq === idx && (
                  <div className="px-5 pb-5 text-sm text-slate-600 border-t border-slate-100 pt-3 leading-relaxed">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Bottom Banner (Light Theme Warm Amber Gradient) */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl p-10 sm:p-14 text-center bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-slate-950 shadow-2xl shadow-amber-500/25 overflow-hidden">
          
          <div className="relative z-10 max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight font-display">
              Ready to Transform Your Reading Experience?
            </h2>
            <p className="mt-4 text-base sm:text-lg text-slate-950/90 font-medium max-w-xl mx-auto">
              Join thousands of readers organizing, sharing, and lending books in real-time.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/signup"
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-slate-950 hover:bg-slate-900 text-white font-extrabold text-base transition-all shadow-xl active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <span>Create Free Account Now</span>
                <ArrowRight className="w-5 h-5 text-amber-400" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-10 bg-white text-xs text-slate-500 text-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-bold text-slate-900">
            <BookOpen className="w-4 h-4 text-amber-600" />
            <span>BookNest Platform</span>
          </div>
          <div>
            Powered by Next.js • Python FastAPI • MongoDB • WebSockets
          </div>
          <div>
            &copy; {new Date().getFullYear()} BookNest. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
