import React, { useState, useRef, useEffect } from 'react';
import { storage, db, auth } from '../firebase';
import firebaseConfig from '../../firebase-applet-config.json';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { doc, setDoc } from 'firebase/firestore';
import { Upload, Link2, CheckCircle2, AlertCircle, X, Image as ImageIcon, RefreshCw } from 'lucide-react';
import { compressAndResizeImage } from '../utils/compression';
import { isEphemeralMediaUrl, resolveMediaUrl, applyImageFallback } from '../utils/mediaResolver';
import {
  checkFirebaseStorageBucket,
  checkExpressUploadServer,
  uploadFileViaExpressApi
} from '../utils/storageAvailability';

interface ImageFieldProps {
  value: string;
  onChange: (url: string) => void;
  storagePath: string; // e.g. 'services', 'products', 'banners'
  label?: string;
  recommendedSize?: string;
  firestoreDoc?: string;
  firestoreField?: string;
}

export const ImageField: React.FC<ImageFieldProps> = ({
  value,
  onChange,
  storagePath,
  label = 'Image',
  recommendedSize,
  firestoreDoc,
  firestoreField
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'url'>('upload');
  const [dragActive, setDragActive] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [urlInput, setUrlInput] = useState(value);
  const [selectedFileForRetry, setSelectedFileForRetry] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setUrlInput(value);
  }, [value]);

  const getPath = (fileName: string) => {
    const cleanPath = storagePath.replace(/^\/|\/$/g, '');
    const cleanName = fileName.replace(/[^a-zA-Z0-9.]/g, '_');
    return `images/${cleanPath}/${Date.now()}_${cleanName}`;
  };

  const runDiagnosticTest = async () => {
    setError(null);
    setSuccess(false);
    setIsCompressing(true);
    setUploadProgress(0);
    console.log('Upload Started');
    console.log('Firebase Storage Bucket:', (storage as any).app?.options?.storageBucket || (firebaseConfig as any).storageBucket);
    console.log('Firebase Auth User ID:', auth.currentUser?.uid || 'anonymous/unauthenticated');
    
    try {
      // Create a 100 KB dummy image using canvas
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 400;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#0f172a'; // slate-900
        ctx.fillRect(0, 0, 400, 400);
        ctx.strokeStyle = '#334155'; // slate-700
        ctx.lineWidth = 1;
        for (let i = 0; i < 400; i += 20) {
          ctx.beginPath();
          ctx.moveTo(i, 0);
          ctx.lineTo(i, 400);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(0, i);
          ctx.lineTo(400, i);
          ctx.stroke();
        }
        ctx.fillStyle = '#f59e0b'; // amber-500
        ctx.font = 'bold 20px sans-serif';
        ctx.fillText('SHIV STUDIO & PRINTERS', 30, 150);
        ctx.fillStyle = '#10b981'; // emerald-500
        ctx.font = '12px sans-serif';
        ctx.fillText('Storage Upload Diagnostic Test File', 30, 200);
        ctx.fillStyle = '#64748b'; // slate-500
        ctx.fillText(`Timestamp: ${new Date().toISOString()}`, 30, 240);
        ctx.fillText('File size: ~100 KB', 30, 260);
      }

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((b) => resolve(b), 'image/webp', 0.85);
      });

      if (!blob) {
        throw new Error('Failed to generate test image canvas blob.');
      }

      // Pad the blob to ensure it is around 100 KB
      const targetSize = 100 * 1024;
      let finalBlob = blob;
      if (blob.size < targetSize) {
        const paddingSize = targetSize - blob.size;
        const paddingArray = new Uint8Array(paddingSize);
        for (let i = 0; i < paddingSize; i++) {
          paddingArray[i] = Math.floor(Math.random() * 256);
        }
        finalBlob = new Blob([blob, paddingArray], { type: 'image/webp' });
      }

      const testFile = new File([finalBlob], `diagnostic_test_${Date.now()}.webp`, {
        type: 'image/webp',
        lastModified: Date.now(),
      });

      console.log(`Diagnostic file generated: ${(testFile.size / 1024).toFixed(2)} KB`);

      const filePath = `diagnostics/${testFile.name}`;
      const bucketStatus = await checkFirebaseStorageBucket();
      let downloadUrl = '';

      if (bucketStatus.available) {
        const storageRef = ref(storage, filePath);

        const metadata = {
          contentType: 'image/webp',
          cacheControl: 'public,max-age=31536000',
          customMetadata: {
            testType: 'automated_diagnostic',
            createdBy: 'AI_Studio_Diagnostic_Tool'
          }
        };

        const uploadTask = uploadBytesResumable(storageRef, testFile, metadata);
        uploadTask.on('state_changed', (snapshot) => {
          const progress = snapshot.totalBytes > 0
            ? Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)
            : 0;
          setUploadProgress(progress);
        });

        const snapshot = await uploadTask;
        downloadUrl = await getDownloadURL(snapshot.ref);
      } else if (await checkExpressUploadServer()) {
        setIsCompressing(false);
        setUploadProgress(35);
        downloadUrl = await uploadFileViaExpressApi(testFile, testFile.name, (pct) => {
          setUploadProgress(pct);
        });
      } else {
        throw new Error(bucketStatus.reason || 'Firebase Storage bucket is not available.');
      }

      if (downloadUrl) {
        if (downloadUrl.startsWith('https://')) {
          try {
            const imageId = `img_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
            await setDoc(doc(db, 'uploaded_images', imageId), {
              url: downloadUrl,
              path: filePath,
              category: 'diagnostics',
              uploadedAt: new Date().toISOString()
            });
          } catch (dbErr) {
            console.warn('Could not record diagnostic uploaded_images doc:', dbErr);
          }
        }

        onChange(downloadUrl);
        setSuccess(true);
        setError(null);
      }
    } catch (err: any) {
      console.warn('Diagnostic upload notice:', err);
      setError(`Diagnostic Failed: ${err.message || err}`);
    } finally {
      setUploadProgress(null);
      setIsCompressing(false);
    }
  };

  const mapStorageUploadError = (err: any): string => {
    const code = err?.code || '';
    const msg = err?.message || String(err || '');
    if (code === 'storage/unauthorized' || msg.includes('unauthorized')) {
      return 'Firebase Storage permission denied. Please ensure you are signed in with Admin/Staff access and Storage rules are published.';
    }
    if (code === 'storage/retry-limit-exceeded') {
      return 'Upload timed out due to network or Firebase Storage CORS settings. Click Retry Upload or paste an https:// image URL.';
    }
    if (code === 'storage/canceled') {
      return 'Upload was canceled.';
    }
    return `Cloud upload failed: ${msg}`;
  };

  const handleFile = async (file: File) => {
    setError(null);
    setSuccess(false);
    setSelectedFileForRetry(file);

    if (!auth.currentUser) {
      setError('Please sign in first before uploading images to permanent Firebase Storage.');
      return;
    }

    // Limit check (15 MB max)
    if (file.size > 15 * 1024 * 1024) {
      setError('File is too large. Maximum size allowed is 15 MB.');
      setIsCompressing(false);
      setUploadProgress(null);
      return;
    }

    try {
      setIsCompressing(true);
      setError(null);

      // 1. Compress & resize image cleanly to WebP
      const compressedFile = await compressAndResizeImage(file, storagePath);

      setIsCompressing(false);
      setUploadProgress(5);

      const filePath = getPath(compressedFile.name);
      const bucketStatus = await checkFirebaseStorageBucket();
      let downloadUrl = '';
      let cloudError: any = null;

      if (bucketStatus.available) {
        try {
          const storageRef = ref(storage, filePath);

          const metadata = {
            contentType: compressedFile.type || 'image/webp',
            cacheControl: 'public,max-age=31536000',
            customMetadata: {
              uploadedBy: auth.currentUser.uid,
              category: storagePath
            }
          };

          const uploadTask = uploadBytesResumable(storageRef, compressedFile, metadata);

          uploadTask.on('state_changed', (snapshot) => {
            const progress = snapshot.totalBytes > 0
              ? Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)
              : 5;
            setUploadProgress(progress);
          });

          const timeoutPromise = new Promise<never>((_, rej) =>
            setTimeout(() => {
              try {
                uploadTask.cancel();
              } catch {
                // ignore
              }
              rej(new Error('Firebase Storage upload timed out after 45 seconds.'));
            }, 45000)
          );

          const snapshot = await Promise.race([uploadTask, timeoutPromise]);
          downloadUrl = await getDownloadURL(snapshot.ref);
        } catch (storageErr: any) {
          cloudError = storageErr;
          console.warn('Firebase Storage image upload notice:', storageErr?.message || storageErr);
        }
      } else {
        cloudError = new Error(bucketStatus.reason || 'Firebase Storage bucket not initialized.');
      }

      // Fall back cleanly to Express /api/upload when running on localhost or Cloud Run preview server
      if (!downloadUrl && (await checkExpressUploadServer())) {
        downloadUrl = await uploadFileViaExpressApi(compressedFile, compressedFile.name, (pct) => {
          setUploadProgress(pct);
        });
      }

      if (!downloadUrl) {
        throw cloudError || new Error('Firebase Storage did not return a download URL.');
      }

      if (!downloadUrl.startsWith('https://') && !downloadUrl.startsWith('/uploads/')) {
        throw new Error('Upload did not return a valid image URL.');
      }

      if (downloadUrl.length > 2048) {
        throw new Error('Generated download URL exceeds Firestore 2048-character limit.');
      }

      setUploadProgress(100);

      // Log metadata record in Firestore (when using cloud HTTPS)
      if (downloadUrl.startsWith('https://')) {
        try {
          const imageId = `img_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
          await setDoc(doc(db, 'uploaded_images', imageId), {
            url: downloadUrl,
            path: filePath,
            category: storagePath,
            uploadedAt: new Date().toISOString(),
            originalName: file.name,
            compressed: true
          });
        } catch (dbErr) {
          console.warn('Could not record uploaded_images doc:', dbErr);
        }
      }

      // Sync doc if explicitly bound
      if (firestoreDoc && firestoreField) {
        const docRef = doc(db, firestoreDoc);
        await setDoc(docRef, { [firestoreField]: downloadUrl }, { merge: true });

        if (firestoreDoc === 'website_settings/studio') {
          await setDoc(doc(db, 'settings', 'studio'), { [firestoreField]: downloadUrl }, { merge: true });
        }
      }

      onChange(downloadUrl);
      setSuccess(true);
      setError(null);
    } catch (err: any) {
      console.warn('Image upload notice:', err?.message || err);
      setError(mapStorageUploadError(err));
    } finally {
      setTimeout(() => {
        setUploadProgress(null);
        setIsCompressing(false);
      }, 300);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (isCompressing || uploadProgress !== null) return;
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isCompressing || uploadProgress !== null) return;
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const triggerFileInput = () => {
    if (isCompressing || uploadProgress !== null) return;
    fileInputRef.current?.click();
  };

  const handleRemove = () => {
    onChange('');
    setSuccess(false);
    setError(null);
    setUrlInput('');
    setSelectedFileForRetry(null);
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = urlInput.trim();
    if (!trimmed) {
      setError('Please enter a valid HTTPS image URL.');
      return;
    }
    if (trimmed.startsWith('blob:') || trimmed.startsWith('file:')) {
      setError('Temporary blob/file URLs cannot be saved. Upload the image file or paste an https:// URL.');
      return;
    }
    if (trimmed.startsWith('data:') || trimmed.length > 2048) {
      setError('Base64 data URLs or URLs over 2048 characters are not allowed in Firestore. Please upload the image file instead.');
      return;
    }
    setError(null);
    onChange(trimmed);
    setSuccess(true);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3 font-sans">
      <div className="flex justify-between items-center gap-2 flex-wrap">
        <label className="text-slate-300 font-bold text-xs uppercase tracking-wider flex items-center gap-2">
          <ImageIcon className="h-4 w-4 text-amber-500" />
          <span>{label}</span>
        </label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={runDiagnosticTest}
            disabled={isCompressing || uploadProgress !== null}
            className="text-[10px] text-amber-500 hover:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/20 font-bold tracking-wide uppercase transition-all disabled:opacity-40"
            title="Diagnose Firebase Storage upload with an automated 100 KB test file"
          >
            ⚡ Test 100KB Upload
          </button>
          {recommendedSize && (
            <span className="text-xxs text-slate-500 font-mono">Rec: {recommendedSize}</span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-850">
        <button
          type="button"
          onClick={() => setActiveTab('upload')}
          disabled={isCompressing || uploadProgress !== null}
          className={`py-2 text-xxs font-extrabold uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'upload'
              ? 'bg-amber-400 text-slate-950'
              : 'text-slate-400 hover:text-white hover:bg-slate-900/40 disabled:opacity-50'
          }`}
        >
          <Upload className="h-3.5 w-3.5" />
          <span>📤 Upload Image</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('url')}
          disabled={isCompressing || uploadProgress !== null}
          className={`py-2 text-xxs font-extrabold uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'url'
              ? 'bg-amber-400 text-slate-950'
              : 'text-slate-400 hover:text-white hover:bg-slate-900/40 disabled:opacity-50'
          }`}
        >
          <Link2 className="h-3.5 w-3.5" />
          <span>🌐 Image URL</span>
        </button>
      </div>

      {/* Body */}
      {activeTab === 'upload' ? (
        <div className="space-y-3">
          {value ? (
            <div className="relative group border border-slate-800 rounded-xl overflow-hidden bg-slate-950 aspect-video flex items-center justify-center">
              <img
                src={resolveMediaUrl(value)}
                alt="Preview"
                loading="lazy"
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
                onError={(e) => applyImageFallback(e)}
              />
              <div className="absolute inset-0 bg-slate-950/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={triggerFileInput}
                  disabled={isCompressing || uploadProgress !== null}
                  className="px-3 py-1.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-extrabold text-xxs uppercase tracking-wider rounded-lg transition-all disabled:opacity-50"
                >
                  Replace Image
                </button>
                <button
                  type="button"
                  onClick={handleRemove}
                  disabled={isCompressing || uploadProgress !== null}
                  className="p-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg transition-all disabled:opacity-50"
                  title="Remove Image"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={triggerFileInput}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
                dragActive
                  ? 'border-amber-400 bg-amber-500/5'
                  : 'border-slate-800 hover:border-slate-700 bg-slate-950 hover:bg-slate-950/60'
              } ${(isCompressing || uploadProgress !== null) ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
            >
              <Upload className="h-8 w-8 text-slate-500 group-hover:text-amber-400" />
              <div className="space-y-1">
                <p className="text-xs text-slate-300 font-bold">Drag & Drop Image Here</p>
                <p className="text-xxs text-slate-500">or click to Browse Files</p>
              </div>
              <p className="text-[10px] text-slate-600 font-mono">JPG, PNG, WEBP up to 15MB</p>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
            disabled={isCompressing || uploadProgress !== null}
          />

          {/* Uploading / Compressing state */}
          {isCompressing && (
            <div className="flex items-center gap-2 text-xxs text-amber-400 font-mono bg-amber-500/5 p-2 rounded-xl border border-amber-500/10">
              <div className="h-3 w-3 rounded-full border-2 border-amber-400 border-t-transparent animate-spin"></div>
              <span>Compressing image & converting to WebP...</span>
            </div>
          )}

          {uploadProgress !== null && (
            <div className="space-y-1.5 bg-slate-950/40 p-2.5 rounded-xl border border-slate-850">
              <div className="flex justify-between text-xxs font-mono">
                <span className="text-amber-400 font-bold flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping"></span>
                  Uploading to Firebase Storage...
                </span>
                <span className="text-slate-400">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden border border-slate-800">
                <div
                  className="bg-amber-400 h-1.5 transition-all duration-150 rounded-full shadow-[0_0_8px_rgba(251,191,36,0.5)]"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleUrlSubmit} className="space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Paste absolute external image URL..."
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500"
            />
            <button
              type="submit"
              className="px-4 bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xxs uppercase tracking-wider rounded-xl transition-all border border-slate-700"
            >
              Apply
            </button>
          </div>
          {value && (
            <div className="relative group border border-slate-800 rounded-xl overflow-hidden bg-slate-950 aspect-video flex items-center justify-center">
              <img
                src={resolveMediaUrl(value)}
                alt="Preview"
                loading="lazy"
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
                onError={(e) => applyImageFallback(e)}
              />
              <button
                type="button"
                onClick={handleRemove}
                className="absolute top-2 right-2 p-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg transition-all"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </form>
      )}

      {value && isEphemeralMediaUrl(value) && (
        <div className="flex items-start gap-2 text-amber-300 bg-amber-500/10 border border-amber-500/30 p-2.5 rounded-xl text-xxs">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-400" />
          <span>
            This record uses a temporary/local image path that will not load reliably on live production. Please upload a new image file to store it permanently in Firebase Storage.
          </span>
        </div>
      )}

      {/* Error Message & Retry Upload Option */}
      {error && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-rose-400 bg-rose-500/10 border border-rose-500/30 p-3 rounded-xl text-xxs">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span className="leading-normal font-medium">{error}</span>
          </div>

          {selectedFileForRetry && (
            <button
              type="button"
              onClick={() => handleFile(selectedFileForRetry)}
              className="shrink-0 px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-200 font-bold text-xxs rounded-lg uppercase tracking-wider flex items-center gap-1.5 transition-all"
            >
              <RefreshCw className="h-3 w-3" />
              <span>Retry Upload</span>
            </button>
          )}
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/5 border border-emerald-500/20 p-2.5 rounded-xl text-xxs animate-fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
          <span>Image compressed & uploaded to Firebase Storage successfully!</span>
        </div>
      )}
    </div>
  );
};
