import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { GalleryItem, VideoItem } from '../types';
import { VideoPlayer } from '../components/VideoPlayer';
import { VideoCard } from '../components/VideoCard';
import { validateAndFilterVideoDocs } from '../utils/videoUtils';
import { SEOHead } from '../components/SEOHead';
import { getImageForSlugOrCategory, STUDIO_IMAGES } from '../assets/studioAssets';
import { StudioImage } from '../components/StudioMedia';
import { Camera, Film, ZoomIn, X, Image as ImageIcon } from 'lucide-react';

const DEFAULT_SHOWCASE_GALLERY: GalleryItem[] = [
  { id: 'gal_wed_1', title: 'Royal Mandap Evening', category: 'Wedding', imageUrl: STUDIO_IMAGES.heroWedding, isFeatured: true, mediaType: 'photo' },
  { id: 'gal_pre_1', title: 'Palace Sunset Pre-Wedding', category: 'Pre-Wedding', imageUrl: STUDIO_IMAGES.preWedding, isFeatured: true, mediaType: 'photo' },
  { id: 'gal_eng_1', title: 'Sacred Ring Exchange', category: 'Engagement', imageUrl: STUDIO_IMAGES.engagementRing, isFeatured: true, mediaType: 'photo' },
  { id: 'gal_bday_1', title: 'Family Milestone Celebration', category: 'Birthday', imageUrl: STUDIO_IMAGES.birthdayEvent, isFeatured: false, mediaType: 'photo' },
  { id: 'gal_mat_1', title: 'Warm Motherhood Portrait', category: 'Maternity', imageUrl: STUDIO_IMAGES.maternityBaby, isFeatured: true, mediaType: 'photo' },
  { id: 'gal_film_1', title: '4K Cinema & Drone Coverage', category: 'Cinematic Films', imageUrl: STUDIO_IMAGES.cinematicDrone, isFeatured: true, mediaType: 'photo' },
  { id: 'gal_alb_1', title: 'Arvind Creation Velvet Album', category: 'Album Designs', imageUrl: STUDIO_IMAGES.luxuryAlbumFrame, isFeatured: true, mediaType: 'photo' },
  { id: 'gal_evt_1', title: 'Khaga Studio Setup', category: 'Events', imageUrl: STUDIO_IMAGES.studioPortrait, isFeatured: false, mediaType: 'photo' }
];

const PORTFOLIO_CATEGORIES = [
  'All',
  'Wedding',
  'Pre-Wedding',
  'Engagement',
  'Birthday',
  'Maternity',
  'Baby',
  'Events',
  'Cinematic Films',
  'Album Designs'
];

function matchesGalleryCategory(itemCategory: string, activeFilter: string): boolean {
  if (activeFilter === 'All') return true;
  const c = (itemCategory || '').toLowerCase();
  const f = activeFilter.toLowerCase();
  if (f === 'pre-wedding') return c === 'pre-wedding' || c === 'pre wedding';
  if (f === 'album designs') return c === 'album designs' || c === 'albums';
  if (f === 'cinematic films') return c === 'cinematic films' || c === 'videos' || c === 'drone';
  return c === f;
}

