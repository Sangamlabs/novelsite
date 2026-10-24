import React, { useState } from 'react';
import { Shield, Lock, Mail, ArrowRight, ArrowLeft, Feather } from 'lucide-react';
import { api } from '../services/api';
import { AdminUser } from '../types';

interface AuthorLoginViewProps {
  onSuccess: (user: AdminUser) => void;
  onReturnToSite: () => void;
}

export const AuthorLoginView: React.FC<AuthorLoginViewProps> = ({
  onSuccess,
  onReturnToSite
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    // Explicitly prevent default browser submission to prohibit GET / query parameter leakage
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // POST body only to backend
      const res = await api.login(email.trim(), password);
      onSuccess(res.user);
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify your email and password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-6 py-16 font-serif">
      <div className="w-full max-w-md">
        
        {/* Return Button */}
        <button
          onClick={onReturnToSite}
          className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-[#68715F] hover:text-[#28311F] mb-6 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Akhyana Home</span>
        </button>

        {/* Login Card */}
        <div className="glass-panel rounded-3xl p-8 sm:p-10 shadow-xl border border-white/80 bg-white/95">
          
          {/* Header */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-14 h-14 rounded-full bg-[#2C3A22]/10 border border-[#2C3A22]/20 flex items-center justify-center text-[#2C3A22] mb-3">
              <Feather className="w-7 h-7 stroke-[1.5]" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-[#28311F]">
              Author Studio Login
            </h1>
            <p className="text-xs text-[#68715F] mt-1.5 max-w-xs">
              Secure editorial publishing gateway for Akhyana authors and imprint editors.
            </p>
          </div>

          {/* Error Notice */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 leading-relaxed">
              {error}
            </div>
          )}

          {/* Form with POST body handling */}
          <form onSubmit={handleSubmit} method="post" className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-[#68715F] mb-1.5">
                Staff Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#68715F] absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="author@akhyana.lit"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/80 border border-[#2C3A22]/20 text-sm text-[#28311F] focus:outline-none focus:ring-1 focus:ring-[#2C3A22]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-[#68715F] mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#68715F] absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/80 border border-[#2C3A22]/20 text-sm text-[#28311F] focus:outline-none focus:ring-1 focus:ring-[#2C3A22]"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#2C3A22] text-[#EEF0E4] hover:bg-[#1D2716] disabled:opacity-50 rounded-xl text-xs uppercase tracking-wider font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <span>{loading ? 'Authenticating...' : 'Sign In to Author Studio'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>

        </div>

      </div>
    </div>
  );
};
