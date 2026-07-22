import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Camera, ShieldAlert, Key, Mail, User, Phone, MapPin } from 'lucide-react';

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
    setError('');

    if (!address.trim()) {
      setError('Please enter your full delivery address.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      await register(email, password, fullName, phone, 'customer', address);
      navigate('/login');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred during profile registration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-950 min-h-[90vh] flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl overflow-hidden">
        
        {/* Decorative glass elements */}
        <div className="absolute top-0 right-0 h-28 w-28 bg-amber-500/10 rounded-full blur-2xl z-0"></div>

        <div className="relative z-10 text-center space-y-2">
          <Link to="/" className="inline-flex items-center space-x-2">
            <Camera className="h-10 w-10 text-amber-500 animate-pulse" />
          </Link>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-4">
            Customer Sign Up
          </h2>
          <p className="text-xxs sm:text-xs text-slate-400">
            Create your account to book photography packages and order printing products instantly.
          </p>
        </div>

        {error && (
          <div className="bg-rose-500/15 border border-rose-500/30 p-3 rounded-xl flex items-start space-x-2.5 text-rose-400 text-xs font-sans">
            <ShieldAlert className="h-4.5 w-4.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs font-sans relative z-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-slate-400 font-semibold flex items-center gap-1">
                <User className="h-3.5 w-3.5 text-amber-500" />
                <span>Full Name</span>
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white outline-none focus:border-amber-500"
                placeholder="e.g. Shalini Roy"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-400 font-semibold flex items-center gap-1">
                <Phone className="h-3.5 w-3.5 text-amber-500" />
                <span>Mobile Number</span>
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white outline-none focus:border-amber-500"
                placeholder="e.g. +91 9999999999"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-400 font-semibold flex items-center gap-1">
              <Mail className="h-3.5 w-3.5 text-amber-500" />
              <span>Email Address</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white outline-none focus:border-amber-500"
              placeholder="e.g. user@domain.com"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-400 font-semibold flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-amber-500" />
              <span>Full Delivery Address</span>
            </label>
            <textarea
              required
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white outline-none focus:border-amber-500 resize-none text-xs"
              placeholder="House No, Street, Landmark, City, State, Pincode"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-slate-400 font-semibold flex items-center gap-1">
                <Key className="h-3.5 w-3.5 text-amber-500" />
                <span>Password</span>
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white outline-none focus:border-amber-500"
                placeholder="Min 6 characters"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-400 font-semibold flex items-center gap-1">
                <Key className="h-3.5 w-3.5 text-amber-500" />
                <span>Confirm Password</span>
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white outline-none focus:border-amber-500"
                placeholder="Confirm password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-amber-400 hover:bg-amber-500 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-extrabold rounded-xl text-center text-xs tracking-wider transition-colors"
          >
            {loading ? 'Initializing Secured Profile...' : 'Sign Up'}
          </button>
        </form>

        <div className="pt-4 border-t border-slate-800/60 text-center text-xs text-slate-400 font-sans">
          <p>Already have an account? <Link to="/login" className="text-amber-400 font-bold hover:underline">Sign In</Link></p>
        </div>
      </div>
    </div>
  );
};
