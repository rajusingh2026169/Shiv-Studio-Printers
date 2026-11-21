import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where 
} from 'firebase/firestore';
import { db } from '../firebase';
import { OfferBanner, BannerDisplayPosition } from '../types';
import { STUDIO_IMAGES } from '../assets/studioAssets';

const COLLECTION_NAME = 'offer_banners';

/**
 * Filter banners that are currently active based on system time and validity window
 */
export function isBannerCurrentlyValid(banner: OfferBanner): boolean {
  if (!banner.active) return false;

  const now = new Date().getTime();
  
  if (banner.validFrom) {
    const fromTime = new Date(banner.validFrom).getTime();
    if (!isNaN(fromTime) && now < fromTime) return false;
  }

  if (banner.validUntil) {
    const untilTime = new Date(banner.validUntil).getTime();
    if (!isNaN(untilTime) && now > untilTime) {
      if (banner.autoHideAfterExpiry) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Fetch active offer banners for a specific display position
 */
export async function getActiveOfferBanners(position?: BannerDisplayPosition): Promise<OfferBanner[]> {
  try {
    const colRef = collection(db, COLLECTION_NAME);
    let q;
    if (position) {
      q = query(colRef, where('displayPosition', '==', position), where('active', '==', true));
    } else {
      q = query(colRef, where('active', '==', true));
    }

    const snap = await getDocs(q);
    const banners: OfferBanner[] = snap.docs.map(d => ({
      id: d.id,
      ...(d.data() as Omit<OfferBanner, 'id'>)
    }));

    // Filter by validity date/time window
    const validBanners = banners.filter(isBannerCurrentlyValid);

    // Sort by priority descending (higher priority first)
    validBanners.sort((a, b) => (b.priority || 0) - (a.priority || 0));

    return validBanners;
  } catch (err) {
    console.warn('Error fetching active offer banners from Firestore:', err);
    return [];
  }
}

/**
 * Fetch all offer banners for Admin Panel
 */
export async function getAllOfferBanners(): Promise<OfferBanner[]> {
  try {
    const colRef = collection(db, COLLECTION_NAME);
    const snap = await getDocs(colRef);
    const banners: OfferBanner[] = snap.docs.map(d => ({
      id: d.id,
      ...(d.data() as Omit<OfferBanner, 'id'>)
    }));

    // Sort by priority descending, then createdAt descending
    banners.sort((a, b) => {
      if ((b.priority || 0) !== (a.priority || 0)) {
        return (b.priority || 0) - (a.priority || 0);
      }
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });

    return banners;
  } catch (err) {
    console.warn('Error fetching all offer banners:', err);
    return [];
  }
}

/**
 * Save or Update an Offer Banner
 */
export async function saveOfferBanner(data: Partial<OfferBanner>): Promise<OfferBanner> {
  const bannerId = data.id || `banner_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const nowIso = new Date().toISOString();

  const payload: OfferBanner = {
    id: bannerId,
    title: data.title || 'Special Promotion',
    subtitle: data.subtitle || '',
    description: data.description || '',
    desktopImageUrl: data.desktopImageUrl || STUDIO_IMAGES.heroWedding,
    mobileImageUrl: data.mobileImageUrl || data.desktopImageUrl || STUDIO_IMAGES.heroWedding,
    backgroundVideoUrl: data.backgroundVideoUrl || '',
    buttonText: data.buttonText || 'Claim Offer',
    buttonLink: data.buttonLink || '/store',
    couponCode: data.couponCode || '',
    validFrom: data.validFrom || nowIso,
    validUntil: data.validUntil || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    active: data.active !== undefined ? data.active : true,
    priority: data.priority !== undefined ? Number(data.priority) : 10,
    autoHideAfterExpiry: data.autoHideAfterExpiry !== undefined ? data.autoHideAfterExpiry : true,
    showCountdown: data.showCountdown !== undefined ? data.showCountdown : true,
    displayPosition: data.displayPosition || 'homepage_top',
    createdAt: data.createdAt || nowIso,
    updatedAt: nowIso
  };

  const docRef = doc(db, COLLECTION_NAME, bannerId);
  await setDoc(docRef, payload, { merge: true });
  return payload;
}

/**
 * Delete an Offer Banner
 */
export async function deleteOfferBanner(id: string): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, id);
  await deleteDoc(docRef);
}

/**
 * Toggle Active state of an Offer Banner
 */
export async function toggleBannerActive(id: string, active: boolean): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, id);
  await updateDoc(docRef, { active, updatedAt: new Date().toISOString() });
}
