import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, getDocs, query, limit, where, doc, getDoc, onSnapshot } from 'firebase/firestore';
import { motion } from 'motion/react';
import { db } from '../firebase';
import { ServiceItem, ProductItem, GalleryItem, BlogItem, ReviewItem, Coupon } from '../types';
import { isCouponActiveAndValid } from '../utils/couponEngine';
import { 
  Camera, 
  Layers, 
  Sparkles, 
  Award, 
  MapPin, 
  Clock, 
  Phone, 
  Mail, 
  Calendar, 
  MessageSquare,
  Flame, 
  CheckCircle, 
  Star,
  ChevronRight,
  UploadCloud,
  Copy,
  Check
} from 'lucide-react';

export const Landing: React.FC = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [copiedCouponCode, setCopiedCouponCode] = useState<string | null>(null);
  const [blogs, setBlogs] = useState<BlogItem[]>([]);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const [settings, setSettings] = useState<any>({
    studioName: 'Shiv Studio & Printers',
    phone: '+91 7905256355, +91 8765706396',
    email: 'shivsharan52796@gmail.com',
    address: 'Kishanpur Road, Over Bridge ke Niche, Khaga, Fatehpur, Uttar Pradesh, India',
    heroTagline: 'Capturing Memories, Printing Excellence.',
    heroTitle: 'Preserving Your Legacy, Printing Your Vision',
    heroSubtitle: "Khaga's elite destination for cinematic wedding storytelling, high-end baby portfolios, and premium industrial press solutions.",
    heroImageUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=1600',
    aboutTitle: 'Crafting High-Resolution Visual Masterpieces',
    aboutDescription: 'For nearly a decade, Shiv Studio & Printers has redefined professional studio sessions and premium print architecture. Our studio features ultra-modern Hasselblad cameras, custom heated props for infants, and automated Japanese digital offset presses capable of printing hundreds of heavy-texture visiting cards and velvet wedding card invitations.',
    aboutEst: 'Estd. 2018 | Khaga, Fatehpur',
    aboutImageUrl: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&q=80&w=800',
    aboutWeddingsCount: '1500+',
    aboutHappyClients: '50k+',
    officeHours: 'Monday - Sunday: 09:00 AM - 09:00 PM',
  });

  useEffect(() => {
    // Scroll to section based on hash
    if (window.location.hash) {
      const element = document.getElementById(window.location.hash.substring(1));
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, []);

  useEffect(() => {
    // Real-time Firestore Listener for Coupons
    const couponsRef = collection(db, 'coupons');
    const unsubCoupons = onSnapshot(couponsRef, (snapshot) => {
      const allCoupons: Coupon[] = [];
      snapshot.forEach((docSnap) => {
        allCoupons.push({ id: docSnap.id, ...docSnap.data() } as Coupon);
      });

      const now = new Date();
      // Filter coupons that are active AND where current date is between validFrom and validUntil
      const validHomeCoupons = allCoupons.filter((c) => isCouponActiveAndValid(c, now));

      console.log('Total coupons in Firestore:', snapshot.size);
      console.log('Coupons loaded on Home Page:', validHomeCoupons.length);

      setCoupons(validHomeCoupons);
    }, (err) => {
      console.error('Error fetching coupons in Landing:', err);
    });

    const fetchData = async () => {
      try {
        const settingsSnap = await getDoc(doc(db, 'website_settings', 'studio'));
        if (settingsSnap.exists()) {
          setSettings((prev: any) => ({ ...prev, ...settingsSnap.data() }));
        }

        const servicesSnap = await getDocs(query(collection(db, 'services'), limit(3)));
        setServices(servicesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ServiceItem)));

        const productsSnap = await getDocs(query(collection(db, 'products'), limit(3)));
        setProducts(productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProductItem)));

        const gallerySnap = await getDocs(collection(db, 'gallery'));
        setGalleryItems(gallerySnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as GalleryItem)));

        const blogsSnap = await getDocs(query(collection(db, 'blogs'), limit(2)));
        setBlogs(blogsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as BlogItem)));

        const reviewsSnap = await getDocs(collection(db, 'reviews'));
        setReviews(reviewsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ReviewItem)));
      } catch (err) {
        console.error('Error fetching landing data:', err);
      }
    };

    fetchData();

    return () => {
      unsubCoupons();
    };
  }, []);

  const filteredGallery = activeCategory === 'All' 
    ? galleryItems 
    : galleryItems.filter(item => item.category === activeCategory);

  return (
    <div className="bg-slate-950 text-white selection:bg-amber-500 selection:text-slate-900 overflow-x-hidden">
      
      {/* 1. HERO SECTION */}
      <section className="relative min-h-[90vh] flex items-center justify-center bg-radial-at-t from-slate-900 via-slate-950 to-black px-4 pt-10 pb-20">
        <div className="absolute inset-0 bg-cover bg-center opacity-10 mix-blend-overlay" style={{ backgroundImage: `url(${settings.heroImageUrl || 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=1600'})` }}></div>
        
        <div className="relative max-w-5xl mx-auto text-center space-y-8 z-10">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold uppercase tracking-wider"
          >
            <Sparkles className="h-4 w-4" />
            <span>{settings.heroTagline || "Award Winning Fine-Art Studio & High-Speed Press"}</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-4xl sm:text-6xl lg:text-7xl font-sans font-bold tracking-tight text-white leading-tight"
          >
            {settings.heroTitle && settings.heroTitle.includes(',') ? (
              <>
                {settings.heroTitle.split(',')[0]}, <br className="hidden sm:inline" />
                <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 bg-clip-text text-transparent">
                  {settings.heroTitle.split(',').slice(1).join(',')}
                </span>
              </>
            ) : (
              <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 bg-clip-text text-transparent">
                {settings.heroTitle || "Preserving Your Legacy, Printing Your Vision"}
              </span>
            )}
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="max-w-2xl mx-auto text-slate-400 text-base sm:text-lg leading-relaxed"
          >
            {settings.heroSubtitle}
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
          >
            <Link
              to="/booking"
              className="w-full sm:w-auto px-8 py-4 text-slate-950 font-bold bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 rounded-xl shadow-lg shadow-amber-500/10 hover:shadow-amber-500/20 transition-all duration-200 flex items-center justify-center space-x-2"
            >
              <Calendar className="h-5 w-5" />
              <span>Book Appointment Now</span>
            </Link>
            <Link
              to="/store"
              className="w-full sm:w-auto px-8 py-4 text-slate-200 font-semibold bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl transition-colors flex items-center justify-center space-x-2"
            >
              <span>Explore E-Store</span>
              <ChevronRight className="h-5 w-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* 2. ABOUT THE STUDIO */}
      <section className="py-24 bg-slate-950 border-t border-slate-900 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 to-amber-600 rounded-2xl blur-lg opacity-20 group-hover:opacity-30 transition duration-1000"></div>
            <img 
              src={settings.aboutImageUrl || "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&q=80&w=800"} 
              alt="Shiv Studio Camera Equipment and Studio Work" 
              className="relative rounded-2xl border border-slate-800 w-full object-cover aspect-video sm:aspect-square shadow-2xl"
              referrerPolicy="no-referrer"
              loading="lazy"
            />
          </div>
          <div className="space-y-6">
            <div className="inline-flex items-center space-x-2 text-amber-500 font-semibold text-xs tracking-wider uppercase">
              <Award className="h-4 w-4" />
              <span>{settings.aboutEst || "Estd. 2018 | Khaga, Fatehpur"}</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-sans font-bold text-white tracking-tight">
              {settings.aboutTitle || "Crafting High-Resolution Visual Masterpieces"}
            </h2>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
              {settings.aboutDescription}
            </p>
            <div className="grid grid-cols-2 gap-6 pt-4 font-sans">
              <div className="border-l-2 border-amber-500 pl-4">
                <p className="text-3xl font-extrabold text-white">{settings.aboutWeddingsCount || "1500+"}</p>
                <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider">Weddings Captured</p>
              </div>
              <div className="border-l-2 border-amber-500 pl-4">
                <p className="text-3xl font-extrabold text-white">{settings.aboutHappyClients || "50k+"}</p>
                <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider">Happy Client Prints</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. FEATURED SERVICES */}
      <section className="py-24 bg-slate-900/50 border-t border-slate-900 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <h2 className="text-3xl sm:text-4xl font-sans font-bold text-white tracking-tight">Our Signature Services</h2>
            <p className="text-slate-400 text-sm sm:text-base">Experience Khaga's most versatile studio providing standard photographic sessions and bespoke commercial print orders.</p>
          </div>
          
          {services.length === 0 ? (
            <div className="text-center py-12 bg-slate-900 rounded-3xl border border-slate-800 p-8 space-y-4 max-w-xl mx-auto w-full">
              <Camera className="h-8 w-8 text-amber-500 mx-auto" />
              <h3 className="text-lg font-bold text-white">No Services Available</h3>
              <p className="text-xs text-slate-400">Our photography and printing packages are currently being updated.</p>
              <Link to="/dashboard" className="inline-block bg-amber-500 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs hover:bg-amber-600 transition-all">
                Add New Service
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {services.map((service) => (
                <div key={service.id} className="group bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-700 transition-all duration-300 shadow-xl flex flex-col justify-between">
                  <div>
                    <div className="relative overflow-hidden aspect-video">
                      <img 
                        src={service.image} 
                        alt={service.title} 
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                        loading="lazy"
                      />
                      <span className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md px-3 py-1 rounded-full text-xxs font-bold text-amber-500 tracking-wider uppercase border border-slate-800">
                        {service.category}
                      </span>
                    </div>
                    <div className="p-6 space-y-3">
                      <h3 className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors">{service.title}</h3>
                      <p className="text-slate-400 text-xs sm:text-sm line-clamp-3">{service.description}</p>
                    </div>
                  </div>
                  <div className="px-6 pb-6 pt-2 border-t border-slate-800/50 flex items-center justify-between">
                    <div>
                      <p className="text-xxs text-slate-500 uppercase font-mono">Starts From</p>
                      <p className="text-lg font-bold text-amber-400">₹{service.price.toLocaleString('en-IN')}</p>
                    </div>
                    <Link 
                      to={`/booking?service=${service.id}`}
                      className="px-4 py-2 bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-white text-xs font-bold rounded-lg transition-colors"
                    >
                      Book Appointment
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="text-center pt-4">
            <Link 
              to="/services" 
              className="inline-flex items-center text-sm font-semibold text-amber-400 hover:text-amber-500 transition-colors gap-1"
            >
              <span>View All Photography & Printing Services</span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* 4. FEATURED PRODUCTS (STORE HIGHLIGHT) */}
      <section className="py-24 bg-slate-950 border-t border-slate-900 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div className="space-y-4">
              <h2 className="text-3xl sm:text-4xl font-sans font-bold text-white tracking-tight">Luxury Print Products Store</h2>
              <p className="text-slate-400 text-sm sm:text-base max-w-2xl">Bespoke customized acrylic albums, floating night-glow LED frames, canvas gallery-wraps, and magic thermo-sensitive sublimation mug gifts.</p>
            </div>
            <Link 
              to="/store"
              className="px-6 py-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-sm font-bold text-white rounded-xl shrink-0 transition-colors"
            >
              Enter Product Store
            </Link>
          </div>

          {products.length === 0 ? (
            <div className="text-center py-12 bg-slate-900 rounded-3xl border border-slate-800 p-8 space-y-4 max-w-xl mx-auto w-full">
              <Sparkles className="h-8 w-8 text-amber-500 mx-auto" />
              <h3 className="text-lg font-bold text-white">No Products Available</h3>
              <p className="text-xs text-slate-400">Our custom photo frames, albums, and personalized merchandise are currently being prepared.</p>
              <Link to="/dashboard" className="inline-block bg-amber-500 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs hover:bg-amber-600 transition-all">
                Add New Product
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {products.map((product) => (
                <div key={product.id} className="group bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all rounded-2xl p-4 flex flex-col justify-between">
                  <div>
                    <div className="relative aspect-square overflow-hidden rounded-xl bg-slate-950">
                      <img 
                        src={product.image} 
                        alt={product.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                        loading="lazy"
                      />
                      {product.discountPrice && (
                        <span className="absolute top-2.5 left-2.5 bg-rose-500 text-white font-bold text-xxs px-2.5 py-1 rounded-md">
                          SAVE {Math.round(((product.price - product.discountPrice) / product.price) * 100)}%
                        </span>
                      )}
                    </div>
                    <div className="mt-4 space-y-2">
                      <p className="text-xxs text-slate-500 uppercase tracking-wider">{product.category}</p>
                      <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-amber-400 transition-colors line-clamp-1">{product.title}</h3>
                      
                      <div className="flex items-center space-x-1.5 text-xs text-amber-500">
                        <Star className="h-3.5 w-3.5 fill-current" />
                        <span className="font-bold text-white">{product.rating}</span>
                        <span className="text-slate-500">({product.reviewsCount} reviews)</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between">
                    <div className="flex items-baseline space-x-2">
                      <span className="text-lg font-bold text-amber-400">
                        ₹{(product.discountPrice || product.price).toLocaleString('en-IN')}
                      </span>
                      {product.discountPrice && (
                        <span className="text-xs text-slate-500 line-through">
                          ₹{product.price.toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>
                    <Link 
                      to="/store"
                      className="px-4 py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs rounded-lg transition-colors"
                    >
                      Buy Now
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 5. WEDDING & PORTFOLIO GALLERY */}
      <section className="py-24 bg-slate-900/50 border-t border-slate-900 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <h2 className="text-3xl sm:text-4xl font-sans font-bold text-white tracking-tight">Our Master Storyboard Gallery</h2>
            <p className="text-slate-400 text-sm sm:text-base">Explore actual premium high-resolution wedding, baby theme, events and cinematic drone shoots.</p>
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap justify-center gap-2">
            {['All', 'Wedding', 'Pre Wedding', 'Baby', 'Events', 'Drone'].map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors ${
                  activeCategory === category 
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/15' 
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Gallery Grid */}
          {galleryItems.length === 0 ? (
            <div className="text-center py-12 bg-slate-900 rounded-3xl border border-slate-800 p-8 space-y-4 max-w-xl mx-auto w-full">
              <Camera className="h-8 w-8 text-amber-500 mx-auto" />
              <h3 className="text-lg font-bold text-white">No Gallery Images Available</h3>
              <p className="text-xs text-slate-400">Our high definition portfolio shots and pre-wedding captures are currently being organized.</p>
              <Link to="/dashboard" className="inline-block bg-amber-500 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs hover:bg-amber-600 transition-all">
                Upload Gallery
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {filteredGallery.map((item) => (
                <div 
                  key={item.id} 
                  onClick={() => setLightboxImage(item.imageUrl)}
                  className="group relative cursor-zoom-in rounded-xl overflow-hidden aspect-square md:aspect-[3/4] bg-slate-950 border border-slate-800"
                >
                  <img 
                    src={item.imageUrl} 
                    alt={item.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                    <div>
                      <span className="text-xxs font-bold text-amber-500 tracking-wider uppercase font-mono">{item.category}</span>
                      <h4 className="text-xs sm:text-sm font-semibold text-white mt-1 line-clamp-1">{item.title}</h4>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 6. LATEST OFFERS & PROMOTIONS */}
      <section id="offers" className="py-24 bg-slate-950 border-t border-slate-900 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <h2 className="text-3xl sm:text-4xl font-sans font-bold text-white tracking-tight">Active Studio Offers & Coupons</h2>
            <p className="text-slate-400 text-sm sm:text-base">Claim verified festival coupon codes, referral benefits, and custom combo packages directly.</p>
          </div>

          {coupons.length === 0 ? (
            <div className="text-center py-12 bg-slate-900 rounded-3xl border border-slate-800 p-8 space-y-4 max-w-xl mx-auto w-full">
              <Flame className="h-8 w-8 text-amber-500 mx-auto" />
              <h3 className="text-lg font-bold text-white">No Offers Active</h3>
              <p className="text-xs text-slate-400">There are no discount offers at this exact moment. Feel free to contact us for bulk deals!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {coupons.map((coupon) => {
                const isCopied = copiedCouponCode === coupon.code;
                const handleCopy = () => {
                  navigator.clipboard.writeText(coupon.code);
                  setCopiedCouponCode(coupon.code);
                  setTimeout(() => setCopiedCouponCode(null), 2000);
                };

                return (
                  <div key={coupon.id} className="relative group bg-radial-at-tl from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row gap-6 items-center justify-between shadow-2xl">
                    <div className="space-y-4 text-center md:text-left flex-1">
                      <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xxs font-bold uppercase font-mono">
                        <Flame className="h-3.5 w-3.5 animate-pulse" />
                        <span>{coupon.applicableOn === 'ALL' ? 'EXCLUSIVE OFFER' : `${coupon.applicableOn} OFFER`}</span>
                      </div>
                      <h3 className="text-xl font-bold text-white">{coupon.name}</h3>
                      <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                        {coupon.description || 'Use this code at checkout to get special savings on your order.'}
                      </p>
                      
                      <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-1">
                        <span className="text-xxs text-slate-500 font-mono">COUPON CODE:</span>
                        <button
                          onClick={handleCopy}
                          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold font-mono text-xs tracking-wider transition-all"
                          title="Click to copy coupon code"
                        >
                          <span>{coupon.code}</span>
                          {isCopied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                        </button>
                        {isCopied && <span className="text-xxs text-emerald-400 font-semibold font-mono">Copied!</span>}
                      </div>

                      {coupon.minOrderAmount > 0 && (
                        <p className="text-xxs text-slate-500 font-mono">
                          *Min Order Amount: ₹{coupon.minOrderAmount.toLocaleString('en-IN')}
                        </p>
                      )}
                    </div>
                    
                    <div className="shrink-0 text-center bg-slate-900 border border-slate-800 p-6 rounded-2xl min-w-32">
                      <p className="text-3xl sm:text-4xl font-extrabold text-amber-500">
                        {coupon.discountType === 'PERCENTAGE' ? `${coupon.discountValue}%` : `₹${coupon.discountValue}`}
                      </p>
                      <p className="text-xxs text-slate-400 uppercase tracking-wider font-mono mt-1">
                        {coupon.discountType === 'PERCENTAGE' ? 'Discount Off' : 'Flat Off'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* 7. WHY CHOOSE SHIV STUDIO */}
      <section className="py-24 bg-slate-900/50 border-t border-slate-900 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <h2 className="text-3xl sm:text-4xl font-sans font-bold text-white tracking-tight">The Shiv Studio Standard</h2>
            <p className="text-slate-400 text-sm sm:text-base">Why we remain Delhi NCR's most trusted photography studio & printing press for over 8 years.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-amber-500/10 text-amber-400">
                <Camera className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Cinematic Premium Lenses</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">We shoot exclusively on specialized high-end Hasselblad, Leica, and Sony G-Master optics to achieve natural, dreamy background depth.</p>
            </div>
            <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-amber-500/10 text-amber-400">
                <Layers className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Advanced Color-Accuracy</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">Our digital offset printing systems run daily spectral color calibrations ensuring your printed albums match true sRGB tones perfectly.</p>
            </div>
            <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-amber-500/10 text-amber-400">
                <UploadCloud className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Secure Digital Vault</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">Submit files securely. Access high-resolution JPG backups and final vectors (PDF, PSD, AI) at high download speeds.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 8. REVIEWS & RATINGS */}
      <section className="py-24 bg-slate-950 border-t border-slate-900 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <h2 className="text-3xl sm:text-4xl font-sans font-bold text-white tracking-tight">Our Customers Love Us</h2>
            <p className="text-slate-400 text-sm sm:text-base">Read feedback directly from newly married couples, parents, and corporate partners.</p>
          </div>

          {reviews.length === 0 ? (
            <div className="text-center py-12 bg-slate-900 rounded-3xl border border-slate-800 p-8 space-y-4 max-w-xl mx-auto w-full">
              <MessageSquare className="h-8 w-8 text-amber-500 mx-auto" />
              <h3 className="text-lg font-bold text-white">No Reviews Yet</h3>
              <p className="text-xs text-slate-400">Customer reviews and testimonials are currently being prepared. Check back soon!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {reviews.map((review) => (
                <div key={review.id} className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm sm:text-base">{review.customerName}</span>
                    <div className="flex space-x-0.5 text-amber-400">
                      {Array.from({ length: review.rating }).map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-current" />
                      ))}
                    </div>
                  </div>
                  <p className="text-slate-400 text-xs sm:text-sm leading-relaxed italic">"{review.comment}"</p>
                  
                  {review.reply && (
                    <div className="mt-4 pl-4 border-l-2 border-amber-500 bg-slate-950/40 p-3 rounded-r-lg">
                      <p className="text-xxs text-amber-500 font-semibold uppercase tracking-wide">Owner Reply</p>
                      <p className="text-slate-400 text-xxs sm:text-xs mt-1 leading-relaxed">{review.reply}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 9. CONTACT DETAILS & BUSINESS HOURS */}
      <section id="contact" className="py-24 bg-slate-900/50 border-t border-slate-900 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          <div className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-3xl sm:text-4xl font-sans font-bold text-white tracking-tight">Visit Khaga Showroom</h2>
              <p className="text-slate-400 text-sm sm:text-base">We are located near Over Bridge in Khaga, the commercial hub of Fatehpur, with direct road access and convenient parking.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 font-sans">
              <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <MapPin className="h-5 w-5 text-amber-500" />
                <h4 className="font-bold text-white text-sm">Studio Address</h4>
                <p className="text-xs text-slate-400 leading-normal">{settings.address || "Kishanpur Road, Over Bridge ke Niche, Khaga, Fatehpur, Uttar Pradesh, India"}</p>
              </div>

              <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <Clock className="h-5 w-5 text-amber-500" />
                <h4 className="font-bold text-white text-sm">Business Hours</h4>
                <p className="text-xs text-slate-400 leading-normal">{settings.officeHours || "Monday - Sunday: 09:00 AM - 09:00 PM"}</p>
              </div>

              <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <Phone className="h-5 w-5 text-amber-500" />
                <h4 className="font-bold text-white text-sm">Phone Line</h4>
                <p className="text-xs text-slate-400 leading-normal">{settings.phone || "+91 7905256355, +91 8765706396"}</p>
              </div>

              <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <Mail className="h-5 w-5 text-amber-500" />
                <h4 className="font-bold text-white text-sm">Studio Mail</h4>
                <p className="text-xs text-slate-400 leading-normal">{settings.email || "shivsharan52796@gmail.com"}</p>
              </div>
            </div>
          </div>

          {/* Interactive Contact Map Simulation */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-white">Send Instant Inquiry</h3>
            <form className="space-y-4 text-xs" onSubmit={(e) => { e.preventDefault(); alert('Thank you for contacting Shiv Studio & Printers. Our relationship manager will call you within 1 hour!'); }}>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-slate-400 font-medium">Your Name</label>
                  <input type="text" required className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-amber-500 outline-none" placeholder="e.g. Rahul Sen" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-slate-400 font-medium">Phone Number</label>
                  <input type="tel" required className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-amber-500 outline-none" placeholder="e.g. +91 9999999999" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-slate-400 font-medium">Inquiry Topic</label>
                <select className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-amber-500 outline-none">
                  <option>Wedding Photography Combo</option>
                  <option>Kids Multi-Theme Session</option>
                  <option>Custom Handcrafted Album Designing</option>
                  <option>Corporate Visiting & Luxury Invitations</option>
                  <option>Drone Shoot & Video Editing</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-slate-400 font-medium">Brief Description</label>
                <textarea rows={4} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-amber-500 outline-none" placeholder="Let us know dates, locations or print quantity requested..."></textarea>
              </div>
              <button type="submit" className="w-full py-4 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold rounded-xl transition-colors shadow-lg shadow-amber-500/10">
                Submit Inquiry Details
              </button>
            </form>
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
            alt="Enlarged Portfolio Item" 
            className="max-w-full max-h-[90vh] object-contain rounded-xl border border-slate-800 shadow-2xl"
            referrerPolicy="no-referrer"
          />
        </div>
      )}
    </div>
  );
};
