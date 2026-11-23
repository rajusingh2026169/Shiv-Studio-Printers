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
import { useResolvedMediaUrl } from './StudioMedia';

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

function getEmbedUrl(rawUrl: string): string | null {
  try {
    const url = rawUrl.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) return null;

    // YouTube watch / short / shorts URLs
    const ytMatch = url.match(
      /(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{6,})/
    );
    if (ytMatch && ytMatch[1]) {
      return `https://www.youtube.com/embed/${ytMatch[1]}?rel=0`;
    }

    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (vimeoMatch && vimeoMatch[1]) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }

    // Google Drive file preview
    const driveMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (driveMatch && driveMatch[1]) {
      return `https://drive.google.com/file/d/${driveMatch[1]}/preview`;
    }

    return null;
  } catch {
    return null;
  }
}

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

  const resolvedVideoSrc = useResolvedMediaUrl(src, '');
  const resolvedPosterSrc = useResolvedMediaUrl(poster, '');

  useEffect(() => {
    setError(null);
    setIsLoaded(false);
    setIsPlaying(false);
  }, [src, poster]);

  const handlePlay = () => {
    if (videoRef.current) {
      videoRef.current.play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch((err) => {
          if (err.name === 'NotAllowedError') {
            if (videoRef.current) {
              videoRef.current.muted = true;
              setIsMuted(true);
              videoRef.current.play().then(() => {
                setIsPlaying(true);
              }).catch(() => {
                setIsPlaying(false);
              });
            }
          } else {
            console.warn('[Video System] playback notice:', err?.message || 'Unable to start video playback');
            setError(`Playback failed: ${err?.message || 'Error starting video playback'}`);
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

  const cleanSrc = resolvedVideoSrc || src.trim();
  const embedSrc = getEmbedUrl(cleanSrc);

  if (embedSrc) {
    return (
      <div className={`relative aspect-video bg-black rounded-2xl overflow-hidden border border-slate-800 ${className}`}>
        <iframe
          src={embedSrc}
          title={title || 'SHIV STUDIO Film'}
          className="w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <div className={`relative aspect-video bg-black rounded-2xl overflow-hidden border border-slate-800 group ${className}`}>
      {error ? (
        <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center space-y-3 z-20">
          {(resolvedPosterSrc || poster) && (
            <img
              src={resolvedPosterSrc || poster}
              alt={title || 'Video Poster'}
              className="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none"
            />
          )}
          <AlertCircle className="w-10 h-10 text-amber-400 relative z-10" />
          <p className="text-sm font-bold text-slate-100 max-w-md relative z-10">{error}</p>
          <p className="text-xs text-slate-400 max-w-md relative z-10">
            This video format or external link could not be streamed inline. You can retry or open the direct file.
          </p>
          <div className="flex items-center gap-3 pt-1 relative z-10">
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
        poster={resolvedPosterSrc || undefined}
        autoPlay={autoPlay}
        preload="metadata"
        playsInline
        controls
        controlsList="nodownload"
        className="w-full h-full object-contain"
        onPlay={() => {
          setIsPlaying(true);
        }}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false);
          if (onEnded) onEnded();
        }}
        onError={(e) => {
          const mediaErr = (e.target as HTMLVideoElement)?.error;
          let msg = 'Unable to play video format or source URL.';
          if (mediaErr) {
            if (mediaErr.code === 4) {
              msg = 'Video format not supported or source URL inaccessible.';
            } else if (mediaErr.code === 3) {
              msg = 'Media decoding failed.';
            } else if (mediaErr.code === 2) {
              msg = 'Network error during video download.';
            } else if (mediaErr.code === 1) {
              msg = 'Video playback aborted.';
            } else {
              msg = mediaErr.message || 'Media element error';
            }
          }
          console.warn('[Video System] playback notice:', msg, {
            code: mediaErr?.code,
            message: mediaErr?.message,
            src: cleanSrc
          });
          setError(msg);
        }}
        onLoadedMetadata={() => {
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
