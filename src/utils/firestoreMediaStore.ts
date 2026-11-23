import { auth, db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export const FSMEDIA_PREFIX = 'fsmedia://';
export const CHUNK_SIZE_BYTES = 450 * 1024; // ~450KB binary -> ~614KB Base64 (safely < 1MB Firestore limit)
export const MAX_FIRESTORE_MEDIA_BYTES = 25 * 1024 * 1024; // 25MB max for Firestore cloud fallback

const blobCache = new Map<string, Blob>();
const objectUrlCache = new Map<string, string>();
const inFlightFetchMap = new Map<string, Promise<Blob>>();

export function isFsMediaUrl(url?: string | null): boolean {
  return typeof url === 'string' && url.trim().startsWith(FSMEDIA_PREFIX);
}

export function extractFsMediaId(url?: string | null): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed.startsWith(FSMEDIA_PREFIX)) return '';
  return trimmed.slice(FSMEDIA_PREFIX.length).replace(/[^a-zA-Z0-9_-]/g, '');
}

export function getCachedFsMediaObjectUrl(fsMediaUrl?: string | null): string {
  if (!fsMediaUrl || !isFsMediaUrl(fsMediaUrl)) return '';
  const key = fsMediaUrl.trim();
  return objectUrlCache.get(key) || '';
}

function uint8ArrayToBase64(bytes: Uint8Array): string {
  const chunkSize = 0x8000;
  const parts: string[] = [];
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const slice = bytes.subarray(i, i + chunkSize);
    parts.push(String.fromCharCode(...slice));
  }
  return btoa(parts.join(''));
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function dataUrlToBlob(dataUrl: string): Blob {
  const arr = dataUrl.split(',');
  const mimeMatch = arr[0]?.match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/webp';
  const bytes = base64ToUint8Array(arr[1] || '');
  return new Blob([bytes.buffer as ArrayBuffer], { type: mime });
}

