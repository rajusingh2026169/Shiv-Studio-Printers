import { storage } from '../firebase';
import firebaseConfig from '../../firebase-applet-config.json';

interface BucketCheckCache {
  available: boolean;
  reason?: string;
  checkedAt: number;
}

interface ExpressCheckCache {
  available: boolean;
  checkedAt: number;
}

let bucketCache: BucketCheckCache | null = null;
let expressCache: ExpressCheckCache | null = null;

/**
 * Fast-probes whether the configured Firebase Storage bucket actually exists (not HTTP 404).
 * Prevents uploadBytesResumable from hanging for 30+ seconds and throwing storage/retry-limit-exceeded
 * when Firebase Storage has not yet been initialized in the Firebase Console.
 */
export async function checkFirebaseStorageBucket(): Promise<{ available: boolean; reason?: string }> {
  const now = Date.now();
  if (bucketCache) {
    const ttl = bucketCache.available ? 120000 : 25000;
    if (now - bucketCache.checkedAt < ttl) {
      return { available: bucketCache.available, reason: bucketCache.reason };
    }
  }

  const bucket =
    (storage as any)?.app?.options?.storageBucket ||
    (firebaseConfig as any).storageBucket ||
    '';

  if (!bucket) {
    bucketCache = {
      available: false,
      reason: 'Firebase Storage bucket is not configured in firebase-applet-config.json.',
      checkedAt: now
    };
    return { available: false, reason: bucketCache.reason };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);

  try {
    const res = await fetch(
      `https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(bucket)}/o?maxResults=1`,
      {
        method: 'GET',
        signal: controller.signal
      }
    );

    if (res.status === 404) {
      bucketCache = {
        available: false,
        reason: `Firebase Storage bucket "${bucket}" is not initialized yet in Firebase Console (HTTP 404). Enable Storage → Get Started in Firebase Console for live cloud uploads.`,
        checkedAt: now
      };
      return { available: false, reason: bucketCache.reason };
    }

    // 200, 401, or 403 all confirm the bucket exists and is active
    bucketCache = { available: true, checkedAt: now };
    return { available: true };
  } catch (err: any) {
    // Network abort or CORS block on probe — let caller decide failover
    return {
      available: false,
      reason: err?.name === 'AbortError'
        ? 'Firebase Storage health check timed out.'
        : (err?.message || 'Unable to reach Firebase Storage.')
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

export function invalidateStorageBucketCache(): void {
  bucketCache = null;
}

/**
 * Checks whether the Express upload server (`server.ts`) is live on the current origin
 * (works on localhost, 127.0.0.1, Cloud Run AI Studio preview, and Node server deploys;
 * safely returns false on Vercel static SPA where /api/health returns HTML).
 */
export async function checkExpressUploadServer(): Promise<boolean> {
  const now = Date.now();
  if (expressCache && now - expressCache.checkedAt < 60000) {
    return expressCache.available;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2500);

  try {
    const res = await fetch('/api/health', {
      method: 'GET',
      cache: 'no-store',
      signal: controller.signal
    });
    const contentType = res.headers.get('content-type') || '';
    if (!res.ok || !contentType.includes('application/json')) {
      expressCache = { available: false, checkedAt: now };
      return false;
    }
    const data = await res.json();
    const ok = data?.status === 'ok';
    expressCache = { available: ok, checkedAt: now };
    return ok;
  } catch {
    expressCache = { available: false, checkedAt: now };
    return false;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Uploads a File/Blob directly via Express POST /api/upload with XHR progress reporting.
 */
export function uploadFileViaExpressApi(
  file: Blob,
  fileName: string,
  onProgress?: (pct: number, loaded: number, total: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append('file', file, fileName);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        const pct = Math.min(99, Math.max(5, Math.round((event.loaded / event.total) * 100)));
        onProgress(pct, event.loaded, event.total);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const parsed = JSON.parse(xhr.responseText);
          if (parsed?.url) {
            resolve(parsed.url);
            return;
          }
        } catch {
          // fall through
        }
      }
      reject(new Error(`Server upload returned HTTP ${xhr.status}`));
    };

    xhr.onerror = () => reject(new Error('Network error while uploading to server /api/upload'));
    xhr.ontimeout = () => reject(new Error('Server /api/upload timed out after 60s'));
    xhr.timeout = 60000;
    xhr.open('POST', '/api/upload', true);
    xhr.send(formData);
  });
}
