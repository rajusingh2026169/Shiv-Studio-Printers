import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, getDocs, getDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { Order, Booking } from '../types';
import { SEOHead } from '../components/SEOHead';
import { Search, CalendarDays, Eye, Printer, Lock } from 'lucide-react';
import { InvoiceModal } from '../components/InvoiceModal';

export const TrackOrder: React.FC = () => {
  const { currentUser, isAdmin } = useAuth();
  const [trackInput, setTrackInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [orderResults, setOrderResults] = useState<Order[]>([]);
  const [bookingResults, setBookingResults] = useState<Booking[]>([]);
  const [searched, setSearched] = useState(false);
  const [authNotice, setAuthNotice] = useState(false);

  // Selected document to view Tax Invoice
  const [selectedDoc, setSelectedDoc] = useState<Order | Booking | null>(null);
  const [selectedType, setSelectedType] = useState<'order' | 'booking'>('order');

  const handleTrackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const queryTerm = trackInput.trim();
    if (!queryTerm) return;

    setLoading(true);
    setSearched(true);
    setAuthNotice(false);
    setOrderResults([]);
    setBookingResults([]);

    if (!currentUser) {
      setAuthNotice(true);
      setLoading(false);
      return;
    }

    try {
      const adminUser = isAdmin();

      // 1. Check if queryTerm matches a single direct document ID
      if (queryTerm.startsWith('LM-') || queryTerm.startsWith('ORD-') || queryTerm.startsWith('BK-') || queryTerm.length >= 8) {
        try {
          const orderDocRef = doc(db, 'orders', queryTerm);
          const orderSnap = await getDoc(orderDocRef);
          if (orderSnap.exists()) {
            const ord = { id: orderSnap.id, ...orderSnap.data() } as Order;
            if (adminUser || ord.customerId === currentUser.uid) {
              setOrderResults([ord]);
              setLoading(false);
              return;
            }
          }
        } catch {
          // Try booking next or scoped list
        }

        try {
          const bookingDocRef = doc(db, 'bookings', queryTerm);
          const bookingSnap = await getDoc(bookingDocRef);
          if (bookingSnap.exists()) {
            const bk = { id: bookingSnap.id, ...bookingSnap.data() } as Booking;
            if (adminUser || bk.customerId === currentUser.uid) {
              setBookingResults([bk]);
              setLoading(false);
              return;
            }
          }
        } catch {
          // Continue to scoped list
        }
      }

      // 2. Scoped query: Admin queries across Phone/Email; Customer queries own customerId
      const qLower = queryTerm.toLowerCase();
      if (adminUser) {
        const ordersRef = collection(db, 'orders');
        const [ordersSnapPhone, ordersSnapEmail] = await Promise.all([
          getDocs(query(ordersRef, where('customerPhone', '==', queryTerm))),
          getDocs(query(ordersRef, where('customerEmail', '==', queryTerm)))
        ]);
        const ordersList: Order[] = [];
        ordersSnapPhone.forEach((d) => ordersList.push({ id: d.id, ...d.data() } as Order));
        ordersSnapEmail.forEach((d) => {
          if (!ordersList.some((o) => o.id === d.id)) {
            ordersList.push({ id: d.id, ...d.data() } as Order);
          }
        });
        setOrderResults(ordersList);

        const bookingsRef = collection(db, 'bookings');
        const [bookingsSnapPhone, bookingsSnapEmail] = await Promise.all([
          getDocs(query(bookingsRef, where('customerPhone', '==', queryTerm))),
          getDocs(query(bookingsRef, where('customerEmail', '==', queryTerm)))
        ]);
        const bookingsList: Booking[] = [];
        bookingsSnapPhone.forEach((d) => bookingsList.push({ id: d.id, ...d.data() } as Booking));
        bookingsSnapEmail.forEach((d) => {
          if (!bookingsList.some((b) => b.id === d.id)) {
            bookingsList.push({ id: d.id, ...d.data() } as Booking);
          }
        });
        setBookingResults(bookingsList);
      } else {
        const [myOrdersSnap, myBookingsSnap] = await Promise.all([
          getDocs(query(collection(db, 'orders'), where('customerId', '==', currentUser.uid))),
          getDocs(query(collection(db, 'bookings'), where('customerId', '==', currentUser.uid)))
        ]);

        const matchingOrders = myOrdersSnap.docs
          .map((d) => ({ id: d.id, ...d.data() } as Order))
          .filter(
            (o) =>
              o.id.toLowerCase() === qLower ||
              (o.customerPhone || '').toLowerCase() === qLower ||
              (o.customerEmail || '').toLowerCase() === qLower
          );
        const matchingBookings = myBookingsSnap.docs
          .map((d) => ({ id: d.id, ...d.data() } as Booking))
          .filter(
            (b) =>
              b.id.toLowerCase() === qLower ||
              (b.customerPhone || '').toLowerCase() === qLower ||
              (b.customerEmail || '').toLowerCase() === qLower
          );

        setOrderResults(matchingOrders);
        setBookingResults(matchingBookings);
      }
    } catch (err) {
      console.error('Error tracking query:', err);
    } finally {
      setLoading(false);
    }
  };

  // Status mapping for order steps
  const orderSteps: Order['status'][] = ['Pending', 'Accepted', 'Designing', 'Printing', 'Ready', 'Shipped', 'Delivered'];
  const getStepIndex = (status: Order['status']) => orderSteps.indexOf(status);

  return (
    <div className="bg-[#111111] min-h-screen text-white py-16 px-4 sm:px-6 lg:px-8 font-sans">
      <SEOHead
        title="Track Print Orders & Shoot Bookings — SHIV STUDIO"
        description="Track your SHIV STUDIO photo frame order, album designing status, or photography shoot booking using your ID, email, or phone number."
      />
      <div className="max-w-4xl mx-auto space-y-12">
        
        {/* Page Header */}
        <div className="text-center space-y-3">
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#D4AF37]">
            Real-Time Status Tracker
          </p>
          <h1 className="font-serif text-3xl sm:text-5xl font-semibold text-white tracking-tight">
            Track Orders & Shoot Bookings
          </h1>
          <p className="max-w-2xl mx-auto text-neutral-400 text-sm sm:text-base leading-relaxed">
            Enter your Email, Phone Number, or Order/Booking ID to view your current print status, shoot schedule, and invoice.
          </p>
        </div>

        {/* Tracking Search Panel */}
        <form onSubmit={handleTrackSubmit} className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-4 h-5 w-5 text-slate-500" />
            <input
              type="text"
              required
              value={trackInput}
              onChange={(e) => setTrackInput(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-12 pr-4 py-4 text-xs sm:text-sm text-white focus:border-amber-500 outline-none placeholder:text-slate-500"
              placeholder="Enter ID, Email, or Phone (e.g. LM-123456 or arvind@gmail.com)"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-amber-400 hover:bg-amber-500 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-extrabold rounded-2xl text-xs tracking-wider transition-all"
          >
            {loading ? 'Fetching records...' : 'Fetch Real-Time Status'}
          </button>
        </form>

        {authNotice && (
          <div className="bg-[#1A1A1A] border border-[#D4AF37]/30 rounded-2xl p-6 text-center space-y-3">
            <Lock className="h-7 w-7 text-[#D4AF37] mx-auto" />
            <h3 className="text-base font-semibold text-white">Sign In Required for Private Order &amp; Booking Lookup</h3>
            <p className="text-xs text-neutral-400 max-w-md mx-auto">
              To protect client phone numbers, addresses, and uploaded photos, please sign in with your SHIV STUDIO client account or contact us on WhatsApp with your Order/Booking ID.
            </p>
            <div className="pt-2 flex justify-center gap-3">
              <Link
                to="/login"
                className="px-5 py-2.5 bg-[#D4AF37] hover:bg-[#E5C158] text-[#111111] font-semibold rounded-xl text-xs uppercase tracking-wider"
              >
                Sign In to Track
              </Link>
              <Link
                to="/contact"
                className="px-5 py-2.5 bg-white/5 border border-white/15 hover:border-[#D4AF37] text-white font-semibold rounded-xl text-xs uppercase tracking-wider"
              >
                Contact Studio
              </Link>
            </div>
          </div>
        )}

        {/* Tracking results view */}
        {searched && !loading && !authNotice && orderResults.length === 0 && bookingResults.length === 0 && (
          <div className="text-center py-16 rounded-2xl border border-slate-800 bg-slate-900/30 text-slate-500 text-xs sm:text-sm">
            <p>No active print orders or scheduled shoots found matching query.</p>
          </div>
        )}

        {/* 1. Print Orders Results */}
        {orderResults.length > 0 && (
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
              <Printer className="h-4.5 w-4.5 text-amber-500" />
              <span>Active Print Orders Tracking</span>
            </h3>

            {orderResults.map((order) => (
              <div key={order.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
                  <div>
                    <span className="text-xxs text-slate-500 font-mono uppercase">ORDER ID:</span>
                    <h4 className="font-bold text-white text-base">#{order.id}</h4>
                    <p className="text-xxs text-slate-400 mt-0.5">Billed to {order.customerName}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/25 text-xxs font-bold uppercase rounded font-mono">
                      {order.status}
                    </span>
                    <button
                      onClick={() => { setSelectedDoc(order); setSelectedType('order'); }}
                      className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-850 border border-slate-850 text-slate-300 hover:text-white"
                      title="View GST Invoice"
                    >
                      <Eye className="h-4.5 w-4.5" />
                    </button>
                  </div>
                </div>

                {/* Progress Tracker Horizontal Step */}
                <div className="space-y-3 font-sans">
                  <p className="text-xxs text-slate-500 font-bold uppercase tracking-wider">Manufacturing Queue status</p>
                  
                  {/* Step Indicators */}
                  <div className="flex justify-between items-center text-center relative pt-4">
                    {/* Background Progress Bar Line */}
                    <div className="absolute top-7 left-6 right-6 h-1 bg-slate-800 z-0"></div>
                    <div 
                      className="absolute top-7 left-6 h-1 bg-amber-500 z-0 transition-all duration-300"
                      style={{ width: `${(getStepIndex(order.status) / (orderSteps.length - 1)) * 100}%` }}
                    ></div>

                    {orderSteps.map((step, idx) => {
                      const isActive = getStepIndex(order.status) >= idx;
                      return (
                        <div key={step} className="relative z-10 flex flex-col items-center flex-1">
                          <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center text-xxs font-bold ${
                            isActive 
                              ? 'bg-amber-500 border-amber-400 text-slate-950' 
                              : 'bg-slate-950 border-slate-800 text-slate-500'
                          }`}>
                            {idx + 1}
                          </div>
                          <span className={`text-xxs mt-2 font-semibold block ${isActive ? 'text-white' : 'text-slate-600'}`}>
                            {step}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Order Deliverables summary */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-850/60 grid grid-cols-2 gap-4 text-xs font-sans text-slate-400">
                  <div>
                    <p className="text-slate-500 font-semibold uppercase tracking-wider font-mono">Items In Bundle</p>
                    <ul className="list-disc pl-4 mt-2 text-slate-300 space-y-1">
                      {order.items.map((item, idx) => (
                        <li key={idx} className="line-clamp-1">{item.productTitle} (x{item.quantity})</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-slate-500 font-semibold uppercase tracking-wider font-mono">Logistics Information</p>
                    <p className="text-slate-300 mt-2">Dispatched to: {order.address}</p>
                    <p className="text-amber-500 font-bold mt-1">Paid Amount: ₹{order.total.toLocaleString('en-IN')}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 2. Shoot Bookings Results */}
        {bookingResults.length > 0 && (
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
              <CalendarDays className="h-4.5 w-4.5 text-amber-500" />
              <span>Active Shoot Bookings Status</span>
            </h3>

            {bookingResults.map((booking) => (
              <div key={booking.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
                  <div>
                    <span className="text-xxs text-slate-500 font-mono uppercase">BOOKING ID:</span>
                    <h4 className="font-bold text-white text-base">#{booking.id}</h4>
                    <p className="text-xxs text-slate-400 mt-0.5">Session: {booking.serviceTitle}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-3 py-1 border text-xxs font-bold uppercase rounded font-mono ${
                      booking.status === 'Approved' 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                        : booking.status === 'Completed'
                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}>
                      {booking.status}
                    </span>
                    <button
                      onClick={() => { setSelectedDoc(booking); setSelectedType('booking'); }}
                      className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-850 border border-slate-850 text-slate-300 hover:text-white"
                      title="View Booking Receipt"
                    >
                      <Eye className="h-4.5 w-4.5" />
                    </button>
                  </div>
                </div>

                <div className="bg-slate-950 p-5 rounded-2xl grid grid-cols-2 md:grid-cols-4 gap-6 text-xs font-sans text-slate-400">
                  <div>
                    <p className="text-slate-500 font-semibold uppercase tracking-wider font-mono">Date & Hour</p>
                    <p className="font-bold text-white mt-1.5">{booking.date}</p>
                    <p className="text-slate-400 font-medium mt-0.5">{booking.time}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 font-semibold uppercase tracking-wider font-mono">Shoot Venue</p>
                    <p className="font-bold text-white mt-1.5 truncate">{booking.location}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 font-semibold uppercase tracking-wider font-mono">Allocated Staff</p>
                    <p className="font-bold text-amber-500 mt-1.5">{booking.photographerName || 'Assigning Photographer...'}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 font-semibold uppercase tracking-wider font-mono">Advance Deposit</p>
                    <p className="font-bold text-emerald-400 mt-1.5">₹{booking.advancePaid.toLocaleString('en-IN')}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* RENDER TAX INVOICE TRIGGER */}
      {selectedDoc && (
        <InvoiceModal
          isOpen={true}
          onClose={() => setSelectedDoc(null)}
          documentData={selectedDoc}
          type={selectedType}
        />
      )}
    </div>
  );
};
