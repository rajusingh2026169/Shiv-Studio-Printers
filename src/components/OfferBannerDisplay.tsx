import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Tag, 
  Clock, 
  Copy, 
  Check, 
  X, 
  Sparkles, 
  ArrowRight,
  Gift
} from 'lucide-react';
import { OfferBanner, BannerDisplayPosition } from '../types';
import { getActiveOfferBanners } from '../utils/bannerService';

interface OfferBannerDisplayProps {
  position: BannerDisplayPosition;
  className?: string;
}

interface CountdownState {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
}

export const OfferBannerDisplay: React.FC<OfferBannerDisplayProps> = ({ 
  position, 
  className = '' 
}) => {
  const [banners, setBanners] = useState<OfferBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadBanners = async () => {
      try {
        const active = await getActiveOfferBanners(position);
        if (isMounted) {
          setBanners(active);
        }
      } catch (err) {
        console.warn(`Error loading banners for position ${position}:`, err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadBanners();

    // Refresh active banners every 30 seconds to automatically prune expired ones
    const interval = setInterval(loadBanners, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [position]);

  // Auto-play slider if multiple banners
  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [banners.length]);

  if (loading || banners.length === 0 || dismissed) {
    return null; // Return null when no active banner exists to preserve original page structure
  }

  const currentBanner = banners[currentIndex];

  const handleCopyCoupon = (e: React.MouseEvent, code: string) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const nextBanner = () => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  const prevBanner = () => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  // Render variant for Sticky Announcement Bar
  if (position === 'sticky_announcement') {
    return (
      <div className={`bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 font-sans shadow-lg relative z-40 ${className}`}>
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between text-xs sm:text-sm font-medium">
          <div className="flex items-center space-x-2 overflow-hidden text-ellipsis whitespace-nowrap">
            <span className="bg-slate-950 text-amber-400 text-xxs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 flex items-center space-x-1">
              <Sparkles className="h-3 w-3" />
              <span>Offer</span>
            </span>
            <span className="font-bold truncate">{currentBanner.title}</span>
            {currentBanner.subtitle && (
              <span className="hidden md:inline text-slate-800 font-normal">
                — {currentBanner.subtitle}
              </span>
            )}
            {currentBanner.couponCode && (
              <button
                type="button"
                onClick={(e) => handleCopyCoupon(e, currentBanner.couponCode!)}
                className="bg-slate-950/10 hover:bg-slate-950/20 text-slate-950 px-2 py-0.5 rounded font-mono text-xxs font-bold flex items-center space-x-1 border border-slate-950/20 shrink-0"
              >
                <Tag className="h-3 w-3" />
                <span>{currentBanner.couponCode}</span>
                {copiedCode === currentBanner.couponCode ? (
                  <Check className="h-3 w-3 text-emerald-700" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </button>
            )}
          </div>

          <div className="flex items-center space-x-3 shrink-0 pl-2">
            {currentBanner.buttonText && currentBanner.buttonLink && (
              <a
                href={currentBanner.buttonLink}
                className="bg-slate-950 text-white hover:bg-slate-900 px-3 py-1 rounded-full text-xs font-bold transition-all shadow-sm flex items-center space-x-1"
              >
                <span>{currentBanner.buttonText}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </a>
            )}

            <button
              type="button"
              onClick={() => setDismissed(true)}
              className="p-1 hover:bg-slate-950/10 rounded-full transition-colors text-slate-900"
              title="Close Banner"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Standard Banner Layout (Top Banner, Hero Banner, Store Banner, etc.)
  return (
    <div className={`relative overflow-hidden rounded-3xl shadow-2xl border border-slate-800 my-4 ${className}`}>
      
      {/* Background Media: Video or Responsive Desktop/Mobile Images */}
      <div className="absolute inset-0 z-0 bg-slate-950">
        {currentBanner.backgroundVideoUrl ? (
          <video
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            className="w-full h-full object-cover opacity-40"
          >
            <source src={currentBanner.backgroundVideoUrl} type="video/mp4" />
          </video>
        ) : (
          <picture className="w-full h-full block">
            {currentBanner.mobileImageUrl && (
              <source media="(max-width: 767px)" srcSet={currentBanner.mobileImageUrl} />
            )}
            <img
              src={currentBanner.desktopImageUrl}
              alt={currentBanner.title}
              className="w-full h-full object-cover opacity-60 transition-all duration-700 hover:scale-105"
              loading="lazy"
            />
          </picture>
        )}
        {/* Gradient overlays for crisp text legibility */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent" />
      </div>

      {/* Foreground Content */}
      <div className="relative z-10 p-6 sm:p-10 lg:p-12 flex flex-col justify-between min-h-[220px] sm:min-h-[280px]">
        
        {/* Header Tag & Slider Navigation Controls */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="bg-amber-500 text-slate-950 font-black text-xxs tracking-wider uppercase px-3 py-1 rounded-full flex items-center space-x-1.5 shadow-md">
              <Gift className="h-3.5 w-3.5" />
              <span>{currentBanner.subtitle || 'EXCLUSIVE OFFER'}</span>
            </span>

            {currentBanner.couponCode && (
              <button
                type="button"
                onClick={(e) => handleCopyCoupon(e, currentBanner.couponCode!)}
                className="bg-slate-900/90 hover:bg-slate-850 text-amber-400 border border-amber-500/30 px-3 py-1 rounded-full text-xs font-mono font-bold flex items-center space-x-1.5 transition-all shadow-lg"
              >
                <Tag className="h-3.5 w-3.5" />
                <span>CODE: {currentBanner.couponCode}</span>
                {copiedCode === currentBanner.couponCode ? (
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <Copy className="h-3.5 w-3.5 text-slate-400" />
                )}
              </button>
            )}
          </div>

          {/* Slider Controls (if > 1 banner) */}
          {banners.length > 1 && (
            <div className="flex items-center space-x-2 bg-slate-950/70 p-1 rounded-full border border-slate-800">
              <button
                type="button"
                onClick={prevBanner}
                className="p-1.5 rounded-full text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                title="Previous Offer"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-xxs font-mono text-slate-400 px-1">
                {currentIndex + 1}/{banners.length}
              </span>
              <button
                type="button"
                onClick={nextBanner}
                className="p-1.5 rounded-full text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                title="Next Offer"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Main Title & Description */}
        <div className="my-4 max-w-2xl space-y-2">
          <h2 className="text-xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight drop-shadow-md">
            {currentBanner.title}
          </h2>
          {currentBanner.description && (
            <p className="text-slate-300 text-xs sm:text-sm line-clamp-2 leading-relaxed">
              {currentBanner.description}
            </p>
          )}
        </div>

        {/* Footer: Countdown Timer & CTA Action Button */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-2 border-t border-slate-800/80">
          
          {/* Countdown Clock */}
          {currentBanner.showCountdown && currentBanner.validUntil && (
            <BannerCountdown validUntil={currentBanner.validUntil} />
          )}

          {/* Call to Action Button */}
          {currentBanner.buttonText && (
            <a
              href={currentBanner.buttonLink || '#'}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-6 py-3 rounded-2xl text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-xl hover:shadow-amber-500/20 transition-all transform hover:-translate-y-0.5 self-start sm:self-auto"
            >
              <span>{currentBanner.buttonText}</span>
              <ArrowRight className="h-4 w-4" />
            </a>
          )}
        </div>
      </div>

      {/* Dots Indicator for Carousel Slider */}
      {banners.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex items-center space-x-1.5">
          {banners.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              className={`h-1.5 rounded-full transition-all ${
                idx === currentIndex ? 'w-6 bg-amber-500' : 'w-1.5 bg-slate-700'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Real-time Countdown Timer Component
 */
const BannerCountdown: React.FC<{ validUntil: string }> = ({ validUntil }) => {
  const [countdown, setCountdown] = useState<CountdownState>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false
  });

  useEffect(() => {
    const updateTime = () => {
      const target = new Date(validUntil).getTime();
      const now = new Date().getTime();
      const diff = target - now;

      if (diff <= 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setCountdown({ days, hours, minutes, seconds, isExpired: false });
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, [validUntil]);

  if (countdown.isExpired) {
    return (
      <div className="flex items-center space-x-2 text-red-400 text-xs font-semibold">
        <Clock className="h-4 w-4" />
        <span>Offer Expired</span>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="text-xxs font-bold text-amber-400 uppercase tracking-wider flex items-center space-x-1">
        <Clock className="h-3 w-3" />
        <span>Offer Ends In:</span>
      </div>
      <div className="flex items-center space-x-1.5 font-mono text-xs">
        <div className="bg-slate-900/90 border border-slate-800 px-2 py-1 rounded-lg text-center min-w-[36px]">
          <span className="font-bold text-white text-sm block">{String(countdown.days).padStart(2, '0')}</span>
          <span className="text-[9px] text-slate-400 block uppercase">Days</span>
        </div>
        <span className="text-amber-500 font-bold">:</span>
        <div className="bg-slate-900/90 border border-slate-800 px-2 py-1 rounded-lg text-center min-w-[36px]">
          <span className="font-bold text-white text-sm block">{String(countdown.hours).padStart(2, '0')}</span>
          <span className="text-[9px] text-slate-400 block uppercase">Hours</span>
        </div>
        <span className="text-amber-500 font-bold">:</span>
        <div className="bg-slate-900/90 border border-slate-800 px-2 py-1 rounded-lg text-center min-w-[36px]">
          <span className="font-bold text-white text-sm block">{String(countdown.minutes).padStart(2, '0')}</span>
          <span className="text-[9px] text-slate-400 block uppercase">Mins</span>
        </div>
        <span className="text-amber-500 font-bold">:</span>
        <div className="bg-slate-900/90 border border-slate-800 px-2 py-1 rounded-lg text-center min-w-[36px]">
          <span className="font-bold text-amber-400 text-sm block animate-pulse">{String(countdown.seconds).padStart(2, '0')}</span>
          <span className="text-[9px] text-slate-400 block uppercase">Secs</span>
        </div>
      </div>
    </div>
  );
};
