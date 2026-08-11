# Product photography

Drop the cut-out product photos here. Anything under `frontend/public/` is served
as-is at the site root, so a file saved as

    frontend/public/products/mandalas/tree-of-life.png

is reachable in code as `/products/mandalas/tree-of-life.png`. No import, no
rebuild step — Vite picks it up on the next request.

## Folders

One folder per real category:

| Folder | Catalogue category |
|---|---|
| `new/` | New |
| `animals/` | Animals |
| `mandalas/` | Mandalas |
| `quezzle/` | Quezzle |

`All puzzles` and `Bestsellers` deliberately have no folder. All puzzles is every
product regardless of category, and Bestsellers is a flag on a product, not a
place a product lives — giving them folders would mean keeping the same file in
two places and letting the copies drift apart.

## Naming

Lower case, words joined by hyphens, named after the product:

    mandala-tree-of-life.png
    guarding-dragon.png
    magnetic-octopus.png

The name becomes the product's URL slug, so keep it stable once a product is
live.

## Format

What the site loads is **WebP with a transparent background** — the page paints
its own ground behind the photo, in both the light and the dark theme.

Drop the originals as PNG in `frontend/art-source/<folder>/` and convert them
into this folder. The last pass took 38.5 MB of PNG down to 4.8 MB by trimming
the transparent margin, capping the long edge at 1400 px and encoding WebP at
quality 82. `art-source/` is outside `public/`, so the originals never reach the
build.

The margin trim matters for more than file size: the 3D view reads the shape out
of the alpha channel and cuts the puzzle to the artwork's outline, so a picture
that floats inside a wide empty border ends up scaled down against everything
else.
