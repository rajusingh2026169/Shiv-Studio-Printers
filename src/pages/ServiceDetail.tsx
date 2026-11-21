import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { SERVICE_DEFINITIONS, ServiceCatalogDefinition } from '../data/studioCatalog';
import { ServiceItem, PackageItem, GalleryItem } from '../types';
import { SEOHead } from '../components/SEOHead';
import { buildWhatsAppUrl } from '../components/WhatsAppButton';
import { getImageForSlugOrCategory } from '../assets/studioAssets';
import { Check, ArrowLeft, CalendarDays, MessageCircle, ZoomIn } from 'lucide-react';

export const ServiceDetail: React.FC<{ forcedSlug?: string }> = ({ forcedSlug }) => {
  const { slug: routeSlug } = useParams<{ slug: string }>();
  const activeSlug = forcedSlug || routeSlug || 'wedding-photography';

  const fallbackDef: ServiceCatalogDefinition =
    SERVICE_DEFINITIONS.find((s) => s.slug === activeSlug) || SERVICE_DEFINITIONS[0];

  const [serviceData, setServiceData] = useState<ServiceItem | null>(null);
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [gallerySamples, setGallerySamples] = useState<string[]>(fallbackDef.gallery);
  const [whatsappNumber, setWhatsappNumber] = useState('+917905256355');
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  useEffect(() => {
    const loadServiceAndRelated = async () => {
      try {
        const servicesSnap = await getDocs(collection(db, 'services'));
        const allServices = servicesSnap.docs.map((d) => ({ id: d.id, ...d.data() } as ServiceItem));
        const matched = allServices.find(
          (s) =>
            s.slug === activeSlug ||
            s.id === `srv_${activeSlug}` ||
            s.title.toLowerCase() === fallbackDef.title.toLowerCase()
        );
        setServiceData(matched || null);

        // Fetch matching packages
        const pkgSnap = await getDocs(collection(db, 'packages'));
        const allPkgs = pkgSnap.docs
          .map((d) => ({ id: d.id, ...d.data() } as PackageItem))
          .filter((p) => p.isPublished !== false);

        const targetCat = (fallbackDef.packageCategory || fallbackDef.title).toLowerCase();
        const relatedPkgs = allPkgs.filter(
          (p) =>
            p.category.toLowerCase().includes(targetCat) ||
            targetCat.includes(p.category.toLowerCase())
        );
        setPackages(relatedPkgs);

        // Fetch matching gallery images
        const galSnap = await getDocs(collection(db, 'gallery'));
        const allGal = galSnap.docs.map((d) => ({ id: d.id, ...d.data() } as GalleryItem));
        const matchingGal = allGal
          .filter((g) => {
            const c = (g.category || '').toLowerCase();
            return (
              activeSlug.includes(c) ||
              c.includes(activeSlug.split('-')[0]) ||
              (fallbackDef.packageCategory && c.includes(fallbackDef.packageCategory.toLowerCase()))
            );
          })
          .map((g) => g.imageUrl)
          .filter(Boolean);

        const combinedImgs = Array.from(
          new Set([
            ...(matched?.gallery || []),
            ...matchingGal,
            ...fallbackDef.gallery
          ])
        ).slice(0, 6);
        setGallerySamples(combinedImgs);

        const settingsSnap = await getDoc(doc(db, 'website_settings', 'studio'));
        if (settingsSnap.exists() && settingsSnap.data().whatsappNumber) {
          setWhatsappNumber(settingsSnap.data().whatsappNumber);
        }
      } catch {
        setGallerySamples(fallbackDef.gallery);
      }
    };

    loadServiceAndRelated();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeSlug, fallbackDef]);

  const title = serviceData?.title || fallbackDef.title;
  const description = serviceData?.description || fallbackDef.description;
  const coverImage = serviceData?.coverImage || serviceData?.image || fallbackDef.coverImage;
  const startingPrice = serviceData?.startingPrice ?? serviceData?.price ?? fallbackDef.startingPrice;
  const deliverables =
    serviceData?.deliverables && serviceData.deliverables.length > 0
      ? serviceData.deliverables
      : fallbackDef.deliverables;

  const waUrl = buildWhatsAppUrl(
    whatsappNumber,
    `Hello SHIV STUDIO, I would like to enquire about ${title} starting at ₹${Number(startingPrice).toLocaleString('en-IN')}.`
  );

  return (
    <div className="bg-[#111111] text-white min-h-screen">
      <SEOHead
        title={`${title} in Khaga, Fatehpur — SHIV STUDIO`}
        description={`${fallbackDef.shortDescription} Book ${title} with SHIV STUDIO (Arvind Creation), Khaga, Fatehpur UP 212655.`}
        canonicalPath={`/services/${activeSlug}`}
      />

      {/* Cover Banner */}
      <section className="relative min-h-[55vh] flex items-end bg-[#111111] border-b border-white/10">
        <img
          src={coverImage}
          alt={`${title} by SHIV STUDIO Khaga`}
          className="absolute inset-0 w-full h-full object-cover opacity-45"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#111111] via-[#111111]/65 to-transparent" />

        <div className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-14 space-y-5">
          <Link
            to="/services"
            className="inline-flex items-center gap-2 text-xs text-neutral-300 hover:text-[#D4AF37] transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>All Photography &amp; Creative Services</span>
          </Link>

          <p className="text-xs uppercase tracking-[0.25em] text-[#D4AF37] font-semibold">
            {serviceData?.category || fallbackDef.category}
          </p>

          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-semibold text-white max-w-3xl leading-[1.08]">
            {title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              to={`/booking?service=${encodeURIComponent(serviceData?.id || `srv_${activeSlug}`)}`}
              className="px-6 py-3.5 bg-[#D4AF37] hover:bg-[#E5C158] text-[#111111] font-semibold text-xs uppercase tracking-wider rounded-lg inline-flex items-center gap-2 transition-colors"
            >
              <CalendarDays className="h-4 w-4" />
              <span>Book Now</span>
            </Link>
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3.5 bg-[#1A1A1A] hover:bg-white/10 border border-white/20 text-white font-semibold text-xs uppercase tracking-wider rounded-lg inline-flex items-center gap-2 transition-colors"
            >
              <MessageCircle className="h-4 w-4 text-[#D4AF37]" />
              <span>WhatsApp Enquiry</span>
            </a>
            {startingPrice > 0 && (
              <div className="px-4 py-2.5 rounded-lg bg-[#1A1A1A]/90 border border-white/10 text-xs">
                <span className="text-neutral-400">Starting Price: </span>
                <span className="text-[#D4AF37] font-bold tabular-nums">
                  ₹{Number(startingPrice).toLocaleString('en-IN')}
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Description & Deliverables */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-7 space-y-5">
          <p className="text-xs uppercase tracking-[0.22em] text-[#D4AF37] font-semibold">
            Service Overview
          </p>
          <h2 className="font-display text-3xl sm:text-4xl font-semibold text-white">
            Craftsmanship &amp; Studio Execution
          </h2>
          <p className="text-sm sm:text-base text-neutral-300 leading-relaxed">
            {description}
          </p>
        </div>

        <div className="lg:col-span-5 bg-[#1A1A1A] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-4">
          <h3 className="text-xs uppercase tracking-[0.2em] text-[#D4AF37] font-semibold">
            Key Deliverables Included
          </h3>
          <ul className="space-y-3 text-xs sm:text-sm text-neutral-300">
            {deliverables.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <Check className="h-4 w-4 text-[#D4AF37] shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Service Photo Gallery */}
      {gallerySamples.length > 0 && (
        <section className="bg-[#1A1A1A] border-y border-white/10 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-[#D4AF37] font-semibold">
                  Selected Frames
                </p>
                <h2 className="font-display text-3xl font-semibold text-white mt-1">
                  {title} Gallery
                </h2>
              </div>
              <Link to="/gallery" className="text-xs text-[#D4AF37] hover:underline">
                View Full Portfolio
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {gallerySamples.map((imgUrl, idx) => (
                <div
                  key={idx}
                  onClick={() => setLightboxImage(imgUrl)}
                  className="group relative aspect-[4/3] rounded-xl overflow-hidden bg-[#111111] border border-white/10 cursor-zoom-in"
                >
                  <img
                    src={imgUrl}
                    alt={`${title} sample ${idx + 1} by SHIV STUDIO`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="p-2.5 rounded-full bg-[#111111]/80 text-[#D4AF37]">
                      <ZoomIn className="h-5 w-5" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Matching Packages */}
      {packages.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-[#D4AF37] font-semibold">
                Curated Pricing
              </p>
              <h2 className="font-display text-3xl font-semibold text-white mt-1">
                Available {title} Packages
              </h2>
            </div>
            <Link to="/packages" className="text-xs text-[#D4AF37] hover:underline">
              Compare All Packages
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className="bg-[#1A1A1A] border border-white/10 rounded-xl overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className="aspect-[4/3] bg-[#111111]">
                    <img
                      src={pkg.image || getImageForSlugOrCategory(pkg.category)}
                      alt={pkg.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="p-6 space-y-3">
                    <h3 className="font-display text-2xl font-semibold text-white">{pkg.name}</h3>
                    <p className="text-xl font-bold text-[#D4AF37] tabular-nums">
                      ₹{Number(pkg.price).toLocaleString('en-IN')}
                    </p>
                    <p className="text-xs text-neutral-400 leading-relaxed">{pkg.description}</p>
                    <div className="text-xs text-neutral-300 space-y-1 pt-2 border-t border-white/10">
                      <p>Duration: {pkg.duration}</p>
                      <p>Edited Photos: {pkg.editedPhotosCount}</p>
                      <p>Album: {pkg.albumDetails}</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 pt-0 flex gap-2.5">
                  <Link
                    to={`/booking?package=${encodeURIComponent(pkg.id)}`}
                    className="flex-1 py-2.5 bg-[#D4AF37] hover:bg-[#E5C158] text-[#111111] font-semibold text-xs text-center rounded-lg transition-colors"
                  >
                    Book Package
                  </Link>
                  <a
                    href={buildWhatsAppUrl(
                      whatsappNumber,
                      `Hello SHIV STUDIO, I want details about the ${pkg.name} (₹${pkg.price}).`
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2.5 bg-[#111111] border border-white/15 hover:bg-white/10 text-white text-xs font-semibold rounded-lg transition-colors"
                  >
                    WhatsApp
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Bottom CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="bg-[#1A1A1A] border border-[#D4AF37]/30 rounded-2xl p-8 sm:p-12 text-center space-y-4">
          <h2 className="font-display text-3xl sm:text-4xl font-semibold text-white">
            Ready to Reserve Your Date?
          </h2>
          <p className="text-xs sm:text-sm text-neutral-300 max-w-xl mx-auto">
            Book online in under a minute or speak directly with our studio team in Khaga, Fatehpur.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Link
              to={`/booking?service=${encodeURIComponent(serviceData?.id || `srv_${activeSlug}`)}`}
              className="px-6 py-3 bg-[#D4AF37] hover:bg-[#E5C158] text-[#111111] font-semibold text-xs uppercase tracking-wider rounded-lg"
            >
              Book {title}
            </Link>
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-[#111111] border border-white/20 text-white font-semibold text-xs uppercase tracking-wider rounded-lg"
            >
              WhatsApp Enquiry
            </a>
          </div>
        </div>
      </section>

      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setLightboxImage(null)}
        >
          <img
            src={lightboxImage}
            alt="Enlarged portfolio preview"
            className="max-w-full max-h-[90vh] object-contain rounded-xl border border-white/15"
            referrerPolicy="no-referrer"
          />
        </div>
      )}
    </div>
  );
};
