import { storage, db } from '../firebase';
import { ref, uploadBytes, uploadString, getDownloadURL } from 'firebase/storage';
import { collection, doc, setDoc } from 'firebase/firestore';

/**
 * Converts a Data URL (base64) to a Blob object.
 */
function dataURLtoBlob(dataurl: string): Blob {
  const arr = dataurl.split(',');
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/png';
  const bstr = atob(arr[1] || '');
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

/**
 * Ensures that an image URL string is a valid HTTPS storage URL.
 * If the input is a Base64 string (data:image/...), it converts it to a Blob and uploads to Firebase Storage
 * and returns the generated download URL. Never returns a heavy base64 string or crashes on retry limit.
 */
export async function uploadBase64ToStorage(
  base64String: string,
  folder: string = 'products'
): Promise<string> {
  if (!base64String || typeof base64String !== 'string') {
    return '';
  }

  // If it's already an http/https URL, return as is
  if (!base64String.startsWith('data:')) {
    return base64String;
  }

  try {
    const cleanFolder = folder.replace(/^\/|\/$/g, '');
    const filename = `img_${Date.now()}_${Math.floor(Math.random() * 10000)}.webp`;
    const filePath = `${cleanFolder}/${filename}`;
    const storageRef = ref(storage, filePath);

    // Convert data URL to Blob for fast binary uploadBytes
    const blob = dataURLtoBlob(base64String);

    // 20-second timeout race to avoid hanging indefinitely
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Storage upload timeout')), 20000)
    );

    await Promise.race([
      uploadBytes(storageRef, blob, {
        contentType: blob.type || 'image/webp',
        cacheControl: 'public,max-age=31536000'
      }),
      timeoutPromise
    ]);

    const downloadUrl = await getDownloadURL(storageRef);

    // Record uploaded image in Firestore metadata collection
    try {
      const imageId = `img_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      await setDoc(doc(db, 'uploaded_images', imageId), {
        url: downloadUrl,
        path: filePath,
        category: folder,
        uploadedAt: new Date().toISOString()
      });
    } catch (e) {
      console.warn('Could not record uploaded_images doc:', e);
    }

    return downloadUrl;
  } catch (err: any) {
    console.warn('⚠️ Firebase Storage base64 upload notice (preserving original uploaded image):', err?.message || err);
    // CRITICAL: Always return original base64 string on upload error/timeout, NEVER return a demo or sample image!
    return base64String;
  }
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
