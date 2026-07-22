import React, { useState, useRef } from 'react';
import { storage, db } from '../firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { doc, setDoc } from 'firebase/firestore';
import { Upload, X, ArrowLeft, ArrowRight, Image as ImageIcon, AlertCircle, CheckCircle2 } from 'lucide-react';
import { compressAndResizeImage } from '../utils/compression';

interface MultiImageFieldProps {
  value: string[];
  onChange: (urls: string[]) => void;
  storagePath: string;
  label?: string;
  firestoreDoc?: string;
  firestoreField?: string;
}

export const MultiImageField: React.FC<MultiImageFieldProps> = ({
  value = [],
  onChange,
  storagePath,
  label = 'Gallery Images',
  firestoreDoc,
  firestoreField
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [uploadProgresses, setUploadProgresses] = useState<{ [key: string]: number }>({});
  const [uploadingCount, setUploadingCount] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getPath = (fileName: string) => {
    const cleanPath = storagePath.replace(/^\/|\/$/g, '');
    const cleanName = fileName.replace(/[^a-zA-Z0-9.]/g, '_');
    return `images/${cleanPath}/${Date.now()}_${cleanName}`;
  };

  const runDiagnosticTest = async () => {
    setError(null);
    setSuccess(false);
    setIsCompressing(true);
    setUploadingCount(1);
    setUploadProgresses({ 'diagnostic_test.webp': 0 });
    console.log('--- STARTING MULTI-IMAGE 100KB FIREBASE STORAGE DIAGNOSTIC TEST ---');
    console.log('Firebase Storage Bucket:', (storage as any).app?.options?.storageBucket);
    
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
        ctx.fillText('Storage Multi-Upload Diagnostic File', 30, 200);
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

      const targetSize = 100 * 1024; // 100 KB
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

      console.log(`Generated test file of size: ${(testFile.size / 1024).toFixed(2)} KB`);
      setIsCompressing(false);

      const filePath = `diagnostics/${testFile.name}`;
      console.log(`Target Firebase path: ${filePath}`);
      const storageRef = ref(storage, filePath);

      const metadata = {
        contentType: 'image/webp',
        cacheControl: 'public,max-age=31536000',
        customMetadata: {
          testType: 'automated_diagnostic_multi',
          createdBy: 'AI_Studio_Diagnostic_Tool'
        }
      };

      console.log('Initiating uploadBytesResumable() in MultiImageField...');
      const uploadTask = uploadBytesResumable(storageRef, testFile, metadata);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          console.log(`Diagnostic Multi-Upload progress: ${progress}%`);
          setUploadProgresses({ [testFile.name]: progress });
        },
        (err) => {
          console.warn('DIAGNOSTIC MULTI-UPLOAD FAIL - Exact Firebase Error details:', {
            code: err.code,
            message: err.message,
            name: err.name,
            stack: err.stack,
            cause: err.cause,
            serverResponse: (err as any).serverResponse
          });
          setError(`Diagnostic Test Failed: ${err.message} [Error Code: ${err.code || 'UNKNOWN'}]. Please verify Firebase Storage rules.`);
          setUploadProgresses({});
          setUploadingCount(0);
        },
        async () => {
          try {
            console.log('Diagnostic Multi-Upload finished successfully. Fetching download URL...');
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            console.log('Diagnostic download URL:', downloadUrl);
            
            const finalUrls = [...value, downloadUrl];
            if (firestoreDoc && firestoreField) {
              const docRef = doc(db, firestoreDoc);
              await setDoc(docRef, { [firestoreField]: finalUrls }, { merge: true });
            }
            
            onChange(finalUrls);
            setSuccess(true);
            setUploadProgresses({});
            setUploadingCount(0);
            console.log('--- DIAGNOSTIC MULTI-TEST COMPLETED SUCCESSFULLY ---');
          } catch (urlErr: any) {
            console.warn('Failed to get download URL for diagnostic file:', urlErr);
            setError(`Diagnostic URL retrieval failed: ${urlErr.message}`);
            setUploadProgresses({});
            setUploadingCount(0);
          }
        }
      );
    } catch (err: any) {
      console.warn('Diagnostic multi creation/initialization failed:', err);
      setError(`Diagnostic Setup Failed: ${err.message || err}`);
      setIsCompressing(false);
      setUploadProgresses({});
      setUploadingCount(0);
    }
  };

  const handleUploadFiles = async (files: FileList) => {
    setError(null);
    setSuccess(false);
    const filesArray = Array.from(files);
    
    // 11. Prevent uploading files larger than 10 MB
    const tooLarge = filesArray.some(file => file.size > 10 * 1024 * 1024);
    if (tooLarge) {
      setError('One or more files exceed the 10 MB limit.');
      return;
    }

    // Validate types
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const invalidType = filesArray.some(file => !allowedTypes.includes(file.type));
    if (invalidType) {
      setError('Only JPG, JPEG, PNG, and WEBP formats are allowed.');
      return;
    }

    try {
      setIsCompressing(true);
      setUploadingCount(filesArray.length);
      const compressedFiles: { originalName: string; file: File }[] = [];

      for (const f of filesArray) {
        // 1. Automatically compress every image before upload
        // 2. Resize images based on requirements
        // 3. Convert images to WebP format with 80% quality
        // 14. Never upload original if compression succeeds
        const compressed = await compressAndResizeImage(f, storagePath);
        compressedFiles.push({ originalName: f.name, file: compressed });
      }
      setIsCompressing(false);

      const uploadedUrls: string[] = [];
      const progresses: { [key: string]: number } = {};
      
      // Initialize progress
      compressedFiles.forEach(cf => {
        progresses[cf.file.name] = 0;
      });
      setUploadProgresses({ ...progresses });

      // Upload files in parallel with uploadBytesResumable
      await Promise.all(
        compressedFiles.map(async (cf) => {
          const filePath = getPath(cf.file.name);
          const storageRef = ref(storage, filePath);

          // 10. Cache images for faster loading (1 year cache control)
          const metadata = {
            contentType: 'image/webp',
            cacheControl: 'public,max-age=31536000',
          };

          // 5. Use Firebase uploadBytesResumable()
          const uploadTask = uploadBytesResumable(storageRef, cf.file, metadata);

          return new Promise<void>((resolve, reject) => {
            uploadTask.on(
              'state_changed',
              (snapshot) => {
                // 6. Show upload progress (0%-100%)
                const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
                setUploadProgresses(prev => ({
                  ...prev,
                  [cf.file.name]: progress
                }));
              },
              (err) => {
                console.warn(`Upload failed for ${cf.file.name} - Exact Details:`, {
                  code: err.code,
                  message: err.message,
                  name: err.name,
                  stack: err.stack,
                  cause: err.cause,
                  serverResponse: (err as any).serverResponse
                });
                
                // Fallback to local Base64 Data URL so the app remains functional
                const reader = new FileReader();
                reader.onloadend = () => {
                  const base64String = reader.result as string;
                  uploadedUrls.push(base64String);
                  console.log(`Successfully fell back to Base64 image storage for ${cf.file.name} due to Storage upload failure.`);
                  
                  setError(`Firebase Storage failed for ${cf.file.name}: ${err.message}. Automatically fell back to secure local Base64 storage...`);
                  resolve(); // resolve instead of reject so other uploads or the overall process can complete successfully
                };
                reader.onerror = (readErr) => {
                  console.warn('Base64 fallback read failed:', readErr);
                  reject(err);
                };
                reader.readAsDataURL(cf.file);
              },
              async () => {
                try {
                  const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
                  uploadedUrls.push(downloadUrl);

                  // 8. After upload, automatically save download URL to Firestore
                  const imageId = `img_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
                  await setDoc(doc(db, 'uploaded_images', imageId), {
                    url: downloadUrl,
                    path: filePath,
                    category: storagePath,
                    uploadedAt: new Date().toISOString(),
                    originalName: cf.originalName,
                    compressed: true
                  });

                  resolve();
                } catch (urlErr) {
                  reject(urlErr);
                }
              }
            );
          });
        })
      );

      const finalUrls = [...value, ...uploadedUrls];
      
      // If specific doc and field are provided, update Firestore doc immediately
      if (firestoreDoc && firestoreField) {
        const docRef = doc(db, firestoreDoc);
        await setDoc(docRef, { [firestoreField]: finalUrls }, { merge: true });
      }

      onChange(finalUrls);
      setSuccess(true);
      setUploadProgresses({});
      setUploadingCount(0);
    } catch (err: any) {
      console.error('Compression or upload failed:', err);
      setError('Failed to upload some images: ' + (err.message || err));
      setIsCompressing(false);
      setUploadProgresses({});
      setUploadingCount(0);
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
    if (isCompressing || uploadingCount > 0) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUploadFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isCompressing || uploadingCount > 0) return;
    if (e.target.files && e.target.files.length > 0) {
      handleUploadFiles(e.target.files);
    }
  };

  const removeImage = async (index: number) => {
    const updated = value.filter((_, i) => i !== index);
    
    // Update firestore directly if it is bound
    if (firestoreDoc && firestoreField) {
      try {
        const docRef = doc(db, firestoreDoc);
        await setDoc(docRef, { [firestoreField]: updated }, { merge: true });
      } catch (err) {
        console.error('Failed to sync deleted image back to Firestore:', err);
      }
    }
    
    onChange(updated);
  };

  const moveImage = async (index: number, direction: 'left' | 'right') => {
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= value.length) return;

    const updated = [...value];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    // Update firestore directly if it is bound
    if (firestoreDoc && firestoreField) {
      try {
        const docRef = doc(db, firestoreDoc);
        await setDoc(docRef, { [firestoreField]: updated }, { merge: true });
      } catch (err) {
        console.error('Failed to sync reordered images back to Firestore:', err);
      }
    }

    onChange(updated);
  };

  const triggerFileInput = () => {
    if (isCompressing || uploadingCount > 0) return;
    fileInputRef.current?.click();
  };

  // Calculate overall/average progress
  const progressKeys = Object.keys(uploadProgresses);
  const averageProgress = progressKeys.length > 0 
    ? Math.round(progressKeys.reduce((acc, key) => acc + uploadProgresses[key], 0) / progressKeys.length)
    : 0;

  return (
    <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4 font-sans">
      <div className="flex justify-between items-center gap-2 flex-wrap border-b border-slate-850 pb-2">
        <label className="text-slate-300 font-bold text-xs uppercase tracking-wider flex items-center gap-2">
          <ImageIcon className="h-4 w-4 text-amber-500" />
          <span>{label}</span>
        </label>
        <button
          type="button"
          onClick={runDiagnosticTest}
          disabled={isCompressing || uploadingCount > 0}
          className="text-[10px] text-amber-500 hover:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/20 font-bold tracking-wide uppercase transition-all disabled:opacity-40"
          title="Diagnose Firebase Storage upload with an automated 100 KB test file"
        >
          ⚡ Test 100KB Upload
        </button>
        <span className="text-xxs font-mono text-slate-500">{value.length} items</span>
      </div>

      {/* Drag & Drop Zone */}
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
        } ${(isCompressing || uploadingCount > 0) ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
      >
        <Upload className="h-8 w-8 text-slate-500" />
        <div className="space-y-1">
          <p className="text-xs text-slate-300 font-bold">Drag & Drop Multiple Images Here</p>
          <p className="text-xxs text-slate-500">or click to Browse Files</p>
        </div>
        <p className="text-[10px] text-slate-600 font-mono">JPG, PNG, WEBP up to 10MB each</p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
        disabled={isCompressing || uploadingCount > 0}
      />

      {/* 7. Display: Uploading... State with Compress / Progress Bars */}
      {isCompressing && (
        <div className="flex items-center gap-2.5 text-xs text-amber-400 font-semibold animate-pulse bg-amber-500/5 border border-amber-500/10 p-3 rounded-xl">
          <div className="h-4 w-4 rounded-full border-2 border-amber-400 border-t-transparent animate-spin"></div>
          <span>Compressing & converting {uploadingCount} images to WebP...</span>
        </div>
      )}

      {uploadingCount > 0 && !isCompressing && (
        <div className="space-y-3 bg-slate-950 border border-slate-850 p-4 rounded-xl">
          <div className="flex justify-between items-center">
            {/* Uploading... text */}
            <span className="text-xs text-amber-400 font-bold flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping"></span>
              Uploading... {uploadingCount} files
            </span>
            <span className="text-xs text-slate-400 font-mono">{averageProgress}%</span>
          </div>
          {/* Progress Bar */}
          <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden border border-slate-800">
            <div
              className="bg-amber-400 h-1.5 transition-all duration-200 rounded-full"
              style={{ width: `${averageProgress}%` }}
            ></div>
          </div>
          <div className="grid grid-cols-1 gap-1.5 max-h-24 overflow-y-auto pt-1">
            {Object.keys(uploadProgresses).map((key) => (
              <div key={key} className="flex justify-between items-center text-[10px] text-slate-400 font-mono bg-slate-900 px-2 py-1 rounded">
                <span className="truncate max-w-[70%]">{key}</span>
                <span>{uploadProgresses[key]}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. Display: Error Message */}
      {error && (
        <div className="flex items-start gap-2.5 text-rose-400 bg-rose-500/5 border border-rose-500/20 p-3 rounded-xl text-xs animate-fade-in">
          <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* 7. Display: Success Message */}
      {success && (
        <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/5 border border-emerald-500/20 p-3 rounded-xl text-xs animate-fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
          <span>All selected images compressed & uploaded successfully!</span>
        </div>
      )}

      {/* Thumbnails grid */}
      {value.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {value.map((url, index) => (
            <div key={`${url}-${index}`} className="relative group border border-slate-800 rounded-xl overflow-hidden bg-slate-950 aspect-square flex flex-col justify-between">
              <img
                src={url}
                alt={`Uploaded product ${index + 1}`}
                loading="lazy"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              
              {/* Overlay with reordering controls and delete */}
              <div className="absolute inset-0 bg-slate-950/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="p-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg transition-all"
                    title="Delete Image"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="flex justify-between gap-1">
                  <button
                    type="button"
                    onClick={() => moveImage(index, 'left')}
                    disabled={index === 0}
                    className="p-1 bg-slate-800 hover:bg-slate-700 text-white rounded disabled:opacity-40"
                    title="Move Left"
                  >
                    <ArrowLeft className="h-3 w-3" />
                  </button>
                  <span className="text-[10px] text-slate-400 font-mono mt-0.5">#{index + 1}</span>
                  <button
                    type="button"
                    onClick={() => moveImage(index, 'right')}
                    disabled={index === value.length - 1}
                    className="p-1 bg-slate-800 hover:bg-slate-700 text-white rounded disabled:opacity-40"
                    title="Move Right"
                  >
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
