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
- No renaming of the existing colour tokens (see §2).
- Not fixing the muted-text contrast the site already had (see §6).

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

## 3. The scenes follow the page, and the wood follows the scene

The stage was first specified as staying dark in both themes, on the grounds that
wood is a mid-tone and loses its contrast on cream. Seen built, a dark band across
a light page was not what the light theme should be, so the stage now follows the
page — and the contrast problem is answered by changing the wood rather than by
keeping the ground dark.

Oak on cream is about 1.6:1, which is the wordmark failure this repo has just
finished fixing, arrived at from the other side. Walnut on cream is about 6:1,
which is roughly the contrast oak had against the near-black. So:

| | dark stage | light stage |
|---|---|---|
| ground | `#14100C` | `#F3ECE1` |
| wood | oak | walnut |
| fill | low — the dark ground swallows spill | higher — cream bounces light back |
| rim | cold blue, to lift wood off the dark | warm and faint; blue on cream reads as a printing error |
| sweep | strong | quiet; on cream it is read from shadow, not from glare |

Both are held in one `STAGE` table in `HeroScene`, and the hero passes the tone
down to the piece field. The two artwork viewers — the hidden-side panel and the
product page's — are transparent canvases over a CSS panel, so they follow the
theme with no scene changes at all.

Nothing declares `data-theme` any more: the page theme is the only theme.

### The header

The header is fixed and transparent until 24px of scroll, at which point it takes
`bg-ink/85`. Since the hero now shares the page's ground, the header's own colours
are correct at every scroll position without special-casing the home page.

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

## 6. Verification, and one thing left open

- Contrast computed by painting each colour into a canvas and reading the pixels
  back, rather than parsing the computed string: Tailwind emits opacity variants
  as `oklab(… / …)`, and a naive parser reads those three numbers as RGB and
  reports confident nonsense.
- Both themes screenshotted on every route at 375px and 1440px.
- Switching theme must not tear down and rebuild a canvas.
- `prefers-reduced-motion` unaffected.

### Muted text is under 4.5:1, in both themes

Measured across all four routes, secondary text set with the low opacity steps —
`text-paper/35`, `/40`, `/45`, `/55` — lands between 2.1:1 and 4.0:1 in the light
theme and between 2.9:1 and 4.0:1 in the dark one. The light theme is therefore
close to parity with what the site already did, not a regression.

It cannot be fixed by choosing better token values: 45% of pure black over this
cream is about 2.5:1, so no `--color-paper` reaches 4.5:1 at that opacity. The fix
is to stop asking for small text at those opacities — roughly 40 call sites moving
from `/45` to about `/70` — which changes the deliberate quietness of the existing
dark design and so is a decision to take on its own, not a side effect of adding a
theme.
