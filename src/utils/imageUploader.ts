import { storage, db } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, setDoc } from 'firebase/firestore';

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
 * and returns the generated HTTPS download URL.
 * Never returns ephemeral localhost paths or giant data URIs that fail Firestore rules.
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

  // Record uploaded image metadata in Firestore (best effort)
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
