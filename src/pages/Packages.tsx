import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { PackageItem } from '../types';
import { getDefaultPackagesForSeed } from '../data/studioCatalog';
import { SEOHead } from '../components/SEOHead';
import { buildWhatsAppUrl } from '../components/WhatsAppButton';
import { getImageForSlugOrCategory } from '../assets/studioAssets';
import { Check, Clock, Image as ImageIcon, Film, BookOpen, Frame, MessageCircle, CalendarDays } from 'lucide-react';

const PACKAGE_CATEGORIES = [
  'All',
  'Wedding',
  'Pre-Wedding',
  'Engagement & Ring Ceremony',
  'Birthday',
  'Maternity & Baby Photography',
  'Event Photography'
];

export const Packages: React.FC = () => {
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [loading, setLoading] = useState(true);
  const [whatsappNumber, setWhatsappNumber] = useState('+917905256355');

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'packages'),
      (snap) => {
        const list = snap.docs
          .map((d) => ({ id: d.id, ...d.data() } as PackageItem))
          .filter((p) => p.isPublished !== false)
          .sort((a, b) => (a.order || 99) - (b.order || 99));
        setPackages(list.length > 0 ? list : getDefaultPackagesForSeed());
        setLoading(false);
      },
      () => {
        setPackages(getDefaultPackagesForSeed());
        setLoading(false);
      }
    );

    getDoc(doc(db, 'website_settings', 'studio'))
      .then((snap) => {
        if (snap.exists() && snap.data().whatsappNumber) {
          setWhatsappNumber(snap.data().whatsappNumber);
        }
      })
      .catch(() => {});

    return () => unsub();
  }, []);

  const filteredPackages =
    activeCategory === 'All'
      ? packages
      : packages.filter((p) => (p.category || '').toLowerCase() === activeCategory.toLowerCase());

  return (
    <div className="bg-[#111111] text-white min-h-screen py-16 px-4 sm:px-6 lg:px-8">
      <SEOHead
        title="Packages & Pricing — SHIV STUDIO Khaga"
        description="Explore transparent wedding photography, pre-wedding, engagement, birthday, maternity, and event packages curated by SHIV STUDIO in Khaga, Fatehpur."
        canonicalPath="/packages"
      />

      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <p className="text-xs uppercase tracking-[0.25em] text-[#D4AF37] font-semibold">
            Transparent Collection Pricing
          </p>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-semibold text-white">
            Packages &amp; Pricing
          </h1>
          <p className="text-sm sm:text-base text-neutral-400 leading-relaxed">
            Every collection can be tailored to your ceremony timeline, deliverables, and print requirements in Khaga and nearby districts.
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-2 pb-6 border-b border-white/10">
          {PACKAGE_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                activeCategory === cat
                  ? 'bg-[#D4AF37] text-[#111111] font-semibold'
                  : 'bg-[#1A1A1A] text-neutral-300 hover:text-white border border-white/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Packages Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-[460px] rounded-2xl bg-[#1A1A1A] animate-pulse border border-white/10" />
            ))}
          </div>
        ) : filteredPackages.length === 0 ? (
          <div className="bg-[#1A1A1A] border border-white/10 rounded-2xl p-12 text-center max-w-xl mx-auto space-y-4">
            <h3 className="font-display text-2xl font-semibold text-white">Custom Quote Available</h3>
            <p className="text-xs sm:text-sm text-neutral-400">
              No published packages in "{activeCategory}" yet. Connect directly on WhatsApp or request a tailored booking quote.
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <Link
                to="/booking"
                className="px-5 py-2.5 bg-[#D4AF37] text-[#111111] text-xs font-semibold uppercase tracking-wider rounded-lg"
              >
                Request Custom Quote
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPackages.map((pkg) => {
              const waMessage = `Hello SHIV STUDIO, I am interested in the "${pkg.name}" (${pkg.category}) package priced at ₹${Number(pkg.price).toLocaleString('en-IN')}. Please share availability.`;
              return (
                <div
                  key={pkg.id}
                  className="bg-[#1A1A1A] border border-white/10 hover:border-[#D4AF37]/40 rounded-2xl overflow-hidden flex flex-col justify-between transition-colors"
                >
                  <div>
                    <div className="relative aspect-[4/3] overflow-hidden bg-[#111111]">
                      <img
                        src={pkg.image || getImageForSlugOrCategory(pkg.category)}
                        alt={pkg.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    <div className="p-6 space-y-4">
                      <div className="space-y-1">
                        <p className="text-[11px] uppercase tracking-[0.2em] text-[#D4AF37] font-semibold">
                          {pkg.category}
                        </p>
                        <h2 className="font-display text-2xl font-semibold text-white">
                          {pkg.name}
                        </h2>
                      </div>

                      <div className="flex items-baseline gap-2 border-y border-white/10 py-3">
                        <span className="text-2xl font-bold text-[#D4AF37] tabular-nums">
                          ₹{Number(pkg.price || 0).toLocaleString('en-IN')}
                        </span>
                        <span className="text-xs text-neutral-400">complete collection</span>
                      </div>

                      <p className="text-xs text-neutral-300 leading-relaxed">
                        {pkg.description}
                      </p>

                      <div className="space-y-2 text-xs text-neutral-300 pt-1">
                        {pkg.duration && (
                          <div className="flex items-start gap-2.5">
                            <Clock className="h-4 w-4 text-[#D4AF37] shrink-0 mt-0.5" />
                            <span>{pkg.duration}</span>
                          </div>
                        )}
                        {pkg.editedPhotosCount && (
                          <div className="flex items-start gap-2.5">
                            <ImageIcon className="h-4 w-4 text-[#D4AF37] shrink-0 mt-0.5" />
                            <span>{pkg.editedPhotosCount}</span>
                          </div>
                        )}
                        {pkg.reelsCount && (
                          <div className="flex items-start gap-2.5">
                            <Film className="h-4 w-4 text-[#D4AF37] shrink-0 mt-0.5" />
                            <span>{pkg.reelsCount}</span>
                          </div>
                        )}
                        {pkg.albumDetails && (
                          <div className="flex items-start gap-2.5">
                            <BookOpen className="h-4 w-4 text-[#D4AF37] shrink-0 mt-0.5" />
                            <span>{pkg.albumDetails}</span>
                          </div>
                        )}
                        {pkg.frameDetails && (
                          <div className="flex items-start gap-2.5">
                            <Frame className="h-4 w-4 text-[#D4AF37] shrink-0 mt-0.5" />
                            <span>{pkg.frameDetails}</span>
                          </div>
                        )}
                      </div>

                      {Array.isArray(pkg.includedServices) && pkg.includedServices.length > 0 && (
                        <ul className="pt-3 border-t border-white/10 space-y-1.5 text-xs text-neutral-400">
                          {pkg.includedServices.map((inc, i) => (
                            <li key={i} className="flex items-center gap-2">
                              <Check className="h-3.5 w-3.5 text-[#D4AF37] shrink-0" />
                              <span>{inc}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>

                  <div className="p-6 pt-0 grid grid-cols-2 gap-2.5">
                    <Link
                      to={`/booking?package=${encodeURIComponent(pkg.id)}`}
                      className="py-3 bg-[#D4AF37] hover:bg-[#E5C158] text-[#111111] font-semibold text-xs rounded-lg flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
                    >
                      <CalendarDays className="h-3.5 w-3.5" />
                      <span>Book Package</span>
                    </Link>
                    <a
                      href={buildWhatsAppUrl(whatsappNumber, waMessage)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-3 bg-[#111111] hover:bg-white/10 border border-white/15 text-white font-semibold text-xs rounded-lg flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
                    >
                      <MessageCircle className="h-3.5 w-3.5 text-[#D4AF37]" />
                      <span>Enquire</span>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
