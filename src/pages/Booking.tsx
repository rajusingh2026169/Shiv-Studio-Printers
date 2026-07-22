import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { collection, addDoc, getDocs, setDoc, doc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { ServiceItem, Booking } from '../types';
import { Calendar, Clock, MapPin, User, Phone, Mail, FileText, CheckCircle, Award } from 'lucide-react';

export const BookingPage: React.FC = () => {
  const { currentUser, userProfile } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [services, setServices] = useState<ServiceItem[]>([]);
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  
  // Form fields
  const [fullName, setFullName] = useState(userProfile?.fullName || '');
  const [phone, setPhone] = useState(userProfile?.phone || '');
  const [email, setEmail] = useState(userProfile?.email || '');
  const [address, setAddress] = useState(userProfile?.address || '');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [advancePaid, setAdvancePaid] = useState(2000); // Standard minimum advance booking slot fee
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successBooking, setSuccessBooking] = useState<Booking | null>(null);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'services'));
        const list = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ServiceItem));
        setServices(list);

        // Pre-select service from URL query params
        const serviceIdParam = searchParams.get('service');
        if (serviceIdParam) {
          const service = list.find(s => s.id === serviceIdParam);
          if (service) setSelectedService(service);
        } else if (list.length > 0) {
          setSelectedService(list[0]);
        }
      } catch (err) {
        console.error('Error fetching services:', err);
      }
    };
    fetchServices();
  }, [searchParams]);

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService) return;
    setIsSubmitting(true);

    try {
      const bookingId = `BK-${Math.floor(100000 + Math.random() * 900000)}`;
      const bookingData: Booking = {
        id: bookingId,
        customerId: currentUser?.uid || 'anonymous',
        customerName: fullName,
        customerPhone: phone,
        customerEmail: email,
        address,
        serviceId: selectedService.id,
        serviceTitle: selectedService.title,
        date,
        time,
        location,
        notes,
        advancePaid: Number(advancePaid),
        totalPrice: selectedService.price,
        gstEnabled: selectedService.enableGst !== false,
        gstPercentage: selectedService.gstPercent !== undefined ? selectedService.gstPercent : 18,
        gstAmount: selectedService.enableGst !== false ? Math.round(selectedService.price * ((selectedService.gstPercent || 18) / 100)) : 0,
        paymentMethod: 'UPI / Online',
        paymentStatus: 'Paid',
        paymentDate: new Date().toISOString(),
        dueAmount: Math.max(0, selectedService.price - Number(advancePaid)),
        status: 'Pending',
        createdAt: new Date().toISOString()
      };

      // Save to Firestore
      await setDoc(doc(db, 'bookings', bookingId), bookingData);
      setSuccessBooking(bookingData);
    } catch (err) {
      console.error('Booking failed:', err);
      alert('An error occurred while confirming your booking.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-950 min-h-screen text-slate-100 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-12">
        
        {/* Page Header */}
        <div className="text-center space-y-3">
          <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold uppercase tracking-wider font-mono">
            Direct Calendar Synchronisation
          </span>
          <h1 className="text-3xl sm:text-5xl font-sans font-bold text-white tracking-tight">
            Schedule Studio Session & Shoots
          </h1>
          <p className="max-w-2xl mx-auto text-slate-400 text-sm sm:text-base leading-relaxed">
            Fill out venue details, select your preferred portrait session package, make a secure slot confirmation payment, and get instant photographer schedules.
          </p>
        </div>

        {successBooking ? (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-6 shadow-2xl">
            <CheckCircle className="h-16 w-16 text-emerald-400 mx-auto animate-bounce" />
            <div>
              <h2 className="text-2xl font-bold text-white">Booking Slot Appointed!</h2>
              <p className="text-slate-400 text-xs sm:text-sm mt-2">
                Your booking ID is <span className="font-bold text-amber-400">#{successBooking.id}</span>. We have scheduled our photographer team for your slot.
              </p>
            </div>

            <div className="bg-slate-950 border border-slate-850 p-5 rounded-2xl max-w-md mx-auto grid grid-cols-2 gap-4 text-xs text-left">
              <div>
                <p className="text-slate-500 uppercase font-mono">Service Session</p>
                <p className="font-bold text-white mt-1">{successBooking.serviceTitle}</p>
              </div>
              <div>
                <p className="text-slate-500 uppercase font-mono">Appointment Date</p>
                <p className="font-bold text-white mt-1">{successBooking.date} at {successBooking.time}</p>
              </div>
              <div>
                <p className="text-slate-500 uppercase font-mono">Advance Deposited</p>
                <p className="font-bold text-emerald-400 mt-1">₹{successBooking.advancePaid.toLocaleString('en-IN')}</p>
              </div>
              <div>
                <p className="text-slate-500 uppercase font-mono">Venue Address</p>
                <p className="font-bold text-white mt-1 truncate">{successBooking.location}</p>
              </div>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row justify-center gap-3">
              <button
                onClick={() => setSuccessBooking(null)}
                className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-750 font-bold text-xs rounded-xl transition-all"
              >
                Schedule Another Shoot
              </button>
              <Link
                to="/track-order"
                className="px-6 py-3 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs rounded-xl transition-all"
              >
                Track Booking Status
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 items-start">
            
            {/* Form Column */}
            <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
              <h2 className="text-lg font-bold text-white uppercase tracking-wide border-b border-slate-800 pb-3">
                Appointment Setup Configuration
              </h2>

              <form onSubmit={handleBookingSubmit} className="space-y-4 text-xs font-sans">
                {/* Service Dropdown */}
                <div className="space-y-1.5">
                  <label className="text-slate-400 font-semibold">Select Session Portfolio Category</label>
                  <select
                    value={selectedService?.id || ''}
                    onChange={(e) => {
                      const service = services.find(s => s.id === e.target.value);
                      if (service) setSelectedService(service);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3.5 text-white outline-none focus:border-amber-500 font-semibold"
                  >
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.title} — Starting ₹{s.price.toLocaleString('en-IN')}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
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

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-slate-400 font-semibold">Appointment Date</label>
                    <input
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white outline-none focus:border-amber-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-400 font-semibold">Session Hour / Time</label>
                    <input
                      type="time"
                      required
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-400 font-semibold">Shoot Venue Location / Address</label>
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white outline-none focus:border-amber-500"
                    placeholder="e.g. Kishanpur Road, Khaga, Fatehpur, UP"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-400 font-semibold">Your Personal Billing Address</label>
                  <textarea
                    required
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white outline-none focus:border-amber-500"
                    placeholder="Residential address for Tax Invoicing..."
                  ></textarea>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-400 font-semibold">Special Instructions or Custom Props Requested</label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white outline-none focus:border-amber-500"
                    placeholder="e.g. Heated prop setups, extra drone aerial, white background only..."
                  ></textarea>
                </div>

                {/* Advance selection dropdown */}
                <div className="space-y-1.5">
                  <label className="text-slate-400 font-semibold">Confirm Slot Reservation Advance Amount</label>
                  <select
                    value={advancePaid}
                    onChange={(e) => setAdvancePaid(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white outline-none focus:border-amber-500 font-semibold"
                  >
                    <option value={2000}>₹2,000 — Standard slot locking (Min)</option>
                    <option value={5000}>₹5,000 — Medium combo lock</option>
                    <option value={selectedService ? selectedService.price : 10000}>
                      ₹{selectedService ? selectedService.price.toLocaleString('en-IN') : '10,000'} — Pay Full Amount Now
                    </option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-amber-400 hover:bg-amber-500 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-extrabold rounded-xl text-center text-xs tracking-wider transition-colors"
                >
                  {isSubmitting ? 'Scheduling Appointment Slot...' : `Confirm Shoot Appointment Slot & Pay ₹${advancePaid.toLocaleString('en-IN')}`}
                </button>
              </form>
            </div>

            {/* Spec Column */}
            <div className="space-y-6">
              {selectedService && (
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wide border-b border-slate-800 pb-3">
                    Selected Package Summary
                  </h3>
                  <div className="aspect-video rounded-xl overflow-hidden bg-slate-950">
                    <img src={selectedService.image} alt={selectedService.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">{selectedService.title}</h4>
                    <p className="text-xxs text-slate-400 mt-1 line-clamp-4 leading-relaxed">{selectedService.description}</p>
                  </div>
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-850/60 text-xs font-sans space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Package Base:</span>
                      <span className="text-white font-medium">₹{selectedService.price.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-emerald-400">
                      <span>Reservation Deposit:</span>
                      <span>-₹{advancePaid.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-800 pt-2 font-bold text-amber-400 text-sm">
                      <span>Venue Balance Due:</span>
                      <span>₹{Math.max(0, selectedService.price - advancePaid).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl text-xs leading-relaxed text-slate-400">
                <div className="flex items-center space-x-2 text-white font-bold uppercase text-xxs tracking-wider border-b border-slate-800 pb-2">
                  <Award className="h-4.5 w-4.5 text-amber-500" />
                  <span>The Shiv Studio Guarantee</span>
                </div>
                <p>1. Highly seasoned portrait coordinators appointed within 1 hour.</p>
                <p>2. Backup camera kits and optics fully tested before venue dispatch.</p>
                <p>3. Instant soft deliverables catalog link inside your profile portal.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
