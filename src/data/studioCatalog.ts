import { STUDIO_IMAGES } from '../assets/studioAssets';
import { PackageItem, ServiceItem } from '../types';

export interface ServiceCatalogDefinition {
  slug: string;
  title: string;
  category: 'Photography' | 'Printing' | 'Videography' | 'Design';
  packageCategory?: string;
  shortDescription: string;
  description: string;
  coverImage: string;
  gallery: string[];
  deliverables: string[];
  startingPrice: number;
  routePath: string;
}

export const SERVICE_DEFINITIONS: ServiceCatalogDefinition[] = [
  {
    slug: 'wedding-photography',
    title: 'Wedding Photography',
    category: 'Photography',
    packageCategory: 'Wedding',
    shortDescription: 'Candid, traditional, and fine-art storytelling across every ceremony from Haldi to Vidaai.',
    description:
      'SHIV STUDIO captures complete multi-day Indian weddings across Khaga, Fatehpur, and surrounding regions with calibrated dual-camera teams, classic portraiture, candid emotions, and archival post-production.',
    coverImage: STUDIO_IMAGES.heroWedding,
    gallery: [STUDIO_IMAGES.heroWedding, STUDIO_IMAGES.engagementRing, STUDIO_IMAGES.luxuryAlbumFrame],
    deliverables: [
      'Full-resolution color-graded master photographs',
      'Candid & traditional multi-photographer coverage',
      'Curated online client gallery & digital archive',
      'Print-ready wedding album preparation'
    ],
    startingPrice: 25000,
    routePath: '/services/wedding-photography'
  },
  {
    slug: 'pre-wedding-photography',
    title: 'Pre-Wedding Photography',
    category: 'Photography',
    packageCategory: 'Pre-Wedding',
    shortDescription: 'Editorial golden-hour portraits, heritage locations, and cinematic couple storytelling.',
    description:
      'Editorial outdoor and destination pre-wedding sessions styled around golden-hour lighting, wardrobe guidance, posed & candid direction, and magazine-grade retouching.',
    coverImage: STUDIO_IMAGES.preWedding,
    gallery: [STUDIO_IMAGES.preWedding, STUDIO_IMAGES.heroWedding, STUDIO_IMAGES.studioPortrait],
    deliverables: [
      'Location scouting & wardrobe styling consultation',
      'High-resolution retouched couple portraits',
      'Vertical reels for Instagram sharing',
      'Save-the-date invitation creative graphics'
    ],
    startingPrice: 12000,
    routePath: '/services/pre-wedding-photography'
  },
  {
    slug: 'birthday-photography',
    title: 'Birthday Photography',
    category: 'Photography',
    packageCategory: 'Birthday',
    shortDescription: 'Vibrant candid coverage of children’s birthdays, milestone celebrations, and family portraits.',
    description:
      'Natural, joyful photography capturing cake-cutting moments, candid family laughter, decor details, and group portraits in crisp studio-grade lighting.',
    coverImage: STUDIO_IMAGES.birthdayEvent,
    gallery: [STUDIO_IMAGES.birthdayEvent, STUDIO_IMAGES.maternityBaby, STUDIO_IMAGES.luxuryAlbumFrame],
    deliverables: [
      'Complete event candid & group coverage',
      'Same-week color-corrected digital photos',
      'Optional highlight reel for family sharing',
      'Custom framed keepsake prints'
    ],
    startingPrice: 6000,
    routePath: '/services/birthday-photography'
  },
  {
    slug: 'engagement-photography',
    title: 'Engagement & Ring Ceremony',
    category: 'Photography',
    packageCategory: 'Engagement & Ring Ceremony',
    shortDescription: 'Intimate ring exchange close-ups, couple portraits, and family celebration coverage.',
    description:
      'Fine-art macro detail shots of rings and mehendi paired with warm ambient couple portraits and stage coverage for your engagement evening.',
    coverImage: STUDIO_IMAGES.engagementRing,
    gallery: [STUDIO_IMAGES.engagementRing, STUDIO_IMAGES.heroWedding, STUDIO_IMAGES.preWedding],
    deliverables: [
      'Macro ring & ritual detail photography',
      'Stage & family group portraiture',
      'Couple portrait session prior to guest arrival',
      'Fast digital gallery turnaround'
    ],
    startingPrice: 11000,
    routePath: '/services/engagement-photography'
  },
  {
    slug: 'maternity-photography',
    title: 'Maternity Photography',
    category: 'Photography',
    packageCategory: 'Maternity & Baby Photography',
    shortDescription: 'Graceful studio & outdoor maternity portraits celebrating motherhood in warm tones.',
    description:
      'Calm, temperature-controlled private studio environment or soft golden-hour outdoor portraits designed for expectant mothers and partners.',
    coverImage: STUDIO_IMAGES.maternityBaby,
    gallery: [STUDIO_IMAGES.maternityBaby, STUDIO_IMAGES.studioPortrait, STUDIO_IMAGES.luxuryAlbumFrame],
    deliverables: [
      'Private guided posing in soft directional light',
      'Draped fabrics & minimalist fine-art backdrops',
      'Gentle skin-preserving retouching',
      'Heirloom fine-art prints & framing options'
    ],
    startingPrice: 7500,
    routePath: '/services/maternity-photography'
  },
  {
    slug: 'baby-photography',
    title: 'Baby Photography',
    category: 'Photography',
    packageCategory: 'Maternity & Baby Photography',
    shortDescription: 'Safe, hygienic newborn and toddler portrait sessions with soft organic props.',
    description:
      'Dedicated sanitized studio setup with warm ambient light, natural linen wraps, and gentle pacing tailored around your baby’s comfort.',
    coverImage: STUDIO_IMAGES.maternityBaby,
    gallery: [STUDIO_IMAGES.maternityBaby, STUDIO_IMAGES.birthdayEvent, STUDIO_IMAGES.luxuryAlbumFrame],
    deliverables: [
      'Sanitized soft props & natural linen wraps',
      'Flexible feeding & soothing breaks',
      'Family & sibling portraits included',
      'Archival baby memory album layouts'
    ],
    startingPrice: 7000,
    routePath: '/services/baby-photography'
  },
  {
    slug: 'maternity-baby-photography',
    title: 'Maternity & Baby Photography',
    category: 'Photography',
    packageCategory: 'Maternity & Baby Photography',
    shortDescription: 'Complete motherhood and newborn keepsake sessions in our warm Khaga portrait studio.',
    description:
      'Combine maternity elegance with newborn purity in custom studio portrait packages crafted with gentle lighting, sanitized organic props, and museum-grade print finishes.',
    coverImage: STUDIO_IMAGES.maternityBaby,
    gallery: [STUDIO_IMAGES.maternityBaby, STUDIO_IMAGES.studioPortrait, STUDIO_IMAGES.birthdayEvent],
    deliverables: [
      'Maternity & newborn milestone portrait sessions',
      'Private studio atmosphere with sanitized props',
      'Color-calibrated fine-art digital files',
      'Optional velvet hardcover baby photobook'
    ],
    startingPrice: 8000,
    routePath: '/services/maternity-baby-photography'
  },
  {
    slug: 'event-photography',
    title: 'Event Photography',
    category: 'Photography',
    packageCategory: 'Event Photography',
    shortDescription: 'Corporate gatherings, anniversaries, cultural programs, and family functions covered cleanly.',
    description:
      'Reliable multi-hour event documentation for corporate summits, inaugurations, silver jubilees, and social celebrations across Fatehpur.',
    coverImage: STUDIO_IMAGES.birthdayEvent,
    gallery: [STUDIO_IMAGES.birthdayEvent, STUDIO_IMAGES.cinematicDrone, STUDIO_IMAGES.studioPortrait],
    deliverables: [
      'Keynote, VIP, and candid attendee photography',
      'Consistent color exposure across indoor venues',
      'Press & social-ready edited highlights',
      'Organized digital delivery archive'
    ],
    startingPrice: 6500,
    routePath: '/services/event-photography'
  },
  {
    slug: 'cinematic-videography',
    title: 'Cinematic Videography',
    category: 'Videography',
    packageCategory: 'Wedding',
    shortDescription: '4K gimbal-stabilized wedding films, teasers, and story-driven sound design.',
    description:
      'Cinema-grade 4K filmmaking with wireless lapel audio, stabilized gimbal movement, multi-angle ceremony coverage, and theatrical color grading.',
    coverImage: STUDIO_IMAGES.cinematicDrone,
    gallery: [STUDIO_IMAGES.cinematicDrone, STUDIO_IMAGES.heroWedding, STUDIO_IMAGES.preWedding],
    deliverables: [
      '4K stabilized cinema camera & gimbal production',
      'Cinematic highlight trailer (3–5 minutes)',
      'Full ceremonial documentary edit',
      'Licensed background score & ambient audio mix'
    ],
    startingPrice: 18000,
    routePath: '/services/cinematic-videography'
  },
  {
    slug: 'drone-photography',
    title: 'Drone Photography',
    category: 'Videography',
    packageCategory: 'Wedding',
    shortDescription: 'Sweepingly composed 4K aerial cinematography for grand venues, baraats, and landscapes.',
    description:
      'Licensed aerial drone operators capturing dramatic bird’s-eye perspectives of wedding venues, processions, pre-wedding palaces, and large-scale events.',
    coverImage: STUDIO_IMAGES.cinematicDrone,
    gallery: [STUDIO_IMAGES.cinematicDrone, STUDIO_IMAGES.preWedding, STUDIO_IMAGES.heroWedding],
    deliverables: [
      'Stabilized 4K aerial video footage',
      'High-resolution aerial venue stills',
      'Seamless integration into wedding & event films',
      'Safe coordinated flight planning'
    ],
    startingPrice: 7000,
    routePath: '/services/drone-photography'
  },
  {
    slug: 'photo-frames',
    title: 'Photo Frames',
    category: 'Printing',
    shortDescription: 'Museum-grade matte wood, brass, LED, and acrylic frames crafted in custom dimensions.',
    description:
      'Precision-mounted archival photo frames available in multiple custom sizes from desk keepsakes to large gallery statement walls.',
    coverImage: STUDIO_IMAGES.luxuryAlbumFrame,
    gallery: [STUDIO_IMAGES.luxuryAlbumFrame, STUDIO_IMAGES.studioPortrait],
    deliverables: [
      'Archival anti-fade pigment photo printing',
      'Custom sizes from 6x8 to 24x36 inches',
      'Gold brass, matte black & backlit LED options',
      'Protective corner packaging & ready-to-hang hardware'
    ],
    startingPrice: 199,
    routePath: '/store?category=Photo+Frame'
  },
  {
    slug: 'customized-gifts',
    title: 'Customized Gifts',
    category: 'Printing',
    shortDescription: 'Personalized photo mugs, printed apparel, cushions, and curated milestone keepsakes.',
    description:
      'Thoughtful bespoke printed gifts crafted with crisp sublimation color accuracy for weddings, birthdays, anniversaries, and corporate gifting.',
    coverImage: STUDIO_IMAGES.luxuryAlbumFrame,
    gallery: [STUDIO_IMAGES.luxuryAlbumFrame, STUDIO_IMAGES.birthdayEvent],
    deliverables: [
      'High-definition photo sublimation printing',
      'Custom name, date & personal message layout',
      'Digital proof preview before final production',
      'Individual or bulk event gift orders'
    ],
    startingPrice: 249,
    routePath: '/store'
  },
  {
    slug: 'album-designing',
    title: 'Album Designing',
    category: 'Design',
    packageCategory: 'Wedding',
    shortDescription: 'Editorial Karizma & flush-mount layflat wedding albums finished by Arvind Creation.',
    description:
      'Every album spread is individually composed by Arvind Creation without generic clipart templates—printed on thick silver-halide or Velvet matte sheets with velvet & foil covers.',
    coverImage: STUDIO_IMAGES.luxuryAlbumFrame,
    gallery: [STUDIO_IMAGES.luxuryAlbumFrame, STUDIO_IMAGES.heroWedding, STUDIO_IMAGES.studioPortrait],
    deliverables: [
      'Clean editorial multi-photo spread storytelling',
      'Custom embossed velvet, leatherette & acrylic covers',
      'Flush-mount 180-degree layflat panoramic binding',
      'Color-proofed sheets before press bind'
    ],
    startingPrice: 6500,
    routePath: '/services/album-designing'
  },
  {
    slug: 'graphic-designing',
    title: 'Graphic Designing',
    category: 'Design',
    shortDescription: 'Royal wedding invitation cards, brand identity systems, flex, posters, and print artwork by Arvind Creation.',
    description:
      'Print-ready vector and raster graphic design studio serving families and businesses in Khaga & Fatehpur—from bespoke wedding stationery and digital invites to brand logos and flex campaigns.',
    coverImage: STUDIO_IMAGES.studioPortrait,
    gallery: [STUDIO_IMAGES.studioPortrait, STUDIO_IMAGES.luxuryAlbumFrame],
    deliverables: [
      'Digital & print-ready wedding invitations (PDF/CDR/AI)',
      'Brand identity, visiting cards, brochures & flex',
      'Typography & gold-foil layout precision',
      'Rapid revision workflow before printing'
    ],
    startingPrice: 999,
    routePath: '/services/graphic-designing'
  },
  {
    slug: 'video-editing',
    title: 'Video Editing',
    category: 'Videography',
    shortDescription: 'Post-production color grading, wedding highlight reels, teaser cuts, and narrative film finishing.',
    description:
      'Send raw wedding or event footage to our Khaga editing suite for narrative pacing, cinematic LUT color grading, audio mastering, and vertical social reels.',
    coverImage: STUDIO_IMAGES.studioPortrait,
    gallery: [STUDIO_IMAGES.studioPortrait, STUDIO_IMAGES.cinematicDrone],
    deliverables: [
      'Cinematic LUT color grading & exposure matching',
      'Teasers, Instagram Reels & full ceremony edits',
      'Multi-track dialogue cleanup & score sync',
      '4K MP4 master export for TV & mobile'
    ],
    startingPrice: 3500,
    routePath: '/services/video-editing'
  }
];

