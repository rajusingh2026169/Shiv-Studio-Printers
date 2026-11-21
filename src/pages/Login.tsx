import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth, isAdminRoleValue, AUTHORIZED_ADMIN_EMAILS } from '../context/AuthContext';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { ShieldAlert, Key, Mail, ArrowRight } from 'lucide-react';
import { STUDIO_IMAGES } from '../assets/studioAssets';
import { SEOHead } from '../components/SEOHead';

export const Login: React.FC = () => {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const routeAuthenticatedUser = async (user: NonNullable<typeof auth.currentUser>) => {
    const userEmail = (user.email || '').toLowerCase();
    let role = 'customer';
    try {
      const docSnap = await getDoc(doc(db, 'users', user.uid));
      if (docSnap.exists()) {
        role = docSnap.data().role || 'customer';
      }
    } catch {
      // Fallback to verified bootstrap email check
    }
    const isVerifiedBootstrapAdmin =
      AUTHORIZED_ADMIN_EMAILS.includes(userEmail) && user.emailVerified;

    if (isAdminRoleValue(role) || isVerifiedBootstrapAdmin) {
      navigate('/admin/dashboard');
    } else {
      navigate('/customer/dashboard');
    }
  };

  const handleGoogleLogin = async () => {
    if (loading) return;
    setError('');
    setLoading(true);
    try {
      const user = await loginWithGoogle();
      await routeAuthenticatedUser(user);
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/popup-closed-by-user') {
        setError('Google sign-in popup was closed before completing.');
      } else {
        setError(err?.message?.replace(/^Firebase:\s*/, '') || 'Google sign-in failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      const user = auth.currentUser;
      if (user) {
        await routeAuthenticatedUser(user);
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
        setError('Invalid email or password. Please verify your credentials or sign in with Google.');
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

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full py-3.5 bg-white hover:bg-neutral-100 disabled:bg-white/20 text-[#111111] font-semibold rounded-xl text-xs tracking-wide transition-colors flex items-center justify-center gap-2.5"
        >
          <span>Continue with Google</span>
        </button>

        <div className="relative flex items-center">
          <div className="flex-grow border-t border-white/10" />
          <span className="px-3 text-[11px] uppercase tracking-wider text-neutral-500 font-mono">
            Or with email
          </span>
          <div className="flex-grow border-t border-white/10" />
        </div>

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
