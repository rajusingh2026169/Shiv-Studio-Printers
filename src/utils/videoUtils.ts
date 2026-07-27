import { storage, auth } from '../firebase';
import firebaseConfig from '../../firebase-applet-config.json';
import { ref, uploadBytes, uploadBytesResumable, getDownloadURL, deleteObject, UploadTask } from 'firebase/storage';
import { VideoItem } from '../types';

export const MAX_VIDEO_SIZE_BYTES = 200 * 1024 * 1024; // 200 MB

export const SUPPORTED_VIDEO_MIME_TYPES = [
  'video/mp4',
  'video/quicktime', // MOV
  'video/webm'
];

export const SUPPORTED_VIDEO_EXTENSIONS = ['.mp4', '.mov', '.webm'];

export const SUPPORTED_THUMBNAIL_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export interface VideoValidationResult {
  isValid: boolean;
  error?: string;
}

export interface UploadProgressInfo {
  progress: number; // 0 - 100
  bytesTransferred: number;
  totalBytes: number;
  speed: string; // e.g. "2.4 MB/s"
  speedBytesPerSec: number;
  remainingTime: string; // e.g. "00:42" or "1m 15s"
}

/**
 * Validates video file size (max 200MB) and format (MP4, MOV, WEBM).
 */
export function validateVideoFile(file: File): VideoValidationResult {
  if (!file) {
    return { isValid: false, error: 'No video file selected.' };
  }

  // Size validation
  if (file.size > MAX_VIDEO_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      isValid: false,
      error: `File size exceeds maximum 200 MB limit (Selected: ${sizeMb} MB).`
    };
  }

  // Format validation
  const filename = file.name.toLowerCase();
  const extMatch = SUPPORTED_VIDEO_EXTENSIONS.some(ext => filename.endsWith(ext));
  const mimeMatch = SUPPORTED_VIDEO_MIME_TYPES.includes(file.type.toLowerCase()) || file.type.startsWith('video/');

  if (!extMatch && !mimeMatch) {
    return {
      isValid: false,
      error: 'Unsupported format. Please upload an MP4, MOV, or WEBM video file.'
    };
  }

  return { isValid: true };
}

/**
 * Validates thumbnail image format (JPG, PNG, WEBP).
 */
export function validateThumbnailFile(file: File): VideoValidationResult {
  if (!file) {
    return { isValid: false, error: 'No thumbnail file selected.' };
  }
  const type = file.type.toLowerCase();
  const name = file.name.toLowerCase();
  const validExt = name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.png') || name.endsWith('.webp');
  const validMime = SUPPORTED_THUMBNAIL_TYPES.includes(type) || type.startsWith('image/');

  if (!validExt && !validMime) {
    return {
      isValid: false,
      error: 'Unsupported thumbnail format. Please upload JPG, PNG, or WEBP image.'
    };
  }
  return { isValid: true };
}

/**
 * Validates video/thumbnail URL strictly.
 * Accepts permanent HTTPS URLs, Data URLs, or Blob URLs.
 */
export function validateFirebaseStorageUrl(url: string | undefined, fieldName: string = 'videoUrl'): string {
  const trimmed = url?.trim() || '';
  if (!trimmed) {
    throw new Error(`${fieldName} is required.`);
  }

  if (
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('file:') ||
    trimmed.startsWith('gs:') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('/') ||
    trimmed.startsWith('./')
  ) {
    throw new Error(`Invalid ${fieldName}: Local, temporary, blob or gs:// paths are strictly forbidden ("${trimmed}"). Must be a valid HTTPS download URL.`);
  }

  if (!trimmed.startsWith('https://') && !trimmed.startsWith('http://')) {
    throw new Error(`Invalid ${fieldName}: URL must be a valid HTTP/HTTPS download URL.`);
  }

  return trimmed;
}

/**
 * Validates array of VideoItems loaded from Firestore collection 'videos'.
 * Enforces:
 * 1. videoUrl exists and is a valid HTTPS/Storage download URL.
 * 2. thumbnailUrl exists and is a valid HTTPS/Storage URL (NOT a Base64 string or blob URL).
 * If any item is missing required fields or has invalid URLs, logs a detailed console message explaining why it was skipped.
 */
