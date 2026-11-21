import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { ServiceItem } from '../types';
import { SERVICE_DEFINITIONS } from '../data/studioCatalog';
import { getImageForSlugOrCategory } from '../assets/studioAssets';
import { resolveMediaUrl, applyImageFallback } from '../utils/mediaResolver';
import { OfferBannerDisplay } from '../components/OfferBannerDisplay';
import { SEOHead } from '../components/SEOHead';
import { buildWhatsAppUrl } from '../components/WhatsAppButton';
import { ArrowRight, CalendarDays, MessageCircle } from 'lucide-react';

const ALLOWED_SERVICE_CATEGORIES = ['All', 'Photography', 'Videography', 'Design', 'Printing'];

export const Services: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialCatParam = searchParams.get('category');
  const resolvedInitialFilter =
    initialCatParam && ALLOWED_SERVICE_CATEGORIES.includes(initialCatParam) ? initialCatParam : 'All';

  const [services, setServices] = useState<ServiceItem[]>([]);
  const [filter, setFilter] = useState<string>(resolvedInitialFilter);
  const [loading, setLoading] = useState(true);
  const [whatsappNumber, setWhatsappNumber] = useState('+917905256355');

  useEffect(() => {
    const paramCat = searchParams.get('category');
    if (paramCat && ALLOWED_SERVICE_CATEGORIES.includes(paramCat)) {
      setFilter(paramCat);
    } else {
      setFilter('All');
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const [querySnapshot, settingsSnap] = await Promise.all([
          getDocs(collection(db, 'services')),
          getDoc(doc(db, 'website_settings', 'studio'))
        ]);

        if (settingsSnap.exists() && settingsSnap.data().whatsappNumber) {
          setWhatsappNumber(settingsSnap.data().whatsappNumber);
        }

        const firestoreList = querySnapshot.docs.map(
          (d) => ({ id: d.id, ...d.data() } as ServiceItem)
        );

        if (firestoreList.length > 0) {
          setServices(
            firestoreList
              .filter((s) => s.isPublished !== false)
              .sort((a, b) => (a.order || 99) - (b.order || 99))
          );
        } else {
          setServices(
            SERVICE_DEFINITIONS.filter((d) => d.slug !== 'maternity-baby-photography').map((def, idx) => ({
              id: `srv_${def.slug}`,
              slug: def.slug,
              title: def.title,
              category: def.category,
              description: def.description,
              shortDescription: def.shortDescription,
              price: def.startingPrice,
              startingPrice: def.startingPrice,
              image: def.coverImage,
              coverImage: def.coverImage,
              gallery: def.gallery,
              deliverables: def.deliverables,
              order: idx + 1
            }))
          );
        }
      } catch {
        setServices(
          SERVICE_DEFINITIONS.map((def, idx) => ({
            id: `srv_${def.slug}`,
            slug: def.slug,
            title: def.title,
            category: def.category,
            description: def.description,
            shortDescription: def.shortDescription,
            price: def.startingPrice,
            startingPrice: def.startingPrice,
            image: def.coverImage,
            coverImage: def.coverImage,
            gallery: def.gallery,
            order: idx + 1
          }))
        );
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  const categories = ['All', 'Photography', 'Videography', 'Design', 'Printing'];
  const filteredServices =
    filter === 'All'
      ? services
      : services.filter((s) => (s.category || '').toLowerCase() === filter.toLowerCase());

  return (
    <div className="bg-[#111111] min-h-screen text-white py-16 px-4 sm:px-6 lg:px-8">
      <SEOHead
        title="Photography & Creative Services — SHIV STUDIO Khaga"
        description="Explore wedding photography, pre-wedding, birthday, engagement, maternity, baby, event, cinematic videography, drone photography, album design, graphic design, video editing & custom frames."
        canonicalPath="/services"
      />

      <div className="max-w-7xl mx-auto space-y-12">
        <OfferBannerDisplay position="photography_services" />

        <div className="text-center max-w-3xl mx-auto space-y-4">
          <p className="text-xs uppercase tracking-[0.25em] text-[#D4AF37] font-semibold">
            Creative Disciplines
          </p>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-semibold text-white">
            Photography, Cinema &amp; Design Services
          </h1>
          <p className="text-sm sm:text-base text-neutral-400 leading-relaxed">
            Dedicated camera crews, post-production editors, and custom print specialists serving Khaga, Fatehpur, and destinations across Uttar Pradesh.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-2 border-b border-white/10 pb-6">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-5 py-2.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                filter === cat
                  ? 'bg-[#D4AF37] text-[#111111] font-semibold'
                  : 'bg-[#1A1A1A] text-neutral-300 hover:text-white border border-white/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="bg-[#1A1A1A] rounded-2xl h-96 animate-pulse border border-white/10" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredServices.map((service) => {
              const inferredSlug =
                service.slug ||
                service.id.replace(/^srv_/, '') ||
                service.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
              const detailRoute =
                inferredSlug === 'photo-frames' || inferredSlug === 'customized-gifts'
                  ? '/store'
                  : `/services/${inferredSlug}`;
              const displayPrice = service.startingPrice ?? service.price ?? 0;

              return (
                <div
                  key={service.id}
                  className="group bg-[#1A1A1A] border border-white/10 hover:border-[#D4AF37]/40 rounded-2xl overflow-hidden flex flex-col justify-between transition-colors"
                >
                  <div>
                    <Link to={detailRoute} className="block relative aspect-[4/3] overflow-hidden bg-[#111111]">
                      <img
                        src={resolveMediaUrl(service.image || service.coverImage, getImageForSlugOrCategory(service.title))}
                        alt={service.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        onError={(e) => applyImageFallback(e, getImageForSlugOrCategory(service.title))}
                      />
                    </Link>

                    <div className="p-6 space-y-2.5">
                      <p className="text-[11px] uppercase tracking-[0.2em] text-[#D4AF37] font-semibold">
                        {service.category}
                      </p>
                      <Link to={detailRoute}>
                        <h2 className="font-display text-2xl font-semibold text-white group-hover:text-[#D4AF37] transition-colors">
                          {service.title}
                        </h2>
                      </Link>
                      <p className="text-neutral-400 text-xs sm:text-sm leading-relaxed line-clamp-3">
                        {service.shortDescription || service.description}
                      </p>
                    </div>
                  </div>

                  <div className="p-6 pt-3 border-t border-white/10 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[11px] text-neutral-500 uppercase tracking-wider">Starting Price</p>
                        <p className="text-lg font-bold text-[#D4AF37] tabular-nums">
                          ₹{Number(displayPrice).toLocaleString('en-IN')}
                        </p>
                      </div>
                      <Link
                        to={detailRoute}
                        className="text-xs font-semibold text-white hover:text-[#D4AF37] inline-flex items-center gap-1"
                      >
                        <span>View Page</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <Link
                        to={`/booking?service=${encodeURIComponent(service.id)}`}
                        className="py-2.5 bg-[#D4AF37] hover:bg-[#E5C158] text-[#111111] font-semibold text-xs rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <CalendarDays className="h-3.5 w-3.5" />
                        <span>Book Now</span>
                      </Link>
                      <a
                        href={buildWhatsAppUrl(
                          whatsappNumber,
                          `Hello SHIV STUDIO, I would like to enquire about ${service.title}.`
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-2.5 bg-[#111111] hover:bg-white/10 border border-white/15 text-white font-semibold text-xs rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <MessageCircle className="h-3.5 w-3.5 text-[#D4AF37]" />
                        <span>WhatsApp</span>
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
