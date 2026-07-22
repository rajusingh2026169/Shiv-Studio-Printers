import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Camera, Phone, Mail, MapPin, Award, CheckCircle, ShieldCheck } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import logoImg from '../assets/images/shiv_studio_logo_1784453716682.jpg';

export const Footer: React.FC = () => {
  const [settings, setSettings] = useState<any>({
    studioName: 'Shiv Studio & Printers',
    phone: '+91 7905256355, +91 8765706396',
    email: 'shivsharan52796@gmail.com',
    address: 'Kishanpur Road, Over Bridge ke Niche, Khaga, Fatehpur, Uttar Pradesh, India',
    gstNumber: '09AAAAA1111A1Z1',
    footerText: 'Copyright © Shiv Studio & Printers. All Rights Reserved.'
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settingsSnap = await getDoc(doc(db, 'website_settings', 'studio'));
        if (settingsSnap.exists()) {
          setSettings((prev: any) => ({ ...prev, ...settingsSnap.data() }));
        }
      } catch (err) {
        console.error('Error fetching settings in Footer:', err);
      }
    };
    fetchSettings();
  }, []);

  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-900 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
        
        {/* Left Column - Studio Profile */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <img 
              src={settings.logoUrl || logoImg} 
              alt={settings.studioName || "Shiv Studio & Printers"} 
              className="h-10 w-10 object-contain rounded-full border border-amber-500/20"
              referrerPolicy="no-referrer"
            />
            <span className="font-sans font-bold text-lg text-white tracking-tight uppercase">
              {settings.studioName}
            </span>
          </div>
          <p className="text-sm leading-relaxed text-slate-400">
            Fatehpur's premier fine-art photography studio and industrial high-resolution printing press. Creating visual masterworks and luxury invitations.
          </p>
          <div className="flex items-center space-x-2 pt-2 text-xs text-amber-400 font-mono">
            <ShieldCheck className="h-4 w-4" />
            <span>GSTIN: {settings.gstNumber || '09AAAAA1111A1Z1'}</span>
          </div>
        </div>

        {/* 2nd Column - Services */}
        <div className="space-y-4">
          <h3 className="font-sans font-semibold text-white tracking-wide text-sm uppercase">
            Services
          </h3>
          <ul className="space-y-2 text-sm">
            <li>
              <Link to="/services" className="hover:text-amber-400 transition-colors">Wedding & Pre-Wedding</Link>
            </li>
            <li>
              <Link to="/services" className="hover:text-amber-400 transition-colors">Infants & Kids Portfolios</Link>
            </li>
            <li>
              <Link to="/services" className="hover:text-amber-400 transition-colors">Drone & Video Production</Link>
            </li>
            <li>
              <Link to="/services" className="hover:text-amber-400 transition-colors">Industrial Digital Printing</Link>
            </li>
            <li>
              <Link to="/services" className="hover:text-amber-400 transition-colors">Laser Invitations & Books</Link>
            </li>
          </ul>
        </div>

        {/* 3rd Column - Store Products */}
        <div className="space-y-4">
          <h3 className="font-sans font-semibold text-white tracking-wide text-sm uppercase">
            Product Store
          </h3>
          <ul className="space-y-2 text-sm">
            <li>
              <Link to="/store" className="hover:text-amber-400 transition-colors">Handcrafted Albums</Link>
            </li>
            <li>
              <Link to="/store" className="hover:text-amber-400 transition-colors">LED Floating Frames</Link>
            </li>
            <li>
              <Link to="/store" className="hover:text-amber-400 transition-colors">Sublimation Photo Mugs</Link>
            </li>
            <li>
              <Link to="/store" className="hover:text-amber-400 transition-colors">Eco-Solvent Canvases</Link>
            </li>
            <li>
              <Link to="/store" className="hover:text-amber-400 transition-colors">Corporate ID & Cards</Link>
            </li>
          </ul>
        </div>

        {/* 4th Column - Studio Headquarters */}
        <div className="space-y-4">
          <h3 className="font-sans font-semibold text-white tracking-wide text-sm uppercase">
            Contact Headquarters
          </h3>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start space-x-3">
              <MapPin className="h-5 w-5 text-amber-500 shrink-0" />
              <span>{settings.address}</span>
            </li>
            <li className="flex items-center space-x-3">
              <Phone className="h-5 w-5 text-amber-500 shrink-0" />
              <span>{settings.phone}</span>
            </li>
            <li className="flex items-center space-x-3">
              <Mail className="h-5 w-5 text-amber-500 shrink-0" />
              <span>{settings.email}</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
        <p>{settings.footerText || `Copyright © ${new Date().getFullYear()} ${settings.studioName}. All rights reserved.`}</p>
        <div className="flex space-x-6">
          <span className="hover:text-white transition-colors cursor-pointer">Privacy Policy</span>
          <span className="hover:text-white transition-colors cursor-pointer">Terms of Service</span>
          <span className="hover:text-white transition-colors cursor-pointer">Grievance Portal</span>
        </div>
      </div>
    </footer>
  );
};
