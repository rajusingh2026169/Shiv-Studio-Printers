import React, { useRef, useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize, 
  Settings, 
  AlertCircle,
  ExternalLink,
  Film
} from 'lucide-react';

interface VideoPlayerProps {
  src: string;
  poster?: string;
  title?: string;
  description?: string;
  className?: string;
  autoPlay?: boolean;
  onEnded?: () => void;
  videoRefOut?: React.RefObject<HTMLVideoElement | null>;
}

const getVideoType = (url: string) => {
  if (!url) return 'video/mp4';
  const lower = url.toLowerCase();
  if (lower.includes('.webm')) return 'video/webm';
  if (lower.includes('.mov') || lower.includes('.quicktime')) return 'video/quicktime';
  if (lower.includes('.ogg') || lower.includes('.ogv')) return 'video/ogg';
  return 'video/mp4';
};

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  poster = '',
  title = '',
  description = '',
  className = '',
  autoPlay = false,
  onEnded,
  videoRefOut
}) => {
  const internalVideoRef = useRef<HTMLVideoElement | null>(null);
  const videoRef = videoRefOut || internalVideoRef;

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1.0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setError(null);
    setIsLoaded(false);
    setIsPlaying(false);
    if (src) {
      console.log(`[Video System] video URL loaded: ${src}`);
    }
    if (poster) {
      console.log(`[Video System] thumbnail loaded: ${poster}`);
    }
    if (videoRef.current) {
      videoRef.current.load();
    }
  }, [src, poster]);

  const handlePlay = () => {
    if (videoRef.current) {
      videoRef.current.play()
        .then(() => {
          setIsPlaying(true);
          console.log(`[Video System] Playback Started: ${src}`);
        })
        .catch((err) => {
          if (err.name === 'NotAllowedError') {
            console.warn('[Video System] Autoplay restricted by browser, attempting muted playback:', err.message);
            if (videoRef.current) {
              videoRef.current.muted = true;
              setIsMuted(true);
              videoRef.current.play().then(() => {
                setIsPlaying(true);
              }).catch((mutedErr) => {
                console.warn('[Video System] Muted autoplay also restricted:', mutedErr.message);
                setIsPlaying(false);
              });
            }
          } else {
            console.error(`[Video System] playback errors:`, err?.message || err);
            setError(`Playback failed: ${err.message || 'Error starting video playback'}`);
          }
        });
    }
  };

  const handlePause = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const togglePlay = () => {
    if (isPlaying) {
      handlePause();
    } else {
      handlePlay();
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      const nextMute = !isMuted;
      videoRef.current.muted = nextMute;
      setIsMuted(nextMute);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    if (videoRef.current) {
      videoRef.current.volume = newVol;
      videoRef.current.muted = newVol === 0;
      setIsMuted(newVol === 0);
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    setShowSpeedMenu(false);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  const handleFullscreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      } else if ((videoRef.current as any).webkitRequestFullscreen) {
        (videoRef.current as any).webkitRequestFullscreen();
      }
    }
  };

  const handlePiP = async () => {
    if (videoRef.current && document.pictureInPictureEnabled) {
      try {
        if (document.pictureInPictureElement) {
          await document.exitPictureInPicture();
        } else {
          await videoRef.current.requestPictureInPicture();
        }
      } catch (err) {
        console.warn('Picture in Picture failed:', err);
      }
    }
  };

  if (!src) {
    return (
      <div className={`aspect-video bg-slate-900 border border-slate-800 rounded-2xl flex flex-col items-center justify-center p-6 text-center text-slate-500 ${className}`}>
        <Film className="w-10 h-10 mb-2 opacity-50 text-slate-600" />
        <p className="text-sm font-semibold">No Video Selected</p>
      </div>
    );
  }

  const cleanSrc = src.trim();

  return (
    <div className={`relative aspect-video bg-black rounded-2xl overflow-hidden border border-slate-800 group ${className}`}>
      {error ? (
        <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center p-6 text-center space-y-3 z-20">
          <AlertCircle className="w-10 h-10 text-rose-500" />
          <p className="text-sm font-bold text-rose-400 max-w-md">{error}</p>
          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={() => {
                setError(null);
                if (videoRef.current) videoRef.current.load();
              }}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs text-white rounded-xl font-medium border border-slate-700 transition-colors"
            >
              Retry Loading
            </button>
            <a
              href={cleanSrc}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-xs text-amber-400 rounded-xl font-medium border border-amber-500/30 transition-colors flex items-center gap-1.5"
            >
              <span>Open Direct Link</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      ) : null}

      <video
        key={cleanSrc}
        ref={videoRef}
        src={cleanSrc}
        poster={poster || undefined}
        autoPlay={autoPlay}
        preload="metadata"
        playsInline
        controls
        controlsList="nodownload"
        className="w-full h-full object-contain"
        onPlay={() => {
          setIsPlaying(true);
          console.log(`[Video System] Playback Started: ${cleanSrc}`);
        }}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false);
          if (onEnded) onEnded();
        }}
        onError={(e) => {
          const err = (e.target as HTMLVideoElement)?.error;
          let msg = 'Unable to play video format or source URL.';
          if (err) {
            if (err.code === 4) {
              msg = 'Video format not supported or source URL inaccessible.';
            } else if (err.code === 3) {
              msg = 'Media decoding failed.';
            } else if (err.code === 2) {
              msg = 'Network error during video download.';
            } else if (err.code === 1) {
              msg = 'Video playback aborted.';
            } else {
              msg = err.message || 'Media element error';
            }
          }
          console.error('[Video System] playback errors:', msg, err);
          setError(msg);
        }}
        onLoadedMetadata={(e) => {
          const target = e.currentTarget;
          console.log('[Video System] video metadata loaded:', {
            duration: target.duration,
            videoWidth: target.videoWidth,
            videoHeight: target.videoHeight,
            src: cleanSrc
          });
          setIsLoaded(true);
        }}
      >
        Your browser does not support HTML5 video playback.
      </video>

      {/* Speed & Custom Overlay controls in top right */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowSpeedMenu(!showSpeedMenu)}
            className="p-2 bg-slate-900/80 hover:bg-slate-800 backdrop-blur-md text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5 shadow-lg"
            title="Playback Speed"
          >
            <Settings className="w-3.5 h-3.5 text-amber-400" />
            <span>{playbackSpeed}x</span>
          </button>

          {showSpeedMenu && (
            <div className="absolute right-0 mt-1 w-24 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden z-30 py-1 text-xs">
              {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map((s) => (
                <button
                  key={s}
                  onClick={() => handleSpeedChange(s)}
                  className={`w-full text-left px-3 py-1.5 hover:bg-amber-500/10 hover:text-amber-400 transition-colors ${
                    playbackSpeed === s ? 'text-amber-400 font-bold bg-amber-500/5' : 'text-slate-300'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
          )}
        </div>

        {document.pictureInPictureEnabled && (
          <button
            type="button"
            onClick={handlePiP}
            className="p-2 bg-slate-900/80 hover:bg-slate-800 backdrop-blur-md text-slate-200 text-xs rounded-xl border border-slate-700 transition-colors shadow-lg"
            title="Picture in Picture"
          >
            <Film className="w-3.5 h-3.5 text-cyan-400" />
          </button>
        )}
      </div>

      {(title || description) && (
        <div className="absolute bottom-12 left-3 right-3 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-xl p-2.5 max-w-md">
            {title && <h4 className="text-xs font-bold text-white line-clamp-1">{title}</h4>}
            {description && <p className="text-xxs text-slate-300 line-clamp-1 mt-0.5">{description}</p>}
          </div>
        </div>
      )}
    </div>
  );
};
