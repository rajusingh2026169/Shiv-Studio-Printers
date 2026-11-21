import React, { useState, useEffect } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { db, OperationType, handleFirestoreError } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { ImageField } from './ImageField';
import { UserCheck, ShieldCheck, LogOut, Save, Loader2, CheckCircle2 } from 'lucide-react';

export const AdminProfilePanel: React.FC = () => {
  const { currentUser, userProfile, logout, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState(userProfile?.fullName || '');
  const [phone, setPhone] = useState(userProfile?.phone || '');
  const [address, setAddress] = useState(userProfile?.address || '');
  const [avatarUrl, setAvatarUrl] = useState(userProfile?.avatarUrl || '');
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (userProfile) {
      setFullName(userProfile.fullName || '');
      setPhone(userProfile.phone || '');
      setAddress(userProfile.address || '');
      setAvatarUrl(userProfile.avatarUrl || '');
    }
  }, [userProfile]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setSaving(true);
    setNotice(null);

    try {
      const cleanName = fullName.trim() || 'SHIV STUDIO Admin';
      await setDoc(
        doc(db, 'users', currentUser.uid),
        {
          uid: currentUser.uid,
          email: currentUser.email || userProfile?.email || '',
          fullName: cleanName,
          name: cleanName,
          phone: phone.trim(),
          mobile: phone.trim(),
          address: address.trim(),
          avatarUrl: avatarUrl || '',
          role: userProfile?.role || 'Admin',
          createdAt: userProfile?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        { merge: true }
      );
      await refreshProfile();
      setNotice('Administrator profile updated successfully.');
    } catch (err: any) {
      console.error('Error saving admin profile:', err);
      if (err?.code === 'permission-denied' || String(err?.message || '').includes('Missing or insufficient permissions')) {
        try {
          handleFirestoreError(err, OperationType.WRITE, `users/${currentUser.uid}`);
        } catch {
          // Structured error logged
        }
      }
      setNotice('Could not save profile changes. Check permissions.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="bg-[#1A1A1A] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6 text-xs font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-4">
        <div>
          <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-[#D4AF37]" />
            <span>Administrator Profile & Account Security</span>
          </h3>
          <p className="text-xxs text-neutral-400 mt-1">
            Manage your admin display profile or sign out of the current browser session.
          </p>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="px-4 py-2.5 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 font-bold text-xs rounded-xl flex items-center gap-2 transition-colors whitespace-nowrap shrink-0"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out of Admin</span>
        </button>
      </div>

      {notice && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl flex items-center gap-2 text-xs">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      <div className="p-4 bg-[#111111] border border-white/10 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {avatarUrl ? (
            <img src={avatarUrl} alt={fullName} className="h-12 w-12 rounded-full object-cover border border-[#D4AF37]/40" />
          ) : (
            <div className="h-12 w-12 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] font-serif text-xl font-bold">
              {(fullName || currentUser?.email || 'A').charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-white font-bold text-sm">{fullName || 'SHIV STUDIO Admin'}</p>
            <p className="text-neutral-400 font-mono text-xxs">{currentUser?.email || userProfile?.email}</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37] font-mono text-[11px] font-bold uppercase w-fit">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>{userProfile?.role || 'Admin'}</span>
        </span>
      </div>

      <form onSubmit={handleSaveProfile} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-neutral-300 font-semibold">Full Name</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-[#111111] border border-white/15 rounded-xl px-4 py-3 text-white outline-none focus:border-[#D4AF37]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-neutral-300 font-semibold">Direct Contact Mobile</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-[#111111] border border-white/15 rounded-xl px-4 py-3 text-white outline-none focus:border-[#D4AF37]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-neutral-300 font-semibold">Studio / Office Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full bg-[#111111] border border-white/15 rounded-xl px-4 py-3 text-white outline-none focus:border-[#D4AF37]"
            />
          </div>
        </div>

        <div className="space-y-4">
          <ImageField
            value={avatarUrl}
            onChange={setAvatarUrl}
            storagePath="team"
            label="Admin Avatar Photo"
            recommendedSize="Square 400x400 px"
          />
        </div>

        <div className="md:col-span-2 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto px-6 py-3 bg-[#D4AF37] hover:bg-[#c5a028] text-[#111111] font-extrabold rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            <span>{saving ? 'Saving Profile...' : 'Save Admin Profile'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
