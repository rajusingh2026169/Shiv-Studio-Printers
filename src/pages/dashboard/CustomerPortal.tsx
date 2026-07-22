import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';
import { Order, Booking } from '../../types';
import { User, ShoppingBag, Calendar, Eye, ShieldCheck, Mail, Phone, MapPin, LogOut } from 'lucide-react';
import { InvoiceModal } from '../../components/InvoiceModal';

export const CustomerPortal: React.FC = () => {
  const { currentUser, userProfile, logout } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected document to view Tax Invoice
  const [selectedDoc, setSelectedDoc] = useState<Order | Booking | null>(null);
  const [selectedType, setSelectedType] = useState<'order' | 'booking'>('order');

  useEffect(() => {
    if (currentUser?.uid) {
      fetchCustomerData();
    }
  }, [currentUser]);

  const fetchCustomerData = async () => {
    try {
      setLoading(true);
      // Query orders where customerId === currentUser.uid
      const ordersRef = collection(db, 'orders');
      const ordersQ = query(ordersRef, where('customerId', '==', currentUser?.uid));
      const ordersSnap = await getDocs(ordersQ);
      setOrders(ordersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));

      // Query bookings where customerId === currentUser.uid
      const bookingsRef = collection(db, 'bookings');
      const bookingsQ = query(bookingsRef, where('customerId', '==', currentUser?.uid));
      const bookingsSnap = await getDocs(bookingsQ);
      setBookings(bookingsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking)));
    } catch (err) {
      console.error('Error fetching customer records:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-950 min-h-screen text-slate-100 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-10">
        
        {/* Portal Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 border-b border-slate-900 pb-6">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
              <User className="h-7 w-7 text-amber-500 animate-pulse" />
              <span>Welcome Back, {userProfile?.fullName || 'User'}!</span>
            </h1>
            <p className="text-xxs sm:text-xs text-slate-400">Track raw print orders, retrieve booked venue photographers, and download invoices.</p>
          </div>

          <button
            onClick={() => logout()}
            className="px-4 py-2.5 bg-slate-900 border border-slate-800 hover:bg-rose-500/10 hover:border-rose-500/25 text-rose-400 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all"
          >
            <LogOut className="h-4 w-4" />
            <span>Secure Log Out</span>
          </button>
        </div>

        {/* Customer Info Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 grid grid-cols-1 md:grid-cols-3 gap-6 shadow-xl">
          <div className="md:col-span-1 flex flex-col items-center justify-center p-4 border-b md:border-b-0 md:border-r border-slate-800/60">
            <div className="h-16 w-16 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-full flex items-center justify-center text-2xl font-black mb-3 font-mono">
              {userProfile?.fullName ? userProfile.fullName.charAt(0).toUpperCase() : 'U'}
            </div>
            <h3 className="font-bold text-white text-base">{userProfile?.fullName}</h3>
            <span className="px-2.5 py-0.5 mt-1 rounded bg-amber-500/15 text-amber-400 font-bold uppercase font-mono text-xxs tracking-wider">
              {userProfile?.role} Account
            </span>
          </div>

          <div className="md:col-span-2 space-y-3 text-xs text-slate-400 font-sans justify-center flex flex-col">
            <p className="flex items-center gap-2">
              <Mail className="h-4.5 w-4.5 text-amber-500 shrink-0" />
              <span>Email: {userProfile?.email}</span>
            </p>
            <p className="flex items-center gap-2">
              <Phone className="h-4.5 w-4.5 text-amber-500 shrink-0" />
              <span>Phone: {userProfile?.phone}</span>
            </p>
            <p className="flex items-center gap-2">
              <MapPin className="h-4.5 w-4.5 text-amber-500 shrink-0" />
              <span>Billing Address: {userProfile?.address || 'Not specified'}</span>
            </p>
          </div>
        </div>

        {/* Active bookings & historic order lists */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((n) => <div key={n} className="bg-slate-900 h-32 rounded-3xl animate-pulse"></div>)}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-xs sm:text-sm">
            
            {/* Shoot Bookings List */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-1.5 border-b border-slate-800 pb-3">
                <Calendar className="h-4.5 w-4.5 text-amber-500" />
                <span>Shoot Appointment History</span>
              </h3>

              {bookings.length === 0 ? (
                <p className="text-slate-500 text-xs py-4">You have no active or historical portrait session bookings.</p>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
                  {bookings.map((booking) => (
                    <div key={booking.id} className="bg-slate-950 p-4 rounded-2xl border border-slate-850/60 flex justify-between items-center text-xs">
                      <div>
                        <span className="text-xxs text-slate-500 font-mono">#{booking.id}</span>
                        <h4 className="font-bold text-white mt-0.5">{booking.serviceTitle}</h4>
                        <p className="text-xxs text-slate-400 mt-1">{booking.date} at {booking.time}</p>
                        <p className="text-emerald-400 font-bold text-xxs mt-0.5">Advance paid: ₹{booking.advancePaid.toLocaleString('en-IN')}</p>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        <span className={`px-2 py-0.5 rounded text-xxs font-bold ${
                          booking.status === 'Completed'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-amber-500/10 text-amber-400'
                        }`}>
                          {booking.status}
                        </span>
                        <button
                          onClick={() => { setSelectedDoc(booking); setSelectedType('booking'); }}
                          className="p-1.5 bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 rounded-lg"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Print Orders List */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-1.5 border-b border-slate-800 pb-3">
                <ShoppingBag className="h-4.5 w-4.5 text-amber-500" />
                <span>E-Store Print Orders History</span>
              </h3>

              {orders.length === 0 ? (
                <p className="text-slate-500 text-xs py-4">You have no active or historical product print orders.</p>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
                  {orders.map((order) => (
                    <div key={order.id} className="bg-slate-950 p-4 rounded-2xl border border-slate-850/60 flex justify-between items-center text-xs">
                      <div>
                        <span className="text-xxs text-slate-500 font-mono">#{order.id}</span>
                        <h4 className="font-bold text-white mt-0.5 truncate max-w-[150px]">
                          {order.items.map(i => i.productTitle).join(', ')}
                        </h4>
                        <p className="text-xxs text-slate-400 mt-1">Paid: ₹{order.total.toLocaleString('en-IN')}</p>
                        <p className="text-amber-500 font-semibold text-xxs mt-0.5 font-mono uppercase">{order.status}</p>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        <button
                          onClick={() => { setSelectedDoc(order); setSelectedType('order'); }}
                          className="p-1.5 bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 rounded-lg"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* INVOICE MODAL VIEW */}
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
