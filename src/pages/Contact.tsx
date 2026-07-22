import React, { useState, useEffect } from 'react';
import { collection, addDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Mail, Phone, MapPin, Clock, CheckCircle, Send } from 'lucide-react';

export const Contact: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [settings, setSettings] = useState<any>({
    studioName: 'Shiv Studio & Printers',
    phone: '+91 7905256355, +91 8765706396',
    email: 'shivsharan52796@gmail.com',
    address: 'Kishanpur Road, Over Bridge ke Niche, Khaga, Fatehpur, Uttar Pradesh, India',
    officeHours: 'Monday - Sunday: 09:00 AM - 09:00 PM',
    whatsappNumber: '+917905256355',
    googleMapUrl: 'https://maps.google.com/maps?q=Kishanpur%20Road,%20Khaga,%20Fatehpur,%20Uttar%20Pradesh&t=&z=15&ie=UTF8&iwloc=&output=embed'
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settingsSnap = await getDoc(doc(db, 'website_settings', 'studio'));
        if (settingsSnap.exists()) {
          setSettings((prev: any) => ({ ...prev, ...settingsSnap.data() }));
        }
      } catch (err) {
        console.error('Error fetching settings on Contact page:', err);
      }
    };
    fetchSettings();
  }, []);

  const handleSubmitInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await addDoc(collection(db, 'inquiries'), {
        fullName,
        email,
        phone,
        message,
        createdAt: new Date().toISOString()
      });
      setSuccess(true);
      setFullName('');
      setEmail('');
      setPhone('');
      setMessage('');
    } catch (err) {
      console.error('Error submitting contact query:', err);
      alert('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-950 min-h-screen text-slate-100 py-16 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-12">
        
        {/* Page Header */}
        <div className="text-center space-y-3">
          <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold uppercase tracking-wider font-mono">
            Get in Touch
          </span>
          <h1 className="text-3xl sm:text-5xl font-sans font-bold text-white tracking-tight">
            Contact {settings.studioName}
          </h1>
          <p className="max-w-2xl mx-auto text-slate-400 text-sm sm:text-base leading-relaxed">
            Reach out for custom canvas printing contracts, large event quotes, wedding portfolio collaborations, or Khaga studio booking assistance.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
          
          {/* Form container */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-3">
              Drop an Instant Inquiry
            </h3>

            {success ? (
              <div className="text-center py-8 space-y-4">
                <CheckCircle className="h-14 w-14 text-emerald-400 mx-auto animate-bounce" />
                <h4 className="text-lg font-bold text-white">Inquiry Received!</h4>
                <p className="text-slate-400 text-xs">
                  We have forwarded your request to our production coordinator team. Expect a response within 3 hours.
                </p>
                <button
                  onClick={() => setSuccess(false)}
                  className="px-5 py-2.5 bg-slate-850 text-slate-300 rounded-xl hover:bg-slate-800 text-xs font-bold transition-all"
                >
                  Write Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitInquiry} className="space-y-4 text-xs font-sans">
                <div className="space-y-1.5">
                  <label className="text-slate-400 font-semibold">Your Name</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white outline-none focus:border-amber-500"
                    placeholder="e.g. Priyesh Vatsa"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-slate-400 font-semibold">Email Address</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white outline-none focus:border-amber-500"
                      placeholder="e.g. design@domain.com"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-400 font-semibold">Phone Number</label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white outline-none focus:border-amber-500"
                      placeholder="e.g. +91 9999999999"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-400 font-semibold">Detailed Message</label>
                  <textarea
                    rows={4}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white outline-none focus:border-amber-500"
                    placeholder="Describe your requested package detail, shoot size, custom prints size..."
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-amber-400 hover:bg-amber-500 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-extrabold rounded-xl text-center text-xs tracking-wider transition-colors flex items-center justify-center gap-2"
                >
                  <Send className="h-4 w-4 shrink-0" />
                  <span>{loading ? 'Transmitting inquiry...' : 'Send Inquiry To Directors'}</span>
                </button>
              </form>
            )}
          </div>

          {/* Location details card */}
          <div className="space-y-8 text-xs sm:text-sm text-slate-400 font-sans">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-3">
                {settings.studioName} Locations
              </h3>

              <div className="space-y-5">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-white text-xs sm:text-sm">Main Studio & Printing Press</h4>
                    <p className="mt-1">{settings.address}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-white text-xs sm:text-sm">Mobile Numbers</h4>
                    <p className="mt-1">{settings.phone}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-white text-xs sm:text-sm">Email Inbox</h4>
                    <p className="mt-1">{settings.email}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-white text-xs sm:text-sm">Business Timings</h4>
                    <p className="mt-1">{settings.officeHours}</p>
                    <p className="text-amber-500 font-medium">Open 365 Days including National Holidays</p>
                  </div>
                </div>

                {/* Instant Action Buttons */}
                <div className="pt-4 border-t border-slate-800 grid grid-cols-2 gap-3">
                  <a
                    href={`https://wa.me/${settings.whatsappNumber?.replace('+', '').replace(' ', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-center text-xs tracking-wider transition-colors"
                  >
                    <span>WhatsApp Chat</span>
                  </a>
                  <a
                    href={`mailto:${settings.email}`}
                    className="flex items-center justify-center gap-2 py-3 bg-slate-850 hover:bg-slate-700 text-white font-bold rounded-xl text-center text-xs tracking-wider transition-colors"
                  >
                    <span>Email Us</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Embedded interactive maps coordinate representation */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden aspect-video relative">
              <iframe
                title="Headquarters Map Coordinate"
                src={settings.googleMapUrl}
                className="w-full h-full border-0 grayscale opacity-80"
                allowFullScreen={false}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
