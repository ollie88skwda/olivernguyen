# Emoji Fishbowl Generator — MVP PRD

## Problem
Ollie and one friend build fishbowl-face memes by arranging emojis and text around a base fishbowl emoji. Today this is done in Google Slides — placing items, screenshotting, cropping. Slow, awkward, no consistent output size.

## Goal
A web page at `olivernguyen.com/emoji` that replaces the Slides workflow. Fishbowl emoji locked in center. User adds emojis or text around it, drags them into place, picks a background color, downloads a PNG.

## Users
Ollie + one friend. Private, two-user tool. No auth, no accounts, no sharing infra.

## Reference examples
Source images in `/Users/Ollie/Downloads/drive-download-20260420T070559Z-3-001/`.

| File | What it shows |
|---|---|
| `Attachment(2).jpg` | **Base fishbowl** — clean, no decorations. This is the center image. |
| `Attachment.jpg` | 3× "money with wings" emoji scattered above the face |
| `Attachment(1).jpg` | 2× sparkle emoji scattered (top-right + bottom-left) |
| `IMG_8641.PNG` | 3× the text "67" in varying fonts/sizes/positions |
| `IMG_8652.PNG` | Cheese emoji dragged *onto* the face — two in the eyes, one in the mouth |

Key observations from examples:
- All examples use a **white background**.
- Items render **above** the fishbowl (cheese covers the eye pupils and mouth).
- Initial placement looks random/scattered around the face; specific poses (cheese-in-mouth) require dragging.
- Text items in `IMG_8641` have **different sizes and different fonts** — nice-to-have, not MVP.
- Typical count: 2–3 items per composition.

## Core user flow
1. Land on `/emoji` — fishbowl centered on a square canvas, white background.
2. Type emoji or text into input.
3. Pick a count (1–30, default 3).
4. Click **Add** → that many copies appear scattered around the fishbowl (outside the face).
5. Drag any item anywhere on the canvas. Items can sit on top of the fishbowl (eyes, mouth).
6. Optionally pick a background color preset.
7. Click **Download** → PNG saved.

## MVP requirements

### Must have
- **Fixed center image**: fishbowl always centered, cannot move / resize / delete.
- **Input field**: single text box, accepts emoji or arbitrary text (up to ~20 chars for MVP).
- **Count stepper**: 1–30, default 3.
- **Add button**: spawns N copies at randomized positions in a ring around the fishbowl. Copies do not overlap each other where possible. Each press of Add appends — existing items stay.
- **Drag**: mouse + touch pointer events. Items stay where dropped. Items can overlap each other and the fishbowl.
- **Items render above fishbowl** (z-index wise) so in-eye / in-mouth placements work.
- **Background color presets**: 3 swatches. Click a swatch → canvas background updates live.
  - White `#ffffff` (matches niobium.studio white, default)
  - Black `#131313` (matches niobium.studio black)
  - Chrome purple `#092441` (niobium chrome accent)
- **Download**: PNG export, square aspect, ≥1200×1200. Exported image matches on-screen layout exactly — same item positions, same fishbowl position, same background color.
- **Clear all** button (single tap to reset items; fishbowl and background persist).

### Nice-to-have (post-MVP)
- Delete a single item (click → trash / right-click)
- Resize / rotate per item
- Layer reorder (send front / send back)
- Variable font + size for text items (to recreate the `67` example)
- Custom background color picker beyond the 3 presets
- Undo / redo
- Save / share via URL
- Multiple base templates (not only fishbowl)

### Out of scope for MVP
- Authentication, accounts, saved designs
- Mobile-first polish (desktop-first; touch drag must work but layout optimized for desktop)
- Animations / transitions
- Text styling UI (color, weight, italic)

## Design notes
- **Page shell is WHITE**. The whole app sits on `#ffffff`.
- **Canvas is WHITE** with a 1px `#e5e5e5` border and a soft shadow so it still reads as a distinct surface against the shell. 16px rounded corners.
- **Control bar is BLACK `#131313`**, a single pill floating below the canvas, white text/icons inside.
- **Accent (chrome purple `#092441`)** is the only non-black/white color on the page. Used ONLY on: input focus outline, count-badge tint, active swatch ring.
- Canvas square, dominant on the page (≈80vmin on desktop, fills viewport minus gutters on mobile).
- **Fishbowl takes ~70% of canvas width**, centered. (Revised from original 45%.)
- **Scatter items are small** — ~8–10% of canvas width each. Intentionally smaller than the center emoji so the fishbowl is clearly the hero.
- Default background color preset: white. Matches all reference examples.
- Scatter ring for `Add`: positions chosen in an annulus just outside the fishbowl's visible circle, so items don't start on top of the face. User drags onto the face manually (as in the cheese example).

### Controls — creative reworks
- **No separate "Add" button.** The text input *is* the add affordance. Pressing Return submits.
- Input has a leading "+" circle icon and a trailing "↵" return-hint glyph inside the field.
- **Count is an inline badge inside the input** — `× 3` with a faint chrome-purple tint. Tapping it cycles through presets `1 → 3 → 5 → 10 → 20 → 30 → 1`.
- Swatches: 24×24 circles. Active swatch has a 2px chrome-purple ring with a 2px offset.
- Clear: ghost text button, white, small.
- Download: white-fill pill with black text + download-arrow icon, label "Download". Stands out against the black control bar.

### Known limitation (MVP)
The source fishbowl image (from Ollie's reference) is a JPG with a baked-white background. On the black or chrome-purple background swatch, a circular floodfill is applied at runtime to strip the outside white (preserving the eye-whites). This works for most cases but isn't perfect — post-MVP we should ship a proper transparent PNG.

## Technical notes (for implementer)
- Stack: React 18.3 + CRA (react-scripts 5), react-router-dom v5, Geist font (via `geist` package), Yarn.
- Route: `/emoji` — already cleared in the previous step. Create new component e.g. `src/pages/emoji/index.js`.
- Assets:
  - Copy `Attachment(2).jpg` → `public/fishbowl.png` (convert to PNG for transparent support; confirm alpha channel).
  - If the source has a white background baked in, either matte it for transparency or accept white bg as-is (it matches the MVP default background anyway).
- Download approach: manual `<canvas>` draw.
  - `ctx.drawImage(fishbowl)` first.
  - For each item: `ctx.fillText(item.content, x, y)` for emoji/text, scaled from viewport → export coords.
  - Avoids `html2canvas` font/emoji rendering glitches.
  - Use `canvas.toDataURL('image/png')` → programmatic `<a download>` click.
- Drag: native pointer events (`pointerdown` / `pointermove` / `pointerup`). No dnd library.
- State: component-local `useState`. Item shape: `{ id, content, x, y }` (MVP treats emoji and text identically — same font, same size).

## Open questions
1. Text sizing and font for MVP — fixed single size (e.g. 48px) and system emoji font, yes? The `67` example's varying fonts/sizes is nice-to-have.
2. Scatter distance — how far outside the fishbowl should initial positions be? (Recommend: annulus from 1.0× to 1.3× fishbowl radius from center.)
3. Should `Clear all` also reset the background to default, or only remove items? (Recommend: only items.)
4. Emoji font target — Apple Color Emoji (Mac/iOS only) or also Noto / Segoe for cross-platform exports?

## Success criteria
- Ollie can recreate any of the 4 reference examples end-to-end in under 60 seconds without leaving the page.
- Downloaded PNG is visually indistinguishable from the on-screen preview.
- Works in Chrome + Safari on macOS desktop.
