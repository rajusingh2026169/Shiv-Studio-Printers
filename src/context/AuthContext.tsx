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
  register: (email: string, password: string, fullName: string, phone: string, role?: UserRole, address?: string) => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: () => boolean;
  isPhotographer: () => boolean;
  isStaff: () => boolean;
  isCustomer: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Sign up a new user and create their Firestore profile document
  const register = async (
    email: string, 
    password: string, 
    fullName: string, 
    phone: string, 
    role: UserRole = 'customer',
    address: string = ''
  ) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const profile: UserProfile = {
        uid: user.uid,
        email,
        fullName,
        name: fullName,
        phone,
        mobile: phone,
        role,
        address: address.trim(),
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'users', user.uid), profile);
      // Automatically log out so they can redirect to Login page to sign in
      await signOut(auth);
      setUserProfile(null);
    } catch (err) {
      console.error('Registration failed:', err);
      throw err;
    }
  };

  // Log in an existing user
  const login = async (email: string, password: string) => {
    const normalizedEmail = email.toLowerCase().trim();

    // Helper to attempt login and fallback to registration for demo accounts
    const tryLoginWithAutoCreate = async (role: UserRole, defaultName: string) => {
      try {
        await signInWithEmailAndPassword(auth, email, password);
      } catch (authErr: any) {
        if (
          authErr.code === 'auth/user-not-found' ||
          authErr.code === 'auth/invalid-credential' ||
          authErr.code === 'auth/wrong-password'
        ) {
          try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            const demoProfile: UserProfile = {
              uid: user.uid,
              email: email.trim(),
              fullName: defaultName,
              name: defaultName,
              phone: '+91 7905256355',
              mobile: '+91 7905256355',
              role: role,
              address: 'Shiv Studio, Main Road, City',
              createdAt: new Date().toISOString()
            };
            await setDoc(doc(db, 'users', user.uid), demoProfile);
            setUserProfile(demoProfile);
            return;
          } catch (regErr: any) {
            if (regErr.code === 'auth/email-already-in-use') {
              throw new Error('Incorrect password entered.');
            }
            throw regErr;
          }
        }
        throw authErr;
      }
    };

    try {
      if (normalizedEmail === 'admin@shivstudio.com' && password === 'Shiv@123') {
        await tryLoginWithAutoCreate('admin', 'Super Admin');
      } else if (normalizedEmail === 'customer@shivstudio.com' && password === 'Customer@123') {
        await tryLoginWithAutoCreate('customer', 'Demo Customer');
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }
    } catch (err: any) {
      throw err;
    }
  };

  // Log out the current user
  const logout = async () => {
    try {
      await signOut(auth);
      setUserProfile(null);
    } catch (err) {
      console.error('Logout failed:', err);
      throw err;
    }
  };

  // Helper getters to check roles easily across pages
  const isAdmin = () => userProfile?.role === 'admin' || userProfile?.role === 'Super Admin' || userProfile?.role === 'Admin';
  const isPhotographer = () => false;
  const isStaff = () => false;
  const isCustomer = () => userProfile?.role === 'customer' || userProfile?.role === 'Customer' || !userProfile; // Default to customer if not authenticated

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          // Fetch user profile from Firestore
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const data = docSnap.data();
            const rawRole = data.role as any;
            let role: UserRole = 'customer';
            if (user.email?.toLowerCase() === 'admin@shivstudio.com' || rawRole === 'admin' || rawRole === 'Super Admin' || rawRole === 'Admin') {
              role = 'admin';
            } else {
              role = 'customer';
            }

            const profile: UserProfile = {
              uid: user.uid,
              email: user.email || '',
              fullName: data.fullName || data.name || 'Studio Customer',
              name: data.name || data.fullName || 'Studio Customer',
              phone: data.phone || data.mobile || '',
              mobile: data.mobile || data.phone || '',
              role: role,
              address: data.address || '',
              createdAt: data.createdAt || new Date().toISOString()
            };

            if (data.role !== role) {
              await setDoc(docRef, { role }, { merge: true });
            }
            setUserProfile(profile);
          } else {
            // Fallback: If auth exists but profile is missing, create profile
            let role: UserRole = 'customer';
            if (user.email?.toLowerCase() === 'admin@shivstudio.com') {
              role = 'admin';
            }
            const fallbackProfile: UserProfile = {
              uid: user.uid,
              email: user.email || '',
              fullName: user.displayName || user.email?.split('@')[0] || 'Studio Customer',
              name: user.displayName || user.email?.split('@')[0] || 'Studio Customer',
              phone: '',
              mobile: '',
              role,
              createdAt: new Date().toISOString()
            };
            await setDoc(doc(db, 'users', user.uid), fallbackProfile);
            setUserProfile(fallbackProfile);
          }
        } catch (err) {
          console.error('Error loading user profile:', err);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{
      currentUser,
      userProfile,
      loading,
      login,
      register,
      logout,
      isAdmin,
      isPhotographer,
      isStaff,
      isCustomer
    }}>
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
