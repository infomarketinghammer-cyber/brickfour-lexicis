/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Lock, Mail, Eye, EyeOff } from 'lucide-react';
import { appLogo } from '../../assets/logo';
import { User } from '../../types';
import * as api from '../../api/client';

interface LoginFormProps {
  onAuthSuccess: (user: User) => void;
}

export default function LoginForm({ onAuthSuccess }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      onAuthSuccess(await api.login(email, password));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-md w-full space-y-6 bg-white p-8 rounded-2xl shadow-xl border border-slate-100 transition-all">

        {/* Branding Head */}
        <div className="text-center">
          <div className="inline-flex mb-3">
            <img src={appLogo} alt="LEXICIS" className="h-9 w-auto object-contain" />
          </div>
          <h2 className="text-lg font-display font-bold text-slate-900 tracking-wider">LEXICIS</h2>
          <p className="text-xs text-slate-500 mt-1">Authorized Legal Counsel & Portfolio Portal</p>
        </div>

        {/* Error notification */}
        {error && (
          <div className="bg-rose-50 border-l-4 border-rose-500 text-rose-800 p-3 rounded text-xs font-medium">
            {error}
          </div>
        )}

        {/* Authentication Form */}
        <form className="mt-4 space-y-4" onSubmit={handleSubmit}>

          {/* Email address */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Email Address</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Mail className="h-4 w-4" />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@gmail.com"
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                id="input-email"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Lock className="h-4 w-4" />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-10 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                id="input-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors focus:outline-none cursor-pointer"
                title={showPassword ? "Hide password" : "Show password"}
                id="btn-toggle-password-visibility"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-slate-600" />
                ) : (
                  <Eye className="h-4 w-4 text-slate-400" />
                )}
              </button>
            </div>
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 flex justify-center py-2.5 px-4 border border-transparent rounded-lg text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
            id="btn-auth-submit"
          >
            {loading ? "Authenticating..." : "Sign In to Portal"}
          </button>
        </form>

      </div>
    </div>
  );
}
