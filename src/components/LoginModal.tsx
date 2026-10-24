import React, { useState } from 'react';
import { Shield, Lock, Mail, ArrowRight, X } from 'lucide-react';
import { api } from '../services/api';
import { AdminUser } from '../types';

interface LoginModalProps {
  onSuccess: (user: AdminUser) => void;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onSuccess, onClose }) => {
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
      // POST body only
      const res = await api.login(email.trim(), password);
      onSuccess(res.user);
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2C3A22]/40 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-md glass-panel rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/80 bg-white/95">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-[#68715F] hover:text-[#28311F] hover:bg-black/5 transition-colors cursor-pointer"
          aria-label="Close Login"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-[#2C3A22]/10 border border-[#2C3A22]/20 flex items-center justify-center text-[#2C3A22]">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-serif font-medium text-[#28311F]">Author Studio Login</h2>
            <p className="text-xs font-serif text-[#68715F]">Secure cryptographic authentication</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-serif text-red-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} method="post" className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-wider text-[#68715F] font-serif mb-1.5">
              Authorized Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#68715F] absolute left-3.5 top-3" />
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="author@akhyana.lit"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/80 border border-[#2C3A22]/20 text-sm font-serif text-[#28311F] focus:outline-none focus:ring-1 focus:ring-[#2C3A22]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-[#68715F] font-serif mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#68715F] absolute left-3.5 top-3" />
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/80 border border-[#2C3A22]/20 text-sm font-serif text-[#28311F] focus:outline-none focus:ring-1 focus:ring-[#2C3A22]"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#2C3A22] text-[#EEF0E4] hover:bg-[#1D2716] disabled:opacity-50 rounded-xl text-xs font-serif uppercase tracking-wider font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              <span>{loading ? 'Authenticating...' : 'Enter Studio'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
