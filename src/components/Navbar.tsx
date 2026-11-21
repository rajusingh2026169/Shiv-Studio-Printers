import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth, isAdminRoleValue } from '../context/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { STUDIO_IMAGES } from '../assets/studioAssets';
import { OfferBannerDisplay } from './OfferBannerDisplay';
import {
  Menu,
  X,
  ShoppingCart,
  LogOut,
  LayoutDashboard,
  User,
  CalendarDays
} from 'lucide-react';

interface NavbarProps {
  cartCount: number;
  wishlistCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({ cartCount }) => {
  const { currentUser, userProfile, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const [settings, setSettings] = useState<any>({
    studioName: 'SHIV STUDIO',
    logoUrl: ''
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settingsSnap = await getDoc(doc(db, 'website_settings', 'studio'));
        if (settingsSnap.exists()) {
          setSettings((prev: any) => ({ ...prev, ...settingsSnap.data() }));
        }
      } catch {
        // Fallback to defaults silently
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

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
    { name: 'Services', path: '/services' },
    { name: 'Portfolio', path: '/gallery' },
    { name: 'Packages', path: '/packages' },
    { name: 'Frames & Gifts', path: '/store' },
    { name: 'Contact', path: '/contact' }
  ];

  const isAdminUser = isAdminRoleValue(userProfile?.role);
  const dashboardRoute = isAdminUser ? '/admin/dashboard' : '/customer/dashboard';

  return (
    <>
      <OfferBannerDisplay position="sticky_announcement" />
      <header className="sticky top-0 z-50 bg-[#111111]/95 backdrop-blur-md border-b border-white/10 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Brand Logo */}
            <Link to="/" className="flex items-center space-x-3 shrink-0">
              <img
                src={settings.logoUrl || STUDIO_IMAGES.logo}
                alt={settings.studioName || 'SHIV STUDIO'}
                className="h-9 w-9 object-cover rounded-full border border-[#D4AF37]/50"
                referrerPolicy="no-referrer"
              />
              <div className="leading-none">
                <span className="font-display font-bold text-xl tracking-wider text-white uppercase whitespace-nowrap block">
                  {settings.studioName || 'SHIV STUDIO'}
                </span>
                <span className="text-[10px] tracking-[0.22em] text-[#D4AF37] uppercase font-sans hidden sm:block whitespace-nowrap">
                  Arvind Creation
                </span>
              </div>
            </Link>

            {/* Primary Navigation Links */}
            <nav className="hidden lg:flex items-center space-x-6" aria-label="Main navigation">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`text-xs font-medium tracking-wider uppercase transition-colors whitespace-nowrap shrink-0 ${
                    isActive(link.path)
                      ? 'text-[#D4AF37]'
                      : 'text-neutral-300 hover:text-white'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </nav>

            {/* Right Actions */}
            <div className="hidden lg:flex items-center space-x-3 shrink-0">
              <Link
                to="/cart"
                className="relative p-2 text-neutral-300 hover:text-[#D4AF37] transition-colors shrink-0"
                aria-label="Shopping Cart"
              >
                <ShoppingCart className="h-4.5 w-4.5" />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-[#111111] bg-[#D4AF37] rounded-full tabular-nums">
                    {cartCount}
                  </span>
                )}
              </Link>

              {currentUser ? (
                <div className="flex items-center space-x-2">
                  <Link
                    to={dashboardRoute}
                    className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-[#1A1A1A] hover:bg-white/10 text-white border border-white/10 text-xs font-medium transition-colors whitespace-nowrap shrink-0"
                  >
                    <LayoutDashboard className="h-3.5 w-3.5 text-[#D4AF37]" />
                    <span>{isAdminUser ? 'Admin Studio' : 'My Portal'}</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="p-2 text-neutral-400 hover:text-rose-400 transition-colors shrink-0"
                    title="Logout"
                    aria-label="Logout"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="p-2 text-neutral-300 hover:text-[#D4AF37] transition-colors shrink-0"
                  title="Sign In"
                  aria-label="Sign In"
                >
                  <User className="h-4.5 w-4.5" />
                </Link>
              )}

              <Link
                to="/booking"
                className="px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-[#111111] bg-[#D4AF37] hover:bg-[#E5C158] rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                Book Now
              </Link>
            </div>

            {/* Mobile Controls */}
            <div className="flex lg:hidden items-center space-x-3">
              <Link
                to="/booking"
                className="px-3.5 py-2 text-[11px] font-semibold uppercase tracking-wider text-[#111111] bg-[#D4AF37] rounded-lg whitespace-nowrap shrink-0"
              >
                Book Now
              </Link>
              <Link
                to="/cart"
                className="relative p-2 text-neutral-300 hover:text-[#D4AF37] transition-colors"
                aria-label="Shopping Cart"
              >
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-[#111111] bg-[#D4AF37] rounded-full tabular-nums">
                    {cartCount}
                  </span>
                )}
              </Link>
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 rounded-lg text-neutral-300 hover:text-white hover:bg-[#1A1A1A] transition-colors"
                aria-label="Toggle Menu"
              >
                {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Drawer */}
        {isOpen && (
          <div className="lg:hidden bg-[#111111] border-t border-white/10 px-4 py-4 space-y-1.5">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive(link.path)
                    ? 'bg-[#1A1A1A] text-[#D4AF37]'
                    : 'text-neutral-300 hover:bg-[#1A1A1A] hover:text-white'
                }`}
              >
                {link.name}
              </Link>
            ))}

            <div className="pt-3 mt-3 border-t border-white/10 grid grid-cols-2 gap-2 text-xs">
              <Link
                to="/wedding-cards"
                onClick={() => setIsOpen(false)}
                className="px-3 py-2.5 rounded-lg bg-[#1A1A1A] text-neutral-200 hover:text-[#D4AF37] text-center"
              >
                Wedding Cards
              </Link>
              <Link
                to="/track-order"
                onClick={() => setIsOpen(false)}
                className="px-3 py-2.5 rounded-lg bg-[#1A1A1A] text-neutral-200 hover:text-[#D4AF37] text-center"
              >
                Track Order
              </Link>
            </div>

            <div className="pt-2 space-y-2">
              {currentUser ? (
                <>
                  <Link
                    to={dashboardRoute}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-center space-x-2 w-full py-2.5 rounded-lg bg-[#1A1A1A] border border-[#D4AF37]/30 text-[#D4AF37] text-xs font-semibold"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    <span>{isAdminUser ? 'Open Admin Studio' : 'My Customer Portal'}</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center justify-center space-x-2 w-full py-2.5 rounded-lg text-rose-400 hover:bg-rose-500/10 text-xs font-medium"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-center space-x-2 w-full py-2.5 rounded-lg border border-white/15 text-neutral-200 text-xs font-semibold"
                >
                  <User className="h-4 w-4 text-[#D4AF37]" />
                  <span>Client / Admin Sign In</span>
                </Link>
              )}

              <Link
                to="/booking"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-center space-x-2 w-full py-3 rounded-lg bg-[#D4AF37] text-[#111111] text-xs font-semibold uppercase tracking-wider"
              >
                <CalendarDays className="h-4 w-4" />
                <span>Book a Shoot</span>
              </Link>
            </div>
          </div>
        )}
      </header>
    </>
  );
};
