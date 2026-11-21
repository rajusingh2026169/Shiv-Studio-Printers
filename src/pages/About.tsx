import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { STUDIO_IMAGES } from '../assets/studioAssets';
import { resolveMediaUrl, applyImageFallback } from '../utils/mediaResolver';
import { WHY_CHOOSE_US_ITEMS } from '../data/studioCatalog';
import { SEOHead } from '../components/SEOHead';
import { buildWhatsAppUrl } from '../components/WhatsAppButton';
import { ArrowRight, MapPin, Instagram, Check, Camera } from 'lucide-react';

export const About: React.FC = () => {
  const [settings, setSettings] = useState<any>({
    studioName: 'SHIV STUDIO',
    tagline: 'Capturing Moments, Creating Memories.',
    creativeBrand: 'Arvind Creation',
    instagramHandle: 'Shiv_photography_officel',
    instagramUrl: 'https://www.instagram.com/Shiv_photography_officel/',
    address: 'Kishanpur Road Over Bridge, Khaga, Fatehpur, Uttar Pradesh, India – 212655',
    aboutTitle: 'Crafting Timeless Visual Legacy in Khaga, Fatehpur',
    aboutDescription:
      'SHIV STUDIO is an established photography, cinematic filmmaking, album design, and custom print house in Khaga, Fatehpur. Together with our creative division Arvind Creation, we pair calibrated full-frame cameras and aerial cinema rigs with museum-grade photo frames and bespoke albums.',
    aboutImageUrl: STUDIO_IMAGES.studioPortrait,
    whatsappNumber: '+917905256355',
    team: []
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const snap = await getDoc(doc(db, 'website_settings', 'studio'));
        if (snap.exists()) {
          setSettings((prev: any) => ({ ...prev, ...snap.data() }));
        }
      } catch {
        // Use defaults cleanly
      }
    };
    fetchSettings();
  }, []);

  const waUrl = buildWhatsAppUrl(
    settings.whatsappNumber || '+917905256355',
    'Hello SHIV STUDIO, I would like to learn more about your photography and creative services.'
  );

  return (
    <div className="bg-[#111111] text-white min-h-screen">
      <SEOHead
        title="About Us — SHIV STUDIO & Arvind Creation | Khaga, Fatehpur"
        description="Discover SHIV STUDIO and creative brand Arvind Creation in Khaga, Fatehpur, Uttar Pradesh — fine-art wedding photography, cinematic films, album design, and custom printing."
        canonicalPath="/about"
      />

      {/* Editorial Hero Split */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-6">
            <p className="text-xs uppercase tracking-[0.25em] text-[#D4AF37] font-semibold">
              {settings.creativeBrand || 'Arvind Creation'} • Khaga, Fatehpur
            </p>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-semibold text-white leading-[1.08]">
              {settings.aboutTitle}
            </h1>
            <p className="text-sm sm:text-base text-neutral-300 leading-relaxed">
              {settings.aboutDescription}
            </p>
            <p className="text-sm text-neutral-400 leading-relaxed">
              From intimate ring ceremonies and joyful newborn sessions to multi-day wedding cinema, custom Karizma album design, graphic stationery, and wall framing — every deliverable is produced in-house with disciplined color accuracy.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                to="/booking"
                className="px-6 py-3.5 bg-[#D4AF37] hover:bg-[#E5C158] text-[#111111] font-semibold text-xs uppercase tracking-wider rounded-lg transition-colors inline-flex items-center gap-2"
              >
                <span>Book a Consultation</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3.5 bg-[#1A1A1A] hover:bg-white/10 border border-white/15 text-white font-semibold text-xs uppercase tracking-wider rounded-lg transition-colors"
              >
                WhatsApp Studio
              </a>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="rounded-2xl overflow-hidden border border-white/10 bg-[#1A1A1A] aspect-[4/3]">
              <img
                src={resolveMediaUrl(settings.aboutImageUrl, STUDIO_IMAGES.studioPortrait)}
                alt="SHIV STUDIO creative photography and editing studio in Khaga"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                onError={(e) => applyImageFallback(e, STUDIO_IMAGES.studioPortrait)}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Grid */}
      <section className="bg-[#1A1A1A] border-y border-white/10 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="max-w-2xl space-y-3">
            <p className="text-xs uppercase tracking-[0.22em] text-[#D4AF37] font-semibold">
              Our Craft Standard
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold text-white">
              Why Families & Brands Choose SHIV STUDIO
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {WHY_CHOOSE_US_ITEMS.map((item) => (
              <div
                key={item.title}
                className="p-6 rounded-xl bg-[#111111] border border-white/10 space-y-3"
              >
                <div className="h-8 w-8 rounded-lg bg-[#D4AF37]/15 text-[#D4AF37] flex items-center justify-center">
                  <Check className="h-4 w-4" />
                </div>
                <h3 className="font-sans text-base font-semibold text-white">{item.title}</h3>
                <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dynamic Team Section (if configured by Admin) */}
      {Array.isArray(settings.team) && settings.team.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 space-y-10">
          <div className="max-w-2xl space-y-2">
            <p className="text-xs uppercase tracking-[0.22em] text-[#D4AF37] font-semibold">
              Creative Leadership
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold text-white">
              The Team Behind {settings.creativeBrand || 'Arvind Creation'}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {settings.team.map((member: any, idx: number) => (
              <div
                key={member.id || idx}
                className="bg-[#1A1A1A] border border-white/10 rounded-xl overflow-hidden"
              >
                <div className="aspect-[4/3] bg-[#111111]">
                  {member.image ? (
                    <img
                      src={resolveMediaUrl(member.image, STUDIO_IMAGES.studioPortrait)}
                      alt={member.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                      onError={(e) => applyImageFallback(e, STUDIO_IMAGES.studioPortrait)}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-600">
                      <Camera className="h-10 w-10" />
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="text-base font-semibold text-white">{member.name}</h3>
                  <p className="text-xs text-[#D4AF37] uppercase tracking-wider mt-1">
                    {member.role}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Location & Social Footer Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-[#1A1A1A] border border-white/10 rounded-2xl p-8 sm:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[#D4AF37] text-xs font-semibold uppercase tracking-wider">
              <MapPin className="h-4 w-4" />
              <span>Visit Our Khaga Studio</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-semibold text-white">
              {settings.address}
            </h2>
            <p className="text-xs text-neutral-400">
              Follow daily behind-the-scenes stories on Instagram{' '}
              <a
                href={settings.instagramUrl || 'https://www.instagram.com/Shiv_photography_officel/'}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#D4AF37] hover:underline inline-flex items-center gap-1"
              >
                <Instagram className="h-3.5 w-3.5" />
                <span>@{settings.instagramHandle || 'Shiv_photography_officel'}</span>
              </a>
            </p>
          </div>
          <Link
            to="/services"
            className="px-6 py-3 bg-[#D4AF37] hover:bg-[#E5C158] text-[#111111] font-semibold text-xs uppercase tracking-wider rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            Explore Services
          </Link>
        </div>
      </section>
    </div>
  );
};
