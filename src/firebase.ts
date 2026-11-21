import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, writeBatch, collection, getDocs, limit, query, getDocFromServer } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../firebase-applet-config.json';
import { STUDIO_IMAGES } from './assets/studioAssets';
import { getDefaultPackagesForSeed, getDefaultServicesForSeed } from './data/studioCatalog';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db =
  (firebaseConfig as any).firestoreDatabaseId && (firebaseConfig as any).firestoreDatabaseId !== '(default)'
    ? getFirestore(app, (firebaseConfig as any).firestoreDatabaseId)
    : getFirestore(app);

export const storage = getStorage(app);
storage.maxUploadRetryTime = 3000;
storage.maxOperationRetryTime = 3000;

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'website_settings', 'studio'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Notice: Firestore is running in offline mode.');
    }
  }
}
testConnection();

let hasRunSeeding = false;

/**
 * Safely populates initial studio catalog & settings ONLY when collections are empty.
 * Never overwrites existing Firestore documents.
 */
export async function seedDatabaseIfNeeded() {
  if (!auth.currentUser || hasRunSeeding) return;
  hasRunSeeding = true;

  try {
    // 1. Seed Website & Studio Settings only if missing
    const settingsSnap = await getDocs(query(collection(db, 'website_settings'), limit(1)));
    if (settingsSnap.empty) {
      const batch = writeBatch(db);
      const defaultSettings = {
        studioName: 'SHIV STUDIO',
        tagline: 'Capturing Moments, Creating Memories.',
        creativeBrand: 'Arvind Creation',
        instagramHandle: 'Shiv_photography_officel',
        instagramUrl: 'https://www.instagram.com/Shiv_photography_officel/',
        phone: '+91 7905256355, +91 8765706396',
        email: 'shivsharan52796@gmail.com',
        address: 'Kishanpur Road Over Bridge, Khaga, Fatehpur, Uttar Pradesh, India – 212655',
        gstNumber: '09AAAAA1111A1Z1',
        bankName: 'State Bank of India',
        bankAccount: '123456789012',
        bankIfsc: 'SBIN0001234',
        upiId: 'shivsharan52796@okaxis',
        logoUrl: '',
        heroTagline: 'Capturing Moments, Creating Memories.',
        heroTitle: 'WE CAPTURE YOUR BEST MOMENTS.',
        heroSubtitle: 'Turning Your Precious Moments Into Timeless Memories.',
        heroImageUrl: STUDIO_IMAGES.heroWedding,
        aboutTitle: 'Crafting Timeless Visual Legacy in Khaga, Fatehpur',
        aboutDescription:
          'SHIV STUDIO is an established photography, cinematic filmmaking, album design, and custom print house in Khaga, Fatehpur. Together with our creative division Arvind Creation, we pair calibrated full-frame cameras and aerial cinema rigs with museum-grade photo frames and bespoke albums.',
        aboutEst: 'Khaga, Fatehpur • Uttar Pradesh 212655',
        aboutImageUrl: STUDIO_IMAGES.studioPortrait,
        welcomeText: 'Capturing Moments, Creating Memories.',
        socialIg: 'https://www.instagram.com/Shiv_photography_officel/',
        themeColor: '#D4AF37',
        footerText: '© SHIV STUDIO — Creative Brand: Arvind Creation. All Rights Reserved.',
        seoTitle: 'SHIV STUDIO | Capturing Moments, Creating Memories — Khaga, Fatehpur',
        seoDescription:
          'SHIV STUDIO (Arvind Creation) — Wedding Photography, Pre-Wedding Shoots, Cinematic Videography, Drone Coverage, Custom Photo Frames & Albums in Khaga, Fatehpur UP 212655.',
        seoKeywords: 'Shiv Studio, Khaga, Fatehpur, Wedding Photography, Pre-Wedding, Cinematic Video, Drone, Photo Frames, Album Design, Arvind Creation',
        canonicalDomain: 'https://shiv-studio.vercel.app',
        officeHours: 'Monday - Sunday: 09:00 AM - 09:00 PM',
        whatsappNumber: '+917905256355',
        googleMapUrl: 'https://maps.google.com/maps?q=Kishanpur%20Road,%20Khaga,%20Fatehpur,%20Uttar%20Pradesh%20212655&t=&z=15&ie=UTF8&iwloc=&output=embed',
        googleBusinessUrl: 'https://maps.google.com/?q=Shiv+Studio+Khaga+Fatehpur+212655',
        deliveryCharge: 150,
        freeDeliveryThreshold: 1500,
        instagramGallery: [
          { id: 'ig_1', imageUrl: STUDIO_IMAGES.heroWedding, caption: 'Royal Mandap Portraits — Khaga', postUrl: 'https://www.instagram.com/Shiv_photography_officel/' },
          { id: 'ig_2', imageUrl: STUDIO_IMAGES.preWedding, caption: 'Golden Hour Pre-Wedding Story', postUrl: 'https://www.instagram.com/Shiv_photography_officel/' },
          { id: 'ig_3', imageUrl: STUDIO_IMAGES.engagementRing, caption: 'Ring Ceremony Fine Details', postUrl: 'https://www.instagram.com/Shiv_photography_officel/' },
          { id: 'ig_4', imageUrl: STUDIO_IMAGES.luxuryAlbumFrame, caption: 'Arvind Creation Velvet Albums', postUrl: 'https://www.instagram.com/Shiv_photography_officel/' },
          { id: 'ig_5', imageUrl: STUDIO_IMAGES.cinematicDrone, caption: '4K Gimbal & Aerial Drone Team', postUrl: 'https://www.instagram.com/Shiv_photography_officel/' },
          { id: 'ig_6', imageUrl: STUDIO_IMAGES.maternityBaby, caption: 'Warm Studio Motherhood Session', postUrl: 'https://www.instagram.com/Shiv_photography_officel/' },
        ]
      };

      batch.set(doc(db, 'settings', 'studio'), defaultSettings);
      batch.set(doc(db, 'website_settings', 'studio'), defaultSettings);
      await batch.commit();
    }

    // 2. Seed core Services only if collection is empty
    const servicesSnap = await getDocs(query(collection(db, 'services'), limit(1)));
    if (servicesSnap.empty) {
      const batch = writeBatch(db);
      getDefaultServicesForSeed().forEach((srv) => {
        batch.set(doc(db, 'services', srv.id), srv);
      });
      await batch.commit();
    }

    // 3. Seed Packages only if collection is empty
    const packagesSnap = await getDocs(query(collection(db, 'packages'), limit(1)));
    if (packagesSnap.empty) {
      const batch = writeBatch(db);
      getDefaultPackagesForSeed().forEach((pkg) => {
        batch.set(doc(db, 'packages', pkg.id), pkg);
      });
      await batch.commit();
    }

    // 4. Seed Gallery Showcase only if collection is empty
    const gallerySnap = await getDocs(query(collection(db, 'gallery'), limit(1)));
    if (gallerySnap.empty) {
      const batch = writeBatch(db);
      const initialGallery = [
        { id: 'gal_wed_1', title: 'Royal Mandap Evening', category: 'Wedding', imageUrl: STUDIO_IMAGES.heroWedding, isFeatured: true, mediaType: 'photo', altText: 'Indian wedding bride and groom portrait under chandelier' },
        { id: 'gal_pre_1', title: 'Palace Sunset Pre-Wedding', category: 'Pre-Wedding', imageUrl: STUDIO_IMAGES.preWedding, isFeatured: true, mediaType: 'photo', altText: 'Pre-wedding couple golden hour portrait' },
        { id: 'gal_eng_1', title: 'Sacred Ring Exchange', category: 'Engagement', imageUrl: STUDIO_IMAGES.engagementRing, isFeatured: true, mediaType: 'photo', altText: 'Engagement ring ceremony close up' },
        { id: 'gal_bday_1', title: 'Family Milestone Celebration', category: 'Birthday', imageUrl: STUDIO_IMAGES.birthdayEvent, isFeatured: false, mediaType: 'photo', altText: 'Birthday celebration family portrait' },
        { id: 'gal_mat_1', title: 'Warm Motherhood Portrait', category: 'Maternity', imageUrl: STUDIO_IMAGES.maternityBaby, isFeatured: true, mediaType: 'photo', altText: 'Studio maternity and baby portrait' },
        { id: 'gal_film_1', title: '4K Cinema & Drone Coverage', category: 'Cinematic Films', imageUrl: STUDIO_IMAGES.cinematicDrone, isFeatured: true, mediaType: 'photo', altText: 'Cinematic wedding gimbal and drone filming' },
        { id: 'gal_alb_1', title: 'Arvind Creation Velvet Album', category: 'Album Designs', imageUrl: STUDIO_IMAGES.luxuryAlbumFrame, isFeatured: true, mediaType: 'photo', altText: 'Handcrafted black velvet gold foil photo album' },
        { id: 'gal_evt_1', title: 'Khaga Studio Setup', category: 'Events', imageUrl: STUDIO_IMAGES.studioPortrait, isFeatured: false, mediaType: 'photo', altText: 'Shiv Studio Khaga interior and color suite' },
      ];
      initialGallery.forEach((g) => {
        batch.set(doc(db, 'gallery', g.id), g);
      });
      await batch.commit();
    }
  } catch (err: any) {
    console.warn('Notice (seedDatabaseIfNeeded): Seeding deferred (permissions or offline):', err?.message || err);
  }
}
