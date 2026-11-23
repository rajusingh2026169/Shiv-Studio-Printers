import React, { useEffect, useState } from 'react';
import { STUDIO_IMAGES } from '../assets/studioAssets';
import { applyImageFallback, resolveMediaUrl } from '../utils/mediaResolver';
import {
  isFsMediaUrl,
  getCachedFsMediaObjectUrl,
  resolveFsMediaObjectUrl
} from '../utils/firestoreMediaStore';

/**
 * React hook that resolves static assets, HTTPS URLs, Express `/uploads/...` paths,
 * and Cloud Firestore `fsmedia://{mediaId}` assets seamlessly into browser-renderable URLs.
 */
export function useResolvedMediaUrl(
  rawUrl?: string | null,
  fallback: string = STUDIO_IMAGES.heroWedding
): string {
  const trimmed = typeof rawUrl === 'string' ? rawUrl.trim() : '';

  const [resolvedUrl, setResolvedUrl] = useState<string>(() => {
    if (isFsMediaUrl(trimmed)) {
      return getCachedFsMediaObjectUrl(trimmed) || fallback;
    }
    return resolveMediaUrl(trimmed, fallback);
  });

  useEffect(() => {
    if (!isFsMediaUrl(trimmed)) {
      setResolvedUrl(resolveMediaUrl(trimmed, fallback));
      return;
    }

    const cached = getCachedFsMediaObjectUrl(trimmed);
    if (cached) {
      setResolvedUrl(cached);
      return;
    }

    let isMounted = true;
    setResolvedUrl(fallback);

    resolveFsMediaObjectUrl(trimmed)
      .then((objUrl) => {
        if (isMounted && objUrl) {
          setResolvedUrl(objUrl);
        }
      })
      .catch((err) => {
        console.warn('[StudioMedia] Could not load Firestore media:', trimmed, err);
        if (isMounted) {
          setResolvedUrl(fallback);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [trimmed, fallback]);

  return resolvedUrl;
}

export interface StudioImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string | null;
  fallback?: string;
}

export const StudioImage: React.FC<StudioImageProps> = ({
  src,
  fallback = STUDIO_IMAGES.heroWedding,
  onError,
  referrerPolicy = 'no-referrer',
  ...rest
}) => {
  const resolvedSrc = useResolvedMediaUrl(src, fallback);

  return (
    <img
      {...rest}
      src={resolvedSrc}
      referrerPolicy={referrerPolicy}
      onError={(e) => {
        if (resolvedSrc !== fallback) {
          applyImageFallback(e, fallback);
        }
        if (onError) {
          onError(e);
        }
      }}
    />
  );
};

export interface StudioVideoProps extends React.VideoHTMLAttributes<HTMLVideoElement> {
  src?: string | null;
  poster?: string | null;
}

export const StudioVideo: React.FC<StudioVideoProps> = ({
  src,
  poster,
  ...rest
}) => {
  const resolvedSrc = useResolvedMediaUrl(src, '');
  const resolvedPoster = useResolvedMediaUrl(poster, '');

  return (
    <video
      {...rest}
      src={resolvedSrc || undefined}
      poster={resolvedPoster || undefined}
    />
  );
};
