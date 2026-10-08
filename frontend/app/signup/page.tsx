'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { BookOpen, User as UserIcon, Mail, KeyRound, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const { signup } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Password rules validation helper for client feedback
  const rules = [
    { label: 'At least 8 characters', valid: password.length >= 8 },
    { label: 'At least 1 uppercase letter (A-Z)', valid: /[A-Z]/.test(password) },
    { label: 'At least 1 lowercase letter (a-z)', valid: /[a-z]/.test(password) },
    { label: 'At least 1 number (0-9)', valid: /[0-9]/.test(password) },
    { label: 'At least 1 special character (!@#$%^&*)', valid: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(password) },
  ];

  const isPasswordValid = rules.every((r) => r.valid);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !email || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (!isPasswordValid) {
      setError('Please ensure your password meets all requirements.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      await signup(name, email, password);
      router.push('/dashboard');
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Registration failed. Please try again.';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md my-8">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-brand/10 border border-amber-brand/30 text-amber-brand mb-3 shadow-lg shadow-amber-brand/10">
            <BookOpen className="w-7 h-7" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Create your <span className="text-amber-brand">BookNest</span> account
          </h1>
          <p className="text-sm text-slateText-secondary mt-1">
            Join avid readers tracking books, shelves, and lending in real-time
          </p>
        </div>

        {/* Form Card */}
        <div className="glass-card p-8 rounded-2xl shadow-2xl border border-slate-700/50">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3 text-red-400 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-slateText-secondary uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <UserIcon className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Doe"
                  required
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-background-elevated/50 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-brand/50 focus:border-amber-brand transition-all text-sm"
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-semibold text-slateText-secondary uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-background-elevated/50 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-brand/50 focus:border-amber-brand transition-all text-sm"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slateText-secondary uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="w-5 h-5" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-background-elevated/50 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-brand/50 focus:border-amber-brand transition-all text-sm"
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-semibold text-slateText-secondary uppercase tracking-wider mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="w-5 h-5" />
                </div>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-background-elevated/50 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-brand/50 focus:border-amber-brand transition-all text-sm"
                />
              </div>
            </div>

            {/* Password Policy Rules Indicator */}
            {password.length > 0 && (
              <div className="p-3.5 rounded-xl bg-background-elevated/30 border border-slate-700/50 space-y-1.5 my-3 text-xs">
                <p className="font-semibold text-slateText-secondary mb-1">Password requirements:</p>
                {rules.map((rule, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <CheckCircle2
                      className={`w-3.5 h-3.5 ${rule.valid ? 'text-emerald-400' : 'text-slate-600'}`}
                    />
                    <span className={rule.valid ? 'text-emerald-300' : 'text-slate-400'}>
                      {rule.label}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl bg-amber-brand hover:bg-amber-hover active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-semibold text-sm transition-all shadow-lg shadow-amber-brand/20 flex items-center justify-center gap-2 mt-4"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Creating account...</span>
                </>
              ) : (
                <span>Register Account</span>
              )}
            </button>
          </form>

          {/* Footer Link */}
          <div className="mt-6 pt-6 border-t border-slate-700/50 text-center text-sm text-slateText-secondary">
            Already registered?{' '}
            <Link href="/login" className="text-amber-brand hover:underline font-medium">
              Sign in to your account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
