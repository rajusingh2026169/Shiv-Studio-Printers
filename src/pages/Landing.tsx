import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, query, limit, doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { ServiceItem, ProductItem, GalleryItem, ReviewItem, Coupon, VideoItem, PackageItem } from '../types';
import { isCouponActiveAndValid } from '../utils/couponEngine';
import { OfferBannerDisplay } from '../components/OfferBannerDisplay';
import { VideoPlayer } from '../components/VideoPlayer';
import { validateAndFilterVideoDocs } from '../utils/videoUtils';
import { STUDIO_IMAGES, getImageForSlugOrCategory } from '../assets/studioAssets';
import { SERVICE_DEFINITIONS, WHY_CHOOSE_US_ITEMS } from '../data/studioCatalog';
import { SEOHead } from '../components/SEOHead';
import { buildWhatsAppUrl } from '../components/WhatsAppButton';
import {
  Camera,
  MapPin,
  Clock,
  Phone,
  Mail,
  Star,
  ChevronRight,
  Copy,
  Check,
  Play,
  Film,
  X,
  Instagram,
  ArrowRight,
  MessageCircle,
  CheckCircle
} from 'lucide-react';

export const Landing: React.FC = () => {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [videoItems, setVideoItems] = useState<VideoItem[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [copiedCouponCode, setCopiedCouponCode] = useState<string | null>(null);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);

  // Instant Inquiry Form State
  const [inqName, setInqName] = useState('');
  const [inqPhone, setInqPhone] = useState('');
  const [inqTopic, setInqTopic] = useState('Wedding Photography');
  const [inqMessage, setInqMessage] = useState('');
  const [inqSubmitting, setInqSubmitting] = useState(false);
  const [inqSubmittedId, setInqSubmittedId] = useState<string | null>(null);
  const [inqError, setInqError] = useState('');
  const isInqPendingRef = useRef(false);

  const [settings, setSettings] = useState<any>({
    studioName: 'SHIV STUDIO',
    tagline: 'Capturing Moments, Creating Memories.',
    creativeBrand: 'Arvind Creation',
    instagramHandle: 'Shiv_photography_officel',
    instagramUrl: 'https://www.instagram.com/Shiv_photography_officel/',
    phone: '+91 7905256355, +91 8765706396',
    whatsappNumber: '+917905256355',
    email: 'shivsharan52796@gmail.com',
    address: 'Kishanpur Road Over Bridge, Khaga, Fatehpur, Uttar Pradesh, India – 212655',
    heroTitle: 'WE CAPTURE YOUR BEST MOMENTS.',
    heroSubtitle: 'Turning Your Precious Moments Into Timeless Memories.',
    heroImageUrl: STUDIO_IMAGES.heroWedding,
    aboutTitle: 'Crafting Timeless Visual Legacy in Khaga, Fatehpur',
    aboutDescription:
      'SHIV STUDIO and creative house Arvind Creation specialize in candid Indian wedding storytelling, cinematic 4K films, aerial drone coverage, and custom museum-grade photo frames & albums crafted for families across Fatehpur.',
    aboutImageUrl: STUDIO_IMAGES.studioPortrait,
    officeHours: 'Monday - Sunday: 09:00 AM - 09:00 PM',
    googleMapUrl:
      'https://maps.google.com/maps?q=Kishanpur%20Road,%20Khaga,%20Fatehpur,%20Uttar%20Pradesh%20212655&t=&z=15&ie=UTF8&iwloc=&output=embed',
    instagramGallery: []
  });

  useEffect(() => {
    const unsubCoupons = onSnapshot(
      collection(db, 'coupons'),
      (snapshot) => {
        const allCoupons: Coupon[] = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Coupon));
        const now = new Date();
        setCoupons(allCoupons.filter((c) => isCouponActiveAndValid(c, now)));
      },
      () => {}
    );

    const unsubProducts = onSnapshot(
      query(collection(db, 'products'), limit(3)),
      (snapshot) => {
        setProducts(snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as ProductItem)));
      },
      () => {}
    );

    const unsubVideos = onSnapshot(
      collection(db, 'videos'),
      (snapshot) => {
        const loaded = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as VideoItem));
        const valid = validateAndFilterVideoDocs(loaded);
        valid.sort((a, b) => (a.order || 0) - (b.order || 0));
        setVideoItems(valid);
      },
      () => {}
    );

    const fetchData = async () => {
      try {
        const [settingsSnap, servicesSnap, packagesSnap, gallerySnap, reviewsSnap] = await Promise.all([
          getDoc(doc(db, 'website_settings', 'studio')),
          getDocs(collection(db, 'services')),
          getDocs(collection(db, 'packages')),
          getDocs(collection(db, 'gallery')),
          getDocs(collection(db, 'reviews'))
        ]);

        if (settingsSnap.exists()) {
          setSettings((prev: any) => ({ ...prev, ...settingsSnap.data() }));
        }
        if (!servicesSnap.empty) {
          const loadedServices = servicesSnap.docs
            .map((d) => ({ id: d.id, ...d.data() } as ServiceItem))
            .filter((s) => s.isPublished !== false)
            .sort((a, b) => (a.order || 99) - (b.order || 99));
          setServices(loadedServices);
        }
        if (!packagesSnap.empty) {
          const loadedPkgs = packagesSnap.docs
            .map((d) => ({ id: d.id, ...d.data() } as PackageItem))
            .filter((p) => p.isPublished !== false)
            .sort((a, b) => (a.order || 99) - (b.order || 99));
          setPackages(loadedPkgs);
        }
        if (!gallerySnap.empty) {
          setGalleryItems(gallerySnap.docs.map((d) => ({ id: d.id, ...d.data() } as GalleryItem)));
        }
        if (!reviewsSnap.empty) {
          setReviews(
            reviewsSnap.docs
              .map((d) => ({ id: d.id, ...d.data() } as ReviewItem))
              .filter((r) => r.isPublished !== false)
          );
        }
      } catch {
        // Silent graceful fallback
      }
    };

    fetchData();

    return () => {
      unsubCoupons();
      unsubProducts();
      unsubVideos();
    };
  }, []);

  const displayedServices =
    services.length > 0
      ? services.slice(0, 6)
      : SERVICE_DEFINITIONS.slice(0, 6).map((def) => ({
          id: `srv_${def.slug}`,
          slug: def.slug,
          title: def.title,
          category: def.category,
          description: def.shortDescription,
          price: def.startingPrice,
          image: def.coverImage,
          gallery: def.gallery
        }));

  const normalizedGallery = [
    ...galleryItems.map((item) => ({
      id: item.id,
      title: item.title,
      category: item.category === 'Pre Wedding' ? 'Pre-Wedding' : item.category,
      imageUrl: item.imageUrl || getImageForSlugOrCategory(item.category),
      type: (item.mediaType === 'video' ? 'video' : 'photo') as 'photo' | 'video',
      video: item.videoUrl
        ? ({
            id: item.id,
            title: item.title,
            videoUrl: item.videoUrl,
            thumbnailUrl: item.thumbnailUrl || item.imageUrl,
            category: item.category,
            createdAt: item.createdAt || ''
          } as VideoItem)
        : null
    })),
    ...videoItems.map((v) => ({
      id: v.id,
      title: v.title,
      category: 'Cinematic Films',
      imageUrl: v.thumbnailUrl || STUDIO_IMAGES.cinematicDrone,
      type: 'video' as const,
      video: v
    }))
  ];

  const portfolioTabs = ['All', 'Wedding', 'Pre-Wedding', 'Engagement', 'Birthday', 'Cinematic Films'];

  const filteredGallery =
    activeCategory === 'All'
      ? normalizedGallery.slice(0, 8)
      : normalizedGallery
          .filter((item) => {
            const c = (item.category || '').toLowerCase();
            const target = activeCategory.toLowerCase();
            if (target === 'pre-wedding') return c === 'pre-wedding' || c === 'pre wedding';
            if (target === 'cinematic films') return c === 'cinematic films' || c === 'videos' || c === 'drone' || item.type === 'video';
            return c === target;
          })
          .slice(0, 8);

  const igPosts =
    Array.isArray(settings.instagramGallery) && settings.instagramGallery.length > 0
      ? settings.instagramGallery.slice(0, 6)
      : [
          { id: 'ig1', imageUrl: STUDIO_IMAGES.heroWedding, caption: 'Wedding Storytelling • Khaga' },
          { id: 'ig2', imageUrl: STUDIO_IMAGES.preWedding, caption: 'Golden Hour Pre-Wedding' },
          { id: 'ig3', imageUrl: STUDIO_IMAGES.engagementRing, caption: 'Ring Ceremony Fine Details' },
          { id: 'ig4', imageUrl: STUDIO_IMAGES.luxuryAlbumFrame, caption: 'Arvind Creation Albums' },
          { id: 'ig5', imageUrl: STUDIO_IMAGES.cinematicDrone, caption: '4K Gimbal & Drone Crew' },
          { id: 'ig6', imageUrl: STUDIO_IMAGES.maternityBaby, caption: 'Maternity & Baby Studio' }
        ];

  const handleQuickInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isInqPendingRef.current || inqSubmitting) return;
    setInqError('');

    const trimmedName = inqName.trim();
    const trimmedPhone = inqPhone.trim();
    if (!trimmedName || !trimmedPhone) {
      setInqError('Please enter your name and mobile number.');
      return;
    }

    isInqPendingRef.current = true;
    setInqSubmitting(true);
    try {
      const enquiryNumber = `ENQ-${Math.floor(100000 + Math.random() * 900000)}`;
      await setDoc(doc(db, 'inquiries', enquiryNumber), {
        id: enquiryNumber,
        enquiryNumber,
        fullName: trimmedName,
        name: trimmedName,
        phone: trimmedPhone,
        whatsappNumber: trimmedPhone,
        email: '',
        subject: inqTopic,
        service: inqTopic,
        message: inqMessage.trim() || `Enquiry regarding ${inqTopic}`,
        status: 'New',
        createdAt: new Date().toISOString()
      });
      setInqSubmittedId(enquiryNumber);
      setInqName('');
      setInqPhone('');
      setInqMessage('');
    } catch {
      setInqError('Could not submit your enquiry right now. Please try WhatsApp below.');
    } finally {
      setInqSubmitting(false);
      isInqPendingRef.current = false;
    }
  };

  const waGeneralUrl = buildWhatsAppUrl(
    settings.whatsappNumber || '+917905256355',
    'Hello SHIV STUDIO, I want to enquire about photography bookings & packages.'
  );

  return (
    <div className="bg-[#111111] text-white selection:bg-[#D4AF37] selection:text-[#111111] overflow-x-hidden">
      <SEOHead
        title={settings.seoTitle || 'SHIV STUDIO | Capturing Moments, Creating Memories — Khaga, Fatehpur'}
        description={
          settings.seoDescription ||
          'SHIV STUDIO (Arvind Creation) — Luxury Wedding Photography, Pre-Wedding Shoots, Cinematic Videography, Drone Photography, Custom Photo Frames & Albums in Khaga, Fatehpur.'
        }
        keywords={settings.seoKeywords}
        canonicalPath="/"
      />

      <OfferBannerDisplay position="homepage_top" className="max-w-7xl mx-auto px-4 pt-4" />

      {/* SECTION 2: HERO BANNER */}
      <section className="relative min-h-[82vh] flex items-center bg-[#111111] border-b border-white/10">
        <img
          src={settings.heroImageUrl || STUDIO_IMAGES.heroWedding}
          alt="SHIV STUDIO Luxury Indian Wedding Photography"
          className="absolute inset-0 w-full h-full object-cover object-center opacity-50"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#111111] via-[#111111]/75 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#111111] via-transparent to-[#111111]/40" />

        <div className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-20">
          <OfferBannerDisplay position="hero" className="mb-6 max-w-2xl" />

          <div className="max-w-3xl space-y-6">
            <p className="text-xs uppercase tracking-[0.28em] text-[#D4AF37] font-semibold">
              {settings.studioName || 'SHIV STUDIO'} • {settings.creativeBrand || 'Arvind Creation'} • Khaga, Fatehpur
            </p>
            <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-semibold text-white tracking-tight leading-[1.03]">
              {settings.heroTitle || 'WE CAPTURE YOUR BEST MOMENTS.'}
            </h1>
            <p className="text-base sm:text-xl text-neutral-200 max-w-2xl leading-relaxed font-light">
              {settings.heroSubtitle || 'Turning Your Precious Moments Into Timeless Memories.'}
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                to="/gallery"
                className="px-7 py-4 bg-[#D4AF37] hover:bg-[#E5C158] text-[#111111] font-semibold text-xs uppercase tracking-wider rounded-lg transition-colors inline-flex items-center gap-2 whitespace-nowrap"
              >
                <span>Explore Portfolio</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/booking"
                className="px-7 py-4 bg-[#1A1A1A]/90 hover:bg-white/10 border border-white/25 text-white font-semibold text-xs uppercase tracking-wider rounded-lg transition-colors whitespace-nowrap"
              >
                Book Now
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: STUDIO INTRODUCTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6">
            <div className="rounded-2xl overflow-hidden border border-white/10 bg-[#1A1A1A] aspect-[4/3]">
              <img
                src={settings.aboutImageUrl || STUDIO_IMAGES.studioPortrait}
                alt="SHIV STUDIO creative workspace in Khaga, Fatehpur"
                className="w-full h-full object-cover"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>

          <div className="lg:col-span-6 space-y-6">
            <p className="text-xs uppercase tracking-[0.25em] text-[#D4AF37] font-semibold">
              {settings.tagline || 'Capturing Moments, Creating Memories.'}
            </p>
            <h2 className="font-display text-3xl sm:text-5xl font-semibold text-white leading-[1.1]">
              {settings.aboutTitle || 'Crafting Timeless Visual Legacy in Khaga, Fatehpur'}
            </h2>
            <p className="text-sm sm:text-base text-neutral-300 leading-relaxed">
              {settings.aboutDescription}
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-4">
              <Link
                to="/about"
                className="px-6 py-3 bg-[#1A1A1A] hover:bg-[#D4AF37] hover:text-[#111111] border border-[#D4AF37]/40 text-[#D4AF37] font-semibold text-xs uppercase tracking-wider rounded-lg transition-colors inline-flex items-center gap-2"
              >
                <span>Learn More</span>
                <ChevronRight className="h-4 w-4" />
              </Link>
              <Link
                to="/store"
                className="text-xs font-medium text-neutral-300 hover:text-white underline underline-offset-4"
              >
                Browse Photo Frames &amp; Gifts
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: OUR SERVICES */}
      <section className="bg-[#1A1A1A] border-y border-white/10 py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-2 max-w-2xl">
              <p className="text-xs uppercase tracking-[0.25em] text-[#D4AF37] font-semibold">
                Dedicated Disciplines
              </p>
              <h2 className="font-display text-3xl sm:text-5xl font-semibold text-white">
                Our Photography &amp; Creative Services
              </h2>
            </div>
            <Link
              to="/services"
              className="text-xs uppercase tracking-wider font-semibold text-[#D4AF37] hover:underline inline-flex items-center gap-1 whitespace-nowrap"
            >
              <span>View All 14 Services</span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {displayedServices.map((srv) => {
              const slug = srv.slug || srv.id.replace(/^srv_/, '');
              const targetRoute = slug === 'photo-frames' || slug === 'customized-gifts'
                ? '/store'
                : `/services/${slug}`;
              return (
                <Link
                  key={srv.id}
                  to={targetRoute}
                  className="group bg-[#111111] border border-white/10 hover:border-[#D4AF37]/50 rounded-2xl overflow-hidden flex flex-col justify-between transition-colors"
                >
                  <div>
                    <div className="aspect-[4/3] overflow-hidden bg-[#1A1A1A]">
                      <img
                        src={srv.image || srv.coverImage || getImageForSlugOrCategory(srv.title)}
                        alt={srv.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="p-6 space-y-2">
                      <p className="text-[11px] uppercase tracking-[0.2em] text-[#D4AF37] font-semibold">
                        {srv.category}
                      </p>
                      <h3 className="font-display text-2xl font-semibold text-white group-hover:text-[#D4AF37] transition-colors">
                        {srv.title}
                      </h3>
                      <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                        {srv.shortDescription || srv.description}
                      </p>
                    </div>
                  </div>
                  <div className="px-6 pb-6 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                    <span className="text-neutral-400">
                      From{' '}
                      <strong className="text-white tabular-nums">
                        ₹{Number(srv.startingPrice ?? srv.price ?? 0).toLocaleString('en-IN')}
                      </strong>
                    </span>
                    <span className="text-[#D4AF37] font-semibold inline-flex items-center gap-1">
                      <span>Explore</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION 5: FEATURED PORTFOLIO */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24 space-y-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.25em] text-[#D4AF37] font-semibold">
              Selected Works
            </p>
            <h2 className="font-display text-3xl sm:text-5xl font-semibold text-white">
              Featured Portfolio
            </h2>
          </div>

          <div className="flex flex-wrap gap-2">
            {portfolioTabs.map((cat) => (
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
        </div>

        {filteredGallery.length === 0 ? (
          <div className="bg-[#1A1A1A] border border-white/10 rounded-2xl p-12 text-center space-y-3">
            <Camera className="h-8 w-8 text-[#D4AF37] mx-auto" />
            <p className="text-sm text-neutral-300">
              No curated pieces found under "{activeCategory}". Explore the full gallery below.
            </p>
            <Link to="/gallery" className="inline-block text-xs text-[#D4AF37] font-semibold hover:underline">
              Open Full Portfolio
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {filteredGallery.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  if (item.type === 'video' && item.video) {
                    setSelectedVideo(item.video);
                  } else {
                    setLightboxImage(item.imageUrl);
                  }
                }}
                className="group relative aspect-[3/4] rounded-xl overflow-hidden bg-[#1A1A1A] border border-white/10 cursor-pointer"
              >
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
                {item.type === 'video' && (
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-[#D4AF37] text-[#111111] flex items-center justify-center pl-0.5 shadow-xl">
                      <Play className="w-5 h-5 fill-current" />
                    </div>
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/85 via-black/40 to-transparent">
                  <p className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-semibold">
                    {item.category}
                  </p>
                  <p className="text-xs sm:text-sm font-medium text-white line-clamp-1 mt-0.5">
                    {item.title}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="text-center">
          <Link
            to="/gallery"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#1A1A1A] hover:bg-white/10 border border-white/15 rounded-lg text-xs font-semibold uppercase tracking-wider text-white transition-colors"
          >
            <span>Explore Complete Portfolio</span>
            <ArrowRight className="h-4 w-4 text-[#D4AF37]" />
          </Link>
        </div>
      </section>

      {/* SECTION 6: POPULAR PACKAGES */}
      {packages.length > 0 && (
        <section className="bg-[#1A1A1A] border-y border-white/10 py-20 lg:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="space-y-2 max-w-2xl">
                <p className="text-xs uppercase tracking-[0.25em] text-[#D4AF37] font-semibold">
                  Collections
                </p>
                <h2 className="font-display text-3xl sm:text-5xl font-semibold text-white">
                  Popular Photography Packages
                </h2>
              </div>
              <Link
                to="/packages"
                className="text-xs uppercase tracking-wider font-semibold text-[#D4AF37] hover:underline inline-flex items-center gap-1 whitespace-nowrap"
              >
                <span>Compare All Packages</span>
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {packages.slice(0, 3).map((pkg) => (
                <div
                  key={pkg.id}
                  className="bg-[#111111] border border-white/10 rounded-2xl overflow-hidden flex flex-col justify-between"
                >
                  <div>
                    <div className="aspect-[4/3] bg-[#1A1A1A]">
                      <img
                        src={pkg.image || getImageForSlugOrCategory(pkg.category)}
                        alt={pkg.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="p-6 space-y-3">
                      <p className="text-[11px] uppercase tracking-[0.2em] text-[#D4AF37] font-semibold">
                        {pkg.category}
                      </p>
                      <h3 className="font-display text-2xl font-semibold text-white">{pkg.name}</h3>
                      <p className="text-2xl font-bold text-[#D4AF37] tabular-nums">
                        ₹{Number(pkg.price || 0).toLocaleString('en-IN')}
                      </p>
                      <p className="text-xs text-neutral-400 leading-relaxed line-clamp-2">
                        {pkg.description}
                      </p>
                      <div className="text-xs text-neutral-300 space-y-1 pt-2 border-t border-white/10">
                        <p>{pkg.duration}</p>
                        <p>{pkg.editedPhotosCount}</p>
                        <p>{pkg.albumDetails}</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-6 pt-0 flex gap-2.5">
                    <Link
                      to={`/booking?package=${encodeURIComponent(pkg.id)}`}
                      className="flex-1 py-2.5 bg-[#D4AF37] hover:bg-[#E5C158] text-[#111111] font-semibold text-xs text-center rounded-lg transition-colors"
                    >
                      Book Now
                    </Link>
                    <a
                      href={buildWhatsAppUrl(
                        settings.whatsappNumber,
                        `Hello SHIV STUDIO, I want to enquire about the ${pkg.name} package.`
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2.5 bg-[#1A1A1A] hover:bg-white/10 border border-white/15 text-white font-semibold text-xs rounded-lg transition-colors"
                    >
                      Enquire
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* STORE HIGHLIGHTS + ACTIVE COUPONS (PRESERVED FEATURE) */}
      {(products.length > 0 || coupons.length > 0) && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 space-y-14">
          {products.length > 0 && (
            <div className="space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.25em] text-[#D4AF37] font-semibold">
                    Archival Print Shop
                  </p>
                  <h2 className="font-display text-3xl sm:text-4xl font-semibold text-white">
                    Photo Frames, Albums &amp; Gifts
                  </h2>
                </div>
                <Link
                  to="/store"
                  className="text-xs uppercase tracking-wider font-semibold text-[#D4AF37] hover:underline whitespace-nowrap"
                >
                  Open Full Store
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="bg-[#1A1A1A] border border-white/10 rounded-xl p-4 flex flex-col justify-between space-y-4"
                  >
                    <div>
                      <div className="aspect-square rounded-lg overflow-hidden bg-[#111111]">
                        <img
                          src={product.image || STUDIO_IMAGES.luxuryAlbumFrame}
                          alt={product.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <p className="text-[11px] uppercase tracking-wider text-neutral-400 mt-3">
                        {product.category}
                      </p>
                      <h3 className="text-sm font-semibold text-white mt-1 line-clamp-1">
                        {product.title}
                      </h3>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-white/10">
                      <span className="text-base font-bold text-[#D4AF37] tabular-nums">
                        ₹{Number(product.discountPrice || product.price).toLocaleString('en-IN')}
                      </span>
                      <Link
                        to="/store"
                        className="px-4 py-2 bg-[#D4AF37] hover:bg-[#E5C158] text-[#111111] font-semibold text-xs rounded-lg"
                      >
                        Select Option
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {coupons.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {coupons.map((coupon) => {
                const isCopied = copiedCouponCode === coupon.code;
                return (
                  <div
                    key={coupon.id}
                    className="bg-[#1A1A1A] border border-[#D4AF37]/30 rounded-2xl p-6 flex items-center justify-between gap-4"
                  >
                    <div className="space-y-2">
                      <p className="text-[11px] uppercase tracking-wider text-[#D4AF37] font-semibold">
                        Studio Offer
                      </p>
                      <h3 className="text-lg font-semibold text-white">{coupon.name}</h3>
                      <p className="text-xs text-neutral-400">{coupon.description}</p>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(coupon.code);
                          setCopiedCouponCode(coupon.code);
                          setTimeout(() => setCopiedCouponCode(null), 2000);
                        }}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#111111] border border-[#D4AF37]/40 text-[#D4AF37] font-mono text-xs font-semibold"
                      >
                        <span>{coupon.code}</span>
                        {isCopied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-2xl font-bold text-[#D4AF37] tabular-nums">
                        {coupon.discountType === 'PERCENTAGE'
                          ? `${coupon.discountValue}% OFF`
                          : `₹${coupon.discountValue} OFF`}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* SECTION 7: WHY CHOOSE US */}
      <section className="bg-[#1A1A1A] border-y border-white/10 py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="max-w-2xl space-y-2">
            <p className="text-xs uppercase tracking-[0.25em] text-[#D4AF37] font-semibold">
              Studio Philosophy
            </p>
            <h2 className="font-display text-3xl sm:text-5xl font-semibold text-white">
              Why Choose SHIV STUDIO
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {WHY_CHOOSE_US_ITEMS.map((item) => (
              <div
                key={item.title}
                className="p-6 rounded-xl bg-[#111111] border border-white/10 space-y-3"
              >
                <div className="h-8 w-8 rounded-lg bg-[#D4AF37]/15 text-[#D4AF37] flex items-center justify-center">
                  <Check className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-semibold text-white">{item.title}</h3>
                <p className="text-xs text-neutral-400 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 8: CUSTOMER TESTIMONIALS (DYNAMIC FIRESTORE ONLY — NO FAKE REVIEWS) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 space-y-10">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.25em] text-[#D4AF37] font-semibold">
            Client Voices
          </p>
          <h2 className="font-display text-3xl sm:text-5xl font-semibold text-white">
            Verified Client Reviews
          </h2>
        </div>

        {reviews.length === 0 ? (
          <div className="bg-[#1A1A1A] border border-white/10 rounded-2xl p-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="space-y-1">
              <h3 className="font-display text-2xl font-semibold text-white">
                Client Reviews Managed Live by Our Studio
              </h3>
              <p className="text-xs sm:text-sm text-neutral-400">
                Genuine reviews published after completed shoots and orders appear here automatically.
              </p>
            </div>
            <Link
              to="/booking"
              className="px-5 py-2.5 bg-[#D4AF37] text-[#111111] font-semibold text-xs uppercase tracking-wider rounded-lg whitespace-nowrap shrink-0"
            >
              Book Your Shoot
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="bg-[#1A1A1A] border border-white/10 p-6 rounded-2xl space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white text-sm">{review.customerName}</span>
                    <div className="flex space-x-0.5 text-[#D4AF37]">
                      {Array.from({ length: Math.min(5, Math.max(1, review.rating || 5)) }).map((_, i) => (
                        <Star key={i} className="h-3.5 w-3.5 fill-current" />
                      ))}
                    </div>
                  </div>
                  <p className="text-neutral-300 text-xs sm:text-sm leading-relaxed">
                    "{review.comment}"
                  </p>
                </div>

                {review.reply && (
                  <div className="pt-3 border-t border-white/10 text-xs">
                    <p className="text-[#D4AF37] font-semibold uppercase tracking-wider text-[10px]">
                      SHIV STUDIO Reply
                    </p>
                    <p className="text-neutral-400 mt-1">{review.reply}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* SECTION 9: INSTAGRAM GALLERY */}
      <section className="bg-[#1A1A1A] border-y border-white/10 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.25em] text-[#D4AF37] font-semibold">
                @{settings.instagramHandle || 'Shiv_photography_officel'}
              </p>
              <h2 className="font-display text-3xl sm:text-4xl font-semibold text-white">
                Follow Our Instagram Journal
              </h2>
            </div>
            <a
              href={settings.instagramUrl || 'https://www.instagram.com/Shiv_photography_officel/'}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#111111] hover:bg-[#D4AF37] hover:text-[#111111] border border-white/15 rounded-lg text-xs font-semibold uppercase tracking-wider text-white transition-colors whitespace-nowrap shrink-0"
            >
              <Instagram className="h-4 w-4" />
              <span>Follow @{settings.instagramHandle || 'Shiv_photography_officel'}</span>
            </a>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {igPosts.map((post: any, idx: number) => (
              <a
                key={post.id || idx}
                href={post.postUrl || settings.instagramUrl || 'https://www.instagram.com/Shiv_photography_officel/'}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative aspect-square rounded-xl overflow-hidden bg-[#111111] border border-white/10"
              >
                <img
                  src={post.imageUrl}
                  alt={post.caption || 'SHIV STUDIO Instagram Moment'}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-3 text-center">
                  <span className="text-[11px] font-medium text-white line-clamp-2">{post.caption}</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 10: CALL TO ACTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="bg-[#1A1A1A] border border-[#D4AF37]/35 rounded-2xl px-6 py-14 sm:p-16 text-center space-y-6">
          <p className="text-xs uppercase tracking-[0.28em] text-[#D4AF37] font-semibold">
            {settings.tagline || 'Capturing Moments, Creating Memories.'}
          </p>
          <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-semibold text-white max-w-3xl mx-auto leading-[1.08]">
            Let&apos;s Create Something Beautiful Together.
          </h2>
          <p className="text-sm text-neutral-300 max-w-xl mx-auto">
            Reserve wedding dates, pre-wedding shoots, custom framing, or bespoke albums crafted by Arvind Creation at SHIV STUDIO Khaga.
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-2">
            <Link
              to="/booking"
              className="px-7 py-3.5 bg-[#D4AF37] hover:bg-[#E5C158] text-[#111111] font-semibold text-xs uppercase tracking-wider rounded-lg transition-colors"
            >
              Book Now
            </Link>
            <a
              href={waGeneralUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-7 py-3.5 bg-[#111111] hover:bg-white/10 border border-white/20 text-white font-semibold text-xs uppercase tracking-wider rounded-lg inline-flex items-center gap-2 transition-colors"
            >
              <MessageCircle className="h-4 w-4 text-[#D4AF37]" />
              <span>Chat on WhatsApp</span>
            </a>
          </div>
        </div>
      </section>

      {/* SECTION 11: CONTACT DETAILS & DIRECT ENQUIRY FORM */}
      <section id="contact" className="bg-[#1A1A1A] border-t border-white/10 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          <div className="space-y-6">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.25em] text-[#D4AF37] font-semibold">
                Khaga Showroom
              </p>
              <h2 className="font-display text-3xl sm:text-4xl font-semibold text-white">
                Visit SHIV STUDIO
              </h2>
              <p className="text-sm text-neutral-400">
                Walk in for live album samples, custom frame sizing, or event consultation in Fatehpur district.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-5 rounded-xl bg-[#111111] border border-white/10 space-y-2">
                <MapPin className="h-4.5 w-4.5 text-[#D4AF37]" />
                <h4 className="font-semibold text-white">Address</h4>
                <p className="text-neutral-400 leading-relaxed">{settings.address}</p>
              </div>
              <div className="p-5 rounded-xl bg-[#111111] border border-white/10 space-y-2">
                <Clock className="h-4.5 w-4.5 text-[#D4AF37]" />
                <h4 className="font-semibold text-white">Studio Hours</h4>
                <p className="text-neutral-400 leading-relaxed">{settings.officeHours}</p>
              </div>
              <div className="p-5 rounded-xl bg-[#111111] border border-white/10 space-y-2">
                <Phone className="h-4.5 w-4.5 text-[#D4AF37]" />
                <h4 className="font-semibold text-white">Phone &amp; WhatsApp</h4>
                <p className="text-neutral-400 leading-relaxed">{settings.phone}</p>
              </div>
              <div className="p-5 rounded-xl bg-[#111111] border border-white/10 space-y-2">
                <Mail className="h-4.5 w-4.5 text-[#D4AF37]" />
                <h4 className="font-semibold text-white">Email</h4>
                <p className="text-neutral-400 leading-relaxed break-all">{settings.email}</p>
              </div>
            </div>
          </div>

          <div className="bg-[#111111] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-4">
            <h3 className="font-display text-2xl font-semibold text-white">Quick Enquiry</h3>

            {inqSubmittedId ? (
              <div className="py-8 text-center space-y-3">
                <CheckCircle className="h-12 w-12 text-[#D4AF37] mx-auto" />
                <h4 className="text-lg font-semibold text-white">Enquiry Received ({inqSubmittedId})</h4>
                <p className="text-xs text-neutral-400">
                  Our Khaga studio team has saved your request and will contact you shortly.
                </p>
                <div className="flex justify-center gap-3 pt-2">
                  <button
                    onClick={() => setInqSubmittedId(null)}
                    className="px-4 py-2 bg-[#1A1A1A] border border-white/15 rounded-lg text-xs text-white"
                  >
                    Send Another Enquiry
                  </button>
                  <a
                    href={waGeneralUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-[#D4AF37] text-[#111111] font-semibold rounded-lg text-xs"
                  >
                    Chat on WhatsApp
                  </a>
                </div>
              </div>
            ) : (
              <form className="space-y-4 text-xs" onSubmit={handleQuickInquiry}>
                {inqError && (
                  <p className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300">
                    {inqError}
                  </p>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-neutral-300 font-medium">Your Name</label>
                    <input
                      type="text"
                      required
                      value={inqName}
                      onChange={(e) => setInqName(e.target.value)}
                      className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg px-4 py-3 text-white focus:border-[#D4AF37] outline-none"
                      placeholder="Full Name"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-neutral-300 font-medium">Mobile / WhatsApp</label>
                    <input
                      type="tel"
                      required
                      value={inqPhone}
                      onChange={(e) => setInqPhone(e.target.value)}
                      className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg px-4 py-3 text-white focus:border-[#D4AF37] outline-none"
                      placeholder="+91 9876543210"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-neutral-300 font-medium">Service / Enquiry Topic</label>
                  <select
                    value={inqTopic}
                    onChange={(e) => setInqTopic(e.target.value)}
                    className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg px-4 py-3 text-white focus:border-[#D4AF37] outline-none"
                  >
                    <option value="Wedding Photography">Wedding Photography</option>
                    <option value="Pre-Wedding Photography">Pre-Wedding Photography</option>
                    <option value="Cinematic Videography & Drone">Cinematic Videography &amp; Drone</option>
                    <option value="Birthday / Engagement Event">Birthday / Engagement Event</option>
                    <option value="Album Designing & Graphic Design">Album Designing &amp; Graphic Design</option>
                    <option value="Photo Frames & Custom Gifts">Photo Frames &amp; Custom Gifts</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-neutral-300 font-medium">Event Date &amp; Notes</label>
                  <textarea
                    rows={3}
                    value={inqMessage}
                    onChange={(e) => setInqMessage(e.target.value)}
                    className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg px-4 py-3 text-white focus:border-[#D4AF37] outline-none resize-none"
                    placeholder="Share preferred shoot date, location, or frame requirements..."
                  />
                </div>
                <button
                  type="submit"
                  disabled={inqSubmitting}
                  className="w-full py-3.5 bg-[#D4AF37] hover:bg-[#E5C158] disabled:opacity-50 text-[#111111] font-semibold uppercase tracking-wider rounded-lg transition-colors"
                >
                  {inqSubmitting ? 'Sending Enquiry...' : 'Submit Enquiry'}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 cursor-zoom-out"
          onClick={() => setLightboxImage(null)}
        >
          <img
            src={lightboxImage}
            alt="SHIV STUDIO enlarged work"
            className="max-w-full max-h-[90vh] object-contain rounded-xl border border-white/15"
            referrerPolicy="no-referrer"
          />
        </div>
      )}

      {/* Video Lightbox Modal */}
      {selectedVideo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-md"
          onClick={() => setSelectedVideo(null)}
        >
          <div
            className="relative w-full max-w-4xl bg-[#1A1A1A] border border-white/15 rounded-2xl p-6 space-y-4 shadow-2xl"
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
