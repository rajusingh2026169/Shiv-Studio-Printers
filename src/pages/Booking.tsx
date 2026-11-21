import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { collection, getDocs, setDoc, doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { ServiceItem, Booking, PackageItem } from '../types';
import { SERVICE_DEFINITIONS } from '../data/studioCatalog';
import { SEOHead } from '../components/SEOHead';
import { buildWhatsAppUrl } from '../components/WhatsAppButton';
import { getImageForSlugOrCategory } from '../assets/studioAssets';
import { CheckCircle, Award, MessageCircle, AlertCircle } from 'lucide-react';

export const BookingPage: React.FC = () => {
  const { currentUser, userProfile } = useAuth();
  const [searchParams] = useSearchParams();

  const [services, setServices] = useState<ServiceItem[]>([]);
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<PackageItem | null>(null);
  const [whatsappStudio, setWhatsappStudio] = useState('+917905256355');

  // Form fields
  const [fullName, setFullName] = useState(userProfile?.fullName || '');
  const [phone, setPhone] = useState(userProfile?.phone || '');
  const [whatsappNumber, setWhatsappNumber] = useState(userProfile?.phone || '');
  const [email, setEmail] = useState(userProfile?.email || '');
  const [address, setAddress] = useState(userProfile?.address || '');
  const [eventType, setEventType] = useState('Wedding');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('10:00');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [advancePaid, setAdvancePaid] = useState(2000);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [successBooking, setSuccessBooking] = useState<Booking | null>(null);
  const submittingLockRef = useRef(false);

  useEffect(() => {
    if (userProfile) {
      if (!fullName) setFullName(userProfile.fullName || '');
      if (!phone) setPhone(userProfile.phone || '');
      if (!whatsappNumber) setWhatsappNumber(userProfile.phone || '');
      if (!email) setEmail(userProfile.email || '');
      if (!address) setAddress(userProfile.address || '');
    }
  }, [userProfile]);

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const [srvSnap, pkgSnap, settingsSnap] = await Promise.all([
          getDocs(collection(db, 'services')),
          getDocs(collection(db, 'packages')),
          getDoc(doc(db, 'website_settings', 'studio'))
        ]);

        if (settingsSnap.exists() && settingsSnap.data().whatsappNumber) {
          setWhatsappStudio(settingsSnap.data().whatsappNumber);
        }

        const srvList =
          !srvSnap.empty
            ? srvSnap.docs.map((d) => ({ id: d.id, ...d.data() } as ServiceItem))
            : SERVICE_DEFINITIONS.map((def, idx) => ({
                id: `srv_${def.slug}`,
                slug: def.slug,
                title: def.title,
                category: def.category,
                description: def.description,
                price: def.startingPrice,
                image: def.coverImage,
                gallery: def.gallery,
                order: idx + 1
              }));
        setServices(srvList);

        const pkgList = pkgSnap.docs
          .map((d) => ({ id: d.id, ...d.data() } as PackageItem))
          .filter((p) => p.isPublished !== false);
        setPackages(pkgList);

        const packageParam = searchParams.get('package');
        const serviceParam = searchParams.get('service');

        if (packageParam) {
          const pkgMatch = pkgList.find((p) => p.id === packageParam);
          if (pkgMatch) {
            setSelectedPackage(pkgMatch);
            setEventType(pkgMatch.category);
          }
        }

        if (serviceParam) {
          const srvMatch = srvList.find(
            (s) => s.id === serviceParam || s.slug === serviceParam || `srv_${s.slug}` === serviceParam
          );
          if (srvMatch) {
            setSelectedService(srvMatch);
          }
        } else if (srvList.length > 0) {
          setSelectedService(srvList[0]);
        }
      } catch {
        // Fallback smoothly
      }
    };
    fetchCatalog();
  }, [searchParams]);

  const effectiveTotal = selectedPackage
    ? Number(selectedPackage.price || 0)
    : Number(selectedService?.startingPrice ?? selectedService?.price ?? 0);

  const effectiveTitle = selectedPackage
    ? `${selectedPackage.name} (${selectedPackage.category})`
    : selectedService?.title || eventType;

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingLockRef.current || isSubmitting) return;
    setSubmitError('');

    if (!fullName.trim() || !phone.trim() || !date || !location.trim()) {
      setSubmitError('Please fill in your name, mobile number, event date, and venue location.');
      return;
    }

    submittingLockRef.current = true;
    setIsSubmitting(true);

    try {
      const bookingId = `BK-${Math.floor(100000 + Math.random() * 900000)}`;
      const bookingData: Booking = {
        id: bookingId,
        customerId: currentUser?.uid || 'guest',
        customerName: fullName.trim(),
        customerPhone: phone.trim(),
        whatsappNumber: (whatsappNumber || phone).trim(),
        customerEmail: email.trim(),
        address: address.trim() || location.trim(),
        serviceId: selectedService?.id || 'custom_booking',
        serviceTitle: effectiveTitle,
        ...(selectedPackage?.id ? { packageId: selectedPackage.id, packageName: selectedPackage.name } : {}),
        eventType,
        date,
        time: time || '10:00',
        location: location.trim(),
        notes: notes.trim(),
        advancePaid: Number(advancePaid) || 0,
        totalPrice: effectiveTotal,
        gstEnabled: selectedService?.enableGst === true,
        gstPercentage: selectedService?.gstPercent || 18,
        gstAmount: 0,
        paymentMethod: Number(advancePaid) > 0 ? 'Pending Studio Confirmation' : 'Enquiry Only',
        paymentStatus: 'Pending',
        dueAmount: Math.max(0, effectiveTotal - (Number(advancePaid) || 0)),
        status: 'New',
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'bookings', bookingId), bookingData);
      setSuccessBooking(bookingData);
    } catch (err: any) {
      setSubmitError(err?.message || 'Unable to submit your booking right now. Please try WhatsApp below.');
    } finally {
      setIsSubmitting(false);
      submittingLockRef.current = false;
    }
  };

  return (
    <div className="bg-[#111111] min-h-screen text-white py-16 px-4 sm:px-6 lg:px-8">
      <SEOHead
        title="Book Now — Reserve Photography & Videography | SHIV STUDIO"
        description="Reserve wedding photography, pre-wedding shoots, engagement coverage, birthday photography, or custom packages with SHIV STUDIO, Khaga."
        canonicalPath="/booking"
      />

      <div className="max-w-5xl mx-auto space-y-10">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <p className="text-xs uppercase tracking-[0.25em] text-[#D4AF37] font-semibold">
            Date Reservation &amp; Enquiry
          </p>
          <h1 className="font-display text-4xl sm:text-5xl font-semibold text-white">
            Book Your Shoot with SHIV STUDIO
          </h1>
          <p className="text-sm text-neutral-400 leading-relaxed">
            Share your event date, venue, and preferred package. Receive a unique booking ID immediately with direct WhatsApp confirmation.
          </p>
        </div>

        {successBooking ? (
          <div className="bg-[#1A1A1A] border border-[#D4AF37]/40 rounded-2xl p-8 sm:p-10 text-center space-y-6">
            <CheckCircle className="h-14 w-14 text-[#D4AF37] mx-auto" />
            <div className="space-y-2">
              <h2 className="font-display text-3xl font-semibold text-white">
                Booking Request Recorded
              </h2>
              <p className="text-xs sm:text-sm text-neutral-300">
                Reference ID:{' '}
                <span className="font-mono font-bold text-[#D4AF37]">#{successBooking.id}</span>. Our studio coordinator will reach out on WhatsApp/phone to finalize schedule details.
              </p>
            </div>

            <div className="bg-[#111111] border border-white/10 p-5 rounded-xl max-w-lg mx-auto grid grid-cols-2 gap-4 text-xs text-left">
              <div>
                <p className="text-neutral-500 uppercase tracking-wider">Service / Package</p>
                <p className="font-semibold text-white mt-1">{successBooking.serviceTitle}</p>
              </div>
              <div>
                <p className="text-neutral-500 uppercase tracking-wider">Event Date</p>
                <p className="font-semibold text-white mt-1">{successBooking.date}</p>
              </div>
              <div>
                <p className="text-neutral-500 uppercase tracking-wider">Estimated Price</p>
                <p className="font-bold text-[#D4AF37] mt-1 tabular-nums">
                  ₹{Number(successBooking.totalPrice).toLocaleString('en-IN')}
                </p>
              </div>
              <div>
                <p className="text-neutral-500 uppercase tracking-wider">Venue</p>
                <p className="font-semibold text-white mt-1 truncate">{successBooking.location}</p>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <a
                href={buildWhatsAppUrl(
                  whatsappStudio,
                  `Hello SHIV STUDIO, I just submitted Booking #${successBooking.id} for ${successBooking.serviceTitle} on ${successBooking.date} at ${successBooking.location}. Name: ${successBooking.customerName}.`
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 bg-[#D4AF37] hover:bg-[#E5C158] text-[#111111] font-semibold text-xs uppercase tracking-wider rounded-lg inline-flex items-center gap-2"
              >
                <MessageCircle className="h-4 w-4" />
                <span>Confirm via WhatsApp</span>
              </a>
              <Link
                to="/track-order"
                className="px-6 py-3 bg-[#111111] border border-white/15 hover:bg-white/10 text-white font-semibold text-xs rounded-lg"
              >
                Track Booking Status
              </Link>
              <button
                onClick={() => setSuccessBooking(null)}
                className="px-6 py-3 text-xs text-neutral-400 hover:text-white"
              >
                New Booking
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2 bg-[#1A1A1A] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-6">
              <h2 className="font-display text-2xl font-semibold text-white border-b border-white/10 pb-3">
                Event &amp; Contact Details
              </h2>

              {submitError && (
                <div className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
                  <span>{submitError}</span>
                </div>
              )}

              <form onSubmit={handleBookingSubmit} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-neutral-300 font-medium">Service Category</label>
                    <select
                      value={selectedService?.id || ''}
                      onChange={(e) => {
                        const srv = services.find((s) => s.id === e.target.value) || null;
                        setSelectedService(srv);
                      }}
                      className="w-full bg-[#111111] border border-white/10 rounded-lg px-4 py-3 text-white outline-none focus:border-[#D4AF37]"
                    >
                      {services.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.title} (From ₹{Number(s.startingPrice ?? s.price).toLocaleString('en-IN')})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-neutral-300 font-medium">Optional Package</label>
                    <select
                      value={selectedPackage?.id || ''}
                      onChange={(e) => {
                        const pkg = packages.find((p) => p.id === e.target.value) || null;
                        setSelectedPackage(pkg);
                      }}
                      className="w-full bg-[#111111] border border-white/10 rounded-lg px-4 py-3 text-white outline-none focus:border-[#D4AF37]"
                    >
                      <option value="">Custom Quote / Based on Service</option>
                      {packages.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} — ₹{Number(p.price).toLocaleString('en-IN')}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-neutral-300 font-medium">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-[#111111] border border-white/10 rounded-lg px-4 py-3 text-white outline-none focus:border-[#D4AF37]"
                      placeholder="Your full name"
                    />
                  </div>
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
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  <div className="space-y-1.5">
                    <label className="text-neutral-300 font-medium">Email Address (Optional)</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-[#111111] border border-white/10 rounded-lg px-4 py-3 text-white outline-none focus:border-[#D4AF37]"
                      placeholder="Optional email for digital invoice"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-neutral-300 font-medium">Event Date *</label>
                    <input
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full bg-[#111111] border border-white/10 rounded-lg px-4 py-3 text-white outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-neutral-300 font-medium">Preferred Time</label>
                    <input
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="w-full bg-[#111111] border border-white/10 rounded-lg px-4 py-3 text-white outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-neutral-300 font-medium">Event Type</label>
                    <input
                      type="text"
                      value={eventType}
                      onChange={(e) => setEventType(e.target.value)}
                      className="w-full bg-[#111111] border border-white/10 rounded-lg px-4 py-3 text-white outline-none focus:border-[#D4AF37]"
                      placeholder="e.g. Wedding / Ring Ceremony"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-neutral-300 font-medium">Venue / City Location *</label>
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full bg-[#111111] border border-white/10 rounded-lg px-4 py-3 text-white outline-none focus:border-[#D4AF37]"
                    placeholder="e.g. Khaga, Fatehpur, Uttar Pradesh"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-neutral-300 font-medium">Residential Address</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full bg-[#111111] border border-white/10 rounded-lg px-4 py-3 text-white outline-none focus:border-[#D4AF37]"
                    placeholder="Address for album & frame delivery"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-neutral-300 font-medium">Additional Notes / Requirements</label>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-[#111111] border border-white/10 rounded-lg px-4 py-3 text-white outline-none focus:border-[#D4AF37] resize-none"
                    placeholder="Drone coverage, album preferences, ceremony count..."
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-neutral-300 font-medium">Proposed Slot Advance Preference</label>
                  <select
                    value={advancePaid}
                    onChange={(e) => setAdvancePaid(Number(e.target.value))}
                    className="w-full bg-[#111111] border border-white/10 rounded-lg px-4 py-3 text-white outline-none focus:border-[#D4AF37]"
                  >
                    <option value={0}>Discuss Estimate First (₹0 Advance Now)</option>
                    <option value={2000}>₹2,000 Standard Date Lock</option>
                    <option value={5000}>₹5,000 Wedding Booking Token</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-[#D4AF37] hover:bg-[#E5C158] disabled:opacity-50 text-[#111111] font-semibold uppercase tracking-wider rounded-lg transition-colors"
                >
                  {isSubmitting ? 'Submitting Booking Request...' : 'Confirm Booking Request'}
                </button>
              </form>
            </div>

            <div className="space-y-6">
              <div className="bg-[#1A1A1A] border border-white/10 rounded-2xl p-6 space-y-4">
                <h3 className="font-display text-2xl font-semibold text-white border-b border-white/10 pb-3">
                  Selection Summary
                </h3>
                <div className="aspect-[4/3] rounded-xl overflow-hidden bg-[#111111]">
                  <img
                    src={
                      selectedPackage?.image ||
                      selectedService?.image ||
                      getImageForSlugOrCategory(effectiveTitle)
                    }
                    alt={effectiveTitle}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] uppercase tracking-wider text-[#D4AF37] font-semibold">
                    {selectedPackage ? selectedPackage.category : selectedService?.category}
                  </p>
                  <h4 className="font-semibold text-white text-sm">{effectiveTitle}</h4>
                </div>
                <div className="bg-[#111111] p-4 rounded-xl border border-white/10 text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Starting Estimate:</span>
                    <span className="font-bold text-[#D4AF37] tabular-nums">
                      ₹{effectiveTotal.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Advance Preference:</span>
                    <span className="text-white tabular-nums">
                      ₹{Number(advancePaid).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-[#1A1A1A] border border-white/10 rounded-2xl p-6 space-y-3 text-xs text-neutral-300">
                <div className="flex items-center gap-2 text-[#D4AF37] font-semibold uppercase tracking-wider">
                  <Award className="h-4 w-4" />
                  <span>SHIV STUDIO Assurance</span>
                </div>
                <p>Dedicated photographer &amp; backup gear checklist for every booking.</p>
                <p>Transparent album &amp; print sizing consultation at our Khaga studio.</p>
                <a
                  href={buildWhatsAppUrl(
                    whatsappStudio,
                    `Hello SHIV STUDIO, I have a question before booking ${effectiveTitle}.`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-[#D4AF37] font-semibold pt-1 hover:underline"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  <span>Ask on WhatsApp First</span>
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
