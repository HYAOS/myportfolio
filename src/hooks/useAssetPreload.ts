import { useEffect, useMemo, useRef, useState } from "react";

type AssetPreloadState = {
  ready: boolean;
  progress: number;
  total: number;
  loaded: number;
};

type AssetPreloadOptions = {
  imageUrls?: string[];
  videoIds?: string[];
  preloadFonts?: boolean;
};

const uniq = (items: string[]) => Array.from(new Set(items.filter(Boolean)));

export const preloadImages = (
  urls: string[],
  onAssetLoaded: () => void
): number => {
  const uniqueUrls = uniq(urls);
  uniqueUrls.forEach((url) => {
    const img = new Image();
    img.onload = onAssetLoaded;
    img.onerror = onAssetLoaded;
    img.src = url;
  });
  return uniqueUrls.length;
};

export const preloadYouTubeThumbs = (
  videoIds: string[],
  onAssetLoaded: () => void
): number => {
  const uniqueIds = uniq(videoIds);
  const thumbUrls = uniqueIds.map(
    (id) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`
  );
  return preloadImages(thumbUrls, onAssetLoaded);
};

export const preloadFonts = (onAssetLoaded: () => void): number => {
  if (typeof document === "undefined") {
    return 0;
  }
  const fonts = "fonts" in document ? document.fonts : null;
  if (!fonts || typeof fonts.ready?.then !== "function") {
    return 0;
  }
  fonts.ready.then(onAssetLoaded).catch(onAssetLoaded);
  return 1;
};

export default function useAssetPreload(
  options: AssetPreloadOptions = {}
): AssetPreloadState {
  const { imageUrls = [], videoIds = [], preloadFonts: withFonts = true } = options;
  const [loaded, setLoaded] = useState(0);
  const [total, setTotal] = useState(0);
  const [ready, setReady] = useState(false);
  const completedRef = useRef(false);
  const totalRef = useRef(0);

  const key = useMemo(() => {
    const imagesKey = uniq(imageUrls).sort().join("|");
    const videosKey = uniq(videoIds).sort().join("|");
    return `${imagesKey}::${videosKey}::${withFonts ? "fonts" : "nofonts"}`;
  }, [imageUrls, videoIds, withFonts]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    completedRef.current = false;
    setLoaded(0);
    setReady(false);

    const handleLoaded = () => {
      if (completedRef.current) {
        return;
      }
      setLoaded((prev) => {
        const next = Math.min(totalRef.current, prev + 1);
        if (next >= totalRef.current) {
          completedRef.current = true;
          setReady(true);
        }
        return next;
      });
    };

    const uniqueImages = uniq(imageUrls);
    const uniqueVideos = uniq(videoIds);
    const thumbUrls = uniqueVideos.map(
      (id) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`
    );
    const canPreloadFonts =
      withFonts &&
      typeof document !== "undefined" &&
      "fonts" in document &&
      typeof document.fonts?.ready?.then === "function";
    const fontsCount = canPreloadFonts ? 1 : 0;

    totalRef.current = uniqueImages.length + thumbUrls.length + fontsCount;
    setTotal(totalRef.current);

    if (totalRef.current === 0) {
      completedRef.current = true;
      setReady(true);
      return;
    }

    preloadImages(uniqueImages, handleLoaded);
    preloadImages(thumbUrls, handleLoaded);
    if (canPreloadFonts) {
      preloadFonts(handleLoaded);
    }
  }, [key, imageUrls, videoIds, withFonts]);

  const progress = total > 0 ? Math.round((loaded / total) * 100) : 100;

  return {
    ready,
    progress,
    total,
    loaded,
  };
}
