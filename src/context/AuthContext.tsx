import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { UserProfile, UserRole } from '../types';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string, phone: string, address?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  isAdmin: () => boolean;
  isPhotographer: () => boolean;
  isStaff: () => boolean;
  isCustomer: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTHORIZED_ADMIN_EMAILS = ['arvindmaurya212655@gmail.com'];

export function isAdminRoleValue(role?: string | null): boolean {
  return role === 'admin' || role === 'Admin' || role === 'Super Admin';
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Public customer registration only — never permits public admin registration
  const register = async (
    email: string,
    password: string,
    fullName: string,
    phone: string,
    address: string = ''
  ) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
    const user = userCredential.user;

    const profile: UserProfile = {
      uid: user.uid,
      email: email.trim(),
      fullName: fullName.trim(),
      name: fullName.trim(),
      phone: phone.trim(),
      mobile: phone.trim(),
      role: 'customer',
      address: address.trim(),
      createdAt: new Date().toISOString()
    };

    await setDoc(doc(db, 'users', user.uid), profile);
    await signOut(auth);
    setUserProfile(null);
  };

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email.trim(), password);
  };

  const logout = async () => {
    await signOut(auth);
    setUserProfile(null);
  };

  const loadUserProfile = async (user: FirebaseUser) => {
    try {
      const userEmail = (user.email || '').toLowerCase();
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);

      let adminDocExists = false;
      try {
        const adminSnap = await getDoc(doc(db, 'admins', user.uid));
        adminDocExists = adminSnap.exists();
      } catch {
        adminDocExists = false;
      }

      const isBootstrapAdmin =
        adminDocExists ||
        (AUTHORIZED_ADMIN_EMAILS.includes(userEmail) && user.emailVerified);

      if (docSnap.exists()) {
        const data = docSnap.data();
        const rawRole = data.role as UserRole;
        const resolvedRole: UserRole =
          isBootstrapAdmin || isAdminRoleValue(rawRole) ? 'admin' : rawRole || 'customer';

        const profile: UserProfile = {
          uid: user.uid,
          email: user.email || '',
          fullName: data.fullName || data.name || 'Studio Client',
          name: data.name || data.fullName || 'Studio Client',
          phone: data.phone || data.mobile || '',
          mobile: data.mobile || data.phone || '',
          role: resolvedRole,
          address: data.address || '',
          avatarUrl: data.avatarUrl || '',
          createdAt: data.createdAt || new Date().toISOString()
        };

        setUserProfile(profile);
      } else {
        const fallbackRole: UserRole = isBootstrapAdmin ? 'admin' : 'customer';
        const fallbackProfile: UserProfile = {
          uid: user.uid,
          email: user.email || '',
          fullName: user.displayName || user.email?.split('@')[0] || 'Studio Client',
          name: user.displayName || user.email?.split('@')[0] || 'Studio Client',
          phone: '',
          mobile: '',
          role: fallbackRole,
          createdAt: new Date().toISOString()
        };
        await setDoc(docRef, fallbackProfile);
        setUserProfile(fallbackProfile);
      }
    } catch (err: any) {
      console.warn('Notice (AuthContext): Using minimal fallback profile:', err?.message || err);
      const userEmail = (user.email || '').toLowerCase();
      const isBootstrapAdmin = AUTHORIZED_ADMIN_EMAILS.includes(userEmail);
      setUserProfile({
        uid: user.uid,
        email: user.email || '',
        fullName: user.displayName || user.email?.split('@')[0] || 'Studio Client',
        name: user.displayName || user.email?.split('@')[0] || 'Studio Client',
        phone: '',
        mobile: '',
        role: isBootstrapAdmin ? 'admin' : 'customer',
        createdAt: new Date().toISOString()
      });
    }
  };

  const refreshProfile = async () => {
    if (auth.currentUser) {
      await loadUserProfile(auth.currentUser);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await loadUserProfile(user);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const isAdmin = () => isAdminRoleValue(userProfile?.role);
  const isPhotographer = () => userProfile?.role === 'Photographer';
  const isStaff = () => userProfile?.role === 'Designer' || userProfile?.role === 'Printing Staff';
  const isCustomer = () => !isAdmin();

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        login,
        register,
        logout,
        refreshProfile,
        isAdmin,
        isPhotographer,
        isStaff,
        isCustomer
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }
  return context;
};
