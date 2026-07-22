import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Camera, ShieldAlert, Key, Mail } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      const user = auth.currentUser;
      if (user) {
        const docSnap = await getDoc(doc(db, 'users', user.uid));
        if (docSnap.exists()) {
          const data = docSnap.data();
          const role = data.role;
          if (role === 'admin' || role === 'Super Admin' || role === 'Admin' || user.email?.toLowerCase() === 'admin@shivstudio.com') {
            navigate('/admin/dashboard');
          } else {
            navigate('/customer/dashboard');
          }
        } else {
          if (user.email?.toLowerCase() === 'admin@shivstudio.com') {
            navigate('/admin/dashboard');
          } else {
            navigate('/customer/dashboard');
          }
        }
      } else {
        navigate('/');
      }
    } catch (err: any) {
      console.error('Login error:', err?.code || err?.message);
      const code = err?.code || '';
      if (
        code === 'auth/invalid-credential' ||
        code === 'auth/user-not-found' ||
        code === 'auth/wrong-password'
      ) {
        setError('Invalid email or password. If you do not have an account yet, please click "Sign Up" below.');
      } else if (code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else if (code === 'auth/too-many-requests') {
        setError('Too many unsuccessful attempts. Please wait a few moments and try again.');
      } else {
        setError(err?.message?.replace(/^Firebase:\s*/, '') || 'Authentication failed. Please verify your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError('');
  };

  return (
    <div className="bg-slate-950 min-h-[85vh] flex items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl overflow-hidden">
        
        {/* Visual glass flare background decorative elements */}
        <div className="absolute top-0 right-0 h-28 w-28 bg-amber-500/10 rounded-full blur-2xl z-0"></div>

        <div className="relative z-10 text-center space-y-2">
          <Link to="/" className="inline-flex items-center space-x-2">
            <Camera className="h-10 w-10 text-amber-500 animate-pulse" />
          </Link>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-4">
            Sign In to Shiv Studio
          </h2>
          <p className="text-xxs sm:text-xs text-slate-400">
            Access secure client archives, track print queues, or coordinate event schedules instantly.
          </p>
        </div>

        {error && (
          <div className="bg-rose-500/15 border border-rose-500/30 p-3 rounded-xl flex items-start space-x-2.5 text-rose-400 text-xs font-sans">
            <ShieldAlert className="h-4.5 w-4.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs font-sans relative z-10">
          <div className="space-y-1.5">
            <label className="text-slate-400 font-semibold flex items-center gap-1">
              <Mail className="h-3.5 w-3.5 text-amber-500" />
              <span>Registered Email Address</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white outline-none focus:border-amber-500"
              placeholder="e.g. shivsharan52796@gmail.com"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-400 font-semibold flex items-center gap-1">
              <Key className="h-3.5 w-3.5 text-amber-500" />
              <span>Secret Password</span>
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white outline-none focus:border-amber-500"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-amber-400 hover:bg-amber-500 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-extrabold rounded-xl text-center text-xs tracking-wider transition-colors"
          >
            {loading ? 'Authenticating Profile...' : 'Sign In to Portal'}
          </button>
        </form>

        {/* Quick Demo Access */}
        <div className="pt-2 text-center space-y-2">
          <p className="text-[10px] uppercase font-mono tracking-wider text-slate-500">Quick Demo Sign In</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleFillDemo('admin@shivstudio.com', 'Shiv@123')}
              className="flex-1 py-1.5 px-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 font-mono text-xxs transition-colors"
            >
              Demo Admin
            </button>
            <button
              type="button"
              onClick={() => handleFillDemo('customer@shivstudio.com', 'Customer@123')}
              className="flex-1 py-1.5 px-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 font-mono text-xxs transition-colors"
            >
              Demo Customer
            </button>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800/60 text-center text-xs text-slate-400 font-sans">
          <p>Don't have an account? <Link to="/register" className="text-amber-400 font-bold hover:underline">Sign Up</Link></p>
        </div>
      </div>
    </div>
  );
};
