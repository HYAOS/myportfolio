export type TocItem = {
  label: string;
  spreadIndex: number;
};

export type Project = {
  id: string;
  title: string;
  summary: string;
  tags: string[];
  image?: string;
  youtubeId?: string;
  videoId?: string;
  embedUrl?: string;
  playUrl?: string;
  thumbnail?: string;
  thumbnailUrl?: string;
  link?: string;
};

export type PageContent =
  | {
      kind: "title";
      title: string;
      subtitle: string;
      body?: string;
    }
  | {
      kind: "toc";
      title: string;
      items: TocItem[];
    }
  | {
      kind: "text";
      title: string;
      body: string;
      list?: string[];
    }
  | {
      kind: "project";
      title?: string;
      project: Project;
    }
  | {
      kind: "playlist";
      title: string;
      playlistId: string;
      description?: string;
    }
  | {
      kind: "quote";
      quote: string;
      author?: string;
    }
  | {
      kind: "image";
      src: string;
      alt: string;
      caption?: string;
    }

  | {
      kind: "contact";
      title: string;
      body: string;
      links: { label: string; href: string }[];
    };

export type Spread = {
  id: string;
  left: PageContent;
  right: PageContent;
};

export const PLAYLIST_VIDEO_IDS = [
  "OsdR5UpwtCw",
  "FOH1UHGBZqk",
  "ruWjeoYDLP4",
  "f3KJuA44Mts",
  "g-cThUCs9j0",
  "JMgpveMH1bI",
];

const page5PhotoUrl = new URL("../page/mika.jpg", import.meta.url).href;
const page6PhotoUrl = new URL("../page/mika2.jpg", import.meta.url).href;
const page9PhotoUrl = new URL("../page/mika3.jpg", import.meta.url).href;
const page10PhotoUrl = new URL("../page/mika4.png", import.meta.url).href;
const page13PhotoUrl = new URL("../page/mikaorig.png", import.meta.url).href;
const page14PhotoUrl = new URL("../page/mikakr.png", import.meta.url).href;

const projects: Project[] = [
  {
    id: "atlas-weather",
    title: "Atlas Weather",
    summary: "Micro-forecasting dashboard with realtime station overlays.",
    tags: ["React", "WebGL", "Maps"],
    image:
      "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=900&q=80",
    link: "https://example.com/atlas",
  },
  {
    id: "signal-studio",
    title: "Signal Studio",
    summary: "Audio timeline editor with collaborative markers.",
    tags: ["TypeScript", "Audio", "UI"],
    youtubeId: PLAYLIST_VIDEO_IDS[0],
    link: "https://example.com/signal",
  },
  {
    id: "route-planner",
    title: "Route Planner",
    summary: "Logistics planner that balances cost, time, and emissions.",
    tags: ["Data Viz", "Routing", "UX"],
    image:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80",
    link: "https://example.com/route",
  },
  {
    id: "kite-launch",
    title: "Kite Launch",
    summary: "Product walkthrough video for a drone launch system.",
    tags: ["Storytelling", "3D", "Motion"],
    youtubeId: PLAYLIST_VIDEO_IDS[1],
    link: "https://example.com/kite",
  },
  {
    id: "studio-archive",
    title: "Studio Archive",
    summary: "Library interface for 12k assets with smart tagging.",
    tags: ["Search", "Design System", "React"],
    image:
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=900&q=80",
    link: "https://example.com/archive",
  },
  {
    id: "civic-map",
    title: "Civic Map",
    summary: "Civic data explorer with layered narratives.",
    tags: ["Maps", "Civic", "Charts"],
    image:
      "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=900&q=80",
    link: "https://example.com/civic",
  },
  {
    id: "solar-logbook",
    title: "Solar Logbook",
    summary: "Energy logbook with daily and seasonal insights.",
    tags: ["Dashboards", "Analytics", "UI"],
    image:
      "https://images.unsplash.com/photo-1509395176047-4a66953fd231?auto=format&fit=crop&w=900&q=80",
    link: "https://example.com/solar",
  },
  {
    id: "process-reel",
    title: "Process Reel",
    summary: "Short recap of a multi-team design sprint.",
    tags: ["Video", "Prototype", "Team"],
    youtubeId: PLAYLIST_VIDEO_IDS[2],
    link: "https://example.com/reel",
  },
  {
    id: "playlist-video-4",
    title: "Playlist Highlight",
    summary: "Selected clip from the playlist (video 4).",
    tags: ["Video", "Playlist"],
    youtubeId: PLAYLIST_VIDEO_IDS[3],
  },
  {
    id: "playlist-video-5",
    title: "Playlist Highlight",
    summary: "Selected clip from the playlist (video 5).",
    tags: ["Video", "Playlist"],
    youtubeId: PLAYLIST_VIDEO_IDS[4],
  },
  {
    id: "playlist-video-6",
    title: "Playlist Highlight",
    summary: "Selected clip from the playlist (video 6).",
    tags: ["Video", "Playlist"],
    youtubeId: PLAYLIST_VIDEO_IDS[5],
  },
];

