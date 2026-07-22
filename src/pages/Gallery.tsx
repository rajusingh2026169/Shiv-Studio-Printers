import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { GalleryItem } from '../types';
import { Camera, ZoomIn, Eye, Layers } from 'lucide-react';

export const Gallery: React.FC = () => {
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGallery = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'gallery'));
        setGallery(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GalleryItem)));
      } catch (err) {
        console.error('Error loading gallery:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchGallery();
  }, []);

  const categories = ['All', 'Wedding', 'Pre Wedding', 'Baby', 'Events', 'Birthday', 'Drone', 'Albums', 'Videos'];

  const filteredGallery = activeCategory === 'All' 
    ? gallery 
    : gallery.filter(item => item.category === activeCategory);

  return (
    <div className="bg-slate-950 min-h-screen text-slate-100 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* Gallery Header */}
        <div className="text-center space-y-4">
          <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold uppercase tracking-wider">
            Premium Studio Portfolios
          </span>
          <h1 className="text-3xl sm:text-5xl font-sans font-bold text-white tracking-tight">
            Our Cinematic Portfolio Gallery
          </h1>
          <p className="max-w-2xl mx-auto text-slate-400 text-sm sm:text-base leading-relaxed">
            Browse through real-time shots captured by our award-winning G-Master photographers. Staggered lightboxes and dynamic high definition rendering.
          </p>
        </div>

        {/* Category filters list */}
        <div className="flex flex-wrap justify-center gap-2 pb-6 border-b border-slate-900">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeCategory === cat 
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/15' 
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Masonry or flexible layout grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="bg-slate-900 rounded-xl h-64 animate-pulse border border-slate-800"></div>
            ))}
          </div>
        ) : gallery.length === 0 ? (
          <div className="text-center py-20 bg-slate-900 rounded-3xl border border-slate-800 p-8 space-y-6 max-w-xl mx-auto">
            <div className="mx-auto w-16 h-16 bg-amber-500/10 border border-amber-500/25 rounded-full flex items-center justify-center">
              <Camera className="h-8 w-8 text-amber-500" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">No Gallery Images Available</h3>
              <p className="text-sm text-slate-400">Our high definition portfolio shots and pre-wedding captures are currently being organized.</p>
            </div>
            <Link
              to="/dashboard"
              className="inline-flex items-center space-x-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-5 py-3 rounded-xl text-xs sm:text-sm transition-all animate-bounce"
            >
              <span>Upload Gallery (Admin)</span>
            </Link>
          </div>
        ) : filteredGallery.length === 0 ? (
          <div className="text-center py-16 text-slate-500 text-xs sm:text-sm">
            <Camera className="h-10 w-10 mx-auto text-slate-700 mb-2" />
            <p>No gallery assets found in category "{activeCategory}".</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {filteredGallery.map((item) => (
              <div 
                key={item.id}
                onClick={() => setSelectedImage(item.imageUrl)}
                className="group relative rounded-xl overflow-hidden cursor-zoom-in aspect-square md:aspect-[3/4] bg-slate-950 border border-slate-900 shadow-lg hover:border-slate-700 transition-all duration-300"
              >
                <img 
                  src={item.imageUrl} 
                  alt={item.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
                
                {/* Visual Hover Mask */}
                <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-4">
                  <div className="flex justify-end">
                    <span className="p-2 bg-slate-900/80 rounded-lg text-amber-500 border border-slate-850">
                      <ZoomIn className="h-4 w-4" />
                    </span>
                  </div>
                  <div>
                    <span className="text-xxs font-bold text-amber-500 tracking-wider uppercase font-mono">{item.category}</span>
                    <h3 className="text-xs sm:text-sm font-semibold text-white mt-1 line-clamp-1">{item.title}</h3>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox Trigger */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 cursor-zoom-out"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img 
              src={selectedImage} 
              alt="High Definition enlarged media" 
              className="max-w-full max-h-[90vh] object-contain rounded-2xl border border-slate-800 shadow-2xl" 
              referrerPolicy="no-referrer"
            />
            <p className="absolute bottom-4 left-4 bg-slate-950/80 px-4 py-1.5 text-xs text-amber-400 border border-slate-800 rounded-full">
              Click anywhere to close preview
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
