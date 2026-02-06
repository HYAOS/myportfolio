import { useEffect, useMemo, useRef, useState } from "react";
import Book from "./components/Book";
import LoadingScreen from "./components/LoadingScreen";
import ThemeToggle from "./components/ThemeToggle";
import { PLAYLIST_VIDEO_IDS, bookData } from "./data";
import useAssetPreload from "./hooks/useAssetPreload";
import usePrefersReducedMotion from "./hooks/usePrefersReducedMotion";
import bgTribal from "./assets/bg/image-removebg-preview.png";
import bgStarsThin from "./assets/bg/image-removebg-preview (1).png";
import bgStarsCluster from "./assets/bg/image-removebg-preview (2).png";
import bgAtom from "./assets/bg/image-removebg-preview (3).png";
import bgPinkDownload from "./assets/bg/download.png";
import bgPinkSix from "./assets/bg/image-removebg-preview (6).png";
import bgPinkFive from "./assets/bg/image-removebg-preview__5_-removebg-preview.png";
import bgPurpleHeadphones from "./assets/bg/навушники.png";
import bgPurpleDnd from "./assets/bg/DND Vibes.png";
import bgPurpleDisk from "./assets/bg/диск.png";
import bgPurpleStar from "./assets/bg/зірка.png";
import bgPinkSphere from "./assets/bg/куля .png";
import bgPinkStarTwo from "./assets/bg/зірка2.png";
import bgVideo from "./assets/bg/Free Purple _ Lavender Video Presentation Background.mp4";

type Theme = "light" | "dark";

const getInitialTheme = (): Theme => {
  if (typeof document === "undefined") {
    return "light";
  }
  const attr = document.documentElement.getAttribute("data-theme");
  if (attr === "light" || attr === "dark") {
    return attr;
  }
  return "light";
};

