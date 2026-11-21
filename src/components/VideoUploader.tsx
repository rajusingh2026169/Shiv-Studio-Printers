import React, { useState, useRef, useEffect } from 'react';
import { auth } from '../firebase';
import { UploadTask } from 'firebase/storage';
import { STUDIO_IMAGES } from '../assets/studioAssets';
import { 
  Upload, 
  Film, 
  Pause, 
  Play, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Zap, 
  RefreshCw,
  Folder,
  Tag
} from 'lucide-react';
import { 
  validateVideoFile, 
  formatBytes, 
  formatDuration, 
  uploadVideoResumable,
  uploadThumbnailResumable,
  generateVideoThumbnailBlob,
  validateFirebaseStorageUrl,
  mapFirebaseStorageError,
  UploadProgressInfo
} from '../utils/videoUtils';
import { saveVideoMetadata, deleteVideo } from '../utils/videoService';
import { uploadBase64ToStorage } from '../utils/imageUploader';
import { VideoItem } from '../types';
import { VideoPlayer } from './VideoPlayer';
import { ThumbnailSelector } from './ThumbnailSelector';

interface VideoUploaderProps {
  category: 'products' | 'services' | 'gallery' | 'portfolio' | string;
  entityId?: string;
  editingVideo?: VideoItem | null;
  onUploadComplete?: (video: VideoItem) => void;
  onCancel?: () => void;
  className?: string;
}