export const PLAYLIST_ID = "PLVvfpDWqIyqhR817dgayQqSTX0SvQNlcs";


export const bookData: { spreads: Spread[]; projects: Project[] } = {
  projects,
  spreads: [
    {
      id: "intro",
      left: {
        kind: "title",
        title: "Savchuk Vladyslav",
        subtitle: "Photographer, videographer, video editor, sound engineer",
        body: "Studying Media Production at Hamar katedralskole.",
      },
      right: {
        kind: "toc",
        title: "Table of Contents",
        items: [
          { label: "About", spreadIndex: 1 },
          { label: "Projects I", spreadIndex: 2 },
          { label: "Projects II", spreadIndex: 3 },
          { label: "Projects III", spreadIndex: 4 },
          { label: "Projects IV", spreadIndex: 5 },
          { label: "Video Playlist", spreadIndex: 7 },
          { label: "Process", spreadIndex: 8 },
          { label: "Contact", spreadIndex: 8 },
        ],
      },
    },
    {
      id: "about",
      left: {
        kind: "text",
        title: "About",
        body:
          "Videographer, editor, and photographer. I especially love multi-camera shoots because they give more freedom in editing and help reveal an event from different angles. I work on my own projects outside of school, experiment with format, and keep growing in production.",
      },
      right: {
        kind: "text",
        title: "Capabilities",
        body: "",
        list: [
          "Video Production",
          "Video operating",
          "Multicamera shooting",
          "Video editing",
          "Photography",
          "Event & portrait photography",
          "Photo editing & color correction",
          "Tools",
          "DaVinci Resolve",
          "Adobe Photoshop",
          "Adobe Illustrator",
          "Adobe Lightroom",
          "OBS Studio",
        ],
      },
    },
    {
      id: "projects-1",
      left: {
        kind: "image",
        src: page5PhotoUrl,
        alt: "Mika original photo",
        caption: "Original",
      },
      right: {
        kind: "image",
        src: page6PhotoUrl,
        alt: "Mika processed photo",
        caption: "Edited",
      },
    },
    {
      id: "projects-2",
      left: { kind: "project", project: projects[1] },
      right: { kind: "project", project: projects[8] },
    },
    {
      id: "projects-3",
      left: {
        kind: "image",
        src: page9PhotoUrl,
        alt: "Mika original photo",
        caption: "Original",
      },
      right: {
        kind: "image",
        src: page10PhotoUrl,
        alt: "Mika edited photo",
        caption: "Edited",
      },
    },
    {
      id: "projects-4",
      left: { kind: "project", project: projects[9] },
      right: { kind: "project", project: projects[10] },
    },
    {
      id: "projects-5",
      left: {
        kind: "image",
        src: page13PhotoUrl,
        alt: "Mika original photo",
        caption: "Original",
      },
      right: {
        kind: "image",
        src: page14PhotoUrl,
        alt: "Mika processed photo",
        caption: "Edited",
      },
    },
    {
      id: "playlist",
      left: {
        kind: "playlist",
        title: "Video Playlist",
        description: "Full YouTube playlist with demos and walkthroughs.",
        playlistId: PLAYLIST_ID,
      },
      right: {
        kind: "contact",
        title: "Contact",
        body: "Available for collaborations, audits, and product UI strategy.",
        links: [          { label: "Phone", href: "tel:+4793950825" },
          { label: "Instagram", href: "https://www.instagram.com/drow_ninginlife?igsh=MW01YWEzcG1uNWZybA%3D%3D&utm_source=qr" },
          { label: "TikTok", href: "https://www.tiktok.com/@_h.yaos_?_r=1&_t=ZS-93nfShsV2hO" },
          { label: "Email", href: "mailto:hello@example.com" },


        ],
      },
    },
    {
      id: "closing",
      left: {
        kind: "text",
        title: "Process",
        body:
          "Workshops, interface mapping, and incremental delivery. Each phase keeps alignment between design intent and real production constraints.",
        list: [
          "Discovery and UI constraints",
          "Structured prototyping",
          "Animation polish and QA",
        ],
      },
      right: {
        kind: "text",
        title: "Playlist Notes",
        body:
          "A focused set of build breakdowns, UI motion studies, and launch demos. The playlist uses a curated, static lineup.",
        list: [
          "Product walkthroughs",
          "Interaction prototypes",
          "Performance and QA notes",
        ],
      },
    },
  ],
};

















