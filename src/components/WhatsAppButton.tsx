import React, { useState, useEffect } from 'react';
import { Phone, MessageCircle } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

export function buildWhatsAppUrl(phoneNumber: string, message: string): string {
  const digits = (phoneNumber || '+917905256355').replace(/[^0-9]/g, '');
  const formatted = digits.length === 10 ? `91${digits}` : digits || '917905256355';
  return `https://wa.me/${formatted}?text=${encodeURIComponent(message)}`;
}

export const WhatsAppButton: React.FC = () => {
  const [phone, setPhone] = useState('+917905256355');
  const [whatsapp, setWhatsapp] = useState('+917905256355');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settingsSnap = await getDoc(doc(db, 'website_settings', 'studio'));
        if (settingsSnap.exists()) {
          const data = settingsSnap.data();
          if (data.whatsappNumber) setWhatsapp(data.whatsappNumber);
          if (data.phone) setPhone(data.phone.split(',')[0].trim());
        }
      } catch {
        // Default fallback
      }
    };
    fetchSettings();
  }, []);

  const whatsappUrl = buildWhatsAppUrl(
    whatsapp,
    'Hello SHIV STUDIO, I would like to enquire about photography services / packages.'
  );
  const callUrl = `tel:${phone}`;

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end space-y-2.5">
      <a
        href={callUrl}
        className="flex items-center justify-center h-11 w-11 rounded-full bg-[#1A1A1A] hover:bg-[#D4AF37] text-[#D4AF37] hover:text-[#111111] shadow-xl border border-[#D4AF37]/40 transition-colors"
        title="Call SHIV STUDIO"
        aria-label="Call SHIV STUDIO"
      >
        <Phone className="h-4.5 w-4.5" />
      </a>

      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 h-11 px-4 rounded-full bg-[#D4AF37] hover:bg-[#E5C158] text-[#111111] font-semibold text-xs shadow-2xl border border-[#D4AF37] transition-colors"
        title="Enquire on WhatsApp"
        aria-label="Enquire on WhatsApp"
      >
        <MessageCircle className="h-4.5 w-4.5" />
        <span className="hidden sm:inline whitespace-nowrap">WhatsApp</span>
      </a>
    </div>
  );
};