export const VideoUploader: React.FC<VideoUploaderProps> = ({
  category = 'gallery',
  entityId = '',
  editingVideo = null,
  onUploadComplete,
  onCancel,
  className = ''
}) => {
  // Selected Files
  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null);
  const [selectedThumb, setSelectedThumb] = useState<Blob | File | string | null>(null);

  // Temporary Client Preview URLs
  const [tempPreviewVideoUrl, setTempPreviewVideoUrl] = useState<string>(editingVideo?.videoUrl || '');
  const [tempPreviewThumbUrl, setTempPreviewThumbUrl] = useState<string>(editingVideo?.thumbnailUrl || '');

  // Form Fields
  const [title, setTitle] = useState<string>(editingVideo?.title || '');
  const [description, setDescription] = useState<string>(editingVideo?.description || '');
  const [selectedCategory, setSelectedCategory] = useState<string>(editingVideo?.category || category || 'gallery');
  const [probedDuration, setProbedDuration] = useState<string>(editingVideo?.duration || '00:00');
  const [probedFileSize, setProbedFileSize] = useState<string>(editingVideo?.fileSize || '0 MB');

  // Upload States
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [progressPct, setProgressPct] = useState<number>(0);
  const [uploadSpeed, setUploadSpeed] = useState<string>('0 MB/s');
  const [remainingTime, setRemainingTime] = useState<string>('Calculating...');
  const [uploadStepStatus, setUploadStepStatus] = useState<string>('Ready');
  const [error, setError] = useState<string | null>(null);

  // Active Upload Task Ref
  const uploadTaskRef = useRef<UploadTask | null>(null);
  const videoPlayerRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (editingVideo) {
      setTempPreviewVideoUrl(editingVideo.videoUrl || '');
      setTempPreviewThumbUrl(editingVideo.thumbnailUrl || '');
      setTitle(editingVideo.title || '');
      setDescription(editingVideo.description || '');
      setSelectedCategory(editingVideo.category || category);
      setProbedDuration(editingVideo.duration || '00:00');
      setProbedFileSize(editingVideo.fileSize || '0 MB');
    }
  }, [editingVideo, category]);

  // Handle Video File Selection
  const handleVideoSelect = (file: File) => {
    setError(null);
    const validation = validateVideoFile(file);
    if (!validation.isValid) {
      setError(validation.error || 'Invalid video file.');
      return;
    }

    // Clean up previous blob URL if created
    if (tempPreviewVideoUrl && tempPreviewVideoUrl.startsWith('blob:')) {
      URL.revokeObjectURL(tempPreviewVideoUrl);
    }

    const blobUrl = URL.createObjectURL(file);
    setSelectedVideoFile(file);
    setTempPreviewVideoUrl(blobUrl);
    setProbedFileSize(formatBytes(file.size));

    if (!title.trim()) {
      const cleanName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      setTitle(cleanName.replace(/[-_]/g, ' '));
    }

    // Probe Duration from local video element
    const tempVid = document.createElement('video');
    tempVid.src = blobUrl;
    tempVid.onloadedmetadata = () => {
      if (tempVid.duration && !isNaN(tempVid.duration)) {
        setProbedDuration(formatDuration(tempVid.duration));
      }
    };

    // Auto-generate initial thumbnail blob for preview
    generateVideoThumbnailBlob(file, 1.0)
      .then((thumbBlob) => {
        const thumbBlobUrl = URL.createObjectURL(thumbBlob);
        setSelectedThumb(thumbBlob);
        setTempPreviewThumbUrl(thumbBlobUrl);
      })
      .catch((err) => {
        console.warn('Auto thumbnail generation warning:', err);
      });
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleVideoSelect(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleVideoSelect(e.dataTransfer.files[0]);
    }
  };

  // Pause / Resume / Cancel Upload Task
  const handlePauseUpload = () => {
    if (uploadTaskRef.current) {
      uploadTaskRef.current.pause();
      setIsPaused(true);
      setUploadStepStatus('Paused');
    }
  };

  const handleResumeUpload = () => {
    if (uploadTaskRef.current) {
      uploadTaskRef.current.resume();
      setIsPaused(false);
      setUploadStepStatus('Uploading Video...');
    }
  };

  const handleCancelUpload = () => {
    if (uploadTaskRef.current) {
      uploadTaskRef.current.cancel();
    }
    setIsUploading(false);
    setIsPaused(false);
    setProgressPct(0);
    setUploadStepStatus('Canceled');
    setError('Upload was canceled.');
  };

  // Main Upload & Save Workflow
  const handleStartSave = async () => {
    setError(null);

    if (!selectedVideoFile && !editingVideo?.videoUrl) {
      setError('Please select an MP4, MOV, or WEBM video file.');
      return;
    }

    if (!title.trim()) {
      setError('Please enter a video title.');
      return;
    }

    setIsUploading(true);
    setIsPaused(false);
    setProgressPct(0);

    let finalVideoStorageUrl = editingVideo?.videoUrl || '';
    let finalThumbnailStorageUrl = editingVideo?.thumbnailUrl || '';

    try {
      // -------------------------------------------------------------
      // STEP 1: Upload Video File to Firebase Storage (if new file selected)
      // -------------------------------------------------------------
      if (selectedVideoFile) {
        setUploadStepStatus('Uploading Video to Firebase Storage...');

        const { task, promise } = uploadVideoResumable(
          selectedVideoFile,
          selectedCategory,
          (progressInfo: UploadProgressInfo) => {
            setProgressPct(progressInfo.progress);
            setUploadSpeed(progressInfo.speed);
            setRemainingTime(progressInfo.remainingTime);
          }
        );

        uploadTaskRef.current = task;
        finalVideoStorageUrl = await promise;
        console.log(`[Video System] Video Download URL Generated: ${finalVideoStorageUrl}`);
      }

      // Strict validation: Reject blob or data URL
      validateFirebaseStorageUrl(finalVideoStorageUrl, 'videoUrl');

      // -------------------------------------------------------------
      // STEP 2: Upload Thumbnail File/Blob/DataURL to Firebase Storage
      // -------------------------------------------------------------
      setUploadStepStatus('Uploading Thumbnail to Firebase Storage...');

      if (selectedThumb instanceof Blob || selectedThumb instanceof File) {
        finalThumbnailStorageUrl = await uploadThumbnailResumable(selectedThumb, selectedCategory);
      } else if (typeof selectedThumb === 'string' && selectedThumb.trim()) {
        const trimmedThumb = selectedThumb.trim();
        if (trimmedThumb.startsWith('data:')) {
          // Upload Base64 Data URL to Firebase Storage to get a clean HTTPS download URL
          finalThumbnailStorageUrl = await uploadThumbnailResumable(trimmedThumb, selectedCategory);
        } else if (trimmedThumb.startsWith('http://') || trimmedThumb.startsWith('https://')) {
          finalThumbnailStorageUrl = trimmedThumb;
        } else {
          finalThumbnailStorageUrl = await uploadThumbnailResumable(trimmedThumb, selectedCategory);
        }
      } else if (!finalThumbnailStorageUrl || finalThumbnailStorageUrl.startsWith('data:')) {
        // Generate auto frame blob as fallback
        if (selectedVideoFile) {
          try {
            const autoBlob = await generateVideoThumbnailBlob(selectedVideoFile, 1.0);
            finalThumbnailStorageUrl = await uploadThumbnailResumable(autoBlob, selectedCategory);
          } catch (e) {
            console.warn('Auto thumbnail generation notice:', e);
            finalThumbnailStorageUrl = STUDIO_IMAGES.cinematicDrone;
          }
        } else if (tempPreviewVideoUrl) {
          try {
            const autoBlob = await generateVideoThumbnailBlob(tempPreviewVideoUrl, 1.0);
            finalThumbnailStorageUrl = await uploadThumbnailResumable(autoBlob, selectedCategory);
          } catch (e) {
            finalThumbnailStorageUrl = STUDIO_IMAGES.cinematicDrone;
          }
        } else {
          finalThumbnailStorageUrl = STUDIO_IMAGES.cinematicDrone;
        }
      }

      // Safeguard: Ensure finalThumbnailStorageUrl is NEVER a Base64 string before saving to Firestore
      if (finalThumbnailStorageUrl.startsWith('data:') || finalThumbnailStorageUrl.length > 2000) {
        console.warn('[Video System] Base64 thumbnail detected before save, uploading to Storage...');
        finalThumbnailStorageUrl = await uploadThumbnailResumable(finalThumbnailStorageUrl, selectedCategory);
      }

      // Final strict check
      if (finalThumbnailStorageUrl.startsWith('data:') || finalThumbnailStorageUrl.length > 2000) {
        finalThumbnailStorageUrl = STUDIO_IMAGES.cinematicDrone;
      }

      // -------------------------------------------------------------
      // STEP 3: Save Firestore Document
      // -------------------------------------------------------------
      setUploadStepStatus('Saving Video Metadata to Firestore...');

      const currentUserEmail = auth.currentUser?.email || auth.currentUser?.uid || 'admin';

      const savedVideo = await saveVideoMetadata({
        id: editingVideo?.id,
        title: title.trim(),
        description: description.trim(),
        category: selectedCategory,
        videoUrl: finalVideoStorageUrl,
        thumbnailUrl: finalThumbnailStorageUrl,
        duration: probedDuration,
        fileSize: probedFileSize,
        uploadedBy: currentUserEmail,
        status: 'active',
        entityId: entityId || editingVideo?.entityId || ''
      });

      console.log(`[Video System] Firestore Saved: ${savedVideo.id}`);

      // -------------------------------------------------------------
      // STEP 4: Cleanup Client Temporary Preview
      // -------------------------------------------------------------
      if (tempPreviewVideoUrl && tempPreviewVideoUrl.startsWith('blob:')) {
        URL.revokeObjectURL(tempPreviewVideoUrl);
      }
      if (tempPreviewThumbUrl && tempPreviewThumbUrl.startsWith('blob:')) {
        URL.revokeObjectURL(tempPreviewThumbUrl);
      }

      setTempPreviewVideoUrl(finalVideoStorageUrl);
      setTempPreviewThumbUrl(finalThumbnailStorageUrl);

      setUploadStepStatus('Upload & Save Completed!');
      setIsUploading(false);

      if (onUploadComplete) {
        onUploadComplete(savedVideo);
      }
    } catch (err: any) {
      const exactMsg = err?.message || mapFirebaseStorageError(err);
      console.warn('[Video System] Upload / Save Error:', exactMsg);
      setError(exactMsg);
      setIsUploading(false);
      setIsPaused(false);
    } finally {
      uploadTaskRef.current = null;
    }
  };

  return (
    <div className={`bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Film className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white">
              {editingVideo ? 'Replace / Edit Video' : 'Upload Production Video'}
            </h2>
            <p className="text-xs text-slate-400">
              Upload MP4, MOV, or WEBM up to 200 MB to Firebase Storage
            </p>
          </div>
        </div>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isUploading}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Error Alert Box */}
      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl space-y-2">
          <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>Upload Failure</span>
          </div>
          <p className="text-xs text-rose-300 pl-7">{error}</p>
          <div className="pl-7 pt-1">
            <button
              type="button"
              onClick={handleStartSave}
              className="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold rounded-lg shadow transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Upload</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Video Dropzone & Preview */}
        <div className="space-y-4">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
            1. Select Video File
          </label>

          {!tempPreviewVideoUrl ? (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="border-2 border-dashed border-slate-700 hover:border-amber-400/60 bg-slate-950/60 rounded-2xl p-8 text-center space-y-4 transition-all cursor-pointer group"
              onClick={() => document.getElementById('video-file-input')?.click()}
            >
              <input
                id="video-file-input"
                type="file"
                accept="video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm"
                className="hidden"
                onChange={handleFileInputChange}
              />
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                <Upload className="w-7 h-7 text-amber-400" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-white">Click or drag & drop video file</p>
                <p className="text-xs text-slate-400">Supported: MP4, MOV, WEBM (Max 200 MB)</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="relative">
                <VideoPlayer
                  src={tempPreviewVideoUrl}
                  poster={tempPreviewThumbUrl}
                  title={title}
                  description={description}
                  videoRefOut={videoPlayerRef}
                />
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => {
                    if (tempPreviewVideoUrl.startsWith('blob:')) {
                      URL.revokeObjectURL(tempPreviewVideoUrl);
                    }
                    setSelectedVideoFile(null);
                    setTempPreviewVideoUrl('');
                  }}
                  className="absolute top-3 left-3 px-3 py-1.5 bg-slate-900/90 hover:bg-slate-800 text-slate-200 text-xs font-medium rounded-xl border border-slate-700 shadow-xl transition-colors flex items-center gap-1.5 disabled:opacity-50 z-20"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                  <span>Change Video</span>
                </button>
              </div>

              {selectedVideoFile && (
                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                  <span className="font-mono text-slate-300 truncate max-w-[200px]">{selectedVideoFile.name}</span>
                  <div className="flex items-center gap-3 text-slate-400">
                    <span>{probedFileSize}</span>
                    <span className="text-amber-400 font-semibold">{probedDuration}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Thumbnail Selector */}
          <ThumbnailSelector
            videoFileOrSource={selectedVideoFile || tempPreviewVideoUrl}
            videoElementRef={videoPlayerRef}
            currentThumbnailUrl={tempPreviewThumbUrl}
            disabled={isUploading}
            onThumbnailSelected={(thumb, preview) => {
              setSelectedThumb(thumb);
              setTempPreviewThumbUrl(preview);
            }}
          />
        </div>

        {/* Right Column: Metadata Fields & Upload Controls */}
        <div className="space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
              2. Video Information
            </label>

            {/* Title */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Video Title <span className="text-amber-400">*</span>
              </label>
              <input
                type="text"
                value={title}
                disabled={isUploading}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Grand Wedding Highlights 2026"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400/60 transition-colors disabled:opacity-50"
              />
            </div>

            {/* Category */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Category
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'gallery', label: 'Gallery' },
                  { id: 'products', label: 'Products' },
                  { id: 'services', label: 'Services' },
                  { id: 'portfolio', label: 'Portfolio' }
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    disabled={isUploading}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`py-2 px-3 rounded-xl text-xs font-medium border transition-colors ${
                      selectedCategory === cat.id
                        ? 'bg-amber-500/10 border-amber-500/40 text-amber-400 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Description (Optional)
              </label>
              <textarea
                rows={3}
                value={description}
                disabled={isUploading}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add details about this video asset..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400/60 transition-colors disabled:opacity-50 resize-none"
              />
            </div>
          </div>

          {/* Upload Progress Box */}
          {isUploading && (
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                <span className="flex items-center gap-2 text-amber-400">
                  <Zap className="w-4 h-4 animate-pulse" />
                  {uploadStepStatus}
                </span>
                <span className="font-mono text-amber-400 font-bold">{progressPct}%</span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-300 transition-all duration-300 rounded-full"
                  style={{ width: `${progressPct}%` }}
                />
              </div>

              {/* Speed & ETA */}
              <div className="flex items-center justify-between text-xxs text-slate-400 font-mono">
                <span>Speed: <strong className="text-slate-200">{uploadSpeed}</strong></span>
                <span>ETA: <strong className="text-slate-200">{remainingTime}</strong></span>
              </div>

              {/* Upload Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-900">
                {!isPaused ? (
                  <button
                    type="button"
                    onClick={handlePauseUpload}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition-colors flex items-center gap-1.5"
                  >
                    <Pause className="w-3.5 h-3.5" />
                    <span>Pause</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleResumeUpload}
                    className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 text-xs font-medium rounded-lg border border-amber-500/30 transition-colors flex items-center gap-1.5"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Resume</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleCancelUpload}
                  className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-medium rounded-lg border border-rose-500/20 transition-colors flex items-center gap-1.5"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Cancel</span>
                </button>
              </div>
            </div>
          )}

          {/* Action Footer */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            {onCancel && (
              <button
                type="button"
                disabled={isUploading}
                onClick={onCancel}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            )}

            <button
              type="button"
              disabled={isUploading || (!selectedVideoFile && !editingVideo?.videoUrl)}
              onClick={handleStartSave}
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {isUploading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Uploading to Firebase...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{editingVideo ? 'Save Changes' : 'Upload & Save Video'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
