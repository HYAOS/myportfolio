import {
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type TouchEvent as ReactTouchEvent,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { unstable_batchedUpdates } from "react-dom";
import {
  PLAYLIST_ID,
  PLAYLIST_VIDEO_IDS as DATA_PLAYLIST_VIDEO_IDS,
  bookData,
  type PageContent,
  type Project,
  type Spread,
} from "../data";
import CoverClosed from "./CoverClosed";
import Page from "./Page";

const COVER_OPEN_DURATION = 900;
const FLIP_DURATION = 820;
const WHEEL_THRESHOLD = 120;
const WHEEL_LOCK_MS = 550;
const SWIPE_THRESHOLD = 50;
const PLAYLIST_VIDEO_IDS = DATA_PLAYLIST_VIDEO_IDS;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

type Scene =
  | "coverClosed"
  | "openingArmed"
  | "opening"
  | "bookOpen"
  | "closingArmed"
  | "closing";

type TurnState = "idle" | "flippingForward" | "flippingBack";

type FlipPhase = "idle" | "prepare" | "turn";

type BookProps = {
  reducedMotion: boolean;
};

type OverridesByProjectId = Record<string, string>;

const isVideoProject = (project: Project) =>
  typeof project.youtubeId === "string" ||
  typeof project.videoId === "string" ||
  typeof project.embedUrl === "string";

const videoProjects = bookData.projects.filter(isVideoProject);
const backMatter: Spread = {
  id: "back-matter",
  left: {
    kind: "text",
    title: "Back Matter",
    body: "",
  },
  right: {
    kind: "text",
    title: "",
    body: "",
  },
};

function Book({ reducedMotion }: BookProps) {
  const renderCountRef = useRef(0);
  const renderRateRef = useRef(0);
  renderCountRef.current += 1;
  renderRateRef.current += 1;
  const [scene, _setScene] = useState<Scene>("coverClosed");
  const [turnState, _setTurnState] = useState<TurnState>("idle");
  const [flipPhase, _setFlipPhase] = useState<FlipPhase>("idle");
  const [isAnimating, _setIsAnimating] = useState(false);
  const [leftPageIndex, _setLeftPageIndex] = useState(0);
  const [rightPageIndex, _setRightPageIndex] = useState(0);
  const [flipPageIndex, _setFlipPageIndex] = useState<number | null>(null);
  const [flipSide, _setFlipSide] = useState<"left" | "right" | null>(null);
  const [flipDirection, _setFlipDirection] = useState<
    "forward" | "backward" | null
  >(null);
  const [isOpening, _setIsOpening] = useState(false);
  const [isClosing, _setIsClosing] = useState(false);

  const turningSheetRef = useRef<HTMLDivElement | null>(null);
  const flipTimeoutRef = useRef<number | null>(null);
  const sceneRafRef = useRef<number | null>(null);
  const sceneRafSecondRef = useRef<number | null>(null);
  const flipRafRef = useRef<number | null>(null);
  const flipRafSecondRef = useRef<number | null>(null);
  const wheelAccumRef = useRef(0);
  const wheelRafRef = useRef<number | null>(null);
  const wheelLockRef = useRef(false);
  const wheelUnlockTimeoutRef = useRef<number | null>(null);
  const lastWheelTsRef = useRef(0);
  const bookRootRef = useRef<HTMLDivElement | null>(null);
  const externalJumpRef = useRef<number | null>(null);
  const tiltRef = useRef({
    x: 0,
    y: 0,
    tx: 0,
    ty: 0,
    nx: 0,
    ny: 0,
    raf: 0,
    active: false,
  });
  const pagesRef = useRef<HTMLDivElement | null>(null);
  const leftPageRef = useRef<HTMLDivElement | null>(null);
  const isAnimatingRef = useRef(isAnimating);
  const leftPageIndexRef = useRef(leftPageIndex);
  const rightPageIndexRef = useRef(rightPageIndex);
  const flipPageIndexRef = useRef(flipPageIndex);
  const flipSideRef = useRef(flipSide);
  const flipDirectionRef = useRef(flipDirection);
  const pendingSyncRef = useRef<{ side: "left" | "right"; target: number } | null>(
    null
  );
  const sceneRef = useRef(scene);
  const turnStateRef = useRef(turnState);
  const flipPhaseRef = useRef(flipPhase);
  const isOpeningRef = useRef(isOpening);
  const isClosingRef = useRef(isClosing);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(
    null
  );
  const setterBumpsRef = useRef<Record<string, number>>({});

  useEffect(() => {
    isAnimatingRef.current = isAnimating;
  }, [isAnimating]);

  useEffect(() => {
    leftPageIndexRef.current = leftPageIndex;
  }, [leftPageIndex]);

  useEffect(() => {
    rightPageIndexRef.current = rightPageIndex;
  }, [rightPageIndex]);

  useEffect(() => {
    flipPageIndexRef.current = flipPageIndex;
  }, [flipPageIndex]);

  useEffect(() => {
    flipSideRef.current = flipSide;
  }, [flipSide]);

  useEffect(() => {
    flipDirectionRef.current = flipDirection;
  }, [flipDirection]);

  useEffect(() => {
    sceneRef.current = scene;
  }, [scene]);

  useEffect(() => {
    turnStateRef.current = turnState;
  }, [turnState]);

  useEffect(() => {
    flipPhaseRef.current = flipPhase;
  }, [flipPhase]);


  useEffect(() => {
    isOpeningRef.current = isOpening;
  }, [isOpening]);

  useEffect(() => {
    isClosingRef.current = isClosing;
  }, [isClosing]);

  useEffect(() => {
    return () => {
      if (sceneRafRef.current !== null && typeof window !== "undefined") {
        window.cancelAnimationFrame(sceneRafRef.current);
      }
      if (sceneRafSecondRef.current !== null && typeof window !== "undefined") {
        window.cancelAnimationFrame(sceneRafSecondRef.current);
      }
      if (flipRafRef.current !== null && typeof window !== "undefined") {
        window.cancelAnimationFrame(flipRafRef.current);
      }
      if (flipRafSecondRef.current !== null && typeof window !== "undefined") {
        window.cancelAnimationFrame(flipRafSecondRef.current);
      }
      if (wheelRafRef.current !== null && typeof window !== "undefined") {
        window.cancelAnimationFrame(wheelRafRef.current);
      }
      if (wheelUnlockTimeoutRef.current !== null && typeof window !== "undefined") {
        window.clearTimeout(wheelUnlockTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const interval = window.setInterval(() => {
      const count = renderRateRef.current;
      console.log("[render-rate]", count);
      renderRateRef.current = 0;
    }, 2000);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const start = Date.now();
    const interval = window.setInterval(() => {
      if (Date.now() - start > 5000) {
        window.clearInterval(interval);
        return;
      }
      console.log("[perf] ready");
    }, 1000);
    return () => {
      window.clearInterval(interval);
    };
  }, []);

  const debugEnabled = useMemo(() => {
    if (typeof window === "undefined") {
      return false;
    }
    const params = new URLSearchParams(window.location.search);
    return params.get("debug") === "1";
  }, []);

  const logSetter = useCallback((label: string, value: unknown) => {
    const counts = setterBumpsRef.current;
    counts[label] = (counts[label] ?? 0) + 1;
    console.log(`[${label}]`, value);
  }, []);

  const setScene = useCallback(
    (value: Parameters<typeof _setScene>[0]) => {
      logSetter("setScene", value);
      if (typeof value === "function") {
        _setScene((prev) => {
          const next = value(prev);
          return Object.is(prev, next) ? prev : next;
        });
        return;
      }
      if (Object.is(sceneRef.current, value)) {
        return;
      }
      _setScene(value);
    },
    [logSetter]
  );

  const setTurnState = useCallback(
    (value: Parameters<typeof _setTurnState>[0]) => {
      logSetter("setTurnState", value);
      if (typeof value === "function") {
        _setTurnState((prev) => {
          const next = value(prev);
          return Object.is(prev, next) ? prev : next;
        });
        return;
      }
      if (Object.is(turnStateRef.current, value)) {
        return;
      }
      _setTurnState(value);
    },
    [logSetter]
  );

  const setFlipPhase = useCallback(
    (value: Parameters<typeof _setFlipPhase>[0]) => {
      logSetter("setFlipPhase", value);
      if (typeof value === "function") {
        _setFlipPhase((prev) => {
          const next = value(prev);
          return Object.is(prev, next) ? prev : next;
        });
        return;
      }
      if (Object.is(flipPhaseRef.current, value)) {
        return;
      }
      _setFlipPhase(value);
    },
    [logSetter]
  );

  const setIsAnimating = useCallback(
    (value: Parameters<typeof _setIsAnimating>[0]) => {
      logSetter("setIsAnimating", value);
      if (typeof value === "function") {
        _setIsAnimating((prev) => {
          const next = value(prev);
          return Object.is(prev, next) ? prev : next;
        });
        return;
      }
      if (Object.is(isAnimatingRef.current, value)) {
        return;
      }
      _setIsAnimating(value);
    },
    [logSetter]
  );

  const setLeftPageIndex = useCallback(
    (value: Parameters<typeof _setLeftPageIndex>[0]) => {
      logSetter("setLeftPageIndex", value);
      if (typeof value === "function") {
        _setLeftPageIndex((prev) => {
          const next = value(prev);
          return Object.is(prev, next) ? prev : next;
        });
        return;
      }
      if (Object.is(leftPageIndexRef.current, value)) {
        return;
      }
      _setLeftPageIndex(value);
    },
    [logSetter]
  );

  const setRightPageIndex = useCallback(
    (value: Parameters<typeof _setRightPageIndex>[0]) => {
      logSetter("setRightPageIndex", value);
      if (typeof value === "function") {
        _setRightPageIndex((prev) => {
          const next = value(prev);
          return Object.is(prev, next) ? prev : next;
        });
        return;
      }
      if (Object.is(rightPageIndexRef.current, value)) {
        return;
      }
      _setRightPageIndex(value);
    },
    [logSetter]
  );

  const setFlipPageIndex = useCallback(
    (value: Parameters<typeof _setFlipPageIndex>[0]) => {
      logSetter("setFlipPageIndex", value);
      if (typeof value === "function") {
        _setFlipPageIndex((prev) => {
          const next = value(prev);
          return Object.is(prev, next) ? prev : next;
        });
        return;
      }
      if (Object.is(flipPageIndexRef.current, value)) {
        return;
      }
      _setFlipPageIndex(value);
    },
    [logSetter]
  );

  const setFlipSide = useCallback(
    (value: Parameters<typeof _setFlipSide>[0]) => {
      logSetter("setFlipSide", value);
      if (typeof value === "function") {
        _setFlipSide((prev) => {
          const next = value(prev);
          return Object.is(prev, next) ? prev : next;
        });
        return;
      }
      if (Object.is(flipSideRef.current, value)) {
        return;
      }
      _setFlipSide(value);
    },
    [logSetter]
  );

  const setFlipDirection = useCallback(
    (value: Parameters<typeof _setFlipDirection>[0]) => {
      logSetter("setFlipDirection", value);
      if (typeof value === "function") {
        _setFlipDirection((prev) => {
          const next = value(prev);
          return Object.is(prev, next) ? prev : next;
        });
        return;
      }
      if (Object.is(flipDirectionRef.current, value)) {
        return;
      }
      _setFlipDirection(value);
    },
    [logSetter]
  );

  const setIsOpening = useCallback(
    (value: Parameters<typeof _setIsOpening>[0]) => {
      logSetter("setIsOpening", value);
      if (typeof value === "function") {
        _setIsOpening((prev) => {
          const next = value(prev);
          return Object.is(prev, next) ? prev : next;
        });
        return;
      }
      if (Object.is(isOpeningRef.current, value)) {
        return;
      }
      _setIsOpening(value);
    },
    [logSetter]
  );

  const setIsClosing = useCallback(
    (value: Parameters<typeof _setIsClosing>[0]) => {
      logSetter("setIsClosing", value);
      if (typeof value === "function") {
        _setIsClosing((prev) => {
          const next = value(prev);
          return Object.is(prev, next) ? prev : next;
        });
        return;
      }
      if (Object.is(isClosingRef.current, value)) {
        return;
      }
      _setIsClosing(value);
    },
    [logSetter]
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const interval = window.setInterval(() => {
      const counts = setterBumpsRef.current;
      const top = Object.entries(counts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);
      console.log("[top-setters]", top);
      Object.keys(counts).forEach((key) => {
        counts[key] = 0;
      });
    }, 2000);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  const queueSceneTransition = useCallback((nextScene: Scene) => {
    if (typeof window === "undefined") {
      setScene(nextScene);
      return;
    }
    if (sceneRef.current === nextScene) {
      return;
    }
    if (sceneRafRef.current !== null) {
      window.cancelAnimationFrame(sceneRafRef.current);
      sceneRafRef.current = null;
    }
    if (sceneRafSecondRef.current !== null) {
      window.cancelAnimationFrame(sceneRafSecondRef.current);
      sceneRafSecondRef.current = null;
    }
    sceneRafRef.current = window.requestAnimationFrame(() => {
      sceneRafSecondRef.current = window.requestAnimationFrame(() => {
        setScene(nextScene);
        sceneRafRef.current = null;
        sceneRafSecondRef.current = null;
      });
    });
  }, []);

  const queueFlipPhase = useCallback((nextPhase: FlipPhase) => {
    if (typeof window === "undefined") {
      setFlipPhase(nextPhase);
      return;
    }
    if (flipPhaseRef.current === nextPhase) {
      return;
    }
    if (flipRafRef.current !== null) {
      window.cancelAnimationFrame(flipRafRef.current);
      flipRafRef.current = null;
    }
    if (flipRafSecondRef.current !== null) {
      window.cancelAnimationFrame(flipRafSecondRef.current);
      flipRafSecondRef.current = null;
    }
    flipRafRef.current = window.requestAnimationFrame(() => {
      flipRafSecondRef.current = window.requestAnimationFrame(() => {
        setFlipPhase(nextPhase);
        flipRafRef.current = null;
        flipRafSecondRef.current = null;
      });
    });
  }, []);

  const spreads = bookData.spreads;

  const totalSpreads = spreads.length;

  const overridesByProjectId = useMemo(() => {
    const overrides: OverridesByProjectId = {};
    if (!PLAYLIST_VIDEO_IDS.length || !videoProjects.length) {
      return overrides;
    }
    videoProjects.forEach((project, index) => {
      overrides[project.id] =
        PLAYLIST_VIDEO_IDS[index % PLAYLIST_VIDEO_IDS.length];
    });
    return overrides;
  }, []);

  const resolveProject = useCallback(
    (project: Project): Project => {
      if (!isVideoProject(project)) {
        return project;
      }
      const overrideId = overridesByProjectId[project.id];
      const finalId = overrideId ?? project.youtubeId ?? project.videoId;
      return {
        ...project,
        youtubeId: finalId ?? project.youtubeId,
        videoId: finalId ?? project.videoId,
        embedUrl: finalId
          ? `https://www.youtube.com/embed/${finalId}?rel=0`
          : project.embedUrl,
        playUrl: finalId
          ? `https://www.youtube.com/watch?v=${finalId}&list=${PLAYLIST_ID}`
          : project.playUrl,
        thumbnailUrl: finalId
          ? `https://i.ytimg.com/vi/${finalId}/hqdefault.jpg`
          : project.thumbnailUrl,
      };
    },
    [overridesByProjectId]
  );

  const resolvePageContent = useCallback(
    (page: PageContent): PageContent => {
      if (page.kind !== "project") {
        return page;
      }
      const resolvedProject = resolveProject(page.project);
      if (resolvedProject === page.project) {
        return page;
      }
      return {
        ...page,
        project: resolvedProject,
      };
    },
    [resolveProject]
  );

  const openBook = useCallback(() => {
    if (isAnimatingRef.current || scene !== "coverClosed") {
      return;
    }
    isAnimatingRef.current = true;
    setIsAnimating(true);
    setScene("openingArmed");
    queueSceneTransition("opening");
    setIsOpening(true);
    setIsClosing(false);
  }, [scene, queueSceneTransition]);

  const handleCoverOpened = useCallback(() => {
    isAnimatingRef.current = false;
    unstable_batchedUpdates(() => {
      setIsOpening(false);
      setIsClosing(false);
      setScene("bookOpen");
      setLeftPageIndex(0);
      setRightPageIndex(0);
      setFlipPageIndex(null);
      setFlipSide(null);
      setFlipDirection(null);
      pendingSyncRef.current = null;
      setTurnState("idle");
      setIsAnimating(false);
    });
  }, []);

  const closeBook = useCallback(() => {
    if (isAnimatingRef.current || scene !== "bookOpen" || turnState !== "idle") {
      return;
    }
    if (leftPageIndex !== 0 || rightPageIndex !== 0) {
      return;
    }
    isAnimatingRef.current = true;
    setIsAnimating(true);
    setScene("closingArmed");
    queueSceneTransition("closing");
    setIsOpening(false);
    setIsClosing(true);
  }, [scene, turnState, leftPageIndex, rightPageIndex, queueSceneTransition]);

  const handleCoverClosed = useCallback(() => {
    isAnimatingRef.current = false;
    unstable_batchedUpdates(() => {
      setIsClosing(false);
      setIsOpening(false);
      setScene("coverClosed");
      setLeftPageIndex(0);
      setRightPageIndex(0);
      setFlipPageIndex(null);
      setFlipSide(null);
      setFlipDirection(null);
      pendingSyncRef.current = null;
      setTurnState("idle");
      setIsAnimating(false);
    });
  }, []);

  const isAtStart = leftPageIndex === 0 && rightPageIndex === 0;
  const canFlipForward =
    scene === "bookOpen" && leftPageIndex < totalSpreads - 1;
  const canFlipBack = scene === "bookOpen" && leftPageIndex > 0;
  const canCloseBook =
    scene === "bookOpen" &&
    isAtStart &&
    turnState === "idle" &&
    !isAnimating;

  const startFlip = useCallback(
    (direction: "forward" | "back") => {
      if (flipPhase !== "idle") {
        return;
      }
      if (isAnimatingRef.current || scene !== "bookOpen") {
        return;
      }
      if (direction === "forward" && !canFlipForward) {
        return;
      }
      if (direction === "back" && !canFlipBack) {
        return;
      }

      const delta = direction === "forward" ? 1 : -1;
      const oldLeft = leftPageIndex;
      const oldRight = rightPageIndex;
      const from = oldLeft;
      const to = Math.min(totalSpreads - 1, Math.max(0, from + delta));
      if (to === from) {
        return;
      }

      const turningIndexForStart =
        direction === "forward" ? from : from - 1;
      const turningSheetIdForStart =
        turningIndexForStart >= 0 && turningIndexForStart < spreads.length
          ? spreads[turningIndexForStart]?.id ?? null
          : null;

      if (debugEnabled && typeof window !== "undefined") {
        console.log("[flip] start", {
          currentSpread: from,
          nextSpread: to,
          turningSheetId: turningSheetIdForStart,
        });
      }

      isAnimatingRef.current = true;
      setIsAnimating(true);
      setFlipPhase("prepare");
      queueFlipPhase("turn");
      setTurnState(direction === "forward" ? "flippingForward" : "flippingBack");
      setFlipDirection(direction === "forward" ? "forward" : "backward");
      if (direction === "forward") {
        setFlipSide("right");
        setFlipPageIndex(oldRight);
        pendingSyncRef.current = { side: "left", target: to };
        setRightPageIndex(to);
      } else {
        setFlipSide("left");
        setFlipPageIndex(oldLeft);
        pendingSyncRef.current = { side: "right", target: to };
        setLeftPageIndex(to);
      }
    },
    [
      flipPhase,
      scene,
      canFlipForward,
      canFlipBack,
      leftPageIndex,
      rightPageIndex,
      totalSpreads,
      spreads,
      debugEnabled,
      queueFlipPhase,
    ]
  );

  const handleBackAction = useCallback(() => {
    if (scene !== "bookOpen") {
      return;
    }
    if (leftPageIndex === 0) {
      closeBook();
      return;
    }
    startFlip("back");
  }, [scene, leftPageIndex, closeBook, startFlip]);

  const isInteractiveTarget = useCallback((target: EventTarget | null) => {
    if (!(target instanceof Element)) {
      return false;
    }
    return Boolean(target.closest('[data-interactive="true"]'));
  }, []);

  const isFlippingForward = turnState === "flippingForward";
  const isFlippingBack = turnState === "flippingBack";
  const stableSpreadIndex =
    isFlippingBack && flipPageIndex !== null ? flipPageIndex : leftPageIndex;
  const pendingSpreadIndex =
    isFlippingBack && flipPageIndex !== null
      ? clamp(flipPageIndex - 1, 0, totalSpreads - 1)
      : null;
  const stableSpread = spreads[stableSpreadIndex] ?? backMatter;
  const pendingSpread =
    pendingSpreadIndex !== null ? spreads[pendingSpreadIndex] ?? backMatter : null;
  const leftSpread = spreads[leftPageIndex] ?? backMatter;
  const rightSpread = spreads[rightPageIndex] ?? backMatter;
  const flipSourceSpread =
    flipPageIndex !== null ? spreads[flipPageIndex] ?? backMatter : null;
  const flipTargetSpread =
    flipSide === "right"
      ? rightSpread
      : flipSide === "left"
      ? leftSpread
      : null;
  const turningFrontRaw = isFlippingBack
    ? pendingSpread?.right ?? rightSpread.right
    : flipSide === "right"
    ? flipSourceSpread?.right ?? rightSpread.right
    : flipSide === "left"
    ? flipSourceSpread?.left ?? leftSpread.left
    : rightSpread.right;
  const turningBackRaw = isFlippingBack
    ? stableSpread.left
    : flipSide === "right"
    ? flipTargetSpread?.left ?? leftSpread.left
    : flipSide === "left"
    ? flipTargetSpread?.right ?? rightSpread.right
    : leftSpread.left;
  const flipFrontSide: "left" | "right" = isFlippingBack
    ? "right"
    : flipSide === "left"
    ? "left"
    : "right";
  const flipBackSide: "left" | "right" = isFlippingBack
    ? "left"
    : flipSide === "left"
    ? "right"
    : "left";
  const flipFrontKey = `${flipFrontSide}-${
    isFlippingBack ? pendingSpreadIndex ?? "none" : flipPageIndex ?? "none"
  }`;
  const flipBackIndex = isFlippingBack
    ? stableSpreadIndex
    : flipSide === "right"
    ? rightPageIndex
    : flipSide === "left"
    ? leftPageIndex
    : null;
  const flipBackKey = `${flipBackSide}-${flipBackIndex ?? "none"}`;
  const getPageNumber = useCallback(
    (spreadIndex: number | null, side: "left" | "right") => {
      if (spreadIndex === null) {
        return null;
      }
      return spreadIndex * 2 + (side === "left" ? 1 : 2);
    },
    []
  );
  const leftPageNumber = getPageNumber(leftPageIndex, "left");
  const rightPageNumber = getPageNumber(rightPageIndex, "right");
  const flipFrontSpreadIndex = isFlippingBack ? pendingSpreadIndex : flipPageIndex;
  const flipBackSpreadIndex = flipBackIndex;
  const turningFrontPageNumber = getPageNumber(flipFrontSpreadIndex, flipFrontSide);
  const turningBackPageNumber = getPageNumber(flipBackSpreadIndex, flipBackSide);
  const turningSheetClasses = useMemo(() => {
    const classes = ["sheet", "turning-sheet"];
    if (flipPhase === "idle") {
      classes.push("is-hidden");
      return classes.join(" ");
    }
    if (flipPhase === "prepare") {
      classes.push("pre-turn");
      if (isFlippingBack) {
        classes.push("is-turned", "turn-back");
      } else if (isFlippingForward) {
        classes.push("turn-forward");
      }
      return classes.join(" ");
    }
    classes.push("is-turning");
    if (isFlippingForward) {
      classes.push("turn-forward");
    } else if (isFlippingBack) {
      classes.push("turn-back");
    }
    return classes.join(" ");
  }, [flipPhase, isFlippingBack, isFlippingForward]);

  const prefetchIndices = useMemo(() => {
    if (scene !== "bookOpen" || turnState !== "idle") {
      return [];
    }
    const candidate = [
      leftPageIndex - 1,
      leftPageIndex + 1,
      rightPageIndex - 1,
      rightPageIndex + 1,
    ];
    const unique = Array.from(
      new Set(candidate.filter((index) => index >= 0 && index < totalSpreads))
    );
    return unique.filter(
      (index) => index !== leftPageIndex && index !== rightPageIndex
    );
  }, [scene, turnState, leftPageIndex, rightPageIndex, totalSpreads]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isAnimatingRef.current) return;
      const key = event.key;

      if (scene === "coverClosed") {
        if (key === "Enter" || key === " " || key === "ArrowRight") {
          event.preventDefault();
          openBook();
        }
        return;
      }

      if (key === "ArrowRight" || key === "PageDown") {
        event.preventDefault();
        startFlip("forward");
      }

      if (key === "ArrowLeft" || key === "PageUp") {
        event.preventDefault();
        handleBackAction();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [scene, openBook, startFlip, handleBackAction]);

  const handleWheelNative = useCallback(
    (event: WheelEvent) => {
      if (wheelLockRef.current) {
        event.preventDefault();
        return;
      }
      if (isInteractiveTarget(event.target)) {
        return;
      }
      event.preventDefault();

      const now = typeof performance !== "undefined" ? performance.now() : Date.now();
      if (now - lastWheelTsRef.current > 140) {
        wheelAccumRef.current = 0;
      }
      lastWheelTsRef.current = now;

      wheelAccumRef.current += event.deltaY;
      if (wheelRafRef.current !== null) {
        return;
      }

      wheelRafRef.current = window.requestAnimationFrame(() => {
        wheelRafRef.current = null;
        const v = wheelAccumRef.current;
        if (Math.abs(v) < WHEEL_THRESHOLD) {
          wheelAccumRef.current = v * 0.5;
          return;
        }
        wheelAccumRef.current = 0;
        wheelLockRef.current = true;

        const dir = v > 0 ? "forward" : "back";
        if (scene === "coverClosed") {
          openBook();
        } else {
          startFlip(dir);
        }

        if (wheelUnlockTimeoutRef.current !== null) {
          window.clearTimeout(wheelUnlockTimeoutRef.current);
        }
        wheelUnlockTimeoutRef.current = window.setTimeout(() => {
          wheelLockRef.current = false;
        }, WHEEL_LOCK_MS);
      });
    },
    [isInteractiveTarget, scene, openBook, startFlip]
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const target = bookRootRef.current;
    if (!target) {
      return;
    }
    target.addEventListener("wheel", handleWheelNative, { passive: false });
    return () => {
      target.removeEventListener("wheel", handleWheelNative);
    };
  }, [handleWheelNative]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const target = bookRootRef.current;
    if (!target) {
      return;
    }

    const tilt = tiltRef.current;
    if (reducedMotion) {
      if (tilt.raf) {
        window.cancelAnimationFrame(tilt.raf);
        tilt.raf = 0;
      }
      tilt.x = 0;
      tilt.y = 0;
      tilt.tx = 0;
      tilt.ty = 0;
      tilt.nx = 0;
      tilt.ny = 0;
      tilt.active = false;
      target.style.transform = "";
      target.style.setProperty("--glint-opacity", "0");
      target.style.setProperty("--glint-x", "50%");
      target.style.setProperty("--glint-y", "50%");
      return;
    }

    const finePointerQuery = window.matchMedia("(pointer: fine)");
    if (!finePointerQuery.matches) {
      target.style.transform = "";
      return;
    }

    const reducedMotionQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );
    const maxTilt = 8;
    const maxTranslateZ = 12;
    const ease = 0.12;
    const idleThreshold = 0.02;

    const applyTilt = () => {
      tilt.raf = 0;
      if (!finePointerQuery.matches) {
        tilt.x = 0;
        tilt.y = 0;
        tilt.tx = 0;
        tilt.ty = 0;
        tilt.nx = 0;
        tilt.ny = 0;
        tilt.active = false;
        target.style.transform = "";
        target.style.setProperty("--glint-opacity", "0");
        target.style.setProperty("--glint-x", "50%");
        target.style.setProperty("--glint-y", "50%");
        return;
      }
      if (reducedMotionQuery.matches) {
        tilt.x = 0;
        tilt.y = 0;
        tilt.tx = 0;
        tilt.ty = 0;
        tilt.nx = 0;
        tilt.ny = 0;
        tilt.active = false;
        target.style.transform = "";
        target.style.setProperty("--glint-opacity", "0");
        target.style.setProperty("--glint-x", "50%");
        target.style.setProperty("--glint-y", "50%");
        return;
      }

      tilt.x += (tilt.tx - tilt.x) * ease;
      tilt.y += (tilt.ty - tilt.y) * ease;

      const magnitude = Math.min(
        1,
        Math.hypot(tilt.x, tilt.y) / maxTilt
      );
      const translateZ = maxTranslateZ * magnitude;
      const isIdle =
        Math.abs(tilt.x) < idleThreshold &&
        Math.abs(tilt.y) < idleThreshold &&
        Math.abs(tilt.tx) < idleThreshold &&
        Math.abs(tilt.ty) < idleThreshold;

      if (isIdle) {
        tilt.x = 0;
        tilt.y = 0;
        tilt.tx = 0;
        tilt.ty = 0;
        tilt.nx = 0;
        tilt.ny = 0;
        target.style.transform = "";
        target.style.setProperty("--glint-opacity", "0");
        target.style.setProperty("--glint-x", "50%");
        target.style.setProperty("--glint-y", "50%");
        return;
      }

      target.style.transform = `perspective(1200px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateZ(${translateZ}px)`;
      const glintOpacity = Math.min(0.7, magnitude * 0.9);
      const glintX = 50 + tilt.ny * 40;
      const glintY = 50 + tilt.nx * 40;
      target.style.setProperty("--glint-opacity", glintOpacity.toFixed(3));
      target.style.setProperty("--glint-x", `${glintX}%`);
      target.style.setProperty("--glint-y", `${glintY}%`);
      tilt.raf = window.requestAnimationFrame(applyTilt);
    };

    const scheduleTilt = () => {
      if (tilt.raf) {
        return;
      }
      tilt.raf = window.requestAnimationFrame(applyTilt);
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (!finePointerQuery.matches) {
        return;
      }
      if (reducedMotionQuery.matches) {
        return;
      }
      if (isInteractiveTarget(event.target)) {
        tilt.tx = 0;
        tilt.ty = 0;
        tilt.active = false;
        scheduleTilt();
        return;
      }

      const rect = target.getBoundingClientRect();
      if (!rect.width || !rect.height) {
        return;
      }

      const nx = (event.clientX - rect.left) / rect.width;
      const ny = (event.clientY - rect.top) / rect.height;
      const normalizedX = clamp(nx * 2 - 1, -1, 1);
      const normalizedY = clamp(ny * 2 - 1, -1, 1);
      const animScale = isAnimatingRef.current ? 0.3 : 1;

      tilt.tx = clamp(normalizedY * -maxTilt * animScale, -maxTilt, maxTilt);
      tilt.ty = clamp(normalizedX * maxTilt * animScale, -maxTilt, maxTilt);
      tilt.nx = normalizedX;
      tilt.ny = normalizedY;
      tilt.active = true;
      scheduleTilt();
    };

    const handlePointerLeave = () => {
      tilt.tx = 0;
      tilt.ty = 0;
      tilt.nx = 0;
      tilt.ny = 0;
      tilt.active = false;
      scheduleTilt();
    };

    target.addEventListener("pointermove", handlePointerMove, { passive: true });
    target.addEventListener("pointerleave", handlePointerLeave, {
      passive: true,
    });

    return () => {
      target.removeEventListener("pointermove", handlePointerMove);
      target.removeEventListener("pointerleave", handlePointerLeave);
      if (tilt.raf) {
        window.cancelAnimationFrame(tilt.raf);
        tilt.raf = 0;
      }
      target.style.transform = "";
      target.style.setProperty("--glint-opacity", "0");
      target.style.setProperty("--glint-x", "50%");
      target.style.setProperty("--glint-y", "50%");
    };
  }, [isInteractiveTarget, reducedMotion]);

  const handleTouchStart = useCallback(
    (event: ReactTouchEvent<HTMLDivElement>) => {
      if (isAnimatingRef.current) return;
      if (isInteractiveTarget(event.target)) return;
      const touch = event.touches[0];
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
      };
    },
    [isInteractiveTarget]
  );

  const handleTouchEnd = useCallback(
    (event: ReactTouchEvent<HTMLDivElement>) => {
      if (isAnimatingRef.current) return;
      if (isInteractiveTarget(event.target)) return;
      const start = touchStartRef.current;
      if (!start) return;

      const touch = event.changedTouches[0];
      const dx = touch.clientX - start.x;
      const dy = touch.clientY - start.y;
      const dt = Date.now() - start.time;

      touchStartRef.current = null;

      if (dt > 900) return;
      if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) < Math.abs(dy)) {
        return;
      }

      if (scene === "coverClosed") {
        openBook();
        return;
      }

      if (dx < 0) {
        startFlip("forward");
      } else {
        handleBackAction();
      }
    },
    [isInteractiveTarget, scene, openBook, startFlip, handleBackAction]
  );

  const handleJump = useCallback(
    (spreadIndex: number) => {
      if (scene !== "bookOpen" || isAnimatingRef.current) {
        return;
      }
      if (spreadIndex < 0 || spreadIndex >= totalSpreads) {
        return;
      }
      setLeftPageIndex(spreadIndex);
      setRightPageIndex(spreadIndex);
      setFlipPageIndex(null);
      setFlipSide(null);
      setFlipDirection(null);
      pendingSyncRef.current = null;
      setTurnState("idle");
    },
    [scene, totalSpreads, setLeftPageIndex, setRightPageIndex, setFlipPageIndex, setFlipSide, setFlipDirection, setTurnState]
  );

  const handleExternalJump = useCallback(
    (spreadIndex: number) => {
      const target = clamp(Math.round(spreadIndex), 0, totalSpreads - 1);
      externalJumpRef.current = target;
      if (scene === "coverClosed") {
        openBook();
        return;
      }
      if (isAnimatingRef.current || flipPhaseRef.current !== "idle") {
        return;
      }
      if (target === leftPageIndex) {
        externalJumpRef.current = null;
        return;
      }
      const direction = target > leftPageIndex ? "forward" : "back";
      const canFlip = direction === "forward" ? canFlipForward : canFlipBack;
      if (!canFlip) {
        externalJumpRef.current = null;
        return;
      }
      startFlip(direction);
    },
    [scene, totalSpreads, openBook, leftPageIndex, canFlipForward, canFlipBack, startFlip]
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const listener = (event: Event) => {
      const custom = event as CustomEvent<{ spreadIndex?: number }>;
      const spreadIndex = custom?.detail?.spreadIndex;
      if (typeof spreadIndex !== "number" || Number.isNaN(spreadIndex)) {
        return;
      }
      handleExternalJump(spreadIndex);
    };
    window.addEventListener("book:jump", listener);
    return () => {
      window.removeEventListener("book:jump", listener);
    };
  }, [handleExternalJump]);

  useEffect(() => {
    if (scene !== "bookOpen" || isAnimating || flipPhase !== "idle") {
      return;
    }
    const pending = externalJumpRef.current;
    if (typeof pending !== "number") {
      return;
    }
    if (pending === leftPageIndex) {
      externalJumpRef.current = null;
      return;
    }
    const direction = pending > leftPageIndex ? "forward" : "back";
    const canFlip = direction === "forward" ? canFlipForward : canFlipBack;
    if (!canFlip) {
      externalJumpRef.current = null;
      return;
    }
    startFlip(direction);
  }, [scene, isAnimating, flipPhase, leftPageIndex, canFlipForward, canFlipBack, startFlip]);

  const readCssVars = useCallback((element: Element | null) => {
    if (!element || typeof window === "undefined") {
      return null;
    }
    const style = window.getComputedStyle(element);
    const readVar = (name: string) => style.getPropertyValue(name).trim();
    return {
      "--paper": readVar("--paper"),
      "--bg": readVar("--bg"),
      "--text": readVar("--text"),
    };
  }, []);

  const logElementStyles = useCallback((label: string, element: Element | null) => {
    if (!element || typeof window === "undefined") {
      console.info(`[flip-debug] ${label}: n/a`);
      return;
    }

    const style = window.getComputedStyle(element);
    const before = window.getComputedStyle(element, "::before");
    const after = window.getComputedStyle(element, "::after");

    console.info(`[flip-debug] ${label}`, {
      element,
      className: element instanceof HTMLElement ? element.className : "",
      opacity: style.opacity,
      visibility: style.visibility,
      zIndex: style.zIndex,
      pointerEvents: style.pointerEvents,
      backgroundColor: style.backgroundColor,
      backgroundImage: style.backgroundImage,
      beforeOpacity: before.opacity,
      beforeVisibility: before.visibility,
      beforeZIndex: before.zIndex,
      beforeBackgroundColor: before.backgroundColor,
      beforeBackgroundImage: before.backgroundImage,
      afterOpacity: after.opacity,
      afterVisibility: after.visibility,
      afterZIndex: after.zIndex,
      afterBackgroundColor: after.backgroundColor,
      afterBackgroundImage: after.backgroundImage,
    });
  }, []);

  const logFlipEndDiagnostics = useCallback(
    (nextSpread: number) => {
      if (!debugEnabled || typeof window === "undefined") {
        return;
      }

      const pagesRect = pagesRef.current?.getBoundingClientRect();
      const sampleX = pagesRect ? pagesRect.left + pagesRect.width * 0.25 : 0;
      const sampleY = pagesRect ? pagesRect.top + pagesRect.height * 0.5 : 0;
      const hit = pagesRect ? document.elementFromPoint(sampleX, sampleY) : null;
      const leftCandidate =
        hit?.closest(
          ".page-surface, .sheet-face, .sheet, .cover-inside, .cover-endpaper"
        ) ?? null;

      console.groupCollapsed(`[flip-debug] end spread=${nextSpread}`);
      logElementStyles("left-page", leftPageRef.current);
      logElementStyles("left-candidate", leftCandidate);
      if (hit && hit !== leftCandidate) {
        logElementStyles("hit-element", hit);
      }
      console.info(`[flip-debug] vars`, {
        root: readCssVars(document.documentElement),
        book: readCssVars(bookRootRef.current),
      });
      console.groupEnd();
    },
    [debugEnabled, logElementStyles, readCssVars]
  );

  useEffect(() => {
    if (flipPhase !== "turn") {
      return;
    }
    if (flipPageIndex === null || flipSide === null) {
      return;
    }

    const targetSpread =
      flipSide === "right"
        ? rightPageIndex
        : flipSide === "left"
        ? leftPageIndex
        : null;
    const sheet = turningSheetRef.current;
    if (!sheet) {
      return;
    }

    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      const nextSpread = targetSpread;
      isAnimatingRef.current = false;
      if (debugEnabled && typeof window !== "undefined") {
        console.log("[flip] end", {
          currentSpread: leftPageIndexRef.current,
          targetSpread,
          nextSpread,
        });
      }
      unstable_batchedUpdates(() => {
        setFlipPageIndex(null);
        setFlipSide(null);
        setFlipDirection(null);
        setTurnState("idle");
        setFlipPhase("idle");
        setIsAnimating(false);
      });
      if (debugEnabled && typeof window !== "undefined") {
        window.requestAnimationFrame(() => {
          logFlipEndDiagnostics(nextSpread);
        });
      }
      if (flipTimeoutRef.current) {
        window.clearTimeout(flipTimeoutRef.current);
        flipTimeoutRef.current = null;
      }
    };

    const onTransitionEnd = (event: TransitionEvent) => {
      if (event.target !== sheet) {
        return;
      }
      if (event.propertyName !== "transform") {
        return;
      }
      finish();
    };

    sheet.addEventListener("transitionend", onTransitionEnd, { once: true });
    flipTimeoutRef.current = window.setTimeout(
      finish,
      Math.round(FLIP_DURATION * 1.2)
    );

    return () => {
      sheet.removeEventListener("transitionend", onTransitionEnd);
      if (flipTimeoutRef.current) {
        window.clearTimeout(flipTimeoutRef.current);
        flipTimeoutRef.current = null;
      }
    };
  }, [
    flipPageIndex,
    flipSide,
    leftPageIndex,
    rightPageIndex,
    debugEnabled,
    logFlipEndDiagnostics,
    flipPhase,
  ]);

  useEffect(() => {
    if (flipPhase !== "idle" || isAnimating) {
      return;
    }
    const pending = pendingSyncRef.current;
    if (!pending) {
      return;
    }
    pendingSyncRef.current = null;
    if (pending.side === "left") {
      setLeftPageIndex(pending.target);
    } else {
      setRightPageIndex(pending.target);
    }
  }, [flipPhase, isAnimating, setLeftPageIndex, setRightPageIndex]);

  useEffect(() => {
    if (!debugEnabled) {
      return;
    }
    console.log(
      `[flip] phase=${flipPhase} side=${flipSide ?? "none"} from=${flipPageIndex ?? "none"} left=${leftPageIndex} right=${rightPageIndex}`
    );
  }, [flipPhase, debugEnabled, flipSide, flipPageIndex, leftPageIndex, rightPageIndex]);

  const handleDebugClick = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      if (!debugEnabled || typeof window === "undefined") {
        return;
      }
      if (isInteractiveTarget(event.target)) {
        return;
      }

      const pagesRect = pagesRef.current?.getBoundingClientRect();
      const sampleX = pagesRect
        ? pagesRect.left + pagesRect.width * 0.25
        : event.clientX;
      const sampleY = pagesRect
        ? pagesRect.top + pagesRect.height * 0.5
        : event.clientY;

      const hit = document.elementFromPoint(sampleX, sampleY);
      const leftCandidate =
        hit?.closest(
          ".page-surface, .sheet-face, .sheet, .cover-inside, .cover-endpaper"
        ) ?? null;

      console.groupCollapsed(
        `[flip-debug] click left=${leftPageIndex} right=${rightPageIndex} scene=${scene} turnState=${turnState} flipSide=${flipSide ?? "none"}`
      );
      console.info(`[flip-debug] left-hit-point`, {
        x: Math.round(sampleX),
        y: Math.round(sampleY),
        hit,
        leftCandidate,
      });
      logElementStyles("left-candidate", leftCandidate);
      logElementStyles("left-page", leftPageRef.current);
      if (hit && hit !== leftCandidate) {
        logElementStyles("hit-element", hit);
      }
      console.info(`[flip-debug] vars`, {
        root: readCssVars(document.documentElement),
        book: readCssVars(bookRootRef.current),
      });
      console.groupEnd();
    },
    [
      debugEnabled,
      leftPageIndex,
      rightPageIndex,
      scene,
      turnState,
      flipSide,
      isInteractiveTarget,
      logElementStyles,
      readCssVars,
    ]
  );

  useEffect(() => {
    if (!debugEnabled || typeof document === "undefined") {
      return;
    }
    const playlistIds = new Set(PLAYLIST_VIDEO_IDS);
    if (!playlistIds.size) {
      return;
    }
    const iframes = Array.from(
      document.querySelectorAll<HTMLIFrameElement>(
        'iframe[src*="youtube.com/embed"]'
      )
    );
    for (const iframe of iframes) {
      const src = iframe.getAttribute("src") ?? "";
      const match = src.match(/\/embed\/([a-zA-Z0-9_-]+)/);
      if (!match) {
        continue;
      }
      const id = match[1];
      if (!playlistIds.has(id)) {
        console.error("Non-playlist video iframe", src);
      }
    }
  }, [debugEnabled, leftPageIndex, rightPageIndex, scene]);

  useEffect(() => {
    if (!debugEnabled || typeof document === "undefined") {
      return;
    }

    const interactiveElements = Array.from(
      document.querySelectorAll<HTMLElement>('[data-interactive="true"]')
    );
    interactiveElements.forEach((element) => {
      element.style.outline = "2px dashed #f5b041";
      element.style.outlineOffset = "2px";
    });

    const blockers = new Set<HTMLElement>();
    interactiveElements.forEach((element) => {
      const rect = element.getBoundingClientRect();
      if (!rect.width || !rect.height) {
        return;
      }
      const x = rect.left + rect.width * 0.5;
      const y = rect.top + rect.height * 0.5;
      const stack = document.elementsFromPoint(x, y);
      const top = stack[0] as HTMLElement | undefined;
      if (!top) {
        return;
      }
      if (element.contains(top) || top.closest('[data-interactive="true"]')) {
        return;
      }
      const style = window.getComputedStyle(top);
      if (style.pointerEvents !== "none") {
        blockers.add(top);
        console.warn("[debug] overlay blocks interactive", {
          interactive: element,
          blocker: top,
          pointerEvents: style.pointerEvents,
          zIndex: style.zIndex,
        });
      }
    });

    blockers.forEach((element) => {
      element.style.outline = "2px solid #f39c12";
      element.style.outlineOffset = "-2px";
      element.dataset.debugOverlay = "true";
    });

    return () => {
      interactiveElements.forEach((element) => {
        element.style.outline = "";
        element.style.outlineOffset = "";
      });
      blockers.forEach((element) => {
        if (element.dataset.debugOverlay === "true") {
          element.style.outline = "";
          element.style.outlineOffset = "";
          delete element.dataset.debugOverlay;
        }
      });
    };
  }, [debugEnabled, scene, leftPageIndex, rightPageIndex, isAnimating]);

  const renderSpreadIndex = leftPageIndex;
  const isPageVisibleNow = scene === "bookOpen";
  const allowIframe = isPageVisibleNow;
  return (
    <div className="book-frame">
      <div
        className={`book-root${isAnimating ? " is-locked" : ""}`}
        ref={bookRootRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={(event) => {
          if (isInteractiveTarget(event.target)) {
            return;
          }
          if (scene === "coverClosed") {
            openBook();
          }
        }}
        role="region"
        aria-label="Portfolio book"
        data-reduced-motion={reducedMotion ? "true" : "false"}
        data-scene={scene}
        data-flip-phase={flipPhase}
        data-debug={debugEnabled ? "true" : "false"}
        style={
          reducedMotion
            ? ({ "--cover-duration": "0.01ms", "--flip-duration": "0.01ms" } as CSSProperties)
            : ({ "--cover-duration": `${COVER_OPEN_DURATION}ms`, "--flip-duration": `${FLIP_DURATION}ms` } as CSSProperties)
        }
      >
        <div className="book-geometry">
        <CoverClosed
          title="Portfolio Book"
          subtitle="Senior Front-End Developer"
          onOpened={handleCoverOpened}
          onClosed={handleCoverClosed}
          isOpening={isOpening}
          isClosing={isClosing}
        />
        <div className="open-book pages" ref={pagesRef} onClick={handleDebugClick}>
          {prefetchIndices.length > 0 ? (
            <div className="spread-layer prefetch" aria-hidden="true">
              {prefetchIndices.map((spreadIndex) => {
                const spread = spreads[spreadIndex] ?? backMatter;
                const leftNumber = getPageNumber(spreadIndex, "left");
                const rightNumber = getPageNumber(spreadIndex, "right");
                return (
                  <div
                    className="prefetch-spread"
                    key={`prefetch-${spread.id}-${spreadIndex}`}
                  >
                    <div className="page-surface left-page prefetch-left">
                      <Page
                        key={`prefetch-left-${spreadIndex}`}
                        page={resolvePageContent(spread.left)}
                        side="left"
                        shouldLoadMedia={false}
                        isActive={false}
                        allowIframe={false}
                        pageNumber={leftNumber}
                      />
                    </div>
                    <div className="page-surface right-page prefetch-right">
                      <Page
                        key={`prefetch-right-${spreadIndex}`}
                        page={resolvePageContent(spread.right)}
                        side="right"
                        shouldLoadMedia={false}
                        isActive={false}
                        allowIframe={false}
                        pageNumber={rightNumber}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}
          <div className="spread-layer underlay">
            <div className="page-surface left-page underlay-left">
              <Page
                key={`underlay-left-${leftPageIndex}`}
                page={resolvePageContent(leftSpread.left)}
                side="left"
                onJump={handleJump}
                shouldLoadMedia={false}
                isActive={false}
                allowIframe={false}
                pageNumber={leftPageNumber}
              />
            </div>
            <div className="page-surface right-page underlay-right">
              <Page
                key={`underlay-right-${rightPageIndex}`}
                page={resolvePageContent(rightSpread.right)}
                side="right"
                onJump={handleJump}
                shouldLoadMedia={false}
                isActive={false}
                allowIframe={false}
                pageNumber={rightPageNumber}
              />
            </div>
          </div>

          <div className="spread-layer stationary">
            <div className="page-surface left-page stationary-left" ref={leftPageRef}>
              <Page
                key={`stationary-left-${leftPageIndex}`}
                page={resolvePageContent(leftSpread.left)}
                side="left"
                onJump={handleJump}
                shouldLoadMedia={allowIframe}
                isActive={isPageVisibleNow}
                allowIframe={allowIframe}
                pageNumber={leftPageNumber}
              />
            </div>
            <div className="page-surface right-page stationary-right">
              <Page
                key={`stationary-right-${rightPageIndex}`}
                page={resolvePageContent(rightSpread.right)}
                side="right"
                onJump={handleJump}
                shouldLoadMedia={allowIframe}
                isActive={isPageVisibleNow}
                allowIframe={allowIframe}
                pageNumber={rightPageNumber}
              />
            </div>
          </div>

          <div className={turningSheetClasses} ref={turningSheetRef}>
            <div className="sheet-face sheet-front page-front">
              <Page
                key={`flip-front-${flipFrontKey}`}
                page={resolvePageContent(turningFrontRaw)}
                side={flipFrontSide}
                onJump={handleJump}
                shouldLoadMedia={false}
                isActive={false}
                allowIframe={false}
                pageNumber={turningFrontPageNumber}
              />
            </div>
            <div className="sheet-face sheet-back page-back">
              <Page
                key={`flip-back-${flipBackKey}`}
                page={resolvePageContent(turningBackRaw)}
                side={flipBackSide}
                onJump={handleJump}
                shouldLoadMedia={false}
                isActive={false}
                allowIframe={false}
                pageNumber={turningBackPageNumber}
              />
            </div>
          </div>

          <div className="gutter" aria-hidden="true" />
        </div>
      </div>

      <button
        type="button"
        className="nav-button nav-prev"
        onClick={handleBackAction}
        aria-label="Previous spread"
        disabled={
          scene === "coverClosed" ||
          (isAtStart ? !canCloseBook : isAnimating || !canFlipBack)
        }
      >
        Prev
      </button>
      <button
        type="button"
        className="nav-button nav-next"
        onClick={() => {
          if (scene === "coverClosed") {
            openBook();
            return;
          }
          startFlip("forward");
        }}
        aria-label="Next spread"
        disabled={isAnimating || (scene === "bookOpen" && !canFlipForward)}
      >
        {scene === "bookOpen" ? "Next" : "Open"}
      </button>
      {debugEnabled ? (
        <div
          aria-hidden="true"
          style={{
            position: "fixed",
            top: 12,
            left: 12,
            zIndex: 10000,
            background: "rgba(0, 0, 0, 0.75)",
            color: "#fff",
            padding: "6px 8px",
            borderRadius: 4,
            fontFamily:
              "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
            fontSize: 12,
            lineHeight: 1.4,
            pointerEvents: "none",
          }}
        >
          <div>scene: {scene}</div>
          <div>isAnimating: {String(isAnimating)}</div>
          <div>leftPageIndex: {leftPageIndex}</div>
          <div>rightPageIndex: {rightPageIndex}</div>
          <div>flipPageIndex: {flipPageIndex ?? "null"}</div>
          <div>flipSide: {flipSide ?? "null"}</div>
          <div>flipDirection: {flipDirection ?? "null"}</div>
          <div>renderSpreadIndex: {renderSpreadIndex}</div>
          <div>flipPhase: {flipPhase}</div>
          <div>turnState: {turnState}</div>
        </div>
      ) : null}
    </div>
    </div>
  );
}

export default memo(Book);
