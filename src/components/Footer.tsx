import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Instagram, ArrowUpRight } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { STUDIO_IMAGES } from '../assets/studioAssets';
import { StudioImage } from './StudioMedia';

export const Footer: React.FC = () => {
  const [settings, setSettings] = useState<any>({
    studioName: 'SHIV STUDIO',
    tagline: 'Capturing Moments, Creating Memories.',
    creativeBrand: 'Arvind Creation',
    instagramHandle: 'Shiv_photography_officel',
    instagramUrl: 'https://www.instagram.com/Shiv_photography_officel/',
    phone: '+91 7905256355, +91 8765706396',
    email: 'shivsharan52796@gmail.com',
    address: 'Kishanpur Road Over Bridge, Khaga, Fatehpur, Uttar Pradesh, India – 212655',
    footerText: ''
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settingsSnap = await getDoc(doc(db, 'website_settings', 'studio'));
        if (settingsSnap.exists()) {
          setSettings((prev: any) => ({ ...prev, ...settingsSnap.data() }));
        }
      } catch {
        // Fallback silently
      }
    };
    fetchSettings();
  }, []);

  const igUrl =
    settings.instagramUrl ||
    `https://www.instagram.com/${(settings.instagramHandle || 'Shiv_photography_officel').replace(/^@/, '')}/`;

  return (
    <footer className="bg-[#111111] text-neutral-400 border-t border-white/10 pt-16 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
        {/* Studio Brand Column */}
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <StudioImage
              src={settings.logoUrl}
              fallback={STUDIO_IMAGES.logo}
              alt={settings.studioName || 'SHIV STUDIO'}
              className="h-10 w-10 object-cover rounded-full border border-[#D4AF37]/40"
            />
            <div>
              <span className="font-display font-bold text-xl text-white tracking-wider uppercase block">
                {settings.studioName || 'SHIV STUDIO'}
              </span>
              <span className="text-[10px] tracking-[0.2em] uppercase text-[#D4AF37]">
                {settings.creativeBrand || 'Arvind Creation'}
              </span>
            </div>
          </div>

          <p className="text-xs sm:text-sm leading-relaxed text-neutral-400">
            {settings.tagline || 'Capturing Moments, Creating Memories.'} Fine-art wedding photography, cinematic videography, drone shoots, luxury albums & custom frames in Khaga, Fatehpur.
          </p>

          <a
            href={igUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-xs text-white hover:text-[#D4AF37] transition-colors pt-1"
          >
            <Instagram className="h-4 w-4 text-[#D4AF37]" />
            <span>@{settings.instagramHandle || 'Shiv_photography_officel'}</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        </div>

        {/* Photography & Cinema Services */}
        <div className="space-y-4">
          <h3 className="font-sans font-semibold text-white tracking-widest text-xs uppercase">
            Photography & Cinema
          </h3>
          <ul className="space-y-2.5 text-xs sm:text-sm">
            <li>
              <Link to="/services/wedding-photography" className="hover:text-[#D4AF37] transition-colors">
                Wedding Photography
              </Link>
            </li>
            <li>
              <Link to="/services/pre-wedding-photography" className="hover:text-[#D4AF37] transition-colors">
                Pre-Wedding Photography
              </Link>
            </li>
            <li>
              <Link to="/services/engagement-photography" className="hover:text-[#D4AF37] transition-colors">
                Engagement & Ring Ceremony
              </Link>
            </li>
            <li>
              <Link to="/services/maternity-baby-photography" className="hover:text-[#D4AF37] transition-colors">
                Maternity & Baby Portraits
              </Link>
            </li>
            <li>
              <Link to="/services/cinematic-videography" className="hover:text-[#D4AF37] transition-colors">
                Cinematic Videography
              </Link>
            </li>
            <li>
              <Link to="/services/drone-photography" className="hover:text-[#D4AF37] transition-colors">
                Drone Photography
              </Link>
            </li>
          </ul>
        </div>

        {/* Creative Services & Shop */}
        <div className="space-y-4">
          <h3 className="font-sans font-semibold text-white tracking-widest text-xs uppercase">
            Studio & Creative
          </h3>
          <ul className="space-y-2.5 text-xs sm:text-sm">
            <li>
              <Link to="/packages" className="hover:text-[#D4AF37] transition-colors">
                Packages & Pricing
              </Link>
            </li>
            <li>
              <Link to="/store" className="hover:text-[#D4AF37] transition-colors">
                Photo Frames & Gifts
              </Link>
            </li>
            <li>
              <Link to="/services/album-designing" className="hover:text-[#D4AF37] transition-colors">
                Album Designing
              </Link>
            </li>
            <li>
              <Link to="/services/graphic-designing" className="hover:text-[#D4AF37] transition-colors">
                Graphic Designing
              </Link>
            </li>
            <li>
              <Link to="/services/video-editing" className="hover:text-[#D4AF37] transition-colors">
                Video Editing
              </Link>
            </li>
            <li>
              <Link to="/wedding-cards" className="hover:text-[#D4AF37] transition-colors">
                Luxury Wedding Cards
              </Link>
            </li>
          </ul>
        </div>

        {/* Contact Info */}
        <div className="space-y-4">
          <h3 className="font-sans font-semibold text-white tracking-widest text-xs uppercase">
            Studio Address
          </h3>
          <ul className="space-y-3 text-xs sm:text-sm">
            <li className="flex items-start space-x-3">
              <MapPin className="h-4.5 w-4.5 text-[#D4AF37] shrink-0 mt-0.5" />
              <span>{settings.address}</span>
            </li>
            <li className="flex items-center space-x-3">
              <Phone className="h-4.5 w-4.5 text-[#D4AF37] shrink-0" />
              <span>{settings.phone}</span>
            </li>
            <li className="flex items-center space-x-3">
              <Mail className="h-4.5 w-4.5 text-[#D4AF37] shrink-0" />
              <span className="break-all">{settings.email}</span>
            </li>
          </ul>
          <div className="pt-2">
            <Link
              to="/booking"
              className="inline-block px-4 py-2 bg-[#D4AF37] hover:bg-[#E5C158] text-[#111111] font-semibold text-xs uppercase tracking-wider rounded-lg transition-colors"
            >
              Book Session
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500">
        <p>
          {settings.footerText ||
            `© ${new Date().getFullYear()} SHIV STUDIO — Creative Brand: ${settings.creativeBrand || 'Arvind Creation'}. All rights reserved.`}
        </p>
        <div className="flex flex-wrap items-center gap-6">
          <Link to="/about" className="hover:text-white transition-colors">
            About Us
          </Link>
          <Link to="/track-order" className="hover:text-white transition-colors">
            Track Order
          </Link>
          <Link to="/privacy-policy" className="hover:text-white transition-colors">
            Privacy Policy
          </Link>
          <Link to="/terms-conditions" className="hover:text-white transition-colors">
            Terms & Conditions
          </Link>
        </div>
      </div>
    </footer>
  );
};
