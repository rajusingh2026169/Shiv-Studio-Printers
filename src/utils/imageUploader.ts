import { storage, db } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, setDoc } from 'firebase/firestore';
import { checkFirebaseStorageBucket, checkExpressUploadServer } from './storageAvailability';
import { uploadDataUrlToFirestoreMedia } from './firestoreMediaStore';

/**
 * Converts a Data URL (base64) to a Blob object.
 */
function dataURLtoBlob(dataurl: string): Blob {
  const arr = dataurl.split(',');
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/webp';
  const bstr = atob(arr[1] || '');
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

/**
 * Ensures that an image string is uploaded to permanent Firebase Storage
 * (or Express /api/upload-base64 during local/preview development if Storage bucket is not initialized yet).
 * Never returns giant data URIs that fail Firestore rules.
 */
export async function uploadBase64ToStorage(
  base64String: string,
  folder: string = 'products'
): Promise<string> {
  if (!base64String || typeof base64String !== 'string') {
    return '';
  }

  // Already a hosted HTTP/HTTPS or static asset path
  if (!base64String.startsWith('data:')) {
    return base64String;
  }

  const cleanFolder = folder.replace(/^\/|\/$/g, '') || 'products';
  const filename = `img_${Date.now()}_${Math.floor(Math.random() * 10000)}.webp`;
  const filePath = `images/${cleanFolder}/${filename}`;

  const bucketCheck = await checkFirebaseStorageBucket();
  if (bucketCheck.available) {
    try {
      const storageRef = ref(storage, filePath);
      const blob = dataURLtoBlob(base64String);

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Firebase Storage upload timed out after 30s')), 30000)
      );

      await Promise.race([
        uploadBytes(storageRef, blob, {
          contentType: blob.type || 'image/webp',
          cacheControl: 'public,max-age=31536000'
        }),
        timeoutPromise
      ]);

      const downloadUrl = await getDownloadURL(storageRef);

      try {
        const imageId = `img_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        await setDoc(doc(db, 'uploaded_images', imageId), {
          url: downloadUrl,
          path: filePath,
          category: cleanFolder,
          uploadedAt: new Date().toISOString(),
          compressed: true
        });
      } catch (e) {
        console.warn('Could not record uploaded_images doc:', e);
      }

      return downloadUrl;
    } catch (storageErr) {
      console.warn('Storage base64 upload notice:', storageErr);
    }
  }

  // Durable Firestore Cloud Media fallback (works on live Vercel, preview, and localhost)
  try {
    const fsMediaUrl = await uploadDataUrlToFirestoreMedia(base64String, cleanFolder);
    if (fsMediaUrl) {
      return fsMediaUrl;
    }
  } catch (fsErr) {
    console.warn('Firestore cloud media image fallback notice:', fsErr);
  }

  if (await checkExpressUploadServer()) {
    const res = await fetch('/api/upload-base64', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dataUrl: base64String, fileName: filename })
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.url) {
        return data.url;
      }
    }
  }

  throw new Error(
    bucketCheck.reason ||
      'Cloud image upload failed. Please check your connection or paste an https:// image URL.'
  );
}

/**
 * Helper to process an array of image strings, replacing any base64 with Firebase Storage URLs.
 */
export async function ensureAllStorageUrls(
  images: string[],
  folder: string = 'products'
): Promise<string[]> {
  if (!Array.isArray(images) || images.length === 0) return [];

  const uploadPromises = images.map(async (img) => {
    if (!img) return '';
    if (img.startsWith('data:')) {
      return await uploadBase64ToStorage(img, folder);
    }
    return img;
  });

  const results = await Promise.all(uploadPromises);
  return results.filter(Boolean);
}
