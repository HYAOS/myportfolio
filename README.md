# portfolio-book

A React + Vite + TypeScript portfolio that behaves like a book: closed 3D cover first, then spread flipping with wheel, buttons, keyboard, and swipe. No heavy flipbook libraries.

## Run

```bash
npm install
npm run dev
```

## Edit content

All content lives in `src/data.ts`.

- `bookData.spreads`: left/right pages for each spread.
- `projects`: project cards reused across pages.

Add or remove spreads to keep 10-14 pages (5-7 spreads). The table of contents uses `spreadIndex` values.

## Add YouTube

In `projects`, set `youtubeId` on a project:

```ts
{
  title: "Signal Studio",
  summary: "Audio timeline editor with collaborative markers.",
  tags: ["TypeScript", "Audio", "UI"],
  youtubeId: "ScMzIvxBSi4",
}
```

The embed renders lazily only for the active spread and its neighbors. A YouTube link is always available.

## FSM + lock

The book uses a two-level state machine in `src/components/Book.tsx`:

- `scene`: `coverClosed` or `bookOpen`
- `turnState`: `idle`, `flippingForward`, `flippingBack`
- `isAnimating`: hard lock for all inputs during open/flip

Flip transaction flow:

1. `isAnimating = true`, set `turnState` and `turningIndex`
2. Add `.is-turning` to the active sheet only
3. Wait for `transitionend` on that sheet (filtered to `transform`)
4. Fallback timeout (1.2x duration)
5. Commit `currentSpread`
6. Render-normalize classes/z-index for all sheets
7. `turnState = idle`, `isAnimating = false`

Cover open uses `transitionend` on the front cover with a fallback timeout.

## Inputs

- Wheel/trackpad: one gesture = one flip (threshold + lock)
- Keyboard: ArrowLeft/ArrowRight + PageUp/PageDown
- Swipe: one swipe = one flip
- Buttons: floating Prev/Next, disabled on bounds

## Theme

- Toggle in the top-right corner
- `prefers-color-scheme` by default
- persisted in `localStorage` key `theme`
- early `data-theme` to avoid FOUC
