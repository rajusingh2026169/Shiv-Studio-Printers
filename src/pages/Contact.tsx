import React, { useState, useEffect, useRef } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { SEOHead } from '../components/SEOHead';
import { buildWhatsAppUrl } from '../components/WhatsAppButton';
import { Mail, Phone, MapPin, Clock, CheckCircle, Send, Instagram, AlertCircle } from 'lucide-react';

export const Contact: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [subject, setSubject] = useState('General Photography & Print Enquiry');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const submittingRef = useRef(false);

  const [settings, setSettings] = useState<any>({
    studioName: 'SHIV STUDIO',
    phone: '+91 7905256355, +91 8765706396',
    email: 'shivsharan52796@gmail.com',
    address: 'Kishanpur Road Over Bridge, Khaga, Fatehpur, Uttar Pradesh, India – 212655',
    officeHours: 'Monday - Sunday: 09:00 AM - 09:00 PM',
    whatsappNumber: '+917905256355',
    instagramHandle: 'Shiv_photography_officel',
    instagramUrl: 'https://www.instagram.com/Shiv_photography_officel/',
    googleMapUrl:
      'https://maps.google.com/maps?q=Kishanpur%20Road,%20Khaga,%20Fatehpur,%20Uttar%20Pradesh%20212655&t=&z=15&ie=UTF8&iwloc=&output=embed'
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settingsSnap = await getDoc(doc(db, 'website_settings', 'studio'));
        if (settingsSnap.exists()) {
          setSettings((prev: any) => ({ ...prev, ...settingsSnap.data() }));
        }
      } catch {
        // Fallback smoothly
      }
    };
    fetchSettings();
  }, []);

  const handleSubmitInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingRef.current || loading) return;
    setError('');

    if (!fullName.trim() || !phone.trim() || !message.trim()) {
      setError('Please enter your name, mobile number, and message.');
      return;
    }

    submittingRef.current = true;
    setLoading(true);
    try {
      const enquiryNumber = `ENQ-${Math.floor(100000 + Math.random() * 900000)}`;
      await setDoc(doc(db, 'inquiries', enquiryNumber), {
        id: enquiryNumber,
        enquiryNumber,
        fullName: fullName.trim(),
        name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        whatsappNumber: (whatsappNumber || phone).trim(),
        subject,
        message: message.trim(),
        status: 'New',
        createdAt: new Date().toISOString()
      });
      setSubmittedId(enquiryNumber);
      setFullName('');
      setEmail('');
      setPhone('');
      setWhatsappNumber('');
      setMessage('');
    } catch {
      setError('Unable to send your enquiry right now. Please connect directly on WhatsApp.');
    } finally {
      setLoading(false);
      submittingRef.current = false;
    }
  };

  return (
    <div className="bg-[#111111] min-h-screen text-white py-16 px-4 sm:px-6 lg:px-8">
      <SEOHead
        title="Contact Us — SHIV STUDIO Khaga, Fatehpur"
        description="Contact SHIV STUDIO (Arvind Creation) at Kishanpur Road Over Bridge, Khaga, Fatehpur, Uttar Pradesh 212655 for photography bookings and custom printing."
        canonicalPath="/contact"
      />

      <div className="max-w-6xl mx-auto space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <p className="text-xs uppercase tracking-[0.25em] text-[#D4AF37] font-semibold">
            Get in Touch
          </p>
          <h1 className="font-display text-4xl sm:text-5xl font-semibold text-white">
            Contact {settings.studioName || 'SHIV STUDIO'}
          </h1>
          <p className="text-sm text-neutral-400 leading-relaxed">
            Reach out for wedding availability, package quotes, album designing, video editing, or custom framed gifts in Khaga, Fatehpur.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          {/* Contact Form */}
          <div className="bg-[#1A1A1A] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-6">
            <h2 className="font-display text-2xl font-semibold text-white border-b border-white/10 pb-3">
              Send an Enquiry
            </h2>

            {submittedId ? (
              <div className="text-center py-8 space-y-4">
                <CheckCircle className="h-12 w-12 text-[#D4AF37] mx-auto" />
                <h3 className="font-display text-2xl font-semibold text-white">
                  Enquiry Submitted ({submittedId})
                </h3>
                <p className="text-xs text-neutral-400">
                  Thank you for contacting SHIV STUDIO. Our team will respond promptly via call or WhatsApp.
                </p>
                <button
                  onClick={() => setSubmittedId(null)}
                  className="px-5 py-2.5 bg-[#111111] border border-white/15 text-white rounded-lg text-xs font-semibold"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitInquiry} className="space-y-4 text-xs">
                {error && (
                  <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-neutral-300 font-medium">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-[#111111] border border-white/10 rounded-lg px-4 py-3 text-white outline-none focus:border-[#D4AF37]"
                    placeholder="Your name"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-neutral-300 font-medium">Mobile Number *</label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-[#111111] border border-white/10 rounded-lg px-4 py-3 text-white outline-none focus:border-[#D4AF37]"
                      placeholder="+91 9876543210"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-neutral-300 font-medium">WhatsApp Number</label>
                    <input
                      type="tel"
                      value={whatsappNumber}
                      onChange={(e) => setWhatsappNumber(e.target.value)}
                      className="w-full bg-[#111111] border border-white/10 rounded-lg px-4 py-3 text-white outline-none focus:border-[#D4AF37]"
                      placeholder="Same as mobile if blank"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-neutral-300 font-medium">Email (Optional)</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-[#111111] border border-white/10 rounded-lg px-4 py-3 text-white outline-none focus:border-[#D4AF37]"
                      placeholder="you@example.com"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-neutral-300 font-medium">Subject</label>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full bg-[#111111] border border-white/10 rounded-lg px-4 py-3 text-white outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-neutral-300 font-medium">Message *</label>
                  <textarea
                    rows={4}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full bg-[#111111] border border-white/10 rounded-lg px-4 py-3 text-white outline-none focus:border-[#D4AF37] resize-none"
                    placeholder="Share your event dates, photography needs, or custom frame dimensions..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-[#D4AF37] hover:bg-[#E5C158] disabled:opacity-50 text-[#111111] font-semibold uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Send className="h-4 w-4" />
                  <span>{loading ? 'Sending Enquiry...' : 'Submit Enquiry'}</span>
                </button>
              </form>
            )}
          </div>

          {/* Location & Map */}
          <div className="space-y-6 text-xs sm:text-sm">
            <div className="bg-[#1A1A1A] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-5">
              <h2 className="font-display text-2xl font-semibold text-white border-b border-white/10 pb-3">
                Studio Details
              </h2>

              <div className="space-y-4 text-neutral-300">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-[#D4AF37] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-white">Studio Address</p>
                    <p className="text-neutral-400 mt-0.5">{settings.address}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-[#D4AF37] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-white">Phone &amp; WhatsApp</p>
                    <p className="text-neutral-400 mt-0.5">{settings.phone}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-[#D4AF37] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-white">Email</p>
                    <p className="text-neutral-400 mt-0.5 break-all">{settings.email}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-[#D4AF37] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-white">Working Hours</p>
                    <p className="text-neutral-400 mt-0.5">{settings.officeHours}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Instagram className="h-5 w-5 text-[#D4AF37] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-white">Instagram</p>
                    <a
                      href={settings.instagramUrl || 'https://www.instagram.com/Shiv_photography_officel/'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#D4AF37] hover:underline mt-0.5 inline-block"
                    >
                      @{settings.instagramHandle || 'Shiv_photography_officel'}
                    </a>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-white/10 grid grid-cols-2 gap-3">
                <a
                  href={buildWhatsAppUrl(
                    settings.whatsappNumber,
                    'Hello SHIV STUDIO, I want to enquire from your Contact page.'
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-3 bg-[#D4AF37] hover:bg-[#E5C158] text-[#111111] font-semibold rounded-lg text-center text-xs uppercase tracking-wider transition-colors"
                >
                  WhatsApp Studio
                </a>
                <a
                  href={`tel:${settings.phone?.split(',')[0]?.trim() || '+917905256355'}`}
                  className="py-3 bg-[#111111] hover:bg-white/10 border border-white/15 text-white font-semibold rounded-lg text-center text-xs uppercase tracking-wider transition-colors"
                >
                  Call Directly
                </a>
              </div>
            </div>

            <div className="bg-[#1A1A1A] border border-white/10 rounded-2xl overflow-hidden aspect-video">
              <iframe
                title="SHIV STUDIO Khaga Location Map"
                src={settings.googleMapUrl}
                className="w-full h-full border-0 opacity-90"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
