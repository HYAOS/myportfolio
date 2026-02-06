import { useEffect, useMemo, useRef, useState } from "react";

type AssetPreloaderOptions = {
  timeoutMs?: number;
  debug?: boolean;
};

type AssetPreloaderState = {
  ready: boolean;
  progress: number;
  pendingCount: number;
  loadedCount: number;
  totalCount: number;
  timedOut: boolean;
};

export default function useAssetPreloader(
  assetUrls: string[],
  options: AssetPreloaderOptions = {}
): AssetPreloaderState {
  const { timeoutMs = 10000, debug = false } = options;
  const [ready, setReady] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [loadedCount, setLoadedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const completedRef = useRef(false);
  const urlsKey = useMemo(
    () => assetUrls.filter(Boolean).sort().join("|"),
    [assetUrls]
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const uniqueUrls = Array.from(new Set(assetUrls.filter(Boolean)));
    const hasFonts =
      typeof document !== "undefined" &&
      "fonts" in document &&
      typeof document.fonts?.ready?.then === "function";
    const total = uniqueUrls.length + (hasFonts ? 1 : 0);

    completedRef.current = false;
    setReady(false);
    setTimedOut(false);
    setLoadedCount(0);
    setTotalCount(total);

    if (debug) {
      console.log("[preload] total assets:", total);
    }

    if (total === 0) {
      setReady(true);
      completedRef.current = true;
      if (debug) {
        console.log("[preload] ready, timedOut=false");
      }
      return;
    }

    let loaded = 0;
    let timeoutId: number | null = null;

    const markDone = () => {
      if (completedRef.current) {
        return;
      }
      loaded += 1;
      setLoadedCount((prev) => Math.min(total, prev + 1));
      if (loaded >= total) {
        completedRef.current = true;
        setReady(true);
        if (timeoutId) {
          window.clearTimeout(timeoutId);
        }
        if (debug) {
          console.log("[preload] ready, timedOut=false");
        }
      }
    };

    uniqueUrls.forEach((url) => {
      const img = new Image();
      img.onload = markDone;
      img.onerror = markDone;
      img.src = url;
    });

    if (hasFonts) {
      document.fonts.ready.then(markDone).catch(markDone);
    }

    timeoutId = window.setTimeout(() => {
      if (completedRef.current) {
        return;
      }
      completedRef.current = true;
      setTimedOut(true);
      setReady(true);
      if (debug) {
        console.log("[preload] ready, timedOut=true");
      }
    }, timeoutMs);

    return () => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [urlsKey, timeoutMs, debug]);

  const progress = useMemo(() => {
    if (totalCount <= 0) {
      return 100;
    }
    return Math.round((loadedCount / totalCount) * 100);
  }, [loadedCount, totalCount]);

  const pendingCount = Math.max(0, totalCount - loadedCount);

  return {
    ready,
    progress,
    pendingCount,
    loadedCount,
    totalCount,
    timedOut,
  };
}