export const Gallery: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'photos' | 'videos'>('photos');
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('All');

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'gallery'));
        const loaded = querySnapshot.docs.map((d) => ({ id: d.id, ...d.data() } as GalleryItem));
        setGallery(loaded.length > 0 ? loaded : DEFAULT_SHOWCASE_GALLERY);
      } catch {
        setGallery(DEFAULT_SHOWCASE_GALLERY);
      } finally {
        setLoading(false);
      }
    };
    fetchPhotos();

    const unsubVideos = onSnapshot(
      collection(db, 'videos'),
      (snap) => {
        const loaded = snap.docs.map((d) => ({ id: d.id, ...d.data() } as VideoItem));
        const valid = validateAndFilterVideoDocs(loaded);
        valid.sort((a, b) => (a.order || 0) - (b.order || 0));
        setVideos(valid);
      },
      () => {}
    );

    return () => unsubVideos();
  }, []);

  const filteredPhotos = gallery.filter((item) => matchesGalleryCategory(item.category, activeCategory));
  const filteredVideos =
    activeCategory === 'All' || activeCategory === 'Cinematic Films'
      ? videos
      : videos.filter((v) => matchesGalleryCategory(v.category || '', activeCategory));

  return (
    <div className="bg-[#111111] min-h-screen text-white py-16 px-4 sm:px-6 lg:px-8">
      <SEOHead
        title="Portfolio & Gallery — SHIV STUDIO Khaga"
        description="Browse SHIV STUDIO wedding photography, pre-wedding shoots, engagement moments, birthday, maternity, baby portraits, cinematic drone films, and album designs."
        canonicalPath="/gallery"
      />

      <div className="max-w-7xl mx-auto space-y-10">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <p className="text-xs uppercase tracking-[0.25em] text-[#D4AF37] font-semibold">
            Selected Works
          </p>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-semibold text-white">
            Portfolio &amp; Film Gallery
          </h1>
          <p className="text-sm sm:text-base text-neutral-400 leading-relaxed">
            Real moments captured across Khaga, Fatehpur, and destination weddings — curated across photography and 4K cinema.
          </p>
        </div>

        {/* Photos / Videos Switcher */}
        <div className="flex justify-center">
          <div className="bg-[#1A1A1A] border border-white/10 p-1.5 rounded-xl flex items-center space-x-2">
            <button
              type="button"
              onClick={() => {
                setActiveTab('photos');
                setActiveCategory('All');
              }}
              className={`px-5 py-2.5 rounded-lg text-xs font-semibold flex items-center space-x-2 transition-colors ${
                activeTab === 'photos'
                  ? 'bg-[#D4AF37] text-[#111111]'
                  : 'text-neutral-300 hover:text-white'
              }`}
            >
              <ImageIcon className="h-4 w-4" />
              <span>Photography ({gallery.length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('videos');
                setActiveCategory('All');
              }}
              className={`px-5 py-2.5 rounded-lg text-xs font-semibold flex items-center space-x-2 transition-colors ${
                activeTab === 'videos'
                  ? 'bg-[#D4AF37] text-[#111111]'
                  : 'text-neutral-300 hover:text-white'
              }`}
            >
              <Film className="h-4 w-4" />
              <span>Cinematic Films ({videos.length})</span>
            </button>
          </div>
        </div>

        {/* Categories Filter */}
        <div className="flex flex-wrap justify-center gap-2 pb-6 border-b border-white/10">
          {PORTFOLIO_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                activeCategory === cat
                  ? 'bg-[#D4AF37] text-[#111111] font-semibold'
                  : 'bg-[#1A1A1A] text-neutral-300 hover:text-white border border-white/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="bg-[#1A1A1A] rounded-xl h-64 animate-pulse border border-white/10" />
            ))}
          </div>
        ) : activeTab === 'photos' ? (
          filteredPhotos.length === 0 ? (
            <div className="text-center py-20 bg-[#1A1A1A] rounded-2xl border border-white/10 p-8 space-y-4 max-w-xl mx-auto">
              <Camera className="h-10 w-10 text-[#D4AF37] mx-auto" />
              <h3 className="font-display text-2xl font-semibold text-white">No Photos in "{activeCategory}"</h3>
              <p className="text-xs text-neutral-400">
                Select another portfolio category or reach out to view sample albums in studio.
              </p>
              <button
                onClick={() => setActiveCategory('All')}
                className="px-5 py-2.5 bg-[#D4AF37] text-[#111111] font-semibold text-xs rounded-lg"
              >
                Show All Works
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {filteredPhotos.map((item) => {
                const fallbackImg = getImageForSlugOrCategory(item.category);
                return (
                <div
                  key={item.id}
                  onClick={() => setSelectedImage(item.imageUrl || fallbackImg)}
                  className="group relative rounded-xl overflow-hidden cursor-zoom-in aspect-[3/4] bg-[#1A1A1A] border border-white/10 hover:border-[#D4AF37]/40 transition-colors"
                >
                  <StudioImage
                    src={item.imageUrl}
                    fallback={fallbackImg}
                    alt={item.altText || item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-4">
                    <div className="flex justify-end">
                      <span className="p-2 bg-[#111111]/85 rounded-lg text-[#D4AF37]">
                        <ZoomIn className="h-4 w-4" />
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-[#D4AF37] tracking-widest uppercase">
                        {item.category}
                      </span>
                      <h3 className="text-xs sm:text-sm font-medium text-white mt-0.5 line-clamp-1">
                        {item.title}
                      </h3>
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
          )
        ) : filteredVideos.length === 0 ? (
          <div className="text-center py-20 bg-[#1A1A1A] rounded-2xl border border-white/10 p-8 space-y-4 max-w-xl mx-auto">
            <Film className="h-10 w-10 text-[#D4AF37] mx-auto" />
            <h3 className="font-display text-2xl font-semibold text-white">Cinematic Films Gallery</h3>
            <p className="text-xs sm:text-sm text-neutral-400">
              Our curated wedding films and drone teasers are being updated. Visit our Instagram{' '}
              <a
                href="https://www.instagram.com/Shiv_photography_officel/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#D4AF37] underline"
              >
                @Shiv_photography_officel
              </a>{' '}
              for latest reels or enquire for full private wedding film links.
            </p>
            <Link
              to="/services/cinematic-videography"
              className="inline-block px-5 py-2.5 bg-[#D4AF37] text-[#111111] font-semibold text-xs rounded-lg"
            >
              Explore Cinematic Videography
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVideos.map((item) => (
              <VideoCard key={item.id} video={item} onPlay={(vid) => setSelectedVideo(vid)} />
            ))}
          </div>
        )}
      </div>

      {/* Photo Lightbox */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 cursor-zoom-out"
          onClick={() => setSelectedImage(null)}
        >
          <StudioImage
            src={selectedImage}
            alt="SHIV STUDIO enlarged photograph"
            className="max-w-full max-h-[90vh] object-contain rounded-xl border border-white/15"
          />
        </div>
      )}

      {/* Video Lightbox */}
      {selectedVideo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-md"
          onClick={() => setSelectedVideo(null)}
        >
          <div
            className="relative w-full max-w-4xl bg-[#1A1A1A] border border-white/15 rounded-2xl p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center space-x-2">
                <Film className="h-5 w-5 text-[#D4AF37]" />
                <h3 className="text-base font-semibold text-white">{selectedVideo.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedVideo(null)}
                className="p-2 text-neutral-400 hover:text-white bg-[#111111] rounded-lg"
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
