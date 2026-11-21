import type { SyntheticEvent } from 'react';
import { STUDIO_IMAGES } from '../assets/studioAssets';

const ASSET_FILENAME_MAP: Array<[string, string]> = [
  ['hero_wedding_cinematic', STUDIO_IMAGES.heroWedding],
  ['prewedding_golden_hour', STUDIO_IMAGES.preWedding],
  ['maternity_baby_studio', STUDIO_IMAGES.maternityBaby],
  ['cinematic_drone_film', STUDIO_IMAGES.cinematicDrone],
  ['luxury_album_frame', STUDIO_IMAGES.luxuryAlbumFrame],
  ['studio_portrait_creative', STUDIO_IMAGES.studioPortrait],
  ['engagement_ring_ceremony', STUDIO_IMAGES.engagementRing],
  ['birthday_celebration_event', STUDIO_IMAGES.birthdayEvent],
  ['royal_wedding_invitation', STUDIO_IMAGES.royalWeddingInvite],
  ['luxury_box_invitation', STUDIO_IMAGES.luxuryBoxInvite],
  ['digital_wedding_card', STUDIO_IMAGES.digitalWeddingCard],
  ['shiv_studio_logo', STUDIO_IMAGES.logo],
];

export function isLocalhostRuntime(): boolean {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  return host === 'localhost' || host === '127.0.0.1';
}

/**
 * Returns true if the URL points to an ephemeral local/temp/dev asset that will
 * fail in Vercel live production or exceed Firestore limits.
 */
export function isEphemeralMediaUrl(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith('blob:') || trimmed.startsWith('file:') || trimmed.startsWith('gs:')) {
    return true;
  }
  if (trimmed.startsWith('/uploads/') || trimmed.startsWith('/src/assets/')) {
    return true;
  }
  if (trimmed.startsWith('data:') && trimmed.length > 2048) {
    return true;
  }
  return false;
}

/**
 * Resolves any stored image URL cleanly for both localhost and Vercel production.
 * - Remaps any dev `/src/assets/...` or stale Vite `/assets/<name>-<oldhash>.jpg` to the active build asset.
 * - Replaces broken `blob:`, `file:`, or non-localhost `/uploads/...` URLs with a valid fallback.
 */
export function resolveMediaUrl(url?: string | null, fallback: string = STUDIO_IMAGES.heroWedding): string {
  if (!url || typeof url !== 'string') return fallback;
  const trimmed = url.trim();
  if (!trimmed) return fallback;

  if (trimmed.startsWith('blob:') || trimmed.startsWith('file:') || trimmed.startsWith('gs:')) {
    return fallback;
  }

  // Remap dev asset paths or outdated Vite hashed paths to current bundle's STUDIO_IMAGES
  if (trimmed.startsWith('/src/assets/') || trimmed.startsWith('/assets/')) {
    for (const [key, currentAsset] of ASSET_FILENAME_MAP) {
      if (trimmed.includes(key)) {
        return currentAsset;
      }
    }
  }

  // Ephemeral local Express uploads only exist on the local dev machine
  if (trimmed.startsWith('/uploads/') && !isLocalhostRuntime()) {
    return fallback;
  }

  return trimmed;
}

/**
 * Reusable img onError fallback handler that swaps broken external/stale URLs
 * seamlessly without triggering an infinite error loop.
 */
export function applyImageFallback(
  e: SyntheticEvent<HTMLImageElement>,
  fallback: string = STUDIO_IMAGES.heroWedding
): void {
  const img = e.currentTarget;
  if (img.dataset.fallbackApplied === '1') return;
  img.dataset.fallbackApplied = '1';
  if (img.src !== fallback) {
    img.src = fallback;
  }
}
