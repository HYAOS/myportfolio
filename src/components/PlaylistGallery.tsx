import { useEffect, useMemo, useState } from "react";
import { PLAYLIST_VIDEO_IDS as DATA_PLAYLIST_VIDEO_IDS } from "../data";

const PLAYLIST_VIDEO_IDS = DATA_PLAYLIST_VIDEO_IDS;

type PlaylistVideo = {
  videoId: string;
  title: string;
  author?: string;
  lengthSeconds?: number;
  thumbnailUrl: string;
};

type PlaylistData = {
  title: string;
  author?: string;
  description?: string;
  videoCount?: number;
  videos: PlaylistVideo[];
};

type PlaylistGalleryProps = {
  playlistId: string;
  title: string;
  description?: string;
  shouldLoad: boolean;
};

const formatDuration = (lengthSeconds?: number) => {
  if (!Number.isFinite(lengthSeconds ?? Number.NaN)) {
    return null;
  }
  const total = Math.max(0, Math.floor(lengthSeconds ?? 0));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
};

export default function PlaylistGallery({
  playlistId,
  title,
  description,
  shouldLoad,
}: PlaylistGalleryProps) {
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const playlistVideos = useMemo<PlaylistVideo[]>(() => {
    return PLAYLIST_VIDEO_IDS.map((videoId, index) => ({
      videoId,
      title: `Video ${index + 1}`,
      thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    }));
  }, []);
  const data = useMemo<PlaylistData | null>(() => {
    if (!playlistVideos.length) {
      return null;
    }
    return {
      title,
      description,
      videoCount: playlistVideos.length,
      videos: playlistVideos,
    };
  }, [title, description, playlistVideos]);
  const status = data ? "ready" : "loading";

  useEffect(() => {
    setActiveVideoId(null);
    setHasInteracted(false);
  }, [playlistId]);

  useEffect(() => {
    if (!data || data.videos.length === 0) {
      return;
    }
    setActiveVideoId((prev) => {
      if (prev && data.videos.some((video) => video.videoId === prev)) {
        return prev;
      }
      return data.videos[0].videoId;
    });
  }, [data]);

  const activeVideo = data?.videos.find((video) => video.videoId === activeVideoId) ?? null;
  const canLoadPlayer = shouldLoad || hasInteracted;
  const playerSrc = useMemo(() => {
    if (!activeVideoId) {
      return "";
    }
    return `https://www.youtube.com/embed/${activeVideoId}?rel=0&list=${playlistId}`;
  }, [activeVideoId, playlistId]);
  const playlistUrl = `https://www.youtube.com/playlist?list=${playlistId}`;
  const activeVideoUrl = activeVideoId
    ? `https://www.youtube.com/watch?v=${activeVideoId}&list=${playlistId}`
    : playlistUrl;
  const displayTitle = data?.title ?? title;
  const videoCount = data?.videoCount ?? data?.videos.length;
  const subtitle =
    description ?? (data?.author ? `By ${data.author}` : undefined);

  return (
    <div className="playlist-gallery">
      <div className="playlist-header">
        <p className="playlist-kicker">Video Playlist</p>
        <h2>{displayTitle}</h2>
        {subtitle ? <p className="playlist-subtitle">{subtitle}</p> : null}
        {typeof videoCount === "number" ? (
          <p className="playlist-count">{videoCount} videos</p>
        ) : null}
      </div>

      <div className="playlist-body">
        <div className="playlist-list" aria-busy={status === "loading"}>
          {!data ? (
            <div className="playlist-skeleton" aria-hidden="true">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="playlist-skeleton-row" />
              ))}
            </div>
          ) : (
            data.videos.map((video) => {
              const duration = formatDuration(video.lengthSeconds);
              const isActive = video.videoId === activeVideoId;
              return (
                <button
                  key={video.videoId}
                  type="button"
                  className={`playlist-card${isActive ? " is-active" : ""}`}
                  onClick={() => {
                    setActiveVideoId(video.videoId);
                    setHasInteracted(true);
                  }}
                  aria-pressed={isActive}
                >
                  <img
                    className="playlist-thumb"
                    src={video.thumbnailUrl}
                    alt={`${video.title} thumbnail`}
                    loading="lazy"
                  />
                  <div className="playlist-card-text">
                    <span className="playlist-card-title">{video.title}</span>
                    <span className="playlist-card-meta">
                      {video.author ? <span>{video.author}</span> : null}
                      {duration ? <span className="playlist-duration">{duration}</span> : null}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>

        <div className="playlist-player">
          {activeVideo ? (
            <>
              <div className="playlist-player-header">
                <p className="playlist-player-label">Now playing</p>
                <h3 className="playlist-player-title">{activeVideo.title}</h3>
              </div>
              <div className="video">
                {canLoadPlayer ? (
                  <iframe
                    className="video-frame"
                    src={playerSrc}
                    title={activeVideo.title}
                    loading="lazy"
                    allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <div className="video-placeholder">
                    <img
                      src={activeVideo.thumbnailUrl}
                      alt={`${activeVideo.title} preview`}
                      loading="lazy"
                    />
                    <span className="video-play" aria-hidden="true">
                      Play
                    </span>
                  </div>
                )}
                <a
                  className="video-link"
                  href={activeVideoUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setHasInteracted(true)}
                >
                  Play on YouTube
                </a>
              </div>
            </>
          ) : (
            <div className="playlist-empty">Select a video to preview.</div>
          )}
        </div>
      </div>
    </div>
  );
}
