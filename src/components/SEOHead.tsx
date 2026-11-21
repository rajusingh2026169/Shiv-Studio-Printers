import React, { useEffect } from 'react';

interface SEOHeadProps {
  title: string;
  description: string;
  keywords?: string;
  canonicalPath?: string;
  ogImage?: string;
}

const DEFAULT_BASE_URL = 'https://shiv-studio.vercel.app';

export const SEOHead: React.FC<SEOHeadProps> = ({
  title,
  description,
  keywords,
  canonicalPath = '/',
  ogImage
}) => {
  useEffect(() => {
    const fullTitle = title.includes('SHIV STUDIO') ? title : `${title} | SHIV STUDIO`;
    document.title = fullTitle;

    const updateMeta = (selector: string, attrName: string, attrValue: string, content: string) => {
      let el = document.querySelector(selector) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attrName, attrValue);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    updateMeta('meta[name="description"]', 'name', 'description', description);
    if (keywords) {
      updateMeta('meta[name="keywords"]', 'name', 'keywords', keywords);
    }
    updateMeta('meta[property="og:title"]', 'property', 'og:title', fullTitle);
    updateMeta('meta[property="og:description"]', 'property', 'og:description', description);
    updateMeta('meta[name="twitter:title"]', 'name', 'twitter:title', fullTitle);
    updateMeta('meta[name="twitter:description"]', 'name', 'twitter:description', description);

    const normalizedPath = canonicalPath.startsWith('/') ? canonicalPath : `/${canonicalPath}`;
    const canonicalUrl = `${DEFAULT_BASE_URL}${normalizedPath}`;
    updateMeta('meta[property="og:url"]', 'property', 'og:url', canonicalUrl);

    if (ogImage) {
      updateMeta('meta[property="og:image"]', 'property', 'og:image', ogImage);
    }

    let canonicalEl = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonicalEl) {
      canonicalEl = document.createElement('link');
      canonicalEl.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalEl);
    }
    canonicalEl.setAttribute('href', canonicalUrl);
  }, [title, description, keywords, canonicalPath, ogImage]);

  return null;
};
