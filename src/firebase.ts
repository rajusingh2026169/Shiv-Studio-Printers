import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, writeBatch, collection, getDocs, limit, query } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../firebase-applet-config.json';

console.log('Initializing Firebase with Storage Bucket:', firebaseConfig.storageBucket);

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = 
  (firebaseConfig as any).firestoreDatabaseId && (firebaseConfig as any).firestoreDatabaseId !== "(default)"
    ? getFirestore(app, (firebaseConfig as any).firestoreDatabaseId) 
    : getFirestore(app);

// Initialize Firebase Storage with error handling fallback and fast-fail retry policies
let storageInstance: any;
try {
  if (!firebaseConfig.storageBucket || firebaseConfig.storageBucket.trim() === '') {
    throw new Error('Firebase Storage Bucket is empty or not configured in firebase-applet-config.json');
  }
  storageInstance = getStorage(app);
  // Set low retry limit (10 seconds) directly on the storage instance to ensure permission, CORS, 
  // and network errors fail fast rather than retrying indefinitely in the background.
  storageInstance.maxUploadRetryTime = 10000;
  storageInstance.maxOperationRetryTime = 10000;
  console.log('Firebase Storage successfully initialized with fast-fail properties.');
} catch (e) {
  console.warn('Firebase Storage initialization warning/fallback:', e);
  storageInstance = {
    ref: () => ({
      put: async () => ({ ref: { getDownloadURL: async () => 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&q=80&w=600' } }),
      getDownloadURL: async () => 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&q=80&w=600',
    })
  };
}
export const storage = storageInstance;

// Seeding function for settings and initial wedding cards if needed
export async function seedDatabaseIfNeeded() {
  try {
    const settingsDocRef = doc(db, 'settings', 'studio');
    const websiteSettingsDocRef = doc(db, 'website_settings', 'studio');
    const settingsSnap = await getDocs(query(collection(db, 'website_settings'), limit(1)));

    if (settingsSnap.empty) {
      console.log('Seeding initial studio settings...');
      const batch = writeBatch(db);

      const defaultSettings = {
        studioName: 'Shiv Studio & Printers',
        phone: '+91 7905256355, +91 8765706396',
        email: 'shivsharan52796@gmail.com',
        address: 'Kishanpur Road, Over Bridge ke Niche, Khaga, Fatehpur, Uttar Pradesh, India',
        gstNumber: '09AAAAA1111A1Z1',
        bankName: 'State Bank of India',
        bankAccount: '123456789012',
        bankIfsc: 'SBIN0001234',
        logoUrl: '',
        heroTagline: 'Capturing Memories, Printing Excellence.',
        heroTitle: 'Preserving Your Legacy, Printing Your Vision',
        heroSubtitle: "Khaga's elite destination for cinematic wedding storytelling, high-end baby portfolios, and premium industrial press solutions.",
        heroImageUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=1600',
        aboutTitle: 'Our Heritage in Fatehpur',
        aboutDescription: 'Established over a decade ago in the commercial heart of Khaga, Fatehpur, Shiv Studio & Printers has been the absolute benchmark for bespoke pre-wedding masterworks, official event coverage, and premium wedding album creations. We deliver top-tier photography and print deliverables with certified materials and state-of-the-art equipment.',
        aboutEst: 'Estd. 2018 | Khaga, Fatehpur',
        aboutImageUrl: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&q=80&w=800',
        aboutWeddingsCount: '1500+',
        aboutHappyClients: '50k+',
        welcomeText: 'Capturing Memories, Printing Excellence.',
        socialFb: 'https://facebook.com',
        socialIg: 'https://instagram.com',
        socialYt: 'https://youtube.com',
        themeColor: '#f59e0b',
        footerText: 'Copyright © Shiv Studio & Printers. All Rights Reserved.',
        seoTitle: 'Shiv Studio & Printers',
        seoDescription: 'Photography Studio & Printing Press in Khaga, Fatehpur, Uttar Pradesh, India',
        seoKeywords: 'Photography, Printing, Khaga, Fatehpur, Wedding, Album, Flex, Banner',
        officeHours: 'Monday - Sunday: 09:00 AM - 09:00 PM',
        whatsappNumber: '+917905256355',
        googleMapUrl: 'https://maps.google.com/maps?q=Kishanpur%20Road,%20Khaga,%20Fatehpur,%20Uttar%20Pradesh&t=&z=15&ie=UTF8&iwloc=&output=embed'
      };

      // Seed both collections to ensure compatibility with all queries
      batch.set(settingsDocRef, defaultSettings);
      batch.set(websiteSettingsDocRef, defaultSettings);

      await batch.commit();
      console.log('Studio settings seeded successfully!');
    }

    // Check if wedding_cards collection is empty
    const weddingCardsSnap = await getDocs(query(collection(db, 'wedding_cards'), limit(1)));
    if (weddingCardsSnap.empty) {
      console.log('Seeding default Wedding Cards collection...');
      const batch = writeBatch(db);

      const sampleCards = [
        {
          id: 'wc_15602',
          designCode: '15602',
          name: 'Royal Regal Gold Foil Laser Cut Invitation',
          category: 'Royal Laser Cut',
          price: 65,
          minOrderQuantity: 100,
          paperType: '350 GSM Velvet Metallic Board',
          printingType: 'Foil Stamping & Embossing',
          size: '7.5 x 10.5 Inches',
          description: 'Luxurious laser-cut wedding card with intricate gold foil peacock design, matching insert leaves and gold satin ribbon binding.',
          isAvailable: true,
          isFeatured: true,
          color: 'Red',
          mainImage: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=800',
          images: {
            front: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=800',
            inside: 'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?auto=format&fit=crop&q=80&w=800',
            back: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&q=80&w=800'
          },
          whatsappNumber: '+917905256355',
          createdAt: new Date().toISOString()
        },
        {
          id: 'wc_115002',
          designCode: '115002',
          name: 'Classic Golden Velvet Trunk Box Card',
          category: 'Box Invitation',
          price: 180,
          minOrderQuantity: 50,
          paperType: 'Velvet Board & Handmade Paper',
          printingType: 'Screen Printing & UV Emboss',
          size: '8 x 11 Inches',
          description: 'Premium box style invitation card with velvet touch outer casing, acrylic Ganesh motif, and 3 scroll insert leaves.',
          isAvailable: true,
          isFeatured: true,
          color: 'Gold',
          mainImage: 'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?auto=format&fit=crop&q=80&w=800',
          images: {
            front: 'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?auto=format&fit=crop&q=80&w=800',
            inside: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=800',
            back: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&q=80&w=800'
          },
          whatsappNumber: '+917905256355',
          createdAt: new Date().toISOString()
        },
        {
          id: 'wc_112402',
          designCode: '112402',
          name: 'Transparent Crystal Acrylic Modern Card',
          category: 'Acrylic',
          price: 120,
          minOrderQuantity: 100,
          paperType: '3mm Cast Acrylic & Gold Border Box',
          printingType: 'Metallic Foil Printing',
          size: '6 x 9 Inches',
          description: 'State-of-the-art transparent acrylic card with high-definition gold foil printing and matching gold envelope.',
          isAvailable: true,
          isFeatured: true,
          color: 'Gold',
          mainImage: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&q=80&w=800',
          images: {
            front: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&q=80&w=800',
            inside: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=800',
            back: 'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?auto=format&fit=crop&q=80&w=800'
          },
          whatsappNumber: '+917905256355',
          createdAt: new Date().toISOString()
        },
        {
          id: 'wc_18002',
          designCode: '18002',
          name: 'Floral Garden Pastel Multi-Fold Card',
          category: 'Floral',
          price: 45,
          minOrderQuantity: 100,
          paperType: '300 GSM Textured Matt Board',
          printingType: 'High-Def Digital & Gold Foil',
          size: '7 x 10 Inches',
          description: 'Contemporary pastel floral artwork with delicate gold foil highlights and multi-fold insert structure.',
          isAvailable: true,
          isFeatured: false,
          color: 'Pink',
          mainImage: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=800',
          images: {
            front: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=800',
            inside: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=800',
            back: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&q=80&w=800'
          },
          whatsappNumber: '+917905256355',
          createdAt: new Date().toISOString()
        },
        {
          id: 'wc_114002',
          designCode: '114002',
          name: 'Traditional Indian Maroon Radha Krishna Card',
          category: 'Traditional',
          price: 35,
          minOrderQuantity: 100,
          paperType: 'Heavy Glossy Cardstock',
          printingType: 'Screen Printing & Embossing',
          size: '8 x 10 Inches',
          description: 'Traditional wedding card with divine Radha Krishna painting, gold foil borders, and auspicious shloka motif.',
          isAvailable: true,
          isFeatured: false,
          color: 'Maroon',
          mainImage: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&q=80&w=800',
          images: {
            front: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&q=80&w=800',
            inside: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=800',
            back: 'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?auto=format&fit=crop&q=80&w=800'
          },
          whatsappNumber: '+917905256355',
          createdAt: new Date().toISOString()
        },
        {
          id: 'wc_113002',
          designCode: '113002',
          name: 'Single Sheet Minimalist Cream Gold Card',
          category: 'Single Sheet',
          price: 22,
          minOrderQuantity: 200,
          paperType: '280 GSM Ivory Cream Metallic',
          printingType: 'Gold Foil Printing',
          size: '5.5 x 8.5 Inches',
          description: 'Elegantly styled single-sheet invitation card with die-cut envelope and golden floral motif.',
          isAvailable: true,
          isFeatured: false,
          color: 'Cream',
          mainImage: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&q=80&w=800',
          images: {
            front: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&q=80&w=800',
            inside: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=800',
            back: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&q=80&w=800'
          },
          whatsappNumber: '+917905256355',
          createdAt: new Date().toISOString()
        },
        {
          id: 'wc_17002',
          designCode: '17002',
          name: 'Navy Royal Blue Laser Cut Peacock Card',
          category: 'Royal Laser Cut',
          price: 75,
          minOrderQuantity: 100,
          paperType: 'Shimmer Navy Blue Cardboard',
          printingType: 'Laser Cutting & Foil Stamping',
          size: '7 x 10 Inches',
          description: 'Ornate navy blue laser cut wedding invitation with golden peacock feather pattern and inner gold insert.',
          isAvailable: true,
          isFeatured: true,
          color: 'Blue',
          mainImage: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=800',
          images: {
            front: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=800',
            inside: 'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?auto=format&fit=crop&q=80&w=800',
            back: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&q=80&w=800'
          },
          whatsappNumber: '+917905256355',
          createdAt: new Date().toISOString()
        },
        {
          id: 'wc_117002',
          designCode: '117002',
          name: 'Emerald Green Floral Gold Embossed Card',
          category: 'Floral',
          price: 55,
          minOrderQuantity: 100,
          paperType: 'Velvet Soft Touch Emerald Board',
          printingType: 'UV Emboss & Gold Foil',
          size: '7 x 10 Inches',
          description: 'Deep emerald green velvet card adorned with gold foil botanical artwork and silk tassel.',
          isAvailable: true,
          isFeatured: false,
          color: 'Green',
          mainImage: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=800',
          images: {
            front: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=800',
            inside: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=800',
            back: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&q=80&w=800'
          },
          whatsappNumber: '+917905256355',
          createdAt: new Date().toISOString()
        },
        {
          id: 'wc_122002',
          designCode: '122002',
          name: 'Grand Maharaja Velvet Hardbound Box Card',
          category: 'Box Invitation',
          price: 250,
          minOrderQuantity: 50,
          paperType: 'Rigid Wood & Premium Crimson Velvet',
          printingType: 'Gold Foil Stamping & Brass Logo',
          size: '9 x 12 Inches',
          description: 'High-end royal box invitation crafted with velvet rigid frame, brass Ganesh emblem, and 4 wedding function inserts.',
          isAvailable: true,
          isFeatured: true,
          color: 'Red',
          mainImage: 'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?auto=format&fit=crop&q=80&w=800',
          images: {
            front: 'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?auto=format&fit=crop&q=80&w=800',
            inside: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=800',
            back: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&q=80&w=800'
          },
          whatsappNumber: '+917905256355',
          createdAt: new Date().toISOString()
        },
        {
          id: 'wc_110002',
          designCode: '110002',
          name: 'Golden Mirror Acrylic Royal Card',
          category: 'Acrylic',
          price: 140,
          minOrderQuantity: 100,
          paperType: 'Mirror Finish Acrylic Board',
          printingType: 'UV Print & Laser Engraving',
          size: '6 x 9 Inches',
          description: 'Reflective mirror finish golden acrylic card with laser engraved typography and velvet hardbound folder.',
          isAvailable: true,
          isFeatured: true,
          color: 'Gold',
          mainImage: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&q=80&w=800',
          images: {
            front: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&q=80&w=800',
            inside: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=800',
            back: 'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?auto=format&fit=crop&q=80&w=800'
          },
          whatsappNumber: '+917905256355',
          createdAt: new Date().toISOString()
        },
        {
          id: 'wc_19002',
          designCode: '19002',
          name: 'Ivory Gold Paisley Laser Cut Folder Card',
          category: 'Royal Laser Cut',
          price: 60,
          minOrderQuantity: 100,
          paperType: '300 GSM Shimmer Ivory Board',
          printingType: 'Laser Cut & Hot Foil Stamping',
          size: '7.5 x 10 Inches',
          description: 'Exquisite ivory folder with intricate paisley die-cut lace border and golden ribbon lock.',
          isAvailable: true,
          isFeatured: false,
          color: 'Cream',
          mainImage: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=800',
          images: {
            front: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=800',
            inside: 'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?auto=format&fit=crop&q=80&w=800',
            back: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&q=80&w=800'
          },
          whatsappNumber: '+917905256355',
          createdAt: new Date().toISOString()
        }
      ];

      sampleCards.forEach((card) => {
        batch.set(doc(db, 'wedding_cards', card.id), card);
      });

      await batch.commit();
      console.log('Wedding Cards collection seeded successfully!');
    }
  } catch (err) {
    console.error('Error seeding database wedding_cards:', err);
  }
}

