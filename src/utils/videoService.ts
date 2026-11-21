import { db } from '../firebase';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  increment
} from 'firebase/firestore';
import { VideoItem } from '../types';
import { validateFirebaseStorageUrl, deleteStorageFileByUrl, uploadThumbnailResumable, validateAndFilterVideoDocs } from './videoUtils';
import { STUDIO_IMAGES } from '../assets/studioAssets';

/**
 * Saves video document to Firestore collection 'videos'.
 * Enforces strict validation: videoUrl and thumbnailUrl MUST be valid permanent Firebase Storage URLs.
 * Never saves blob: or base64 data: URLs to Firestore.
 */
export async function saveVideoMetadata(videoData: Partial<VideoItem>): Promise<VideoItem> {
  const validVideoUrl = validateFirebaseStorageUrl(videoData.videoUrl, 'videoUrl');
  let validThumbnailUrl = videoData.thumbnailUrl?.trim() || '';

  // Ensure Base64 thumbnail is uploaded to Firebase Storage and converted to HTTPS URL
  if (validThumbnailUrl.startsWith('data:') || validThumbnailUrl.length > 2000) {
    console.warn('[Video System] Converting Base64 thumbnailUrl to Storage URL in saveVideoMetadata...');
    try {
      validThumbnailUrl = await uploadThumbnailResumable(validThumbnailUrl, videoData.category || 'gallery');
    } catch (e) {
      console.warn('Fallback thumbnail URL applied:', e);
      validThumbnailUrl = STUDIO_IMAGES.cinematicDrone;
    }
  }

  if (!validThumbnailUrl) {
    validThumbnailUrl = STUDIO_IMAGES.cinematicDrone;
  }

  const title = videoData.title?.trim();
  if (!title) {
    throw new Error('Video title is required.');
  }

  const videoId = videoData.id || `vid_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
  const nowIso = new Date().toISOString();

  const payload: Partial<VideoItem> & Record<string, any> = {
    id: videoId,
    title,
    description: videoData.description?.trim() || '',
    category: videoData.category || 'gallery',
    videoUrl: validVideoUrl,
    thumbnailUrl: validThumbnailUrl,
    duration: videoData.duration && videoData.duration !== '00:00' ? videoData.duration : '00:00',
    fileSize: videoData.fileSize || '0 MB',
    createdAt: videoData.createdAt || nowIso,
    updatedAt: nowIso,
    uploadedBy: videoData.uploadedBy || 'admin',
    status: videoData.status || 'active',
    entityId: videoData.entityId || '',
    order: videoData.order !== undefined ? videoData.order : Date.now(),
    views: typeof videoData.views === 'number' ? videoData.views : 0
  };

  await setDoc(doc(db, 'videos', videoId), payload, { merge: true });
  console.log(`[Video System] Firestore Saved: ${videoId}`);
  console.log('[Video System] Firestore saved URL:', validVideoUrl);
  return payload as VideoItem;
}

/**
 * Retrieves all videos from Firestore 'videos' collection.
 */
export async function getAllVideos(): Promise<VideoItem[]> {
  try {
    const snap = await getDocs(collection(db, 'videos'));
    const rawVideos = snap.docs.map(d => ({
      id: d.id,
      ...(d.data() as object)
    } as VideoItem));

    const valid = validateAndFilterVideoDocs(rawVideos);
    valid.sort((a, b) => (a.order || 0) - (b.order || 0));
    console.log(`[Video System] Gallery Reloaded: ${valid.length} valid videos loaded from Firestore.`);
    return valid;
  } catch (err) {
    console.error('[Video System] Error fetching all videos from Firestore:', err);
    return [];
  }
}

/**
 * Retrieves videos for a given category (e.g. 'products', 'services', 'gallery', 'portfolio').
 */
export async function getVideosForCategory(category: string, entityId?: string): Promise<VideoItem[]> {
  try {
    const colRef = collection(db, 'videos');
    let q;
    if (entityId) {
      q = query(colRef, where('category', '==', category), where('entityId', '==', entityId));
    } else {
      q = query(colRef, where('category', '==', category));
    }

    const snap = await getDocs(q);
    const rawVideos = snap.docs.map(d => ({
      id: d.id,
      ...(d.data() as object)
    } as VideoItem));

    const valid = validateAndFilterVideoDocs(rawVideos);
    valid.sort((a, b) => (a.order || 0) - (b.order || 0));
    return valid;
  } catch (err) {
    console.error(`[Video System] Error fetching category "${category}" videos:`, err);
    return [];
  }
}

/**
 * Deletes video document from Firestore and its files from Storage.
 */
export async function deleteVideo(videoId: string): Promise<void> {
  if (!videoId) return;
  try {
    const docRef = doc(db, 'videos', videoId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data() as VideoItem;
      if (data.videoUrl) {
        await deleteStorageFileByUrl(data.videoUrl);
      }
      if (data.thumbnailUrl) {
        await deleteStorageFileByUrl(data.thumbnailUrl);
      }
    }
    await deleteDoc(docRef);
    console.log(`[Video System] Deleted video doc and storage files for ID: ${videoId}`);
  } catch (err) {
    console.error(`[Video System] Error deleting video ID ${videoId}:`, err);
    throw err;
  }
}

/**
 * Increments view count in Firestore document.
 */
export async function incrementVideoViews(videoId: string): Promise<void> {
  if (!videoId) return;
  try {
    const docRef = doc(db, 'videos', videoId);
    await updateDoc(docRef, {
      views: increment(1)
    });
  } catch (err) {
    console.warn('[Video System] Could not increment video views:', err);
  }
}

/**
 * Reorders videos in Firestore.
 */
export async function reorderVideos(videos: VideoItem[]): Promise<void> {
  try {
    for (let i = 0; i < videos.length; i++) {
      const vid = videos[i];
      await setDoc(doc(db, 'videos', vid.id), { order: i }, { merge: true });
    }
  } catch (err) {
    console.error('[Video System] Error reordering videos:', err);
  }
}
