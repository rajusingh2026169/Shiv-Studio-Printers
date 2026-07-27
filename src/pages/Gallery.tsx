import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { GalleryItem, VideoItem } from '../types';
import { VideoPlayer } from '../components/VideoPlayer';
import { VideoCard } from '../components/VideoCard';
import { validateAndFilterVideoDocs } from '../utils/videoUtils';
import { Camera, Film, ZoomIn, Eye, Play, Clock, X, Image as ImageIcon } from 'lucide-react';

// Modular Feature Flag: Set to true to re-enable Video Gallery on website
const ENABLE_VIDEO_GALLERY = false;

export const Gallery: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'photos' | 'videos'>('photos');
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  
  // Lightboxes
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Fetch Photos
    const fetchPhotos = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'gallery'));
        setGallery(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GalleryItem)));
      } catch (err) {
        console.error('Error loading gallery photos:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPhotos();

    // 2. Real-time subscription to 'videos' collection (Active when ENABLE_VIDEO_GALLERY is true)
    if (ENABLE_VIDEO_GALLERY) {
      const unsubVideos = onSnapshot(collection(db, 'videos'), (snap) => {
        const loaded = snap.docs.map(d => ({ id: d.id, ...d.data() } as VideoItem));
        const valid = validateAndFilterVideoDocs(loaded);
        valid.sort((a, b) => (a.order || 0) - (b.order || 0));
        setVideos(valid);
        console.log('[Data Source: Firestore] Loaded gallery videos:', valid.length);
      }, (err) => {
        console.error('Error subscribing to videos:', err);
      });

      return () => unsubVideos();
    }
  }, []);

  const categories = ['All', 'Wedding', 'Pre Wedding', 'Baby', 'Events', 'Birthday', 'Drone', 'Albums'];

  const filteredPhotos = activeCategory === 'All' 
    ? gallery 
    : gallery.filter(item => item.category === activeCategory);

  const filteredVideos = activeCategory === 'All'
    ? videos
    : videos.filter(v => (v.category || '').toLowerCase() === activeCategory.toLowerCase());

  return (
    <div className="bg-slate-950 min-h-screen text-slate-100 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Gallery Header */}
        <div className="text-center space-y-4">
          <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold uppercase tracking-wider">
            Shiv Studio Portfolios
          </span>
          <h1 className="text-3xl sm:text-5xl font-sans font-bold text-white tracking-tight">
            Our Portfolio Masterworks
          </h1>
          <p className="max-w-2xl mx-auto text-slate-400 text-sm sm:text-base leading-relaxed">
            Explore high definition 4K portfolio shots captured by our master photographers in Khaga, Fatehpur.
          </p>
        </div>

        {/* Main Tabs (Photos vs Videos - Videos hidden when ENABLE_VIDEO_GALLERY is false) */}
        {ENABLE_VIDEO_GALLERY && (
          <div className="flex justify-center">
            <div className="bg-slate-900 border border-slate-800 p-1.5 rounded-2xl flex items-center space-x-2 shadow-2xl">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('photos');
                  setActiveCategory('All');
                }}
                className={`px-6 py-3 rounded-xl text-xs sm:text-sm font-bold flex items-center space-x-2 transition-all ${
                  activeTab === 'photos'
                    ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-850'
                }`}
              >
                <ImageIcon className="h-4 w-4" />
                <span>Photos ({gallery.length})</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('videos');
                  setActiveCategory('All');
                }}
                className={`px-6 py-3 rounded-xl text-xs sm:text-sm font-bold flex items-center space-x-2 transition-all ${
                  activeTab === 'videos'
                    ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-850'
                }`}
              >
                <Film className="h-4 w-4" />
                <span>Videos ({videos.length})</span>
              </button>
            </div>
          </div>
        )}

        {/* Category Filter Pills */}
        <div className="flex flex-wrap justify-center gap-2 pb-6 border-b border-slate-900">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeCategory === cat 
                  ? 'bg-slate-800 text-amber-400 font-bold border border-amber-500/30' 
                  : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Content Loading state */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="bg-slate-900 rounded-2xl h-64 animate-pulse border border-slate-800" />
            ))}
          </div>
        ) : activeTab === 'photos' ? (
          
          /* PHOTOS TAB VIEW */
          gallery.length === 0 ? (
            <div className="text-center py-20 bg-slate-900 rounded-3xl border border-slate-800 p-8 space-y-6 max-w-xl mx-auto">
              <div className="mx-auto w-16 h-16 bg-amber-500/10 border border-amber-500/25 rounded-full flex items-center justify-center">
                <Camera className="h-8 w-8 text-amber-500" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white">No Gallery Photos</h3>
                <p className="text-sm text-slate-400">Our studio portfolio photos are currently being loaded.</p>
              </div>
              <Link
                to="/dashboard"
                className="inline-flex items-center space-x-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-5 py-3 rounded-xl text-xs sm:text-sm transition-all"
              >
                <span>Upload Photos (Admin)</span>
              </Link>
            </div>
          ) : filteredPhotos.length === 0 ? (
            <div className="text-center py-16 text-slate-500 text-xs sm:text-sm">
              <Camera className="h-10 w-10 mx-auto text-slate-700 mb-2" />
              <p>No photo assets found in category "{activeCategory}".</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {filteredPhotos.map((item) => (
                <div 
                  key={item.id}
                  onClick={() => setSelectedImage(item.imageUrl)}
                  className="group relative rounded-2xl overflow-hidden cursor-zoom-in aspect-square md:aspect-[3/4] bg-slate-950 border border-slate-900 shadow-lg hover:border-slate-700 transition-all duration-300"
                >
                  <img 
                    src={item.imageUrl} 
                    alt={item.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
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
          )
        ) : (

          /* VIDEOS TAB VIEW */
          videos.length === 0 ? (
            <div className="text-center py-20 bg-slate-900 rounded-3xl border border-slate-800 p-8 space-y-6 max-w-xl mx-auto">
              <div className="mx-auto w-16 h-16 bg-amber-500/10 border border-amber-500/25 rounded-full flex items-center justify-center">
                <Film className="h-8 w-8 text-amber-500" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white">No Gallery Videos Uploaded</h3>
                <p className="text-sm text-slate-400">Upload 4K drone reels, pre-wedding teasers, and event highlight videos in Admin Panel.</p>
              </div>
              <Link
                to="/dashboard"
                className="inline-flex items-center space-x-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-5 py-3 rounded-xl text-xs sm:text-sm transition-all"
              >
                <span>Upload Videos (Admin)</span>
              </Link>
            </div>
          ) : filteredVideos.length === 0 ? (
            <div className="text-center py-16 text-slate-500 text-xs sm:text-sm">
              <Film className="h-10 w-10 mx-auto text-slate-700 mb-2" />
              <p>No video assets found in category "{activeCategory}".</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredVideos.map((item) => (
                <VideoCard
                  key={item.id}
                  video={item}
                  onPlay={(vid) => setSelectedVideo(vid)}
                />
              ))}
            </div>
          )
        )}
      </div>

      {/* Photo Lightbox */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 cursor-zoom-out backdrop-blur-sm"
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

      {/* Video Lightbox Player Modal (Requirement 12: Customer website video player) */}
      {selectedVideo && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-md"
          onClick={() => setSelectedVideo(null)}
        >
          <div 
            className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Film className="h-5 w-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">{selectedVideo.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedVideo(null)}
                className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-xl"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <VideoPlayer
              src={selectedVideo.videoUrl}
              poster={selectedVideo.thumbnailUrl}
              title={selectedVideo.title}
              description={selectedVideo.description}
              autoPlay
            />
          </div>
        </div>
      )}
    </div>
  );
};
