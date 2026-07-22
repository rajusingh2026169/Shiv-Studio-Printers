import React, { useState, useEffect } from 'react';
import { Phone, MessageSquare } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

export const WhatsAppButton: React.FC = () => {
  const [phone, setPhone] = useState('+917905256355');
  const [whatsapp, setWhatsapp] = useState('+917905256355');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settingsSnap = await getDoc(doc(db, 'website_settings', 'studio'));
        if (settingsSnap.exists()) {
          const data = settingsSnap.data();
          if (data.whatsappNumber) {
            setWhatsapp(data.whatsappNumber);
          }
          if (data.phone) {
            // Take the first number if multiple
            const firstPhone = data.phone.split(',')[0].trim();
            setPhone(firstPhone);
          }
        }
      } catch (err) {
        console.error('Error fetching settings for WhatsAppButton:', err);
      }
    };
    fetchSettings();
  }, []);

  const cleanWhatsappNumber = whatsapp.replace('+', '').replace(/\s+/g, '');
  const whatsappUrl = `https://wa.me/${cleanWhatsappNumber}?text=Hello%20Shiv%20Studio%2C%20I%20want%20to%20inquire%20about%20a%20photography%20and%20printing%20package.`;
  const callUrl = `tel:${phone}`;

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col space-y-3">
      {/* Phone Call Floating Button */}
      <a
        href={callUrl}
        className="flex items-center justify-center h-12 w-12 rounded-full bg-amber-500 hover:bg-amber-600 text-slate-900 shadow-xl border border-amber-400 hover:scale-110 transition-transform duration-200"
        title="Call Shiv Studio"
        referrerPolicy="no-referrer"
      >
        <Phone className="h-5 w-5" />
      </a>

      {/* WhatsApp Chat Floating Button */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center h-14 w-14 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white shadow-2xl border border-emerald-400 hover:scale-110 transition-transform duration-200 animate-bounce"
        title="Chat on WhatsApp"
        referrerPolicy="no-referrer"
      >
        <MessageSquare className="h-6 w-6 fill-current" />
      </a>
    </div>
  );
};
