import type { PageContent, Project } from "../data";
import PlaylistGallery from "./PlaylistGallery";
import YouTubeEmbed from "./YouTubeEmbed";

const coverPortraitUrl = new URL(
  "../../face/IMG_0301 (3).JPG",
  import.meta.url
).href;

type PageProps = {
  page: PageContent;
  side: "left" | "right";
  onJump?: (spreadIndex: number) => void;
  shouldLoadMedia: boolean;
  isActive?: boolean;
  allowIframe?: boolean;
  pageNumber?: number | null;
};

function ProjectCard({
  project,
  isActive,
  allowIframe,
}: {
  project: Project;
  isActive?: boolean;
  allowIframe?: boolean;
}) {
  const videoId = project.youtubeId ?? project.videoId;
  const debugEnabled =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("debug") === "1";

  if (debugEnabled && (videoId || project.embedUrl)) {
    console.log(
      "VIDEO PROJECT RENDER",
      project.id,
      project.youtubeId,
      project.embedUrl
    );
  }

  return (
    <div className="project-card">
      <div className="project-media">
        {videoId ? (
          <YouTubeEmbed
            key={project.id}
            youtubeId={videoId}
            title={project.title}
            allowIframe={Boolean(isActive) && Boolean(allowIframe)}
            embedUrl={project.embedUrl}
            playUrl={project.playUrl}
            thumbnailUrl={project.thumbnailUrl ?? project.thumbnail}
          />
        ) : project.image ? (
          <img src={project.image} alt={project.title} loading="lazy" />
        ) : (
          <div className="project-placeholder">No preview</div>
        )}
      </div>
      <div className="project-info">
        <h3>{project.title}</h3>
        <p>{project.summary}</p>
        <ul className="project-tags">
          {project.tags.map((tag) => (
            <li key={tag}>{tag}</li>
          ))}
        </ul>
        {project.link ? (
          <a className="project-link" href={project.link} target="_blank" rel="noreferrer">
            View project
          </a>
        ) : null}
      </div>
    </div>
  );
}

export default function Page({
  page,
  side,
  onJump,
  shouldLoadMedia,
  isActive,
  allowIframe,
  pageNumber,
}: PageProps) {
  return (
    <div className={`page page-${side}`}>
      {page.kind === "title" ? (
        <div className="page-title">
          <p className="page-kicker">Portfolio</p>
          <img
            className="page-portrait"
            src={coverPortraitUrl}
            alt="Savchuk Vladyslav"
            loading="eager"
          />
          <h1>{page.title}</h1>
          <p className="page-subtitle">{page.subtitle}</p>
          {page.body ? <p className="page-body">{page.body}</p> : null}
        </div>
      ) : null}

      {page.kind === "toc" ? (
        <div className="page-toc">
          <h2>{page.title}</h2>
          <ul>
            {page.items.map((item) => (
              <li key={item.label}>
                <button
                  type="button"
                  onClick={() => onJump?.(item.spreadIndex)}
                  className="toc-link"
                >
                  <span>{item.label}</span>
                  <span className="toc-dots" aria-hidden="true" />
                  <span className="toc-page">{item.spreadIndex + 1}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {page.kind === "text" ? (
        <div className="page-text">
          <h2>{page.title}</h2>
          <p>{page.body}</p>
          {page.list ? (
            <ul>
              {page.list.map((item) => {
                const isHeading =
                  item === "Video Production" ||                  item === "Tools";
                return (
                  <li key={item} className={isHeading ? "list-heading" : undefined}>
                    {item}
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>
      ) : null}

      {page.kind === "project" ? (
        <ProjectCard
          project={page.project}
          isActive={isActive}
          allowIframe={allowIframe}
        />
      ) : null}

      {page.kind === "image" ? (
        <div className="page-photo">
          {page.caption ? (
            <p className="page-photo-caption">{page.caption}</p>
          ) : null}
          <img
            src={page.src}
            alt={page.alt}
            loading={isActive ? "eager" : "lazy"}
          />
        </div>
      ) : null}

      {page.kind === "playlist" ? (
        <div className="page-playlist">
          <PlaylistGallery
            playlistId={page.playlistId}
            title={page.title}
            description={page.description}
            shouldLoad={shouldLoadMedia}
          />
        </div>
      ) : null}

      {page.kind === "quote" ? (
        <div className="page-quote">
          <blockquote>"{page.quote}"</blockquote>
          {page.author ? <p className="quote-author">{page.author}</p> : null}
        </div>
      ) : null}

      {page.kind === "contact" ? (
        <div className="page-contact">
          <h2>{page.title}</h2>
          <p>{page.body}</p>
          <ul>
            {page.links.map((link) => (
              <li key={link.href}>
                <a href={link.href} target="_blank" rel="noreferrer">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {typeof pageNumber === "number" ? (
        <div className={`page-number page-number-${side}`}>{pageNumber}</div>
      ) : null}
    </div>
  );
}




