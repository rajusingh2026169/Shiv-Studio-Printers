import React, { useState, useEffect } from 'react';
import { Play, Clock, Eye, Calendar, Film } from 'lucide-react';
import { VideoItem } from '../types';
import { generateVideoThumbnailBlob } from '../utils/videoUtils';
import { STUDIO_IMAGES } from '../assets/studioAssets';
import { isFsMediaUrl, resolveFsMediaObjectUrl } from '../utils/firestoreMediaStore';

interface VideoCardProps {
  video: VideoItem;
  onPlay: (video: VideoItem) => void;
  onEdit?: (video: VideoItem) => void;
  onDelete?: (video: VideoItem) => void;
  showAdminControls?: boolean;
}

const STOCK_THUMB_FALLBACK = STUDIO_IMAGES.cinematicDrone;

export const VideoCard: React.FC<VideoCardProps> = ({
  video,
  onPlay,
  onEdit,
  onDelete,
  showAdminControls = false
}) => {
  const [thumbSrc, setThumbSrc] = useState<string>(() => {
    const raw = video.thumbnailUrl?.trim() || '';
    if (!raw || isFsMediaUrl(raw)) return STOCK_THUMB_FALLBACK;
    return raw;
  });
  const [isThumbLoaded, setIsThumbLoaded] = useState<boolean>(false);

  useEffect(() => {
    let active = true;
    const src = video.thumbnailUrl?.trim();
    if (src && isFsMediaUrl(src)) {
      resolveFsMediaObjectUrl(src)
        .then((objUrl) => {
          if (active && objUrl) setThumbSrc(objUrl);
        })
        .catch(() => {
          if (active) setThumbSrc(STOCK_THUMB_FALLBACK);
        });
    } else if (src) {
      setThumbSrc(src);
    } else if (video.videoUrl) {
      const loadFrameFromVideo = async () => {
        const sourceUrl = isFsMediaUrl(video.videoUrl)
          ? await resolveFsMediaObjectUrl(video.videoUrl)
          : video.videoUrl;
        const blob = await generateVideoThumbnailBlob(sourceUrl);
        if (active) {
          setThumbSrc(URL.createObjectURL(blob));
        }
      };
      loadFrameFromVideo().catch(() => {
        if (active) setThumbSrc(STOCK_THUMB_FALLBACK);
      });
    } else {
      setThumbSrc(STOCK_THUMB_FALLBACK);
    }

    return () => {
      active = false;
    };
  }, [video.thumbnailUrl, video.videoUrl, video.title]);

  const handlePlayClick = () => {
    console.log(`[Video System] video URL loaded: ${video.videoUrl}`);
    onPlay(video);
  };

  const formattedDate = video.createdAt
    ? new Date(video.createdAt).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
    : '';

  return (
    <div className="group bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all rounded-2xl overflow-hidden flex flex-col justify-between shadow-lg">
      {/* Thumbnail Banner */}
      <div 
        onClick={handlePlayClick}
        className="relative aspect-video bg-black overflow-hidden cursor-pointer"
      >
        <img 
          src={thumbSrc} 
          alt={video.title} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          referrerPolicy="no-referrer"
          onLoad={() => {
            setIsThumbLoaded(true);
            console.log(`[Video System] thumbnail loaded: ${thumbSrc}`);
          }}
          onError={() => {
            console.warn(`[Video System] Thumbnail load failed for ${video.id || video.title}, trying video frame extraction.`);
            if (video.videoUrl && thumbSrc !== STOCK_THUMB_FALLBACK) {
              generateVideoThumbnailBlob(video.videoUrl)
                .then((blob) => {
                  const generatedUrl = URL.createObjectURL(blob);
                  setThumbSrc(generatedUrl);
                  console.log(`[Video System] thumbnail loaded: extracted frame from video for ${video.title}`);
                })
                .catch(() => {
                  setThumbSrc(STOCK_THUMB_FALLBACK);
                });
            } else {
              setThumbSrc(STOCK_THUMB_FALLBACK);
            }
          }}
        />
        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-amber-500/90 text-slate-950 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform pl-0.5">
            <Play className="w-6 h-6 fill-slate-950" />
          </div>
        </div>

        {/* Category Badge */}
        <div className="absolute top-2.5 left-2.5">
          <span className="text-xxs uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-slate-900/90 backdrop-blur-md text-amber-400 border border-slate-700">
            {video.category || 'Gallery'}
          </span>
        </div>

        {/* Duration Badge */}
        {video.duration && (
          <div className="absolute bottom-2.5 right-2.5">
            <span className="text-xxs font-mono font-semibold px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-white border border-white/10 flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-400" />
              {video.duration}
            </span>
          </div>
        )}
      </div>

      {/* Content Meta */}
      <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
        <div className="space-y-1">
          <h3 
            onClick={handlePlayClick}
            className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors line-clamp-1 cursor-pointer"
          >
            {video.title}
          </h3>
          {video.description && (
            <p className="text-xs text-slate-400 line-clamp-2">{video.description}</p>
          )}
        </div>

        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xxs text-slate-400">
          <div className="flex items-center gap-3">
            {formattedDate && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-500" />
                {formattedDate}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3 text-slate-500" />
              {video.views || 0} views
            </span>
          </div>

          {video.fileSize && (
            <span className="text-slate-500 font-mono">{video.fileSize}</span>
          )}
        </div>

        {showAdminControls && (
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(video)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition-colors"
              >
                Replace / Edit
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(video)}
                className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-medium rounded-lg border border-rose-500/20 transition-colors"
              >
                Delete
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