const openMediaIDB = (): Promise<IDBDatabase | null> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      resolve(null);
      return;
    }
    try {
      const req = window.indexedDB.open('shiv_studio_files_db', 1);
      req.onupgradeneeded = (e: any) => {
        const idb = e.target.result;
        if (!idb.objectStoreNames.contains('original_photos')) {
          idb.createObjectStore('original_photos');
        }
      };
      req.onsuccess = (e: any) => resolve(e.target.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
};

async function writeBlobToIDB(key: string, blob: Blob): Promise<void> {
  try {
    const idb = await openMediaIDB();
    if (!idb) return;
    const tx = idb.transaction('original_photos', 'readwrite');
    tx.objectStore('original_photos').put(blob, key);
  } catch {
    // Non-fatal local cache write notice
  }
}

async function readBlobFromIDB(key: string): Promise<Blob | null> {
  try {
    const idb = await openMediaIDB();
    if (!idb) return null;
    return await new Promise<Blob | null>((resolve) => {
      const tx = idb.transaction('original_photos', 'readonly');
      const req = tx.objectStore('original_photos').get(key);
      req.onsuccess = () => resolve(req.result instanceof Blob ? req.result : null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export function cacheFsMediaBlob(fsMediaUrl: string, blob: Blob): string {
  const key = fsMediaUrl.trim();
  blobCache.set(key, blob);
  let objUrl = objectUrlCache.get(key);
  if (!objUrl && typeof URL !== 'undefined') {
    objUrl = URL.createObjectURL(blob);
    objectUrlCache.set(key, objUrl);
  }
  void writeBlobToIDB(key, blob);
  return objUrl || '';
}

export interface FirestoreMediaUploadOptions {
  fileName?: string;
  contentType?: string;
  category?: string;
  uploadedBy?: string;
  onProgress?: (pct: number, bytesTransferred: number, totalBytes: number) => void;
}

/**
 * Stores any file or compressed asset durably in Cloud Firestore (`uploaded_media/{mediaId}` + chunk docs)
 * and returns a short `fsmedia://{mediaId}` URI (< 40 chars).
 * Works identically on live Vercel deployments, Cloud Run preview, and localhost across all devices.
 */
export async function uploadFileToFirestoreMedia(
  fileOrBlob: Blob,
  options: FirestoreMediaUploadOptions = {}
): Promise<string> {
  const totalBytes = fileOrBlob.size || 0;
  if (totalBytes <= 0) {
    throw new Error('Cannot upload an empty file.');
  }
  if (totalBytes > MAX_FIRESTORE_MEDIA_BYTES) {
    const mb = (totalBytes / (1024 * 1024)).toFixed(1);
    throw new Error(
      `File (${mb} MB) exceeds the 25 MB limit for direct database cloud storage. Compress or resize below 25 MB, or enable Firebase Storage in Firebase Console.`
    );
  }

  const cleanCategory = (options.category || 'general').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 80) || 'general';
  const fileName = (options.fileName || (fileOrBlob instanceof File ? fileOrBlob.name : `asset_${Date.now()}.bin`)).slice(0, 300);
  const contentType = (options.contentType || fileOrBlob.type || 'application/octet-stream').slice(0, 160);
  const uploadedBy = (options.uploadedBy || (auth.currentUser ? auth.currentUser.email || 'Authenticated User' : 'Guest Customer')).slice(0, 160);
  const ownerId = auth.currentUser ? auth.currentUser.uid : 'anonymous';

  const mediaId = `med_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  const chunkCount = Math.max(1, Math.ceil(totalBytes / CHUNK_SIZE_BYTES));

  options.onProgress?.(8, Math.round(totalBytes * 0.08), totalBytes);

  // 1. Write parent metadata document first (enforced by Firestore Security Rules before chunk writes)
  await setDoc(doc(db, 'uploaded_media', mediaId), {
    id: mediaId,
    fileName,
    contentType,
    size: totalBytes,
    chunkCount,
    category: cleanCategory,
    ownerId,
    uploadedBy,
    createdAt: new Date().toISOString()
  });

  // 2. Upload chunks sequentially/parallelized in small worker pool with live byte progress
  let uploadedBytes = 0;
  let nextIdx = 0;
  const concurrency = Math.min(4, chunkCount);

  const uploadWorker = async () => {
    while (nextIdx < chunkCount) {
      const idx = nextIdx++;
      const start = idx * CHUNK_SIZE_BYTES;
      const end = Math.min(totalBytes, start + CHUNK_SIZE_BYTES);
      const sliceBlob = fileOrBlob.slice(start, end);
      const arrayBuf = await sliceBlob.arrayBuffer();
      const base64Data = uint8ArrayToBase64(new Uint8Array(arrayBuf));

      await setDoc(doc(db, 'uploaded_media', mediaId, 'chunks', String(idx)), {
        index: idx,
        data: base64Data
      });

      uploadedBytes += end - start;
      const pct = Math.min(98, Math.max(10, Math.round((uploadedBytes / totalBytes) * 95)));
      options.onProgress?.(pct, Math.min(totalBytes, uploadedBytes), totalBytes);
    }
  };

  await Promise.all(Array.from({ length: concurrency }, () => uploadWorker()));

  const fsMediaUrl = `${FSMEDIA_PREFIX}${mediaId}`;
  cacheFsMediaBlob(fsMediaUrl, fileOrBlob);
  options.onProgress?.(100, totalBytes, totalBytes);

  return fsMediaUrl;
}

/**
 * Convenience helper to persist a base64 Data URL in Cloud Firestore Media and return `fsmedia://{mediaId}`.
 */
export async function uploadDataUrlToFirestoreMedia(
  dataUrl: string,
  category: string = 'images'
): Promise<string> {
  const blob = dataUrlToBlob(dataUrl);
  return await uploadFileToFirestoreMedia(blob, {
    fileName: `img_${Date.now()}.webp`,
    contentType: blob.type || 'image/webp',
    category
  });
}

/**
 * Reassembles the exact original Blob for any `fsmedia://{mediaId}` URI from Cloud Firestore
 * (with in-memory + IndexedDB caching to avoid duplicate reads).
 */
export async function fetchFirestoreMediaBlob(fsMediaUrl: string): Promise<Blob> {
  const key = fsMediaUrl.trim();
  if (blobCache.has(key)) {
    return blobCache.get(key)!;
  }

  if (inFlightFetchMap.has(key)) {
    return inFlightFetchMap.get(key)!;
  }

  const fetchPromise = (async () => {
    const idbCached = await readBlobFromIDB(key);
    if (idbCached) {
      cacheFsMediaBlob(key, idbCached);
      return idbCached;
    }

    const mediaId = extractFsMediaId(key);
    if (!mediaId) {
      throw new Error('Invalid fsmedia URI.');
    }

    const metaSnap = await getDoc(doc(db, 'uploaded_media', mediaId));
    if (!metaSnap.exists()) {
      throw new Error(`Cloud media record "${mediaId}" not found.`);
    }

    const meta = metaSnap.data() as { chunkCount: number; contentType?: string };
    const chunkCount = Math.max(1, Number(meta.chunkCount) || 1);

    const chunkSnaps = await Promise.all(
      Array.from({ length: chunkCount }, (_, idx) =>
        getDoc(doc(db, 'uploaded_media', mediaId, 'chunks', String(idx)))
      )
    );

    const binaryParts: ArrayBuffer[] = [];
    for (let i = 0; i < chunkSnaps.length; i++) {
      const snap = chunkSnaps[i];
      if (!snap.exists()) {
        throw new Error(`Missing media chunk ${i} for "${mediaId}".`);
      }
      const chunkData = snap.data() as { data?: string };
      if (!chunkData?.data) {
        throw new Error(`Empty media chunk ${i} for "${mediaId}".`);
      }
      const bytes = base64ToUint8Array(chunkData.data);
      binaryParts.push(bytes.buffer as ArrayBuffer);
    }

    const fullBlob = new Blob(binaryParts, {
      type: meta.contentType || 'application/octet-stream'
    });
    cacheFsMediaBlob(key, fullBlob);
    return fullBlob;
  })();

  inFlightFetchMap.set(key, fetchPromise);
  try {
    return await fetchPromise;
  } finally {
    inFlightFetchMap.delete(key);
  }
}

/**
 * Resolves a `fsmedia://{mediaId}` URI into a browser-playable ObjectURL (`blob:...`).
 */
export async function resolveFsMediaObjectUrl(fsMediaUrl: string): Promise<string> {
  const cached = getCachedFsMediaObjectUrl(fsMediaUrl);
  if (cached) return cached;
  await fetchFirestoreMediaBlob(fsMediaUrl);
  return getCachedFsMediaObjectUrl(fsMediaUrl);
}
