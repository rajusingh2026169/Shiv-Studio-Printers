import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { ServiceItem } from '../types';
import { Camera, Printer, Layers, Film, HeartHandshake, Eye, Sparkles } from 'lucide-react';

export const Services: React.FC = () => {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [filter, setFilter] = useState<'All' | 'Photography' | 'Printing'>('All');
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'services'));
        const list = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ServiceItem));
        setServices(list);
      } catch (err) {
        console.error('Error fetching services:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  const filteredServices = filter === 'All' 
    ? services 
    : services.filter(s => s.category === filter);

  return (
    <div className="bg-slate-950 min-h-screen text-slate-100 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* Page Header */}
        <div className="text-center space-y-4">
          <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold uppercase tracking-wider">
            Premium Studio Portfolios & High Volume Printing Press
          </span>
          <h1 className="text-3xl sm:text-5xl font-sans font-bold tracking-tight text-white">
            Our Photography & Printing Services
          </h1>
          <p className="max-w-2xl mx-auto text-slate-400 text-sm sm:text-base leading-relaxed">
            Choose from cinematic outdoor photo sessions, baby portfolio setups with sanitized heated toys, or digital/offset high-resolution printing for corporations.
          </p>
        </div>

        {/* Categories Tab selector */}
        <div className="flex justify-center gap-3 border-b border-slate-900 pb-6">
          <button
            onClick={() => setFilter('All')}
            className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              filter === 'All' 
                ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/10' 
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            All Services
          </button>
          <button
            onClick={() => setFilter('Photography')}
            className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center space-x-1.5 ${
              filter === 'Photography' 
                ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/10' 
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Camera className="h-4 w-4" />
            <span>Photography & Shoots</span>
          </button>
          <button
            onClick={() => setFilter('Printing')}
            className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center space-x-1.5 ${
              filter === 'Printing' 
                ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/10' 
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Printer className="h-4 w-4" />
            <span>Printing Press & Album Design</span>
          </button>
        </div>

        {/* Loading skeleton */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-slate-900 rounded-2xl h-96 animate-pulse border border-slate-800"></div>
            ))}
          </div>
        ) : services.length === 0 ? (
          <div className="text-center py-20 bg-slate-900 rounded-3xl border border-slate-800 p-8 space-y-6 max-w-xl mx-auto">
            <div className="mx-auto w-16 h-16 bg-amber-500/10 border border-amber-500/25 rounded-full flex items-center justify-center">
              <Camera className="h-8 w-8 text-amber-500" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">No Services Available</h3>
              <p className="text-sm text-slate-400">Our photography and printing packages are currently being updated by the administration.</p>
            </div>
            <Link
              to="/dashboard"
              className="inline-flex items-center space-x-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-5 py-3 rounded-xl text-xs sm:text-sm transition-all animate-bounce"
            >
              <span>Add New Service (Admin)</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {filteredServices.map((service) => (
              <div 
                key={service.id} 
                className="group bg-slate-900 border border-slate-800/80 rounded-2xl overflow-hidden hover:border-slate-700 transition-all duration-300 shadow-xl flex flex-col justify-between"
              >
                <div>
                  <div className="relative aspect-video overflow-hidden">
                    <img 
                      src={service.image} 
                      alt={service.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                      loading="lazy"
                    />
                    <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md border border-slate-800 px-3 py-1 rounded-full text-xxs font-bold text-amber-500 uppercase font-mono">
                      {service.category}
                    </div>
                  </div>

                  <div className="p-6 space-y-3">
                    <h3 className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors">
                      {service.title}
                    </h3>
                    <p className="text-slate-400 text-xs sm:text-sm leading-relaxed line-clamp-3">
                      {service.description}
                    </p>
                  </div>
                </div>

                <div className="p-6 pt-2 border-t border-slate-800/50 flex flex-col space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xxs text-slate-500 uppercase font-mono">Package Starting At</p>
                      <p className="text-xl font-extrabold text-amber-400">₹{service.price.toLocaleString('en-IN')}</p>
                    </div>
                    <button 
                      onClick={() => setSelectedService(service)}
                      className="px-3.5 py-1.5 rounded-lg bg-slate-850 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 hover:text-white flex items-center space-x-1"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>Details & Gallery</span>
                    </button>
                  </div>

                  <Link
                    to={`/booking?service=${service.id}`}
                    className="w-full py-3 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-center text-xs rounded-xl transition-colors block"
                  >
                    Configure & Book Now
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Service Details & Gallery Modal */}
      {selectedService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 md:p-8 max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setSelectedService(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              ✕
            </button>

            <div className="space-y-6">
              <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 font-bold text-xxs uppercase tracking-wider rounded-md border border-amber-500/20">
                {selectedService.category} Service Detail
              </span>

              <h2 className="text-xl sm:text-2xl font-bold text-white">{selectedService.title}</h2>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">{selectedService.description}</p>

              {/* Package Details Specs */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-slate-500 uppercase font-mono">Service Deliverables</p>
                  <ul className="list-disc pl-4 text-slate-300 mt-2 space-y-1">
                    <li>Full Resolution Soft Backups</li>
                    <li>Professional Color Grading</li>
                    <li>Secure Download Vault access</li>
                    <li>Taxes and GST inclusive</li>
                  </ul>
                </div>
                <div>
                  <p className="text-slate-500 uppercase font-mono">Setup Information</p>
                  <p className="text-slate-300 mt-2">Khaga Studio session, heavy-backdrop frames, custom client requirements matched.</p>
                </div>
              </div>

              {/* Service Inner Gallery */}
              {selectedService.gallery && selectedService.gallery.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-500 font-mono">Shoot Work Gallery</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedService.gallery.map((imgUrl, i) => (
                      <div key={i} className="aspect-square rounded-lg overflow-hidden border border-slate-800">
                        <img 
                          src={imgUrl} 
                          alt="Deliverable gallery sample" 
                          className="w-full h-full object-cover" 
                          referrerPolicy="no-referrer"
                          loading="lazy"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-xxs text-slate-500 uppercase font-mono">Total Package Cost</p>
                  <p className="text-xl font-bold text-amber-400">₹{selectedService.price.toLocaleString('en-IN')}</p>
                </div>
                <Link
                  to={`/booking?service=${selectedService.id}`}
                  onClick={() => setSelectedService(null)}
                  className="px-6 py-3 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs rounded-xl transition-all"
                >
                  Proceed with Booking
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