export default function App() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const reducedMotion = usePrefersReducedMotion();
  const stageRef = useRef<HTMLDivElement | null>(null);
  const assetUrls = useMemo(() => {
    const urls = new Set<string>();
    const add = (url?: string | null) => {
      if (url) {
        urls.add(url);
      }
    };

    bookData.projects.forEach((project) => {
      add(project.image);
      add(project.thumbnail);
      add(project.thumbnailUrl);
    });

    bookData.spreads.forEach((spread) => {
      const pages = [spread.left, spread.right];
      pages.forEach((page) => {
        if (page.kind === "image") {
          add(page.src);
        }
      });
    });

    add(bgTribal);
    add(bgStarsThin);
    add(bgStarsCluster);
    add(bgAtom);
    add(bgPinkDownload);
    add(bgPinkSix);
    add(bgPinkFive);
    add(bgPurpleHeadphones);
    add(bgPurpleDnd);
    add(bgPurpleDisk);
    add(bgPurpleStar);
    add(bgPinkSphere);
    add(bgPinkStarTwo);
    return Array.from(urls);
  }, []);

  const extractYouTubeId = (value?: string | null) => {
    if (!value) return null;
    const embedMatch = value.match(/\/embed\/([a-zA-Z0-9_-]+)/);
    if (embedMatch) return embedMatch[1];
    const shortMatch = value.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
    if (shortMatch) return shortMatch[1];
    const vMatch = value.match(/[?&]v=([a-zA-Z0-9_-]+)/);
    return vMatch ? vMatch[1] : null;
  };

  const videoIds = useMemo(() => {
    const ids = new Set<string>();
    bookData.projects.forEach((project) => {
      const directId = project.youtubeId ?? project.videoId;
      const urlId =
        extractYouTubeId(project.embedUrl) ?? extractYouTubeId(project.playUrl);
      const finalId = directId ?? urlId;
      if (finalId) {
        ids.add(finalId);
      }
    });
    PLAYLIST_VIDEO_IDS.forEach((id) => ids.add(id));
    return Array.from(ids);
  }, []);

  const { ready, progress, total, loaded } = useAssetPreload({
    imageUrls: assetUrls,
    videoIds,
    preloadFonts: true,
  });
  const [bookMounted, setBookMounted] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    if (ready) {
      setBookMounted(true);
    }
  }, [ready]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const stage = stageRef.current;
    if (!stage || reducedMotion) {
      return;
    }
    const pointerQuery = window.matchMedia("(pointer: fine)");
    if (!pointerQuery.matches) {
      return;
    }
    const handleMove = (event: PointerEvent) => {
      const rect = stage.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const nx = (event.clientX - rect.left) / rect.width;
      const ny = (event.clientY - rect.top) / rect.height;
      const dx = (nx * 2 - 1) * 14;
      const dy = (ny * 2 - 1) * 12;
      stage.style.setProperty("--bg-parallax-x", `${dx.toFixed(2)}px`);
      stage.style.setProperty("--bg-parallax-y", `${dy.toFixed(2)}px`);
    };
    const handleLeave = () => {
      stage.style.setProperty("--bg-parallax-x", "0px");
      stage.style.setProperty("--bg-parallax-y", "0px");
    };
    window.addEventListener("pointermove", handleMove, { passive: true });
    window.addEventListener("pointerleave", handleLeave, { passive: true });
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerleave", handleLeave);
    };
  }, [reducedMotion]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };
  const handleTocClick = () => {
    if (typeof window === "undefined") {
      return;
    }
    window.dispatchEvent(
      new CustomEvent("book:jump", { detail: { spreadIndex: 0 } })
    );
  };

  return (
    <div className="app" data-reduced-motion={reducedMotion ? "true" : "false"}>
      <LoadingScreen
        progress={progress}
        isActive={!bookMounted}
        message="Loading assets..."
        loadedCount={loaded}
        totalCount={total}
        pendingCount={Math.max(0, total - loaded)}
      />
      <header className="app-header">
        <div className="header-actions">
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
          <button
            type="button"
            className="toc-button"
            onClick={handleTocClick}
            disabled={!bookMounted}
          >
            Table of Contents
          </button>
        </div>
      </header>
      <main className="app-main">
        {bookMounted ? (
          <div className="app-stage" ref={stageRef}>
            <video
              className="bg-video"
              src={bgVideo}
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              aria-hidden="true"
            />
            <div className="bg-layer" aria-hidden="true">
              <img src={bgTribal} alt="" className="bg-ornament bg-tribal" />
              <img src={bgStarsThin} alt="" className="bg-ornament bg-stars-thin" />
              <img
                src={bgStarsCluster}
                alt=""
                className="bg-ornament bg-stars-cluster"
              />
              <img src={bgAtom} alt="" className="bg-ornament bg-atom" />
              <img
                src={bgPinkDownload}
                alt=""
                className="bg-ornament bg-pink bg-pink-download"
              />
              <img
                src={bgPinkSix}
                alt=""
                className="bg-ornament bg-pink bg-pink-six"
              />
              <img
                src={bgPinkFive}
                alt=""
                className="bg-ornament bg-pink bg-pink-five"
              />
              <img
                src={bgPurpleHeadphones}
                alt=""
                className="bg-ornament bg-purple bg-purple-headphones"
              />
              <img
                src={bgPurpleDnd}
                alt=""
                className="bg-ornament bg-purple bg-purple-dnd"
              />
              <img
                src={bgPurpleDisk}
                alt=""
                className="bg-ornament bg-purple bg-purple-disk"
              />
              <img
                src={bgPurpleStar}
                alt=""
                className="bg-ornament bg-purple bg-purple-star"
              />
              <img
                src={bgPinkSphere}
                alt=""
                className="bg-ornament bg-pink bg-pink-sphere"
              />
              <img
                src={bgPinkStarTwo}
                alt=""
                className="bg-ornament bg-pink bg-pink-star-two"
              />
            </div>
            <Book reducedMotion={reducedMotion} />
          </div>
        ) : null}
      </main>
    </div>
  );
}
