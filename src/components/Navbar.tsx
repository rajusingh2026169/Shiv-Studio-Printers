import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import logoImg from '../assets/images/shiv_studio_logo_1784453716682.jpg';
import { 
  Camera, 
  Menu, 
  X, 
  ShoppingCart, 
  Heart, 
  User, 
  LogOut, 
  LayoutDashboard,
  CalendarDays,
  FileSearch
} from 'lucide-react';

interface NavbarProps {
  cartCount: number;
  wishlistCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({ cartCount, wishlistCount }) => {
  const { currentUser, userProfile, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const [settings, setSettings] = useState<any>({
    studioName: 'Shiv Studio & Printers',
    phone: '+91 7905256355, +91 8765706396',
    email: 'shivsharan52796@gmail.com',
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settingsSnap = await getDoc(doc(db, 'website_settings', 'studio'));
        if (settingsSnap.exists()) {
          setSettings((prev: any) => ({ ...prev, ...settingsSnap.data() }));
        }
      } catch (err) {
        console.error('Error fetching settings in Navbar:', err);
      }
    };
    fetchSettings();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      setIsOpen(false);
      navigate('/');
    } catch (err) {
      console.error(err);
    }
  };

  const isActive = (path: string) => location.pathname === path;

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Services', path: '/services' },
    { name: 'Wedding Cards', path: '/wedding-cards' },
    { name: 'Product Store', path: '/store' },
    { name: 'Gallery', path: '/gallery' },
    { name: 'Offers', path: '/offers' },
    { name: 'Blog', path: '/blog' },
    { name: 'Contact', path: '/contact' }
  ];

  return (
    <nav className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-white">
      {/* Top Contact Bar */}
      <div className="bg-slate-950 border-b border-slate-800 text-xxs text-slate-400 py-1.5 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <a href={`tel:${settings.phone?.split(',')[0]}`} className="hover:text-amber-400 transition-colors">
            Phone: <span className="text-slate-200 font-sans">{settings.phone}</span>
          </a>
          <a href={`https://wa.me/${settings.whatsappNumber || '917905256355'}`} target="_blank" rel="noopener noreferrer" className="text-green-400 hover:text-green-300 transition-colors font-medium">
            WhatsApp
          </a>
          <a href={`mailto:${settings.email}`} className="hover:text-amber-400 transition-colors">
            Email
          </a>
        </div>
        <div className="hidden sm:block text-slate-500">
          <span>{settings.address?.split(',').slice(-3).join(',') || 'Khaga, Fatehpur, Uttar Pradesh'}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <img 
              src={settings.logoUrl || logoImg} 
              alt={settings.studioName || "Shiv Studio & Printers"} 
              className="h-10 w-10 object-contain rounded-full border border-amber-500/20"
              referrerPolicy="no-referrer"
            />
            <span className="font-sans font-bold text-lg sm:text-xl tracking-tight bg-gradient-to-r from-white to-amber-400 bg-clip-text text-transparent uppercase">
              {settings.studioName}
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex space-x-6">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={`text-sm font-medium transition-colors hover:text-amber-400 ${
                  isActive(link.path) ? 'text-amber-500 font-semibold' : 'text-slate-300'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Action Icons / Login */}
          <div className="hidden lg:flex items-center space-x-4">
            <Link to="/store" className="relative p-2 text-slate-300 hover:text-amber-400 transition-colors">
              <Heart className="h-5 w-5" />
              {wishlistCount > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xxs font-bold leading-none text-white bg-rose-500 rounded-full">
                  {wishlistCount}
                </span>
              )}
            </Link>

            <Link to="/cart" className="relative p-2 text-slate-300 hover:text-amber-400 transition-colors">
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xxs font-bold leading-none text-white bg-amber-500 rounded-full">
                  {cartCount}
                </span>
              )}
            </Link>

            <Link to="/track-order" className="p-2 text-slate-300 hover:text-amber-400 transition-colors" title="Track Order">
              <FileSearch className="h-5 w-5" />
            </Link>

            {currentUser ? (
              <div className="flex items-center space-x-3">
                <Link
                  to={
                    userProfile?.role === 'admin' || userProfile?.role === 'Super Admin' || userProfile?.role === 'Admin'
                      ? '/admin/dashboard'
                      : '/customer/dashboard'
                  }
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 border border-amber-500/30 text-sm font-medium transition-colors"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Dashboard ({userProfile?.role === 'admin' || userProfile?.role === 'Super Admin' || userProfile?.role === 'Admin' ? 'Admin' : 'Customer'})</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                  title="Logout"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-slate-900 bg-amber-400 hover:bg-amber-500 rounded-lg transition-colors shadow-lg shadow-amber-500/10 font-sans"
                >
                  Sign In
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Trigger */}
          <div className="flex lg:hidden items-center space-x-4">
            <Link to="/cart" className="relative p-2 text-slate-300 hover:text-amber-400 transition-colors">
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xxs font-bold leading-none text-white bg-amber-500 rounded-full">
                  {cartCount}
                </span>
              )}
            </Link>

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="lg:hidden bg-slate-950/95 border-b border-slate-800 px-4 pt-2 pb-4 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              onClick={() => setIsOpen(false)}
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                isActive(link.path) ? 'bg-amber-500/10 text-amber-400' : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
            >
              {link.name}
            </Link>
          ))}
          <div className="pt-4 border-t border-slate-800 flex flex-col space-y-2">
            <Link
              to="/track-order"
              onClick={() => setIsOpen(false)}
              className="flex items-center space-x-2 px-3 py-2 rounded-md text-slate-300 hover:bg-slate-900 hover:text-white"
            >
              <FileSearch className="h-5 w-5 text-amber-500" />
              <span>Track Orders & Shoots</span>
            </Link>
            {currentUser ? (
              <>
                <Link
                  to={
                    userProfile?.role === 'admin' || userProfile?.role === 'Super Admin' || userProfile?.role === 'Admin'
                      ? '/admin/dashboard'
                      : '/customer/dashboard'
                  }
                  onClick={() => setIsOpen(false)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-md text-amber-400 bg-amber-500/15 border border-amber-500/30"
                >
                  <LayoutDashboard className="h-5 w-5" />
                  <span>Dashboard ({userProfile?.role === 'admin' || userProfile?.role === 'Super Admin' || userProfile?.role === 'Admin' ? 'Admin' : 'Customer'})</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 px-3 py-2 rounded-md text-rose-400 hover:bg-rose-500/10 text-left"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Sign Out</span>
                </button>
              </>
            ) : (
              <Link
                to="/login"
                onClick={() => setIsOpen(false)}
                className="block text-center py-2.5 rounded-md bg-amber-400 text-slate-900 font-semibold text-sm"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
