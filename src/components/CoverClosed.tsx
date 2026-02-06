import { useEffect, useRef } from "react";

const COVER_OPEN_DURATION = 900;

type CoverClosedProps = {
  title: string;
  onOpened: () => void;
  onClosed: () => void;
  isOpening: boolean;
  isClosing: boolean;
};

export default function CoverClosed({
  title,
  onOpened,
  onClosed,
  isOpening,
  isClosing,
}: CoverClosedProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpening || !panelRef.current) {
      return;
    }

    const panel = panelRef.current;
    let done = false;

    const finish = () => {
      if (done) return;
      done = true;
      onOpened();
    };

    const handleTransitionEnd = (event: TransitionEvent) => {
      if (event.target !== panel) {
        return;
      }
      finish();
    };

    panel.addEventListener("transitionend", handleTransitionEnd, { once: true });
    const timeout = window.setTimeout(
      finish,
      Math.round(COVER_OPEN_DURATION * 1.2)
    );

    return () => {
      panel.removeEventListener("transitionend", handleTransitionEnd);
      window.clearTimeout(timeout);
    };
  }, [isOpening, onOpened]);

  useEffect(() => {
    if (!isClosing || !panelRef.current) {
      return;
    }

    const panel = panelRef.current;
    let done = false;

    const finish = () => {
      if (done) return;
      done = true;
      onClosed();
    };

    const handleTransitionEnd = (event: TransitionEvent) => {
      if (event.target !== panel) {
        return;
      }
      finish();
    };

    panel.addEventListener("transitionend", handleTransitionEnd, { once: true });
    const timeout = window.setTimeout(
      finish,
      Math.round(COVER_OPEN_DURATION * 1.2)
    );

    return () => {
      panel.removeEventListener("transitionend", handleTransitionEnd);
      window.clearTimeout(timeout);
    };
  }, [isClosing, onClosed]);

  return (
    <div className="cover-shell">
      <div className="cover-book">
        <div className="cover-spine" />
        <div className="cover-pages" />
        <div className="cover-endpaper" aria-hidden="true" />
        <div className="front-cover" ref={panelRef}>
          <div className="cover-front">
            <h1 className="cover-title">{title}</h1>
          </div>
          <div className="cover-inside" aria-hidden="true" />
        </div>
        <div className="cover-shadow" aria-hidden="true" />
      </div>
    </div>
  );
}

