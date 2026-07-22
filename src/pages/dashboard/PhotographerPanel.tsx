import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Booking } from '../../types';
import { Camera, Calendar, MapPin, Phone, CheckCircle, Clock } from 'lucide-react';

export const PhotographerPanel: React.FC = () => {
  const [shoots, setShoots] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchShoots();
  }, []);

  const fetchShoots = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'bookings'));
      setShoots(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking)));
    } catch (err) {
      console.error('Error fetching shoots:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteShoot = async (bookingId: string) => {
    if (window.confirm('Mark this shoot session as successfully completed?')) {
      try {
        await updateDoc(doc(db, 'bookings', bookingId), {
          status: 'Completed'
        });
        fetchShoots();
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="bg-slate-950 min-h-screen text-slate-100 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-10">
        
        {/* Header */}
        <div className="border-b border-slate-900 pb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
            <Camera className="h-7 w-7 text-amber-500" />
            <span>Photographer Allocation Workspace</span>
          </h1>
          <p className="text-xxs sm:text-xs text-slate-400 mt-1">Coordinate portrait shoots, outdoor pre-wedding venues, and report completion status.</p>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((n) => <div key={n} className="bg-slate-900 h-32 rounded-2xl animate-pulse"></div>)}
          </div>
        ) : shoots.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <p>No photography sessions currently allocated to your roster.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {shoots.map((shoot) => (
              <div key={shoot.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-xl">
                <div className="space-y-3 font-sans text-xs text-slate-400">
                  <span className={`inline-block px-2.5 py-0.5 rounded text-xxs font-bold uppercase font-mono ${
                    shoot.status === 'Completed' 
                      ? 'bg-emerald-500/10 text-emerald-400' 
                      : 'bg-amber-500/10 text-amber-400'
                  }`}>
                    {shoot.status}
                  </span>

                  <h3 className="text-base font-bold text-white mt-2">{shoot.serviceTitle}</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 pt-2">
                    <p className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4 text-amber-500" />
                      <span className="text-slate-300 font-semibold">{shoot.date} at {shoot.time}</span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 text-amber-500" />
                      <span className="truncate text-slate-300">{shoot.location}</span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <Phone className="h-4 w-4 text-amber-500" />
                      <span className="text-slate-300">Client: {shoot.customerName} ({shoot.customerPhone})</span>
                    </p>
                  </div>

                  {shoot.notes && (
                    <p className="text-slate-500 bg-slate-950 p-3 rounded-xl border border-slate-850 max-w-xl">
                      <span className="font-bold text-slate-400">Props/Instructions:</span> {shoot.notes}
                    </p>
                  )}
                </div>

                {shoot.status !== 'Completed' && (
                  <button
                    onClick={() => handleCompleteShoot(shoot.id)}
                    className="px-5 py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition-colors shrink-0"
                  >
                    <CheckCircle className="h-4.5 w-4.5" />
                    <span>Report Completed</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
