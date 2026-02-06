import type { CSSProperties } from "react";

type LoadingScreenProps = {
  progress: number;
  message?: string;
  isActive: boolean;
  debug?: boolean;
  loadedCount?: number;
  pendingCount?: number;
  totalCount?: number;
};

export default function LoadingScreen({
  progress,
  message,
  isActive,
  debug,
  loadedCount,
  pendingCount,
  totalCount,
}: LoadingScreenProps) {
  return (
    <div
      className={`loading-screen${isActive ? " is-active" : " is-hidden"}`}
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
        {debug ? (
          <div className="loading-debug">
            <div>assets: {loadedCount ?? 0} / {totalCount ?? 0}</div>
            <div>pending: {pendingCount ?? 0}</div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