export function getDefaultServicesForSeed(): ServiceItem[] {
  return SERVICE_DEFINITIONS.filter((s) => s.slug !== 'maternity-baby-photography').map((def, idx) => ({
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
    isPublished: true,
    order: idx + 1,
    enableGst: false,
    gstPercent: 18,
    gstIncludedInPrice: true
  }));
}

export function getDefaultPackagesForSeed(): PackageItem[] {
  const now = new Date().toISOString();
  return [
    {
      id: 'pkg_wedding_royal',
      name: 'Royal Wedding Heritage Suite',
      category: 'Wedding',
      price: 45000,
      image: STUDIO_IMAGES.heroWedding,
      duration: '2 Full Days (Haldi, Sangeet & Wedding)',
      editedPhotosCount: '600+ Color Graded Photos',
      reelsCount: '3 Vertical Wedding Reels + 1 Cinematic Film',
      albumDetails: '50-Sheet Flush-Mount Velvet Karizma Album with Box',
      frameDetails: '2x Large 16x20 Matte Gold Couple Frames',
      description: 'Complete candid photography, traditional ceremony coverage, 4K cinema videography, and drone coverage designed for grand celebrations.',
      includedServices: ['Candid & Traditional Photographers', '4K Cinema Gimbal Filmmaker', 'Aerial Drone Coverage', '50-Sheet Velvet Album & 2 Wall Frames'],
      isPublished: true,
      isFeatured: true,
      order: 1,
      createdAt: now
    },
    {
      id: 'pkg_prewedding_editorial',
      name: 'Golden Hour Pre-Wedding Collection',
      category: 'Pre-Wedding',
      price: 15000,
      image: STUDIO_IMAGES.preWedding,
      duration: '1 Full Sunset & Sunrise Session (6 Hours)',
      editedPhotosCount: '120+ Retouched Fine-Art Portraits',
      reelsCount: '2 Cinematic Couple Reels + Save-The-Date Video',
      albumDetails: '20-Sheet Signature Pre-Wedding Coffee Table Book',
      frameDetails: '1x 12x18 Exhibition Fine-Art Frame',
      description: 'An editorial couple shoot tailored around natural golden light, creative framing, and share-ready social reels.',
      includedServices: ['Editorial Couple Photographer', 'Cinema Teaser & 2 Reels', 'Location & Styling Guidance', 'Coffee Table Book + Framed Print'],
      isPublished: true,
      isFeatured: true,
      order: 2,
      createdAt: now
    },
    {
      id: 'pkg_engagement_ceremony',
      name: 'Engagement & Ring Ceremony Signature',
      category: 'Engagement & Ring Ceremony',
      price: 16000,
      image: STUDIO_IMAGES.engagementRing,
      duration: 'Single Evening Event (Up to 6 Hours)',
      editedPhotosCount: '250+ Edited Photos',
      reelsCount: '2 Highlight Reels',
      albumDetails: '25-Sheet Hardbound Event Photobook',
      frameDetails: '1x 12x18 Couple Portrait Frame',
      description: 'Close-up ring detail photography combined with couple portraits and lively family stage coverage.',
      includedServices: ['Candid + Traditional Photographer', '4K Highlight Reel Videography', '25-Sheet Hardbound Album', '12x18 Wall Portrait Frame'],
      isPublished: true,
      isFeatured: true,
      order: 3,
      createdAt: now
    },
    {
      id: 'pkg_birthday_celebration',
      name: 'Milestone Birthday Celebration Pack',
      category: 'Birthday',
      price: 8500,
      image: STUDIO_IMAGES.birthdayEvent,
      duration: '4 Hours Evening Coverage',
      editedPhotosCount: '180+ Edited Candid & Family Photos',
      reelsCount: '1 Joyful Highlight Reel',
      albumDetails: '15-Sheet Family Celebration Photobook',
      frameDetails: '1x 10x12 Kids Portrait Frame',
      description: 'Warm, vibrant candid coverage of birthday decorations, cake cutting, and family portraits.',
      includedServices: ['Candid Event Photographer', '60-Second Social Highlight Reel', 'Digital Gallery Access', '10x12 Framed Portrait'],
      isPublished: true,
      isFeatured: false,
      order: 4,
      createdAt: now
    },
    {
      id: 'pkg_maternity_baby',
      name: 'Motherhood & Newborn Keepsake',
      category: 'Maternity & Baby Photography',
      price: 9500,
      image: STUDIO_IMAGES.maternityBaby,
      duration: '2.5 Hours Private Studio Session',
      editedPhotosCount: '60+ Fine-Art Retouched Portraits',
      reelsCount: '1 Studio Behind-the-Scenes Reel',
      albumDetails: '20-Page Linen Keepsake Memory Book',
      frameDetails: '1x 12x15 Museum Matte Frame',
      description: 'Peaceful studio portraiture with soft cream and warm gold drapes, organic props, and relaxed newborn pacing.',
      includedServices: ['Private Studio Setup & Lighting', 'Sanitized Organic Props & Drapes', 'Gentle Natural Retouching', '12x15 Museum Portrait Frame'],
      isPublished: true,
      isFeatured: false,
      order: 5,
      createdAt: now
    },
    {
      id: 'pkg_event_coverage',
      name: 'Corporate & Grand Event Coverage',
      category: 'Event Photography',
      price: 12000,
      image: STUDIO_IMAGES.cinematicDrone,
      duration: 'Up to 8 Hours Full Venue Coverage',
      editedPhotosCount: '300+ Color Balanced Event Photos',
      reelsCount: '1 Event Recap Aftermovie',
      albumDetails: 'Digital Cloud Vault Archive (Raw + Edited)',
      frameDetails: 'Optional Bulk Souvenir Frames',
      description: 'Clean, punctual photography & video documentation for corporate events, anniversaries, and cultural stages.',
      includedServices: ['Dedicated Event Photographer', '4K Aftermovie Recap Video', 'Express 48-Hour Highlight Delivery', 'Full Digital Archive'],
      isPublished: true,
      isFeatured: false,
      order: 6,
      createdAt: now
    }
  ];
}

export const WHY_CHOOSE_US_ITEMS = [
  {
    title: 'Creative Photography',
    description: 'Thoughtful framing, candid emotional intuition, and timeless color science tailored for Indian weddings and family portraits.'
  },
  {
    title: 'Professional Editing',
    description: 'Every photograph and 4K film passes through calibrated color grading and natural retouching in our Khaga editing suite.'
  },
  {
    title: 'Premium Albums',
    description: 'Archival flush-mount Karizma albums and custom gold-foil velvet bindings crafted exclusively by Arvind Creation.'
  },
  {
    title: 'Modern Equipment',
    description: 'Full-frame mirrorless cameras, fast prime optics, stabilized 4K gimbals, cinema lighting, and licensed aerial drones.'
  },
  {
    title: 'Personalized Service',
    description: 'Direct coordination from planning to final print delivery right at Kishanpur Road Over Bridge, Khaga, Fatehpur.'
  }
];
