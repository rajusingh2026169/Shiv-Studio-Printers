import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, Key, Mail, User, Phone, MapPin, ArrowRight } from 'lucide-react';
import { STUDIO_IMAGES } from '../assets/studioAssets';
import { SEOHead } from '../components/SEOHead';

export const Register: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError('');

    if (!address.trim()) {
      setError('Please enter your delivery address.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await register(email, password, fullName, phone, address);
      navigate('/login');
    } catch (err: any) {
      setError(err?.message?.replace(/^Firebase:\s*/, '') || 'Unable to register right now. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#111111] min-h-[88vh] flex items-center justify-center px-4 py-16">
      <SEOHead
        title="Create Account — SHIV STUDIO"
        description="Register a SHIV STUDIO client account to track photography bookings, custom frame orders, and invoices."
        canonicalPath="/register"
      />
      <div className="w-full max-w-lg bg-[#1A1A1A] border border-white/10 rounded-2xl p-8 space-y-6 shadow-2xl">
        <div className="text-center space-y-3">
          <Link to="/" className="inline-flex items-center justify-center">
            <img
              src={STUDIO_IMAGES.logo}
              alt="SHIV STUDIO Logo"
              className="h-12 w-12 rounded-full object-cover border border-[#D4AF37]/40"
            />
          </Link>
          <h1 className="font-display text-3xl font-semibold text-white tracking-tight">
            Client Account Registration
          </h1>
          <p className="text-xs text-neutral-400">
            Track shoot reservations, print orders, and digital invoices in one portal.
          </p>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 p-3.5 rounded-xl flex items-start space-x-2.5 text-rose-300 text-xs">
            <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-neutral-300 font-medium flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-[#D4AF37]" />
                <span>Full Name</span>
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-[#111111] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#D4AF37]"
                placeholder="Your full name"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-neutral-300 font-medium flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-[#D4AF37]" />
                <span>Mobile / WhatsApp Number</span>
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-[#111111] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#D4AF37]"
                placeholder="+91 9876543210"
              />
            </div>
          </div>

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
              className="w-full bg-[#111111] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#D4AF37]"
              placeholder="you@example.com"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-neutral-300 font-medium flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-[#D4AF37]" />
              <span>Full Address</span>
            </label>
            <textarea
              required
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full bg-[#111111] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#D4AF37] resize-none"
              placeholder="House/Street, Khaga, Fatehpur, Uttar Pradesh"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                className="w-full bg-[#111111] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#D4AF37]"
                placeholder="Min 6 characters"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-neutral-300 font-medium flex items-center gap-1.5">
                <Key className="h-3.5 w-3.5 text-[#D4AF37]" />
                <span>Confirm Password</span>
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-[#111111] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#D4AF37]"
                placeholder="Re-enter password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-[#D4AF37] hover:bg-[#E5C158] disabled:bg-white/10 disabled:text-neutral-500 text-[#111111] font-semibold rounded-xl text-xs tracking-wider uppercase transition-colors flex items-center justify-center gap-2"
          >
            <span>{loading ? 'Creating Account...' : 'Create Client Account'}</span>
            {!loading && <ArrowRight className="h-4 w-4" />}
          </button>
        </form>

        <div className="pt-4 border-t border-white/10 text-center text-xs text-neutral-400">
          <p>
            Already have an account?{' '}
            <Link to="/login" className="text-[#D4AF37] font-semibold hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
