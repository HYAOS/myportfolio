import type { CSSProperties } from "react";

type LoadingOverlayProps = {
  progress: number;
  loaded: number;
  total: number;
  active: boolean;
  message?: string;
};

export default function LoadingOverlay({
  progress,
  loaded,
  total,
  active,
  message,
}: LoadingOverlayProps) {
  return (
    <div
      className={`loading-screen${active ? " is-active" : " is-hidden"}`}
      role="status"
      aria-live="polite"
    >
      <div className="loading-card">
        <div className="loading-mark">PB</div>
        <div className="loading-title">Portfolio Book</div>
        <div className="loading-subtitle">{message ?? "Loading assets..."}</div>
        <div
          className="loading-progress"
          style={{ "--progress": `${progress}%` } as CSSProperties}
        >
          <span className="loading-progress-bar" />
        </div>
        <div className="loading-percent">{progress}%</div>
        <div className="loading-debug">
          <div>assets: {loaded} / {total}</div>
        </div>
      </div>
    </div>
  );
}
