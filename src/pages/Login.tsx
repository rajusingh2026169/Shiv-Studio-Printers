import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth, isAdminRoleValue } from '../context/AuthContext';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { ShieldAlert, Key, Mail, ArrowRight } from 'lucide-react';
import { STUDIO_IMAGES } from '../assets/studioAssets';
import { SEOHead } from '../components/SEOHead';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      const user = auth.currentUser;
      if (user) {
        const docSnap = await getDoc(doc(db, 'users', user.uid));
        const role = docSnap.exists() ? docSnap.data().role : 'customer';
        if (isAdminRoleValue(role)) {
          navigate('/admin/dashboard');
        } else {
          navigate('/customer/dashboard');
        }
      } else {
        navigate('/');
      }
    } catch (err: any) {
      const code = err?.code || '';
      if (
        code === 'auth/invalid-credential' ||
        code === 'auth/user-not-found' ||
        code === 'auth/wrong-password'
      ) {
        setError('Invalid email or password. Please verify your credentials or create a client account.');
      } else if (code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else if (code === 'auth/too-many-requests') {
        setError('Too many unsuccessful attempts. Please wait a moment and try again.');
      } else {
        setError(err?.message?.replace(/^Firebase:\s*/, '') || 'Authentication failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#111111] min-h-[85vh] flex items-center justify-center px-4 py-16">
      <SEOHead
        title="Sign In — SHIV STUDIO"
        description="Sign in to your SHIV STUDIO client portal or authorized studio administration workspace."
        canonicalPath="/login"
      />
      <div className="w-full max-w-md bg-[#1A1A1A] border border-white/10 rounded-2xl p-8 space-y-6 shadow-2xl">
        <div className="text-center space-y-3">
          <Link to="/" className="inline-flex items-center justify-center">
            <img
              src={STUDIO_IMAGES.logo}
              alt="SHIV STUDIO Logo"
              className="h-12 w-12 rounded-full object-cover border border-[#D4AF37]/40"
            />
          </Link>
          <h1 className="font-display text-3xl font-semibold text-white tracking-tight">
            Sign In to SHIV STUDIO
          </h1>
          <p className="text-xs text-neutral-400">
            Access bookings, orders, invoices, or studio management controls.
          </p>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 p-3.5 rounded-xl flex items-start space-x-2.5 text-rose-300 text-xs">
            <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="text-neutral-300 font-medium flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-[#D4AF37]" />
              <span>Email Address</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#111111] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#D4AF37] transition-colors"
              placeholder="you@example.com"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-neutral-300 font-medium flex items-center gap-1.5">
              <Key className="h-3.5 w-3.5 text-[#D4AF37]" />
              <span>Password</span>
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#111111] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#D4AF37] transition-colors"
              placeholder="Enter password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-[#D4AF37] hover:bg-[#E5C158] disabled:bg-white/10 disabled:text-neutral-500 text-[#111111] font-semibold rounded-xl text-xs tracking-wider uppercase transition-colors flex items-center justify-center gap-2"
          >
            <span>{loading ? 'Signing In...' : 'Sign In'}</span>
            {!loading && <ArrowRight className="h-4 w-4" />}
          </button>
        </form>

        <div className="pt-4 border-t border-white/10 text-center text-xs text-neutral-400">
          <p>
            New customer?{' '}
            <Link to="/register" className="text-[#D4AF37] font-semibold hover:underline">
              Create Client Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
