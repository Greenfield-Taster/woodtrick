# Light theme and theme toggle — design spec

Date: 2026-08-10
Status: approved
Builds on: `2026-08-10-unidragon-redesign-design.md`

## 1. Purpose

The store is dark-first: warm near-black ground, wood as the only product colour,
one accent. This adds a light theme and a control to switch between them, without
giving up what the dark design was built to do.

### Non-goals

- No third theme, no per-section theme picker, no user accounts to sync a choice.
- No relighting of the 3D scenes. They stay dark in both themes (see §3).
- No renaming of the existing colour tokens (see §2).

## 2. Theme as a scope, not a global flag

`--color-ink` and `--color-paper` are already used semantically: `ink` is whatever
the page is standing on, `paper` is whatever reads against it. `bg-paper text-ink`
appears only on active pills and badges — deliberately inverted chips — so it stays
correct when both values flip. There are no large light sections today.

Both palettes are therefore defined as attribute-scoped blocks rather than one
`:root`:

```css
[data-theme='dark']  { --color-ink: #14100C; --color-paper: #F3ECE1; … }
[data-theme='light'] { --color-ink: #F3ECE1; --color-paper: #241C14; … }
```

`<html data-theme>` sets the page, and **any subtree may declare its own theme**.
That is the whole mechanism: no component has to know which theme is on, and the
~220 existing colour utilities are untouched.

### Naming

In the light theme `ink` holds a cream and `paper` holds a near-black, which reads
oddly against the token names. Renaming them to `surface`/`content` would touch
~220 call sites for a demo, so the names stay and the stylesheet states plainly
that `ink` means "the ground" and `paper` means "what reads against it", neither
of which is a claim about darkness.

### Palette

| Token | Dark | Light | Role |
|---|---|---|---|
| `--color-ink` | `#14100C` | `#F3ECE1` | page ground |
| `--color-ink-soft` | `#221B15` | `#E7DCCD` | cards, raised surfaces |
| `--color-ink-line` | `#33291F` | `#DACBB5` | hairline borders |
| `--color-paper` | `#F3ECE1` | `#241C14` | text and figure |
| `--color-paper-soft` | `#E7DCCD` | `#3A2E22` | secondary figure |
| `--color-ember` | `#D8602C` | `#B4491C` | sole accent |
| `--color-quiet` | `#E0C398` (birch) | `#7A4E28` (walnut) | eyebrow labels |

`birch`, `oak`, `walnut` and `moss` keep their values in both themes: they are
material colours, not interface colours.

## 3. The scenes stay dark

The three WebGL surfaces keep their warm near-black stage in both themes. Wood is
a mid-tone; on cream it loses the contrast the wordmark fix just bought, and
relighting three scenes is a larger job than the theme itself.

On a light page these become dark bands, which is a display case rather than an
accident. The sections carrying them declare `data-theme="dark"` so everything
inside — copy, buttons, the fade into the copy — follows the stage rather than the
page:

- the hero section,
- the hidden-side section,
- the 3D viewer panel on the product page (the rest of that page follows the page
  theme).

**Accepted consequence:** the hero fills the viewport, so on the home page the
light theme only becomes visible once the visitor scrolls.

### The header

The header is fixed and transparent until 24px of scroll, at which point it takes
`bg-ink/85`. On the home page at rest it therefore overlays the dark hero and must
keep light lettering; everywhere else it overlays the page ground. It declares
`data-theme="dark"` exactly when `!lifted && pathname === '/'`, and otherwise
inherits.

## 4. Accent contrast

`#D8602C` on cream is 3.3:1 — short of 4.5:1 for prices and small labels — so the
accent darkens to `#B4491C` in the light theme, keeping its role.

This makes `bg-ember` with `text-ink` correct in both themes without a dedicated
"text on accent" token, because `ink` flips too: near-black on `#D8602C` is ~7:1,
cream on `#B4491C` is ~5.5:1.

The `eyebrow` utility currently tints `birch` at 70%, which would vanish on cream;
it moves to `--color-quiet`, which is birch in the dark theme and walnut in the
light one.

The `grain` overlay uses `mix-blend-mode: overlay`, which reads as dirt on cream.
In the light theme it becomes `multiply` at a lower opacity, so it reads as the
tooth of paper.

## 5. Choosing, remembering, and not flashing

- First visit follows `prefers-color-scheme`, and keeps following it live while the
  visitor has never chosen.
- Choosing pins the theme to `localStorage` under `unidragon-theme`, after which
  the system preference no longer applies.
- A blocking inline script in `index.html` sets `data-theme` and `color-scheme` on
  the document element before first paint, so no visitor sees the wrong theme
  flash.
- State lives in a small zustand store beside the cart, because the header and the
  mobile menu both read and write it.

### The control

Mirrors the existing currency control exactly: two buttons in a rounded, bordered
pill, the active one taking `bg-paper text-ink`. Sun and moon glyphs with
accessible labels. It sits next to the currency toggle in the header on desktop,
and beside currency in the mobile menu on a phone.

## 6. Verification

- Contrast computed with a script, not judged by eye, over the pairs that actually
  carry the risk: muted text (`text-paper/40`, `/45`, `/55` — 40+ uses between
  them), `ink-line` borders, and the accent on both grounds.
- Both themes screenshotted on every route at 375px and 1440px.
- Switching theme must not tear down and rebuild a canvas.
- `prefers-reduced-motion` unaffected.