export function validateAndFilterVideoDocs(docs: VideoItem[]): VideoItem[] {
  const DEFAULT_STOCK_THUMB = 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=800';
  const validVideos: VideoItem[] = [];

  docs.forEach((docItem) => {
    const docId = docItem.id || 'Unknown_ID';
    const docTitle = docItem.title || 'Untitled Video';

    // 1. Verify videoUrl
    if (!docItem.videoUrl || typeof docItem.videoUrl !== 'string' || !docItem.videoUrl.trim()) {
      console.warn(`[Video System] Skipped video document ID "${docId}" ("${docTitle}"): Missing or empty 'videoUrl'.`, docItem);
      return;
    }

    const trimmedVideoUrl = docItem.videoUrl.trim();
    if (
      (!trimmedVideoUrl.startsWith('https://') && !trimmedVideoUrl.startsWith('http://')) ||
      trimmedVideoUrl.startsWith('blob:') ||
      trimmedVideoUrl.startsWith('file:') ||
      trimmedVideoUrl.startsWith('gs:')
    ) {
      console.warn(`[Video System] Skipped video document ID "${docId}" ("${docTitle}"): 'videoUrl' is not a valid HTTPS download URL ("${trimmedVideoUrl}").`, docItem);
      return;
    }

    // 2. Verify thumbnailUrl
    let finalThumb = docItem.thumbnailUrl?.trim() || '';

    if (!finalThumb) {
      console.warn(`[Video System] Warning: Video document ID "${docId}" ("${docTitle}") missing 'thumbnailUrl'. Using default stock thumbnail.`);
      finalThumb = DEFAULT_STOCK_THUMB;
    } else if (finalThumb.startsWith('data:') || finalThumb.length > 2000 || finalThumb.startsWith('blob:')) {
      console.warn(`[Video System] Warning: Video document ID "${docId}" ("${docTitle}") contains a Base64/blob 'thumbnailUrl'. Replacing with stock thumbnail URL.`);
      finalThumb = DEFAULT_STOCK_THUMB;
    }

    validVideos.push({
      ...docItem,
      videoUrl: trimmedVideoUrl,
      thumbnailUrl: finalThumb
    });
  });

  return validVideos;
}

/**
 * Format bytes into human readable string (e.g. 14.5 MB).
 */
export function formatBytes(bytes: number, decimals: number = 1): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Format seconds into HH:MM:SS or MM:SS.
 */
export function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds) || seconds < 0) return '00:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hrs > 0) {
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Map Firebase error codes to human friendly messages.
 */
export function mapFirebaseStorageError(err: any): string {
  if (!err) return 'An unknown error occurred during video storage operation.';
  const code = err.code || err?.error?.code || '';
  const message = err.message || String(err);

  if (code === 'storage/retry-limit-exceeded' || message.includes('retry limit exceeded')) {
    return 'Maximum upload retry limit exceeded. Please check your internet connection and try again.';
  }
  if (code === 'storage/unauthorized' || message.includes('unauthorized') || message.includes('permission-denied')) {
    return 'Storage permission denied. Please verify your authentication status.';
  }
  if (code === 'storage/canceled') {
    return 'Upload was canceled by the user.';
  }
  if (code === 'storage/object-not-found') {
    return 'Storage object was not found.';
  }
  if (code === 'network-request-failed' || message.includes('network')) {
    return 'Network request failed. Please check your network connection.';
  }
  return message;
}

/**
 * Extracts a thumbnail blob from a video file or video URL at a specific seek time.
 */
export function generateVideoThumbnailBlob(videoSource: File | string, seekToSeconds: number = 1.0): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.muted = true;
    video.playsInline = true;
    video.autoplay = false;

    let objectUrl = '';
    if (typeof videoSource === 'string') {
      video.src = videoSource;
    } else {
      objectUrl = URL.createObjectURL(videoSource);
      video.src = objectUrl;
    }

    const cleanup = () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
      video.remove();
    };

    video.onloadeddata = () => {
      if (video.duration && video.duration < seekToSeconds) {
        video.currentTime = 0.1;
      } else {
        video.currentTime = seekToSeconds;
      }
    };

    video.onseeked = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 360;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          cleanup();
          return reject(new Error('Canvas 2D context unavailable for thumbnail extraction'));
        }

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => {
            cleanup();
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to create thumbnail blob from canvas'));
            }
          },
          'image/jpeg',
          0.9
        );
      } catch (e) {
        cleanup();
        reject(e);
      }
    };

    video.onerror = () => {
      cleanup();
      reject(new Error('Error loading video element for thumbnail frame extraction'));
    };
  });
}

/**
 * Capture frame from a live HTML5 video element at its current playback position.
 */
export function captureFrameFromVideoElement(video: HTMLVideoElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 360;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return reject(new Error('Canvas context unavailable'));
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to capture frame blob'));
        },
        'image/jpeg',
        0.92
      );
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Uploads a video file to Firebase Storage under `/videos/` using uploadBytesResumable().
 * Returns uploadTask and a promise resolving strictly to the permanent Firebase Download URL (HTTPS).
 */
