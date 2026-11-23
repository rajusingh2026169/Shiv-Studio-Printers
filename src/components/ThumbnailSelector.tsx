import React, { useState, useRef } from 'react';
import { Image as ImageIcon, Upload, Sparkles, Camera, CheckCircle2, AlertCircle } from 'lucide-react';
import { 
  validateThumbnailFile, 
  generateVideoThumbnailBlob, 
  captureFrameFromVideoElement,
  formatBytes 
} from '../utils/videoUtils';
import { StudioImage } from './StudioMedia';

interface ThumbnailSelectorProps {
  videoFileOrSource: File | string | null;
  videoElementRef?: React.RefObject<HTMLVideoElement | null>;
  currentThumbnailUrl?: string;
  onThumbnailSelected: (thumb: Blob | File | string, previewUrl: string) => void;
  disabled?: boolean;
}

export const ThumbnailSelector: React.FC<ThumbnailSelectorProps> = ({
  videoFileOrSource,
  videoElementRef,
  currentThumbnailUrl = '',
  onThumbnailSelected,
  disabled = false
}) => {
  const [selectedMode, setSelectedMode] = useState<'custom' | 'auto' | 'capture' | 'existing'>(
    currentThumbnailUrl ? 'existing' : 'auto'
  );
  const [previewUrl, setPreviewUrl] = useState<string>(currentThumbnailUrl || '');
  const [thumbInfo, setThumbInfo] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Handle Custom Thumbnail File Upload
  const handleCustomFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];

    const validation = validateThumbnailFile(file);
    if (!validation.isValid) {
      setError(validation.error || 'Invalid thumbnail file.');
      return;
    }

    const blobUrl = URL.createObjectURL(file);
    setPreviewUrl(blobUrl);
    setSelectedMode('custom');
    setThumbInfo(`Custom File (${formatBytes(file.size)})`);
    onThumbnailSelected(file, blobUrl);
  };

  // 2. Handle Auto-Generate Frame from Video
  const handleAutoGenerate = async () => {
    if (!videoFileOrSource) {
      setError('Please select a video file first to auto-generate a thumbnail frame.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const blob = await generateVideoThumbnailBlob(videoFileOrSource, 1.0);
      const blobUrl = URL.createObjectURL(blob);
      setPreviewUrl(blobUrl);
      setSelectedMode('auto');
      setThumbInfo(`Auto-captured Frame (${formatBytes(blob.size)})`);
      onThumbnailSelected(blob, blobUrl);
    } catch (err: any) {
      console.error('Auto frame capture failed:', err);
      setError('Could not auto-capture frame from video. Try custom upload.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Handle Live Frame Capture from Video Player
  const handleCaptureLiveFrame = async () => {
    if (!videoElementRef || !videoElementRef.current) {
      setError('Video player element is not active for live frame capture.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const blob = await captureFrameFromVideoElement(videoElementRef.current);
      const blobUrl = URL.createObjectURL(blob);
      setPreviewUrl(blobUrl);
      setSelectedMode('capture');
      const time = videoElementRef.current.currentTime.toFixed(1);
      setThumbInfo(`Captured at ${time}s (${formatBytes(blob.size)})`);
      onThumbnailSelected(blob, blobUrl);
    } catch (err: any) {
      console.error('Live frame capture error:', err);
      setError('Failed to capture frame from video player.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-amber-400" />
          Video Thumbnail Selection
        </label>
        {selectedMode && (
          <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
            {selectedMode === 'custom' && '✓ Custom Upload'}
            {selectedMode === 'auto' && '✓ Auto Generated'}
            {selectedMode === 'capture' && '✓ Player Frame Capture'}
            {selectedMode === 'existing' && '✓ Saved Thumbnail'}
          </span>
        )}
      </div>

      {error && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Mode Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <button
          type="button"
          disabled={disabled || loading}
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center justify-center gap-2 px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl border border-slate-700 transition-colors disabled:opacity-50"
        >
          <Upload className="w-3.5 h-3.5 text-amber-400" />
          <span>Upload Custom</span>
        </button>
        <input
          type="file"
          ref={fileInputRef}
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleCustomFileChange}
        />

        <button
          type="button"
          disabled={disabled || loading || !videoFileOrSource}
          onClick={handleAutoGenerate}
          className="flex items-center justify-center gap-2 px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl border border-slate-700 transition-colors disabled:opacity-50"
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Auto Generate</span>
        </button>

        {videoElementRef && (
          <button
            type="button"
            disabled={disabled || loading}
            onClick={handleCaptureLiveFrame}
            className="flex items-center justify-center gap-2 px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl border border-slate-700 transition-colors disabled:opacity-50"
          >
            <Camera className="w-3.5 h-3.5 text-emerald-400" />
            <span>Capture Frame</span>
          </button>
        )}
      </div>

      {/* Preview Box */}
      {previewUrl ? (
        <div className="relative aspect-video rounded-xl overflow-hidden bg-black border border-slate-800 group">
          <StudioImage 
            src={previewUrl} 
            fallback=""
            alt="Thumbnail Preview" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-90 p-3 flex flex-col justify-end">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span className="flex items-center gap-1 font-medium text-amber-400">
                <CheckCircle2 className="w-3.5 h-3.5" /> Selected Thumbnail
              </span>
              {thumbInfo && <span className="text-slate-400 text-xxs bg-slate-900/80 px-2 py-0.5 rounded-md">{thumbInfo}</span>}
            </div>
          </div>
        </div>
      ) : (
        <div className="aspect-video rounded-xl border-2 border-dashed border-slate-800 bg-slate-950/50 flex flex-col items-center justify-center p-6 text-center">
          <ImageIcon className="w-8 h-8 text-slate-600 mb-2" />
          <p className="text-xs text-slate-400 font-medium">No Thumbnail Selected</p>
          <p className="text-xxs text-slate-500 mt-1">Upload JPG/PNG/WEBP or auto-generate frame</p>
        </div>
      )}
    </div>
  );
};
