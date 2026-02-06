import { useCallback, useEffect, useState, type SyntheticEvent } from "react";

type YouTubeEmbedProps = {
  youtubeId: string;
  title: string;
  allowIframe?: boolean;
  allowAutoplay?: boolean;
  embedUrl?: string;
  playUrl?: string;
  thumbnailUrl?: string;
};

export default function YouTubeEmbed({
  youtubeId,
  title,
  allowIframe = true,
  allowAutoplay = false,
  embedUrl,
  playUrl,
  thumbnailUrl,
}: YouTubeEmbedProps) {
  const [shouldPlay, setShouldPlay] = useState(false);
  const thumbnail =
    thumbnailUrl ?? `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
  const iframeSrc = embedUrl ?? `https://www.youtube.com/embed/${youtubeId}?rel=0`;
  const watchUrl = playUrl ?? `https://www.youtube.com/watch?v=${youtubeId}`;
  const showIframe = allowIframe && (shouldPlay || allowAutoplay);

  useEffect(() => {
    if (!allowIframe && shouldPlay) {
      setShouldPlay(false);
    }
  }, [allowIframe, shouldPlay]);

  const stopContainerEvent = useCallback((event: SyntheticEvent) => {
    event.stopPropagation();
    const target = event.target as Element | null;
    if (target && target.closest("a")) {
      return;
    }
    event.preventDefault();
  }, []);

  const openPlayer = useCallback((event: SyntheticEvent) => {
    event.stopPropagation();
    event.preventDefault();
    setShouldPlay(true);
  }, []);

  return (
    <div
      className="video"
      data-interactive="true"
      onPointerDown={stopContainerEvent}
      onClick={stopContainerEvent}
    >
      {showIframe ? (
        <iframe
          className="video-frame"
          src={iframeSrc}
          title={title}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <button
          type="button"
          className="video-placeholder"
          onPointerDown={openPlayer}
          onClick={openPlayer}
          style={{
            border: "none",
            padding: 0,
            background: "transparent",
            cursor: "pointer",
            textAlign: "left",
            width: "100%",
          }}
        >
          <img src={thumbnail} alt={`${title} video preview`} loading="lazy" />
          <span className="video-play" aria-hidden="true">
            Play
          </span>
        </button>
      )}
      <a
        className="video-link"
        href={watchUrl}
        target="_blank"
        rel="noreferrer"
      >
        Play on YouTube
      </a>
    </div>
  );
}