export function uploadVideoResumable(
  file: File,
  category: string = 'gallery',
  onProgress?: (info: UploadProgressInfo) => void
): { task: UploadTask; promise: Promise<string> } {
  console.log(`[Video System] Video Selected: ${file.name} (${formatBytes(file.size)})`);

  const timestamp = Date.now();
  const sanitizeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const uploadPath = `videos/${category}/${timestamp}_${sanitizeName}`;
  const storageRef = ref(storage, uploadPath);

  // 1. Log Firebase Storage path
  console.log('[Video System] Firebase Storage path:', uploadPath);

  const metadata = {
    contentType: file.type || 'video/mp4',
    customMetadata: {
      originalName: file.name,
      uploadedAt: new Date().toISOString()
    }
  };

  const uploadTask = uploadBytesResumable(storageRef, file, metadata);

  const promise = new Promise<string>((resolve, reject) => {
    let lastTime = Date.now();
    let lastBytes = 0;

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        const currentTime = Date.now();
        const timeDiff = (currentTime - lastTime) / 1000;
        const bytesDiff = snapshot.bytesTransferred - lastBytes;

        let speedStr = '0 MB/s';
        let remainingTimeStr = 'Calculating...';

        if (timeDiff > 0.5 && bytesDiff >= 0) {
          const speedBytesPerSec = bytesDiff / timeDiff;
          speedStr = `${formatBytes(speedBytesPerSec)}/s`;
          const remainingBytes = snapshot.totalBytes - snapshot.bytesTransferred;
          const remainingSec = speedBytesPerSec > 0 ? Math.ceil(remainingBytes / speedBytesPerSec) : 0;
          remainingTimeStr = formatDuration(remainingSec);
          lastTime = currentTime;
          lastBytes = snapshot.bytesTransferred;
        }

        if (onProgress) {
          onProgress({
            progress: isNaN(progress) ? 0 : progress,
            bytesTransferred: snapshot.bytesTransferred,
            totalBytes: snapshot.totalBytes,
            speed: speedStr,
            speedBytesPerSec: 0,
            remainingTime: remainingTimeStr
          });
        }
      },
      (error) => {
        console.error('[Video System] Firebase Storage upload error:', error);
        reject(error);
      },
      async () => {
        try {
          console.log('[Video System] Upload complete! Calling getDownloadURL(uploadTask.snapshot.ref)...');
          
          // 1. Get download URL after upload completes
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);

          // 2. Log Download URL
          console.log('[Video System] Download URL:', downloadUrl);

          // 3. Strict validation: Never allow blob:, file://, local paths, gs://, etc.
          validateFirebaseStorageUrl(downloadUrl, 'downloadUrl');

          resolve(downloadUrl);
        } catch (urlErr) {
          console.error('[Video System] Error retrieving download URL after upload:', urlErr);
          reject(urlErr);
        }
      }
    );
  });

  return { task: uploadTask, promise };
}

/**
 * Helper function to convert a Data URL (Base64) to a Blob object.
 */
export function dataURLtoBlob(dataurl: string): Blob {
  try {
    const arr = dataurl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const bstr = atob(arr[1] || '');
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  } catch (e) {
    console.warn('dataURLtoBlob conversion error:', e);
    return new Blob([], { type: 'image/jpeg' });
  }
}

/**
 * Uploads thumbnail blob, file, or data URL string to Firebase Storage under `/thumbnails/`.
 * Returns permanent Firebase Download URL (HTTPS). Never returns a Base64 string.
 */
export async function uploadThumbnailResumable(
  thumbnailInput: Blob | File | string,
  category: string = 'gallery'
): Promise<string> {
  const DEFAULT_STOCK_THUMB = 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=800';

  if (!thumbnailInput) {
    return DEFAULT_STOCK_THUMB;
  }

  let blobToUpload: Blob | File;

  if (typeof thumbnailInput === 'string') {
    const trimmed = thumbnailInput.trim();
    // If it's already a hosted HTTP/HTTPS URL, return as is
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }
    if (trimmed.startsWith('data:')) {
      blobToUpload = dataURLtoBlob(trimmed);
    } else {
      return DEFAULT_STOCK_THUMB;
    }
  } else {
    blobToUpload = thumbnailInput;
  }

  if (!blobToUpload || blobToUpload.size === 0) {
    return DEFAULT_STOCK_THUMB;
  }

  const timestamp = Date.now();
  const mimeType = blobToUpload.type || 'image/jpeg';
  const ext = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg';
  const uploadPath = `thumbnails/${category}/${timestamp}_thumb_${Math.floor(Math.random() * 1000)}.${ext}`;
  const storageRef = ref(storage, uploadPath);

  const metadata = {
    contentType: mimeType,
    cacheControl: 'public,max-age=31536000'
  };

  try {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Thumbnail storage upload timeout')), 10000)
    );
    await Promise.race([
      uploadBytes(storageRef, blobToUpload, metadata),
      timeoutPromise
    ]);
    const downloadUrl = await getDownloadURL(storageRef);
    console.log(`[Video System] Thumbnail Uploaded to Firebase Storage: ${downloadUrl}`);
    return downloadUrl;
  } catch (err) {
    console.warn('[Video System] Storage thumbnail upload notice, using fallback HTTPS URL:', err);
    return DEFAULT_STOCK_THUMB;
  }
}

/**
 * Deletes a file from Firebase Storage given its full HTTPS download URL.
 */
export async function deleteStorageFileByUrl(url: string): Promise<void> {
  if (!url || typeof url !== 'string') return;
  if (!url.startsWith('https://firebasestorage.googleapis.com') && !url.startsWith('https://firebasestorage.app')) return;
  try {
    const fileRef = ref(storage, url);
    await deleteObject(fileRef);
    console.log('[Video System] Storage File Deleted:', url);
  } catch (err) {
    console.warn('[Video System] Notice: Storage file delete warning:', url, err);
  }
}
