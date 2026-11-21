import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth, isAdminRoleValue } from '../context/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { STUDIO_IMAGES } from '../assets/studioAssets';
import { applyImageFallback, resolveMediaUrl } from '../utils/mediaResolver';
import { OfferBannerDisplay } from './OfferBannerDisplay';
import {
  Menu,
  X,
  ShoppingCart,
  LogOut,
  LayoutDashboard,
  User,
  CalendarDays,
  ChevronDown,
  Image as ImageIcon,
  Layers
} from 'lucide-react';

interface NavbarProps {
  cartCount: number;
  wishlistCount?: number;
}

interface ServiceDropdownItem {
  label: string;
  description: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  matchPaths?: string[];
}

const SERVICE_DROPDOWN_ITEMS: ServiceDropdownItem[] = [
  {
    label: 'Portfolio / Gallery',
    description: 'Curated showcase & visual reels',
    path: '/gallery',
    icon: ImageIcon,
    matchPaths: ['/gallery', '/portfolio']
  },
  {
    label: 'Packages & Pricing',
    description: 'Photography & cinema plans',
    path: '/packages',
    icon: Layers
  }
];

export const Navbar: React.FC<NavbarProps> = ({ cartCount }) => {
  const { currentUser, userProfile, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [servicesDropdownOpen, setServicesDropdownOpen] = useState(false);
  const [mobileServicesOpen, setMobileServicesOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const dropdownContainerRef = useRef<HTMLDivElement>(null);
  const closeHoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Close menus whenever navigation location changes
  useEffect(() => {
    setServicesDropdownOpen(false);
    setIsOpen(false);
    setMobileServicesOpen(false);
  }, [location.pathname, location.search]);

  // Close desktop Services dropdown on click outside or Escape key
  useEffect(() => {
    const handlePointerDownOutside = (event: MouseEvent | TouchEvent) => {
      if (
        dropdownContainerRef.current &&
        !dropdownContainerRef.current.contains(event.target as Node)
      ) {
        setServicesDropdownOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setServicesDropdownOpen(false);
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDownOutside);
    document.addEventListener('touchstart', handlePointerDownOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDownOutside);
      document.removeEventListener('touchstart', handlePointerDownOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (closeHoverTimerRef.current) {
        clearTimeout(closeHoverTimerRef.current);
      }
    };
  }, []);

  const handleDesktopMouseEnter = () => {
    if (closeHoverTimerRef.current) {
      clearTimeout(closeHoverTimerRef.current);
      closeHoverTimerRef.current = null;
    }
    setServicesDropdownOpen(true);
  };

  const handleDesktopMouseLeave = () => {
    if (closeHoverTimerRef.current) {
      clearTimeout(closeHoverTimerRef.current);
    }
    closeHoverTimerRef.current = setTimeout(() => {
      setServicesDropdownOpen(false);
    }, 150);
  };

  const handleLogout = async () => {
    try {
      await logout();
      setIsOpen(false);
      setServicesDropdownOpen(false);
      navigate('/');
    } catch (err) {
      console.error(err);
    }
  };

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  const isFramesGiftsActive =
    location.pathname.startsWith('/store') || location.pathname.startsWith('/photo-frames-gifts');

  const isServicesSectionActive =
    location.pathname.startsWith('/gallery') ||
    location.pathname.startsWith('/portfolio') ||
    location.pathname.startsWith('/packages') ||
    location.pathname.startsWith('/services');

  const isDropdownItemActive = (item: ServiceDropdownItem) => {
    if (item.matchPaths && item.matchPaths.some((p) => location.pathname.startsWith(p))) {
      return true;
    }
    return location.pathname.startsWith(item.path);
  };

  const isAdminUser = isAdminRoleValue(userProfile?.role);
  const dashboardRoute = isAdminUser ? '/admin/dashboard' : '/customer/dashboard';

  return (
    <>
      <OfferBannerDisplay position="sticky_announcement" />
      <header className="sticky top-0 z-50 bg-[#111111]/95 backdrop-blur-md border-b border-white/10 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-3 sm:gap-4">
            {/* Brand Logo */}
            <Link to="/" className="flex items-center space-x-2.5 sm:space-x-3 shrink-0 min-w-0">
              <img
                src={resolveMediaUrl(settings.logoUrl, STUDIO_IMAGES.logo)}
                alt={settings.studioName || 'SHIV STUDIO'}
                className="h-8 w-8 sm:h-9 sm:w-9 object-cover rounded-full border border-[#D4AF37]/50 shrink-0"
                referrerPolicy="no-referrer"
                onError={(e) => applyImageFallback(e, STUDIO_IMAGES.logo)}
              />
              <div className="leading-none min-w-0">
                <span className="font-display font-bold text-base sm:text-xl tracking-wider text-white uppercase whitespace-nowrap block truncate">
                  {settings.studioName || 'SHIV STUDIO'}
                </span>
                <span className="text-[9px] sm:text-[10px] tracking-[0.22em] text-[#D4AF37] uppercase font-sans hidden sm:block whitespace-nowrap">
                  Arvind Creation
                </span>
              </div>
            </Link>

            {/* Primary Navigation Links (Desktop) */}
            <nav className="hidden lg:flex items-center space-x-4 xl:space-x-6" aria-label="Main navigation">
              <Link
                to="/"
                className={`text-xs font-medium tracking-wider uppercase transition-colors whitespace-nowrap shrink-0 ${
                  isActive('/') ? 'text-[#D4AF37]' : 'text-neutral-300 hover:text-white'
                }`}
              >
                Home
              </Link>

              {/* SERVICES Dropdown (Contains ONLY Portfolio / Gallery and Packages & Pricing) */}
              <div
                ref={dropdownContainerRef}
                className="relative"
                onMouseEnter={handleDesktopMouseEnter}
                onMouseLeave={handleDesktopMouseLeave}
              >
                <button
                  type="button"
                  onClick={() => setServicesDropdownOpen((prev) => !prev)}
                  aria-haspopup="true"
                  aria-expanded={servicesDropdownOpen}
                  className={`inline-flex items-center gap-1 text-xs font-medium tracking-wider uppercase transition-colors whitespace-nowrap shrink-0 py-2 cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-[#D4AF37] rounded ${
                    isServicesSectionActive || servicesDropdownOpen
                      ? 'text-[#D4AF37]'
                      : 'text-neutral-300 hover:text-white'
                  }`}
                >
                  <span>Services</span>
                  <ChevronDown
                    className={`h-3.5 w-3.5 transition-transform duration-200 ease-out ${
                      servicesDropdownOpen ? 'rotate-180 text-[#D4AF37]' : ''
                    }`}
                  />
                </button>

                {/* Dropdown Panel */}
                <div
                  role="menu"
                  aria-label="Services menu"
                  className={`absolute left-1/2 -translate-x-1/2 top-full pt-2 w-64 max-w-[calc(100vw-2rem)] transition-all duration-200 ease-out origin-top ${
                    servicesDropdownOpen
                      ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto visible'
                      : 'opacity-0 -translate-y-2 scale-[0.98] pointer-events-none invisible'
                  }`}
                >
                  <div className="bg-[#111111]/98 backdrop-blur-xl border border-[#D4AF37]/25 rounded-xl shadow-2xl shadow-black/90 p-2 space-y-1">
                    {SERVICE_DROPDOWN_ITEMS.map((item) => {
                      const Icon = item.icon;
                      const active = isDropdownItemActive(item);
                      return (
                        <Link
                          key={item.label}
                          role="menuitem"
                          to={item.path}
                          onClick={() => setServicesDropdownOpen(false)}
                          className={`group flex items-start gap-3 px-3 py-2.5 rounded-lg border transition-all duration-150 ${
                            active
                              ? 'bg-[#1A1A1A] border-[#D4AF37]/40 text-[#D4AF37]'
                              : 'border-transparent hover:bg-[#1A1A1A] hover:border-[#D4AF37]/20 text-neutral-200'
                          }`}
                        >
                          <div
                            className={`mt-0.5 p-1.5 rounded-lg shrink-0 transition-colors ${
                              active
                                ? 'bg-[#D4AF37]/15 text-[#D4AF37]'
                                : 'bg-white/5 text-neutral-400 group-hover:text-[#D4AF37] group-hover:bg-[#D4AF37]/10'
                            }`}
                          >
                            <Icon className="h-3.5 w-3.5" />
                          </div>
                          <div className="min-w-0">
                            <span
                              className={`block text-xs font-semibold tracking-wide transition-colors whitespace-nowrap ${
                                active ? 'text-[#D4AF37]' : 'text-white group-hover:text-[#D4AF37]'
                              }`}
                            >
                              {item.label}
                            </span>
                            <span className="block text-[11px] text-neutral-500 group-hover:text-neutral-400 truncate">
                              {item.description}
                            </span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>

              <Link
                to="/wedding-cards"
                className={`text-xs font-medium tracking-wider uppercase transition-colors whitespace-nowrap shrink-0 ${
                  isActive('/wedding-cards') ? 'text-[#D4AF37]' : 'text-neutral-300 hover:text-white'
                }`}
              >
                Wedding Cards
              </Link>

              <Link
                to="/store"
                className={`text-xs font-medium tracking-wider uppercase transition-colors whitespace-nowrap shrink-0 ${
                  isFramesGiftsActive ? 'text-[#D4AF37]' : 'text-neutral-300 hover:text-white'
                }`}
              >
                Frames &amp; Gifts
              </Link>

              <Link
                to="/about"
                className={`text-xs font-medium tracking-wider uppercase transition-colors whitespace-nowrap shrink-0 ${
                  isActive('/about') ? 'text-[#D4AF37]' : 'text-neutral-300 hover:text-white'
                }`}
              >
                About
              </Link>

              <Link
                to="/contact"
                className={`text-xs font-medium tracking-wider uppercase transition-colors whitespace-nowrap shrink-0 ${
                  isActive('/contact') ? 'text-[#D4AF37]' : 'text-neutral-300 hover:text-white'
                }`}
              >
                Contact
              </Link>
            </nav>

            {/* Right Actions (Desktop) */}
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
            <div className="flex lg:hidden items-center space-x-2 sm:space-x-3 shrink-0">
              <Link
                to="/booking"
                className="px-3 sm:px-3.5 py-2 text-[11px] font-semibold uppercase tracking-wider text-[#111111] bg-[#D4AF37] hover:bg-[#E5C158] rounded-lg whitespace-nowrap shrink-0"
              >
                Book Now
              </Link>
              <Link
                to="/cart"
                className="relative p-2 text-neutral-300 hover:text-[#D4AF37] transition-colors shrink-0"
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
                type="button"
                onClick={() => setIsOpen((prev) => !prev)}
                className="p-2 rounded-lg text-neutral-300 hover:text-white hover:bg-[#1A1A1A] transition-colors shrink-0"
                aria-label="Toggle Menu"
                aria-expanded={isOpen}
              >
                {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Drawer */}
        {isOpen && (
          <div className="lg:hidden bg-[#111111] border-t border-white/10 px-4 py-4 space-y-1.5 max-h-[calc(100vh-4rem)] overflow-y-auto overflow-x-hidden">
            <Link
              to="/"
              onClick={() => setIsOpen(false)}
              className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive('/')
                  ? 'bg-[#1A1A1A] text-[#D4AF37]'
                  : 'text-neutral-300 hover:bg-[#1A1A1A] hover:text-white'
              }`}
            >
              Home
            </Link>

            {/* Tap-to-Expand Services Accordion (ONLY Portfolio / Gallery and Packages & Pricing) */}
            <div className="rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => setMobileServicesOpen((prev) => !prev)}
                aria-expanded={mobileServicesOpen}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isServicesSectionActive || mobileServicesOpen
                    ? 'bg-[#1A1A1A] text-[#D4AF37]'
                    : 'text-neutral-300 hover:bg-[#1A1A1A] hover:text-white'
                }`}
              >
                <span>Services</span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-200 ease-out ${
                    mobileServicesOpen ? 'rotate-180 text-[#D4AF37]' : ''
                  }`}
                />
              </button>

              <div
                className={`grid transition-[grid-template-rows,opacity] duration-200 ease-out ${
                  mobileServicesOpen ? 'grid-rows-[1fr] opacity-100 mt-1' : 'grid-rows-[0fr] opacity-0'
                }`}
              >
                <div className="overflow-hidden">
                  <div className="pl-3 pr-1 py-1 space-y-1 border-l border-[#D4AF37]/30 ml-3">
                    {SERVICE_DROPDOWN_ITEMS.map((item) => {
                      const Icon = item.icon;
                      const active = isDropdownItemActive(item);
                      return (
                        <Link
                          key={item.label}
                          to={item.path}
                          onClick={() => {
                            setMobileServicesOpen(false);
                            setIsOpen(false);
                          }}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors min-h-[40px] ${
                            active
                              ? 'bg-[#1A1A1A] text-[#D4AF37]'
                              : 'text-neutral-300 hover:bg-[#1A1A1A] hover:text-white'
                          }`}
                        >
                          <Icon
                            className={`h-3.5 w-3.5 shrink-0 ${
                              active ? 'text-[#D4AF37]' : 'text-neutral-400'
                            }`}
                          />
                          <span className="truncate">{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <Link
              to="/wedding-cards"
              onClick={() => setIsOpen(false)}
              className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive('/wedding-cards')
                  ? 'bg-[#1A1A1A] text-[#D4AF37]'
                  : 'text-neutral-300 hover:bg-[#1A1A1A] hover:text-white'
              }`}
            >
              Wedding Cards
            </Link>

            <Link
              to="/store"
              onClick={() => setIsOpen(false)}
              className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isFramesGiftsActive
                  ? 'bg-[#1A1A1A] text-[#D4AF37]'
                  : 'text-neutral-300 hover:bg-[#1A1A1A] hover:text-white'
              }`}
            >
              Frames &amp; Gifts
            </Link>

            <Link
              to="/about"
              onClick={() => setIsOpen(false)}
              className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive('/about')
                  ? 'bg-[#1A1A1A] text-[#D4AF37]'
                  : 'text-neutral-300 hover:bg-[#1A1A1A] hover:text-white'
              }`}
            >
              About
            </Link>

            <Link
              to="/contact"
              onClick={() => setIsOpen(false)}
              className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive('/contact')
                  ? 'bg-[#1A1A1A] text-[#D4AF37]'
                  : 'text-neutral-300 hover:bg-[#1A1A1A] hover:text-white'
              }`}
            >
              Contact
            </Link>

            <div className="pt-3 mt-3 border-t border-white/10 space-y-2">
              <Link
                to="/track-order"
                onClick={() => setIsOpen(false)}
                className="block px-3 py-2.5 rounded-lg bg-[#1A1A1A] text-neutral-200 hover:text-[#D4AF37] text-xs font-medium text-center"
              >
                Track Order
              </Link>

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
                className="flex items-center justify-center space-x-2 w-full py-3 rounded-lg bg-[#D4AF37] hover:bg-[#E5C158] text-[#111111] text-xs font-semibold uppercase tracking-wider transition-colors"
              >
                <CalendarDays className="h-4 w-4" />
                <span>Book Now</span>
              </Link>
            </div>
          </div>
        )}
      </header>
    </>
  );
};
